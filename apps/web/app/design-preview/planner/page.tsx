"use client";

import { useEffect, useRef, useState, Suspense } from "react";
import { useSearchParams } from "next/navigation";
import { Card, IconSlot, ScreenHeader, ScreenShell, StatusChip, BottomNav, COLOR } from "../shared";
import { getDemoWeatherAction, type DemoWeatherResult } from "../actions";

// אייקוני-מזג-אוויר איכותיים ואחידים (לא אימוג'י, לא ריבוע-ריק) — ממופים
// ממחרוזת ה-condition שמחזיר Open-Meteo (כבר בעברית, ר' wmo-codes.ts).
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

/**
 * מסך יומן ותוכנית יומית (design-preview בלבד) — עריכה/מחיקה/שכפול/העברה
 * מקומיים לגמרי (useState בעמוד הזה), לא מחוברים ל-DB. "מחיקה" דורשת אישור
 * מפורש (לא מוחקת בלחיצה ראשונה) ומאפשרת "בטל" אחרי האישור, לפי בקשה מפורשת.
 */

type ActivityStatus = "מתוכנן" | "בוצע" | "בוטל" | "נדחה";
type BookingStatus = "מאושר" | "ממתין לאישור" | "לא נדרש";
type PaymentStatus = "שולם" | "לא שולם" | "שולם חלקית";

interface Activity {
  id: string;
  date: string;
  time: string;
  endTime: string;
  title: string;
  location: string;
  notes: string;
  status: ActivityStatus;
  bookingStatus: BookingStatus;
  paymentStatus: PaymentStatus;
}

const STATUS_TONE: Record<ActivityStatus, "purple" | "success" | "danger" | "warning"> = {
  מתוכנן: "purple",
  בוצע: "success",
  בוטל: "danger",
  נדחה: "warning",
};

let idCounter = 100;
function nextId(): string {
  idCounter += 1;
  return `act-${idCounter}`;
}

function makeDefaultActivities(day: string): Activity[] {
  const base: Omit<Activity, "date">[] = [
    { id: nextId(), time: "08:30", endTime: "09:15", title: "ארוחת בוקר במלון", location: "[דמו] מלון סנטרל בבנגקוק", notes: "", status: "בוצע", bookingStatus: "לא נדרש", paymentStatus: "שולם" },
    { id: nextId(), time: "10:00", endTime: "11:30", title: "Wat Arun", location: "מקדש השחר", notes: "", status: "בוצע", bookingStatus: "מאושר", paymentStatus: "שולם" },
    { id: nextId(), time: "13:00", endTime: "15:00", title: "שוק ג'אטוצ'אק", location: "Chatuchak Market", notes: "", status: "מתוכנן", bookingStatus: "לא נדרש", paymentStatus: "לא שולם" },
    { id: nextId(), time: "17:00", endTime: "18:00", title: "עיסוי תאילנדי", location: "ספא במלון", notes: "", status: "בוטל", bookingStatus: "ממתין לאישור", paymentStatus: "לא שולם" },
    { id: nextId(), time: "20:00", endTime: "22:00", title: "ארוחת ערב", location: "Sirocco Sky Bar", notes: "", status: "נדחה", bookingStatus: "מאושר", paymentStatus: "שולם חלקית" },
  ];
  return base.map((a) => ({ ...a, date: day }));
}

function formatHebrewDate(iso: string): string {
  try {
    return new Date(`${iso}T12:00:00`).toLocaleDateString("he-IL", { weekday: "long", day: "numeric", month: "long" });
  } catch {
    return iso;
  }
}

// ---------- UI קטנים משותפים למסך הזה ----------

function Sheet({ onClose, children, maxHeight = "80vh" }: { onClose: () => void; children: React.ReactNode; maxHeight?: string }) {
  return (
    <>
      <div onClick={onClose} style={{ position: "fixed", inset: 0, background: "rgba(2,6,16,0.62)", zIndex: 50 }} />
      <div
        style={{
          position: "fixed",
          insetInlineStart: 0,
          insetInlineEnd: 0,
          bottom: 0,
          zIndex: 51,
          maxWidth: "480px",
          marginInline: "auto",
          background: "#0c1526",
          border: `1px solid ${COLOR.cardBorder}`,
          borderBottom: "none",
          borderRadius: "24px 24px 0 0",
          boxShadow: "0 -20px 60px rgba(0,0,0,0.55)",
          padding: "16px 16px calc(16px + env(safe-area-inset-bottom))",
          maxHeight,
          overflowY: "auto",
        }}
      >
        {children}
      </div>
    </>
  );
}

function SheetHeader({ title, onClose }: { title: string; onClose: () => void }) {
  return (
    <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: "14px" }}>
      <span style={{ fontWeight: 800, fontSize: "15px" }}>{title}</span>
      <button type="button" onClick={onClose} aria-label="סגור" style={{ background: "rgba(255,255,255,0.06)", border: "none", color: COLOR.textMuted, width: "28px", height: "28px", borderRadius: "50%", cursor: "pointer", fontSize: "15px" }}>
        ✕
      </button>
    </div>
  );
}

function ActionRow({ label, onClick, danger }: { label: string; onClick: () => void; danger?: boolean }) {
  return (
    <button
      type="button"
      onClick={onClick}
      style={{
        display: "flex",
        alignItems: "center",
        gap: "12px",
        width: "100%",
        padding: "13px 8px",
        borderRadius: "12px",
        background: "transparent",
        border: "none",
        color: danger ? COLOR.danger : COLOR.textPrimary,
        fontSize: "14px",
        fontWeight: danger ? 700 : 600,
        cursor: "pointer",
        textAlign: "start",
      }}
    >
      <IconSlot size={20} />
      {label}
    </button>
  );
}

function fieldLabelStyle(): React.CSSProperties {
  return { fontSize: "11px", color: COLOR.textSecondary, marginBottom: "5px", display: "block", fontWeight: 700 };
}
function inputStyle(): React.CSSProperties {
  return {
    width: "100%",
    padding: "10px 12px",
    borderRadius: "10px",
    background: "rgba(255,255,255,0.06)",
    border: `1px solid ${COLOR.cardBorder}`,
    color: "#fff",
    fontSize: "13px",
    fontFamily: "inherit",
  };
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div style={{ marginBottom: "12px" }}>
      <label style={fieldLabelStyle()}>{label}</label>
      {children}
    </div>
  );
}

function PillSelect<T extends string>({ options, value, onChange }: { options: T[]; value: T; onChange: (v: T) => void }) {
  return (
    <div style={{ display: "flex", gap: "6px", flexWrap: "wrap" }}>
      {options.map((opt) => (
        <button
          key={opt}
          type="button"
          onClick={() => onChange(opt)}
          style={{
            padding: "7px 12px",
            borderRadius: "999px",
            background: opt === value ? `linear-gradient(135deg, #a480f5, ${COLOR.purpleDeep})` : "rgba(255,255,255,0.05)",
            border: `1px solid ${opt === value ? "transparent" : COLOR.cardBorder}`,
            color: opt === value ? "#fff" : COLOR.textSecondary,
            fontSize: "12px",
            fontWeight: 700,
            cursor: "pointer",
          }}
        >
          {opt}
        </button>
      ))}
    </div>
  );
}

function Toast({ message, actionLabel, onAction }: { message: string; actionLabel?: string; onAction?: () => void }) {
  return (
    <div
      style={{
        position: "fixed",
        insetInlineStart: "16px",
        insetInlineEnd: "16px",
        bottom: "calc(64px + 14px)",
        zIndex: 60,
        maxWidth: "448px",
        marginInline: "auto",
        display: "flex",
        alignItems: "center",
        justifyContent: "space-between",
        gap: "10px",
        padding: "12px 14px",
        borderRadius: "14px",
        background: "#161d3b",
        border: `1px solid ${COLOR.cardBorder}`,
        boxShadow: "0 10px 30px rgba(0,0,0,0.5)",
      }}
    >
      <span style={{ fontSize: "13px", fontWeight: 600 }}>{message}</span>
      {actionLabel ? (
        <button type="button" onClick={onAction} style={{ background: "transparent", border: "none", color: COLOR.purple, fontSize: "13px", fontWeight: 800, cursor: "pointer" }}>
          {actionLabel}
        </button>
      ) : null}
    </div>
  );
}

// ---------- המסך עצמו ----------

function PlannerContent() {
  const params = useSearchParams();
  const initialDay = params.get("day") ?? "2026-05-04";
  const initialCity = params.get("city") ?? "בנגקוק";

  const [activities, setActivities] = useState<Activity[]>(() => makeDefaultActivities(initialDay));
  const [dayMeta, setDayMeta] = useState({ label: "", date: initialDay, city: initialCity, notes: "" });

  // מזג-אוויר אמיתי (Open-Meteo, ר' actions.ts) — לא תרשים ריק/מומצא. הערה:
  // התאריך המבוקש (2026) רחוק מטווח-התחזית האמין (~16 יום קדימה), אז זו
  // תחזית-נוכחית אמיתית לבנגקוק, לא תחזית ליום הספציפי המבוקש — מצוין
  // בבירור בממשק, לא מוסתר.
  const [weather, setWeather] = useState<{ status: "loading" | "success" | "error"; data: DemoWeatherResult | null }>({ status: "loading", data: null });
  const [weatherExpanded, setWeatherExpanded] = useState(false);
  useEffect(() => {
    getDemoWeatherAction()
      .then((res) => setWeather({ status: res ? "success" : "error", data: res }))
      .catch(() => setWeather({ status: "error", data: null }));
  }, []);

  const [menuFor, setMenuFor] = useState<Activity | null>(null);
  const [dialog, setDialog] = useState<
    | { type: "edit"; activity: Activity }
    | { type: "time"; activity: Activity }
    | { type: "status"; activity: Activity }
    | { type: "move"; activity: Activity }
    | { type: "delete"; activity: Activity }
    | { type: "editDay" }
    | null
  >(null);

  const [toast, setToast] = useState<{ message: string; actionLabel?: string; onAction?: () => void } | null>(null);
  const toastTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const pendingDelete = useRef<{ activity: Activity; index: number } | null>(null);

  function showToast(message: string, actionLabel?: string, onAction?: () => void) {
    if (toastTimer.current) clearTimeout(toastTimer.current);
    setToast({ message, actionLabel, onAction });
    toastTimer.current = setTimeout(() => setToast(null), 4500);
  }

  // פותח תפריט/דיאלוג חדש ומנקה קודם כל גיליון-toast-שנשאר פתוח — בלי זה,
  // toast משארית-פעולה-קודמת (עד 4.5 שניות) יכול לחפוף ויזואלית לגיליון חדש
  // שנפתח מיד אחריו (זוהה בבדיקה בפועל: "מחיקה" שנפתח מיד אחרי "העברה").
  // openDialog גם סוגר את תפריט-שלוש-הנקודות (menuFor) כי הדיאלוג מחליף אותו
  // ולא אמור להיערם עליו (זוהה בבדיקה בפועל: שני הגיליונות נשארו פתוחים יחד).
  function openMenu(a: Activity) {
    if (toastTimer.current) clearTimeout(toastTimer.current);
    setToast(null);
    setMenuFor(a);
  }
  function openDialog(d: NonNullable<typeof dialog>) {
    if (toastTimer.current) clearTimeout(toastTimer.current);
    setToast(null);
    setMenuFor(null);
    setDialog(d);
  }

  useEffect(() => () => { if (toastTimer.current) clearTimeout(toastTimer.current); }, []);

  const visibleActivities = activities.filter((a) => a.date === dayMeta.date).sort((a, b) => a.time.localeCompare(b.time));

  function updateActivity(id: string, patch: Partial<Activity>) {
    setActivities((prev) => prev.map((a) => (a.id === id ? { ...a, ...patch } : a)));
  }

  function handleAddActivity() {
    const a: Activity = {
      id: nextId(),
      date: dayMeta.date,
      time: "12:00",
      endTime: "13:00",
      title: "פעילות חדשה",
      location: "",
      notes: "",
      status: "מתוכנן",
      bookingStatus: "לא נדרש",
      paymentStatus: "לא שולם",
    };
    setActivities((prev) => [...prev, a]);
    openDialog({ type: "edit", activity: a });
  }

  function handleDuplicate(a: Activity) {
    const copy: Activity = { ...a, id: nextId(), title: `${a.title} (עותק)` };
    setActivities((prev) => {
      const idx = prev.findIndex((x) => x.id === a.id);
      const arr = [...prev];
      arr.splice(idx + 1, 0, copy);
      return arr;
    });
    setMenuFor(null);
    showToast("הפעילות שוכפלה");
  }

  function handleConfirmDelete(a: Activity) {
    const idx = activities.findIndex((x) => x.id === a.id);
    pendingDelete.current = { activity: a, index: idx };
    setActivities((prev) => prev.filter((x) => x.id !== a.id));
    setDialog(null);
    setMenuFor(null);
    showToast(`"${a.title}" נמחקה`, "בטל", () => {
      const pending = pendingDelete.current;
      if (!pending) return;
      setActivities((prev) => {
        const arr = [...prev];
        arr.splice(pending.index, 0, pending.activity);
        return arr;
      });
      setToast(null);
    });
  }

  function handleMove(a: Activity, newDate: string) {
    updateActivity(a.id, { date: newDate });
    setDialog(null);
    setMenuFor(null);
    if (newDate !== dayMeta.date) {
      showToast(`הפעילות "${a.title}" הועברה ל-${formatHebrewDate(newDate)}`);
    }
  }

  return (
    <ScreenShell>
      <ScreenHeader
        title="יומן ותוכנית יומית"
        subtitle={`${formatHebrewDate(dayMeta.date)} · ${dayMeta.city}`}
        action={
          <button
            type="button"
            onClick={() => openDialog({ type: "editDay" })}
            aria-label="עריכת היום"
            style={{
              width: "36px",
              height: "36px",
              borderRadius: "50%",
              background: COLOR.cardBg,
              border: `1px solid ${COLOR.cardBorder}`,
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              cursor: "pointer",
              flexShrink: 0,
            }}
          >
            <IconSlot size={17} />
          </button>
        }
      />

      {dayMeta.notes ? (
        <div style={{ fontSize: "11.5px", color: COLOR.textSecondary, background: "rgba(255,255,255,0.04)", border: `1px solid ${COLOR.cardBorder}`, borderRadius: "10px", padding: "8px 10px" }}>
          📝 {dayMeta.notes}
        </div>
      ) : null}

      {/* מזג-אוויר אמיתי ודינמי (Open-Meteo) — אייקון לפי תנאים בפועל, לא ריבוע ריק */}
      {(() => {
        const bangkokHour = Number(new Intl.DateTimeFormat("en-US", { timeZone: "Asia/Bangkok", hour: "numeric", hour12: false }).format(new Date()));
        const isNight = bangkokHour < 6 || bangkokHour >= 18;
        const d = weather.data;
        const Icon = weatherIconFor(d?.condition ?? null, isNight);
        const rainSoon = (d?.precipitationProbabilityPercent ?? 0) >= 50;
        const recommendation = weather.status !== "success"
          ? null
          : rainSoon
            ? "צפוי גשם היום — כדאי לקחת מטרייה ולשקול פעילויות מקורות"
            : (d?.temperatureC ?? 0) >= 34
              ? "חם מאוד היום — מומלץ להימנע מפעילות חיצונית מאומצת בשעות הצהריים"
              : "מזג האוויר נוח לפעילויות בחוץ";
        return (
          <Card>
            <button type="button" onClick={() => setWeatherExpanded((v) => !v)} aria-expanded={weatherExpanded} style={{ display: "flex", alignItems: "center", justifyContent: "space-between", width: "100%", background: "none", border: "none", padding: 0, cursor: "pointer" }}>
              <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
                <span style={{ fontSize: "32px", fontWeight: 800 }}>{weather.status === "success" ? `${Math.round(d?.temperatureC ?? 0)}°` : weather.status === "loading" ? "…" : "—"}</span>
                <Icon size={30} />
              </div>
              <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
                <div style={{ textAlign: "end", fontSize: "11.5px", color: COLOR.textSecondary }}>
                  {weather.status === "loading" ? (
                    <div>טוען מזג אוויר...</div>
                  ) : weather.status === "success" ? (
                    <>
                      <div>{d?.condition} · מרגיש כמו {Math.round(d?.feelsLikeC ?? 0)}°</div>
                      <div style={{ color: COLOR.textMuted }}>סיכוי לגשם {d?.precipitationProbabilityPercent ?? "—"}% · הקש להרחבה</div>
                    </>
                  ) : (
                    <div style={{ color: COLOR.warning }}>אין חיבור למזג-האוויר — נתוני הדגמה</div>
                  )}
                </div>
                <ChevronDownIcon size={14} />
              </div>
            </button>

            {weatherExpanded && weather.status === "success" && d ? (
              <div style={{ marginTop: "12px", paddingTop: "12px", borderTop: `1px solid ${COLOR.cardBorder}` }}>
                <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: "6px", marginBottom: "10px" }}>
                  {[
                    { label: "מינימום/מקסימום", value: `${Math.round(d.minTemperatureC ?? 0)}°/${Math.round(d.maxTemperatureC ?? 0)}°` },
                    { label: "לחות", value: d.humidityPercent != null ? `${d.humidityPercent}%` : "—" },
                    { label: "רוח", value: d.windSpeedKph != null ? `${Math.round(d.windSpeedKph)} קמ"ש` : "—" },
                  ].map((row) => (
                    <div key={row.label} style={{ background: "#0e1930", border: `1px solid ${COLOR.cardBorder}`, borderRadius: "10px", padding: "8px", textAlign: "center" }}>
                      <div style={{ fontSize: "9.5px", color: COLOR.textMuted }}>{row.label}</div>
                      <div style={{ fontSize: "13px", fontWeight: 800, color: "#fff", marginTop: "2px" }}>{row.value}</div>
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
                          <div style={{ fontSize: "10px", color: COLOR.textMuted }}>{new Date(h.time).toLocaleTimeString("he-IL", { hour: "2-digit" })}</div>
                          <HourIcon size={20} />
                          <div style={{ fontSize: "11px", fontWeight: 700, color: "#fff" }}>{Math.round(h.temperatureC ?? 0)}°</div>
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
                <div style={{ fontSize: "12px", color: "#c9b3ff", fontWeight: 700 }}>{recommendation}</div>
                <div style={{ fontSize: "9.5px", color: COLOR.textMuted, marginTop: "8px" }}>
                  מקור: Open-Meteo · תנאים נוכחיים בבנגקוק (התאריך המבוקש מחוץ לטווח תחזית אמין של ~16 יום)
                </div>
              </div>
            ) : null}
          </Card>
        );
      })()}

      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
        <span style={{ fontWeight: 800, fontSize: "14px" }}>התוכנית ליום</span>
        <button
          type="button"
          onClick={handleAddActivity}
          style={{
            display: "flex",
            alignItems: "center",
            gap: "6px",
            padding: "7px 12px",
            borderRadius: "999px",
            background: `linear-gradient(135deg, #a480f5, ${COLOR.purpleDeep})`,
            border: "none",
            color: "#fff",
            fontSize: "11.5px",
            fontWeight: 700,
            cursor: "pointer",
          }}
        >
          + הוסף פעילות
        </button>
      </div>

      <Card>
        {visibleActivities.length === 0 ? (
          <p style={{ margin: 0, fontSize: "12.5px", color: COLOR.textMuted, textAlign: "center", padding: "12px 0" }}>אין פעילויות ליום הזה עדיין.</p>
        ) : (
          <div style={{ display: "flex", flexDirection: "column" }}>
            {visibleActivities.map((a, i) => (
              <div key={a.id} style={{ display: "flex", gap: "10px", alignItems: "flex-start" }}>
                <div style={{ display: "flex", flexDirection: "column", alignItems: "center", width: "10px", flexShrink: 0 }}>
                  <span style={{ width: "10px", height: "10px", borderRadius: "50%", background: COLOR.purple, flexShrink: 0, marginTop: "6px" }} />
                  {i < visibleActivities.length - 1 ? <span style={{ width: "2px", flex: 1, background: COLOR.cardBorder, marginTop: "2px" }} /> : null}
                </div>
                <div style={{ paddingBottom: i < visibleActivities.length - 1 ? "16px" : 0, flex: 1, minWidth: 0 }}>
                  <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: "8px" }}>
                    <span style={{ fontSize: "12px", color: COLOR.textMuted, fontVariantNumeric: "tabular-nums" }}>
                      {a.time}
                      {a.endTime ? ` – ${a.endTime}` : ""}
                    </span>
                    <StatusChip label={a.status} tone={STATUS_TONE[a.status]} />
                  </div>
                  <div style={{ fontSize: "14px", fontWeight: 700, marginTop: "2px" }}>{a.title}</div>
                  {a.location ? <div style={{ fontSize: "12px", color: COLOR.textSecondary }}>{a.location}</div> : null}
                </div>
                {/* כפתור-שלוש-נקודות — אזור-לחיצה נוח (44x44), לא חופף לטקסט. */}
                <button
                  type="button"
                  onClick={() => openMenu(a)}
                  aria-label={`פעולות עבור ${a.title}`}
                  style={{
                    width: "40px",
                    height: "40px",
                    minWidth: "40px",
                    borderRadius: "12px",
                    background: "rgba(255,255,255,0.05)",
                    border: `1px solid ${COLOR.cardBorder}`,
                    color: COLOR.textPrimary,
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    cursor: "pointer",
                    flexShrink: 0,
                    marginTop: "-2px",
                  }}
                >
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor" aria-hidden>
                    <circle cx="12" cy="5" r="2" />
                    <circle cx="12" cy="12" r="2" />
                    <circle cx="12" cy="19" r="2" />
                  </svg>
                </button>
              </div>
            ))}
          </div>
        )}
      </Card>

      <BottomNav active="planner" />

      {/* --- תפריט-פעולות (שלוש-נקודות) --- */}
      {menuFor ? (
        <Sheet onClose={() => setMenuFor(null)}>
          <SheetHeader title={menuFor.title} onClose={() => setMenuFor(null)} />
          <div style={{ display: "flex", flexDirection: "column" }}>
            <ActionRow label="עריכת הפעילות" onClick={() => openDialog({ type: "edit", activity: menuFor })} />
            <ActionRow label="שינוי שעה" onClick={() => openDialog({ type: "time", activity: menuFor })} />
            <ActionRow label="שינוי סטטוס" onClick={() => openDialog({ type: "status", activity: menuFor })} />
            <ActionRow label="העברה ליום אחר" onClick={() => openDialog({ type: "move", activity: menuFor })} />
            <ActionRow label="שכפול הפעילות" onClick={() => handleDuplicate(menuFor)} />
            <div style={{ height: 1, background: COLOR.cardBorder, margin: "4px 0" }} />
            <ActionRow label="מחיקת הפעילות" danger onClick={() => openDialog({ type: "delete", activity: menuFor })} />
          </div>
        </Sheet>
      ) : null}

      {/* --- עריכת פעילות מלאה --- */}
      {dialog?.type === "edit" ? (
        <EditActivitySheet
          activity={dialog.activity}
          onClose={() => setDialog(null)}
          onSave={(patch) => {
            updateActivity(dialog.activity.id, patch);
            setDialog(null);
            setMenuFor(null);
            showToast("הפעילות עודכנה");
          }}
        />
      ) : null}

      {/* --- שינוי שעה --- */}
      {dialog?.type === "time" ? (
        <Sheet onClose={() => setDialog(null)}>
          <SheetHeader title="שינוי שעה" onClose={() => setDialog(null)} />
          <QuickTimeForm
            activity={dialog.activity}
            onSave={(time, endTime) => {
              updateActivity(dialog.activity.id, { time, endTime });
              setDialog(null);
              setMenuFor(null);
              showToast("השעה עודכנה");
            }}
          />
        </Sheet>
      ) : null}

      {/* --- שינוי סטטוס --- */}
      {dialog?.type === "status" ? (
        <Sheet onClose={() => setDialog(null)}>
          <SheetHeader title="שינוי סטטוס" onClose={() => setDialog(null)} />
          <div style={{ display: "flex", gap: "8px", flexWrap: "wrap" }}>
            {(["מתוכנן", "בוצע", "נדחה", "בוטל"] as ActivityStatus[]).map((s) => (
              <button
                key={s}
                type="button"
                onClick={() => {
                  updateActivity(dialog.activity.id, { status: s });
                  setDialog(null);
                  setMenuFor(null);
                  showToast("הסטטוס עודכן");
                }}
                style={{
                  padding: "9px 16px",
                  borderRadius: "999px",
                  background: s === dialog.activity.status ? "rgba(138,90,223,0.25)" : "rgba(255,255,255,0.05)",
                  border: `1px solid ${s === dialog.activity.status ? COLOR.purple : COLOR.cardBorder}`,
                  color: COLOR.textPrimary,
                  fontSize: "13px",
                  fontWeight: 700,
                  cursor: "pointer",
                }}
              >
                {s}
              </button>
            ))}
          </div>
        </Sheet>
      ) : null}

      {/* --- העברה ליום אחר --- */}
      {dialog?.type === "move" ? (
        <Sheet onClose={() => setDialog(null)}>
          <SheetHeader title="העברה ליום אחר" onClose={() => setDialog(null)} />
          <MoveForm activity={dialog.activity} onSave={(newDate) => handleMove(dialog.activity, newDate)} />
        </Sheet>
      ) : null}

      {/* --- אישור מחיקה (לא מוחק מיד) --- */}
      {dialog?.type === "delete" ? (
        <Sheet onClose={() => setDialog(null)} maxHeight="50vh">
          <SheetHeader title="מחיקת פעילות" onClose={() => setDialog(null)} />
          <p style={{ fontSize: "13.5px", color: COLOR.textSecondary, marginBottom: "18px" }}>
            למחוק את הפעילות <strong style={{ color: "#fff" }}>&quot;{dialog.activity.title}&quot;</strong>? אי אפשר לבטל את זה אחרי כמה שניות (יופיע כפתור &quot;בטל&quot; זמני).
          </p>
          <div style={{ display: "flex", gap: "10px" }}>
            <button
              type="button"
              onClick={() => setDialog(null)}
              style={{ flex: 1, padding: "12px", borderRadius: "12px", background: "rgba(255,255,255,0.06)", border: `1px solid ${COLOR.cardBorder}`, color: COLOR.textPrimary, fontSize: "13.5px", fontWeight: 700, cursor: "pointer" }}
            >
              ביטול
            </button>
            <button
              type="button"
              onClick={() => handleConfirmDelete(dialog.activity)}
              style={{ flex: 1, padding: "12px", borderRadius: "12px", background: COLOR.danger, border: "none", color: "#fff", fontSize: "13.5px", fontWeight: 800, cursor: "pointer" }}
            >
              מחיקה
            </button>
          </div>
        </Sheet>
      ) : null}

      {/* --- עריכת יום --- */}
      {dialog?.type === "editDay" ? (
        <Sheet onClose={() => setDialog(null)}>
          <SheetHeader title="עריכת היום" onClose={() => setDialog(null)} />
          <EditDayForm
            meta={dayMeta}
            onSave={(next) => {
              setDayMeta(next);
              setDialog(null);
              showToast("פרטי היום עודכנו");
            }}
          />
        </Sheet>
      ) : null}

      {toast ? <Toast message={toast.message} actionLabel={toast.actionLabel} onAction={toast.onAction} /> : null}
    </ScreenShell>
  );
}

function EditActivitySheet({ activity, onClose, onSave }: { activity: Activity; onClose: () => void; onSave: (patch: Partial<Activity>) => void }) {
  const [form, setForm] = useState(activity);
  return (
    <Sheet onClose={onClose}>
      <SheetHeader title="עריכת פעילות" onClose={onClose} />
      <Field label="שם הפעילות">
        <input style={inputStyle()} value={form.title} onChange={(e) => setForm({ ...form, title: e.target.value })} />
      </Field>
      <Field label="תאריך">
        <input type="date" style={inputStyle()} value={form.date} onChange={(e) => setForm({ ...form, date: e.target.value })} />
      </Field>
      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "10px" }}>
        <Field label="שעת התחלה">
          <input type="time" style={inputStyle()} value={form.time} onChange={(e) => setForm({ ...form, time: e.target.value })} />
        </Field>
        <Field label="שעת סיום">
          <input type="time" style={inputStyle()} value={form.endTime} onChange={(e) => setForm({ ...form, endTime: e.target.value })} />
        </Field>
      </div>
      <Field label="מיקום">
        <input style={inputStyle()} value={form.location} onChange={(e) => setForm({ ...form, location: e.target.value })} />
      </Field>
      <Field label="הערות">
        <textarea style={{ ...inputStyle(), minHeight: "60px", resize: "vertical" }} value={form.notes} onChange={(e) => setForm({ ...form, notes: e.target.value })} />
      </Field>
      <Field label="מצב הזמנה">
        <PillSelect options={["מאושר", "ממתין לאישור", "לא נדרש"] as BookingStatus[]} value={form.bookingStatus} onChange={(v) => setForm({ ...form, bookingStatus: v })} />
      </Field>
      <Field label="מצב תשלום">
        <PillSelect options={["שולם", "לא שולם", "שולם חלקית"] as PaymentStatus[]} value={form.paymentStatus} onChange={(v) => setForm({ ...form, paymentStatus: v })} />
      </Field>
      <Field label="סטטוס הפעילות">
        <PillSelect options={["מתוכנן", "בוצע", "בוטל", "נדחה"] as ActivityStatus[]} value={form.status} onChange={(v) => setForm({ ...form, status: v })} />
      </Field>
      <button
        type="button"
        onClick={() => onSave(form)}
        style={{ width: "100%", padding: "13px", borderRadius: "12px", background: `linear-gradient(135deg, #a480f5, ${COLOR.purpleDeep})`, border: "none", color: "#fff", fontSize: "14px", fontWeight: 800, cursor: "pointer", marginTop: "6px" }}
      >
        שמירה
      </button>
    </Sheet>
  );
}

function QuickTimeForm({ activity, onSave }: { activity: Activity; onSave: (time: string, endTime: string) => void }) {
  const [time, setTime] = useState(activity.time);
  const [endTime, setEndTime] = useState(activity.endTime);
  return (
    <div>
      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "10px" }}>
        <Field label="שעת התחלה">
          <input type="time" style={inputStyle()} value={time} onChange={(e) => setTime(e.target.value)} />
        </Field>
        <Field label="שעת סיום">
          <input type="time" style={inputStyle()} value={endTime} onChange={(e) => setEndTime(e.target.value)} />
        </Field>
      </div>
      <button
        type="button"
        onClick={() => onSave(time, endTime)}
        style={{ width: "100%", padding: "13px", borderRadius: "12px", background: `linear-gradient(135deg, #a480f5, ${COLOR.purpleDeep})`, border: "none", color: "#fff", fontSize: "14px", fontWeight: 800, cursor: "pointer", marginTop: "6px" }}
      >
        עדכון שעה
      </button>
    </div>
  );
}

function MoveForm({ activity, onSave }: { activity: Activity; onSave: (date: string) => void }) {
  const [date, setDate] = useState(activity.date);
  return (
    <div>
      <Field label="יום חדש">
        <input type="date" style={inputStyle()} value={date} onChange={(e) => setDate(e.target.value)} />
      </Field>
      <button
        type="button"
        onClick={() => onSave(date)}
        style={{ width: "100%", padding: "13px", borderRadius: "12px", background: `linear-gradient(135deg, #a480f5, ${COLOR.purpleDeep})`, border: "none", color: "#fff", fontSize: "14px", fontWeight: 800, cursor: "pointer", marginTop: "6px" }}
      >
        העברה
      </button>
    </div>
  );
}

function EditDayForm({ meta, onSave }: { meta: { label: string; date: string; city: string; notes: string }; onSave: (m: typeof meta) => void }) {
  const [form, setForm] = useState(meta);
  return (
    <div>
      <Field label="שם היום (אופציונלי)">
        <input style={inputStyle()} placeholder='למשל "יום שוק ומקדשים"' value={form.label} onChange={(e) => setForm({ ...form, label: e.target.value })} />
      </Field>
      <Field label="תאריך">
        <input type="date" style={inputStyle()} value={form.date} onChange={(e) => setForm({ ...form, date: e.target.value })} />
      </Field>
      <Field label="עיר">
        <input style={inputStyle()} value={form.city} onChange={(e) => setForm({ ...form, city: e.target.value })} />
      </Field>
      <Field label="הערות כלליות">
        <textarea style={{ ...inputStyle(), minHeight: "60px", resize: "vertical" }} value={form.notes} onChange={(e) => setForm({ ...form, notes: e.target.value })} />
      </Field>
      <button
        type="button"
        onClick={() => onSave(form)}
        style={{ width: "100%", padding: "13px", borderRadius: "12px", background: `linear-gradient(135deg, #a480f5, ${COLOR.purpleDeep})`, border: "none", color: "#fff", fontSize: "14px", fontWeight: 800, cursor: "pointer", marginTop: "6px" }}
      >
        שמירה
      </button>
    </div>
  );
}

export default function PlannerPreviewScreen() {
  return (
    <Suspense fallback={null}>
      <PlannerContent />
    </Suspense>
  );
}
