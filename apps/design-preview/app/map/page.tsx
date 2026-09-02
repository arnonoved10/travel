"use client";

import { useEffect, useMemo, useState } from "react";
import dynamic from "next/dynamic";
import { useRouter } from "next/navigation";
import { LEGACY_COLOR as COLOR, LegacyBottomNav as BottomNav, LEGACY_NAV_HEIGHT as NAV_HEIGHT } from "../route/legacy-shared";
import { loadStops, loadActivities, addStop, updateStop, deleteStop, type TripStop, type TripActivity } from "../trip-content";
import { activeTrip } from "../trips-data";
import { geocodeQueryAction } from "../actions";
import { StopEditSheet } from "../route/stop-edit-sheet";
import type { MapPoint3D } from "./maplibre-map-inner";

/**
 * מפה תלת-ממדית של המסלול האמיתי (design-preview) — לפי בקשה מפורשת:
 * "לראות על המפה את הנקודות והמסלול של כל הטיול וגם לפי יום... ציר של
 * כל יום ושל כל הטיול... תלת מימד". קוראת/כותבת ישירות ל-trip-content.ts
 * (אותו מקור-אמת בדיוק כמו /route) — לא state מקומי נפרד; עריכת/הוספת
 * תחנה משתמשת ב-StopEditSheet הקיים (לא כפילות רכיב שלישית). קואורדינטות
 * אמיתיות מתקבלות מ-geocodeQueryAction (Nominatim) בזמן שמירת תחנה/
 * פעילות, עם איתור-רקע אוטומטי חד-פעמי לתחנות ישנות שנוצרו לפני התכונה.
 */

const MapLibreMap = dynamic(() => import("./maplibre-map-inner").then((m) => m.DesignPreviewMapLibre), {
  ssr: false,
  loading: () => (
    <div style={{ height: "100%", display: "flex", alignItems: "center", justifyContent: "center", color: COLOR.textSecondary, fontSize: "13px" }}>טוען מפה...</div>
  ),
});

const STOP_COLORS = ["#8a5adf", "#4f8fe0", "#43d6aa", "#f5a544", "#ef6f61", "#e0699a"];
const ACTIVITY_COLOR = "#43d6aa";

// בנוי כולו על UTC (לא זמן-מקומי) בכוונה: `new Date(iso + "T00:00:00")`
// מתפרש כזמן-מקומי, ואז המרה חזרה ל-toISOString (שתמיד UTC) יכולה
// "לתקוע" את התאריך על אותו יום שוב ושוב באזורי-זמן עם היסט חיובי מ-UTC
// (כמו ישראל) — נמצא ונתפס בפועל: לולאת ה-for למטה נכנסה ללולאה אינסופית
// ותקעה את כל הדף, כי addDaysStr(d, 1) החזיר בכל פעם בדיוק את אותו d.
function addDaysStr(dateISO: string, n: number): string {
  const [y, m, d] = dateISO.split("-").map(Number);
  const date = new Date(Date.UTC(y!, m! - 1, d!));
  date.setUTCDate(date.getUTCDate() + n);
  return date.toISOString().slice(0, 10);
}
function fmtRange(a: string, b: string): string {
  const fmt = (d: string) => new Date(d).toLocaleDateString("he-IL", { day: "numeric", month: "short" });
  return a === b ? fmt(a) : `${fmt(a)} – ${fmt(b)}`;
}

export default function MapPreviewScreen() {
  const router = useRouter();
  const [checked, setChecked] = useState(false);
  const [tripId, setTripId] = useState<string | null>(null);
  const [stops, setStops] = useState<TripStop[]>([]);
  const [activities, setActivities] = useState<Record<string, TripActivity[]>>({});
  const [mode, setMode] = useState<"trip" | string>("trip");
  const [pitch, setPitch] = useState(55);
  const [fitSignal, setFitSignal] = useState(0);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [editingStop, setEditingStop] = useState<{ mode: "add" | "edit"; stop: TripStop | null } | null>(null);
  const [backfilling, setBackfilling] = useState(false);

  function reload() {
    setStops(loadStops());
    setActivities(loadActivities());
  }

  useEffect(() => {
    setTripId(activeTrip()?.id ?? null);
    reload();
    setChecked(true);
  }, []);

  // איתור-רקע חד-פעמי לתחנות בלי קואורדינטות (נוצרו לפני שהתכונה קיימה,
  // או שהאיתור נכשל בשמירה) — אחת בכל פעם עם השהיה קלה, בהתאם למדיניות-
  // השימוש של Nominatim (עד בקשה אחת בשנייה).
  useEffect(() => {
    let cancelled = false;
    async function backfill() {
      const missing = loadStops().filter((s) => s.lat == null || s.lon == null);
      if (missing.length === 0) return;
      setBackfilling(true);
      for (const s of missing) {
        if (cancelled) return;
        const geo = await geocodeQueryAction(s.city, s.countryCode);
        if (geo && !cancelled) updateStop(s.id, { lat: geo.lat, lon: geo.lon });
        await new Promise((r) => setTimeout(r, 1100));
      }
      if (!cancelled) {
        reload();
        setBackfilling(false);
      }
    }
    backfill();
    return () => {
      cancelled = true;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [stops.length]);

  useEffect(() => {
    setFitSignal((v) => v + 1);
    setSelectedId(null);
  }, [mode]);

  const sortedStops = useMemo(() => [...stops].sort((a, b) => (a.startDate < b.startDate ? -1 : 1)), [stops]);
  const stopsWithCoords = sortedStops.filter((s) => s.lat != null && s.lon != null);

  const tripStart = sortedStops[0]?.startDate ?? null;
  const tripEnd = sortedStops.reduce<string | null>((max, s) => (max == null || s.endDate > max ? s.endDate : max), null);
  const allDays = useMemo(() => {
    if (!tripStart || !tripEnd) return [];
    const days: string[] = [];
    for (let d = tripStart; d <= tripEnd; d = addDaysStr(d, 1)) days.push(d);
    return days;
  }, [tripStart, tripEnd]);

  const stopColorForDate = (date: string) => {
    const idx = sortedStops.findIndex((s) => date >= s.startDate && date <= s.endDate);
    return idx === -1 ? COLOR.cardBorder : STOP_COLORS[idx % STOP_COLORS.length]!;
  };

  const tripPoints: MapPoint3D[] = stopsWithCoords.map((s, i) => ({
    id: s.id,
    lat: s.lat!,
    lon: s.lon!,
    label: s.city,
    sublabel: fmtRange(s.startDate, s.endDate),
    color: STOP_COLORS[i % STOP_COLORS.length]!,
    isSelected: selectedId === s.id,
    order: i + 1,
  }));

  const dayStop = mode !== "trip" ? sortedStops.find((s) => mode >= s.startDate && mode <= s.endDate) ?? null : null;
  const dayActivities = mode !== "trip" ? (activities[mode] ?? []).filter((a) => a.lat != null && a.lon != null).sort((a, b) => a.time.localeCompare(b.time)) : [];
  const dayPoints: MapPoint3D[] = [
    ...(dayStop && dayStop.lat != null && dayStop.lon != null
      ? [{ id: `stop-${dayStop.id}`, lat: dayStop.lat, lon: dayStop.lon, label: dayStop.city, sublabel: "בסיס", color: STOP_COLORS[sortedStops.indexOf(dayStop) % STOP_COLORS.length]!, isSelected: selectedId === `stop-${dayStop.id}`, order: 1 }]
      : []),
    ...dayActivities.map((a, i) => ({ id: a.id, lat: a.lat!, lon: a.lon!, label: a.title, sublabel: a.time, color: ACTIVITY_COLOR, isSelected: selectedId === a.id, order: (dayStop ? 2 : 1) + i })),
  ];

  const points = mode === "trip" ? tripPoints : dayPoints;
  const routeColor = mode === "trip" ? STOP_COLORS[0]! : ACTIVITY_COLOR;

  function handleSaveStop(patch: Omit<TripStop, "id">) {
    if (editingStop?.mode === "edit" && editingStop.stop) updateStop(editingStop.stop.id, patch);
    else addStop(patch);
    reload();
    setEditingStop(null);
  }
  function handleDeleteStop() {
    if (editingStop?.mode !== "edit" || !editingStop.stop) return;
    if (!confirm(`למחוק את התחנה "${editingStop.stop.city}"?`)) return;
    deleteStop(editingStop.stop.id);
    reload();
    setEditingStop(null);
  }

  if (!checked) return null;

  if (!tripId) {
    return (
      <EmptyShell title="אין טיול פעיל" subtitle="בחרו או צרו טיול כדי לראות את המסלול שלו על המפה" ctaLabel="מעבר לטיולים שלי" onCta={() => router.push("/trips")} />
    );
  }

  if (stops.length === 0) {
    return (
      <EmptyShell title="אין עדיין מסלול" subtitle="הוסיפו יעדים למסלול הטיול כדי לראות אותם כאן על המפה" ctaLabel="+ הוספת יעד ראשון" onCta={() => setEditingStop({ mode: "add", stop: null })}>
        {editingStop ? <StopEditSheet initial={editingStop.stop} onClose={() => setEditingStop(null)} onSave={handleSaveStop} onDelete={editingStop.mode === "edit" ? handleDeleteStop : undefined} /> : null}
      </EmptyShell>
    );
  }

  return (
    <div style={{ width: "100%", height: "100dvh", maxHeight: "100dvh", background: COLOR.pageBg, color: COLOR.textPrimary, fontFamily: "var(--font-assistant), sans-serif", direction: "rtl", display: "flex", flexDirection: "column", overflow: "hidden", paddingBottom: `${NAV_HEIGHT}px` }}>
      <div style={{ display: "flex", alignItems: "center", gap: "8px", padding: "8px 16px 4px", flexShrink: 0 }}>
        <h1 style={{ margin: 0, fontSize: "16px", fontWeight: 800, color: "#fff", flex: 1, minWidth: 0, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>המסלול על המפה</h1>
        <button
          type="button"
          onClick={() => setPitch((p) => (p > 20 ? 0 : 55))}
          aria-label={pitch > 20 ? "מעבר לתצוגה דו-ממדית" : "מעבר לתצוגה תלת-ממדית"}
          style={{ padding: "7px 12px", borderRadius: "999px", background: pitch > 20 ? COLOR.purple : COLOR.cardBg, border: `1px solid ${pitch > 20 ? COLOR.purple : COLOR.cardBorder}`, color: "#fff", fontSize: "11px", fontWeight: 800, cursor: "pointer", flexShrink: 0 }}
        >
          {pitch > 20 ? "תלת-ממד" : "דו-ממד"}
        </button>
        <button
          type="button"
          onClick={() => setEditingStop({ mode: "add", stop: null })}
          aria-label="הוספת יעד"
          style={{ width: "34px", height: "34px", borderRadius: "50%", background: COLOR.cardBg, border: `1px solid ${COLOR.cardBorder}`, color: "#fff", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0, cursor: "pointer", fontSize: "18px" }}
        >
          +
        </button>
      </div>

      {/* ציר-הטיול: "כל הטיול" + כל יום בטווח התאריכים של המסלול — לחיצה
          על יום מסננת את המפה לתחנה+פעילויות אותו יום בלבד. */}
      <div style={{ display: "flex", gap: "6px", overflowX: "auto", padding: "4px 16px 8px", flexShrink: 0 }}>
        <button
          type="button"
          onClick={() => setMode("trip")}
          style={{ flexShrink: 0, padding: "8px 14px", borderRadius: "999px", fontSize: "12px", fontWeight: 800, whiteSpace: "nowrap", cursor: "pointer", background: mode === "trip" ? COLOR.purple : "#12213f", border: `1px solid ${mode === "trip" ? COLOR.purple : COLOR.cardBorder}`, color: "#fff" }}
        >
          כל הטיול
        </button>
        {allDays.map((d) => {
          const active = mode === d;
          const dd = new Date(d);
          const dotColor = stopColorForDate(d);
          return (
            <button
              key={d}
              type="button"
              onClick={() => setMode(d)}
              style={{ flexShrink: 0, display: "flex", flexDirection: "column", alignItems: "center", gap: "2px", padding: "6px 10px", borderRadius: "12px", background: active ? COLOR.purple : "#12213f", border: `1px solid ${active ? COLOR.purple : COLOR.cardBorder}`, cursor: "pointer" }}
            >
              <span style={{ width: "5px", height: "5px", borderRadius: "50%", background: dotColor }} />
              <span style={{ fontSize: "9.5px", color: active ? "#fff" : COLOR.textSecondary }}>{dd.toLocaleDateString("he-IL", { weekday: "short" })}</span>
              <span style={{ fontSize: "12.5px", fontWeight: 700, color: "#fff" }}>{dd.getDate()}</span>
            </button>
          );
        })}
      </div>

      <div style={{ flex: 1, minHeight: 0, padding: "0 16px", position: "relative" }}>
        <div style={{ position: "relative", height: "100%", borderRadius: "18px", overflow: "hidden", border: `1px solid ${COLOR.cardBorder}` }}>
          {points.length > 0 ? (
            <MapLibreMap points={points} routeColor={routeColor} pitch={pitch} onSelect={setSelectedId} fitSignal={fitSignal} />
          ) : (
            <div style={{ height: "100%", display: "flex", alignItems: "center", justifyContent: "center", flexDirection: "column", gap: "8px", padding: "20px", textAlign: "center" }}>
              <div style={{ fontSize: "13px", color: COLOR.textSecondary }}>
                {backfilling ? "מאתר מיקומים אמיתיים לתחנות..." : mode === "trip" ? "לא נמצאו עדיין קואורדינטות לאף תחנה" : "אין ליום הזה תחנה או פעילויות עם מיקום ידוע"}
              </div>
            </div>
          )}
        </div>
      </div>

      <div style={{ padding: "10px 16px", flexShrink: 0, maxHeight: "34%", overflowY: "auto" }}>
        {mode === "trip" ? (
          <div style={{ display: "flex", flexDirection: "column", gap: "6px" }}>
            {sortedStops.map((s, i) => (
              <div
                key={s.id}
                onClick={() => setEditingStop({ mode: "edit", stop: s })}
                style={{ display: "flex", alignItems: "center", gap: "10px", padding: "10px 12px", borderRadius: "12px", background: "#12213f", border: `1px solid ${selectedId === s.id ? COLOR.purple : COLOR.cardBorder}`, cursor: "pointer" }}
                onMouseDown={() => setSelectedId(s.id)}
              >
                <span style={{ width: "22px", height: "22px", borderRadius: "50%", background: `${STOP_COLORS[i % STOP_COLORS.length]}33`, border: `1px solid ${STOP_COLORS[i % STOP_COLORS.length]}`, display: "flex", alignItems: "center", justifyContent: "center", fontSize: "10.5px", fontWeight: 800, color: STOP_COLORS[i % STOP_COLORS.length], flexShrink: 0 }}>{i + 1}</span>
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ fontSize: "13px", fontWeight: 700, color: "#fff" }}>{s.city}</div>
                  <div style={{ fontSize: "10.5px", color: COLOR.textSecondary }}>
                    {fmtRange(s.startDate, s.endDate)}
                    {s.hotel ? ` · 🏨 ${s.hotel}` : ""}
                    {s.lat == null ? " · מאתר מיקום..." : ""}
                  </div>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div style={{ display: "flex", flexDirection: "column", gap: "6px" }}>
            {dayStop ? (
              <div style={{ fontSize: "12px", color: COLOR.textSecondary }}>
                {dayStop.city}
                {dayStop.hotel ? ` · 🏨 ${dayStop.hotel}` : ""}
              </div>
            ) : (
              <div style={{ fontSize: "12px", color: COLOR.textSecondary }}>אין תחנה מוגדרת ליום הזה</div>
            )}
            {(activities[mode] ?? []).length === 0 ? (
              <div style={{ fontSize: "12px", color: COLOR.textMuted, padding: "6px 2px" }}>אין עדיין פעילויות ליום הזה</div>
            ) : (
              [...(activities[mode] ?? [])]
                .sort((a, b) => a.time.localeCompare(b.time))
                .map((a) => (
                  <div
                    key={a.id}
                    onClick={() => setSelectedId(a.id)}
                    style={{ display: "flex", alignItems: "center", gap: "10px", padding: "9px 12px", borderRadius: "12px", background: "#12213f", border: `1px solid ${selectedId === a.id ? COLOR.purple : COLOR.cardBorder}`, cursor: a.lat != null ? "pointer" : "default" }}
                  >
                    <span style={{ fontSize: "11px", fontWeight: 700, color: COLOR.purple, minWidth: "34px" }}>{a.time}</span>
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <div style={{ fontSize: "12.5px", fontWeight: 700, color: "#fff" }}>{a.title}</div>
                      {a.location ? <div style={{ fontSize: "10.5px", color: COLOR.textSecondary }}>{a.location}{a.lat == null ? " · אין מיקום ידוע" : ""}</div> : null}
                    </div>
                  </div>
                ))
            )}
            <button
              type="button"
              onClick={() => router.push(`/trips/${tripId}/plan?day=${mode}`)}
              style={{ marginTop: "4px", padding: "10px", borderRadius: "12px", background: "rgba(138,90,223,0.14)", border: `1px solid ${COLOR.purple}40`, color: COLOR.purple, fontSize: "12px", fontWeight: 700, cursor: "pointer" }}
            >
              פתיחת התוכנית המלאה ליום זה ←
            </button>
          </div>
        )}
      </div>

      <BottomNav active="map" />

      {editingStop ? <StopEditSheet initial={editingStop.stop} onClose={() => setEditingStop(null)} onSave={handleSaveStop} onDelete={editingStop.mode === "edit" ? handleDeleteStop : undefined} /> : null}
    </div>
  );
}

function EmptyShell({
  title,
  subtitle,
  ctaLabel,
  onCta,
  children,
}: {
  title: string;
  subtitle: string;
  ctaLabel: string;
  onCta: () => void;
  children?: React.ReactNode;
}) {
  return (
    <div style={{ width: "100%", height: "100dvh", maxHeight: "100dvh", background: COLOR.pageBg, color: COLOR.textPrimary, fontFamily: "var(--font-assistant), sans-serif", direction: "rtl", display: "flex", flexDirection: "column", overflow: "hidden", paddingBottom: `${NAV_HEIGHT}px` }}>
      <div style={{ display: "flex", alignItems: "center", gap: "8px", padding: "8px 16px 4px", flexShrink: 0 }}>
        <h1 style={{ margin: 0, fontSize: "16px", fontWeight: 800, color: "#fff" }}>המסלול על המפה</h1>
      </div>
      <div style={{ flex: 1, display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", gap: "12px", padding: "24px", textAlign: "center" }}>
        <div style={{ fontSize: "15px", fontWeight: 800, color: "#fff" }}>{title}</div>
        <div style={{ fontSize: "13px", color: COLOR.textSecondary, maxWidth: "280px" }}>{subtitle}</div>
        <button type="button" onClick={onCta} style={{ padding: "10px 20px", borderRadius: "999px", background: COLOR.purple, border: "none", color: "#fff", fontWeight: 700, fontSize: "13px", cursor: "pointer" }}>
          {ctaLabel}
        </button>
      </div>
      <BottomNav active="map" />
      {children}
    </div>
  );
}
