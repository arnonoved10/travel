"use client";

import { useActionState } from "react";
import { correctWalletTopUpAction, type FinanceFormState } from "./actions";
import { inputStyle } from "../bookings/form-styles";

const initialState: FinanceFormState = {};

export function CorrectWalletTopUpForm({
  tripId,
  transactionId,
  amount,
}: {
  tripId: string;
  transactionId: string;
  amount: number;
}) {
  const action = correctWalletTopUpAction.bind(null, tripId, transactionId);
  const [state, formAction, isPending] = useActionState(action, initialState);

  return (
    <details style={{ marginTop: "0.25rem" }}>
      <summary style={{ fontSize: "0.75rem", color: "var(--color-primary)", cursor: "pointer" }}>תיקון/ביטול הפקדה זו</summary>
      <form action={formAction} style={{ display: "flex", gap: "0.375rem", flexWrap: "wrap", marginTop: "0.375rem" }}>
        <input
          name="correctedAmount"
          type="number"
          step="0.01"
          min="0"
          defaultValue={amount}
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
          {isPending ? "מעדכן..." : "עדכן"}
        </button>
      </form>
      <div style={{ fontSize: "0.6875rem", color: "var(--color-text-muted)", marginTop: "0.25rem" }}>
        רשמת סכום שגוי או במטבע הלא-נכון? עדכני כאן את הסכום הנכון, או קבעי 0 כדי לבטל את ההפקדה הזו לגמרי — ואז אפשר להפקיד מחדש במטבע הנכון למטה.
      </div>
      {state?.formError ? <span style={{ color: "var(--color-danger)", fontSize: "0.75rem" }}>{state.formError}</span> : null}
    </details>
  );
}
