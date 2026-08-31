"use client";

import { useActionState } from "react";
import { correctCurrencyExchangeAction, type FinanceFormState } from "./actions";
import { inputStyle } from "../bookings/form-styles";

const initialState: FinanceFormState = {};

export function CorrectCurrencyExchangeForm({
  tripId,
  exchangeId,
  givenAmount,
  receivedAmount,
}: {
  tripId: string;
  exchangeId: string;
  givenAmount: number;
  receivedAmount: number;
}) {
  const action = correctCurrencyExchangeAction.bind(null, tripId, exchangeId);
  const [state, formAction, isPending] = useActionState(action, initialState);

  return (
    <details style={{ marginTop: "0.375rem" }}>
      <summary style={{ fontSize: "0.75rem", color: "var(--color-primary)", cursor: "pointer" }}>תיקון (טעיתי בסכום)</summary>
      <form action={formAction} style={{ display: "flex", gap: "0.375rem", flexWrap: "wrap", marginTop: "0.375rem" }}>
        <input
          name="correctedGivenAmount"
          type="number"
          step="0.01"
          min="0.01"
          defaultValue={givenAmount}
          required
          style={{ ...inputStyle, padding: "0.25rem 0.5rem", maxWidth: "110px" }}
        />
        <span style={{ color: "var(--color-text-muted)", alignSelf: "center" }}>→</span>
        <input
          name="correctedReceivedAmount"
          type="number"
          step="0.01"
          min="0.01"
          defaultValue={receivedAmount}
          required
          style={{ ...inputStyle, padding: "0.25rem 0.5rem", maxWidth: "110px" }}
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
          {isPending ? "מתקן..." : "עדכן"}
        </button>
      </form>
      {state?.formError ? <span style={{ color: "var(--color-danger)", fontSize: "0.75rem" }}>{state.formError}</span> : null}
    </details>
  );
}
