"use client";

import { useActionState } from "react";
import { createPaymentCardAction, type PaymentCardFormState } from "./actions";
import { CurrencySelect } from "@/components/currency-select";

const initialState: PaymentCardFormState = {};

export function PaymentCardCreateForm() {
  const [state, formAction, isPending] = useActionState(createPaymentCardAction, initialState);

  return (
    <form action={formAction} style={{ display: "flex", flexDirection: "column", gap: "0.75rem", maxWidth: "420px" }}>
      <label style={{ display: "flex", flexDirection: "column", gap: "0.25rem" }}>
        <span>שם הכרטיס</span>
        <input name="cardName" required style={inputStyle} placeholder="למשל: ויזה כחולה" />
        {state?.fieldErrors?.cardName?.map((message) => (
          <span key={message} style={{ color: "var(--color-danger)", fontSize: "0.8125rem" }}>
            {message}
          </span>
        ))}
      </label>

      <label style={{ display: "flex", flexDirection: "column", gap: "0.25rem" }}>
        <span>מטבע ברירת מחדל (אופציונלי)</span>
        <CurrencySelect name="defaultCurrencyCode" style={inputStyle} />
      </label>

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
          alignSelf: "flex-start",
          boxShadow: isPending ? "none" : "var(--glow-brand)",
          transition: "all var(--duration-base) var(--ease-out)",
        }}
      >
        {isPending ? "שומר..." : "הוסף כרטיס"}
      </button>
    </form>
  );
}

const inputStyle: React.CSSProperties = {
  padding: "0.625rem 0.875rem",
  borderRadius: "var(--radius-md)",
  border: "1px solid var(--color-border)",
  background: "var(--color-surface-elevated)",
  color: "var(--color-text-primary)",
};
