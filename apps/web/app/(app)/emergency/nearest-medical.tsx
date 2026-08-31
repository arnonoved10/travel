"use client";

import { haversineDistanceKm } from "@/lib/haversine-distance";
import { NavigateButtons } from "@/components/navigate-buttons";
import { PermissionDeniedState, RequestLocationButton } from "@/components/blocked-state";
import { useGeolocation } from "@/lib/use-geolocation";

export interface MedicalCandidate {
  placeId: string;
  name: string;
  category: string;
  lat: number;
  lng: number;
}

const CATEGORY_LABELS: Record<string, string> = { hospital: "בית חולים", pharmacy: "בית מרקחת" };

// אותו דפוס בדיוק כמו NearbyPlaces (/now) — Geolocation API חינמי + Haversine,
// ממוקד רק ל-hospital/pharmacy מבין המקומות המקושרים לטיול.
export function NearestMedical({ candidates }: { candidates: MedicalCandidate[] }) {
  const [geo, requestGeo] = useGeolocation();

  if (candidates.length === 0) {
    return <p style={mutedStyle}>אין בתי חולים/בתי מרקחת שמורים בספריית המקומות של הטיול הזה.</p>;
  }
  if (geo.kind === "loading") return <p style={mutedStyle}>מאתר את המיקום שלך…</p>;
  if (geo.kind === "idle" || geo.kind === "unsupported" || geo.kind === "denied" || geo.kind === "error") {
    // מסך חירום — לא חוסמים את הרשימה מאחורי הרשאת מיקום (המידע קריטי גם בלי
    // מיון לפי מרחק), רק מציעים למיין לפי מרחק. ר' #114 (Error States).
    return (
      <div style={{ display: "flex", flexDirection: "column", gap: "0.5rem" }}>
        {geo.kind === "idle" ? (
          <RequestLocationButton onRequest={requestGeo} label="📍 מיין לפי מרחק ממני" />
        ) : geo.kind === "denied" ? (
          <PermissionDeniedState message="לא ניתנה הרשאת מיקום — הרשימה מוצגת בלי מיון לפי מרחק." onRetry={requestGeo} showInstructions />
        ) : (
          <PermissionDeniedState
            message={
              geo.kind === "unsupported"
                ? "הדפדפן הזה לא תומך באיתור מיקום — הרשימה מוצגת בלי מיון לפי מרחק."
                : "לא הצלחנו לאתר את המיקום שלך — הרשימה מוצגת בלי מיון לפי מרחק."
            }
            onRetry={geo.kind === "error" ? requestGeo : undefined}
          />
        )}
        <ul style={{ listStyle: "none", padding: 0, margin: 0, display: "flex", flexDirection: "column", gap: "0.5rem" }}>
          {candidates.map((c) => (
            <li key={c.placeId} style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
              <span>
                {CATEGORY_LABELS[c.category] ?? c.category} — {c.name}
              </span>
              <NavigateButtons lat={c.lat} lng={c.lng} address={null} />
            </li>
          ))}
        </ul>
      </div>
    );
  }

  const sorted = candidates
    .map((c) => ({ ...c, distanceKm: haversineDistanceKm(geo.lat, geo.lng, c.lat, c.lng) }))
    .sort((a, b) => a.distanceKm - b.distanceKm);

  return (
    <ul style={{ listStyle: "none", padding: 0, margin: 0, display: "flex", flexDirection: "column", gap: "0.5rem" }}>
      {sorted.map((c) => (
        <li key={c.placeId} style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
          <span>
            {CATEGORY_LABELS[c.category] ?? c.category} — {c.name} ·{" "}
            {c.distanceKm < 1 ? `${Math.round(c.distanceKm * 1000)} מ'` : `${c.distanceKm.toFixed(1)} ק"מ`}
          </span>
          <NavigateButtons lat={c.lat} lng={c.lng} address={null} />
        </li>
      ))}
    </ul>
  );
}

const mutedStyle: React.CSSProperties = { color: "var(--color-text-muted)", fontSize: "0.8125rem", margin: 0 };
