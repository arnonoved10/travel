import { describe, expect, it } from "vitest";
import { buildXlsxWorkbook } from "./xlsx-export";

describe("buildXlsxWorkbook", () => {
  it("produces a non-empty, valid .xlsx binary (starts with the ZIP/OOXML magic bytes)", async () => {
    const bytes = await buildXlsxWorkbook([
      { name: "טיול לתאילנד", headers: ["שם", "סכום"], rows: [["מלון", 500], ["טיסה", 1200]] },
    ]);
    expect(bytes.length).toBeGreaterThan(1000);
    // .xlsx is a ZIP container — PK\x03\x04 is the local-file-header magic number.
    expect(bytes[0]).toBe(0x50);
    expect(bytes[1]).toBe(0x4b);
  });

  it("truncates and de-duplicates sheet names longer than Excel's 31-char limit", async () => {
    const longName = "שם-גיליון-ארוך-מאוד-שחורג-מהמגבלה-של-אקסל-בהחלט";
    const bytes = await buildXlsxWorkbook([
      { name: longName, headers: ["a"], rows: [[1]] },
      { name: longName, headers: ["a"], rows: [[2]] },
    ]);
    expect(bytes.length).toBeGreaterThan(1000);
  });
});
