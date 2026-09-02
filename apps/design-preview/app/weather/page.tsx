"use client";

import { useEffect, useState } from "react";
import { ScreenShell, ScreenHeader, Card, WeatherSunIcon, ThermometerIcon, WindIcon, DropletIcon, COLOR, SPACE } from "../design-system";
import { getDemoWeatherAction, type DemoWeatherResult } from "../actions";

/** מסך "מזג אוויר והתראות" (25) — נתונים אמיתיים מ-Open-Meteo (getDemoWeatherAction,
 * זהה למקור בדף-הבית ובמסך היומן). ההתראות עצמן (חום קיצוני/גשם) הן דמו
 * מוצהר — אין מקור-התראות-אמיתי מחובר. */

// ניסיון-חוזר יחיד אחרי השהיה קצרה — ראו הערה מקבילה ב-mobile-home-mock.tsx:
// נצפה בפועל ש-server action שקורא ל-API חיצוני נכשל לפעמים דווקא בקריאה
// הראשונה אחרי דיפלוי חדש (cold start ב-Vercel), ותמיד מצליח ברגע שהפונקציה
// כבר "חמה" — בלי זה המסך היה נועל "לא ידוע" על סמך כישלון חד-פעמי וחולף.
async function fetchWithOneRetry<T>(fn: () => Promise<T | null>): Promise<T | null> {
  try {
    const first = await fn();
    if (first) return first;
  } catch {
    // ממשיכים לניסיון השני
  }
  await new Promise((r) => setTimeout(r, 1500));
  try {
    return await fn();
  } catch {
    return null;
  }
}

export default function WeatherScreen() {
  const [weather, setWeather] = useState<{ status: "loading" | "success" | "error"; data: DemoWeatherResult | null }>({ status: "loading", data: null });

  useEffect(() => {
    fetchWithOneRetry(getDemoWeatherAction).then((res) => setWeather({ status: res ? "success" : "error", data: res }));
  }, []);

  return (
    <ScreenShell>
      <ScreenHeader title="מזג אוויר והתראות" subtitle="טוקיו, יפן" />

      <Card style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
        <div>
          <div style={{ fontSize: "34px", fontWeight: 700, color: COLOR.textPrimary }}>{weather.data?.temperatureC != null ? `${Math.round(weather.data.temperatureC)}°` : "—"}</div>
          <div style={{ fontSize: "12px", color: COLOR.textSecondary }}>{weather.data?.condition ?? (weather.status === "loading" ? "טוען..." : "לא ידוע")}</div>
        </div>
        <WeatherSunIcon size={48} />
      </Card>

      <div style={{ display: "flex", gap: SPACE.sm }}>
        <MiniStat icon={<DropletIcon />} label="לחות" value={weather.data?.humidityPercent != null ? `${weather.data.humidityPercent}%` : "—"} />
        <MiniStat icon={<WindIcon />} label="רוח" value={weather.data?.windSpeedKph != null ? `${Math.round(weather.data.windSpeedKph)} קמ"ש` : "—"} />
        <MiniStat icon={<ThermometerIcon />} label="מרגיש כמו" value={weather.data?.feelsLikeC != null ? `${Math.round(weather.data.feelsLikeC)}°` : "—"} />
      </div>

      {weather.data?.hourly?.length ? (
        <div style={{ display: "flex", gap: SPACE.md, overflowX: "auto", paddingBottom: SPACE.xs }}>
          {weather.data.hourly.map((h) => (
            <div key={h.time} style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: "4px", flexShrink: 0 }}>
              <span style={{ fontSize: "10.5px", color: COLOR.textSecondary }}>{new Date(h.time).toLocaleTimeString("he-IL", { hour: "2-digit" })}</span>
              <span style={{ fontSize: "13px", fontWeight: 700, color: COLOR.textPrimary }}>{h.temperatureC != null ? `${Math.round(h.temperatureC)}°` : "—"}</span>
            </div>
          ))}
        </div>
      ) : null}

      <div>
        <div style={{ fontSize: "13.5px", fontWeight: 700, color: COLOR.textPrimary, marginBottom: SPACE.sm }}>התראות</div>
        <div style={{ display: "flex", flexDirection: "column", gap: SPACE.sm }}>
          <Card style={{ borderColor: `${COLOR.warning}55`, display: "flex", alignItems: "center", gap: SPACE.sm }}>
            <span style={{ fontSize: "12.5px", color: COLOR.warning }}>[דמו] אזהרת חום קיצוני · טוקיו</span>
          </Card>
        </div>
      </div>
    </ScreenShell>
  );
}

function MiniStat({ icon, label, value }: { icon: React.ReactNode; label: string; value: string }) {
  return (
    <Card style={{ flex: 1, display: "flex", flexDirection: "column", alignItems: "center", gap: "4px", padding: "10px" }}>
      {icon}
      <span style={{ fontSize: "10px", color: COLOR.textSecondary }}>{label}</span>
      <span style={{ fontSize: "13px", fontWeight: 700, color: COLOR.textPrimary }}>{value}</span>
    </Card>
  );
}
