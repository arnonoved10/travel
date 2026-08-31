"use client";

import { useActionState } from "react";
import { updateTripDayNotesAction, type TripDayNotesFormState } from "./actions";

const initialState: TripDayNotesFormState = {};

export function TripDayNotesForm({ tripId, date, notes }: { tripId: string; date: string; notes: string | null }) {
  const action = updateTripDayNotesAction.bind(null, tripId, date);
  const [state, formAction, isPending] = useActionState(action, initialState);

  return (
    <form action={formAction} style={{ display: "flex", flexDirection: "column", gap: "0.375rem" }}>
      <textarea
        name="notes"
        defaultValue={notes ?? ""}
        placeholder="הערות ליום הזה — למשל תוכניות, זיכרונות, דברים לזכור..."
        rows={2}
        style={{
          padding: "0.5rem 0.75rem",
          borderRadius: "var(--radius-md)",
          border: "1px solid var(--color-border)",
          background: "var(--color-surface-elevated)",
          color: "var(--color-text-primary)",
          fontFamily: "inherit",
          fontSize: "0.875rem",
          resize: "vertical",
        }}
      />
      {state?.formError ? <span style={{ color: "var(--color-danger)", fontSize: "0.8125rem" }}>{state.formError}</span> : null}
      <button
        type="submit"
        disabled={isPending}
        style={{
          alignSelf: "flex-start",
          padding: "0.375rem 0.875rem",
          borderRadius: "var(--radius-full)",
          border: "1px solid color-mix(in srgb, var(--color-primary) 30%, transparent)",
          background: "color-mix(in srgb, var(--color-primary) 14%, transparent)",
          color: "var(--color-primary)",
          fontWeight: 600,
          cursor: isPending ? "default" : "pointer",
          fontSize: "0.8125rem",
          opacity: isPending ? 0.6 : 1,
        }}
      >
        {isPending ? "שומר..." : "שמור הערות"}
      </button>
    </form>
  );
}
