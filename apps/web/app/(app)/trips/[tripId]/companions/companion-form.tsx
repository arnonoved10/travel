"use client";

import { useActionState } from "react";
import { createTripCompanionAction, type TripCompanionFormState } from "./actions";
import { inputStyle, submitButtonStyle } from "../bookings/form-styles";

const initialState: TripCompanionFormState = {};

export function TripCompanionForm({ tripId }: { tripId: string }) {
  const action = createTripCompanionAction.bind(null, tripId);
  const [state, formAction, isPending] = useActionState(action, initialState);

  return (
    <form action={formAction} style={{ display: "flex", gap: "0.5rem", flexWrap: "wrap", alignItems: "flex-end", marginTop: "0.5rem" }}>
      <label style={{ display: "flex", flexDirection: "column", gap: "0.25rem", fontSize: "0.8125rem", flex: 1, minWidth: "140px" }}>
        שם המלווה
        <input name="displayName" required style={inputStyle} />
      </label>
      <label style={{ display: "flex", flexDirection: "column", gap: "0.25rem", fontSize: "0.8125rem" }}>
        קרבה (אופציונלי)
        <input name="relation" placeholder="בן/בת זוג, חבר..." style={{ ...inputStyle, maxWidth: "160px" }} />
      </label>
      <button type="submit" disabled={isPending} className="ui-btn-primary" style={submitButtonStyle(isPending)}>
        {isPending ? "מוסיף..." : "הוסף מלווה"}
      </button>
      {state?.formError ? <span style={{ color: "var(--color-danger)", fontSize: "0.8125rem" }}>{state.formError}</span> : null}
    </form>
  );
}
