"use client";

import { useActionState } from "react";
import { createPlannedActivityAction, type PlannedActivityFormState } from "./actions";
import { inputStyle, submitButtonStyle } from "../bookings/form-styles";
import { DateTimePicker } from "@/components/ui/DatePicker";

const initialState: PlannedActivityFormState = {};

export function PlannedActivityCreateForm({ tripId }: { tripId: string }) {
  const action = createPlannedActivityAction.bind(null, tripId);
  const [state, formAction, isPending] = useActionState(action, initialState);

  return (
    <form action={formAction} style={{ display: "flex", flexDirection: "column", gap: "0.5rem" }}>
      <div style={{ display: "flex", gap: "0.5rem" }}>
        <input name="name" placeholder="שם הפעילות" required style={inputStyle} />
        <input name="activityType" placeholder="קטגוריה (אופציונלי)" style={inputStyle} />
      </div>
      <div style={{ display: "flex", gap: "0.5rem", flexWrap: "wrap" }}>
        <DateTimePicker name="plannedAt" style={{ minWidth: "160px" }} />
        <input name="estimatedDurationMinutes" type="number" min="1" step="1" placeholder="משך (דקות)" style={inputStyle} />
      </div>
      <div style={{ display: "flex", gap: "0.5rem" }}>
        <input name="estimatedPrice" type="number" min="0" step="0.01" placeholder="מחיר משוער" style={inputStyle} />
        <input name="estimatedCurrencyCode" placeholder="מטבע" maxLength={3} style={{ ...inputStyle, maxWidth: "90px" }} />
      </div>
      <textarea name="notes" placeholder="הערות" rows={2} style={{ ...inputStyle, resize: "vertical" }} />

      {state?.fieldErrors?.name?.map((m) => (
        <span key={m} style={{ color: "var(--color-danger)", fontSize: "0.8125rem" }}>
          {m}
        </span>
      ))}
      {state?.formError ? <span style={{ color: "var(--color-danger)", fontSize: "0.8125rem" }}>{state.formError}</span> : null}
      <button type="submit" disabled={isPending} className="ui-btn-primary" style={submitButtonStyle(isPending)}>
        {isPending ? "שומר..." : "הוסף לתכנון"}
      </button>
    </form>
  );
}
