"use client";

import { useActionState } from "react";
import { createDepositAction, type FinanceFormState } from "./actions";
import { inputStyle, submitButtonStyle } from "../bookings/form-styles";
import { CurrencySelect } from "@/components/currency-select";
import { DatePicker } from "@/components/ui/DatePicker";

const initialState: FinanceFormState = {};

export function DepositCreateForm({ tripId, preferredCurrencyCodes }: { tripId: string; preferredCurrencyCodes?: string[] }) {
  const action = createDepositAction.bind(null, tripId);
  const [state, formAction, isPending] = useActionState(action, initialState);

  return (
    <form action={formAction} style={{ display: "flex", flexDirection: "column", gap: "0.5rem" }}>
      <div style={{ display: "flex", gap: "0.5rem" }}>
        <input name="amount" type="number" min="0.01" step="0.01" placeholder="סכום הפיקדון" required style={inputStyle} />
        <CurrencySelect name="currencyCode" required preferredCurrencyCodes={preferredCurrencyCodes} style={{ ...inputStyle, maxWidth: "170px" }} />
      </div>
      <input name="paidTo" placeholder="למי שולם (למשל: השכרת רכב)" style={inputStyle} />
      <input name="reason" placeholder="סיבה" style={inputStyle} />
      <label style={{ display: "flex", flexDirection: "column", gap: "0.25rem", fontSize: "0.8125rem" }}>
        תאריך החזר צפוי
        <DatePicker name="expectedReturnDate" />
      </label>
      {state?.fieldErrors?.amount?.map((m) => (
        <span key={m} style={{ color: "var(--color-danger)", fontSize: "0.8125rem" }}>
          {m}
        </span>
      ))}
      {state?.formError ? <span style={{ color: "var(--color-danger)", fontSize: "0.8125rem" }}>{state.formError}</span> : null}
      <button type="submit" disabled={isPending} className="ui-btn-primary" style={submitButtonStyle(isPending)}>
        {isPending ? "שומר..." : "רשום פיקדון"}
      </button>
    </form>
  );
}
