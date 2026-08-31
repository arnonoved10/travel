"use client";

import { useActionState } from "react";
import { createActivityReservationAction, type BookingFormState } from "./actions";
import { inputStyle, submitButtonStyle } from "./form-styles";
import { CurrencySelect } from "@/components/currency-select";
import { DatePicker } from "@/components/ui/DatePicker";

const initialState: BookingFormState = {};

export function ActivityReservationForm({
  tripId,
  plannedActivityId = null,
  defaultValues,
  preferredCurrencyCodes,
}: {
  tripId: string;
  plannedActivityId?: string | null;
  defaultValues?: { venueName?: string };
  preferredCurrencyCodes?: string[];
}) {
  const action = createActivityReservationAction.bind(null, tripId, plannedActivityId);
  const [state, formAction, isPending] = useActionState(action, initialState);

  return (
    <form action={formAction} style={{ display: "flex", flexDirection: "column", gap: "0.5rem" }}>
      <div style={{ display: "flex", gap: "0.5rem" }}>
        <input name="venueName" placeholder="שם האתר/האטרקציה" defaultValue={defaultValues?.venueName} required style={inputStyle} />
        <input name="ticketType" placeholder="סוג כרטיס" style={inputStyle} />
      </div>
      {state?.fieldErrors?.venueName?.map((m) => (
        <ErrorText key={m}>{m}</ErrorText>
      ))}
      <div style={{ display: "flex", gap: "0.5rem", flexWrap: "wrap" }}>
        <DatePicker name="activityDate" required style={{ minWidth: "140px" }} />
        <input name="activityTime" type="time" style={{ ...inputStyle, minWidth: "110px" }} title="שעת כניסה" />
      </div>
      {state?.fieldErrors?.activityDate?.map((m) => (
        <ErrorText key={m}>{m}</ErrorText>
      ))}
      <div style={{ display: "flex", gap: "0.5rem", flexWrap: "wrap" }}>
        <input name="agreedPrice" type="number" min="0" step="0.01" placeholder="מחיר שסוכם" style={inputStyle} />
        <CurrencySelect name="agreedCurrencyCode" preferredCurrencyCodes={preferredCurrencyCodes} style={{ ...inputStyle, width: "170px" }} />
      </div>
      <input name="confirmationDetails" placeholder="פרטי אישור/הזמנה" style={inputStyle} />
      <textarea name="notes" placeholder="הערות" style={{ ...inputStyle, minHeight: "3rem" }} />
      {state?.formError ? <ErrorText>{state.formError}</ErrorText> : null}
      <button type="submit" disabled={isPending} className="ui-btn-primary" style={submitButtonStyle(isPending)}>
        {isPending ? "שומר..." : "הוסף אטרקציה/כרטיס"}
      </button>
    </form>
  );
}

function ErrorText({ children }: { children: React.ReactNode }) {
  return <span style={{ color: "var(--color-danger)", fontSize: "0.8125rem" }}>{children}</span>;
}
