"use client";

import { MapContainer, TileLayer, Marker, Popup, CircleMarker } from "react-leaflet";
import L from "leaflet";
import "leaflet/dist/leaflet.css";
import { PLACE_CATEGORY_LABELS } from "@/lib/place-labels";

// אותו תיקון אייקונים בדיוק כמו apps/web/app/(app)/map/leaflet-map.tsx —
// Turbopack שובר את נתיבי ברירת המחדל, ר' ההערה שם.
delete (L.Icon.Default.prototype as unknown as { _getIconUrl?: unknown })._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon-2x.png",
  iconUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png",
  shadowUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png",
});

export interface MapDestination {
  id: string;
  name: string;
  category: string;
  lat: number;
  lng: number;
  distanceKm: number | null;
  travelTimeMinutes: number | null;
  isLive: boolean;
}

export function PlannedActivitiesLeafletMap({
  destinations,
  myLocation,
  center,
  zoom,
}: {
  destinations: MapDestination[];
  myLocation: { lat: number; lng: number } | null;
  center: [number, number];
  zoom: number;
}) {
  return (
    <MapContainer center={center} zoom={zoom} style={{ height: "100%", width: "100%" }} scrollWheelZoom>
      <TileLayer
        attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
        url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
      />
      {myLocation ? (
        <CircleMarker
          center={[myLocation.lat, myLocation.lng]}
          radius={8}
          pathOptions={{ color: "#fff", weight: 2, fillColor: "#3b82f6", fillOpacity: 1 }}
        >
          <Popup>המיקום שלי</Popup>
        </CircleMarker>
      ) : null}
      {destinations.map((d) => (
        <Marker key={d.id} position={[d.lat, d.lng]}>
          <Popup>
            <div style={{ minWidth: "140px" }}>
              <div style={{ fontWeight: 600 }}>{d.name}</div>
              <div style={{ fontSize: "0.8125rem", color: "#555" }}>
                {PLACE_CATEGORY_LABELS[d.category as keyof typeof PLACE_CATEGORY_LABELS] ?? d.category}
              </div>
              {d.distanceKm !== null ? (
                <div style={{ fontSize: "0.8125rem", color: "#555", marginTop: "0.25rem" }}>
                  {d.distanceKm.toFixed(1)} ק&quot;מ
                  {d.isLive && d.travelTimeMinutes !== null ? ` · ${d.travelTimeMinutes} דק' נסיעה` : " (קו ישר)"}
                </div>
              ) : null}
            </div>
          </Popup>
        </Marker>
      ))}
    </MapContainer>
  );
}
