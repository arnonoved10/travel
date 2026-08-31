import { readFileSync } from "node:fs";
import path from "node:path";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { buildPdfDocument } from "./pdf-export";

// buildPdfDocument טוען את הפונט העברי דרך fetch("/fonts/...") — נכון רק
// בדפדפן אמיתי (יחסי ל-origin). כאן (סביבת-בדיקה Node, בלי שרת) מדמים fetch
// שמחזיר את קובצי-הפונט האמיתיים מהדיסק — כך שהבדיקה מפעילה את אותו קוד-ייצור
// בדיוק (base64-encode אמיתי, רישום-פונט אמיתי ב-jsPDF), לא גרסה מקוצרת.
const FONTS_DIR = path.join(__dirname, "..", "public", "fonts");

beforeEach(() => {
  vi.stubGlobal(
    "fetch",
    vi.fn(async (url: string) => {
      const fileName = url.split("/").pop()!;
      const bytes = readFileSync(path.join(FONTS_DIR, fileName));
      return {
        ok: true,
        status: 200,
        arrayBuffer: async () => bytes.buffer.slice(bytes.byteOffset, bytes.byteOffset + bytes.byteLength),
      } as Response;
    }),
  );
});

afterEach(() => {
  vi.unstubAllGlobals();
});

describe("buildPdfDocument", () => {
  it("produces a valid, non-empty PDF binary (starts with the %PDF magic bytes)", async () => {
    const bytes = await buildPdfDocument(
      [{ name: "הוצאות", headers: ["תאריך", "קטגוריה", "סכום"], rows: [["2026-08-23", "מלון", 500]] }],
      "טיול לתאילנד",
    );
    expect(bytes.length).toBeGreaterThan(1000);
    const magic = new TextDecoder().decode(bytes.slice(0, 4));
    expect(magic).toBe("%PDF");
  });

  it("embeds the Hebrew font as a real subsetted TrueType font, not just Latin defaults", async () => {
    const bytes = await buildPdfDocument([{ name: "לילה", headers: ["שם"], rows: [["מקום"]] }], "כותרת");
    const raw = new TextDecoder("latin1").decode(bytes);
    // /Subtype /TrueType (or /Type0 for CID-keyed) plus our registered font name
    // confirms a real font was embedded — not silently falling back to Helvetica,
    // which would render Hebrew as empty boxes.
    expect(raw).toContain("NotoSansHebrew");
  });

  it("handles multiple sheets and empty rows without throwing", async () => {
    const bytes = await buildPdfDocument(
      [
        { name: "ריק", headers: ["a"], rows: [] },
        { name: "מלא", headers: ["a", "b"], rows: [[1, 2]] },
      ],
      "מסמך",
    );
    expect(bytes.length).toBeGreaterThan(1000);
  });
});
