import os from "node:os";
import path from "node:path";
import { createWorker } from "tesseract.js";
import type { OcrExtractionResult, OcrProvider } from "./types";
import { extractFieldsHeuristically } from "./heuristic-field-extraction";

// os.tmpdir() (לא process.cwd()) — ב-Vercel Serverless Functions תיקיית
// הפריסה עצמה read-only, רק /tmp כתיב; זהה מקומית ל-%TEMP%/tmp רגיל, בלי
// לתעד קבצי-שפה שמורדים בתוך עץ-הפרויקט.
const CACHE_PATH = path.join(os.tmpdir(), "design-preview-tesseract-cache");

/**
 * OCR מקומי חינמי — בלי מפתח, בלי חיבור לשירות בתשלום, פועל תמיד (ר' AskUserQuestion
 * שבו המשתמש ביקש גם את זה וגם את Claude — ר' get-ocr-provider.ts). מריץ Tesseract.js
 * בצד-שרת (Node), לא בדפדפן, כדי לא לנפח את ה-bundle של הלקוח.
 *
 * הערה חשובה: בהרצה הראשונה בלבד, Tesseract.js מוריד את קובצי נתוני-השפה
 * (eng/heb.traineddata) מ-CDN ציבורי וחינמי (jsdelivr) לקאש מקומי — אחרי זה
 * לא נדרשת שום רשת. זו לא קריאת-API בתשלום ולא דורשת מפתח, בדיוק כמו
 * שהתקנת npm דורשת רשת פעם אחת. אין תמיכה ב-PDF (Tesseract.js קורא תמונות
 * בלבד) — מוחזר ok:false עם הסבר ברור, לא ניחוש.
 */
export class TesseractOcrProvider implements OcrProvider {
  readonly name = "tesseract-local";

  async extractFields({ imageBase64, mimeType }: { imageBase64: string; mimeType: string }): Promise<OcrExtractionResult> {
    if (mimeType === "application/pdf") {
      return { ok: false, error: "OCR מקומי תומך בתמונות בלבד, לא PDF. אפשר לצלם מסך של הקובץ ולהעלות כתמונה, או להשתמש ב-OCR עם Claude API אם מוגדר.", fields: [] };
    }
    if (!mimeType.startsWith("image/")) {
      return { ok: false, error: `סוג קובץ לא נתמך ל-OCR מקומי: ${mimeType}`, fields: [] };
    }

    const buffer = Buffer.from(imageBase64, "base64");
    const worker = await createWorker(["eng", "heb"], undefined, { cachePath: CACHE_PATH });
    try {
      const { data } = await worker.recognize(buffer);
      const rawText = data.text?.trim() ?? "";
      if (!rawText) {
        return { ok: false, error: "לא זוהה טקסט קריא בתמונה.", fields: [] };
      }

      const confidence0to1 = typeof data.confidence === "number" ? Math.max(0, Math.min(1, data.confidence / 100)) : 0.3;
      return { ok: true, fields: extractFieldsHeuristically(rawText, confidence0to1) };
    } finally {
      await worker.terminate();
    }
  }
}

export const tesseractOcrProvider = new TesseractOcrProvider();
