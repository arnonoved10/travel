"use client";

import { useActionState, useEffect } from "react";
import { createCurrencyExchangeAction, type FinanceFormState } from "./actions";
import { inputStyle, submitButtonStyle } from "../bookings/form-styles";
import { CurrencySelect } from "@/components/currency-select";

const initialState: FinanceFormState = {};

export function CurrencyExchangeForm({
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
  const action = createCurrencyExchangeAction.bind(null, tripId);
  const [state, formAction, isPending] = useActionState(action, initialState);

  useEffect(() => {
    if (state !== initialState && !state.formError && !state.fieldErrors && state.createdId) onSuccess?.(state.createdId);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [state]);

  return (
    <form action={formAction} style={{ display: "flex", flexDirection: "column", gap: "0.5rem" }}>
      <div style={{ display: "flex", gap: "0.5rem", alignItems: "center", flexWrap: "wrap" }}>
        <input name="givenAmount" type="number" min="0.01" step="0.01" placeholder="נתתי" required style={inputStyle} />
        <CurrencySelect name="givenCurrencyCode" required preferredCurrencyCodes={preferredCurrencyCodes} style={{ ...inputStyle, maxWidth: "170px" }} />
        <span style={{ color: "var(--color-text-muted)" }}>→</span>
        <input name="receivedAmount" type="number" min="0.01" step="0.01" placeholder="קיבלתי" required style={inputStyle} />
        <CurrencySelect name="receivedCurrencyCode" required preferredCurrencyCodes={preferredCurrencyCodes} style={{ ...inputStyle, maxWidth: "170px" }} />
      </div>
      <input name="feeAmount" type="number" min="0" step="0.01" placeholder="עמלה (אופציונלי)" style={inputStyle} />
      {state?.fieldErrors?.actualRate?.map((m) => (
        <span key={m} style={{ color: "var(--color-danger)", fontSize: "0.8125rem" }}>
          {m}
        </span>
      ))}
      {state?.formError ? <span style={{ color: "var(--color-danger)", fontSize: "0.8125rem" }}>{state.formError}</span> : null}
      <button type="submit" disabled={isPending} className="ui-btn-primary" style={submitButtonStyle(isPending)}>
        {isPending ? "שומר..." : "בצע המרה"}
      </button>
    </form>
  );
}
