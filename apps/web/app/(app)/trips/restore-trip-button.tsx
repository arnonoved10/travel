"use client";

import { restoreTripAction } from "./actions";

export function RestoreTripButton({ tripId }: { tripId: string }) {
  return (
    <form action={restoreTripAction.bind(null, tripId)}>
      <button
        type="submit"
        style={{
          padding: "0.375rem 0.75rem",
          borderRadius: "var(--radius-full)",
          border: "1px solid color-mix(in srgb, var(--color-primary) 30%, transparent)",
          background: "color-mix(in srgb, var(--color-primary) 14%, transparent)",
          color: "var(--color-primary)",
          fontWeight: 600,
          cursor: "pointer",
          fontSize: "0.8125rem",
        }}
      >
        שחזר
      </button>
    </form>
  );
}
