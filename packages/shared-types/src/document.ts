import { z } from "zod";
import { dataSourceSchema, documentEntityTypeSchema, documentTypeSchema, ocrStatusSchema } from "./enums";

export const documentSchema = z.object({
  id: z.uuid(),
  // null כש-entityType="place" — Place הוא ישות גלובלית, לא שייכת לטיול
  // ספציפי (ר' place-repository.ts). כל שאר סוגי הישות תמיד עם tripId.
  tripId: z.uuid().nullable(),
  entityType: documentEntityTypeSchema,
  entityId: z.uuid(),
  documentType: documentTypeSchema,
  // data: URI במצב Mock (הקובץ עצמו, לא כתובת מזויפת) או כתובת Storage אמיתית
  // במצב Prisma — ראה ההערה ב-document-repository.ts.
  fileUrl: z.url(),
  fileName: z.string().nullable(),
  mimeType: z.string().nullable(),
  uploadedAt: z.iso.datetime(),
  // מעודכן על-ידי runOcrAction (ocr-actions.ts) — ר' document-extracted-field
  // למטה לתוצאה בפועל. pending כברירת מחדל עד שהמשתמש מריץ קריאה.
  ocrStatus: ocrStatusSchema,
  notes: z.string().nullable(),
  deletedAt: z.iso.datetime().nullable(),
});
export type Document = z.infer<typeof documentSchema>;

export const createDocumentInputSchema = z.object({
  tripId: z.uuid().optional(),
  entityType: documentEntityTypeSchema,
  entityId: z.uuid(),
  documentType: documentTypeSchema,
  fileUrl: z.url("קישור לקובץ לא תקין"),
  fileName: z.string().optional(),
  mimeType: z.string().optional(),
  notes: z.string().optional(),
});
export type CreateDocumentInput = z.infer<typeof createDocumentInputSchema>;

// שדה בודד שחולץ ממסמך (תאריך/מספר-אישור/סכום/וכו') — key/value פתוח, לא
// סכימה קבועה פר-סוג-מסמך, כדי שאותו מנגנון יעבוד לכל DocumentType. כל שדה
// עובר אישור-אנושי מפורש (isConfirmed) לפני שהוא נחשב אמין — OCR לעולם לא
// ממלא שדה בטופס אמיתי בלי אישור המשתמש.
export const documentExtractedFieldSchema = z.object({
  id: z.uuid(),
  documentId: z.uuid(),
  fieldName: z.string(),
  extractedValue: z.string().nullable(),
  confidenceScore: z.number().min(0).max(1).nullable(),
  dataSource: dataSourceSchema,
  isConfirmed: z.boolean(),
  confirmedValue: z.string().nullable(),
  confirmedAt: z.iso.datetime().nullable(),
});
export type DocumentExtractedField = z.infer<typeof documentExtractedFieldSchema>;

export const extractedFieldItemInputSchema = z.object({
  fieldName: z.string().min(1),
  extractedValue: z.string().nullable(),
  confidenceScore: z.number().min(0).max(1).nullable(),
});
export type ExtractedFieldItemInput = z.infer<typeof extractedFieldItemInputSchema>;
