"use client";

import { useMapEvents } from "react-leaflet";

// חייב לחיות בתוך <MapContainer> (useMapEvents עובד רק שם) — אותו דפוס
// בדיוק כמו CenterOnMeControl ב-apps/web/app/(app)/map/leaflet-map.tsx
// (רכיב-בן שמשתמש ב-hook של react-leaflet, לא מרנדר שום דבר בעצמו).
export function MapClickListener({ onPick }: { onPick: (lat: number, lng: number) => void }) {
  useMapEvents({
    click: (event) => onPick(event.latlng.lat, event.latlng.lng),
  });
  return null;
}
