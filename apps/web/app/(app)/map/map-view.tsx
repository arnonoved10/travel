"use client";

import dynamic from "next/dynamic";
import type { Place } from "@travel-app/shared-types";
import { isMapProviderConfigured } from "@/lib/map/config";

// שני ה-imports נוגעים ב-window/document ישירות (Leaflet/Mapbox GL) — לא ניתן
// ל-render בצד שרת. ssr:false מותר רק בתוך קובץ "use client", לכן חייבים לחיות כאן.
const LeafletMap = dynamic(() => import("./leaflet-map").then((m) => m.LeafletMap), {
  ssr: false,
  loading: () => (
    <div style={{ height: "100%", display: "flex", alignItems: "center", justifyContent: "center", color: "var(--color-text-muted)" }}>
      טוען מפה...
    </div>
  ),
});
const MapCanvas = dynamic(() => import("./map-canvas").then((m) => m.MapCanvas), {
  ssr: false,
  loading: () => (
    <div style={{ height: "100%", display: "flex", alignItems: "center", justifyContent: "center", color: "var(--color-text-muted)" }}>
      טוען מפה...
    </div>
  ),
});

export function MapView({
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
  pendingLabel?: string;
  flyToTarget?: { lat: number; lng: number } | null;
}) {
  // מפה תלת-ממדית (Mapbox) כשמוגדר טוקן; נופלים חזרה ל-Leaflet הדו-ממדי בלי
  // NEXT_PUBLIC_MAPBOX_TOKEN — רשת-ביטחון, לא שינוי-התנהגות בסביבה שכבר עובדת.
  if (isMapProviderConfigured()) {
    return (
      <MapCanvas places={places} center={center} zoom={zoom} onMapClick={onMapClick} pendingPoint={pendingPoint} pendingLabel={pendingLabel} flyToTarget={flyToTarget} />
    );
  }
  return (
    <LeafletMap places={places} center={center} zoom={zoom} onMapClick={onMapClick} pendingPoint={pendingPoint} pendingLabel={pendingLabel} flyToTarget={flyToTarget} />
  );
}
