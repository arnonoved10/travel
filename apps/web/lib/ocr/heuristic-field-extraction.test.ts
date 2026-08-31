import { describe, expect, it } from "vitest";
import { extractFieldsHeuristically } from "./heuristic-field-extraction";

describe("extractFieldsHeuristically", () => {
  it("extracts a date, confirmation number, and amount from a typical confirmation email", () => {
    const text = `Booking Confirmation\nConfirmation Number: ABC12345\nCheck-in: 2026-08-23\nTotal: USD 450.00\nContact: booking@hotel.example`;
    const fields = extractFieldsHeuristically(text, 0.9);

    const byName = Object.fromEntries(fields.map((f) => [f.fieldName, f.extractedValue]));
    expect(byName.date).toBe("2026-08-23");
    expect(byName.confirmation_number).toBe("ABC12345");
    expect(byName.amount).toContain("450.00");
    expect(byName.email).toBe("booking@hotel.example");
  });

  it("caps field confidence well below the OCR confidence — heuristic guesses are never treated as certain", () => {
    const fields = extractFieldsHeuristically("Total: USD 100.00", 1);
    expect(fields.every((f) => f.confidenceScore !== null && f.confidenceScore <= 0.6)).toBe(true);
  });

  it("returns no fields for text with no recognizable structured data", () => {
    const fields = extractFieldsHeuristically("hello world this is just plain text", 0.8);
    expect(fields).toHaveLength(0);
  });

  it("numbers multiple matches of the same field type instead of overwriting them", () => {
    const fields = extractFieldsHeuristically("Check-in: 2026-08-23 Check-out: 2026-08-30", 0.8);
    const dateFields = fields.filter((f) => f.fieldName.startsWith("date"));
    expect(dateFields.map((f) => f.fieldName)).toEqual(["date_1", "date_2"]);
  });
});
