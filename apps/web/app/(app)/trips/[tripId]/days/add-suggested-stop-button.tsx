"use client";

import { useTransition } from "react";
import { addSuggestedStopAction } from "./actions";

export function AddSuggestedStopButton({ tripId, date, placeId }: { tripId: string; date: string; placeId: string }) {
  const [isPending, startTransition] = useTransition();

  return (
    <button
      type="button"
      disabled={isPending}
      onClick={() => startTransition(() => void addSuggestedStopAction(tripId, date, placeId))}
      style={{
        padding: "0.25rem 0.625rem",
        borderRadius: "var(--radius-full)",
        border: "1px solid color-mix(in srgb, var(--color-primary) 30%, transparent)",
        background: "color-mix(in srgb, var(--color-primary) 14%, transparent)",
        color: "var(--color-primary)",
        fontWeight: 600,
        cursor: isPending ? "default" : "pointer",
        fontSize: "0.75rem",
        whiteSpace: "nowrap",
      }}
    >
      {isPending ? "מוסיף…" : "➕ הוסף למסלול"}
    </button>
  );
}
