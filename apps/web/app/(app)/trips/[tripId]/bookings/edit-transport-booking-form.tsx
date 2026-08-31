"use client";

import { useActionState } from "react";
import type { Flight, TransportBooking } from "@travel-app/shared-types";
import { updateTransportBookingAction, type BookingFormState } from "./actions";
import { inputStyle, submitButtonStyle } from "./form-styles";
import { Select } from "@/components/ui/Select";
import { DateTimePicker } from "@/components/ui/DatePicker";

const initialState: BookingFormState = {};

/** עריכת פרטי-איסוף קיימים — נדרש כדי שאפשר יהיה להקדים/לאחר איסוף ואז לעדכן
 * את הנהג בפועל (SendDriverWhatsAppLink), לא רק ליצור הסעה חדשה. */
export function EditTransportBookingForm({
  tripId,
  transportBooking,
  flights,
}: {
  tripId: string;
  transportBooking: TransportBooking;
  flights: Flight[];
}) {
  const action = updateTransportBookingAction.bind(null, tripId, transportBooking.id);
  const [state, formAction, isPending] = useActionState(action, initialState);

  return (
    <details style={{ marginTop: "0.375rem" }}>
      <summary style={{ cursor: "pointer", fontSize: "0.8125rem", color: "var(--color-primary)" }}>✏️ עריכת איסוף</summary>
      <form action={formAction} style={{ display: "flex", flexDirection: "column", gap: "0.5rem", marginTop: "0.5rem", maxWidth: "420px" }}>
        <div style={{ display: "flex", gap: "0.5rem" }}>
          <input name="pickupText" placeholder="מקום איסוף" defaultValue={transportBooking.pickupText ?? ""} style={inputStyle} />
          <input name="dropoffText" placeholder="יעד" defaultValue={transportBooking.dropoffText ?? ""} style={inputStyle} />
        </div>
        <div style={{ display: "flex", gap: "0.5rem", flexWrap: "wrap" }}>
          <label style={{ flex: "1 1 140px", display: "flex", flexDirection: "column", gap: "0.25rem" }}>
            <span style={{ fontSize: "0.75rem", color: "var(--color-text-muted)" }}>שעת איסוף</span>
            <DateTimePicker name="pickupAt" defaultValue={transportBooking.pickupAt.slice(0, 16)} required />
          </label>
          <label style={{ flex: "1 1 140px", display: "flex", flexDirection: "column", gap: "0.25rem" }}>
            <span style={{ fontSize: "0.75rem", color: "var(--color-text-muted)" }}>אזור זמן</span>
            <input name="pickupTimezone" defaultValue={transportBooking.pickupTimezone} required style={inputStyle} />
          </label>
        </div>
        <div style={{ display: "flex", gap: "0.5rem" }}>
          <input name="driverName" placeholder="נהג" defaultValue={transportBooking.driverName ?? ""} style={inputStyle} />
          <input name="companyName" placeholder="חברה" defaultValue={transportBooking.companyName ?? ""} style={inputStyle} />
        </div>
        <div style={{ display: "flex", gap: "0.5rem" }}>
          <input name="phone" placeholder="טלפון נהג" defaultValue={transportBooking.phone ?? ""} style={inputStyle} />
          <input name="whatsapp" placeholder="WhatsApp נהג" defaultValue={transportBooking.whatsapp ?? ""} style={inputStyle} />
        </div>
        {flights.length > 0 ? (
          <label style={{ display: "flex", flexDirection: "column", gap: "0.25rem" }}>
            <span style={{ fontSize: "0.75rem", color: "var(--color-text-muted)" }}>טיסה מקושרת (אופציונלי — למסרון עם פרטי-נחיתה)</span>
            <Select
              name="linkedFlightId"
              defaultValue={transportBooking.linkedFlightId ?? ""}
              style={inputStyle}
              placeholder="ללא"
              options={flights.map((f) => ({ value: f.id, label: `${f.airline} ${f.flightNumber ?? ""} · ${f.arrivalAirport}` }))}
            />
          </label>
        ) : null}
        <input name="notes" placeholder="הערות" defaultValue={transportBooking.notes ?? ""} style={inputStyle} />
        {state?.formError ? <span style={{ color: "var(--color-danger)", fontSize: "0.8125rem" }}>{state.formError}</span> : null}
        <button type="submit" disabled={isPending} className="ui-btn-primary" style={submitButtonStyle(isPending)}>
          {isPending ? "שומר…" : "שמור שינויים"}
        </button>
      </form>
    </details>
  );
}
