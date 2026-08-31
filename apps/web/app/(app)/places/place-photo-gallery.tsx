"use client";

import { useActionState } from "react";
import type { Document } from "@travel-app/shared-types";
import { softDeletePlacePhotoAction, uploadPlacePhotoAction, type PlacePhotoFormState } from "./actions";
import { inputStyle } from "../trips/[tripId]/bookings/form-styles";

const initialState: PlacePhotoFormState = {};

// גלריית תמונות למקום גלובלי — אותו רעיון כמו EntityPhotoGallery (הזמנות)
// ו-TripMemoriesGallery, אבל עם action שבודק בעלות-על-מקום ולא בעלות-טיול,
// כי Place לא שייך לטיול ספציפי. ר' actions.ts.
export function PlacePhotoGallery({ placeId, documents }: { placeId: string; documents: Document[] }) {
  const action = uploadPlacePhotoAction.bind(null, placeId);
  const [state, formAction, isPending] = useActionState(action, initialState);
  const images = documents.filter((doc) => doc.documentType === "image");

  return (
    <div style={{ marginTop: "0.375rem" }}>
      {images.length > 0 ? (
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(70px, 1fr))", gap: "0.375rem", maxWidth: "360px", marginBottom: "0.375rem" }}>
          {images.map((doc) => (
            <div key={doc.id} style={{ position: "relative" }}>
              <a href={doc.fileUrl} target="_blank" rel="noopener noreferrer">
                <img
                  src={doc.fileUrl}
                  alt={doc.fileName ?? "תמונה"}
                  style={{ width: "100%", aspectRatio: "1 / 1", objectFit: "cover", borderRadius: "var(--radius-md)", border: "1px solid var(--color-border)", display: "block" }}
                />
              </a>
              <form action={softDeletePlacePhotoAction.bind(null, placeId, doc.id)} style={{ position: "absolute", top: "0.125rem", insetInlineEnd: "0.125rem" }}>
                <button
                  type="submit"
                  aria-label="הסר תמונה"
                  style={{ padding: "0.0625rem 0.25rem", borderRadius: "4px", border: "1px solid var(--color-danger)", background: "var(--color-surface)", color: "var(--color-danger)", cursor: "pointer", fontSize: "0.6875rem" }}
                >
                  ✕
                </button>
              </form>
            </div>
          ))}
        </div>
      ) : null}
      <form action={formAction} style={{ display: "flex", gap: "0.375rem", flexWrap: "wrap", alignItems: "center" }}>
        <input name="file" type="file" accept="image/*" required style={{ ...inputStyle, padding: "0.125rem 0.375rem", maxWidth: "180px", fontSize: "0.75rem" }} />
        <button
          type="submit"
          disabled={isPending}
          style={{
            padding: "0.1875rem 0.5rem",
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
      {state?.formError ? <span style={{ color: "var(--color-danger)", fontSize: "0.75rem" }}>{state.formError}</span> : null}
    </div>
  );
}
