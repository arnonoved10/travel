"use client";

import { useEffect, useMemo, useState } from "react";
import dynamic from "next/dynamic";
import type { PlaceCategory } from "@travel-app/shared-types";
import { haversineDistanceKm } from "@/lib/haversine-distance";
import { Distance } from "@/components/distance";
import { PermissionDeniedState, RequestLocationButton } from "@/components/blocked-state";
import { useGeolocation } from "@/lib/use-geolocation";
import { getLiveDistancesAction } from "./actions";

// Leaflet נוגע ב-window/document ישירות — לא ניתן ל-render בצד שרת. אותו
// דפוס בדיוק כמו apps/web/app/(app)/map/map-view.tsx.
const PlannedActivitiesLeafletMap = dynamic(
  () => import("./planned-activities-map-leaflet").then((m) => m.PlannedActivitiesLeafletMap),
  {
    ssr: false,
    loading: () => (
      <div style={{ height: "100%", display: "flex", alignItems: "center", justifyContent: "center", color: "var(--color-text-muted)" }}>
        טוען מפה...
      </div>
    ),
  },
);

export interface MapActivityCandidate {
  id: string;
  name: string;
  category: PlaceCategory;
  lat: number;
  lng: number;
}

const mutedStyle: React.CSSProperties = { color: "var(--color-text-muted)", fontSize: "0.8125rem", margin: 0 };

// מציג את כל התכנון-העתידי עם מקום בעל קואורדינטות על מפה, ממוין מהקרוב
// לרחוק ממני עכשיו — קודם הערכת קו-ישר מיידית (Haversine, בלי קריאת רשת),
// ואז מוחלף בהדרגה בזמן/מרחק נהיגה אמיתי (OSRM) ברגע שמגיע מהשרת.
export function PlannedActivitiesMap({ tripId, candidates }: { tripId: string; candidates: MapActivityCandidate[] }) {
  const [geo, requestGeo] = useGeolocation();
  const [liveDistances, setLiveDistances] = useState<Record<string, { distanceKm: number; travelTimeMinutes: number }>>({});

  useEffect(() => {
    if (geo.kind !== "ready") return;
    let cancelled = false;
    getLiveDistancesAction(tripId, geo.lat, geo.lng).then((entries) => {
      if (cancelled) return;
      const map: Record<string, { distanceKm: number; travelTimeMinutes: number }> = {};
      for (const entry of entries) map[entry.plannedActivityId] = { distanceKm: entry.distanceKm, travelTimeMinutes: entry.travelTimeMinutes };
      setLiveDistances(map);
    });
    return () => {
      cancelled = true;
    };
  }, [geo, tripId]);

  const sorted = useMemo(() => {
    if (geo.kind !== "ready") {
      return candidates.map((c) => ({ ...c, distanceKm: null as number | null, travelTimeMinutes: null as number | null, isLive: false }));
    }
    return candidates
      .map((c) => {
        const live = liveDistances[c.id];
        return live
          ? { ...c, distanceKm: live.distanceKm, travelTimeMinutes: live.travelTimeMinutes, isLive: true }
          : { ...c, distanceKm: haversineDistanceKm(geo.lat, geo.lng, c.lat, c.lng), travelTimeMinutes: null, isLive: false };
      })
      .sort((a, b) => (a.distanceKm ?? Infinity) - (b.distanceKm ?? Infinity));
  }, [candidates, geo, liveDistances]);

  if (candidates.length === 0) {
    return <p style={mutedStyle}>אין עדיין תכניות עם מקום בעל קואורדינטות להצגה על מפה.</p>;
  }

  if (geo.kind === "loading") return <p style={mutedStyle}>מאתר את המיקום שלך…</p>;

  const myLocation = geo.kind === "ready" ? { lat: geo.lat, lng: geo.lng } : null;
  const center: [number, number] = myLocation ? [myLocation.lat, myLocation.lng] : [sorted[0]!.lat, sorted[0]!.lng];

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: "0.75rem" }}>
      {geo.kind === "idle" ? <RequestLocationButton onRequest={requestGeo} label="📍 מיין יעדים לפי מרחק ממני" /> : null}
      {geo.kind === "unsupported" ? <PermissionDeniedState message="הדפדפן הזה לא תומך באיתור מיקום — היעדים מוצגים בלי מיון-מרחק." /> : null}
      {geo.kind === "denied" ? (
        <PermissionDeniedState message="לא ניתנה הרשאת מיקום — היעדים מוצגים בלי מיון-מרחק." onRetry={requestGeo} showInstructions />
      ) : null}
      {geo.kind === "error" ? (
        <PermissionDeniedState message="לא הצלחנו לאתר את המיקום שלך כרגע — היעדים מוצגים בלי מיון-מרחק." onRetry={requestGeo} />
      ) : null}
      <div style={{ height: "360px", borderRadius: "10px", overflow: "hidden" }}>
        <PlannedActivitiesLeafletMap destinations={sorted} myLocation={myLocation} center={center} zoom={myLocation ? 12 : 6} />
      </div>
      <ul style={{ listStyle: "none", padding: 0, margin: 0, display: "flex", flexDirection: "column", gap: "0.375rem" }}>
        {sorted.map((d) => (
          <li
            key={d.id}
            style={{ display: "flex", justifyContent: "space-between", alignItems: "center", padding: "0.5rem 0.625rem", borderRadius: "var(--radius-md)", background: "var(--color-surface-elevated)" }}
          >
            <span>{d.name}</span>
            <span style={mutedStyle}>
              {d.distanceKm !== null ? <Distance km={d.distanceKm} /> : "—"}
              {d.isLive && d.travelTimeMinutes !== null ? ` · ${d.travelTimeMinutes} דק' נסיעה` : d.distanceKm !== null ? " (קו ישר)" : ""}
            </span>
          </li>
        ))}
      </ul>
    </div>
  );
}
