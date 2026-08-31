"use client";

import { useActionState, useState } from "react";
import Link from "next/link";
import type { Place } from "@travel-app/shared-types";
import { PLACE_CATEGORY_LABELS } from "@/lib/place-labels";
import { Select } from "@/components/ui/Select";
import type { PlaceSearchResult } from "@/lib/geocoding/google-place-search";
import { useGeolocation } from "@/lib/use-geolocation";
import { haversineDistanceKm } from "@/lib/haversine-distance";
import { MapView } from "./map-view";
import { PlaceSearchBox } from "./place-search-box";
import { createPlaceFromMapAction, type CreatePlaceFromMapState } from "./actions";

const initialState: CreatePlaceFromMapState = {};

const fieldStyle: React.CSSProperties = {
  flex: "1 1 140px",
  padding: "0.5rem 0.625rem",
  borderRadius: "var(--radius-md)",
  border: "1px solid var(--color-border)",
  background: "var(--color-surface-elevated)",
  color: "var(--color-text-primary)",
};

/** עוטף MapView עם מצב "סימון מקום חדש" — קליק על המפה פותח פאנל שם+קטגוריה.
 * tripId/tripName (מגיע מ-/map?tripId=... — קישור "חפש והוסף מקום חדש במפה"
 * בעמוד הטיול) מפעילים "מצב טיול": מקום חדש שנשמר מקושר אוטומטית לטיול
 * כ"רוצה לבקר", ר' createPlaceFromMapAction. */
export function MapPageInteractive({
  places,
  center,
  zoom,
  tripId,
  tripName,
}: {
  places: Place[];
  center: [number, number];
  zoom: number;
  tripId?: string;
  tripName?: string;
}) {
  const [isPicking, setIsPicking] = useState(false);
  const [pendingPoint, setPendingPoint] = useState<{ lat: number; lng: number } | null>(null);
  const [pendingName, setPendingName] = useState("");
  const [pendingCountry, setPendingCountry] = useState("");
  const [pendingCity, setPendingCity] = useState("");
  const [pendingCategory, setPendingCategory] = useState("");
  const [flyToTarget, setFlyToTarget] = useState<{ lat: number; lng: number } | null>(null);
  const [state, formAction, isPending] = useActionState(createPlaceFromMapAction, initialState);
  const [geo, requestGeo] = useGeolocation();

  const distanceKm =
    pendingPoint && geo.kind === "ready" ? haversineDistanceKm(geo.lat, geo.lng, pendingPoint.lat, pendingPoint.lng) : null;

  // אחרי יצירה מוצלחת: לסגור את הפאנל ולכבות מצב-סימון. עדכון state בזמן
  // render (לא useEffect) — אותו pattern בדיוק כמו ב-planned-activities-view.tsx.
  const [lastSuccess, setLastSuccess] = useState(state.success);
  if (state.success !== lastSuccess) {
    setLastSuccess(state.success);
    if (state.success) {
      setPendingPoint(null);
      setPendingName("");
      setPendingCountry("");
      setPendingCity("");
      setPendingCategory("");
      setIsPicking(false);
    }
  }

  // בחירת תוצאה מהחיפוש (בקשת משתמש: "זה צריך גם לעבוד במפה") — פותחת את
  // אותו פאנל שם+קטגוריה כמו קליק-על-המפה, עם השם מוצע מראש, וטסה למקום.
  // אובייקט flyTo חדש בכל בחירה (גם לאותן קואורדינטות) כדי שה-effect יופעל תמיד.
  function handleSearchSelect(result: PlaceSearchResult): void {
    setPendingPoint({ lat: result.lat, lng: result.lng });
    setPendingName(result.placeName.split(",")[0]?.trim() || result.placeName);
    setPendingCountry(result.country ?? "");
    setPendingCity(result.city ?? "");
    setPendingCategory(result.category ?? "");
    setFlyToTarget({ lat: result.lat, lng: result.lng });
  }

  return (
    <div style={{ position: "relative", height: "60vh", minHeight: "320px", borderRadius: "10px", overflow: "hidden", border: "1px solid var(--color-border)" }}>
      <button
        type="button"
        onClick={() => {
          setIsPicking((prev) => !prev);
          setPendingPoint(null);
        }}
        style={{
          position: "absolute",
          top: "10px",
          insetInlineEnd: "10px",
          zIndex: 1000,
          padding: "0.5rem 0.75rem",
          borderRadius: "var(--radius-full)",
          border: isPicking ? "1px solid var(--color-primary)" : "1px solid #ccc",
          background: isPicking ? "var(--color-primary)" : "#fff",
          color: isPicking ? "#fff" : "#111",
          cursor: "pointer",
          fontSize: "0.8125rem",
          fontWeight: 600,
          boxShadow: "0 2px 6px rgba(0,0,0,0.25)",
        }}
      >
        {isPicking ? "✕ בטל סימון" : "📍 סמן מקום חדש על המפה"}
      </button>

      {tripId ? (
        <div
          style={{
            position: "absolute",
            top: "56px",
            insetInlineStart: "10px",
            insetInlineEnd: "10px",
            zIndex: 1000,
            display: "flex",
            flexWrap: "wrap",
            alignItems: "center",
            gap: "0.5rem",
            padding: "0.375rem 0.625rem",
            borderRadius: "var(--radius-md)",
            background: "var(--color-surface-solid)",
            fontSize: "0.75rem",
            boxShadow: "0 2px 6px rgba(0,0,0,0.25)",
          }}
        >
          <span>מוסיף מקומות לטיול: {tripName ?? "הטיול"}</span>
          <Link href={`/trips/${tripId}#days`} style={{ color: "var(--color-primary)" }}>
            מסלולים לפי יום
          </Link>
          <Link href="/map" style={{ color: "var(--color-text-muted)", marginInlineStart: "auto" }}>
            ✕ יציאה
          </Link>
        </div>
      ) : null}

      <div style={{ position: "absolute", top: tripId ? "100px" : "56px", insetInlineStart: "10px", insetInlineEnd: "10px", zIndex: 999 }}>
        <PlaceSearchBox onSelect={handleSearchSelect} />
      </div>

      <MapView
        places={places}
        center={center}
        zoom={zoom}
        onMapClick={isPicking ? (lat, lng) => setPendingPoint({ lat, lng }) : undefined}
        pendingPoint={pendingPoint}
        pendingLabel={pendingName || undefined}
        flyToTarget={flyToTarget}
      />

      {pendingPoint ? (
        <form
          action={formAction}
          style={{
            position: "absolute",
            bottom: "10px",
            insetInlineStart: "10px",
            insetInlineEnd: "10px",
            zIndex: 1000,
            background: "var(--color-surface)",
            border: "1px solid var(--color-border)",
            borderRadius: "10px",
            padding: "0.75rem",
            display: "flex",
            flexWrap: "wrap",
            gap: "0.5rem",
            alignItems: "flex-start",
            boxShadow: "0 4px 16px rgba(0,0,0,0.25)",
          }}
        >
          <input type="hidden" name="lat" value={pendingPoint.lat} />
          <input type="hidden" name="lng" value={pendingPoint.lng} />
          {pendingCountry ? <input type="hidden" name="country" value={pendingCountry} /> : null}
          {pendingCity ? <input type="hidden" name="city" value={pendingCity} /> : null}
          {tripId ? <input type="hidden" name="tripId" value={tripId} /> : null}
          <input
            name="name"
            value={pendingName}
            onChange={(e) => setPendingName(e.target.value)}
            placeholder="שם המקום"
            required
            style={fieldStyle}
          />
          {state.fieldErrors?.name?.map((m) => (
            <span key={m} style={{ color: "var(--color-danger)", fontSize: "0.75rem", width: "100%" }}>
              {m}
            </span>
          ))}
          <Select
            name="category"
            required
            value={pendingCategory}
            onChange={setPendingCategory}
            style={fieldStyle}
            placeholder="קטגוריה"
            options={Object.entries(PLACE_CATEGORY_LABELS).map(([value, label]) => ({ value, label }))}
          />
          {distanceKm !== null ? (
            <span style={{ fontSize: "0.75rem", color: "var(--color-text-muted)", width: "100%" }}>
              כ-{distanceKm < 10 ? distanceKm.toFixed(1) : Math.round(distanceKm)} ק״מ מהמיקום שלך
            </span>
          ) : geo.kind !== "unsupported" ? (
            <button
              type="button"
              onClick={requestGeo}
              disabled={geo.kind === "loading"}
              style={{
                padding: "0.25rem 0.625rem",
                borderRadius: "var(--radius-full)",
                border: "1px solid var(--color-border)",
                background: "transparent",
                color: "var(--color-text-muted)",
                cursor: geo.kind === "loading" ? "default" : "pointer",
                fontSize: "0.75rem",
              }}
            >
              {geo.kind === "loading" ? "מאתר…" : geo.kind === "denied" ? "אין הרשאת מיקום" : "📍 הצג מרחק מהמיקום שלי"}
            </button>
          ) : null}
          <button
            type="submit"
            disabled={isPending}
            style={{
              padding: "0.5rem 1rem",
              borderRadius: "var(--radius-full)",
              border: "none",
              background: isPending ? "var(--color-secondary)" : "var(--gradient-brand)",
              color: isPending ? "var(--color-text-muted)" : "#fff",
              fontWeight: 700,
              cursor: isPending ? "default" : "pointer",
              boxShadow: isPending ? "none" : "var(--glow-brand)",
            }}
          >
            {isPending ? "שומר…" : "שמור"}
          </button>
          <button
            type="button"
            onClick={() => {
              setPendingPoint(null);
              setPendingName("");
              setPendingCountry("");
              setPendingCity("");
              setPendingCategory("");
            }}
            style={{
              padding: "0.5rem 1rem",
              borderRadius: "var(--radius-full)",
              border: "1px solid var(--color-border)",
              background: "var(--color-surface)",
              color: "var(--color-text-primary)",
              cursor: "pointer",
            }}
          >
            ביטול
          </button>
          {state.formError ? (
            <span style={{ color: "var(--color-danger)", fontSize: "0.8125rem", width: "100%" }}>{state.formError}</span>
          ) : null}
        </form>
      ) : null}
    </div>
  );
}
