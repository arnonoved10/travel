"use client";

import { MapContainer, TileLayer, Marker, Popup, CircleMarker } from "react-leaflet";
import L from "leaflet";
import "leaflet/dist/leaflet.css";

// אותו תיקון אייקונים בדיוק כמו שאר מפות ה-Leaflet באפליקציה.
delete (L.Icon.Default.prototype as unknown as { _getIconUrl?: unknown })._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon-2x.png",
  iconUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png",
  shadowUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png",
});

function numberedIcon(order: number): L.DivIcon {
  return L.divIcon({
    className: "",
    html: `<div style="width:1.75rem;height:1.75rem;border-radius:50%;background:#6a5cd6;border:2px solid #fff;box-shadow:0 2px 6px rgba(0,0,0,0.4);display:flex;align-items:center;justify-content:center;color:#fff;font-weight:700;font-size:0.8125rem;font-family:sans-serif;">${order}</div>`,
    iconSize: [28, 28],
    iconAnchor: [14, 14],
  });
}

export interface NumberedStop {
  id: string;
  order: number;
  name: string;
  lat: number;
  lng: number;
}

export function DayRouteLeafletMap({
  stops,
  myLocation,
  center,
  zoom,
}: {
  stops: NumberedStop[];
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
      {stops.map((stop) => (
        <Marker key={stop.id} position={[stop.lat, stop.lng]} icon={numberedIcon(stop.order)}>
          <Popup>
            {stop.order}. {stop.name}
          </Popup>
        </Marker>
      ))}
    </MapContainer>
  );
}
