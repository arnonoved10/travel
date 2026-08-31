"use client";

import { useActionState } from "react";
import { DatePicker } from "@/components/ui/DatePicker";
import { duplicateTripAction, type DuplicateTripFormState } from "./actions";

const initialState: DuplicateTripFormState = {};

export function DuplicateTripForm({ tripId }: { tripId: string }) {
  const action = duplicateTripAction.bind(null, tripId);
  const [state, formAction, isPending] = useActionState(action, initialState);

  return (
    <form action={formAction} style={{ display: "flex", flexDirection: "column", gap: "0.75rem", maxWidth: "320px" }}>
      <label style={{ display: "flex", flexDirection: "column", gap: "0.25rem" }}>
        <span>תאריך התחלה לטיול החדש</span>
        <DatePicker name="newStartDate" required />
        {state?.fieldErrors?.newStartDate?.map((message) => (
          <span key={message} style={{ color: "var(--color-danger)", fontSize: "0.8125rem" }}>
            {message}
          </span>
        ))}
      </label>

      {state?.formError ? <p style={{ color: "var(--color-danger)" }}>{state.formError}</p> : null}

      <button
        type="submit"
        disabled={isPending}
        style={{
          padding: "0.75rem 1.25rem",
          borderRadius: "var(--radius-full)",
          border: "none",
          background: isPending ? "var(--color-secondary)" : "var(--gradient-brand)",
          color: isPending ? "var(--color-text-muted)" : "#fff",
          fontWeight: 700,
          cursor: isPending ? "default" : "pointer",
          boxShadow: isPending ? "none" : "var(--glow-brand)",
          transition: "all var(--duration-base) var(--ease-out)",
        }}
      >
        {isPending ? "משכפל..." : "שכפל טיול"}
      </button>
    </form>
  );
}
