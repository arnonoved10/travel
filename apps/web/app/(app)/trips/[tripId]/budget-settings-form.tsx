"use client";

import { useActionState } from "react";
import type { Trip } from "@travel-app/shared-types";
import { updateTripBudgetAction, type TripFormState } from "../actions";
import { inputStyle, submitButtonStyle } from "./bookings/form-styles";

const initialState: TripFormState = {};

export function BudgetSettingsForm({ trip }: { trip: Trip }) {
  const action = updateTripBudgetAction.bind(null, trip.id);
  const [state, formAction, isPending] = useActionState(action, initialState);

  return (
    <form action={formAction} style={{ display: "flex", gap: "0.75rem", flexWrap: "wrap", alignItems: "flex-end" }}>
      <label style={{ display: "flex", flexDirection: "column", gap: "0.25rem", fontSize: "0.875rem" }}>
        תקציב כולל לטיול (₪)
        <input
          name="totalBudgetAmount"
          type="number"
          step="1"
          min="0"
          defaultValue={trip.totalBudgetAmount ?? ""}
          placeholder="לא הוגדר"
          style={{ ...inputStyle, maxWidth: "160px" }}
        />
      </label>
      <label style={{ display: "flex", flexDirection: "column", gap: "0.25rem", fontSize: "0.875rem" }}>
        תקציב יומי (₪)
        <input
          name="dailyBudgetAmount"
          type="number"
          step="1"
          min="0"
          defaultValue={trip.dailyBudgetAmount ?? ""}
          placeholder="לא הוגדר"
          style={{ ...inputStyle, maxWidth: "160px" }}
        />
      </label>
      <button type="submit" disabled={isPending} className="ui-btn-primary" style={submitButtonStyle(isPending)}>
        {isPending ? "שומר..." : "שמור תקציב"}
      </button>
      {state?.formError ? <span style={{ color: "var(--color-danger)", fontSize: "0.8125rem" }}>{state.formError}</span> : null}
    </form>
  );
}
