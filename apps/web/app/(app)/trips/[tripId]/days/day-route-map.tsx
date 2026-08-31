"use client";

import dynamic from "next/dynamic";
import { PermissionDeniedState, RequestLocationButton } from "@/components/blocked-state";
import { useGeolocation } from "@/lib/use-geolocation";
import type { NumberedStop } from "./day-route-map-leaflet";

// Leaflet נוגע ב-window/document ישירות — לא ניתן ל-render בצד שרת. אותו
// דפוס בדיוק כמו שאר מפות ה-Leaflet באפליקציה.
const DayRouteLeafletMap = dynamic(() => import("./day-route-map-leaflet").then((m) => m.DayRouteLeafletMap), {
  ssr: false,
  loading: () => (
    <div style={{ height: "100%", display: "flex", alignItems: "center", justifyContent: "center", color: "var(--color-text-muted)" }}>
      טוען מפה...
    </div>
  ),
});

const mutedStyle: React.CSSProperties = { color: "var(--color-text-muted)", fontSize: "0.8125rem", margin: 0 };

/** מציג את עצירות המסלול של היום ממוספרות לפי סדר הביקור (1,2,3...) + נקודת המיקום הנוכחי שלי. */
export function DayRouteMap({ stops }: { stops: NumberedStop[] }) {
  const [geo, requestGeo] = useGeolocation();

  if (stops.length === 0) {
    return <p style={mutedStyle}>אין עדיין עצירות עם מקום בעל קואורדינטות להצגה על מפה.</p>;
  }

  const myLocation = geo.kind === "ready" ? { lat: geo.lat, lng: geo.lng } : null;
  const center: [number, number] = myLocation ? [myLocation.lat, myLocation.lng] : [stops[0]!.lat, stops[0]!.lng];

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: "0.5rem" }}>
      {geo.kind === "idle" ? <RequestLocationButton onRequest={requestGeo} label="📍 הצג את המיקום שלי על המפה" /> : null}
      {geo.kind === "unsupported" ? <PermissionDeniedState message="הדפדפן הזה לא תומך באיתור מיקום — המפה תוצג בלי הנקודה שלי." /> : null}
      {geo.kind === "denied" ? (
        <PermissionDeniedState message="לא ניתנה הרשאת מיקום — המפה תוצג בלי הנקודה שלי." onRetry={requestGeo} showInstructions />
      ) : null}
      {geo.kind === "error" ? <PermissionDeniedState message="לא הצלחנו לאתר את המיקום שלך כרגע." onRetry={requestGeo} /> : null}
      <div style={{ height: "320px", borderRadius: "10px", overflow: "hidden", border: "1px solid var(--color-border)" }}>
        <DayRouteLeafletMap stops={stops} myLocation={myLocation} center={center} zoom={myLocation ? 13 : 12} />
      </div>
    </div>
  );
}
