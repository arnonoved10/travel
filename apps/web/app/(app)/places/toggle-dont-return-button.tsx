"use client";

import { toggleDontReturnPlaceAction } from "./actions";

export function ToggleDontReturnButton({ placeId, dontReturn }: { placeId: string; dontReturn: boolean }) {
  return (
    <form action={toggleDontReturnPlaceAction.bind(null, placeId)}>
      <button
        type="submit"
        aria-label={dontReturn ? "בטל 'לא לחזור לכאן'" : "סמן 'לא לחזור לכאן'"}
        title={dontReturn ? "מסומן: לא לחזור לכאן — לחץ לביטול" : "סמן שלא כדאי לחזור למקום הזה"}
        style={{
          padding: "0.375rem 0.5rem",
          borderRadius: "var(--radius-full)",
          border: "1px solid var(--color-border)",
          background: "var(--color-surface)",
          color: dontReturn ? "var(--color-danger)" : "var(--color-text-muted)",
          cursor: "pointer",
          fontSize: "1rem",
          lineHeight: 1,
        }}
      >
        🚫
      </button>
    </form>
  );
}
