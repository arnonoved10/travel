"use client";

import { useActionState } from "react";
import type { Document, DocumentEntityType } from "@travel-app/shared-types";
import { uploadDocumentAction, type DocumentFormState } from "./actions";
import { DeleteDocumentButton } from "./delete-document-button";
import { inputStyle } from "../bookings/form-styles";

const initialState: DocumentFormState = {};

// גלריית תמונות כללית לכל סוג ישות — הכללה של TripMemoriesGallery (שנשאר
// כפי שהוא, entityType="trip" קבוע). אותו מנגנון בדיוק: Document עם
// documentType="image", לא מודל Photo נפרד ולא תלוי Storage אמיתי —
// ה-fileUrl כבר data: URI אמיתי (base64) גם ב-Mock, אותה מגבלה כמו כל
// מסמך אחר באפליקציה, לא ייחודית לתמונות.
export function EntityPhotoGallery({
  tripId,
  entityType,
  entityId,
  documents,
  emptyLabel = "עוד לא הועלו תמונות.",
}: {
  tripId: string;
  entityType: DocumentEntityType;
  entityId: string;
  documents: Document[];
  emptyLabel?: string;
}) {
  const action = uploadDocumentAction.bind(null, tripId, entityType);
  const [state, formAction, isPending] = useActionState(action, initialState);
  const images = documents.filter((doc) => doc.documentType === "image");

  return (
    <div>
      {images.length > 0 ? (
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(90px, 1fr))", gap: "0.375rem", marginBottom: "0.5rem" }}>
          {images.map((doc) => (
            <div key={doc.id} style={{ position: "relative" }}>
              <a href={doc.fileUrl} target="_blank" rel="noopener noreferrer">
                <img
                  src={doc.fileUrl}
                  alt={doc.fileName ?? "תמונה"}
                  style={{
                    width: "100%",
                    aspectRatio: "1 / 1",
                    objectFit: "cover",
                    borderRadius: "var(--radius-md)",
                    border: "1px solid var(--color-border)",
                    display: "block",
                  }}
                />
              </a>
              <div style={{ position: "absolute", top: "0.25rem", insetInlineEnd: "0.25rem" }}>
                <DeleteDocumentButton tripId={tripId} documentId={doc.id} />
              </div>
            </div>
          ))}
        </div>
      ) : (
        <p style={{ color: "var(--color-text-muted)", fontSize: "0.75rem" }}>{emptyLabel}</p>
      )}

      <form action={formAction} style={{ display: "flex", gap: "0.375rem", flexWrap: "wrap", alignItems: "center" }}>
        <input type="hidden" name="entityId" value={entityId} />
        <input type="hidden" name="documentType" value="image" />
        <input name="file" type="file" accept="image/*" required style={{ ...inputStyle, padding: "0.25rem 0.5rem", maxWidth: "200px" }} />
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
          {isPending ? "מעלה..." : "+ תמונה"}
        </button>
      </form>
      {state?.formError ? <span style={{ color: "var(--color-danger)", fontSize: "0.8125rem" }}>{state.formError}</span> : null}
    </div>
  );
}
