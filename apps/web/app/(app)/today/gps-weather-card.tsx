"use client";

import { useEffect, useState } from "react";
import { getGpsWeatherAction, type GpsWeatherResult } from "./actions";
import { getWeatherAdvice } from "@/lib/weather-advice";
import { computeRainWindows } from "@/lib/rain-window";
import { Temperature } from "@/components/temperature";
import { PermissionDeniedState, RequestLocationButton } from "@/components/blocked-state";
import { useGeolocation } from "@/lib/use-geolocation";

type WeatherState = { kind: "error" } | { kind: "ready"; result: GpsWeatherResult };

/**
 * מזג אוויר לפי המיקום הנוכחי האמיתי (GPS) — משלים את כרטיס "מזג אוויר"
 * הרגיל שמבוסס על מקום מקושר לטיול (ראה #50 ב-FEATURE_AUDIT.md). דורש
 * הרשאת Geolocation; בלעדיה מוצגת הודעה כנה, לא ניחוש.
 */
export function GpsWeatherCard() {
  const [geo, requestGeo] = useGeolocation();
  const [weather, setWeather] = useState<WeatherState | null>(null);

  useEffect(() => {
    if (geo.kind !== "ready") return;
    getGpsWeatherAction(geo.lat, geo.lng)
      .then((result) => setWeather(result ? { kind: "ready", result } : { kind: "error" }))
      .catch(() => setWeather({ kind: "error" }));
  }, [geo]);

  if (geo.kind === "idle") {
    return <RequestLocationButton onRequest={requestGeo} label="📍 מזג אוויר לפי המיקום שלי" />;
  }
  if (geo.kind === "unsupported") {
    return <PermissionDeniedState message="הדפדפן הזה לא תומך באיתור מיקום." />;
  }
  if (geo.kind === "loading") {
    return <p style={mutedStyle}>מאתר את המיקום שלך…</p>;
  }
  if (geo.kind === "denied") {
    return (
      <PermissionDeniedState
        message="לא ניתנה הרשאת מיקום — אי אפשר להציג מזג אוויר לפי המיקום האמיתי בלי זה."
        onRetry={requestGeo}
        showInstructions
      />
    );
  }
  if (geo.kind === "error") {
    return <PermissionDeniedState message="לא הצלחנו לאתר את המיקום שלך כרגע." onRetry={requestGeo} />;
  }
  if (!weather) {
    return <p style={mutedStyle}>טוען מזג אוויר…</p>;
  }
  if (weather.kind === "error") {
    return <p style={mutedStyle}>לא הצלחנו לטעון מזג אוויר למיקום הנוכחי כרגע.</p>;
  }

  const { current, hourly } = weather.result;
  const advice = getWeatherAdvice(current);
  const rainWindows = computeRainWindows(hourly);

  return (
    <div>
      <div style={{ display: "flex", alignItems: "center", gap: "0.5rem" }}>
        <span style={{ fontSize: "1.5rem" }}>{current.conditionIcon}</span>
        <div>
          <div style={{ fontWeight: 600 }}>
            <Temperature celsius={current.temperatureC} />
            {current.feelsLikeC !== null && current.feelsLikeC !== current.temperatureC ? (
              <>
                {" (מרגיש כמו "}
                <Temperature celsius={current.feelsLikeC} />
                {")"}
              </>
            ) : (
              ""
            )}
          </div>
          <div style={mutedStyle}>{current.condition}</div>
        </div>
      </div>
      {advice.length > 0 ? (
        <ul style={{ listStyle: "none", padding: 0, marginTop: "0.5rem", display: "flex", flexDirection: "column", gap: "0.25rem" }}>
          {advice.map((tip) => (
            <li key={tip} style={{ fontSize: "0.8125rem" }}>
              {tip}
            </li>
          ))}
        </ul>
      ) : null}
      {rainWindows.length > 0 ? (
        <ul style={{ listStyle: "none", padding: 0, marginTop: "0.375rem" }}>
          {rainWindows.map((window) => (
            <li key={window.startAt} style={{ fontSize: "0.8125rem", color: "var(--color-danger)" }}>
              ☔ צפוי גשם {new Date(window.startAt).toLocaleTimeString("he-IL", { hour: "2-digit", minute: "2-digit" })}–
              {new Date(window.endAt).toLocaleTimeString("he-IL", { hour: "2-digit", minute: "2-digit" })} (עד {window.maxProbabilityPercent}%)
            </li>
          ))}
        </ul>
      ) : null}
      <p style={{ ...mutedStyle, marginTop: "0.5rem" }}>מקור: Open-Meteo · לפי מיקום GPS נוכחי</p>
    </div>
  );
}

const mutedStyle: React.CSSProperties = { color: "var(--color-text-muted)", fontSize: "0.8125rem", margin: 0 };
