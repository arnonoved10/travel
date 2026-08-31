"use client";

import { useState } from "react";
import { useActionState } from "react";
import type { Expense } from "@travel-app/shared-types";
import { createRefundAction, type FinanceFormState } from "./actions";
import { inputStyle, submitButtonStyle } from "../bookings/form-styles";
import { CurrencySelect } from "@/components/currency-select";
import { Select } from "@/components/ui/Select";
import { DatePicker } from "@/components/ui/DatePicker";

const initialState: FinanceFormState = {};

export function RefundForm({
  tripId,
  expenses,
  preferredCurrencyCodes,
}: {
  tripId: string;
  expenses: Expense[];
  preferredCurrencyCodes?: string[];
}) {
  const action = createRefundAction.bind(null, tripId);
  const [state, formAction, isPending] = useActionState(action, initialState);
  const [awaitingRefund, setAwaitingRefund] = useState(false);

  if (expenses.length === 0) {
    return <p style={{ color: "var(--color-text-muted)", fontSize: "0.875rem" }}>הוסף הוצאה קודם כדי לרשום עליה החזר.</p>;
  }

  return (
    <form action={formAction} style={{ display: "flex", flexDirection: "column", gap: "0.5rem" }}>
      <Select
        name="sourceExpenseId"
        required
        style={inputStyle}
        defaultValue=""
        placeholder="החזר על איזו הוצאה?"
        options={expenses.map((expense) => ({
          value: expense.id,
          label: `${expense.description ?? expense.category} — ${expense.amount} ${expense.currencyCode}`,
        }))}
      />
      <div style={{ display: "flex", gap: "0.5rem" }}>
        <input name="amount" type="number" min="0.01" step="0.01" placeholder="סכום ההחזר" required style={inputStyle} />
        <CurrencySelect name="currencyCode" required preferredCurrencyCodes={preferredCurrencyCodes} style={{ ...inputStyle, maxWidth: "170px" }} />
      </div>
      <input name="reason" placeholder="סיבה (למשל: החזר מס)" style={inputStyle} />
      <label style={{ display: "flex", alignItems: "center", gap: "0.375rem", fontSize: "0.8125rem", color: "var(--color-text-muted)" }}>
        <input
          type="checkbox"
          name="pending"
          checked={awaitingRefund}
          onChange={(e) => setAwaitingRefund(e.target.checked)}
        />
        עדיין לא התקבל בפועל — רק צפוי
      </label>
      {awaitingRefund ? (
        <DatePicker name="expectedDate" defaultValue={new Date().toISOString().slice(0, 10)} required />
      ) : null}
      {state?.fieldErrors?.sourceExpenseId?.map((m) => (
        <span key={m} style={{ color: "var(--color-danger)", fontSize: "0.8125rem" }}>
          {m}
        </span>
      ))}
      {state?.formError ? <span style={{ color: "var(--color-danger)", fontSize: "0.8125rem" }}>{state.formError}</span> : null}
      <button type="submit" disabled={isPending} className="ui-btn-primary" style={submitButtonStyle(isPending)}>
        {isPending ? "שומר..." : awaitingRefund ? "רשום החזר צפוי" : "רשום החזר"}
      </button>
    </form>
  );
}
