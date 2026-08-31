"use client";

import { useActionState } from "react";
import { reconcileWalletAction, type FinanceFormState } from "./actions";
import { inputStyle } from "../bookings/form-styles";

const initialState: FinanceFormState = {};

export function ReconcileWalletForm({ tripId, walletId, currencyCode }: { tripId: string; walletId: string; currencyCode: string }) {
  const action = reconcileWalletAction.bind(null, tripId, walletId);
  const [state, formAction, isPending] = useActionState(action, initialState);

  return (
    <details style={{ marginTop: "0.375rem" }}>
      <summary style={{ fontSize: "0.75rem", color: "var(--color-primary)", cursor: "pointer" }}>התאמת מזומן בפועל</summary>
      <form action={formAction} style={{ display: "flex", gap: "0.375rem", flexWrap: "wrap", marginTop: "0.375rem" }}>
        <input
          name="actualBalance"
          type="number"
          step="0.01"
          placeholder={`כמה ${currencyCode} יש בפועל`}
          required
          style={{ ...inputStyle, padding: "0.25rem 0.5rem", maxWidth: "140px" }}
        />
        <input name="reason" placeholder="סיבה (אופציונלי)" style={{ ...inputStyle, padding: "0.25rem 0.5rem" }} />
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
          {isPending ? "מעדכן..." : "התאם יתרה"}
        </button>
      </form>
      {state?.formError ? <span style={{ color: "var(--color-danger)", fontSize: "0.75rem" }}>{state.formError}</span> : null}
    </details>
  );
}
