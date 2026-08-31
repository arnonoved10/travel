"use client";

import { useActionState } from "react";
import { DEFAULT_EXPENSE_CATEGORIES } from "@/lib/expense-labels";
import { upsertBudgetCategoryLimitAction, type FinanceFormState } from "./actions";
import { inputStyle, submitButtonStyle } from "../bookings/form-styles";

const initialState: FinanceFormState = {};

export function BudgetCategoryLimitForm({ tripId }: { tripId: string }) {
  const action = upsertBudgetCategoryLimitAction.bind(null, tripId);
  const [state, formAction, isPending] = useActionState(action, initialState);

  return (
    <form action={formAction} style={{ display: "flex", gap: "0.5rem", flexWrap: "wrap", alignItems: "flex-end", marginTop: "0.5rem" }}>
      <label style={{ display: "flex", flexDirection: "column", gap: "0.25rem", fontSize: "0.8125rem" }}>
        קטגוריה
        <input name="category" list="budget-category-suggestions" required style={{ ...inputStyle, maxWidth: "160px" }} />
        <datalist id="budget-category-suggestions">
          {DEFAULT_EXPENSE_CATEGORIES.map((category) => (
            <option key={category} value={category} />
          ))}
        </datalist>
      </label>
      <label style={{ display: "flex", flexDirection: "column", gap: "0.25rem", fontSize: "0.8125rem" }}>
        תקציב הקטגוריה (₪)
        <input name="limitAmount" type="number" step="1" min="0" required style={{ ...inputStyle, maxWidth: "140px" }} />
      </label>
      <button type="submit" disabled={isPending} className="ui-btn-primary" style={submitButtonStyle(isPending)}>
        {isPending ? "שומר..." : "הוסף/עדכן תקציב קטגוריה"}
      </button>
      {state?.formError ? <span style={{ color: "var(--color-danger)", fontSize: "0.8125rem" }}>{state.formError}</span> : null}
    </form>
  );
}
