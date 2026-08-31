import type { OcrExtractedField } from "./types";

const DATE_PATTERNS = [
  /\b\d{4}-\d{2}-\d{2}\b/g, // 2026-08-23
  /\b\d{1,2}\/\d{1,2}\/\d{2,4}\b/g, // 23/08/2026
  /\b\d{1,2}\s+(Jan|Feb|Mar|Apr|May|Jun|Jul|Aug|Sep|Oct|Nov|Dec)[a-z]*\s+\d{4}\b/gi, // 23 Aug 2026
];

// דורש לפחות ספרה אחת בתוך הערך (lookahead) — בלי זה "Booking Confirmation"
// (כותרת-מייל טיפוסית) היה נתפס בטעות כאילו "Confirmation" עצמה היא מספר-האישור.
const CONFIRMATION_PATTERN =
  /(?:confirmation|booking|reference|ref|voucher|pnr|אישור|הזמנה)\s*(?:number|no|#|:|מספר)?\s*[:#]?\s*((?=[A-Z0-9-]*\d)[A-Z0-9][A-Z0-9-]{3,14})/gi;

const AMOUNT_PATTERN = /(₪|\$|€|£|USD|EUR|ILS|GBP|THB)\s?([\d][\d,]*\.?\d*)|([\d][\d,]*\.?\d*)\s?(USD|EUR|ILS|GBP|THB|₪|\$|€|£)/g;

const EMAIL_PATTERN = /[\w.+-]+@[\w-]+\.[\w.-]+/g;

const PHONE_PATTERN = /(?:\+?\d[\d\s-]{7,14}\d)/g;

/** `group` — 0 לכל ההתאמה, 1+ ללכידת-משנה ספציפית (למשל הערך בלי מילת-המפתח שקדמה לו). */
function collectUnique(pattern: RegExp, text: string, max: number, group = 0): string[] {
  const matches = new Set<string>();
  for (const match of text.matchAll(pattern)) {
    const value = match[group]?.trim();
    if (value) matches.add(value);
    if (matches.size >= max) break;
  }
  return Array.from(matches);
}

function toFields(fieldName: string, values: string[], confidence: number): OcrExtractedField[] {
  return values.map((value, index) => ({
    fieldName: values.length > 1 ? `${fieldName}_${index + 1}` : fieldName,
    extractedValue: value,
    confidenceScore: confidence,
  }));
}

/**
 * חילוץ-שדות היוריסטי (regex) מעל טקסט-גולמי ש-Tesseract כבר זיהה — לא AI,
 * לא "מבין הקשר". confidenceScore נמוך במכוון (לכל היותר 0.6, מוכפל בביטחון
 * הזיהוי הכללי של Tesseract) כי זה ניחוש-דפוס, לא הבנה — המסמך תמיד עובר
 * "needs_confirmation", לעולם לא "confirmed" אוטומטית.
 */
export function extractFieldsHeuristically(rawText: string, ocrConfidence0to1: number): OcrExtractedField[] {
  const fieldConfidence = Math.min(0.6, Math.max(0.15, ocrConfidence0to1 * 0.7));

  const dates = new Set<string>();
  for (const pattern of DATE_PATTERNS) for (const v of collectUnique(pattern, rawText, 3)) dates.add(v);

  const confirmations = collectUnique(CONFIRMATION_PATTERN, rawText, 2, 1);

  const amounts = collectUnique(AMOUNT_PATTERN, rawText, 3);
  const emails = collectUnique(EMAIL_PATTERN, rawText, 1);
  const phones = collectUnique(PHONE_PATTERN, rawText, 2);

  return [
    ...toFields("date", Array.from(dates).slice(0, 3), fieldConfidence),
    ...toFields("confirmation_number", confirmations, fieldConfidence),
    ...toFields("amount", amounts, fieldConfidence),
    ...toFields("email", emails, fieldConfidence),
    ...toFields("phone", phones, fieldConfidence),
  ];
}
