"use client";

import { useEffect, useLayoutEffect, useMemo, useRef, useState } from "react";
import Link from "next/link";
import dynamic from "next/dynamic";
import { COLOR, BottomNav, NAV_HEIGHT } from "../shared";
import type { MapPoint, MapRouteSegment, TransportMarker } from "./leaflet-map-inner";

/**
 * מסך מפה (design-preview בלבד) — גרסה שנייה: מפה אמיתית ואינטראקטיבית
 * (Leaflet + אריחי OpenStreetMap, שתיהן כבר מותקנות בפרויקט ו/או חינמיות
 * לגמרי — ר' הערה בראש leaflet-map-inner.tsx), במקום התרשים המצויר בגרסה
 * הקודמת. נוספה גם מערכת-טיימרים חכמה לאירוע הקרוב, פעילויות לכל יעד עם
 * תפריט שלוש-נקודות (כמו ביומן), וכרטיס-מידע הניתן לגרירה. הכל נתוני-דוגמה
 * מקומיים בלבד — לא מחובר ל-DB ולא נוגע במערכת המקורית.
 */

const LeafletMap = dynamic(() => import("./leaflet-map-inner").then((m) => m.DesignPreviewLeafletMap), {
  ssr: false,
  loading: () => (
    <div style={{ height: "100%", display: "flex", alignItems: "center", justifyContent: "center", color: COLOR.textSecondary, fontSize: "13px" }}>
      טוען מפה...
    </div>
  ),
});

type StopStatus = "בוצע" | "מאושר" | "ממתין לאישור";
type TransportMode = "flight" | "car" | "ferry";
type ActivityStatus = "מתוכנן" | "בוצע" | "בוטל" | "נדחה";

interface Stop {
  id: string;
  city: string;
  country: string;
  lat: number;
  lon: number;
  dateStart: string;
  days: number;
  datesLabel: string;
  status: StopStatus;
  hotel: string | null;
  weather: string;
  notes: string;
}
interface Activity {
  id: string;
  stopId: string;
  time: string;
  endTime?: string;
  title: string;
  location: string;
  status: ActivityStatus;
}
interface Segment {
  mode: TransportMode;
  label: string;
}
type TimerKind = "pickup" | "hotel_leave" | "checkin" | "checkout" | "flight_open" | "flight_close" | "boarding" | "takeoff" | "landing" | "train" | "ferry" | "restaurant" | "activity_start" | "car_return";
type DriverStatus = "בדרך" | "הגיע" | "מתעכב";
interface TimerEvent {
  id: string;
  kind: TimerKind;
  label: string;
  offsetMinutes: number;
  travelMinutes: number;
  leadMinutes: number;
  status: "upcoming" | "done";
  driverName?: string;
  vehicleType?: string;
  plate?: string;
  driverStatus?: DriverStatus;
  bookingRef?: string;
}

const STATUS_TONE: Record<StopStatus, "success" | "purple" | "warning"> = { בוצע: "success", מאושר: "purple", "ממתין לאישור": "warning" };
const STATUS_COLOR: Record<"success" | "purple" | "warning", string> = { success: COLOR.success, purple: COLOR.purple, warning: COLOR.warning };
const CURRENT_INDEX = 1;

const INITIAL_STOPS: Stop[] = [
  { id: "tlv", city: "תל אביב", country: "ישראל", lat: 32.0853, lon: 34.7818, dateStart: "2026-04-30", days: 5, datesLabel: "30 באפריל – 4 במאי", status: "בוצע", hotel: null, weather: "28° בהיר", notes: "" },
  { id: "bkk-1", city: "בנגקוק", country: "תאילנד", lat: 13.7563, lon: 100.5018, dateStart: "2026-05-04", days: 7, datesLabel: "4 – 10 במאי", status: "מאושר", hotel: "[דמו] מלון סנטרל בבנגקוק", weather: "33° מעונן חלקית", notes: "" },
  { id: "pat", city: "פטאיה", country: "תאילנד", lat: 12.9236, lon: 100.8825, dateStart: "2026-05-10", days: 6, datesLabel: "10 – 15 במאי", status: "ממתין לאישור", hotel: "Pattaya Beach Resort", weather: "31° שמשי", notes: "" },
  { id: "koh", city: "קוה צ'אנג", country: "תאילנד", lat: 12.045, lon: 102.322, dateStart: "2026-05-15", days: 6, datesLabel: "15 – 20 במאי", status: "מאושר", hotel: "Koh Chang Paradise Resort", weather: "30° בהיר", notes: "" },
  { id: "bkk-2", city: "בנגקוק", country: "תאילנד", lat: 13.7563, lon: 100.5018, dateStart: "2026-06-20", days: 3, datesLabel: "20 – 22 ביוני", status: "מאושר", hotel: "[דמו] מלון סנטרל בבנגקוק", weather: "29° בהיר", notes: "" },
];

const SEGMENTS: Segment[] = [
  { mode: "flight", label: "טיסה · כ-6 שעות" },
  { mode: "car", label: "הסעה פרטית · כשעתיים" },
  { mode: "ferry", label: "מעבורת · כשעה" },
  { mode: "ferry", label: "מעבורת + הסעה · כ-4 שעות" },
];

let idCounter = 1000;
function nextId(prefix: string) {
  idCounter += 1;
  return `${prefix}-${idCounter}`;
}

function makeDemoActivities(stop: Stop): Activity[] {
  const seed: Record<string, { time: string; endTime?: string; title: string; location: string; status: ActivityStatus }[]> = {
    tlv: [
      { time: "10:00", endTime: "12:00", title: "ארוחת פרידה", location: "נמל תל אביב", status: "מתוכנן" },
      { time: "16:00", title: "טיסה לבנגקוק", location: "נתב״ג", status: "מתוכנן" },
    ],
    "bkk-1": [
      { time: "08:30", endTime: "09:15", title: "ארוחת בוקר במלון", location: "[דמו] מלון סנטרל בבנגקוק", status: "בוצע" },
      { time: "10:00", endTime: "11:30", title: "Wat Arun – מקדש השחר", location: "מקדש השחר", status: "בוצע" },
      { time: "13:00", endTime: "15:00", title: "שוק ג'אטוצ'אק", location: "Chatuchak Market", status: "מתוכנן" },
      { time: "20:00", endTime: "22:00", title: "ארוחת ערב", location: "Sirocco Sky Bar", status: "מתוכנן" },
    ],
    pat: [
      { time: "09:00", title: "חוף פטאיה", location: "חוף פטאיה", status: "מתוכנן" },
      { time: "12:00", title: "שוק צף פֿ-פת", location: "שוק צף", status: "מתוכנן" },
      { time: "19:00", title: "ארוחת דגים על החוף", location: "מסעדת דגים", status: "מתוכנן" },
    ],
    koh: [
      { time: "10:00", title: "מפל קלונג פלו", location: "קלונג פלו", status: "מתוכנן" },
      { time: "14:00", title: "צלילה באי", location: "חוף מזרחי", status: "מתוכנן" },
    ],
    "bkk-2": [
      { time: "10:00", title: "קניות אחרונות", location: "MBK Center", status: "מתוכנן" },
      { time: "18:00", title: "טיסה חזרה", location: "נמל תעופה סוברנבהום", status: "מתוכנן" },
    ],
  };
  return (seed[stop.id] ?? []).map((a) => ({ id: nextId("act"), stopId: stop.id, ...a }));
}

const INITIAL_TIMER_EVENTS: TimerEvent[] = [
  {
    id: "t1",
    kind: "pickup",
    label: "הסעה למלון",
    offsetMinutes: 6,
    travelMinutes: 22,
    leadMinutes: 0,
    status: "upcoming",
    driverName: "אבי כהן",
    vehicleType: "טויוטה קאמרי לבנה",
    plate: "12-345-67",
    driverStatus: "בדרך",
    bookingRef: "TM-88213",
  },
  { id: "t2", kind: "hotel_leave", label: "יציאה מהמלון", offsetMinutes: 35, travelMinutes: 45, leadMinutes: 5, status: "upcoming" },
  { id: "t3", kind: "restaurant", label: "ההזמנה למסעדה", offsetMinutes: 30, travelMinutes: 15, leadMinutes: 5, status: "upcoming" },
  { id: "t4", kind: "ferry", label: "המעבורת יוצאת", offsetMinutes: 50, travelMinutes: 20, leadMinutes: 15, status: "upcoming" },
  { id: "t5", kind: "boarding", label: "עלייה למטוס", offsetMinutes: 60, travelMinutes: 90, leadMinutes: 30, status: "upcoming" },
  { id: "t6", kind: "checkout", label: "צ׳ק אאוט", offsetMinutes: 135, travelMinutes: 0, leadMinutes: 0, status: "upcoming" },
];

function clamp(v: number, min: number, max: number) {
  return Math.max(min, Math.min(max, v));
}
function addDays(iso: string, n: number) {
  const d = new Date(iso + "T00:00:00");
  d.setDate(d.getDate() + n);
  return d;
}
function stopAtOrAfter(stops: Stop[], index: number) {
  return stops[clamp(index, 0, stops.length - 1)];
}

function PinGlyph({ size = 14, color = "#fff" }: { size?: number; color?: string }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill={color} aria-hidden>
      <path d="M12 2a7 7 0 0 0-7 7c0 5.25 7 13 7 13s7-7.75 7-13a7 7 0 0 0-7-7zm0 9.5A2.5 2.5 0 1 1 12 6.5a2.5 2.5 0 0 1 0 5z" />
    </svg>
  );
}
function PlaneIcon({ size = 16, color = "#fff" }: { size?: number; color?: string }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill={color} aria-hidden>
      <path d="M21 16v-2l-8-5V3.5a1.5 1.5 0 0 0-3 0V9l-8 5v2l8-2.5V19l-2.5 1.8V22l3.5-1 3.5 1v-1.2L13 19v-5.5l8 2.5z" />
    </svg>
  );
}
function CarIcon({ size = 16, color = "#fff" }: { size?: number; color?: string }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill={color} aria-hidden>
      <path d="M5 11l1.5-4.5A2 2 0 0 1 8.4 5h7.2a2 2 0 0 1 1.9 1.5L19 11h1a1 1 0 0 1 1 1v5a1 1 0 0 1-1 1h-1a2 2 0 1 1-4 0H9a2 2 0 1 1-4 0H4a1 1 0 0 1-1-1v-5a1 1 0 0 1 1-1h1zm2.1-4l-1.3 4h12.4l-1.3-4a.5.5 0 0 0-.5-.4H8.6a.5.5 0 0 0-.5.4zM7 15.5a1 1 0 1 0 0 2 1 1 0 0 0 0-2zm10 0a1 1 0 1 0 0 2 1 1 0 0 0 0-2z" />
    </svg>
  );
}
function FerryIcon({ size = 16, color = "#fff" }: { size?: number; color?: string }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill={color} aria-hidden>
      <path d="M4 18l1.6-5.4a2 2 0 0 1 1.9-1.6H9V7a1 1 0 0 1 1-1h1V4h2v2h1a1 1 0 0 1 1 1v4h1.5a2 2 0 0 1 1.9 1.6L20 18a1 1 0 0 1-1 1.3c-1.1 0-1.1-1-2.2-1s-1.1 1-2.3 1-1.1-1-2.3-1-1.1 1-2.3 1-1.1-1-2.2-1S4 19 4 18z" />
    </svg>
  );
}
function ClockIcon({ size = 16, color = "#fff" }: { size?: number; color?: string }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth={2} strokeLinecap="round" aria-hidden>
      <circle cx="12" cy="12" r="9" />
      <path d="M12 7v5l3.5 2" />
    </svg>
  );
}
function TransportIcon({ mode, size, color }: { mode: TransportMode; size?: number; color?: string }) {
  if (mode === "flight") return <PlaneIcon size={size} color={color} />;
  if (mode === "car") return <CarIcon size={size} color={color} />;
  return <FerryIcon size={size} color={color} />;
}
const TIMER_ICON: Record<TimerKind, TransportMode | "clock"> = {
  pickup: "car",
  hotel_leave: "clock",
  checkin: "clock",
  checkout: "clock",
  flight_open: "flight",
  flight_close: "flight",
  boarding: "flight",
  takeoff: "flight",
  landing: "flight",
  train: "car",
  ferry: "ferry",
  restaurant: "clock",
  activity_start: "clock",
  car_return: "car",
};
function TimerKindIcon({ kind, size, color }: { kind: TimerKind; size?: number; color?: string }) {
  const t = TIMER_ICON[kind];
  if (t === "clock") return <ClockIcon size={size} color={color} />;
  return <TransportIcon mode={t} size={size} color={color} />;
}
function SearchIcon({ size = 18 }: { size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2.2} strokeLinecap="round" aria-hidden>
      <circle cx="11" cy="11" r="6.5" />
      <path d="M20 20l-4.3-4.3" />
    </svg>
  );
}
function DotsIcon({ size = 18 }: { size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="currentColor" aria-hidden>
      <circle cx="12" cy="5" r="2" />
      <circle cx="12" cy="12" r="2" />
      <circle cx="12" cy="19" r="2" />
    </svg>
  );
}
function CrosshairIcon({ size = 18 }: { size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" aria-hidden>
      <circle cx="12" cy="12" r="3" />
      <path d="M12 2v3M12 19v3M2 12h3M19 12h3" />
    </svg>
  );
}
function FullscreenIcon({ size = 16, active }: { size?: number; active?: boolean }) {
  if (active) {
    return (
      <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" aria-hidden>
        <path d="M9 4H5v4M15 4h4v4M9 20H5v-4M15 20h4v-4" />
      </svg>
    );
  }
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" aria-hidden>
      <path d="M4 9V5h4M20 9V5h-4M4 15v4h4M20 15v4h-4" />
    </svg>
  );
}
function ListIcon({ size = 16 }: { size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" aria-hidden>
      <path d="M8 6h13M8 12h13M8 18h13M3 6h.01M3 12h.01M3 18h.01" />
    </svg>
  );
}
function PlusIcon({ size = 16 }: { size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2.3} strokeLinecap="round" aria-hidden>
      <path d="M12 5v14M5 12h14" />
    </svg>
  );
}

function fieldLabelStyle(): React.CSSProperties {
  return { fontSize: "12px", fontWeight: 700, color: COLOR.textSecondary, marginBottom: "5px", display: "block" };
}
function inputStyle(): React.CSSProperties {
  return { width: "100%", padding: "10px 12px", borderRadius: "10px", background: "#0e1930", border: `1px solid ${COLOR.cardBorder}`, color: "#fff", fontSize: "14px", fontFamily: "inherit" };
}
function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div>
      <span style={fieldLabelStyle()}>{label}</span>
      {children}
    </div>
  );
}
function BottomSheetModal({ children, onClose, title }: { children: React.ReactNode; onClose: () => void; title?: string }) {
  return (
    <div style={{ position: "fixed", inset: 0, zIndex: 1700, display: "flex", alignItems: "flex-end" }}>
      <div onClick={onClose} style={{ position: "absolute", inset: 0, background: "rgba(3,6,16,0.6)" }} />
      <div style={{ position: "relative", width: "100%", maxWidth: "480px", marginInline: "auto", background: "#101d3a", borderTopLeftRadius: "22px", borderTopRightRadius: "22px", border: `1px solid ${COLOR.cardBorder}`, borderBottom: "none", padding: "10px 18px calc(18px + env(safe-area-inset-bottom))", maxHeight: "80vh", overflowY: "auto" }}>
        <div style={{ width: "40px", height: "4px", borderRadius: "999px", background: "rgba(255,255,255,0.25)", margin: "4px auto 12px" }} />
        {title ? <div style={{ fontSize: "16px", fontWeight: 800, color: "#fff", marginBottom: "12px" }}>{title}</div> : null}
        {children}
      </div>
    </div>
  );
}
function ActionRow({ label, onClick, danger, icon }: { label: string; onClick: () => void; danger?: boolean; icon?: React.ReactNode }) {
  return (
    <button
      type="button"
      onClick={onClick}
      style={{ display: "flex", alignItems: "center", gap: "10px", width: "100%", padding: "13px 4px", background: "none", border: "none", borderBottom: `1px solid ${COLOR.cardBorder}`, color: danger ? COLOR.danger : "#fff", fontSize: "14px", fontWeight: 700, cursor: "pointer", textAlign: "right" }}
    >
      {icon}
      {label}
    </button>
  );
}

const PILL_BASE: React.CSSProperties = { display: "flex", alignItems: "center", justifyContent: "center", gap: "5px", height: "36px", padding: "0 12px", borderRadius: "999px", fontSize: "11.5px", fontWeight: 700, cursor: "pointer", whiteSpace: "nowrap", border: `1px solid ${COLOR.cardBorder}`, background: "#12213f", color: "#fff" };

// סף-צבעים לפי בקשה מפורשת: מעל שעה=טורקיז רגוע, מתחת לשעה=סגול, מתחת
// לרבע שעה=כתום, מתחת ל-5 דקות=אדום. תמיד גם טקסט (label) — לא מסתמכים על
// צבע בלבד.
function timerTone(minutesLeft: number, done: boolean): { bg: string; fg: string; label: string } {
  if (done || minutesLeft <= 0) return { bg: "rgba(255,255,255,0.06)", fg: COLOR.textSecondary, label: "הסתיים" };
  if (minutesLeft < 5) return { bg: "rgba(239,111,97,0.18)", fg: COLOR.danger, label: "דחוף מאוד" };
  if (minutesLeft < 15) return { bg: "rgba(245,165,68,0.18)", fg: COLOR.warning, label: "בקרוב מאוד" };
  if (minutesLeft < 60) return { bg: "rgba(138,90,223,0.18)", fg: COLOR.purple, label: "בקרוב" };
  return { bg: "rgba(67,214,170,0.14)", fg: COLOR.success, label: "רגוע" };
}
function formatMinutes(m: number) {
  const v = Math.max(0, Math.round(m));
  if (v < 60) return `${v} דקות`;
  const h = Math.floor(v / 60);
  const mm = v % 60;
  return mm > 0 ? `שעה${h > 1 ? `ות ${h}` : ""} ו-${mm} דקות` : `${h} שעות`;
}

function DriverStatusDot({ status }: { status: DriverStatus }) {
  const color = status === "הגיע" ? COLOR.success : status === "מתעכב" ? COLOR.danger : COLOR.warning;
  return (
    <span style={{ display: "inline-flex", alignItems: "center", gap: "4px", fontSize: "11px", fontWeight: 700, color }}>
      <span style={{ width: "7px", height: "7px", borderRadius: "50%", background: color }} />
      {status}
    </span>
  );
}

function SmartTimerCard({
  event,
  demoClock,
  expanded,
  onToggleExpand,
  onAction,
}: {
  event: TimerEvent | null;
  demoClock: number;
  expanded: boolean;
  onToggleExpand: () => void;
  onAction: (action: "nav" | "call" | "remind" | "done" | "postpone" | "edit" | "booking") => void;
}) {
  if (!event) {
    return (
      <div style={{ margin: "0 16px 8px", padding: "10px 14px", borderRadius: "14px", background: "#12213f", border: `1px solid ${COLOR.cardBorder}`, fontSize: "12.5px", color: COLOR.textSecondary, textAlign: "center", flexShrink: 0 }}>
        אין אירועים קרובים כרגע
      </div>
    );
  }
  const minutesLeft = event.offsetMinutes - demoClock;
  const done = minutesLeft <= 0;
  const tone = timerTone(minutesLeft, done);
  const leaveIn = minutesLeft - event.travelMinutes - event.leadMinutes;

  return (
    <div style={{ margin: "0 16px 8px", borderRadius: "16px", background: tone.bg, border: `1px solid ${tone.fg}55`, flexShrink: 0, overflow: "hidden" }}>
      <button
        type="button"
        onClick={onToggleExpand}
        aria-expanded={expanded}
        style={{ width: "100%", display: "flex", alignItems: "center", gap: "10px", padding: "7px 12px", background: "none", border: "none", cursor: "pointer", textAlign: "right" }}
      >
        <span style={{ width: "30px", height: "30px", borderRadius: "50%", background: tone.fg, display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
          <TimerKindIcon kind={event.kind} size={15} color="#0b1220" />
        </span>
        <div style={{ flex: 1, minWidth: 0, textAlign: "right" }}>
          <div style={{ fontSize: "13px", fontWeight: 700, color: "#fff" }}>{event.label}</div>
          <div style={{ fontSize: "11.5px", color: tone.fg, fontWeight: 700 }}>{tone.label} · {done ? "החל" : `בעוד ${formatMinutes(minutesLeft)}`}</div>
        </div>
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#fff" strokeWidth={2.2} strokeLinecap="round" style={{ transform: expanded ? "rotate(180deg)" : "none", transition: "transform 0.2s", flexShrink: 0 }}>
          <path d="M6 9l6 6 6-6" />
        </svg>
      </button>

      {expanded ? (
        <div style={{ padding: "0 14px 14px" }}>
          <div style={{ display: "flex", flexDirection: "column", gap: "4px", fontSize: "12.5px", color: "#e4e8f2", marginBottom: "10px" }}>
            {!done && leaveIn > 0 ? <div>כדאי לצאת בעוד {formatMinutes(leaveIn)}</div> : null}
            {event.travelMinutes > 0 ? <div>משך הנסיעה המשוער: כ-{event.travelMinutes} דקות</div> : null}
            {(event.driverName || event.vehicleType || event.plate) ? (
              <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginTop: "4px" }}>
                <span>
                  {event.driverName ? `${event.driverName}` : ""}
                  {event.vehicleType ? ` · ${event.vehicleType}` : ""}
                  {event.plate ? ` · ${event.plate}` : ""}
                </span>
                {event.driverStatus ? <DriverStatusDot status={event.driverStatus} /> : null}
              </div>
            ) : null}
          </div>

          <div style={{ display: "flex", gap: "6px", flexWrap: "wrap" }}>
            <button type="button" onClick={() => onAction("nav")} style={{ ...PILL_BASE, height: "32px", fontSize: "11px", background: "rgba(255,255,255,0.1)" }}>
              פתח ניווט
            </button>
            {event.driverName ? (
              <button type="button" onClick={() => onAction("call")} style={{ ...PILL_BASE, height: "32px", fontSize: "11px", background: "rgba(255,255,255,0.1)" }}>
                התקשר לנהג
              </button>
            ) : null}
            <button type="button" onClick={() => onAction("remind")} style={{ ...PILL_BASE, height: "32px", fontSize: "11px", background: "rgba(255,255,255,0.1)" }}>
              הזכר לי
            </button>
            {event.bookingRef ? (
              <button type="button" onClick={() => onAction("booking")} style={{ ...PILL_BASE, height: "32px", fontSize: "11px", background: "rgba(255,255,255,0.1)" }}>
                פרטי ההזמנה
              </button>
            ) : null}
            <button type="button" onClick={() => onAction("edit")} style={{ ...PILL_BASE, height: "32px", fontSize: "11px", background: "rgba(255,255,255,0.1)" }}>
              ערוך שעה
            </button>
            <button type="button" onClick={() => onAction("postpone")} style={{ ...PILL_BASE, height: "32px", fontSize: "11px", background: "rgba(255,255,255,0.1)" }}>
              דחה
            </button>
            <button type="button" onClick={() => onAction("done")} style={{ ...PILL_BASE, height: "32px", fontSize: "11px", background: "rgba(67,214,170,0.2)", border: `1px solid ${COLOR.success}55`, color: COLOR.success }}>
              סמן שבוצע
            </button>
          </div>
        </div>
      ) : null}
    </div>
  );
}

type Dialog =
  | { kind: "stop"; type: "edit" | "delete"; id: string }
  | { kind: "stop"; type: "add" }
  | { kind: "activity"; type: "edit" | "time" | "move" | "delete"; stopId: string; activityId: string }
  | null;

export default function MapPreviewScreen() {
  const [stops, setStops] = useState<Stop[]>(INITIAL_STOPS);
  const [activitiesByStop, setActivitiesByStop] = useState<Record<string, Activity[]>>(() => Object.fromEntries(INITIAL_STOPS.map((s) => [s.id, makeDemoActivities(s)])));
  const [timerEvents, setTimerEvents] = useState<TimerEvent[]>(INITIAL_TIMER_EVENTS);
  const [timerExpanded, setTimerExpanded] = useState(false);
  const [demoClock, setDemoClock] = useState(0);

  const [selectedId, setSelectedId] = useState(INITIAL_STOPS[CURRENT_INDEX].id);
  const [selectedDate, setSelectedDate] = useState(INITIAL_STOPS[CURRENT_INDEX].dateStart);
  const [viewMode, setViewMode] = useState<"map" | "list">("map");
  const [sheetTranslate, setSheetTranslate] = useState(1); // 0 = open, 1 = peek (normalized)
  const [sheetDragging, setSheetDragging] = useState(false);
  const sheetDragRef = useRef<{ startY: number; startT: number } | null>(null);
  const sheetDragMovedRef = useRef(false);

  const [searchOpen, setSearchOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [optionsOpen, setOptionsOpen] = useState(false);
  const [menuFor, setMenuFor] = useState<{ kind: "stop"; id: string } | { kind: "activity"; stopId: string; activityId: string } | null>(null);
  const [dialog, setDialog] = useState<Dialog>(null);
  const [flyTarget, setFlyTarget] = useState<{ lat: number; lon: number; zoom?: number } | null>(null);

  const [toast, setToast] = useState<{ message: string; actionLabel?: string; onAction?: () => void } | null>(null);
  const toastTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const pendingDeleteStop = useRef<{ stop: Stop; index: number } | null>(null);
  const pendingDeleteActivity = useRef<{ activity: Activity; index: number } | null>(null);

  useEffect(() => {
    const id = setInterval(() => setDemoClock((m) => m + 1), 1000);
    return () => clearInterval(id);
  }, []);

  const selectedIndex = Math.max(0, stops.findIndex((s) => s.id === selectedId));
  const stop = stops[selectedIndex] ?? stops[0];
  const activities = activitiesByStop[stop?.id ?? ""] ?? [];

  function showToast(message: string, actionLabel?: string, onAction?: () => void) {
    if (toastTimer.current) clearTimeout(toastTimer.current);
    setToast({ message, actionLabel, onAction });
    toastTimer.current = setTimeout(() => setToast(null), 4500);
  }
  function openMenu(m: NonNullable<typeof menuFor>) {
    if (toastTimer.current) clearTimeout(toastTimer.current);
    setToast(null);
    setMenuFor(m);
  }
  function openDialog(d: NonNullable<Dialog>) {
    if (toastTimer.current) clearTimeout(toastTimer.current);
    setToast(null);
    setMenuFor(null);
    setDialog(d);
  }

  // useCallback (תלוי רק ב-stops, לא ב-demoClock) כדי שה-prop שמועבר ל-
  // LeafletMap (הממוזג ב-React.memo) יישאר יציב בין טיקים של הטיימר.
  const selectStop = useMemo(
    () =>
      (id: string, opts?: { open?: boolean; date?: string }) => {
        setSelectedId(id);
        const s = stops.find((x) => x.id === id);
        if (s) {
          setFlyTarget({ lat: s.lat, lon: s.lon, zoom: 10 });
          setSelectedDate(opts?.date ?? s.dateStart);
        }
        if (opts?.open !== false) setSheetTranslate(0);
      },
    [stops],
  );
  // בחירת יום ספציפי משורת-הימים — מרכזת רק את אותו היום (לא כל הימים של
  // אותה תחנה), כדי שרק צ'יפ אחד יידלק בכל רגע נתון.
  function selectDay(stopId: string, date: string) {
    selectStop(stopId, { open: false, date });
  }
  function recenter() {
    const cur = stops[CURRENT_INDEX] ?? stops[0];
    setSelectedId(cur.id);
    setSelectedDate(cur.dateStart);
    setFlyTarget({ lat: cur.lat, lon: cur.lon, zoom: 9 });
  }

  // מסך-מלא אמיתי (Fullscreen API של הדפדפן) — לא הדמיה גרפית.
  const mapWrapRef = useRef<HTMLDivElement>(null);
  const [isFullscreen, setIsFullscreen] = useState(false);
  useEffect(() => {
    function onChange() {
      setIsFullscreen(Boolean(document.fullscreenElement));
    }
    document.addEventListener("fullscreenchange", onChange);
    return () => document.removeEventListener("fullscreenchange", onChange);
  }, []);
  function toggleFullscreen() {
    if (document.fullscreenElement) {
      document.exitFullscreen();
    } else {
      mapWrapRef.current?.requestFullscreen().catch(() => showToast("מסך מלא אינו נתמך בדפדפן זה"));
    }
  }

  // --- גרירת כרטיס-המידע (פתיחה/סגירה) ---
  function onSheetPointerDown(e: React.PointerEvent) {
    (e.currentTarget as HTMLElement).setPointerCapture(e.pointerId);
    sheetDragRef.current = { startY: e.clientY, startT: sheetTranslate };
    sheetDragMovedRef.current = false;
    setSheetDragging(true);
  }
  function onSheetPointerMove(e: React.PointerEvent) {
    if (!sheetDragRef.current) return;
    const RANGE = 420;
    const rawDelta = e.clientY - sheetDragRef.current.startY;
    if (Math.abs(rawDelta) > 6) sheetDragMovedRef.current = true;
    const delta = rawDelta / RANGE;
    setSheetTranslate(clamp(sheetDragRef.current.startT + delta, 0, 1));
  }
  function onSheetPointerUp() {
    if (!sheetDragRef.current) return;
    sheetDragRef.current = null;
    setSheetDragging(false);
    if (sheetDragMovedRef.current) setSheetTranslate((t) => (t < 0.5 ? 0 : 1));
  }
  function toggleSheet() {
    setSheetTranslate((t) => (t < 0.5 ? 1 : 0));
  }

  function handleDeleteStopConfirm(id: string) {
    const idx = stops.findIndex((s) => s.id === id);
    const s = stops[idx];
    pendingDeleteStop.current = { stop: s, index: idx };
    setStops((prev) => prev.filter((x) => x.id !== id));
    setDialog(null);
    const fallback = stops[idx === 0 ? 1 : idx - 1];
    if (fallback) selectStop(fallback.id, { open: false });
    showToast(`"${s.city}" הוסרה מהמסלול`, "בטל", () => {
      const pending = pendingDeleteStop.current;
      if (!pending) return;
      setStops((prev) => {
        const arr = [...prev];
        arr.splice(pending.index, 0, pending.stop);
        return arr;
      });
      setSelectedId(pending.stop.id);
      setToast(null);
    });
  }

  function updateActivity(stopId: string, activityId: string, patch: Partial<Activity>) {
    setActivitiesByStop((prev) => ({ ...prev, [stopId]: (prev[stopId] ?? []).map((a) => (a.id === activityId ? { ...a, ...patch } : a)) }));
  }
  function handleDuplicateActivity(stopId: string, activityId: string) {
    setActivitiesByStop((prev) => {
      const list = prev[stopId] ?? [];
      const idx = list.findIndex((a) => a.id === activityId);
      if (idx === -1) return prev;
      const copy: Activity = { ...list[idx], id: nextId("act"), title: `${list[idx].title} (עותק)` };
      const arr = [...list];
      arr.splice(idx + 1, 0, copy);
      return { ...prev, [stopId]: arr };
    });
    setMenuFor(null);
    showToast("הפעילות שוכפלה");
  }
  function handleDeleteActivityConfirm(stopId: string, activityId: string) {
    const list = activitiesByStop[stopId] ?? [];
    const idx = list.findIndex((a) => a.id === activityId);
    const a = list[idx];
    pendingDeleteActivity.current = { activity: a, index: idx };
    setActivitiesByStop((prev) => ({ ...prev, [stopId]: prev[stopId].filter((x) => x.id !== activityId) }));
    setDialog(null);
    showToast(`"${a.title}" נמחקה`, "בטל", () => {
      const pending = pendingDeleteActivity.current;
      if (!pending) return;
      setActivitiesByStop((prev) => {
        const arr = [...(prev[stopId] ?? [])];
        arr.splice(pending.index, 0, pending.activity);
        return { ...prev, [stopId]: arr };
      });
      setToast(null);
    });
  }
  function handleMoveActivity(stopId: string, activityId: string, newStopId: string) {
    setActivitiesByStop((prev) => {
      const fromList = prev[stopId] ?? [];
      const a = fromList.find((x) => x.id === activityId);
      if (!a) return prev;
      const toList = prev[newStopId] ?? [];
      return { ...prev, [stopId]: fromList.filter((x) => x.id !== activityId), [newStopId]: [...toList, { ...a, stopId: newStopId }] };
    });
    setDialog(null);
    const target = stops.find((s) => s.id === newStopId);
    if (target) showToast(`הפעילות הועברה ל${target.city}`);
  }

  function handleTimerAction(action: "nav" | "call" | "remind" | "done" | "postpone" | "edit" | "booking") {
    if (!nearestEvent) return;
    if (action === "nav") {
      window.open(`https://www.openstreetmap.org/search?query=${encodeURIComponent(stop.city)}`, "_blank", "noopener,noreferrer");
      return;
    }
    if (action === "call") {
      showToast(nearestEvent.driverName ? `מתקשר ל${nearestEvent.driverName}... (הדגמה בלבד)` : "מספר הנהג אינו זמין בהדגמה זו");
      return;
    }
    if (action === "booking") {
      showToast(`מספר הזמנה: ${nearestEvent.bookingRef ?? "לא זמין בהדגמה"}`);
      return;
    }
    if (action === "remind") {
      showToast(`תזכורת נשמרה עבור "${nearestEvent.label}"`);
      return;
    }
    if (action === "done") {
      setTimerEvents((prev) => prev.map((e) => (e.id === nearestEvent.id ? { ...e, status: "done" } : e)));
      showToast(`"${nearestEvent.label}" סומן כבוצע`);
      return;
    }
    if (action === "postpone") {
      setTimerEvents((prev) => prev.map((e) => (e.id === nearestEvent.id ? { ...e, offsetMinutes: e.offsetMinutes + 15 } : e)));
      showToast(`"${nearestEvent.label}" נדחה ב-15 דקות`);
      return;
    }
    if (action === "edit") {
      const input = window.prompt(`עדכון זמן ל"${nearestEvent.label}" (בדקות מעכשיו):`, String(Math.max(0, nearestEvent.offsetMinutes - demoClock)));
      const n = input != null ? parseInt(input, 10) : NaN;
      if (!Number.isNaN(n) && n >= 0) {
        setTimerEvents((prev) => prev.map((e) => (e.id === nearestEvent.id ? { ...e, offsetMinutes: demoClock + n } : e)));
      }
    }
  }

  const nearestEvent = useMemo(() => {
    const upcoming = timerEvents.filter((e) => e.status === "upcoming" && e.offsetMinutes - demoClock > -5);
    if (upcoming.length === 0) return null;
    return upcoming.reduce((min, e) => (e.offsetMinutes - demoClock < min.offsetMinutes - demoClock ? e : min));
  }, [timerEvents, demoClock]);

  function handleSearchSelect(id: string) {
    selectStop(id);
    setSearchOpen(false);
    setSearchQuery("");
  }
  const searchResults = searchQuery.trim() ? stops.filter((s) => s.city.includes(searchQuery.trim()) || s.country.includes(searchQuery.trim())) : [];

  const dayChips = useMemo(() => {
    const chips: { label: string; sub: string; stopId: string; dateIso: string }[] = [];
    stops.forEach((s) => {
      for (let d = 0; d < s.days; d++) {
        const date = addDays(s.dateStart, d);
        const dateIso = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}-${String(date.getDate()).padStart(2, "0")}`;
        chips.push({ label: String(date.getDate()), sub: new Intl.DateTimeFormat("he-IL", { weekday: "short" }).format(date), stopId: s.id, dateIso });
      }
    });
    return chips;
  }, [stops]);

  // memoized כדי שהטיימר (מתעדכן כל שנייה) לא יגרום למפה לבנות-מחדש את כל
  // הסימונים בכל טיק — בלי זה, כל אייקוני-הסמנים היו נהרסים ונוצרים מחדש
  // פעם בשנייה (react-leaflet יוצר L.divIcon חדש בכל render), מה שגרם
  // לניתוק לחיצות לסירוגין (נצפה בבדיקה בפועל).
  const mapPoints: MapPoint[] = useMemo(
    () =>
      stops.map((s, i) => ({
        id: s.id,
        lat: s.lat,
        lon: s.lon,
        city: s.city,
        days: s.days,
        color: STATUS_COLOR[STATUS_TONE[s.status]],
        isSelected: s.id === selectedId,
        isCurrent: i === CURRENT_INDEX,
      })),
    [stops, selectedId],
  );
  const mapSegments: MapRouteSegment[] = useMemo(
    () =>
      SEGMENTS.map((seg, i) => {
        const a = stops[i];
        const b = stops[i + 1];
        if (!a || !b) return null;
        const isDone = i < CURRENT_INDEX;
        return { from: { lat: a.lat, lon: a.lon }, to: { lat: b.lat, lon: b.lon }, color: isDone ? COLOR.success : COLOR.purple, weight: isDone ? 3 : 2.5, dashed: !isDone, opacity: isDone ? 1 : 0.85 };
      }).filter(Boolean) as MapRouteSegment[],
    [stops],
  );
  const transportMarkers: TransportMarker[] = useMemo(
    () =>
      SEGMENTS.map((seg, i) => {
        const a = stops[i];
        const b = stops[i + 1];
        if (!a || !b) return null;
        return { lat: (a.lat + b.lat) / 2, lon: (a.lon + b.lon) / 2, mode: seg.mode, done: i < CURRENT_INDEX };
      }).filter(Boolean) as TransportMarker[],
    [stops],
  );
  const fitPoints = useMemo(() => mapPoints.slice(1), [mapPoints]);

  // גובה-הכרטיס נגזר מהגובה האמיתי הנמדד של המסך (לא קבוע-קשיח) — כדי
  // שהיחסים (מפה ≥60%, כרטיס-תקציר קטן) יישמרו גם אם הדפדפן מדווח על גובה
  // תצוגה שונה (למשל בכלי-תצוגה עם אחוזי-זום), ולא רק ב-390x844 מדויק.
  const pageWrapRef = useRef<HTMLDivElement>(null);
  const [pageHeight, setPageHeight] = useState(844);
  useLayoutEffect(() => {
    function measure() {
      if (pageWrapRef.current) setPageHeight(pageWrapRef.current.clientHeight);
    }
    measure();
    window.addEventListener("resize", measure);
    return () => window.removeEventListener("resize", measure);
  }, []);
  const sheetPeekPx = Math.round(pageHeight * 0.118);
  const sheetOpenPx = Math.round(pageHeight * 0.66);
  const sheetTranslatePx = sheetTranslate * (sheetOpenPx - sheetPeekPx);

  return (
    <div ref={pageWrapRef} style={{ width: "100%", height: "100dvh", maxHeight: "100dvh", background: COLOR.pageBg, color: COLOR.textPrimary, fontFamily: "var(--font-rubik), sans-serif", direction: "rtl", display: "flex", flexDirection: "column", overflow: "hidden", paddingBottom: `${NAV_HEIGHT}px` }}>
      {/* כותרת */}
      <div style={{ display: "flex", alignItems: "center", gap: "8px", padding: "8px 16px 4px", flexShrink: 0 }}>
        <Link href="/route" aria-label="חזרה" style={{ width: "34px", height: "34px", borderRadius: "50%", background: COLOR.cardBg, border: `1px solid ${COLOR.cardBorder}`, color: "#fff", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0, textDecoration: "none" }}>
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2.2} strokeLinecap="round" strokeLinejoin="round">
            <path d="M15 5 8 12l7 7" />
          </svg>
        </Link>
        <h1 style={{ margin: 0, fontSize: "16px", fontWeight: 800, color: "#fff", flex: 1, minWidth: 0, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>המסלול שלי</h1>
        <button type="button" onClick={() => openDialog({ kind: "stop", type: "add" })} aria-label="הוספת יעד" style={{ width: "34px", height: "34px", borderRadius: "50%", background: COLOR.cardBg, border: `1px solid ${COLOR.cardBorder}`, color: "#fff", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0, cursor: "pointer" }}>
          <PlusIcon size={15} />
        </button>
        <button type="button" onClick={() => setSearchOpen((v) => !v)} aria-label="חיפוש יעד" aria-pressed={searchOpen} style={{ width: "34px", height: "34px", borderRadius: "50%", background: searchOpen ? COLOR.purple : COLOR.cardBg, border: `1px solid ${COLOR.cardBorder}`, color: "#fff", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0, cursor: "pointer" }}>
          <SearchIcon size={15} />
        </button>
        <button type="button" onClick={() => setOptionsOpen(true)} aria-label="אפשרויות נוספות" style={{ width: "34px", height: "34px", borderRadius: "50%", background: COLOR.cardBg, border: `1px solid ${COLOR.cardBorder}`, color: "#fff", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0, cursor: "pointer" }}>
          <DotsIcon size={15} />
        </button>
      </div>

      {searchOpen ? (
        <div style={{ padding: "0 16px 10px", flexShrink: 0 }}>
          <input autoFocus value={searchQuery} onChange={(e) => setSearchQuery(e.target.value)} placeholder="חיפוש יעד לפי שם עיר..." style={inputStyle()} />
          {searchResults.length > 0 ? (
            <div style={{ marginTop: "8px", display: "flex", flexDirection: "column", gap: "6px" }}>
              {searchResults.map((s) => (
                <button key={s.id} type="button" onClick={() => handleSearchSelect(s.id)} style={{ display: "flex", alignItems: "center", justifyContent: "space-between", padding: "9px 12px", borderRadius: "10px", background: "#12213f", border: `1px solid ${COLOR.cardBorder}`, color: "#fff", fontSize: "13.5px", fontWeight: 700, cursor: "pointer", textAlign: "right" }}>
                  {s.city}
                  <span style={{ color: COLOR.textSecondary, fontWeight: 500, fontSize: "12px" }}>{s.country}</span>
                </button>
              ))}
            </div>
          ) : searchQuery.trim() ? (
            <div style={{ marginTop: "8px", fontSize: "12.5px", color: COLOR.textSecondary }}>לא נמצאו יעדים תואמים</div>
          ) : null}
        </div>
      ) : null}


      <SmartTimerCard event={nearestEvent} demoClock={demoClock} expanded={timerExpanded} onToggleExpand={() => setTimerExpanded((v) => !v)} onAction={handleTimerAction} />

      {/* גוף המסך: מפה או רשימה */}
      <div style={{ flex: 1, minHeight: 0, padding: "0 16px", display: "flex", flexDirection: "column" }}>
        {viewMode === "map" ? (
          <div ref={mapWrapRef} style={{ position: "relative", flex: 1, minHeight: 0, borderRadius: isFullscreen ? 0 : "18px", overflow: "hidden", border: "1px solid rgba(11,18,32,0.2)", background: COLOR.pageBg }}>
            <LeafletMap points={mapPoints} segments={mapSegments} transports={transportMarkers} onSelect={selectStop} flyTarget={flyTarget} fitPoints={fitPoints} />
            {/* מיקום פיזי מפורש (right, לא insetInlineEnd) — Leaflet ממקם את
                פקד-הזום שלו תמיד ב"bottomleft" הפיזי בלי קשר לכיווניות-העמוד,
                אז חובה למקם כאן בפינה הפיזית הנגדית כדי לא לחפוף אליו. */}
            <div style={{ position: "absolute", right: "10px", bottom: "14px", display: "flex", flexDirection: "column", gap: "6px", zIndex: 500 }}>
              <button
                type="button"
                onClick={recenter}
                aria-label="מיקום נוכחי"
                style={{ width: "36px", height: "36px", borderRadius: "10px", background: "rgba(11,18,32,0.88)", border: "1px solid rgba(255,255,255,0.25)", color: "#fff", display: "flex", alignItems: "center", justifyContent: "center", cursor: "pointer" }}
              >
                <CrosshairIcon size={16} />
              </button>
              <button
                type="button"
                onClick={toggleFullscreen}
                aria-label={isFullscreen ? "יציאה ממסך מלא" : "מסך מלא"}
                aria-pressed={isFullscreen}
                style={{ width: "36px", height: "36px", borderRadius: "10px", background: "rgba(11,18,32,0.88)", border: "1px solid rgba(255,255,255,0.25)", color: "#fff", display: "flex", alignItems: "center", justifyContent: "center", cursor: "pointer" }}
              >
                <FullscreenIcon size={15} active={isFullscreen} />
              </button>
            </div>
          </div>
        ) : (
          <div style={{ flex: 1, minHeight: 0, overflowY: "auto", display: "flex", flexDirection: "column", gap: "8px", paddingBottom: "8px" }}>
            {stops.map((s) => (
              <button key={s.id} type="button" onClick={() => selectStop(s.id)} style={{ display: "flex", alignItems: "center", gap: "10px", padding: "12px", borderRadius: "14px", background: s.id === selectedId ? "rgba(138,90,223,0.18)" : "#12213f", border: `1px solid ${s.id === selectedId ? COLOR.purple + "70" : COLOR.cardBorder}`, cursor: "pointer", textAlign: "right", color: "inherit", font: "inherit", flexShrink: 0 }}>
                <span aria-hidden style={{ width: "26px", height: "26px", borderRadius: "50%", background: STATUS_COLOR[STATUS_TONE[s.status]], border: "2px solid rgba(255,255,255,0.5)", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
                  <PinGlyph size={13} />
                </span>
                <div style={{ minWidth: 0, flex: 1 }}>
                  <div style={{ fontWeight: 700, fontSize: "14.5px", color: "#fff" }}>{s.city}</div>
                  <div style={{ fontSize: "12.5px", color: COLOR.textSecondary, marginTop: "1px" }}>{s.datesLabel} · {s.days} ימים</div>
                </div>
              </button>
            ))}
          </div>
        )}
      </div>

      {/* שורת ימים — קומפקטית; רק היום הנבחר בפועל מודגש (לא כל ימי התחנה) */}
      <div data-testid="day-row" style={{ display: "flex", gap: "6px", padding: "4px 16px", overflowX: "auto", flexShrink: 0 }}>
        {dayChips.map((c, i) => {
          const isActive = c.dateIso === selectedDate;
          return (
            <button
              key={`day-${i}`}
              type="button"
              onClick={() => selectDay(c.stopId, c.dateIso)}
              style={{
                display: "flex",
                flexDirection: "column",
                alignItems: "center",
                justifyContent: "center",
                minWidth: "38px",
                padding: "5px 3px",
                borderRadius: "10px",
                background: isActive ? COLOR.purple : "transparent",
                border: `1px solid ${isActive ? "#fff" : "transparent"}`,
                color: "#fff",
                cursor: "pointer",
                flexShrink: 0,
              }}
            >
              <span style={{ fontSize: "9.5px", color: isActive ? "rgba(255,255,255,0.85)" : COLOR.textSecondary }}>{c.sub}</span>
              <span style={{ fontSize: "13px", fontWeight: 800 }}>{c.label}</span>
            </button>
          );
        })}
      </div>

      {/* כרטיס מידע — ניתן לגרירה בין מצב-פתוח למצב-תקציר */}
      {stop ? (
        <div
          data-testid="stop-sheet"
          style={{
            flexShrink: 0,
            background: "#12213f",
            border: `1px solid ${COLOR.cardBorder}`,
            borderTopLeftRadius: "20px",
            borderTopRightRadius: "20px",
            padding: "8px 16px calc(10px + env(safe-area-inset-bottom))",
            height: `${sheetOpenPx}px`,
            marginTop: `-${sheetOpenPx - sheetPeekPx}px`,
            transform: `translateY(${sheetTranslatePx}px)`,
            transition: sheetDragging ? "none" : "transform 0.28s cubic-bezier(0.22,1,0.36,1)",
            overflowY: "auto",
            position: "relative",
            // Leaflet מקצה z-index גבוה (עד 1000) לפקדי-הבקרה הפנימיים שלו
            // (זום וכו') — בלי לעלות משמעותית מעל זה, פקדי המפה "בולעים"
            // חזותית את כרטיס-המידע כשהוא במצב פתוח (נצפה בבדיקה בפועל).
            zIndex: 1500,
          }}
        >
          <div onPointerDown={onSheetPointerDown} onPointerMove={onSheetPointerMove} onPointerUp={onSheetPointerUp} onPointerCancel={onSheetPointerUp} onClick={() => { if (!sheetDragMovedRef.current) toggleSheet(); }} style={{ display: "flex", justifyContent: "center", padding: "6px 0 8px", cursor: "grab", touchAction: "none" }}>
            <span style={{ width: "40px", height: "4px", borderRadius: "999px", background: "rgba(255,255,255,0.3)" }} />
          </div>

          <div style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between", gap: "8px" }}>
            <div style={{ minWidth: 0 }}>
              <div style={{ fontWeight: 800, fontSize: "17px", color: "#fff" }}>{stop.city}</div>
              <div style={{ fontSize: "13px", color: COLOR.textSecondary, marginTop: "2px" }}>{stop.datesLabel}</div>
            </div>
            <button type="button" onClick={() => openMenu({ kind: "stop", id: stop.id })} aria-label={`פעולות עבור ${stop.city}`} style={{ width: "34px", height: "34px", borderRadius: "10px", background: "rgba(255,255,255,0.06)", border: `1px solid ${COLOR.cardBorder}`, color: "#fff", display: "flex", alignItems: "center", justifyContent: "center", cursor: "pointer", flexShrink: 0 }}>
              <DotsIcon size={15} />
            </button>
          </div>

          <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: "8px", margin: "8px 0" }}>
            <div style={{ fontSize: "13px", color: "#e4e8f2" }}>
              {stop.hotel ?? "ללא מלון (יום מעבר)"} · {stop.weather} · {activities.length} פעילויות
            </div>
            <a
              href={`https://www.openstreetmap.org/search?query=${encodeURIComponent(stop.city)}`}
              target="_blank"
              rel="noopener noreferrer"
              style={{ display: "flex", alignItems: "center", gap: "4px", padding: "5px 10px", borderRadius: "999px", background: "rgba(138,90,223,0.18)", border: `1px solid ${COLOR.purple}55`, color: "#c9b3ff", fontSize: "11px", fontWeight: 700, whiteSpace: "nowrap", textDecoration: "none", flexShrink: 0 }}
            >
              ניווט
            </a>
          </div>

          {sheetTranslate < 0.5 && nearestEvent && stop.id === (stops[CURRENT_INDEX]?.id ?? "") ? (
            <div style={{ fontSize: "12px", color: COLOR.purple, fontWeight: 700, marginBottom: "10px" }}>
              ההסעה הבאה: {nearestEvent.label} · בעוד {formatMinutes(Math.max(0, nearestEvent.offsetMinutes - demoClock))}
            </div>
          ) : null}

          {sheetTranslate < 0.5 ? (
            <>
              <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", margin: "14px 0 8px" }}>
                <span style={{ fontSize: "13.5px", fontWeight: 800, color: "#fff" }}>כל הפעילויות של היום</span>
                <button
                  type="button"
                  onClick={() => {
                    const a: Activity = { id: nextId("act"), stopId: stop.id, time: "09:00", title: "פעילות חדשה", location: "", status: "מתוכנן" };
                    setActivitiesByStop((prev) => ({ ...prev, [stop.id]: [...(prev[stop.id] ?? []), a] }));
                    openDialog({ kind: "activity", type: "edit", stopId: stop.id, activityId: a.id });
                  }}
                  style={{ ...PILL_BASE, height: "30px", fontSize: "11px", background: "rgba(138,90,223,0.2)", border: `1px solid ${COLOR.purple}55`, color: "#c9b3ff" }}
                >
                  <PlusIcon size={11} />
                  הוספת פעילות
                </button>
              </div>

              <div style={{ display: "flex", flexDirection: "column", gap: "8px", marginBottom: "12px" }}>
                {activities.length === 0 ? (
                  <div style={{ fontSize: "12.5px", color: COLOR.textSecondary, padding: "8px 0" }}>אין פעילויות מתוכננות</div>
                ) : (
                  activities.map((a) => (
                    <div key={a.id} style={{ display: "flex", alignItems: "center", gap: "10px", padding: "10px", borderRadius: "12px", background: "rgba(255,255,255,0.04)", border: `1px solid ${COLOR.cardBorder}` }}>
                      <div style={{ minWidth: 0, flex: 1 }}>
                        <div style={{ fontSize: "11.5px", color: COLOR.textSecondary }}>
                          {a.time}
                          {a.endTime ? ` – ${a.endTime}` : ""}
                        </div>
                        <div style={{ fontSize: "13.5px", fontWeight: 700, color: "#fff", marginTop: "1px" }}>{a.title}</div>
                        {a.location ? <div style={{ fontSize: "11.5px", color: COLOR.textSecondary }}>{a.location}</div> : null}
                      </div>
                      <button type="button" onClick={() => openMenu({ kind: "activity", stopId: stop.id, activityId: a.id })} aria-label={`פעולות עבור ${a.title}`} style={{ width: "32px", height: "32px", borderRadius: "9px", background: "rgba(255,255,255,0.06)", border: `1px solid ${COLOR.cardBorder}`, color: "#fff", display: "flex", alignItems: "center", justifyContent: "center", cursor: "pointer", flexShrink: 0 }}>
                        <DotsIcon size={13} />
                      </button>
                    </div>
                  ))
                )}
              </div>
            </>
          ) : null}

          <Link href={`/planner?day=${stop.dateStart}&city=${encodeURIComponent(stop.city)}`} style={{ display: "flex", alignItems: "center", justifyContent: "center", gap: "6px", padding: "11px", borderRadius: "12px", background: "rgba(138,90,223,0.22)", border: `1px solid ${COLOR.purple}70`, color: "#c9b3ff", fontSize: "13.5px", fontWeight: 700, textDecoration: "none" }}>
            פתיחת התוכנית היומית
          </Link>
        </div>
      ) : null}

      {/* Toast */}
      {toast ? (
        <div style={{ position: "fixed", insetInlineStart: "16px", insetInlineEnd: "16px", bottom: `calc(${NAV_HEIGHT}px + 14px)`, zIndex: 1600, display: "flex", justifyContent: "center" }}>
          <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: "12px", width: "100%", maxWidth: "460px", background: "rgba(15,22,42,0.97)", border: `1px solid ${COLOR.cardBorder}`, borderRadius: "14px", padding: "12px 16px", boxShadow: "0 10px 30px rgba(0,0,0,0.4)" }}>
            <span style={{ fontSize: "13px", color: "#fff" }}>{toast.message}</span>
            {toast.actionLabel ? (
              <button type="button" onClick={toast.onAction} style={{ background: "none", border: "none", color: COLOR.purple, fontWeight: 800, fontSize: "13px", cursor: "pointer" }}>
                {toast.actionLabel}
              </button>
            ) : null}
          </div>
        </div>
      ) : null}

      {/* תפריט אפשרויות (כותרת) */}
      {optionsOpen ? (
        <BottomSheetModal onClose={() => setOptionsOpen(false)}>
          <ActionRow label={viewMode === "map" ? "מעבר לתצוגת רשימה" : "מעבר לתצוגת מפה"} onClick={() => { setViewMode((m) => (m === "map" ? "list" : "map")); setOptionsOpen(false); }} />
          <ActionRow label="מרכוז מחדש למיקום הנוכחי" onClick={() => { recenter(); setOptionsOpen(false); }} />
        </BottomSheetModal>
      ) : null}

      {/* תפריט שלוש-נקודות: יעד */}
      {menuFor?.kind === "stop" ? (
        <BottomSheetModal onClose={() => setMenuFor(null)} title={stops.find((s) => s.id === menuFor.id)?.city}>
          <ActionRow label="עריכת היעד" onClick={() => openDialog({ kind: "stop", type: "edit", id: menuFor.id })} />
          <ActionRow label="עדכון תאריכים" onClick={() => openDialog({ kind: "stop", type: "edit", id: menuFor.id })} />
          <ActionRow
            label="שכפול היעד"
            onClick={() => {
              const s = stops.find((x) => x.id === menuFor.id);
              if (!s) return;
              const copy: Stop = { ...s, id: nextId("stop"), city: `${s.city} (עותק)` };
              setStops((prev) => [...prev, copy]);
              setActivitiesByStop((prev) => ({ ...prev, [copy.id]: [] }));
              setMenuFor(null);
              showToast(`"${s.city}" שוכפל`);
            }}
          />
          <ActionRow label="מחיקת היעד" danger onClick={() => openDialog({ kind: "stop", type: "delete", id: menuFor.id })} />
        </BottomSheetModal>
      ) : null}

      {/* תפריט שלוש-נקודות: פעילות */}
      {menuFor?.kind === "activity" ? (
        <BottomSheetModal onClose={() => setMenuFor(null)} title={activitiesByStop[menuFor.stopId]?.find((a) => a.id === menuFor.activityId)?.title}>
          <ActionRow label="עריכת הפעילות" onClick={() => openDialog({ kind: "activity", type: "edit", stopId: menuFor.stopId, activityId: menuFor.activityId })} />
          <ActionRow label="שינוי שעה" onClick={() => openDialog({ kind: "activity", type: "time", stopId: menuFor.stopId, activityId: menuFor.activityId })} />
          <ActionRow label="העברה ליום אחר" onClick={() => openDialog({ kind: "activity", type: "move", stopId: menuFor.stopId, activityId: menuFor.activityId })} />
          <ActionRow label="שכפול הפעילות" onClick={() => handleDuplicateActivity(menuFor.stopId, menuFor.activityId)} />
          <ActionRow label="מחיקת הפעילות" danger onClick={() => openDialog({ kind: "activity", type: "delete", stopId: menuFor.stopId, activityId: menuFor.activityId })} />
        </BottomSheetModal>
      ) : null}

      {/* עריכת יעד */}
      {dialog?.kind === "stop" && dialog.type === "edit" ? (
        <EditStopSheet stop={stops.find((s) => s.id === dialog.id)!} onClose={() => setDialog(null)} onSave={(patch) => { setStops((prev) => prev.map((s) => (s.id === dialog.id ? { ...s, ...patch } : s))); setDialog(null); }} />
      ) : null}

      {/* מחיקת יעד */}
      {dialog?.kind === "stop" && dialog.type === "delete" ? (
        <BottomSheetModal onClose={() => setDialog(null)} title="מחיקת יעד">
          <p style={{ fontSize: "13.5px", color: COLOR.textSecondary, marginBottom: "16px" }}>
            האם למחוק את <strong style={{ color: "#fff" }}>{stops.find((s) => s.id === dialog.id)?.city}</strong> מהמסלול? ניתן לבטל מיד לאחר המחיקה.
          </p>
          <div style={{ display: "flex", gap: "8px" }}>
            <button type="button" onClick={() => setDialog(null)} style={{ flex: 1, padding: "12px", borderRadius: "12px", background: "rgba(255,255,255,0.06)", border: `1px solid ${COLOR.cardBorder}`, color: "#fff", fontSize: "14px", fontWeight: 700, cursor: "pointer" }}>
              ביטול
            </button>
            <button type="button" onClick={() => handleDeleteStopConfirm(dialog.id)} style={{ flex: 1, padding: "12px", borderRadius: "12px", background: COLOR.danger, border: "none", color: "#fff", fontSize: "14px", fontWeight: 700, cursor: "pointer" }}>
              מחיקה
            </button>
          </div>
        </BottomSheetModal>
      ) : null}

      {/* הוספת יעד */}
      {dialog?.kind === "stop" && dialog.type === "add" ? (
        <AddStopSheet
          onClose={() => setDialog(null)}
          onAdd={(form) => {
            const last = stops[stops.length - 1];
            const newStop: Stop = { id: nextId("stop"), city: form.city, country: form.country, lat: last.lat + (Math.random() - 0.5) * 0.6, lon: last.lon + (Math.random() - 0.5) * 0.6, dateStart: form.dateStart, days: form.days, datesLabel: `${form.days} ימים החל מ-${form.dateStart}`, status: "ממתין לאישור", hotel: form.hotel || null, weather: "—", notes: "" };
            setStops((prev) => [...prev, newStop]);
            setActivitiesByStop((prev) => ({ ...prev, [newStop.id]: [] }));
            setDialog(null);
            setSelectedId(newStop.id);
            showToast(`"${form.city}" נוסף למסלול`);
          }}
        />
      ) : null}

      {/* עריכת פעילות */}
      {dialog?.kind === "activity" && dialog.type === "edit" ? (
        <EditActivitySheet activity={activitiesByStop[dialog.stopId]?.find((a) => a.id === dialog.activityId)!} onClose={() => setDialog(null)} onSave={(patch) => { updateActivity(dialog.stopId, dialog.activityId, patch); setDialog(null); }} />
      ) : null}

      {/* שינוי שעה לפעילות */}
      {dialog?.kind === "activity" && dialog.type === "time" ? (
        <QuickTimeSheet activity={activitiesByStop[dialog.stopId]?.find((a) => a.id === dialog.activityId)!} onClose={() => setDialog(null)} onSave={(time, endTime) => { updateActivity(dialog.stopId, dialog.activityId, { time, endTime }); setDialog(null); }} />
      ) : null}

      {/* העברת פעילות ליעד אחר */}
      {dialog?.kind === "activity" && dialog.type === "move" ? (
        <BottomSheetModal onClose={() => setDialog(null)} title="העברה ליעד אחר">
          <div style={{ display: "flex", flexDirection: "column", gap: "8px" }}>
            {stops.filter((s) => s.id !== dialog.stopId).map((s) => (
              <button key={s.id} type="button" onClick={() => handleMoveActivity(dialog.stopId, dialog.activityId, s.id)} style={{ padding: "12px", borderRadius: "12px", background: "#0e1930", border: `1px solid ${COLOR.cardBorder}`, color: "#fff", fontSize: "14px", fontWeight: 700, cursor: "pointer", textAlign: "right" }}>
                {s.city}
              </button>
            ))}
          </div>
        </BottomSheetModal>
      ) : null}

      {/* מחיקת פעילות */}
      {dialog?.kind === "activity" && dialog.type === "delete" ? (
        <BottomSheetModal onClose={() => setDialog(null)} title="מחיקת פעילות">
          <p style={{ fontSize: "13.5px", color: COLOR.textSecondary, marginBottom: "16px" }}>
            האם למחוק את <strong style={{ color: "#fff" }}>{activitiesByStop[dialog.stopId]?.find((a) => a.id === dialog.activityId)?.title}</strong>? ניתן לבטל מיד לאחר המחיקה.
          </p>
          <div style={{ display: "flex", gap: "8px" }}>
            <button type="button" onClick={() => setDialog(null)} style={{ flex: 1, padding: "12px", borderRadius: "12px", background: "rgba(255,255,255,0.06)", border: `1px solid ${COLOR.cardBorder}`, color: "#fff", fontSize: "14px", fontWeight: 700, cursor: "pointer" }}>
              ביטול
            </button>
            <button type="button" onClick={() => handleDeleteActivityConfirm(dialog.stopId, dialog.activityId)} style={{ flex: 1, padding: "12px", borderRadius: "12px", background: COLOR.danger, border: "none", color: "#fff", fontSize: "14px", fontWeight: 700, cursor: "pointer" }}>
              מחיקה
            </button>
          </div>
        </BottomSheetModal>
      ) : null}

      <BottomNav active="map" />
    </div>
  );
}

function EditStopSheet({ stop, onClose, onSave }: { stop: Stop; onClose: () => void; onSave: (patch: Partial<Stop>) => void }) {
  const [city, setCity] = useState(stop.city);
  const [datesLabel, setDatesLabel] = useState(stop.datesLabel);
  const [hotel, setHotel] = useState(stop.hotel ?? "");
  const [notes, setNotes] = useState(stop.notes);
  return (
    <BottomSheetModal onClose={onClose} title="עריכת יעד">
      <div style={{ display: "flex", flexDirection: "column", gap: "12px" }}>
        <Field label="שם היעד">
          <input value={city} onChange={(e) => setCity(e.target.value)} style={inputStyle()} />
        </Field>
        <Field label="תאריכי שהייה">
          <input value={datesLabel} onChange={(e) => setDatesLabel(e.target.value)} style={inputStyle()} />
        </Field>
        <Field label="מלון">
          <input value={hotel} onChange={(e) => setHotel(e.target.value)} style={inputStyle()} />
        </Field>
        <Field label="הערות">
          <textarea value={notes} onChange={(e) => setNotes(e.target.value)} rows={2} style={{ ...inputStyle(), resize: "none" }} />
        </Field>
        <button type="button" onClick={() => onSave({ city, datesLabel, hotel: hotel || null, notes })} style={{ padding: "13px", borderRadius: "12px", background: COLOR.purple, border: "none", color: "#fff", fontSize: "14.5px", fontWeight: 800, cursor: "pointer", marginTop: "4px" }}>
          שמירה
        </button>
      </div>
    </BottomSheetModal>
  );
}

function AddStopSheet({ onClose, onAdd }: { onClose: () => void; onAdd: (form: { city: string; country: string; dateStart: string; days: number; hotel: string }) => void }) {
  const [city, setCity] = useState("");
  const [country, setCountry] = useState("תאילנד");
  const [dateStart, setDateStart] = useState("");
  const [days, setDays] = useState(3);
  const [hotel, setHotel] = useState("");
  const canSave = city.trim().length > 0 && dateStart.length > 0;
  return (
    <BottomSheetModal onClose={onClose} title="הוספת יעד חדש">
      <div style={{ display: "flex", flexDirection: "column", gap: "12px" }}>
        <Field label="שם היעד">
          <input value={city} onChange={(e) => setCity(e.target.value)} placeholder="לדוגמה: צ'אנג מאי" style={inputStyle()} />
        </Field>
        <Field label="מדינה">
          <input value={country} onChange={(e) => setCountry(e.target.value)} style={inputStyle()} />
        </Field>
        <Field label="תאריך התחלה">
          <input type="date" value={dateStart} onChange={(e) => setDateStart(e.target.value)} style={inputStyle()} />
        </Field>
        <Field label="מספר ימים">
          <input type="number" min={1} value={days} onChange={(e) => setDays(Number(e.target.value) || 1)} style={inputStyle()} />
        </Field>
        <Field label="מלון (לא חובה)">
          <input value={hotel} onChange={(e) => setHotel(e.target.value)} style={inputStyle()} />
        </Field>
        <button type="button" disabled={!canSave} onClick={() => onAdd({ city: city.trim(), country: country.trim(), dateStart, days, hotel })} style={{ padding: "13px", borderRadius: "12px", background: canSave ? COLOR.purple : "rgba(255,255,255,0.08)", border: "none", color: canSave ? "#fff" : COLOR.textMuted, fontSize: "14.5px", fontWeight: 800, cursor: canSave ? "pointer" : "default", marginTop: "4px" }}>
          הוספה למסלול
        </button>
      </div>
    </BottomSheetModal>
  );
}

function EditActivitySheet({ activity, onClose, onSave }: { activity: Activity; onClose: () => void; onSave: (patch: Partial<Activity>) => void }) {
  const [title, setTitle] = useState(activity.title);
  const [location, setLocation] = useState(activity.location);
  const [time, setTime] = useState(activity.time);
  const [endTime, setEndTime] = useState(activity.endTime ?? "");
  return (
    <BottomSheetModal onClose={onClose} title="עריכת פעילות">
      <div style={{ display: "flex", flexDirection: "column", gap: "12px" }}>
        <Field label="שם הפעילות">
          <input value={title} onChange={(e) => setTitle(e.target.value)} style={inputStyle()} />
        </Field>
        <Field label="מיקום">
          <input value={location} onChange={(e) => setLocation(e.target.value)} style={inputStyle()} />
        </Field>
        <div style={{ display: "flex", gap: "8px" }}>
          <div style={{ flex: 1 }}>
            <Field label="שעת התחלה">
              <input type="time" value={time} onChange={(e) => setTime(e.target.value)} style={inputStyle()} />
            </Field>
          </div>
          <div style={{ flex: 1 }}>
            <Field label="שעת סיום">
              <input type="time" value={endTime} onChange={(e) => setEndTime(e.target.value)} style={inputStyle()} />
            </Field>
          </div>
        </div>
        <button type="button" onClick={() => onSave({ title, location, time, endTime: endTime || undefined })} style={{ padding: "13px", borderRadius: "12px", background: COLOR.purple, border: "none", color: "#fff", fontSize: "14.5px", fontWeight: 800, cursor: "pointer", marginTop: "4px" }}>
          שמירה
        </button>
      </div>
    </BottomSheetModal>
  );
}

function QuickTimeSheet({ activity, onClose, onSave }: { activity: Activity; onClose: () => void; onSave: (time: string, endTime?: string) => void }) {
  const [time, setTime] = useState(activity.time);
  const [endTime, setEndTime] = useState(activity.endTime ?? "");
  return (
    <BottomSheetModal onClose={onClose} title="שינוי שעה">
      <div style={{ display: "flex", flexDirection: "column", gap: "12px" }}>
        <div style={{ display: "flex", gap: "8px" }}>
          <div style={{ flex: 1 }}>
            <Field label="שעת התחלה">
              <input type="time" value={time} onChange={(e) => setTime(e.target.value)} style={inputStyle()} />
            </Field>
          </div>
          <div style={{ flex: 1 }}>
            <Field label="שעת סיום">
              <input type="time" value={endTime} onChange={(e) => setEndTime(e.target.value)} style={inputStyle()} />
            </Field>
          </div>
        </div>
        <button type="button" onClick={() => onSave(time, endTime || undefined)} style={{ padding: "13px", borderRadius: "12px", background: COLOR.purple, border: "none", color: "#fff", fontSize: "14.5px", fontWeight: 800, cursor: "pointer", marginTop: "4px" }}>
          שמירה
        </button>
      </div>
    </BottomSheetModal>
  );
}
