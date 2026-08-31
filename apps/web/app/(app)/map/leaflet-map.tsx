"use client";

import { useEffect, useState } from "react";
import { MapContainer, TileLayer, Marker, Popup, Tooltip, CircleMarker, useMap } from "react-leaflet";
import L from "leaflet";
import "leaflet/dist/leaflet.css";
import type { Place } from "@travel-app/shared-types";
import { PLACE_CATEGORY_LABELS } from "@/lib/place-labels";
import { buildNavigateLinks } from "@/lib/navigate-links";
import { MapClickListener } from "@/components/map-click-listener";

// Marker זמני (עדיין לא נשמר) לנקודה שנבחרה במצב "סימון מקום חדש" — צבע
// שונה מה-marker הכחול הרגיל של Leaflet כדי שיהיה ברור שזו נקודה ממתינה.
const pendingIcon = L.divIcon({
  className: "",
  html: '<div style="width:1.5rem;height:1.5rem;border-radius:50% 50% 50% 0;background:#e0492f;border:2px solid #fff;transform:rotate(-45deg);box-shadow:0 2px 6px rgba(0,0,0,0.35)"></div>',
  iconSize: [24, 24],
  iconAnchor: [12, 24],
});

// Turbopack/webpack שוברים את נתיבי ברירת המחדל של אייקוני Leaflet (מחפשים אותם
// יחסית ל-CSS ולא מוצאים) — הפתרון המתועד: להצביע עליהם ל-CDN ציבורי וחינמי
// (unpkg), מוצמד לגרסת leaflet המותקנת כדי לא להישבר בשדרוג עתידי.
delete (L.Icon.Default.prototype as unknown as { _getIconUrl?: unknown })._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon-2x.png",
  iconUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png",
  shadowUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png",
});

type GeoState = { kind: "idle" } | { kind: "loading" } | { kind: "denied" } | { kind: "error" } | { kind: "ready"; lat: number; lng: number };

// כפתור "המיקום שלי" — מבקש הרשאה רק בלחיצה (לא אוטומטית בטעינה), אותו
// דפוס Geolocation API כמו ב-/now (חינמי, בלי מפתח). useMap() מגיע מ-
// react-leaflet ועובד רק בתוך MapContainer, לכן זה רכיב-בן נפרד.
function CenterOnMeControl({ onLocated }: { onLocated: (lat: number, lng: number) => void }) {
  const map = useMap();
  const [geo, setGeo] = useState<GeoState>({ kind: "idle" });

  function handleClick() {
    if (!("geolocation" in navigator)) {
      setGeo({ kind: "error" });
      return;
    }
    setGeo({ kind: "loading" });
    navigator.geolocation.getCurrentPosition(
      (position) => {
        const { latitude, longitude } = position.coords;
        setGeo({ kind: "ready", lat: latitude, lng: longitude });
        onLocated(latitude, longitude);
        map.flyTo([latitude, longitude], 14);
      },
      (error) => setGeo({ kind: error.code === error.PERMISSION_DENIED ? "denied" : "error" }),
      { enableHighAccuracy: false, timeout: 10000, maximumAge: 5 * 60 * 1000 },
    );
  }

  return (
    <button
      type="button"
      onClick={handleClick}
      title="המיקום שלי"
      style={{
        position: "absolute",
        top: "10px",
        insetInlineStart: "10px",
        zIndex: 1000,
        padding: "0.5rem 0.75rem",
        borderRadius: "var(--radius-full)",
        border: "1px solid #ccc",
        background: "#fff",
        color: "#111",
        cursor: "pointer",
        fontSize: "0.8125rem",
        boxShadow: "0 2px 6px rgba(0,0,0,0.25)",
      }}
    >
      {geo.kind === "loading" ? "מאתר…" : geo.kind === "denied" ? "אין הרשאת מיקום" : geo.kind === "error" ? "שגיאת מיקום" : "📍 המיקום שלי"}
    </button>
  );
}

// טס אל יעד-חיצוני (תוצאת חיפוש, ר' place-search-box.tsx) — אותו טעם בדיוק
// כמו CenterOnMeControl (useMap() רק בתוך MapContainer, לכן רכיב-בן נפרד).
function FlyToController({ target }: { target: { lat: number; lng: number } | null | undefined }) {
  const map = useMap();
  useEffect(() => {
    if (!target) return;
    map.flyTo([target.lat, target.lng], 15);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [target]);
  return null;
}

export function LeafletMap({
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
  /** כשמועבר, קליק על המפה קורא לפונקציה הזו — מצב "סימון מקום חדש". */
  onMapClick?: (lat: number, lng: number) => void;
  /** נקודה שנבחרה אבל עוד לא נשמרה — מוצגת ב-marker זמני שונה. */
  pendingPoint?: { lat: number; lng: number } | null;
  /** תווית קבועה מעל ה-marker הזמני (שם/כתובת שנמצאה בחיפוש) — מוצגת בלי צורך בקליק. */
  pendingLabel?: string;
  /** יעד-טיסה חיצוני (תוצאת חיפוש, ר' place-search-box.tsx). */
  flyToTarget?: { lat: number; lng: number } | null;
}) {
  const [userLocation, setUserLocation] = useState<{ lat: number; lng: number } | null>(null);

  return (
    <MapContainer center={center} zoom={zoom} style={{ height: "100%", width: "100%" }} scrollWheelZoom>
      <CenterOnMeControl onLocated={(lat, lng) => setUserLocation({ lat, lng })} />
      <FlyToController target={flyToTarget} />
      {onMapClick ? <MapClickListener onPick={onMapClick} /> : null}
      {pendingPoint ? (
        <Marker position={[pendingPoint.lat, pendingPoint.lng]} icon={pendingIcon}>
          {pendingLabel ? (
            <Tooltip permanent direction="top" offset={[0, -24]}>
              {pendingLabel}
            </Tooltip>
          ) : null}
          <Popup>{pendingLabel || "מקום חדש — כאן"}</Popup>
        </Marker>
      ) : null}
      {userLocation ? (
        <CircleMarker
          center={[userLocation.lat, userLocation.lng]}
          radius={8}
          pathOptions={{ color: "#fff", weight: 2, fillColor: "#3b82f6", fillOpacity: 1 }}
        >
          <Popup>המיקום שלי</Popup>
        </CircleMarker>
      ) : null}
      <TileLayer
        attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
        url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
      />
      {places.map((place) => {
        if (place.lat === null || place.lng === null) return null;
        const { googleMapsUrl, wazeUrl } = buildNavigateLinks(place);
        return (
          <Marker key={place.id} position={[place.lat, place.lng]}>
            <Popup>
              <div style={{ minWidth: "160px" }}>
                <div style={{ fontWeight: 600 }}>
                  {place.isFavorite ? "★ " : ""}
                  {place.name}
                </div>
                <div style={{ fontSize: "0.8125rem", color: "#555" }}>
                  {PLACE_CATEGORY_LABELS[place.category]}
                  {place.city ? ` · ${place.city}` : ""}
                </div>
                {place.address ? <div style={{ fontSize: "0.8125rem", color: "#555" }}>{place.address}</div> : null}
                <div style={{ display: "flex", gap: "0.5rem", marginTop: "0.375rem" }}>
                  {googleMapsUrl ? (
                    <a href={googleMapsUrl} target="_blank" rel="noopener noreferrer">
                      🧭 Maps
                    </a>
                  ) : null}
                  {wazeUrl ? (
                    <a href={wazeUrl} target="_blank" rel="noopener noreferrer">
                      🚗 Waze
                    </a>
                  ) : null}
                </div>
              </div>
            </Popup>
          </Marker>
        );
      })}
    </MapContainer>
  );
}
