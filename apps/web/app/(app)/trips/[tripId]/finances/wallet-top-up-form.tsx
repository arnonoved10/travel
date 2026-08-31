"use client";

import { useActionState, useEffect } from "react";
import { topUpWalletAction, type FinanceFormState } from "./actions";
import { inputStyle, submitButtonStyle } from "../bookings/form-styles";
import { CurrencySelect } from "@/components/currency-select";

const initialState: FinanceFormState = {};

export function WalletTopUpForm({
  tripId,
  preferredCurrencyCodes,
  onSuccess,
}: {
  tripId: string;
  preferredCurrencyCodes?: string[];
  /** נקרא אחרי שמירה מוצלחת — להוספה-מהירה (quick-add-panel-content.tsx) שרוצה
   * לסגור/לאפס את עצמה בלי לחכות לניווט-עמוד. */
  onSuccess?: (createdId: string) => void;
}) {
  const action = topUpWalletAction.bind(null, tripId);
  const [state, formAction, isPending] = useActionState(action, initialState);

  useEffect(() => {
    if (state !== initialState && !state.formError && !state.fieldErrors && state.createdId) onSuccess?.(state.createdId);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [state]);

  return (
    <form action={formAction} style={{ display: "flex", gap: "0.5rem", flexWrap: "wrap" }}>
      <CurrencySelect name="currencyCode" required preferredCurrencyCodes={preferredCurrencyCodes} style={{ ...inputStyle, maxWidth: "180px" }} />
      <input name="initialAmount" type="number" min="0" step="0.01" placeholder="סכום" required style={inputStyle} />
      <button type="submit" disabled={isPending} className="ui-btn-primary" style={submitButtonStyle(isPending)}>
        {isPending ? "מוסיף..." : "הוסף/טען ארנק"}
      </button>
      {state?.formError ? <span style={{ color: "var(--color-danger)", fontSize: "0.8125rem" }}>{state.formError}</span> : null}
      {state?.fieldErrors?.currencyCode?.map((m) => (
        <span key={m} style={{ color: "var(--color-danger)", fontSize: "0.8125rem" }}>
          {m}
        </span>
      ))}
    </form>
  );
}
