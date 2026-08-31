"use client";

import { useActionState } from "react";
import type { Place } from "@travel-app/shared-types";
import { TRIP_PLACE_STATUS_LABELS } from "@/lib/trip-place-labels";
import { PLACE_CATEGORY_LABELS } from "@/lib/place-labels";
import { linkPlaceToTripAction, type TripPlaceFormState } from "./actions";
import { inputStyle, submitButtonStyle } from "../bookings/form-styles";
import { Select } from "@/components/ui/Select";

const initialState: TripPlaceFormState = {};

export function LinkPlaceForm({ tripId, availablePlaces }: { tripId: string; availablePlaces: Place[] }) {
  const action = linkPlaceToTripAction.bind(null, tripId);
  const [state, formAction, isPending] = useActionState(action, initialState);

  if (availablePlaces.length === 0) {
    return (
      <p style={{ color: "var(--color-text-muted)", fontSize: "0.875rem" }}>
        אין עדיין מקומות בספרייה שלך — הוסף מקום במסך &quot;מקומות&quot; קודם.
      </p>
    );
  }

  return (
    <form action={formAction} style={{ display: "flex", gap: "0.5rem", flexWrap: "wrap" }}>
      <Select
        name="placeId"
        required
        style={inputStyle}
        defaultValue=""
        placeholder="בחר מקום מהספרייה"
        options={availablePlaces.map((place) => ({ value: place.id, label: `${place.name} (${PLACE_CATEGORY_LABELS[place.category]})` }))}
      />
      <Select
        name="status"
        required
        style={inputStyle}
        defaultValue="want_to_go"
        options={Object.entries(TRIP_PLACE_STATUS_LABELS).map(([value, label]) => ({ value, label }))}
      />
      <button type="submit" disabled={isPending} className="ui-btn-primary" style={submitButtonStyle(isPending)}>
        {isPending ? "מוסיף..." : "הוסף לטיול"}
      </button>
      {state?.formError ? <span style={{ color: "var(--color-danger)", fontSize: "0.8125rem" }}>{state.formError}</span> : null}
    </form>
  );
}
