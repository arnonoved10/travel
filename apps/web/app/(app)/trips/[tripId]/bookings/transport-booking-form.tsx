"use client";

import { useActionState, useEffect } from "react";
import type { Flight } from "@travel-app/shared-types";
import { createTransportBookingAction, type BookingFormState } from "./actions";
import { inputStyle, submitButtonStyle } from "./form-styles";
import { TRANSPORT_MODE_LABELS as MODE_LABELS } from "@/lib/transport-mode-labels";
import { VEHICLE_TYPE_LABELS } from "@/lib/vehicle-type-labels";
import { CurrencySelect } from "@/components/currency-select";
import { Select } from "@/components/ui/Select";
import { DateTimePicker } from "@/components/ui/DatePicker";

const initialState: BookingFormState = {};

export function TransportBookingForm({
  tripId,
  plannedActivityId = null,
  sourceQuoteId = null,
  defaultValues,
  preferredCurrencyCodes,
  flights = [],
  onSuccess,
}: {
  tripId: string;
  plannedActivityId?: string | null;
  sourceQuoteId?: string | null;
  defaultValues?: {
    pickupAt?: string;
    companyName?: string;
    vehicleType?: string;
    agreedPrice?: number;
    agreedCurrencyCode?: string;
  };
  preferredCurrencyCodes?: string[];
  flights?: Flight[];
  onSuccess?: (createdId: string) => void;
}) {
  const action = createTransportBookingAction.bind(null, tripId, plannedActivityId, sourceQuoteId);
  const [state, formAction, isPending] = useActionState(action, initialState);

  useEffect(() => {
    if (state !== initialState && !state.formError && !state.fieldErrors && state.createdId) onSuccess?.(state.createdId);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [state]);

  return (
    <form action={formAction} style={{ display: "flex", flexDirection: "column", gap: "0.5rem" }}>
      {sourceQuoteId ? (
        <p style={{ margin: 0, fontSize: "0.75rem", color: "var(--color-text-muted)" }}>
          ממלא מראש לפי הצעת המחיר שנבחרה — אפשר לערוך לפני שמירה.
        </p>
      ) : null}
      <Select
        name="mode"
        required
        style={inputStyle}
        defaultValue=""
        placeholder="סוג הסעה"
        options={Object.entries(MODE_LABELS).map(([value, label]) => ({ value, label }))}
      />
      <div style={{ display: "flex", gap: "0.5rem", flexWrap: "wrap" }}>
        <input name="pickupText" placeholder="מקום איסוף" style={inputStyle} />
        <input name="dropoffText" placeholder="יעד" style={inputStyle} />
      </div>
      <div style={{ display: "flex", gap: "0.5rem", flexWrap: "wrap" }}>
        <label style={{ flex: "1 1 140px", display: "flex", flexDirection: "column", gap: "0.25rem" }}>
          <span style={{ fontSize: "0.75rem", color: "var(--color-text-muted)" }}>שעת איסוף</span>
          <DateTimePicker name="pickupAt" defaultValue={defaultValues?.pickupAt} required />
        </label>
        <label style={{ flex: "1 1 140px", display: "flex", flexDirection: "column", gap: "0.25rem" }}>
          <span style={{ fontSize: "0.75rem", color: "var(--color-text-muted)" }}>אזור זמן</span>
          <input name="pickupTimezone" placeholder="Asia/Bangkok" required style={inputStyle} />
        </label>
      </div>
      <label style={{ display: "flex", flexDirection: "column", gap: "0.25rem" }}>
        <span style={{ fontSize: "0.75rem", color: "var(--color-text-muted)" }}>שעת הגעה משוערת (ETA)</span>
        <DateTimePicker name="etaAt" />
      </label>
      <div style={{ display: "flex", gap: "0.5rem", flexWrap: "wrap" }}>
        <input name="driverName" placeholder="נהג" style={inputStyle} />
        <input name="companyName" placeholder="חברה" defaultValue={defaultValues?.companyName} style={inputStyle} />
        <Select
          name="vehicleType"
          defaultValue={defaultValues?.vehicleType ?? ""}
          style={inputStyle}
          placeholder="סוג רכב (אופציונלי)"
          options={Object.entries(VEHICLE_TYPE_LABELS).map(([value, label]) => ({ value, label }))}
        />
      </div>
      {flights.length > 0 ? (
        <Select
          name="linkedFlightId"
          defaultValue=""
          style={inputStyle}
          placeholder="לא קשור לטיסה ספציפית"
          options={flights.map((f) => ({ value: f.id, label: `קישור לטיסה: ${f.airline} ${f.flightNumber ?? ""} · ${f.arrivalAirport}` }))}
        />
      ) : null}
      <div style={{ display: "flex", gap: "0.5rem", flexWrap: "wrap" }}>
        <input
          name="agreedPrice"
          type="number"
          min="0"
          step="0.01"
          placeholder="מחיר שסוכם"
          defaultValue={defaultValues?.agreedPrice}
          style={inputStyle}
        />
        <CurrencySelect
          name="agreedCurrencyCode"
          defaultValue={defaultValues?.agreedCurrencyCode}
          preferredCurrencyCodes={preferredCurrencyCodes}
          style={{ ...inputStyle, flex: "1 1 140px" }}
        />
      </div>
      <div style={{ display: "flex", gap: "0.5rem", flexWrap: "wrap" }}>
        <input name="tollFees" type="number" min="0" step="0.01" placeholder="כבישי אגרה" style={inputStyle} />
        <input name="parkingFees" type="number" min="0" step="0.01" placeholder="חניה" style={inputStyle} />
      </div>
      <input name="vehicleOnBoard" placeholder="כלי רכב על הסיפון (למעבורות, אופציונלי — למשל: קטנוע שכור)" style={inputStyle} />
      <input name="seat" placeholder="מושב (למעבורות/הסעות, אופציונלי)" style={inputStyle} />
      <div style={{ display: "flex", gap: "0.5rem", flexWrap: "wrap" }}>
        <input name="externalBookingId" placeholder="מספר הזמנה חיצוני" style={inputStyle} />
        <input name="cancellationPolicy" placeholder="מדיניות ביטול" style={inputStyle} />
      </div>
      <div style={{ display: "flex", gap: "0.5rem", flexWrap: "wrap" }}>
        <input name="phone" placeholder="טלפון" style={inputStyle} />
        <input name="whatsapp" placeholder="WhatsApp" style={inputStyle} />
        <input name="email" type="email" placeholder="אימייל" style={inputStyle} />
        <input name="website" placeholder="אתר" style={inputStyle} />
      </div>
      {state?.formError ? <span style={{ color: "var(--color-danger)", fontSize: "0.8125rem" }}>{state.formError}</span> : null}
      <button type="submit" disabled={isPending} className="ui-btn-primary" style={submitButtonStyle(isPending)}>
        {isPending ? "שומר..." : "הוסף הסעה"}
      </button>
    </form>
  );
}
