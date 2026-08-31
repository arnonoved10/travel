"use client";

import { useActionState } from "react";
import type { CSSProperties } from "react";
import { updateDisplayNameAction, type DisplayNameFormState } from "./actions";

const cardStyle: CSSProperties = {
  background: "var(--color-surface)",
  border: "1px solid var(--color-border)",
  borderRadius: "var(--radius-lg)",
  padding: "1.25rem",
  backdropFilter: "blur(20px)",
  WebkitBackdropFilter: "blur(20px)",
  display: "flex",
  flexDirection: "column",
  gap: "0.75rem",
  maxWidth: "560px",
};

const inputStyle: CSSProperties = {
  padding: "0.5rem 0.75rem",
  borderRadius: "var(--radius-md)",
  border: "1px solid var(--color-border)",
  background: "var(--color-surface-elevated)",
  color: "var(--color-text-primary)",
  fontSize: "0.875rem",
  maxWidth: "20rem",
};

const initialState: DisplayNameFormState = {};

export function DisplayNameForm({ currentDisplayName }: { currentDisplayName: string | null }) {
  const [state, formAction, isPending] = useActionState(updateDisplayNameAction, initialState);

  return (
    <div style={cardStyle}>
      <form action={formAction} style={{ display: "flex", gap: "0.5rem", flexWrap: "wrap", alignItems: "center" }}>
        <input name="displayName" defaultValue={currentDisplayName ?? ""} placeholder="למשל: ארנון עובד" style={inputStyle} />
        <button
          type="submit"
          disabled={isPending}
          className="ui-btn-primary"
          style={{
            padding: "0.5rem 1rem",
            borderRadius: "var(--radius-full)",
            border: "none",
            background: isPending ? "var(--color-secondary)" : "var(--gradient-brand)",
            color: "#fff",
            fontWeight: 700,
            cursor: isPending ? "default" : "pointer",
          }}
        >
          {isPending ? "שומר…" : "שמור"}
        </button>
      </form>
      <div style={{ fontSize: "0.8125rem", color: "var(--color-text-muted)" }}>מוצג בברכה במסך הבית — למשל &quot;בוקר טוב, ארנון עובד&quot;.</div>
      {state.formError ? <span style={{ color: "var(--color-danger)", fontSize: "0.8125rem" }}>{state.formError}</span> : null}
    </div>
  );
}
