"use client";

import { useActionState } from "react";
import type { Document } from "@travel-app/shared-types";
import { uploadDocumentAction, type DocumentFormState } from "./actions";
import { DeleteDocumentButton } from "./delete-document-button";
import { inputStyle } from "../bookings/form-styles";

const initialState: DocumentFormState = {};

// גלריית תמונות לטיול (Trip Memories) — שימוש חוזר במנגנון ה-Document הקיים
// (entityType="trip" חדש, נוסף ל-DocumentEntityType) במקום מודל Photo נפרד,
// כי ה-fileUrl כבר data: URI אמיתי (base64, נשמר במלואו — לא כתובת מזויפת,
// ר' actions.ts). ההבדל היחיד מ-EntityDocumentSection: תמונות מוצגות כגריד
// thumbnails, לא כרשימת קישורים — כי "זכרון" זה חוויה ויזואלית, לא קובץ מצורף.
export function TripMemoriesGallery({ tripId, documents }: { tripId: string; documents: Document[] }) {
  const action = uploadDocumentAction.bind(null, tripId, "trip");
  const [state, formAction, isPending] = useActionState(action, initialState);

  return (
    <div>
      {documents.length > 0 ? (
        <div
          style={{
            display: "grid",
            gridTemplateColumns: "repeat(auto-fill, minmax(120px, 1fr))",
            gap: "0.5rem",
            marginBottom: "0.75rem",
          }}
        >
          {documents.map((doc) => (
            <div key={doc.id} style={{ position: "relative" }}>
              <a href={doc.fileUrl} target="_blank" rel="noopener noreferrer">
                <img
                  src={doc.fileUrl}
                  alt={doc.fileName ?? "זכרון מהטיול"}
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
        <p style={{ color: "var(--color-text-muted)", fontSize: "0.875rem" }}>עוד לא הועלו תמונות מהטיול הזה.</p>
      )}

      <form action={formAction} style={{ display: "flex", gap: "0.375rem", flexWrap: "wrap", alignItems: "center" }}>
        <input type="hidden" name="entityId" value={tripId} />
        <input type="hidden" name="documentType" value="image" />
        <input name="file" type="file" accept="image/*" required style={{ ...inputStyle, padding: "0.25rem 0.5rem", maxWidth: "220px" }} />
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
      <p style={{ margin: "0.25rem 0 0", fontSize: "0.75rem", color: "var(--color-text-muted)" }}>גודל תמונה מקסימלי: 3MB.</p>
      {state?.formError ? (
        <span style={{ color: "var(--color-danger)", fontSize: "0.8125rem" }}>{state.formError}</span>
      ) : null}
    </div>
  );
}
