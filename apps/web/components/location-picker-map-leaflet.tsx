"use client";

import { useEffect } from "react";
import { MapContainer, TileLayer, Marker, useMap } from "react-leaflet";
import L from "leaflet";
import "leaflet/dist/leaflet.css";
import { MapClickListener } from "./map-click-listener";

// אותו פין-אדום-ממתין בדיוק כמו ב-apps/web/app/(app)/map/leaflet-map.tsx —
// עקביות ויזואלית עם מסך "סימון מקום חדש" הקיים שם, לא marker גנרי חדש.
const pendingIcon = L.divIcon({
  className: "",
  html: '<div style="width:1.5rem;height:1.5rem;border-radius:50% 50% 50% 0;background:#e0492f;border:2px solid #fff;transform:rotate(-45deg);box-shadow:0 2px 6px rgba(0,0,0,0.35)"></div>',
  iconSize: [24, 24],
  iconAnchor: [12, 24],
});

delete (L.Icon.Default.prototype as unknown as { _getIconUrl?: unknown })._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon-2x.png",
  iconUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png",
  shadowUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png",
});

// MapContainer's `center`/`zoom` props apply only on first mount — react-leaflet
// לא מזיז את התצוגה לבד כשה-value משתנה אחר-כך (זו הסיבה שנקודה שנבחרה/הוקלדה
// הייתה כמעט בלתי-נראית: המפה נשארה בזום-עולם). רכיב-הבן הזה עוקב אחרי value
// ומזיז את התצוגה בפועל, עם זום-פנימה סביר (לא נשאר על 220px של זום-עולם).
function FlyToOnChange({ value }: { value: { lat: number; lng: number } | null }) {
  const map = useMap();
  useEffect(() => {
    if (value) map.flyTo([value.lat, value.lng], Math.max(map.getZoom(), 14), { duration: 0.6 });
  }, [value, map]);
  return null;
}

export function LocationPickerLeaflet({
  value,
  onPick,
  center,
  zoom,
}: {
  value: { lat: number; lng: number } | null;
  onPick: (lat: number, lng: number) => void;
  center: [number, number];
  zoom: number;
}) {
  return (
    <MapContainer center={value ? [value.lat, value.lng] : center} zoom={value ? 14 : zoom} style={{ height: "100%", width: "100%" }} scrollWheelZoom>
      <TileLayer
        attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
        url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
      />
      <MapClickListener onPick={onPick} />
      <FlyToOnChange value={value} />
      {value ? <Marker position={[value.lat, value.lng]} icon={pendingIcon} /> : null}
    </MapContainer>
  );
}
