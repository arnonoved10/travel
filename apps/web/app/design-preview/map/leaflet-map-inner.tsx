"use client";

import { memo, useEffect } from "react";
import { MapContainer, TileLayer, Marker, Polyline, ZoomControl, useMap } from "react-leaflet";
import L from "leaflet";
import "leaflet/dist/leaflet.css";

/**
 * מפה אמיתית ואינטראקטיבית (design-preview בלבד) — Leaflet + react-leaflet,
 * שתיהן כבר מותקנות בפרויקט (package.json של apps/web), ואריחי
 * OpenStreetMap (חינמי לגמרי, ללא מפתח API, ללא שירות בתשלום) — אותו מקור
 * אריחים בדיוק שכבר בשימוש ב-app/(app)/map/leaflet-map.tsx (מסך המפה
 * האמיתי, כשאין טוקן Mapbox מוגדר). קובץ זה עצמאי לגמרי (לא מייבא משם
 * דבר) כדי לשמור על בידוד מלא של ה-design-preview, אך משתמש באותה שיטה
 * מוכחת: קובץ "use client" נפרד ל-Leaflet (נוגע ב-window/document), נטען
 * דרך next/dynamic עם ssr:false מתוך page.tsx.
 */

// אותו תיקון מתועד לבעיית נתיבי-האייקונים של Leaflet מול Turbopack/webpack
// שכבר קיים בקוד המקורי (leaflet-map.tsx) — מצביע ל-CDN חינמי (unpkg),
// מוצמד לגרסת leaflet המותקנת.
delete (L.Icon.Default.prototype as unknown as { _getIconUrl?: unknown })._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon-2x.png",
  iconUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png",
  shadowUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png",
});

export interface MapPoint {
  id: string;
  lat: number;
  lon: number;
  city: string;
  days: number;
  color: string;
  isSelected: boolean;
  isCurrent: boolean;
}

export interface MapRouteSegment {
  from: { lat: number; lon: number };
  to: { lat: number; lon: number };
  color: string;
  weight: number;
  dashed: boolean;
  opacity: number;
}

export interface TransportMarker {
  lat: number;
  lon: number;
  mode: "flight" | "car" | "ferry";
  done: boolean;
}

function markerHtml(p: MapPoint) {
  const scale = p.isSelected ? 1 : 0.86;
  const ring = p.isCurrent
    ? `<span style="position:absolute;inset:-12px;border-radius:9999px;background:${p.color}55;animation:dpMapPulse 2.2s ease-out infinite"></span>`
    : "";
  const currentTag = p.isCurrent
    ? `<span style="margin-top:4px;padding:2px 8px;border-radius:999px;background:${p.color};color:#fff;font-size:10px;font-weight:800;white-space:nowrap;box-shadow:0 2px 6px rgba(0,0,0,0.35)">אתה כאן</span>`
    : "";
  return `
    <div style="position:relative;display:flex;flex-direction:column;align-items:center;transform:scale(${scale});transform-origin:bottom center;">
      ${ring}
      <span style="position:relative;display:flex;align-items:center;gap:6px;padding:${p.isSelected ? "8px 13px" : "6px 11px"};border-radius:999px;background:${
        p.isSelected ? p.color : "#0e1930"
      };border:2px solid ${p.isSelected ? "#fff" : p.color};box-shadow:0 4px 12px rgba(0,0,0,0.45);white-space:nowrap;">
        <svg width="13" height="13" viewBox="0 0 24 24" fill="#fff"><path d="M12 2a7 7 0 0 0-7 7c0 5.25 7 13 7 13s7-7.75 7-13a7 7 0 0 0-7-7zm0 9.5A2.5 2.5 0 1 1 12 6.5a2.5 2.5 0 0 1 0 5z"/></svg>
        <span style="font-size:13px;font-weight:800;color:#fff;">${p.city}</span>
        <span style="font-size:10.5px;font-weight:700;color:${p.isSelected ? "rgba(255,255,255,0.85)" : p.color};">· ${p.days} ימים</span>
      </span>
      ${currentTag}
    </div>
  `;
}

const TRANSPORT_PATHS: Record<TransportMarker["mode"], string> = {
  flight: "M21 16v-2l-8-5V3.5a1.5 1.5 0 0 0-3 0V9l-8 5v2l8-2.5V19l-2.5 1.8V22l3.5-1 3.5 1v-1.2L13 19v-5.5l8 2.5z",
  car: "M5 11l1.5-4.5A2 2 0 0 1 8.4 5h7.2a2 2 0 0 1 1.9 1.5L19 11h1a1 1 0 0 1 1 1v5a1 1 0 0 1-1 1h-1a2 2 0 1 1-4 0H9a2 2 0 1 1-4 0H4a1 1 0 0 1-1-1v-5a1 1 0 0 1 1-1h1zm2.1-4l-1.3 4h12.4l-1.3-4a.5.5 0 0 0-.5-.4H8.6a.5.5 0 0 0-.5.4zM7 15.5a1 1 0 1 0 0 2 1 1 0 0 0 0-2zm10 0a1 1 0 1 0 0 2 1 1 0 0 0 0-2z",
  ferry:
    "M4 18l1.6-5.4a2 2 0 0 1 1.9-1.6H9V7a1 1 0 0 1 1-1h1V4h2v2h1a1 1 0 0 1 1 1v4h1.5a2 2 0 0 1 1.9 1.6L20 18a1 1 0 0 1-1 1.3c-1.1 0-1.1-1-2.2-1s-1.1 1-2.3 1-1.1-1-2.3-1-1.1 1-2.3 1-1.1-1-2.2-1S4 19 4 18z",
};

function transportHtml(t: TransportMarker) {
  return `
    <div style="width:28px;height:28px;border-radius:50%;background:${t.done ? "#43d6aa" : "#0e1930"};border:2px solid ${
    t.done ? "#fff" : "rgba(255,255,255,0.6)"
  };display:flex;align-items:center;justify-content:center;box-shadow:0 2px 8px rgba(0,0,0,0.4);">
      <svg width="14" height="14" viewBox="0 0 24 24" fill="#fff"><path d="${TRANSPORT_PATHS[t.mode]}"/></svg>
    </div>
  `;
}

function FlyToController({ target }: { target: { lat: number; lon: number; zoom?: number } | null }) {
  const map = useMap();
  useEffect(() => {
    if (!target) return;
    map.flyTo([target.lat, target.lon], target.zoom ?? map.getZoom(), { duration: 0.8 });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [target]);
  return null;
}

function FitOnceController({ points }: { points: MapPoint[] }) {
  const map = useMap();
  useEffect(() => {
    if (points.length < 2) return;
    const bounds = L.latLngBounds(points.map((p) => [p.lat, p.lon] as [number, number]));
    map.fitBounds(bounds, { padding: [50, 50] });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);
  return null;
}

export const DesignPreviewLeafletMap = memo(function DesignPreviewLeafletMap({
  points,
  segments,
  transports,
  onSelect,
  flyTarget,
  fitPoints,
}: {
  points: MapPoint[];
  segments: MapRouteSegment[];
  transports: TransportMarker[];
  onSelect: (id: string) => void;
  flyTarget: { lat: number; lon: number; zoom?: number } | null;
  fitPoints: MapPoint[];
}) {
  const center = points[0] ? ([points[0].lat, points[0].lon] as [number, number]) : ([13.75, 100.5] as [number, number]);

  return (
    <MapContainer center={center} zoom={8} zoomControl={false} style={{ height: "100%", width: "100%" }} scrollWheelZoom>
      <style>{`
        @keyframes dpMapPulse {
          0% { transform: scale(0.75); opacity: 0.85; }
          70% { transform: scale(1.8); opacity: 0; }
          100% { transform: scale(1.8); opacity: 0; }
        }
        .dp-marker-icon { background: none; border: none; }
      `}</style>
      <TileLayer
        attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
        url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
      />
      <ZoomControl position="bottomleft" />
      <FitOnceController points={fitPoints} />
      <FlyToController target={flyTarget} />
      {/* קו-מסלול דק וזוהר (לא עבה, לא מסתיר את המפה) — הילת-זוהר מושגת עם
          כמה קווים חופפים באותו צבע, ברוחב עולה ושקיפות יורדת, וקו-ליבה דק
          ובהיר במרכז — טכניקת "neon glow" רגילה, לא אשליה גרפית של תלת-ממד. */}
      {segments.map((seg, i) => (
        <Polyline
          key={`seg-glow-outer-${i}`}
          positions={[
            [seg.from.lat, seg.from.lon],
            [seg.to.lat, seg.to.lon],
          ]}
          pathOptions={{ color: seg.color, weight: seg.weight * 3.2, opacity: 0.14, lineCap: "round" }}
          interactive={false}
        />
      ))}
      {segments.map((seg, i) => (
        <Polyline
          key={`seg-glow-mid-${i}`}
          positions={[
            [seg.from.lat, seg.from.lon],
            [seg.to.lat, seg.to.lon],
          ]}
          pathOptions={{ color: seg.color, weight: seg.weight * 1.8, opacity: 0.28, lineCap: "round" }}
          interactive={false}
        />
      ))}
      {segments.map((seg, i) => (
        <Polyline
          key={`seg-core-${i}`}
          positions={[
            [seg.from.lat, seg.from.lon],
            [seg.to.lat, seg.to.lon],
          ]}
          pathOptions={{ color: seg.color, weight: seg.weight, opacity: seg.opacity, dashArray: seg.dashed ? "8 8" : undefined, lineCap: "round" }}
          interactive={false}
        />
      ))}
      {transports.map((t, i) => (
        <Marker
          key={`transport-${i}`}
          position={[t.lat, t.lon]}
          icon={L.divIcon({ className: "dp-marker-icon", html: transportHtml(t), iconSize: [28, 28], iconAnchor: [14, 14] })}
          interactive={false}
        />
      ))}
      {points.map((p) => (
        <Marker
          key={p.id}
          position={[p.lat, p.lon]}
          icon={L.divIcon({ className: "dp-marker-icon", html: markerHtml(p), iconSize: [170, 64], iconAnchor: [85, 40] })}
          eventHandlers={{ click: () => onSelect(p.id) }}
          zIndexOffset={p.isSelected ? 1000 : 0}
        />
      ))}
    </MapContainer>
  );
});
