"use client";

import { useEffect, useRef, useState } from "react";
import type { Place } from "@travel-app/shared-types";
import { useTheme } from "@/components/theme-provider";
import { getMapProvider } from "@/lib/map/get-map-provider";
import type { MapProvider } from "@/lib/map/types";
import { useGeolocation } from "@/lib/use-geolocation";
import { PlaceCard } from "../map-demo/place-card";

/**
 * גרסת-Mapbox (תלת-ממדית) של /map, במקום ה-Leaflet הישן (leaflet-map.tsx) —
 * משלימה את האינטגרציה שתוארה במפורש כ"עוד לא בוצעה" בהערת /map-demo. אותו
 * דפוס-mount בדיוק כמו MapWidgetCanvas/DemoMapCanvas: init פעם אחת, עדכונים
 * הבאים דרך ה-API האימפרטיבי של ה-provider, לא re-init.
 */
export function MapCanvas({
  places,
  center,
  zoom,
  onMapClick,
  pendingPoint,
  pendingLabel,
  flyToTarget,
}: {
  places: Place[];
  center: [number, number];
  zoom: number;
  onMapClick?: (lat: number, lng: number) => void;
  pendingPoint?: { lat: number; lng: number } | null;
  /** תווית קבועה מעל הסמן הזמני (שם/כתובת שנמצאה בחיפוש). */
  pendingLabel?: string;
  /** יעד-טיסה חיצוני (תוצאת חיפוש, ר' place-search-box.tsx) — משתנה כל פעם
   * שנבחרת תוצאה חדשה, גם אם ל-lat/lng זהים (כל אובייקט חדש), כדי שה-effect
   * תמיד יתפעל מחדש. */
  flyToTarget?: { lat: number; lng: number } | null;
}) {
  const containerRef = useRef<HTMLDivElement | null>(null);
  const providerRef = useRef<MapProvider | null>(null);
  const { resolvedMode } = useTheme();
  const [ready, setReady] = useState(false);
  const [selectedPlaceId, setSelectedPlaceId] = useState<string | null>(null);
  const [geo, requestGeo] = useGeolocation();

  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;

    const provider = getMapProvider();
    providerRef.current = provider;
    provider.init(container, { center, zoom, pitch: 45, theme: resolvedMode });

    const unsubLoad = provider.on("load", () => setReady(true));
    const unsubMarkerClick = provider.on("markerClick", (id) => setSelectedPlaceId(id));

    return () => {
      unsubLoad();
      unsubMarkerClick();
      provider.destroy();
      providerRef.current = null;
    };
    // Mount-only — center/zoom משמעותיים רק לתצוגה הראשונית, ר' ההערה המקבילה
    // ב-MapWidgetCanvas/DemoMapCanvas.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // onMapClick משתנה כשמצב "סימון מקום חדש" נדלק/נכבה (MapPageInteractive) —
  // נרשם/מוסר בנפרד מה-init כדי לא לאתחל את המפה מחדש בכל הפעלה/כיבוי.
  useEffect(() => {
    const provider = providerRef.current;
    if (!provider || !ready || !onMapClick) return;
    return provider.on("mapClick", ({ lat, lng }) => onMapClick(lat, lng));
  }, [ready, onMapClick]);

  useEffect(() => {
    if (ready) providerRef.current?.setTheme(resolvedMode);
  }, [resolvedMode, ready]);

  useEffect(() => {
    if (!ready) return;
    providerRef.current?.setMarkers(
      places
        .filter((p) => p.lat !== null && p.lng !== null)
        .map((p) => ({ id: p.id, lat: p.lat!, lng: p.lng!, category: p.category, selected: p.id === selectedPlaceId })),
    );
  }, [places, ready, selectedPlaceId]);

  useEffect(() => {
    if (!ready) return;
    providerRef.current?.setPendingMarker(pendingPoint ?? null, pendingLabel);
  }, [pendingPoint, pendingLabel, ready]);

  useEffect(() => {
    if (!ready || !flyToTarget) return;
    providerRef.current?.flyTo([flyToTarget.lat, flyToTarget.lng], { zoom: 15 });
  }, [flyToTarget, ready]);

  useEffect(() => {
    if (!ready) return;
    if (geo.kind === "ready") {
      providerRef.current?.setUserLocation({ lat: geo.lat, lng: geo.lng });
      providerRef.current?.flyTo([geo.lat, geo.lng], { zoom: 14 });
    } else {
      providerRef.current?.setUserLocation(null);
    }
  }, [geo, ready]);

  const selectedPlace = places.find((p) => p.id === selectedPlaceId) ?? null;

  return (
    <div style={{ position: "relative", width: "100%", height: "100%" }}>
      <div ref={containerRef} style={{ width: "100%", height: "100%" }} />

      {!ready ? (
        <div
          style={{
            position: "absolute",
            inset: 0,
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            color: "var(--color-text-muted)",
            fontSize: "0.8125rem",
            background: "var(--color-bg)",
          }}
        >
          טוען מפה…
        </div>
      ) : null}

      <div style={{ position: "absolute", top: "10px", insetInlineStart: "10px", zIndex: 5, display: "flex", flexDirection: "column", gap: "0.375rem", alignItems: "flex-start" }}>
        <button type="button" onClick={requestGeo} disabled={geo.kind === "loading"} style={locateButtonStyle}>
          {geo.kind === "loading" ? "מאתר…" : geo.kind === "denied" ? "אין הרשאת מיקום" : "📍 המיקום שלי"}
        </button>
        {geo.kind === "denied" ? (
          <div style={geoHintStyle}>לחצו על סמל המנעול בשורת הכתובת ← הרשאות אתר ← מיקום ← אפשר, ואז נסו שוב.</div>
        ) : null}
      </div>

      {selectedPlace ? <PlaceCard place={selectedPlace} onClose={() => setSelectedPlaceId(null)} /> : null}
    </div>
  );
}

const locateButtonStyle: React.CSSProperties = {
  padding: "0.5rem 0.75rem",
  borderRadius: "var(--radius-full)",
  border: "1px solid var(--color-border)",
  background: "var(--color-surface-solid)",
  color: "var(--color-text)",
  cursor: "pointer",
  fontSize: "0.8125rem",
  fontWeight: 600,
  boxShadow: "0 2px 6px rgba(0,0,0,0.25)",
};

const geoHintStyle: React.CSSProperties = {
  fontSize: "0.75rem",
  color: "var(--color-text-muted)",
  maxWidth: "220px",
  background: "var(--color-surface-solid)",
  borderRadius: "var(--radius-md)",
  padding: "0.375rem 0.5rem",
  boxShadow: "0 2px 6px rgba(0,0,0,0.25)",
};
