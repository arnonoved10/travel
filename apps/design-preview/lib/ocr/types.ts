export interface OcrExtractedField {
  fieldName: string;
  extractedValue: string | null;
  confidenceScore: number | null;
}

export interface OcrExtractionResult {
  ok: boolean;
  /** מוצג למשתמש כשה-OCR נכשל (לדוגמה: PDF לא נתמך בספק המקומי) — לא ממציא תוצאה. */
  error?: string;
  fields: OcrExtractedField[];
}

/** ספק-OCR — מומש היום ע"י שני מימושים אמיתיים (Tesseract מקומי, Claude
 * חכם), אף אחד מהם לא ממציא ערך: כשל אמיתי מוחזר כ-ok:false, לא כרשימה
 * ריקה שקטה. `imageBase64` הוא תוכן הקובץ בלבד (בלי ה-"data:...;base64," prefix). */
export interface OcrProvider {
  readonly name: string;
  extractFields(params: { imageBase64: string; mimeType: string }): Promise<OcrExtractionResult>;
}
