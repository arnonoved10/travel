import { beforeEach, describe, expect, it } from "vitest";
import { ExtractedFieldNotFoundError, MockDocumentRepository } from "./document-repository.mock";
import { DocumentNotFoundError } from "./document-repository";

const tripId = "aaaaaaaa-bbbb-4ccc-8ddd-eeeeeeeeeeee";
const expenseId = "11111111-2222-4333-8444-555555555555";

describe("MockDocumentRepository", () => {
  let repo: MockDocumentRepository;

  beforeEach(() => {
    repo = new MockDocumentRepository();
  });

  it("creates a document with a data: URI file and defaults ocrStatus to pending", async () => {
    const doc = await repo.create({
      input: {
        tripId,
        entityType: "expense",
        entityId: expenseId,
        documentType: "receipt",
        fileUrl: "data:image/png;base64,iVBORw0KGgo=",
        fileName: "receipt.png",
        mimeType: "image/png",
      },
    });

    expect(doc.id).toBeTruthy();
    expect(doc.ocrStatus).toBe("pending");
    expect(doc.fileUrl).toBe("data:image/png;base64,iVBORw0KGgo=");
    expect(doc.deletedAt).toBeNull();
  });

  it("lists documents for a specific entity, excluding other entities", async () => {
    await repo.create({
      input: { tripId, entityType: "expense", entityId: expenseId, documentType: "receipt", fileUrl: "data:image/png;base64,AAA=" },
    });
    await repo.create({
      input: {
        tripId,
        entityType: "expense",
        entityId: "99999999-8888-4777-8666-555555555555",
        documentType: "receipt",
        fileUrl: "data:image/png;base64,BBB=",
      },
    });

    const list = await repo.listForEntity({ tripId, entityType: "expense", entityId: expenseId });
    expect(list).toHaveLength(1);
  });

  it("lists all documents for a trip regardless of entity", async () => {
    await repo.create({
      input: { tripId, entityType: "expense", entityId: expenseId, documentType: "receipt", fileUrl: "data:image/png;base64,AAA=" },
    });
    await repo.create({
      input: { tripId, entityType: "insurance", entityId: "77777777-6666-4555-8444-333333333333", documentType: "policy", fileUrl: "data:application/pdf;base64,BBB=" },
    });

    const list = await repo.listForTrip({ tripId });
    expect(list).toHaveLength(2);
  });

  it("soft-deletes a document: hidden from lists afterwards", async () => {
    const doc = await repo.create({
      input: { tripId, entityType: "expense", entityId: expenseId, documentType: "receipt", fileUrl: "data:image/png;base64,AAA=" },
    });

    const deleted = await repo.softDelete({ documentId: doc.id });
    expect(deleted.deletedAt).not.toBeNull();

    const list = await repo.listForEntity({ tripId, entityType: "expense", entityId: expenseId });
    expect(list).toHaveLength(0);
  });

  it("throws when soft-deleting a non-existent document", async () => {
    await expect(repo.softDelete({ documentId: "00000000-0000-4000-8000-000000009999" })).rejects.toThrow(DocumentNotFoundError);
  });

  it("getFileBase64 decodes the stored data: URI directly", async () => {
    const doc = await repo.create({
      input: { tripId, entityType: "expense", entityId: expenseId, documentType: "receipt", fileUrl: "data:image/png;base64,iVBORw0KGgo=" },
    });

    const file = await repo.getFileBase64({ documentId: doc.id });
    expect(file).toEqual({ mimeType: "image/png", base64: "iVBORw0KGgo=" });
  });

  it("getFileBase64 returns null for a non-existent document", async () => {
    expect(await repo.getFileBase64({ documentId: "00000000-0000-4000-8000-000000009999" })).toBeNull();
  });

  it("getSignedFileUrl returns the existing data: URI directly (no signing needed in mock)", async () => {
    const doc = await repo.create({
      input: { tripId, entityType: "expense", entityId: expenseId, documentType: "receipt", fileUrl: "data:image/png;base64,iVBORw0KGgo=" },
    });

    expect(await repo.getSignedFileUrl({ documentId: doc.id })).toBe("data:image/png;base64,iVBORw0KGgo=");
  });

  it("rejects a fileUrl that isn't a valid URL", async () => {
    await expect(
      repo.create({
        input: { tripId, entityType: "expense", entityId: expenseId, documentType: "receipt", fileUrl: "not-a-url" },
      }),
    ).rejects.toThrow();
  });

  it("updates ocrStatus on a document", async () => {
    const doc = await repo.create({
      input: { tripId, entityType: "expense", entityId: expenseId, documentType: "receipt", fileUrl: "data:image/png;base64,AAA=" },
    });

    const updated = await repo.updateOcrStatus({ documentId: doc.id, ocrStatus: "parsed" });
    expect(updated.ocrStatus).toBe("parsed");
  });

  it("replaceExtractedFields stores fields and a second call replaces them, not appends", async () => {
    const doc = await repo.create({
      input: { tripId, entityType: "expense", entityId: expenseId, documentType: "receipt", fileUrl: "data:image/png;base64,AAA=" },
    });

    await repo.replaceExtractedFields({
      documentId: doc.id,
      fields: [{ fieldName: "confirmationNumber", extractedValue: "OLD123", confidenceScore: 0.4 }],
    });
    const second = await repo.replaceExtractedFields({
      documentId: doc.id,
      fields: [
        { fieldName: "confirmationNumber", extractedValue: "NEW456", confidenceScore: 0.8 },
        { fieldName: "amount", extractedValue: "1200", confidenceScore: 0.6 },
      ],
    });

    expect(second).toHaveLength(2);
    const list = await repo.listExtractedFields({ documentId: doc.id });
    expect(list).toHaveLength(2);
    expect(list.every((f) => f.isConfirmed === false)).toBe(true);
    expect(list.find((f) => f.fieldName === "confirmationNumber")?.extractedValue).toBe("NEW456");
  });

  it("confirmExtractedField marks a field confirmed with the user-provided value", async () => {
    const doc = await repo.create({
      input: { tripId, entityType: "expense", entityId: expenseId, documentType: "receipt", fileUrl: "data:image/png;base64,AAA=" },
    });
    const [field] = await repo.replaceExtractedFields({
      documentId: doc.id,
      fields: [{ fieldName: "amount", extractedValue: "1200", confidenceScore: 0.6 }],
    });

    const confirmed = await repo.confirmExtractedField({ fieldId: field!.id, confirmedValue: "1250" });
    expect(confirmed.isConfirmed).toBe(true);
    expect(confirmed.confirmedValue).toBe("1250");
    expect(confirmed.confirmedAt).not.toBeNull();
  });

  it("throws when confirming a non-existent extracted field", async () => {
    await expect(repo.confirmExtractedField({ fieldId: "00000000-0000-4000-8000-000000009999", confirmedValue: "x" })).rejects.toThrow(
      ExtractedFieldNotFoundError,
    );
  });
});
