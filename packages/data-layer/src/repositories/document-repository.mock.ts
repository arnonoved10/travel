import { randomUUID } from "node:crypto";
import type { CreateDocumentInput, Document, DocumentExtractedField, ExtractedFieldItemInput, OcrStatus } from "@travel-app/shared-types";
import { createDocumentInputSchema } from "@travel-app/shared-types";
import { DocumentNotFoundError, type DocumentRepository } from "./document-repository";

export class ExtractedFieldNotFoundError extends Error {
  constructor(fieldId: string) {
    super(`DocumentExtractedField ${fieldId} not found`);
    this.name = "ExtractedFieldNotFoundError";
  }
}

export class MockDocumentRepository implements DocumentRepository {
  private documents = new Map<string, Document>();
  private extractedFields = new Map<string, DocumentExtractedField>();

  async listForEntity({
    tripId,
    entityType,
    entityId,
  }: {
    tripId?: string;
    entityType: string;
    entityId: string;
  }): Promise<Document[]> {
    return Array.from(this.documents.values())
      .filter((d) => (tripId === undefined || d.tripId === tripId) && d.entityType === entityType && d.entityId === entityId && d.deletedAt === null)
      .sort((a, b) => b.uploadedAt.localeCompare(a.uploadedAt));
  }

  async listForEntities({ entityType, entityIds }: { entityType: string; entityIds: string[] }): Promise<Document[]> {
    const idSet = new Set(entityIds);
    return Array.from(this.documents.values())
      .filter((d) => d.entityType === entityType && idSet.has(d.entityId) && d.deletedAt === null)
      .sort((a, b) => b.uploadedAt.localeCompare(a.uploadedAt));
  }

  async listForTrip({ tripId, includeDeleted = false }: { tripId: string; includeDeleted?: boolean }): Promise<Document[]> {
    return Array.from(this.documents.values())
      .filter((d) => d.tripId === tripId && (includeDeleted || d.deletedAt === null))
      .sort((a, b) => b.uploadedAt.localeCompare(a.uploadedAt));
  }

  async getById({ documentId }: { documentId: string }): Promise<Document | null> {
    return this.documents.get(documentId) ?? null;
  }

  async getFileBase64({ documentId }: { documentId: string }): Promise<{ base64: string; mimeType: string } | null> {
    const doc = this.documents.get(documentId);
    if (!doc) return null;
    const match = /^data:([^;]+);base64,(.+)$/s.exec(doc.fileUrl);
    if (!match) return null;
    return { mimeType: match[1]!, base64: match[2]! };
  }

  async getSignedFileUrl({ documentId }: { documentId: string }): Promise<string | null> {
    return this.documents.get(documentId)?.fileUrl ?? null;
  }

  async create({ input }: { input: CreateDocumentInput }): Promise<Document> {
    const parsed = createDocumentInputSchema.parse(input);
    const now = new Date().toISOString();
    const document: Document = {
      id: randomUUID(),
      tripId: parsed.tripId ?? null,
      entityType: parsed.entityType,
      entityId: parsed.entityId,
      documentType: parsed.documentType,
      fileUrl: parsed.fileUrl,
      fileName: parsed.fileName ?? null,
      mimeType: parsed.mimeType ?? null,
      uploadedAt: now,
      ocrStatus: "pending",
      notes: parsed.notes ?? null,
      deletedAt: null,
    };
    this.documents.set(document.id, document);
    return document;
  }

  async softDelete({ documentId }: { documentId: string }): Promise<Document> {
    const existing = this.documents.get(documentId);
    if (!existing) throw new DocumentNotFoundError(documentId);

    const updated: Document = { ...existing, deletedAt: new Date().toISOString() };
    this.documents.set(documentId, updated);
    return updated;
  }

  async restore({ documentId }: { documentId: string }): Promise<Document> {
    const existing = this.documents.get(documentId);
    if (!existing) throw new DocumentNotFoundError(documentId);

    const updated: Document = { ...existing, deletedAt: null };
    this.documents.set(documentId, updated);
    return updated;
  }

  async updateOcrStatus({ documentId, ocrStatus }: { documentId: string; ocrStatus: OcrStatus }): Promise<Document> {
    const existing = this.documents.get(documentId);
    if (!existing) throw new DocumentNotFoundError(documentId);

    const updated: Document = { ...existing, ocrStatus };
    this.documents.set(documentId, updated);
    return updated;
  }

  async listExtractedFields({ documentId }: { documentId: string }): Promise<DocumentExtractedField[]> {
    return Array.from(this.extractedFields.values()).filter((f) => f.documentId === documentId);
  }

  async listExtractedFieldsForDocumentIds({ documentIds }: { documentIds: string[] }): Promise<DocumentExtractedField[]> {
    const idSet = new Set(documentIds);
    return Array.from(this.extractedFields.values()).filter((f) => idSet.has(f.documentId));
  }

  async replaceExtractedFields({
    documentId,
    fields,
  }: {
    documentId: string;
    fields: ExtractedFieldItemInput[];
  }): Promise<DocumentExtractedField[]> {
    for (const existing of Array.from(this.extractedFields.values())) {
      if (existing.documentId === documentId) this.extractedFields.delete(existing.id);
    }

    return fields.map((field) => {
      const row: DocumentExtractedField = {
        id: randomUUID(),
        documentId,
        fieldName: field.fieldName,
        extractedValue: field.extractedValue,
        confidenceScore: field.confidenceScore,
        dataSource: "ocr",
        isConfirmed: false,
        confirmedValue: null,
        confirmedAt: null,
      };
      this.extractedFields.set(row.id, row);
      return row;
    });
  }

  async confirmExtractedField({ fieldId, confirmedValue }: { fieldId: string; confirmedValue: string }): Promise<DocumentExtractedField> {
    const existing = this.extractedFields.get(fieldId);
    if (!existing) throw new ExtractedFieldNotFoundError(fieldId);

    const updated: DocumentExtractedField = { ...existing, isConfirmed: true, confirmedValue, confirmedAt: new Date().toISOString() };
    this.extractedFields.set(fieldId, updated);
    return updated;
  }
}

export const mockDocumentRepository = new MockDocumentRepository();
