"use client";

import { useActionState, useEffect } from "react";
import { createFlightAction, type BookingFormState } from "./actions";
import { inputStyle, submitButtonStyle } from "./form-styles";
import { FLIGHT_LEG_TYPE_LABELS } from "@/lib/flight-leg-type-labels";
import { CurrencySelect } from "@/components/currency-select";
import { Select } from "@/components/ui/Select";
import { DateTimePicker } from "@/components/ui/DatePicker";

const initialState: BookingFormState = {};

export function FlightForm({
  tripId,
  plannedActivityId = null,
  defaultValues,
  preferredCurrencyCodes,
  onSuccess,
}: {
  tripId: string;
  plannedActivityId?: string | null;
  defaultValues?: { airline?: string; departureAt?: string };
  preferredCurrencyCodes?: string[];
  onSuccess?: (createdId: string) => void;
}) {
  const action = createFlightAction.bind(null, tripId, plannedActivityId);
  const [state, formAction, isPending] = useActionState(action, initialState);

  useEffect(() => {
    if (state !== initialState && !state.formError && !state.fieldErrors && state.createdId) onSuccess?.(state.createdId);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [state]);

  return (
    <form action={formAction} style={{ display: "flex", flexDirection: "column", gap: "0.5rem" }}>
      <div style={{ display: "flex", gap: "0.5rem", flexWrap: "wrap" }}>
        <input name="airline" placeholder="חברת תעופה" defaultValue={defaultValues?.airline} required style={inputStyle} />
        <input name="flightNumber" placeholder="מספר טיסה" style={inputStyle} />
      </div>
      {state?.fieldErrors?.airline?.map((m) => (
        <ErrorText key={m}>{m}</ErrorText>
      ))}
      <div style={{ display: "flex", gap: "0.5rem", flexWrap: "wrap" }}>
        <input name="departureAirport" placeholder="שדה יציאה (TLV)" required maxLength={4} style={inputStyle} />
        <input name="arrivalAirport" placeholder="שדה יעד (BKK)" required maxLength={4} style={inputStyle} />
      </div>
      <div style={{ display: "flex", gap: "0.5rem", flexWrap: "wrap" }}>
        <label style={{ flex: "1 1 140px", display: "flex", flexDirection: "column", gap: "0.25rem" }}>
          <span style={{ fontSize: "0.75rem", color: "var(--color-text-muted)" }}>המראה</span>
          <DateTimePicker name="departureAt" defaultValue={defaultValues?.departureAt} required />
        </label>
        <label style={{ flex: "1 1 140px", display: "flex", flexDirection: "column", gap: "0.25rem" }}>
          <span style={{ fontSize: "0.75rem", color: "var(--color-text-muted)" }}>נחיתה</span>
          <DateTimePicker name="arrivalAt" required />
        </label>
      </div>
      <div style={{ display: "flex", gap: "0.5rem", flexWrap: "wrap" }}>
        <input name="departureTimezone" placeholder="אזור זמן יציאה (Asia/Jerusalem)" required style={inputStyle} />
        <input name="arrivalTimezone" placeholder="אזור זמן נחיתה (Asia/Bangkok)" required style={inputStyle} />
      </div>
      {state?.fieldErrors?.arrivalAt?.map((m) => (
        <ErrorText key={m}>{m}</ErrorText>
      ))}
      <div style={{ display: "flex", gap: "0.5rem", flexWrap: "wrap" }}>
        <input name="departureTerminal" placeholder="טרמינל יציאה" style={inputStyle} />
        <input name="arrivalTerminal" placeholder="טרמינל נחיתה" style={inputStyle} />
      </div>
      <div style={{ display: "flex", gap: "0.5rem", flexWrap: "wrap" }}>
        <input name="seat" placeholder="מושב" style={inputStyle} />
        <input name="baggage" placeholder="כבודה (למשל 23kg)" style={inputStyle} />
      </div>
      <label style={{ display: "flex", flexDirection: "column", gap: "0.25rem" }}>
        <span style={{ fontSize: "0.75rem", color: "var(--color-text-muted)" }}>סוג טיסה</span>
        <Select
          name="legType"
          defaultValue="outbound"
          style={inputStyle}
          options={Object.entries(FLIGHT_LEG_TYPE_LABELS).map(([value, label]) => ({ value, label }))}
        />
      </label>
      <div style={{ display: "flex", gap: "0.5rem", flexWrap: "wrap" }}>
        <input name="agreedPrice" type="number" min="0" step="0.01" placeholder="מחיר שסוכם" style={inputStyle} />
        <CurrencySelect name="agreedCurrencyCode" preferredCurrencyCodes={preferredCurrencyCodes} style={{ ...inputStyle, flex: "1 1 140px" }} />
      </div>
      <div style={{ display: "flex", gap: "0.5rem", flexWrap: "wrap" }}>
        <input name="confirmationNumber" placeholder="מספר אישור" style={inputStyle} />
        <input name="externalBookingId" placeholder="מספר הזמנה חיצוני" style={inputStyle} />
      </div>
      <input name="cancellationPolicy" placeholder="מדיניות ביטול" style={inputStyle} />
      <div style={{ display: "flex", gap: "0.5rem", flexWrap: "wrap" }}>
        <input name="phone" placeholder="טלפון חברת התעופה" style={inputStyle} />
        <input name="whatsapp" placeholder="WhatsApp" style={inputStyle} />
        <input name="email" type="email" placeholder="אימייל" style={inputStyle} />
        <input name="website" placeholder="אתר" style={inputStyle} />
      </div>
      {state?.formError ? <ErrorText>{state.formError}</ErrorText> : null}
      <button type="submit" disabled={isPending} className="ui-btn-primary" style={submitButtonStyle(isPending)}>
        {isPending ? "שומר..." : "הוסף טיסה"}
      </button>
    </form>
  );
}

function ErrorText({ children }: { children: React.ReactNode }) {
  return <span style={{ color: "var(--color-danger)", fontSize: "0.8125rem" }}>{children}</span>;
}
