"use client";

import { useState } from "react";
import { haversineDistanceKm } from "@/lib/haversine-distance";
import { formatDistance } from "@/lib/distance-format";
import { PLACE_CATEGORY_LABELS } from "@/lib/place-labels";
import { TRIP_PLACE_STATUS_LABELS } from "@/lib/trip-place-labels";
import { NavigateButtons } from "@/components/navigate-buttons";
import { useAppPreferences } from "@/components/preferences-provider";
import { PermissionDeniedState, RequestLocationButton } from "@/components/blocked-state";
import { Select } from "@/components/ui/Select";
import { useGeolocation } from "@/lib/use-geolocation";

export interface NearbyCandidate {
  tripPlaceId: string;
  placeId: string;
  name: string;
  category: string;
  status: string;
  lat: number;
  lng: number;
}

const RANGE_OPTIONS_KM = [0.5, 1, 2, 3, 5, 10] as const;
const CUSTOM_RANGE = "custom";
const DEFAULT_RANGE_KM = 5;
const DEFAULT_CUSTOM_RANGE_KM = 20;
const MAX_RESULTS = 5;

function formatRangeLabel(km: number): string {
  return km < 1 ? `${Math.round(km * 1000)} מ׳` : `${km} ק״מ`;
}

/**
 * "מה קרוב אליי" — Geolocation API של הדפדפן (חינמי, בלי מפתח/שירות חיצוני)
 * + נוסחת Haversine למרחק. רץ רק בצד לקוח (navigator.geolocation לא קיים
 * ב-Server Component). בלי הרשאה/בלי מקומות עם קואורדינטות — הודעה כנה,
 * לא בדיה.
 */
export function NearbyPlaces({ candidates }: { candidates: NearbyCandidate[] }) {
  const { prefs } = useAppPreferences();
  const [geo, requestGeo] = useGeolocation();
  const [rangeSelection, setRangeSelection] = useState<string>(String(DEFAULT_RANGE_KM));
  const [customRangeKm, setCustomRangeKm] = useState<number>(DEFAULT_CUSTOM_RANGE_KM);
  const [category, setCategory] = useState<string>("");
  const rangeKm = rangeSelection === CUSTOM_RANGE ? customRangeKm : Number(rangeSelection);
  const categoriesInUse = Array.from(new Set(candidates.map((c) => c.category))).sort();

  if (candidates.length === 0) {
    return <p style={mutedStyle}>אין עדיין מקומות עם קואורדינטות מקושרים לטיול הזה.</p>;
  }

  if (geo.kind === "idle") {
    return <RequestLocationButton onRequest={requestGeo} label="📍 הצג מקומות קרובים אליי" />;
  }
  if (geo.kind === "loading") {
    return <p style={mutedStyle}>מאתר את המיקום שלך…</p>;
  }
  if (geo.kind === "unsupported") {
    return <PermissionDeniedState message="הדפדפן הזה לא תומך באיתור מיקום." />;
  }
  if (geo.kind === "denied") {
    return (
      <PermissionDeniedState
        message="לא ניתנה הרשאת מיקום — אי אפשר להציג מקומות קרובים בלי זה."
        onRetry={requestGeo}
        showInstructions
      />
    );
  }
  if (geo.kind === "error") {
    return <PermissionDeniedState message="לא הצלחנו לאתר את המיקום שלך כרגע." onRetry={requestGeo} />;
  }

  const nearby = candidates
    .filter((c) => !category || c.category === category)
    .map((c) => ({ ...c, distanceKm: haversineDistanceKm(geo.lat, geo.lng, c.lat, c.lng) }))
    .filter((c) => c.distanceKm <= rangeKm)
    .sort((a, b) => a.distanceKm - b.distanceKm)
    .slice(0, MAX_RESULTS);

  const rangePicker = (
    <div style={{ display: "flex", flexWrap: "wrap", gap: "0.75rem", marginBottom: "0.5rem" }}>
      <label style={{ display: "flex", alignItems: "center", gap: "0.375rem", fontSize: "0.75rem", color: "var(--color-text-muted)" }}>
        טווח חיפוש
        <Select
          value={rangeSelection}
          onChange={(v) => setRangeSelection(v)}
          style={pickerStyle}
          options={[
            ...RANGE_OPTIONS_KM.map((km) => ({ value: String(km), label: formatRangeLabel(km) })),
            { value: CUSTOM_RANGE, label: "מותאם אישית" },
          ]}
        />
        {rangeSelection === CUSTOM_RANGE ? (
          <input
            type="number"
            min="0.1"
            step="0.1"
            value={customRangeKm}
            onChange={(event) => setCustomRangeKm(Math.max(0.1, Number(event.target.value) || DEFAULT_CUSTOM_RANGE_KM))}
            style={{ ...pickerStyle, width: "70px" }}
            aria-label="טווח מותאם אישית בקילומטרים"
          />
        ) : null}
      </label>
      {categoriesInUse.length > 1 ? (
        <label style={{ display: "flex", alignItems: "center", gap: "0.375rem", fontSize: "0.75rem", color: "var(--color-text-muted)" }}>
          קטגוריה
          <Select
            value={category}
            onChange={(v) => setCategory(v)}
            style={pickerStyle}
            options={[
              { value: "", label: "הכל" },
              ...categoriesInUse.map((cat) => ({
                value: cat,
                label: PLACE_CATEGORY_LABELS[cat as keyof typeof PLACE_CATEGORY_LABELS] ?? cat,
              })),
            ]}
          />
        </label>
      ) : null}
    </div>
  );

  if (nearby.length === 0) {
    return (
      <div>
        {rangePicker}
        <p style={mutedStyle}>
          אין מקומות{category ? ` בקטגוריית ${PLACE_CATEGORY_LABELS[category as keyof typeof PLACE_CATEGORY_LABELS] ?? category}` : ""} מקושרים
          לטיול בטווח של {formatRangeLabel(rangeKm)} מהמיקום הנוכחי.
        </p>
      </div>
    );
  }

  return (
    <div>
      {rangePicker}
      <ul style={{ listStyle: "none", padding: 0, margin: 0, display: "flex", flexDirection: "column", gap: "0.5rem" }}>
        {nearby.map((c) => (
          <li key={c.tripPlaceId} style={{ display: "flex", justifyContent: "space-between", alignItems: "center", flexWrap: "wrap", gap: "0.5rem" }}>
            <div style={{ minWidth: 0 }}>
              <div style={{ fontWeight: 600 }}>{c.name}</div>
              <div style={mutedStyle}>
                {PLACE_CATEGORY_LABELS[c.category as keyof typeof PLACE_CATEGORY_LABELS] ?? c.category} ·{" "}
                {formatDistance(c.distanceKm, prefs.defaultDistanceUnit)} ·{" "}
                {TRIP_PLACE_STATUS_LABELS[c.status as keyof typeof TRIP_PLACE_STATUS_LABELS] ?? c.status}
              </div>
            </div>
            <NavigateButtons lat={c.lat} lng={c.lng} address={null} />
          </li>
        ))}
      </ul>
    </div>
  );
}

const mutedStyle: React.CSSProperties = { color: "var(--color-text-muted)", fontSize: "0.8125rem", margin: 0 };
const pickerStyle: React.CSSProperties = {
  padding: "0.125rem 0.375rem",
  borderRadius: "var(--radius-md)",
  border: "1px solid var(--color-border)",
  background: "var(--color-surface-elevated)",
  color: "var(--color-text-primary)",
  fontSize: "0.75rem",
};
