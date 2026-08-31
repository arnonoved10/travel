"use client";

import { useActionState } from "react";
import { createHotelStayFromSharedItemAction, type AssignSharedItemFormState } from "../../actions";
import { inputStyle, submitButtonStyle } from "@/app/(app)/trips/[tripId]/bookings/form-styles";
import { CurrencySelect } from "@/components/currency-select";
import { Select } from "@/components/ui/Select";
import { DatePicker } from "@/components/ui/DatePicker";
import type { HotelPrefill } from "@/lib/ocr/map-extracted-fields";

const initialState: AssignSharedItemFormState = {};

export function CreateHotelFromScanForm({ itemId, trips, prefill }: { itemId: string; trips: { id: string; name: string }[]; prefill: HotelPrefill }) {
  const action = createHotelStayFromSharedItemAction.bind(null, itemId);
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
      <input name="hotelName" placeholder="שם המלון" defaultValue={prefill.hotelName} required style={inputStyle} />
      <div style={{ display: "flex", gap: "0.5rem" }}>
        <DatePicker name="checkInDate" defaultValue={prefill.checkInDate} required />
        <DatePicker name="checkOutDate" required />
      </div>
      <div style={{ display: "flex", gap: "0.5rem" }}>
        <input name="agreedPrice" type="number" min="0" placeholder="מחיר כולל" defaultValue={prefill.agreedPrice} style={inputStyle} />
        <CurrencySelect name="agreedCurrencyCode" style={{ ...inputStyle, width: "170px" }} />
      </div>
      <input name="confirmationNumber" placeholder="מספר אישור" defaultValue={prefill.confirmationNumber} style={inputStyle} />
      <div style={{ display: "flex", gap: "0.5rem" }}>
        <input name="phone" placeholder="טלפון" defaultValue={prefill.phone} style={inputStyle} />
        <input name="email" type="email" placeholder="אימייל" defaultValue={prefill.email} style={inputStyle} />
      </div>
      {state?.formError ? <span style={{ color: "var(--color-danger)", fontSize: "0.8125rem" }}>{state.formError}</span> : null}
      <button type="submit" disabled={isPending} className="ui-btn-primary" style={submitButtonStyle(isPending)}>
        {isPending ? "יוצר…" : "צור הזמנת מלון וצרף את התמונה"}
      </button>
    </form>
  );
}
