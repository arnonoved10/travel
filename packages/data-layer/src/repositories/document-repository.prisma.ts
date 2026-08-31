// Storage אמיתי (Supabase Storage, bucket "documents" פרטי) מחובר — ר'
// storage/document-storage.ts. ה-DB column "fileUrl" כאן שומר בפועל נתיב-
// Storage פנימי (למשל "flight/<id>/<uuid>-receipt.jpg"), לא URL שמיש —
// toDocument() ממיר אותו לנתיב-proxy יציב (/api/documents/[id]/file) שדורש
// אימות-בעלות ורק אז יוצר קישור-חתום זמני, ר' ההערה ב-document-repository.ts.
import { PrismaClient } from "@travel-app/db";
import type { CreateDocumentInput, Document, DocumentExtractedField, ExtractedFieldItemInput, OcrStatus } from "@travel-app/shared-types";
import { createDocumentInputSchema } from "@travel-app/shared-types";
import { DocumentNotFoundError, type DocumentRepository } from "./document-repository";
import { createSignedDocumentUrl, downloadDocumentFromStorage, uploadDocumentToStorage } from "../storage/document-storage";

export class ExtractedFieldNotFoundError extends Error {
  constructor(fieldId: string) {
    super(`DocumentExtractedField ${fieldId} not found`);
    this.name = "ExtractedFieldNotFoundError";
  }
}

function toExtractedField(row: {
  id: string;
  documentId: string;
  fieldName: string;
  extractedValue: string | null;
  confidenceScore: number | null;
  dataSource: string;
  isConfirmed: boolean;
  confirmedValue: string | null;
  confirmedAt: Date | null;
}): DocumentExtractedField {
  return {
    id: row.id,
    documentId: row.documentId,
    fieldName: row.fieldName,
    extractedValue: row.extractedValue,
    confidenceScore: row.confidenceScore,
    dataSource: row.dataSource as DocumentExtractedField["dataSource"],
    isConfirmed: row.isConfirmed,
    confirmedValue: row.confirmedValue,
    confirmedAt: row.confirmedAt ? row.confirmedAt.toISOString() : null,
  };
}

function toDocument(row: {
  id: string;
  tripId: string | null;
  entityType: string;
  entityId: string;
  documentType: string;
  fileUrl: string;
  fileName: string | null;
  mimeType: string | null;
  uploadedAt: Date;
  ocrStatus: string;
  notes: string | null;
  deletedAt: Date | null;
}): Document {
  return {
    id: row.id,
    tripId: row.tripId,
    entityType: row.entityType as Document["entityType"],
    entityId: row.entityId,
    documentType: row.documentType as Document["documentType"],
    // row.fileUrl הוא נתיב-Storage פנימי, לא URL שמיש — הצפייה תמיד עוברת דרך
    // ה-proxy route המאומת. ר' ההערה בראש הקובץ.
    fileUrl: `/api/documents/${row.id}/file`,
    fileName: row.fileName,
    mimeType: row.mimeType,
    uploadedAt: row.uploadedAt.toISOString(),
    ocrStatus: row.ocrStatus as Document["ocrStatus"],
    notes: row.notes,
    deletedAt: row.deletedAt ? row.deletedAt.toISOString() : null,
  };
}

export class PrismaDocumentRepository implements DocumentRepository {
  constructor(private readonly prisma: PrismaClient) {}

  async listForEntity({
    tripId,
    entityType,
    entityId,
  }: {
    tripId?: string;
    entityType: string;
    entityId: string;
  }): Promise<Document[]> {
    const rows = await this.prisma.document.findMany({
      where: { ...(tripId !== undefined ? { tripId } : {}), entityType: entityType as never, entityId, deletedAt: null },
      orderBy: { uploadedAt: "desc" },
    });
    return rows.map(toDocument);
  }

  async listForEntities({ entityType, entityIds }: { entityType: string; entityIds: string[] }): Promise<Document[]> {
    if (entityIds.length === 0) return [];
    const rows = await this.prisma.document.findMany({
      where: { entityType: entityType as never, entityId: { in: entityIds }, deletedAt: null },
      orderBy: { uploadedAt: "desc" },
    });
    return rows.map(toDocument);
  }

  async listForTrip({ tripId, includeDeleted = false }: { tripId: string; includeDeleted?: boolean }): Promise<Document[]> {
    const rows = await this.prisma.document.findMany({
      where: { tripId, ...(includeDeleted ? {} : { deletedAt: null }) },
      orderBy: { uploadedAt: "desc" },
    });
    return rows.map(toDocument);
  }

  async getById({ documentId }: { documentId: string }): Promise<Document | null> {
    const row = await this.prisma.document.findUnique({ where: { id: documentId } });
    return row ? toDocument(row) : null;
  }

  async create({ input }: { input: CreateDocumentInput }): Promise<Document> {
    const parsed = createDocumentInputSchema.parse(input);
    // parsed.fileUrl הוא data: URI (base64) שנבנה כבר ע"י הקורא (uploadDocumentAction/
    // api/share-target route) — מועלה כאן ל-Storage האמיתי, ורק הנתיב הפנימי נשמר ב-DB.
    const storagePath = await uploadDocumentToStorage({
      dataUri: parsed.fileUrl,
      entityType: parsed.entityType,
      entityId: parsed.entityId,
      fileName: parsed.fileName,
    });
    const row = await this.prisma.document.create({
      data: {
        tripId: parsed.tripId,
        entityType: parsed.entityType,
        entityId: parsed.entityId,
        documentType: parsed.documentType,
        fileUrl: storagePath,
        fileName: parsed.fileName,
        mimeType: parsed.mimeType,
        notes: parsed.notes,
      },
    });
    return toDocument(row);
  }

  async getFileBase64({ documentId }: { documentId: string }): Promise<{ base64: string; mimeType: string } | null> {
    const row = await this.prisma.document.findUnique({ where: { id: documentId } });
    if (!row) return null;
    const bytes = await downloadDocumentFromStorage(row.fileUrl);
    return { base64: bytes.toString("base64"), mimeType: row.mimeType ?? "application/octet-stream" };
  }

  async getSignedFileUrl({ documentId }: { documentId: string }): Promise<string | null> {
    const row = await this.prisma.document.findUnique({ where: { id: documentId } });
    if (!row) return null;
    return createSignedDocumentUrl(row.fileUrl);
  }

  async softDelete({ documentId }: { documentId: string }): Promise<Document> {
    const existing = await this.prisma.document.findUnique({ where: { id: documentId } });
    if (!existing) throw new DocumentNotFoundError(documentId);

    const row = await this.prisma.document.update({ where: { id: documentId }, data: { deletedAt: new Date() } });
    return toDocument(row);
  }

  async restore({ documentId }: { documentId: string }): Promise<Document> {
    const existing = await this.prisma.document.findUnique({ where: { id: documentId } });
    if (!existing) throw new DocumentNotFoundError(documentId);

    const row = await this.prisma.document.update({ where: { id: documentId }, data: { deletedAt: null } });
    return toDocument(row);
  }

  async updateOcrStatus({ documentId, ocrStatus }: { documentId: string; ocrStatus: OcrStatus }): Promise<Document> {
    const row = await this.prisma.document.update({ where: { id: documentId }, data: { ocrStatus } });
    return toDocument(row);
  }

  async listExtractedFields({ documentId }: { documentId: string }): Promise<DocumentExtractedField[]> {
    const rows = await this.prisma.documentExtractedField.findMany({ where: { documentId } });
    return rows.map(toExtractedField);
  }

  async listExtractedFieldsForDocumentIds({ documentIds }: { documentIds: string[] }): Promise<DocumentExtractedField[]> {
    if (documentIds.length === 0) return [];
    const rows = await this.prisma.documentExtractedField.findMany({ where: { documentId: { in: documentIds } } });
    return rows.map(toExtractedField);
  }

  async replaceExtractedFields({
    documentId,
    fields,
  }: {
    documentId: string;
    fields: ExtractedFieldItemInput[];
  }): Promise<DocumentExtractedField[]> {
    await this.prisma.documentExtractedField.deleteMany({ where: { documentId } });
    if (fields.length === 0) return [];

    await this.prisma.documentExtractedField.createMany({
      data: fields.map((field) => ({
        documentId,
        fieldName: field.fieldName,
        extractedValue: field.extractedValue,
        confidenceScore: field.confidenceScore,
        dataSource: "ocr",
      })),
    });

    const rows = await this.prisma.documentExtractedField.findMany({ where: { documentId } });
    return rows.map(toExtractedField);
  }

  async confirmExtractedField({ fieldId, confirmedValue }: { fieldId: string; confirmedValue: string }): Promise<DocumentExtractedField> {
    const existing = await this.prisma.documentExtractedField.findUnique({ where: { id: fieldId } });
    if (!existing) throw new ExtractedFieldNotFoundError(fieldId);

    const row = await this.prisma.documentExtractedField.update({
      where: { id: fieldId },
      data: { isConfirmed: true, confirmedValue, confirmedAt: new Date() },
    });
    return toExtractedField(row);
  }
}
