import type { CreateDocumentInput, Document, DocumentExtractedField, ExtractedFieldItemInput, OcrStatus } from "@travel-app/shared-types";

/**
 * Documents דורש Supabase Storage אמיתי כדי לעבוד בפרודקשן — ר' storage/document-storage.ts.
 * ב-Mock, fileUrl הוא data: URI (הקובץ האמיתי מקודד base64 ונשמר בזיכרון) —
 * לא כתובת מזויפת, הקובץ באמת שם וניתן להוריד/להציג אותו, רק לא ב-Cloud
 * Storage אמיתי. ב-Prisma, fileUrl שמוחזר מ-list/getById הוא נתיב-proxy
 * (/api/documents/[id]/file) שמאמת בעלות ואז יוצר קישור-חתום זמני —
 * ה-fileUrl עצמו לעולם לא URL-ציבורי-קבוע לקובץ, ר' getFileBase64/getSignedFileUrl.
 */
export interface DocumentRepository {
  /** tripId אופציונלי — מקומות (entityType="place") הם ישות גלובלית בלי tripId. */
  listForEntity(params: { tripId?: string; entityType: string; entityId: string }): Promise<Document[]>;
  /** גרסה מקובצת של listForEntity לאותו entityType — שאילתה אחת ל-N ישויות. */
  listForEntities(params: { entityType: string; entityIds: string[] }): Promise<Document[]>;
  listForTrip(params: { tripId: string; includeDeleted?: boolean }): Promise<Document[]>;
  getById(params: { documentId: string }): Promise<Document | null>;
  create(params: { input: CreateDocumentInput }): Promise<Document>;
  softDelete(params: { documentId: string }): Promise<Document>;
  restore(params: { documentId: string }): Promise<Document>;

  /** בייטים גולמיים (base64) לצריכה שרתית (OCR) — לא ל-URL בדפדפן. Mock: מפענח
   * את ה-data: URI השמור ישירות. Prisma: מוריד את הקובץ מ-Storage בפועל. */
  getFileBase64(params: { documentId: string }): Promise<{ base64: string; mimeType: string } | null>;
  /** קישור-צפייה זמני לדפדפן — נקרא רק מה-proxy route המאומת, לעולם לא נחשף
   * ישירות כ-Document.fileUrl. Mock: מחזיר את ה-fileUrl הקיים (כבר תקין, בלי signing). */
  getSignedFileUrl(params: { documentId: string }): Promise<string | null>;

  updateOcrStatus(params: { documentId: string; ocrStatus: OcrStatus }): Promise<Document>;
  listExtractedFields(params: { documentId: string }): Promise<DocumentExtractedField[]>;
  /** גרסה מקובצת של listExtractedFields — שאילתה אחת ל-N מסמכים. */
  listExtractedFieldsForDocumentIds(params: { documentIds: string[] }): Promise<DocumentExtractedField[]>;
  /** מחליף את כל השדות הקיימים למסמך הזה — כל הרצה מחדש של OCR היא תוצאה טרייה, לא הצטברות. */
  replaceExtractedFields(params: { documentId: string; fields: ExtractedFieldItemInput[] }): Promise<DocumentExtractedField[]>;
  confirmExtractedField(params: { fieldId: string; confirmedValue: string }): Promise<DocumentExtractedField>;
}

export class DocumentNotFoundError extends Error {
  constructor(documentId: string) {
    super(`Document ${documentId} not found`);
    this.name = "DocumentNotFoundError";
  }
}
