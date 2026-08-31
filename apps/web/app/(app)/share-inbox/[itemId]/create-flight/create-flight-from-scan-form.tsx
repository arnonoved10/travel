"use client";

import { useActionState } from "react";
import { createFlightFromSharedItemAction, type AssignSharedItemFormState } from "../../actions";
import { inputStyle, submitButtonStyle } from "@/app/(app)/trips/[tripId]/bookings/form-styles";
import { CurrencySelect } from "@/components/currency-select";
import { Select } from "@/components/ui/Select";
import { DateTimePicker } from "@/components/ui/DatePicker";
import type { FlightPrefill } from "@/lib/ocr/map-extracted-fields";

const initialState: AssignSharedItemFormState = {};

export function CreateFlightFromScanForm({ itemId, trips, prefill }: { itemId: string; trips: { id: string; name: string }[]; prefill: FlightPrefill }) {
  const action = createFlightFromSharedItemAction.bind(null, itemId);
  const [state, formAction, isPending] = useActionState(action, initialState);

  return (
    <form action={formAction} style={{ display: "flex", flexDirection: "column", gap: "0.5rem", maxWidth: "420px" }}>
      <Select
        name="tripId"
        required
        defaultValue=""
        style={inputStyle}
        placeholder="לאיזה טיול?"
        options={trips.map((trip) => ({ value: trip.id, label: trip.name }))}
      />
      <div style={{ display: "flex", gap: "0.5rem" }}>
        <input name="airline" placeholder="חברת תעופה" defaultValue={prefill.airline} required style={inputStyle} />
        <input name="flightNumber" placeholder="מספר טיסה" defaultValue={prefill.flightNumber} style={inputStyle} />
      </div>
      <div style={{ display: "flex", gap: "0.5rem" }}>
        <input name="departureAirport" placeholder="שדה יציאה (TLV)" required maxLength={4} style={inputStyle} />
        <input name="arrivalAirport" placeholder="שדה יעד (BKK)" required maxLength={4} style={inputStyle} />
      </div>
      <div style={{ display: "flex", gap: "0.5rem", flexWrap: "wrap" }}>
        <label style={{ flex: "1 1 140px", display: "flex", flexDirection: "column", gap: "0.25rem" }}>
          <span style={{ fontSize: "0.75rem", color: "var(--color-text-muted)" }}>המראה</span>
          <DateTimePicker name="departureAt" required />
        </label>
        <label style={{ flex: "1 1 140px", display: "flex", flexDirection: "column", gap: "0.25rem" }}>
          <span style={{ fontSize: "0.75rem", color: "var(--color-text-muted)" }}>נחיתה</span>
          <DateTimePicker name="arrivalAt" required />
        </label>
      </div>
      <p style={{ margin: 0, fontSize: "0.75rem", color: "var(--color-text-muted)" }}>
        שעות ההמראה/נחיתה לא זוהו אוטומטית מהתמונה (אין ל-OCR דרך אמינה לחלץ שעה) — יש להזין ידנית.
      </p>
      <div style={{ display: "flex", gap: "0.5rem" }}>
        <input name="departureTimezone" placeholder="אזור זמן יציאה (Asia/Jerusalem)" required style={inputStyle} />
        <input name="arrivalTimezone" placeholder="אזור זמן נחיתה (Asia/Bangkok)" required style={inputStyle} />
      </div>
      <div style={{ display: "flex", gap: "0.5rem" }}>
        <input name="agreedPrice" type="number" min="0" step="0.01" placeholder="מחיר שסוכם" defaultValue={prefill.agreedPrice} style={inputStyle} />
        <CurrencySelect name="agreedCurrencyCode" style={{ ...inputStyle, width: "170px" }} />
      </div>
      <input name="confirmationNumber" placeholder="מספר אישור" defaultValue={prefill.confirmationNumber} style={inputStyle} />
      <div style={{ display: "flex", gap: "0.5rem" }}>
        <input name="phone" placeholder="טלפון" defaultValue={prefill.phone} style={inputStyle} />
        <input name="email" type="email" placeholder="אימייל" defaultValue={prefill.email} style={inputStyle} />
      </div>
      {state?.formError ? <span style={{ color: "var(--color-danger)", fontSize: "0.8125rem" }}>{state.formError}</span> : null}
      <button type="submit" disabled={isPending} className="ui-btn-primary" style={submitButtonStyle(isPending)}>
        {isPending ? "יוצר…" : "צור טיסה וצרף את התמונה"}
      </button>
    </form>
  );
}
