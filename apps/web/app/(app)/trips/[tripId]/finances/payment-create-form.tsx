"use client";

import { useActionState, useState } from "react";
import Link from "next/link";
import type { Expense, PaymentCard } from "@travel-app/shared-types";
import { createPaymentAction, type FinanceFormState } from "./actions";
import { inputStyle, submitButtonStyle } from "../bookings/form-styles";
import { CurrencySelect } from "@/components/currency-select";
import { Select } from "@/components/ui/Select";

const PAYMENT_METHOD_LABELS: Record<string, string> = {
  cash: "מזומן",
  credit_card: "כרטיס אשראי",
  debit_card: "כרטיס חיוב",
  digital_wallet: "ארנק דיגיטלי",
  bank_transfer: "העברה בנקאית",
  other: "אחר",
};

const CARD_LINKED_METHODS = new Set(["credit_card", "debit_card"]);

const initialState: FinanceFormState = {};

export function PaymentCreateForm({
  tripId,
  expenses,
  cards,
  preferredCurrencyCodes,
}: {
  tripId: string;
  expenses: Expense[];
  cards: PaymentCard[];
  preferredCurrencyCodes?: string[];
}) {
  const action = createPaymentAction.bind(null, tripId);
  const [state, formAction, isPending] = useActionState(action, initialState);
  const [paymentMethod, setPaymentMethod] = useState("");

  if (expenses.length === 0) {
    return <p style={{ color: "var(--color-text-muted)", fontSize: "0.875rem" }}>הוסף הוצאה קודם כדי לרשום תשלום עליה.</p>;
  }

  return (
    <form action={formAction} style={{ display: "flex", flexDirection: "column", gap: "0.5rem" }}>
      <Select
        name="expenseId"
        required
        style={inputStyle}
        defaultValue=""
        placeholder="לאיזו הוצאה?"
        options={expenses.map((expense) => ({
          value: expense.id,
          label: `${expense.description ?? expense.category} — ${expense.amount} ${expense.currencyCode}`,
        }))}
      />
      <div style={{ display: "flex", gap: "0.5rem", flexWrap: "wrap" }}>
        <input name="amount" type="number" min="0.01" step="0.01" placeholder="סכום ששולם" required style={inputStyle} />
        <CurrencySelect name="currencyCode" required preferredCurrencyCodes={preferredCurrencyCodes} style={{ ...inputStyle, flex: "1 1 140px" }} />
      </div>
      <Select
        name="paymentMethod"
        required
        style={inputStyle}
        defaultValue=""
        onChange={(v) => setPaymentMethod(v)}
        placeholder="אמצעי תשלום"
        options={Object.entries(PAYMENT_METHOD_LABELS).map(([value, label]) => ({ value, label }))}
      />
      {CARD_LINKED_METHODS.has(paymentMethod) ? (
        <Select
          name="cardId"
          style={inputStyle}
          defaultValue=""
          placeholder="בלי לקשר לכרטיס ספציפי"
          options={cards.map((card) => ({ value: card.id, label: card.cardName }))}
        />
      ) : null}
      {CARD_LINKED_METHODS.has(paymentMethod) && cards.length === 0 ? (
        <p style={{ fontSize: "0.75rem", color: "var(--color-text-muted)" }}>
          אין עדיין כרטיסים מוגדרים —{" "}
          <Link href="/payment-cards/new" style={{ color: "var(--color-primary)" }}>
            הוסף כרטיס
          </Link>
        </p>
      ) : null}
      {state?.formError ? <span style={{ color: "var(--color-danger)", fontSize: "0.8125rem" }}>{state.formError}</span> : null}
      <button type="submit" disabled={isPending} className="ui-btn-primary" style={submitButtonStyle(isPending)}>
        {isPending ? "שומר..." : "רשום תשלום"}
      </button>
    </form>
  );
}
