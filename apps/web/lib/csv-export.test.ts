import { describe, expect, it } from "vitest";
import { buildCsv } from "./csv-export";

describe("buildCsv", () => {
  it("builds a header row and data rows joined by commas", () => {
    const csv = buildCsv(["שם", "סכום"], [["קפה", 15]]);
    expect(csv).toContain("שם,סכום");
    expect(csv).toContain("קפה,15");
  });

  it("starts with a UTF-8 BOM so Excel reads Hebrew correctly", () => {
    const csv = buildCsv(["a"], [["b"]]);
    expect(csv.charCodeAt(0)).toBe(0xfeff);
  });

  it("quotes and escapes a cell containing a comma", () => {
    const csv = buildCsv(["תיאור"], [["ארוחה, כולל טיפ"]]);
    expect(csv).toContain('"ארוחה, כולל טיפ"');
  });

  it("escapes embedded double quotes by doubling them", () => {
    const csv = buildCsv(["תיאור"], [['אמר "שלום"']]);
    expect(csv).toContain('"אמר ""שלום"""');
  });

  it("renders null/undefined cells as empty strings, not the literal word", () => {
    const csv = buildCsv(["הערה"], [[null], [undefined]]);
    expect(csv).not.toContain("null");
    expect(csv).not.toContain("undefined");
  });
});
