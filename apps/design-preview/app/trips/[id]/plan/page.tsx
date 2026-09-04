"use client";

import { useEffect, useRef, useState, Suspense } from "react";
import { useParams, useRouter, useSearchParams } from "next/navigation";
import { ScreenShell, ScreenHeader, Card, PlusIcon, ChevronIcon, COLOR, SPACE, RADIUS } from "../../../design-system";
import { LegacyBottomNav } from "../../../route/legacy-shared";
import { activitiesForDate, cityForDate, loadStops, type TripActivity } from "../../../trip-content";
import { findAnyTrip, type DemoTrip } from "../../../trips-data";
import type { DemoWeatherResult } from "../../../actions";
import { fetchWeather } from "../../../weather-client";
import { today } from "../../../wallet-data";

const CATEGORY_LABEL: Record<TripActivity["category"], string> = { אתר: "אתר היסטורי", אוכל: "קולינרי", קניות: "שופינג", טיול: "סיור עירוני", עוד: "פעילות" };

// כמה ניסיונות עם השהיה עולה — ראו הערה מקבילה ב-mobile-home-mock.tsx:
// גם Route Handler רגיל (לא רק server action) נכשל לפעמים כשקוראים לו
// כמה פעמים ברצף קצר, ככל הנראה הגבלת-קצב אצל הספק החינמי (Open-Meteo)
// עצמו — ניסיון בודד לא הספיק תמיד; כמה ניסיונות עם פערים גדלים נותנים
// סיכוי אמיתי לחלון ההגבלה לחלוף.
async function fetchWithRetries<T>(fn: () => Promise<T | null>, delaysMs: number[] = [1000, 2000]): Promise<T | null> {
  for (let attempt = 0; ; attempt++) {
    try {
      const res = await fn();
      if (res) return res;
    } catch {
      // ממשיכים לניסיון הבא
    }
    if (attempt >= delaysMs.length) return null;
    await new Promise((r) => setTimeout(r, delaysMs[attempt]));
  }
}

// UTC בלבד בכוונה — ראו ההערה המקבילה ב-app/map/page.tsx: פענוח-מקומי +
// toISOString (UTC) יכולים "לתקוע" את התאריך על אותו יום שוב ושוב באזורי-
// זמן עם היסט חיובי מ-UTC (כמו ישראל), ותפסו בפועל לולאה אינסופית במפה.
function addDaysStr(dateISO: string, n: number): string {
  const [y, m, d] = dateISO.split("-").map(Number);
  const date = new Date(Date.UTC(y!, m! - 1, d!));
  date.setUTCDate(date.getUTCDate() + n);
  return date.toISOString().slice(0, 10);
}

/** כל התאריכים בטווח [start, end] (כולל) — לרצועת-הימים בראש המסך, כדי
 * שכל יום בטיול יהיה נגיש בגלילה, לא רק הימים הסמוכים ליום הנבחר. תקרה
 * הגנתית (400 יום) כדי שלא ליצור מערך-ענק אם תאריכי-הטיול פגומים. */
function dateRange(start: string, end: string): string[] {
  const days: string[] = [];
  let d = start;
  while (d <= end && days.length < 400) {
    days.push(d);
    d = addDaysStr(d, 1);
  }
  return days.length > 0 ? days : [start];
}

// ---------- אייקוני מזג-אוויר איכותיים ואחידים, ממופים ממחרוזת ה-condition
// שמחזיר Open-Meteo (כבר בעברית). מועתקים בדיוק מהגרסה שהייתה במסך
// "יומן" הישן (ששימש נתוני-דמו) — כאן הם מוצגים מעל מזג-אוויר אמיתי. ----------
function WeatherSunIcon({ size = 30 }: { size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="#f5c344" strokeWidth={1.8} strokeLinecap="round" aria-hidden>
      <circle cx="12" cy="12" r="4.2" fill="#f5c344" stroke="none" />
      <path d="M12 2.5v2.2M12 19.3v2.2M4.2 4.2l1.5 1.5M18.3 18.3l1.5 1.5M2.5 12h2.2M19.3 12h2.2M4.2 19.8l1.5-1.5M18.3 5.7l1.5-1.5" />
    </svg>
  );
}
function WeatherMoonIcon({ size = 30 }: { size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="#c7ccdb" aria-hidden>
      <path d="M20 14.5A8.5 8.5 0 0 1 9.5 4a8.5 8.5 0 1 0 10.5 10.5z" />
    </svg>
  );
}
function WeatherPartlyCloudyIcon({ size = 30 }: { size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" aria-hidden>
      <circle cx="9" cy="9" r="4" fill="#f5c344" />
      <path d="M6 18a4 4 0 0 1 .3-8 5 5 0 0 1 9.6 1.2A3.5 3.5 0 0 1 15.5 18z" fill="#c7ccdb" />
    </svg>
  );
}
function WeatherCloudyIcon({ size = 30 }: { size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="#9aa3bd" aria-hidden>
      <path d="M6.5 18a4.2 4.2 0 0 1 .4-8.4 5.3 5.3 0 0 1 10.2 1.3A3.7 3.7 0 0 1 16.3 18z" />
    </svg>
  );
}
function WeatherFogIcon({ size = 30 }: { size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="#9aa3bd" strokeWidth={2} strokeLinecap="round" aria-hidden>
      <path d="M4 8h16M3 12h18M5 16h14M7 20h10" />
    </svg>
  );
}
function WeatherLightRainIcon({ size = 30 }: { size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" aria-hidden>
      <path d="M6.5 14a4.2 4.2 0 0 1 .4-8.4 5.3 5.3 0 0 1 10.2 1.3A3.7 3.7 0 0 1 16.3 14z" fill="#9aa3bd" />
      <path d="M9 17l-1.2 3M13 17l-1.2 3M17 17l-1.2 3" stroke="#4f8fe0" strokeWidth={1.6} strokeLinecap="round" fill="none" />
    </svg>
  );
}
function WeatherHeavyRainIcon({ size = 30 }: { size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" aria-hidden>
      <path d="M6.5 13a4.2 4.2 0 0 1 .4-8.4 5.3 5.3 0 0 1 10.2 1.3A3.7 3.7 0 0 1 16.3 13z" fill="#6b7290" />
      <path d="M7 16l-1.5 4M11.5 16 10 20M16 16l-1.5 4M20 16l-1.5 4" stroke="#4f8fe0" strokeWidth={1.8} strokeLinecap="round" fill="none" />
    </svg>
  );
}
function WeatherThunderstormIcon({ size = 30 }: { size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" aria-hidden>
      <path d="M6.5 12a4.2 4.2 0 0 1 .4-8.4 5.3 5.3 0 0 1 10.2 1.3A3.7 3.7 0 0 1 16.3 12z" fill="#6b7290" />
      <path d="M13 12l-3 5h3l-2 5 5-6h-3z" fill="#f5c344" />
    </svg>
  );
}
function weatherIconFor(condition: string | null, isNight: boolean) {
  const c = condition ?? "";
  if (c.includes("סופת רעמים")) return WeatherThunderstormIcon;
  if (c.includes("גשם כבד") || c.includes("ממטרים עזים") || c.includes("שלג")) return WeatherHeavyRainIcon;
  if (c.includes("גשם") || c.includes("טפטוף") || c.includes("ממטרים")) return WeatherLightRainIcon;
  if (c.includes("ערפל")) return WeatherFogIcon;
  if (c.includes("מעונן חלקית") || c.includes("בהיר בעיקר")) return isNight ? WeatherMoonIcon : WeatherPartlyCloudyIcon;
  if (c.includes("מעונן")) return WeatherCloudyIcon;
  if (c.includes("בהיר")) return isNight ? WeatherMoonIcon : WeatherSunIcon;
  return isNight ? WeatherMoonIcon : WeatherSunIcon;
}
function ChevronDownIcon({ size = 14 }: { size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="#fff" strokeWidth={2.2} strokeLinecap="round" strokeLinejoin="round" aria-hidden>
      <path d="M6 9l6 6 6-6" />
    </svg>
  );
}

function WeatherCard({ weather, cityLabel }: { weather: { status: "loading" | "success" | "error"; data: DemoWeatherResult | null }; cityLabel: string }) {
  const [expanded, setExpanded] = useState(false);
  // isNight נקבע רק בצד-הלקוח (לא ברנדור עצמו): שרת ה-SSR ולקוח יכולים
  // להיות באזורי-זמן שונים, כך ש-new Date().getHours() בזמן-רנדור עלול
  // להחזיר ערך שונה משני הצדדים ולגרום ל-hydration mismatch אמיתי (React
  // error #418, נצפה בפועל בבדיקה מול production) — ברירת-המחדל "יום"
  // זהה בשני הצדדים, והלקוח מתקן את עצמו מיד אחרי ה-mount הראשון.
  const [isNight, setIsNight] = useState(false);
  useEffect(() => {
    const hour = new Date().getHours();
    setIsNight(hour < 6 || hour >= 19);
  }, []);
  const d = weather.data;
  const Icon = weatherIconFor(d?.condition ?? null, isNight);
  const rainSoon = (d?.precipitationProbabilityPercent ?? 0) >= 50;
  const recommendation =
    weather.status !== "success"
      ? null
      : rainSoon
        ? "צפוי גשם היום — כדאי לקחת מטרייה ולשקול פעילויות מקורות"
        : (d?.temperatureC ?? 0) >= 34
          ? "חם מאוד היום — מומלץ להימנע מפעילות חיצונית מאומצת בשעות הצהריים"
          : "מזג האוויר נוח לפעילויות בחוץ";

  return (
    <Card>
      <button type="button" onClick={() => setExpanded((v) => !v)} aria-expanded={expanded} style={{ display: "flex", alignItems: "center", justifyContent: "space-between", width: "100%", background: "none", border: "none", padding: 0, cursor: "pointer" }}>
        <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
          <span style={{ fontSize: "32px", fontWeight: 800, color: COLOR.textPrimary }}>{weather.status === "success" ? `${Math.round(d?.temperatureC ?? 0)}°` : weather.status === "loading" ? "…" : "—"}</span>
          <Icon size={30} />
        </div>
        <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
          <div style={{ textAlign: "end", fontSize: "11.5px", color: COLOR.textSecondary }}>
            {weather.status === "loading" ? (
              <div>טוען מזג אוויר...</div>
            ) : weather.status === "success" ? (
              <>
                <div>
                  {d?.condition} · מרגיש כמו {Math.round(d?.feelsLikeC ?? 0)}°
                </div>
                <div style={{ color: COLOR.textSecondary }}>סיכוי לגשם {d?.precipitationProbabilityPercent ?? "—"}% · הקש להרחבה</div>
              </>
            ) : (
              <div style={{ color: COLOR.warning }}>אין חיבור למזג-האוויר</div>
            )}
          </div>
          <ChevronDownIcon size={14} />
        </div>
      </button>

      {expanded && weather.status === "success" && d ? (
        <div style={{ marginTop: "12px", paddingTop: "12px", borderTop: `1px solid ${COLOR.border}` }}>
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: "6px", marginBottom: "10px" }}>
            {[
              { label: "מינימום/מקסימום", value: `${Math.round(d.minTemperatureC ?? 0)}°/${Math.round(d.maxTemperatureC ?? 0)}°` },
              { label: "לחות", value: d.humidityPercent != null ? `${d.humidityPercent}%` : "—" },
              { label: "רוח", value: d.windSpeedKph != null ? `${Math.round(d.windSpeedKph)} קמ"ש` : "—" },
            ].map((row) => (
              <div key={row.label} style={{ background: COLOR.cardElevated, border: `1px solid ${COLOR.border}`, borderRadius: "10px", padding: "8px", textAlign: "center" }}>
                <div style={{ fontSize: "9.5px", color: COLOR.textSecondary }}>{row.label}</div>
                <div style={{ fontSize: "13px", fontWeight: 800, color: COLOR.textPrimary, marginTop: "2px" }}>{row.value}</div>
              </div>
            ))}
          </div>
          {d.sunrise || d.sunset ? (
            <div style={{ fontSize: "11.5px", color: COLOR.textSecondary, marginBottom: "10px" }}>
              זריחה {d.sunrise ? new Date(d.sunrise).toLocaleTimeString("he-IL", { hour: "2-digit", minute: "2-digit" }) : "—"} · שקיעה {d.sunset ? new Date(d.sunset).toLocaleTimeString("he-IL", { hour: "2-digit", minute: "2-digit" }) : "—"}
            </div>
          ) : null}
          {d.hourly.length > 0 ? (
            <div style={{ display: "flex", gap: "8px", overflowX: "auto", marginBottom: "10px" }}>
              {d.hourly.map((h, i) => {
                const HourIcon = weatherIconFor(h.condition, isNight);
                return (
                  <div key={i} style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: "3px", minWidth: "48px", flexShrink: 0 }}>
                    <div style={{ fontSize: "10px", color: COLOR.textSecondary }}>{new Date(h.time).toLocaleTimeString("he-IL", { hour: "2-digit" })}</div>
                    <HourIcon size={20} />
                    <div style={{ fontSize: "11px", fontWeight: 700, color: COLOR.textPrimary }}>{Math.round(h.temperatureC ?? 0)}°</div>
                  </div>
                );
              })}
            </div>
          ) : null}
          {rainSoon ? (
            <div style={{ fontSize: "11.5px", color: COLOR.warning, background: "rgba(245,165,68,0.12)", border: `1px solid ${COLOR.warning}40`, borderRadius: "10px", padding: "8px 10px", marginBottom: "8px" }}>
              ⚠ סיכוי גבוה לגשם — ייתכן שישפיע על פעילויות מתוכננות בחוץ היום
            </div>
          ) : null}
          <div style={{ fontSize: "12px", color: COLOR.primaryLight, fontWeight: 700 }}>{recommendation}</div>
          <div style={{ fontSize: "9.5px", color: COLOR.textSecondary, marginTop: "8px" }}>
            מקור: Open-Meteo · תנאים נוכחיים ב{cityLabel || "מיקום הטיול"}
          </div>
        </div>
      ) : null}
    </Card>
  );
}

function DailyPlanContent() {
  const router = useRouter();
  const params = useParams<{ id: string }>();
  const search = useSearchParams();
  const [date, setDate] = useState(search.get("day") || today());
  const [activities, setActivities] = useState<TripActivity[]>([]);
  // city מתחיל ריק ולא cityForDate(date) ישירות בגוף-הרנדור בכוונה: זו
  // קריאה ל-localStorage, שלא קיים בצד-השרת (SSR) — קריאה ישירה ברנדור
  // גרמה בפועל ל-hydration mismatch אמיתי (React error #418, נצפה מול
  // production): השרת מרנדר בלי התוכן (אין localStorage), הלקוח מרנדר
  // איתו כבר בפאס הראשון. אותה בעיה שכבר נפתרה נכון עבור activities למטה
  // (state+effect) — city פשוט לא היה עקבי איתה.
  const [city, setCity] = useState("");
  const [trip, setTrip] = useState<DemoTrip | null>(null);
  const [weather, setWeather] = useState<{ status: "loading" | "success" | "error"; data: DemoWeatherResult | null }>({ status: "loading", data: null });
  const dayButtonRefs = useRef(new Map<string, HTMLButtonElement>());

  useEffect(() => {
    const loaded = findAnyTrip(params.id);
    setTrip(loaded);
    // אם לא הגיע יום מפורש ב-URL (?day=) והיום שגוי-כברירת-מחדל (today())
    // לא נמצא בכלל בטווח התאריכים של הטיול (טיול עתידי/היסטורי) — עוברים
    // ליום הראשון של הטיול, אחרת הרצועה החדשה (שמכסה רק את טווח הטיול)
    // הייתה נטענת בלי שום כפתור מסומן כ"נבחר".
    if (loaded && !search.get("day") && (date < loaded.startDate || date > loaded.endDate)) setDate(loaded.startDate);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [params.id]);

  useEffect(() => {
    setActivities(activitiesForDate(params.id, date));
    setCity(cityForDate(params.id, date));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [date]);

  // גלילה-אוטומטית ליום הנבחר בכל פעם שהוא משתנה (כולל טעינה ראשונית) —
  // כדי שהיום הנבחר תמיד יהיה גלוי גם ברצועה שמכסה טיול ארוך.
  useEffect(() => {
    dayButtonRefs.current.get(date)?.scrollIntoView({ behavior: "smooth", inline: "center", block: "nearest" });
  }, [date, trip]);

  // מזג-אוויר אמיתי (Open-Meteo) של המיקום האמיתי של התחנה ליום הזה (לפי
  // הקואורדינטות שאותרו כשהתחנה נשמרה) — ולא בנגקוק קבועה. אם לתחנה עוד
  // אין קואורדינטות (לא אותרו/נכשל האיתור), נופל חזרה לברירת-המחדל של
  // הפעולה כדי עדיין להציג משהו, אבל זה לא המיקום האמיתי.
  useEffect(() => {
    const stop = loadStops(params.id).find((s) => date >= s.startDate && date <= s.endDate);
    const coords = stop?.lat != null && stop?.lon != null ? { lat: stop.lat, lng: stop.lon } : undefined;
    setWeather({ status: "loading", data: null });
    fetchWithRetries(() => fetchWeather(coords)).then((res) => setWeather({ status: res ? "success" : "error", data: res }));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [date]);

  const monthLabel = new Date(date).toLocaleDateString("he-IL", { month: "long", year: "numeric" });
  const dayLabel = new Date(date).toLocaleDateString("he-IL", { weekday: "long", day: "numeric", month: "long" });
  const strip = trip ? dateRange(trip.startDate, trip.endDate) : [date];

  return (
    <ScreenShell>
      <ScreenHeader title="התוכנית היומית" subtitle={monthLabel} />

      <div style={{ display: "flex", gap: SPACE.sm, overflowX: "auto", paddingBottom: "2px" }}>
        {strip.map((d) => {
          const active = d === date;
          const dd = new Date(d);
          return (
            <button
              key={d}
              type="button"
              data-testid="plan-day-button"
              ref={(el) => {
                if (el) dayButtonRefs.current.set(d, el);
                else dayButtonRefs.current.delete(d);
              }}
              onClick={() => setDate(d)}
              style={{ flexShrink: 0, minWidth: "48px", display: "flex", flexDirection: "column", alignItems: "center", gap: "4px", padding: "10px 4px", borderRadius: `${RADIUS.card}px`, background: active ? COLOR.primary : COLOR.card, border: `1px solid ${active ? COLOR.primary : COLOR.border}`, cursor: "pointer" }}
            >
              <span style={{ fontSize: "10px", color: active ? "#fff" : COLOR.textSecondary }}>{dd.toLocaleDateString("he-IL", { weekday: "short" })}</span>
              <span style={{ fontSize: "14px", fontWeight: 700, color: active ? "#fff" : COLOR.textPrimary }}>{dd.getDate()}</span>
            </button>
          );
        })}
      </div>

      <div>
        <div style={{ fontSize: "15px", fontWeight: 700, color: COLOR.textPrimary }}>{dayLabel}</div>
        {city ? <div style={{ fontSize: "12px", color: COLOR.textSecondary, marginTop: "2px" }}>{city}</div> : null}
      </div>

      <WeatherCard weather={weather} cityLabel={city} />

      <div style={{ display: "flex", flexDirection: "column", gap: SPACE.sm, position: "relative" }}>
        {activities.length === 0 ? (
          <Card style={{ textAlign: "center", color: COLOR.textSecondary, fontSize: "12.5px" }}>אין פעילויות מתוכננות ליום זה</Card>
        ) : (
          activities.map((a) => (
            <Card key={a.id} onClick={() => router.push(`/activities/${a.id}`)} style={{ display: "flex", alignItems: "center", gap: SPACE.md, padding: "12px" }}>
              <div style={{ fontSize: "12px", fontWeight: 700, color: COLOR.primaryLight, minWidth: "40px" }}>{a.time}</div>
              <div style={{ width: "40px", height: "40px", borderRadius: "10px", background: COLOR.cardElevated, flexShrink: 0 }} />
              <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{ fontSize: "13.5px", fontWeight: 700, color: COLOR.textPrimary, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{a.title}</div>
                <div style={{ fontSize: "11px", color: COLOR.textSecondary }}>{CATEGORY_LABEL[a.category]}</div>
              </div>
              <ChevronIcon />
            </Card>
          ))
        )}
      </div>

      <button
        type="button"
        onClick={() => router.push(`/trips/${params.id}/plan/add?day=${date}`)}
        aria-label="הוספת פעילות"
        style={{ alignSelf: "center", width: "44px", height: "44px", borderRadius: "50%", background: COLOR.primary, border: "none", color: "#fff", display: "flex", alignItems: "center", justifyContent: "center", cursor: "pointer" }}
      >
        <PlusIcon />
      </button>

      {/* היה חסר לגמרי במסך הזה — היעד האמיתי של טאב "יומן" (דרך /planner)
          נשאר בלי סרגל-ניווט תחתון, כך שלא היה אפשר לעבור למסך אחר בלי
          "חזרה" בדפדפן. אותו סרגל בדיוק כמו שאר מסכי-הניווט הראשיים
          (בית/מסלול/מפה/יומן/ארנק/עוד). */}
      <LegacyBottomNav active="planner" />
    </ScreenShell>
  );
}

export default function DailyPlanScreen() {
  return (
    <Suspense fallback={null}>
      <DailyPlanContent />
    </Suspense>
  );
}
