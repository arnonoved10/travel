import { describe, expect, it } from "vitest";
import { createTripInputSchema } from "./trip";

describe("createTripInputSchema", () => {
  it("accepts a valid trip", () => {
    const result = createTripInputSchema.safeParse({
      name: "טיול לתאילנד",
      startDate: "2026-12-01",
      endDate: "2026-12-15",
      baseCurrencyCode: "THB",
    });

    expect(result.success).toBe(true);
  });

  it("rejects an empty name", () => {
    const result = createTripInputSchema.safeParse({
      name: "",
      startDate: "2026-12-01",
      endDate: "2026-12-15",
    });

    expect(result.success).toBe(false);
  });

  it("rejects end date before start date", () => {
    const result = createTripInputSchema.safeParse({
      name: "טיול לתאילנד",
      startDate: "2026-12-15",
      endDate: "2026-12-01",
    });

    expect(result.success).toBe(false);
    if (!result.success) {
      expect(result.error.issues[0]?.path).toContain("endDate");
    }
  });

  it("rejects a currency code that is not 3 letters", () => {
    const result = createTripInputSchema.safeParse({
      name: "טיול לתאילנד",
      startDate: "2026-12-01",
      endDate: "2026-12-15",
      baseCurrencyCode: "THAI",
    });

    expect(result.success).toBe(false);
  });
});
