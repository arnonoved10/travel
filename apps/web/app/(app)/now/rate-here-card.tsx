"use client";

import { useActionState } from "react";
import { PLACE_CATEGORY_LABELS } from "@/lib/place-labels";
import { PermissionDeniedState, RequestLocationButton } from "@/components/blocked-state";
import { Select } from "@/components/ui/Select";
import { useGeolocation } from "@/lib/use-geolocation";
import { rateCurrentLocationAction, type RateHereFormState } from "./actions";

const initialState: RateHereFormState = {};

const inputStyle: React.CSSProperties = {
  padding: "0.5rem 0.75rem",
  borderRadius: "var(--radius-md)",
  border: "1px solid var(--color-border)",
  background: "var(--color-surface-elevated)",
  color: "var(--color-text-primary)",
};

// אותו דפוס בדיוק כמו NearbyPlaces/NearestMedical — Geolocation API חינמי,
// בלי שירות חיצוני. המטרה: לדרג ולהוסיף הערה על המקום שאתה נמצא בו ממש
// עכשיו, גם אם הוא עוד לא שמור בספריית המקומות שלך.
export function RateHereCard({ tripId }: { tripId: string }) {
  const [geo, requestGeo] = useGeolocation();
  const action = rateCurrentLocationAction.bind(null, tripId);
  const [state, formAction, isPending] = useActionState(action, initialState);

  if (geo.kind === "idle") return <RequestLocationButton onRequest={requestGeo} label="📍 דרג את המקום שבו אני נמצא עכשיו" />;
  if (geo.kind === "loading") return <p style={mutedStyle}>מאתר את המיקום שלך…</p>;
  if (geo.kind === "unsupported") return <PermissionDeniedState message="הדפדפן הזה לא תומך באיתור מיקום — אי אפשר לדרג לפי המקום שאתה נמצא בו." />;
  if (geo.kind === "denied")
    return (
      <PermissionDeniedState
        message="לא ניתנה הרשאת מיקום — אי אפשר לדרג לפי המקום שאתה נמצא בו."
        onRetry={requestGeo}
        showInstructions
      />
    );
  if (geo.kind === "error") return <PermissionDeniedState message="לא הצלחנו לאתר את המיקום שלך כרגע." onRetry={requestGeo} />;

  if (state.success) {
    return (
      <div style={{ display: "flex", flexDirection: "column", gap: "0.5rem" }}>
        <p style={{ margin: 0, fontWeight: 600 }}>✅ נשמר! המקום נוסף לספרייה וסומן כ&quot;ביקרתי&quot; בטיול הזה.</p>
        <RateHereForm tripId={tripId} lat={geo.lat} lng={geo.lng} formAction={formAction} state={initialState} isPending={isPending} />
      </div>
    );
  }

  return <RateHereForm tripId={tripId} lat={geo.lat} lng={geo.lng} formAction={formAction} state={state} isPending={isPending} />;
}

function RateHereForm({
  lat,
  lng,
  formAction,
  state,
  isPending,
}: {
  tripId: string;
  lat: number;
  lng: number;
  formAction: (formData: FormData) => void;
  state: RateHereFormState;
  isPending: boolean;
}) {
  return (
    <form action={formAction} style={{ display: "flex", flexDirection: "column", gap: "0.5rem" }}>
      <input type="hidden" name="lat" value={lat} />
      <input type="hidden" name="lng" value={lng} />
      <input name="name" placeholder="שם המקום" required style={inputStyle} />
      {state.fieldErrors?.name?.map((m) => (
        <span key={m} style={errorStyle}>
          {m}
        </span>
      ))}
      <Select
        name="category"
        required
        defaultValue=""
        style={inputStyle}
        placeholder="קטגוריה"
        options={Object.entries(PLACE_CATEGORY_LABELS).map(([value, label]) => ({ value, label }))}
      />
      <Select
        name="personalRating"
        defaultValue=""
        style={inputStyle}
        options={[
          { value: "", label: "בלי דירוג" },
          ...[1, 2, 3, 4, 5].map((n) => ({ value: String(n), label: "★".repeat(n) })),
        ]}
      />
      <textarea name="generalNotes" placeholder="הערות (אופציונלי)" rows={2} style={{ ...inputStyle, resize: "vertical" }} />
      {state.formError ? <span style={errorStyle}>{state.formError}</span> : null}
      <button
        type="submit"
        disabled={isPending}
        style={{
          padding: "0.5rem",
          borderRadius: "var(--radius-full)",
          border: "none",
          background: isPending ? "var(--color-secondary)" : "var(--gradient-brand)",
          color: isPending ? "var(--color-text-muted)" : "#fff",
          fontWeight: 700,
          cursor: isPending ? "default" : "pointer",
          boxShadow: isPending ? "none" : "var(--glow-brand)",
          transition: "all var(--duration-base) var(--ease-out)",
        }}
      >
        {isPending ? "שומר…" : "שמור ודרג"}
      </button>
    </form>
  );
}

const mutedStyle: React.CSSProperties = { color: "var(--color-text-muted)", fontSize: "0.8125rem", margin: 0 };
const errorStyle: React.CSSProperties = { color: "var(--color-danger)", fontSize: "0.8125rem" };
