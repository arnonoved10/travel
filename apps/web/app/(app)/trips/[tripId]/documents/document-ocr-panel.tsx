"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import type { DocumentExtractedField, OcrStatus } from "@travel-app/shared-types";
import { StatusBadge } from "@/components/ui/StatusBadge";
import { OCR_STATUS_LABELS, OCR_STATUS_TONE } from "@/lib/ocr-status-labels";
import { confirmExtractedFieldAction, markDocumentConfirmedAction, runOcrAction } from "./ocr-actions";

const inputStyle: React.CSSProperties = {
  padding: "0.25rem 0.5rem",
  borderRadius: "var(--radius-sm)",
  border: "1px solid var(--color-border)",
  background: "var(--color-surface)",
  color: "var(--color-text-primary)",
  fontSize: "0.75rem",
  minWidth: "140px",
};

function ExtractedFieldRow({ tripId, field }: { tripId: string; field: DocumentExtractedField }) {
  const [value, setValue] = useState(field.confirmedValue ?? field.extractedValue ?? "");
  const [isPending, startTransition] = useTransition();
  const router = useRouter();

  return (
    <div style={{ display: "flex", alignItems: "center", gap: "0.5rem", flexWrap: "wrap" }}>
      <span style={{ fontSize: "0.75rem", color: "var(--color-text-muted)", minWidth: "110px" }}>{field.fieldName}</span>
      <input value={value} onChange={(e) => setValue(e.target.value)} style={inputStyle} />
      {field.confidenceScore !== null ? (
        <span style={{ fontSize: "0.6875rem", color: "var(--color-text-muted)" }}>ביטחון: {Math.round(field.confidenceScore * 100)}%</span>
      ) : null}
      {field.isConfirmed ? (
        <StatusBadge label="אושר" tone="success" />
      ) : (
        <button
          type="button"
          disabled={isPending}
          onClick={() =>
            startTransition(async () => {
              await confirmExtractedFieldAction(tripId, field.id, value);
              router.refresh();
            })
          }
          style={{
            padding: "0.15rem 0.5rem",
            borderRadius: "var(--radius-full)",
            border: "1px solid color-mix(in srgb, var(--color-success) 35%, transparent)",
            background: "color-mix(in srgb, var(--color-success) 12%, transparent)",
            color: "var(--color-success)",
            cursor: isPending ? "default" : "pointer",
            fontSize: "0.6875rem",
            fontWeight: 600,
          }}
        >
          {isPending ? "מאשר…" : "✓ אשר"}
        </button>
      )}
    </div>
  );
}

export function DocumentOcrPanel({
  tripId,
  documentId,
  ocrStatus,
  fields,
}: {
  tripId: string;
  documentId: string;
  ocrStatus: OcrStatus;
  fields: DocumentExtractedField[];
}) {
  const [isPending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);
  const router = useRouter();

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: "0.375rem", marginTop: "0.375rem" }}>
      <div style={{ display: "flex", alignItems: "center", gap: "0.5rem", flexWrap: "wrap" }}>
        <StatusBadge label={OCR_STATUS_LABELS[ocrStatus]} tone={OCR_STATUS_TONE[ocrStatus]} />
        {ocrStatus === "pending" || ocrStatus === "failed" ? (
          <button
            type="button"
            disabled={isPending}
            onClick={() => {
              setError(null);
              startTransition(async () => {
                const result = await runOcrAction(tripId, documentId);
                if (!result.ok) {
                  setError(result.error ?? "קריאה נכשלה.");
                  return;
                }
                router.refresh();
              });
            }}
            style={{
              padding: "0.2rem 0.625rem",
              borderRadius: "var(--radius-full)",
              border: "1px solid color-mix(in srgb, var(--color-primary) 30%, transparent)",
              background: "color-mix(in srgb, var(--color-primary) 14%, transparent)",
              color: "var(--color-primary)",
              cursor: isPending ? "default" : "pointer",
              fontSize: "0.75rem",
              fontWeight: 600,
            }}
          >
            {isPending ? "קורא…" : "🔎 קרא מסמך אוטומטית"}
          </button>
        ) : null}
      </div>

      {error ? <span style={{ color: "var(--color-danger)", fontSize: "0.75rem" }}>{error}</span> : null}

      {fields.length > 0 ? (
        <div style={{ display: "flex", flexDirection: "column", gap: "0.3rem", padding: "0.5rem", background: "var(--color-surface-elevated)", borderRadius: "var(--radius-sm)" }}>
          {fields.map((field) => (
            <ExtractedFieldRow key={field.id} tripId={tripId} field={field} />
          ))}
          {ocrStatus !== "confirmed" ? (
            <button
              type="button"
              disabled={isPending}
              onClick={() =>
                startTransition(async () => {
                  await markDocumentConfirmedAction(tripId, documentId);
                  router.refresh();
                })
              }
              style={{
                alignSelf: "flex-start",
                padding: "0.2rem 0.625rem",
                borderRadius: "var(--radius-full)",
                border: "1px solid var(--color-border)",
                background: "var(--color-surface)",
                color: "var(--color-text-primary)",
                cursor: "pointer",
                fontSize: "0.75rem",
                fontWeight: 600,
              }}
            >
              סמן מסמך כנבדק
            </button>
          ) : null}
        </div>
      ) : null}
    </div>
  );
}
