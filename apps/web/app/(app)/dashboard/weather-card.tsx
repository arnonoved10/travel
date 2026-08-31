import type { WeatherForecastSnapshot } from "@travel-app/shared-types";
import { getWeatherAdvice } from "@/lib/weather-advice";
import { Temperature } from "@/components/temperature";
import { DashboardCard } from "./dashboard-card";

type Snapshot = Omit<WeatherForecastSnapshot, "id" | "retrievedAt">;

/** "ד'" מיום-השבוע העברי (יום ראשון..שבת) — לרצועת-התחזית הקומפקטית, לפי המוקאפ. */
function weekdayLetter(iso: string): string {
  return new Date(`${iso}T12:00:00`).toLocaleDateString("he-IL", { weekday: "short" }).slice(0, 1);
}

export function WeatherCard({
  current,
  placeName,
  error,
  title = "מזג אוויר",
  emptyMessage,
  dailyForecast,
}: {
  current: Snapshot | null;
  placeName: string | null;
  error: boolean;
  /** ברירת-מחדל "מזג אוויר" — כשמשתמשים באותו רכיב למזג-אוויר-ביעד-הבא
   * (dashboard/page.tsx) מציגים כותרת מתאימה במקום לשכפל את כל ה-JSX. */
  title?: string;
  /** הודעה כש-current==null ו-!error — ברירת-המחדל מתאימה למזג-אוויר-נוכחי;
   * ליעד-הבא יש נוסח שונה (אין עדיין יעד-הבא ידוע, לא "אין מקום מקושר"). */
  emptyMessage?: React.ReactNode;
  /** תחזית ל-N הימים הבאים (אמיתית, WeatherProvider.getDailyForecast) — לפי
   * המוקאפ. אופציונלי: כרטיס מזג-האוויר-ליעד-הבא לא טוען תחזית-מרובת-ימים
   * משלו, רק את הנוכחי, כדי לא להכפיל בקשות-רשת עבור מידע משני. */
  dailyForecast?: { date: string; minC: number | null; maxC: number | null; icon: string | null }[];
}) {
  const advice = current ? getWeatherAdvice(current) : [];

  // href קבוע ל-/today — בלי זה DashboardCard מסמן אותו "לחיץ" (קורסר-יד,
  // ר' GlassCard.tsx) בלי שום קישור אמיתי מאחורי הקלעים — בדיוק ה"כפתור
  // שלא עושה כלום" שהמשתמש ביקש שלא יישאר.
  return (
    <DashboardCard title={title} href="/today">
      {current ? (
        <div>
          <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: "var(--space-3)" }}>
            <div style={{ display: "flex", alignItems: "center", gap: "var(--space-3)" }}>
              <span style={{ fontSize: "2.5rem", lineHeight: 1 }}>{current.conditionIcon}</span>
              <div>
                <div style={{ font: "var(--text-metric)" }}>
                  <Temperature celsius={current.temperatureC} />
                </div>
                <div style={{ color: "var(--color-text-muted)", font: "var(--text-caption)" }}>
                  {current.condition}
                  {placeName ? ` · ${placeName}` : ""}
                </div>
              </div>
            </div>
            {current.humidityPercent != null || current.windSpeedKph != null ? (
              <div style={{ display: "flex", flexDirection: "column", gap: "0.3125rem", font: "var(--text-caption)", color: "var(--color-text-muted)", textAlign: "end", flexShrink: 0 }}>
                {current.humidityPercent != null ? <span>לחות {Math.round(current.humidityPercent)}%</span> : null}
                {current.windSpeedKph != null ? <span>רוח {Math.round(current.windSpeedKph)} קמ&quot;ש</span> : null}
              </div>
            ) : null}
          </div>
          {advice.length > 0 ? (
            <div style={{ marginTop: "var(--space-2)", font: "var(--text-caption)", color: "var(--color-text-muted)" }}>
              {advice[0]}
            </div>
          ) : null}
          {dailyForecast && dailyForecast.length > 0 ? (
            <div style={{ display: "flex", justifyContent: "space-between", gap: "0.375rem", marginTop: "var(--space-3)", paddingTop: "var(--space-3)", borderTop: "1px solid var(--color-border)" }}>
              {dailyForecast.map((day) => (
                <div key={day.date} style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: "0.1875rem", flex: 1 }}>
                  <span style={{ font: "var(--text-caption)", fontSize: "0.75rem", color: "var(--color-text-muted)" }}>{weekdayLetter(day.date)}</span>
                  <span style={{ fontSize: "1.125rem", lineHeight: 1 }}>{day.icon}</span>
                  <span style={{ font: "var(--text-caption)", fontSize: "0.6875rem", fontVariantNumeric: "tabular-nums", whiteSpace: "nowrap" }}>
                    <Temperature celsius={day.maxC} />/<Temperature celsius={day.minC} />
                  </span>
                </div>
              ))}
            </div>
          ) : null}
        </div>
      ) : error ? (
        <p style={{ color: "var(--color-text-muted)", font: "var(--text-caption)", margin: 0 }}>
          לא הצלחנו לטעון מזג אוויר כרגע.
        </p>
      ) : (
        emptyMessage ?? (
          <p style={{ color: "var(--color-text-muted)", font: "var(--text-caption)", margin: 0 }}>
            אין מקום עם קואורדינטות מקושר לטיול — לחץ לפרטים ב&quot;היום שלי&quot;.
          </p>
        )
      )}
    </DashboardCard>
  );
}
