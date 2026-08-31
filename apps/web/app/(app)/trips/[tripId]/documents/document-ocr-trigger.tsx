"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import type { OcrStatus } from "@travel-app/shared-types";
import { StatusBadge } from "@/components/ui/StatusBadge";
import { OCR_STATUS_LABELS, OCR_STATUS_TONE } from "@/lib/ocr-status-labels";
import { runOcrAction } from "./ocr-actions";

/** גרסה קלה — תג-סטטוס + כפתור-הרצה בלבד, בלי פאנל-סקירת-שדות (לזה יש
 * DocumentOcrPanel במרכז-המסמכים). משמש בתוך EntityDocumentSection, ליד
 * כל מסמך בכל רשימת-הזמנה, כדי שאפשר יהיה להריץ קריאה-אוטומטית מיד עם ההעלאה. */
export function DocumentOcrTrigger({ tripId, documentId, ocrStatus }: { tripId: string; documentId: string; ocrStatus: OcrStatus }) {
  const [isPending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);
  const router = useRouter();

  return (
    <span style={{ display: "inline-flex", alignItems: "center", gap: "0.375rem" }}>
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
            padding: "0.15rem 0.5rem",
            borderRadius: "var(--radius-full)",
            border: "1px solid color-mix(in srgb, var(--color-primary) 30%, transparent)",
            background: "transparent",
            color: "var(--color-primary)",
            cursor: isPending ? "default" : "pointer",
            fontSize: "0.6875rem",
            fontWeight: 600,
          }}
        >
          {isPending ? "קורא…" : "🔎 קרא אוטומטית"}
        </button>
      ) : null}
      {error ? <span style={{ color: "var(--color-danger)", fontSize: "0.6875rem" }}>{error}</span> : null}
    </span>
  );
}
