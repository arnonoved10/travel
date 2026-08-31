"use client";

import { useActionState, useRef, useState, useTransition } from "react";
import type { Place } from "@travel-app/shared-types";
import { addRouteStopAction, calculateRouteDistanceAction, type RouteStopFormState } from "./actions";
import { inputStyle, submitButtonStyle } from "../bookings/form-styles";
import { Select } from "@/components/ui/Select";
import { DateTimePicker } from "@/components/ui/DatePicker";

const initialState: RouteStopFormState = {};

const TRAVEL_MODE_LABELS: Record<string, string> = {
  walk: "הליכה",
  taxi: "מונית",
  public_transport: "תחבורה ציבורית",
  rental_car: "רכב שכור",
  other: "אחר",
};

export function RouteStopCreateForm({
  tripId,
  date,
  places,
  previousStopCoords,
}: {
  tripId: string;
  date: string;
  places: Place[];
  previousStopCoords: { lat: number; lng: number } | null;
}) {
  const action = addRouteStopAction.bind(null, tripId, date);
  const [state, formAction, isPending] = useActionState(action, initialState);
  const [selectedPlaceId, setSelectedPlaceId] = useState("");
  const [isCalculating, startCalculating] = useTransition();
  const [calcMessage, setCalcMessage] = useState<string | null>(null);
  const distanceInputRef = useRef<HTMLInputElement>(null);
  const timeInputRef = useRef<HTMLInputElement>(null);

  const selectedPlace = places.find((p) => p.id === selectedPlaceId);
  const canAutoCalculate = previousStopCoords !== null && selectedPlace?.lat != null && selectedPlace?.lng != null;

  function handleAutoCalculate(): void {
    if (!previousStopCoords || !selectedPlace?.lat || !selectedPlace?.lng) return;
    setCalcMessage(null);
    startCalculating(async () => {
      const response = await calculateRouteDistanceAction({
        fromLat: previousStopCoords.lat,
        fromLng: previousStopCoords.lng,
        toLat: selectedPlace.lat,
        toLng: selectedPlace.lng,
      });
      if (!response.ok) {
        setCalcMessage(response.error);
        return;
      }
      if (distanceInputRef.current) distanceInputRef.current.value = String(response.result.distanceKm);
      if (timeInputRef.current) timeInputRef.current.value = String(response.result.travelTimeMinutes);
      setCalcMessage(`חושב אוטומטית לפי נהיגה (${response.result.provider}) — אפשר לערוך ידנית.`);
    });
  }

  return (
    <form action={formAction} style={{ display: "flex", flexDirection: "column", gap: "0.5rem" }}>
      <Select
        name="placeId"
        required
        style={inputStyle}
        defaultValue=""
        onChange={(v) => setSelectedPlaceId(v)}
        placeholder="בחר מקום"
        options={places.map((place) => ({ value: place.id, label: place.name }))}
      />

      <div style={{ display: "flex", gap: "0.5rem", flexWrap: "wrap" }}>
        <label style={{ display: "flex", flexDirection: "column", gap: "0.25rem", flex: "1 1 140px" }}>
          <span style={{ fontSize: "0.75rem", color: "var(--color-text-muted)" }}>שעת הגעה מתוכננת</span>
          <DateTimePicker name="plannedArrivalAt" />
        </label>
        <label style={{ display: "flex", flexDirection: "column", gap: "0.25rem", flex: "1 1 140px" }}>
          <span style={{ fontSize: "0.75rem", color: "var(--color-text-muted)" }}>שעת יציאה מתוכננת</span>
          <DateTimePicker name="plannedDepartureAt" />
        </label>
      </div>

      <div style={{ display: "flex", gap: "0.5rem" }}>
        <Select
          name="travelMode"
          style={inputStyle}
          defaultValue=""
          placeholder="אמצעי הגעה (אופציונלי)"
          options={Object.entries(TRAVEL_MODE_LABELS).map(([value, label]) => ({ value, label }))}
        />
        <input ref={distanceInputRef} name="distanceKm" type="number" min="0" step="0.1" placeholder='מרחק (ק"מ)' style={inputStyle} />
        <input
          ref={timeInputRef}
          name="travelTimeMinutes"
          type="number"
          min="0"
          step="1"
          placeholder="זמן נסיעה (דק')"
          style={inputStyle}
        />
      </div>

      {previousStopCoords ? (
        <div style={{ display: "flex", flexDirection: "column", gap: "0.25rem" }}>
          <button
            type="button"
            disabled={!canAutoCalculate || isCalculating}
            onClick={handleAutoCalculate}
            style={{
              alignSelf: "flex-start",
              padding: "0.375rem 0.75rem",
              borderRadius: "var(--radius-full)",
              border: "1px solid var(--color-border)",
              background: "var(--color-surface)",
              color: canAutoCalculate ? "var(--color-text-primary)" : "var(--color-text-muted)",
              cursor: canAutoCalculate && !isCalculating ? "pointer" : "default",
              fontSize: "0.8125rem",
              fontWeight: 600,
            }}
          >
            {isCalculating ? "מחשב..." : "📏 חשב מרחק וזמן אוטומטית (נהיגה)"}
          </button>
          {calcMessage ? (
            <span style={{ fontSize: "0.75rem", color: "var(--color-text-muted)" }}>{calcMessage}</span>
          ) : null}
        </div>
      ) : null}

      {state?.fieldErrors?.placeId?.map((m) => (
        <span key={m} style={{ color: "var(--color-danger)", fontSize: "0.8125rem" }}>
          {m}
        </span>
      ))}
      {state?.formError ? <span style={{ color: "var(--color-danger)", fontSize: "0.8125rem" }}>{state.formError}</span> : null}
      <button type="submit" disabled={isPending} className="ui-btn-primary" style={submitButtonStyle(isPending)}>
        {isPending ? "מוסיף..." : "הוסף עצירה למסלול"}
      </button>
    </form>
  );
}
