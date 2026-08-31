"use client";

import { useActionState } from "react";
import { RENTAL_VEHICLE_TYPE_LABELS } from "@/lib/rental-vehicle-type-labels";
import { createCarRentalAction, type BookingFormState } from "./actions";
import { inputStyle, submitButtonStyle } from "./form-styles";
import { CurrencySelect } from "@/components/currency-select";
import { Select } from "@/components/ui/Select";
import { DateTimePicker } from "@/components/ui/DatePicker";

const initialState: BookingFormState = {};

export function CarRentalForm({
  tripId,
  plannedActivityId = null,
  defaultValues,
  preferredCurrencyCodes,
}: {
  tripId: string;
  plannedActivityId?: string | null;
  defaultValues?: { companyName?: string; pickupAt?: string };
  preferredCurrencyCodes?: string[];
}) {
  const action = createCarRentalAction.bind(null, tripId, plannedActivityId);
  const [state, formAction, isPending] = useActionState(action, initialState);

  return (
    <form action={formAction} style={{ display: "flex", flexDirection: "column", gap: "0.5rem" }}>
      <div style={{ display: "flex", gap: "0.5rem", flexWrap: "wrap" }}>
        <Select
          name="vehicleType"
          required
          style={inputStyle}
          defaultValue=""
          placeholder="סוג רכב"
          options={Object.entries(RENTAL_VEHICLE_TYPE_LABELS).map(([value, label]) => ({ value, label }))}
        />
        <input name="companyName" placeholder="חברת השכרה" defaultValue={defaultValues?.companyName} required style={inputStyle} />
      </div>
      {state?.fieldErrors?.companyName?.map((m) => (
        <ErrorText key={m}>{m}</ErrorText>
      ))}
      <div style={{ display: "flex", gap: "0.5rem", flexWrap: "wrap" }}>
        <input name="model" placeholder="דגם" style={inputStyle} />
        <input name="licensePlate" placeholder="מספר רישוי" style={inputStyle} />
      </div>
      <div style={{ display: "flex", gap: "0.5rem", flexWrap: "wrap" }}>
        <label style={{ flex: "1 1 140px", display: "flex", flexDirection: "column", gap: "0.25rem" }}>
          <span style={{ fontSize: "0.75rem", color: "var(--color-text-muted)" }}>איסוף</span>
          <DateTimePicker name="pickupAt" defaultValue={defaultValues?.pickupAt} required />
        </label>
        <label style={{ flex: "1 1 140px", display: "flex", flexDirection: "column", gap: "0.25rem" }}>
          <span style={{ fontSize: "0.75rem", color: "var(--color-text-muted)" }}>אזור זמן</span>
          <input name="pickupTimezone" placeholder="Asia/Bangkok" required style={inputStyle} />
        </label>
      </div>
      {state?.fieldErrors?.pickupAt?.map((m) => (
        <ErrorText key={m}>{m}</ErrorText>
      ))}
      <label style={{ display: "flex", flexDirection: "column", gap: "0.25rem" }}>
        <span style={{ fontSize: "0.75rem", color: "var(--color-text-muted)" }}>החזרה (אופציונלי)</span>
        <DateTimePicker name="dropoffAt" />
      </label>
      {state?.fieldErrors?.dropoffAt?.map((m) => (
        <ErrorText key={m}>{m}</ErrorText>
      ))}
      <div style={{ display: "flex", gap: "0.5rem", flexWrap: "wrap" }}>
        <input name="depositAmount" type="number" min="0" step="0.01" placeholder="פיקדון" style={inputStyle} />
        <CurrencySelect name="depositCurrencyCode" preferredCurrencyCodes={preferredCurrencyCodes} style={{ ...inputStyle, flex: "1 1 140px" }} />
      </div>
      <div style={{ display: "flex", gap: "0.5rem", flexWrap: "wrap" }}>
        <input name="confirmationNumber" placeholder="מספר אישור" style={inputStyle} />
        <input name="externalBookingId" placeholder="מספר הזמנה חיצוני" style={inputStyle} />
      </div>
      <input name="cancellationPolicy" placeholder="מדיניות ביטול" style={inputStyle} />
      <div style={{ display: "flex", gap: "0.5rem", flexWrap: "wrap" }}>
        <input name="phone" placeholder="טלפון" style={inputStyle} />
        <input name="whatsapp" placeholder="WhatsApp" style={inputStyle} />
        <input name="email" type="email" placeholder="אימייל" style={inputStyle} />
        <input name="website" placeholder="אתר" style={inputStyle} />
      </div>
      <label style={{ display: "flex", alignItems: "center", gap: "0.375rem", fontSize: "0.875rem" }}>
        <input name="insuranceIncluded" type="checkbox" value="true" />
        ביטוח כלול
      </label>
      {state?.formError ? <ErrorText>{state.formError}</ErrorText> : null}
      <button type="submit" disabled={isPending} className="ui-btn-primary" style={submitButtonStyle(isPending)}>
        {isPending ? "שומר..." : "הוסף השכרה"}
      </button>
    </form>
  );
}

function ErrorText({ children }: { children: React.ReactNode }) {
  return <span style={{ color: "var(--color-danger)", fontSize: "0.8125rem" }}>{children}</span>;
}
