"use client";

import { useActionState } from "react";
import type { Document, DocumentEntityType } from "@travel-app/shared-types";
import { uploadDocumentAction, type DocumentFormState } from "./actions";
import { DeleteDocumentButton } from "./delete-document-button";
import { DocumentOcrTrigger } from "./document-ocr-trigger";
import { inputStyle } from "../bookings/form-styles";
import { DOCUMENT_TYPE_LABELS } from "@/lib/document-labels";
import { Select } from "@/components/ui/Select";

const UPLOAD_DOCUMENT_TYPE_OPTIONS = ["receipt", "invoice", "payment_confirmation", "voucher", "ticket", "policy", "screenshot", "image", "pdf", "passport_copy", "other"] as const;

const initialState: DocumentFormState = {};

// גרסה כללית של DocumentUploadForm — לא בוחרת הוצאה מתוך רשימה, אלא מקושרת
// ישירות לישות ספציפית (הזמנה/מלון/טיסה/תחבורה/ביטוח) שכבר ידועה בהקשר שבו
// היא מוצגת — נועדה לשימוש inline בתוך רשימת ההזמנות, לא כסקשן נפרד.
export function EntityDocumentSection({
  tripId,
  entityType,
  entityId,
  documents,
}: {
  tripId: string;
  entityType: DocumentEntityType;
  entityId: string;
  documents: Document[];
}) {
  const action = uploadDocumentAction.bind(null, tripId, entityType);
  const [state, formAction, isPending] = useActionState(action, initialState);

  return (
    <div style={{ marginTop: "0.375rem", fontSize: "0.8125rem" }}>
      {documents.length > 0 ? (
        <ul style={{ listStyle: "none", padding: 0, margin: "0 0 0.375rem 0", display: "flex", flexWrap: "wrap", gap: "0.375rem" }}>
          {documents.map((doc) => (
            <li key={doc.id} style={{ display: "flex", alignItems: "center", gap: "0.375rem", flexWrap: "wrap" }}>
              <a href={doc.fileUrl} target="_blank" rel="noopener noreferrer" style={{ fontSize: "0.75rem" }}>
                📎 {DOCUMENT_TYPE_LABELS[doc.documentType] ?? doc.documentType}
                {doc.fileName ? `: ${doc.fileName}` : ""}
              </a>
              <DocumentOcrTrigger tripId={tripId} documentId={doc.id} ocrStatus={doc.ocrStatus} />
              <DeleteDocumentButton tripId={tripId} documentId={doc.id} />
            </li>
          ))}
        </ul>
      ) : null}
      <form action={formAction} style={{ display: "flex", gap: "0.375rem", flexWrap: "wrap", alignItems: "center" }}>
        <input type="hidden" name="entityId" value={entityId} />
        <Select
          name="documentType"
          required
          style={{ ...inputStyle, padding: "0.25rem 0.5rem" }}
          defaultValue="receipt"
          options={UPLOAD_DOCUMENT_TYPE_OPTIONS.map((value) => ({ value, label: DOCUMENT_TYPE_LABELS[value] }))}
        />
        <input name="file" type="file" accept="image/*,application/pdf" required style={{ ...inputStyle, padding: "0.25rem 0.5rem", maxWidth: "180px" }} />
        <button
          type="submit"
          disabled={isPending}
          style={{
            padding: "0.25rem 0.625rem",
            borderRadius: "var(--radius-full)",
            border: "1px solid color-mix(in srgb, var(--color-primary) 30%, transparent)",
            background: "color-mix(in srgb, var(--color-primary) 14%, transparent)",
            color: "var(--color-primary)",
            fontWeight: 600,
            cursor: "pointer",
            fontSize: "0.75rem",
          }}
        >
          {isPending ? "מעלה..." : "+ מסמך"}
        </button>
      </form>
      {state?.formError ? <span style={{ color: "var(--color-danger)" }}>{state.formError}</span> : null}
    </div>
  );
}
