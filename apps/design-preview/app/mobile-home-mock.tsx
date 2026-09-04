"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { signOutCurrentUser, useCurrentUser } from "./auth-session";
import { getDemoCurrencyRatesAction, type DemoWeatherResult, type DemoCurrencyResult } from "./actions";
import { fetchWeather } from "./weather-client";
import { useWalletStore } from "./wallet-store";
import { formatMoney, today, loadJSON, SK, type DocumentEntry } from "./wallet-data";
import { activeTrip, tripProgress as computeTripProgressFor, type DemoTrip } from "./trips-data";
import { loadStops, countDatesWithoutActivity, firstDateWithoutActivity, cityForDate, activitiesForDate, type TripActivity } from "./trip-content";
import { loadBookings } from "./bookings-data";
import { FlagIcon } from "./country-currency-data";

// עוטפת קריאה ל-API חיצוני בכמה ניסיונות עם השהיה עולה — ראו הערה בשימוש
// למטה. נצפה בפועל מול production: גם Route Handler רגיל (לא רק server
// action) יכול להיכשל זמנית כשקוראים לו כמה פעמים ברצף קצר — ככל הנראה
// הגבלת-קצב אצל הספק החינמי (Open-Meteo) עצמו, לא באג בקוד. ניסיון בודד
// לא הספיק תמיד; כמה ניסיונות עם פערים גדלים נותנים סיכוי אמיתי לחלון
// ההגבלה לחלוף.
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

// שעון אמיתי לפי אזור-זמן — לא זמן קבוע. מתעדכן כל 30 שניות (מספיק לתצוגת
// שעה, לא צריך רזולוציית-שנייה). אותה שיטה בדיוק כמו WorldClockCard האמיתי
// באפליקציה (Intl.DateTimeFormat עם timeZone), רק בלי תלות ברכיב הישן.
function formatClockTime(date: Date, timeZone: string): string {
  return new Intl.DateTimeFormat("he-IL", { hour: "2-digit", minute: "2-digit", timeZone }).format(date);
}
function formatClockDate(date: Date, timeZone: string): string {
  return new Intl.DateTimeFormat("he-IL", { weekday: "long", day: "numeric", month: "long", timeZone }).format(date);
}

// ברכה לפי השעה המקומית **של המכשיר עצמו** (date.getHours() בלי המרת-timeZone
// — זו בדיוק "השעה המקומית של המכשיר", לא של יעד-הטיול). גבולות לפי בקשה
// מפורשת: 05-12 בוקר, 12-17 צהריים, 17-22 ערב, 22-05 לילה.
function getTimeGreeting(hour: number): string {
  if (hour >= 5 && hour < 12) return "בוקר טוב";
  if (hour >= 12 && hour < 17) return "צהריים טובים";
  if (hour >= 17 && hour < 22) return "ערב טוב";
  return "לילה טוב";
}

/**
 * אבטיפוס-חזותי בלבד — מסך-בית אחד לטלפון (390px), בנוי מאפס. בלי שום ייבוא
 * מרכיבי-הדשבורד הקיימים ובלי טוקנים מה-design-system הישן (--color-*) —
 * כל צבע כאן נדגם ישירות מפיקסלים אמיתיים בתוך mobile-screens.png (ר'
 * scratchpad/sample-colors.mjs) ולא "הרגשה כללית" של כהה+סגול. נתוני-הדוגמה
 * קבועים בכוונה (בקשת משתמש מפורשת) — לא מחוברים ל-DB/Supabase, בלי
 * onClick/href אמיתיים חוץ מפתיחת-חלונית-הצ'אט (state מקומי בלבד, להדגמת
 * העיצוב — לא שולח כלום לשום מקום).
 */

// דגימות-פיקסל אמיתיות מ-mobile-screens.png, פאנל 1 (מסך-הבית):
const COLOR = {
  pageBg: "#050f24", // בין page-bg-clean(#071936) ל-page-bg-corner(#04112c)
  cardBg: "#0a1830", // route-card-bg/wallet-card-inner
  cardBorder: "rgba(120, 150, 200, 0.16)", // card-border-route ~#203556
  tealCardBg: "linear-gradient(160deg, rgba(5,50,60,0.55), #0a1830)", // thailand-card-bg טווח
  blueCardBg: "linear-gradient(160deg, rgba(12,40,80,0.55), #0a1830)", // israel-card-bg טווח
  turquoise: "#43d6aa", // route-bar-fill — מדויק
  purple: "#8a5adf", // active-home-icon-purple — מדויק
  purpleDeep: "#6642b9", // fab-bottom
  blueGlow: "rgba(59,130,246,0.16)",
  purpleGlow: "rgba(138,90,223,0.2)",
  textPrimary: "#f4f6fb",
  textSecondary: "#9aa3bd", // "טקסט משני בגוון אפור כחול"
  textMuted: "#6b7290",
  danger: "#ef6f61",
  warning: "#f5a544",
  success: "#43d6aa",
  // כרטיס "כמעט מוכנים לטיול" — יושב על גרדיאנט-סגול משלו (לא COLOR.cardBg
  // הרגיל), ולכן הצבעים הבאים לא חוזרים בשום מקום אחר בעמוד. שמות מפורשים
  // כדי שלא יישארו hex-ים "קשיחים" מפוזרים בתוך ה-JSX.
  readinessGradientStart: "#2c2569",
  readinessGradientMid: "#23295c",
  readinessGradientEnd: "#1c2750",
  readinessBorder: "rgba(168,128,245,0.45)",
  readinessGlow: "rgba(138,90,223,0.28)",
  readinessTextPrimary: "#ffffff",
  readinessTextSecondary: "#cdc6f2",
  readinessAccent: "#a480f5",
  readinessTileBg: "rgba(255,255,255,0.09)",
  readinessTileBorder: "rgba(255,255,255,0.14)",
  readinessCtaShadow: "rgba(102,66,185,0.5)",
};

// דגלים אמיתיים כ-SVG וקטורי (לא אמוג'י) — בכוונה: אמוג'י-דגלים לא מרונדרים
// כדגל בכל דפדפן/גופן (בעיה ידועה בחלק ממערכות Windows, ר' משוב-משתמש "דגל
// תאילנד ודגל ישראל במקום האותיות בלבד") — SVG מוצג זהה בכל מקום.
function ThailandFlag() {
  return (
    <svg width="26" height="18" viewBox="0 0 26 18" style={{ borderRadius: "3px", flexShrink: 0, display: "block" }}>
      <rect width="26" height="18" fill="#A51931" />
      <rect y="3" width="26" height="12" fill="#F4F5F8" />
      <rect y="6" width="26" height="6" fill="#2D2A4A" />
    </svg>
  );
}

function IsraelFlag() {
  return (
    <svg width="26" height="18" viewBox="0 0 26 18" style={{ borderRadius: "3px", flexShrink: 0, display: "block" }}>
      <rect width="26" height="18" fill="#FEFEFE" />
      <rect y="2.2" width="26" height="2.2" fill="#0038B8" />
      <rect y="13.6" width="26" height="2.2" fill="#0038B8" />
      <polygon points="13,6.2 15,9.7 11,9.7" fill="none" stroke="#0038B8" strokeWidth="0.9" />
      <polygon points="13,11.8 15,8.3 11,8.3" fill="none" stroke="#0038B8" strokeWidth="0.9" />
    </svg>
  );
}

// אייקון-פעמון מודרני מחדש (עגול-רך, לא משולש-קלאסי) לפי בקשה מפורשת
// "החלף את סמל הפעמון לסמל מודרני, ברור ואיכותי".
function BellIcon({ color }: { color: string }) {
  return (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth={2} strokeLinecap="round" strokeLinejoin="round">
      <path d="M12 3a5.5 5.5 0 0 0-5.5 5.5c0 4.5-1.8 6-2.3 6.8a.6.6 0 0 0 .5.9h14.6a.6.6 0 0 0 .5-.9c-.5-.8-2.3-2.3-2.3-6.8A5.5 5.5 0 0 0 12 3z" />
      <path d="M9.5 19a2.5 2.5 0 0 0 5 0" />
    </svg>
  );
}
function HamburgerIcon({ size = 20, color = "#fff" }: { size?: number; color?: string }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth={2.2} strokeLinecap="round" aria-hidden>
      <path d="M4 6h16M4 12h16M4 18h16" />
    </svg>
  );
}
function HouseNavIcon({ size = 21, color = "#fff" }: { size?: number; color?: string }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" aria-hidden>
      <path d="M3 11.5 12 4l9 7.5" />
      <path d="M5.5 10v9a1 1 0 0 0 1 1H9a1 1 0 0 0 1-1v-4a1 1 0 0 1 1-1h2a1 1 0 0 1 1 1v4a1 1 0 0 0 1 1h2.5a1 1 0 0 0 1-1v-9" />
    </svg>
  );
}
function SuitcaseNavIcon({ size = 21, color = "#fff" }: { size?: number; color?: string }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" aria-hidden>
      <rect x="3" y="7.5" width="18" height="12" rx="2" />
      <path d="M8.5 7.5V6a2 2 0 0 1 2-2h3a2 2 0 0 1 2 2v1.5" />
      <path d="M3 12.5h18" />
    </svg>
  );
}
function JournalNavIcon({ size = 21, color = "#fff" }: { size?: number; color?: string }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" aria-hidden>
      <rect x="4" y="4" width="16" height="16" rx="2.5" />
      <path d="M8 3v3M16 3v3M4 9h16" />
    </svg>
  );
}
function WalletNavIcon({ size = 21, color = "#fff" }: { size?: number; color?: string }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" aria-hidden>
      <rect x="3" y="6.5" width="18" height="12" rx="2.2" />
      <path d="M3 10h18" />
      <circle cx="16.5" cy="14" r="1.2" fill={color} stroke="none" />
    </svg>
  );
}
function MoreNavIcon({ size = 21, color = "#fff" }: { size?: number; color?: string }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill={color} aria-hidden>
      <circle cx="5" cy="12" r="2" />
      <circle cx="12" cy="12" r="2" />
      <circle cx="19" cy="12" r="2" />
    </svg>
  );
}
function CloseIcon({ size = 16, color = "#fff" }: { size?: number; color?: string }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth={2.2} strokeLinecap="round" aria-hidden>
      <path d="M6 6l12 12M18 6L6 18" />
    </svg>
  );
}
function BedNavIcon({ size = 22, color = "#fff" }: { size?: number; color?: string }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" aria-hidden>
      <path d="M3 18v-7a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2v7" />
      <path d="M3 18v2M21 18v2M3 13h18" />
      <circle cx="7" cy="10.5" r="1.3" />
    </svg>
  );
}
function CalendarNavIcon({ size = 22, color = "#fff" }: { size?: number; color?: string }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" aria-hidden>
      <rect x="4" y="5" width="16" height="15" rx="2" />
      <path d="M8 3v4M16 3v4M4 10h16" />
    </svg>
  );
}
function CarTransferIcon({ size = 22, color = "#fff" }: { size?: number; color?: string }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" aria-hidden>
      <path d="M4 16v-3.5l1.7-4.2A2 2 0 0 1 7.6 7h8.8a2 2 0 0 1 1.9 1.3L20 12.5V16" />
      <path d="M4 16h16M6 16v1.5M18 16v1.5" />
      <circle cx="7.5" cy="16" r="1.3" />
      <circle cx="16.5" cy="16" r="1.3" />
    </svg>
  );
}
function ShieldNavIcon({ size = 22, color = "#fff" }: { size?: number; color?: string }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" aria-hidden>
      <path d="M12 3l7 3v5c0 4.5-3 7.7-7 9-4-1.3-7-4.5-7-9V6z" />
      <path d="M9 12l2 2 4-4" />
    </svg>
  );
}
function ChevronIcon({ size = 14, color = "#fff", dir = "start" }: { size?: number; color?: string; dir?: "start" | "down" }) {
  const d = dir === "down" ? "M6 9l6 6 6-6" : "M15 5 8 12l7 7";
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth={2.2} strokeLinecap="round" strokeLinejoin="round" aria-hidden>
      <path d={d} />
    </svg>
  );
}

// אייקון-מטוס מפורט ואיכותי (לא אמוג'י, לא ריבוע צבעוני) — גוף+כנפיים+זנב עם
// קווי-מתאר פנימיים (חלונות/פס-גוף) לתחושת "כרטיס-טיסה דיגיטלי" אמיתי.
function DetailedPlaneIcon({ size = 34 }: { size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 48 48" fill="none" aria-hidden style={{ transform: "rotate(45deg)" }}>
      <path d="M24 3c-1.4 0-2.5 1.3-2.5 3v10.5L6 25v3.6l15.5-4.6v9L17 37l.4 3 6.6-2 6.6 2 .4-3-4.5-4v-9L42 28.6V25L26.5 16.5V6C26.5 4.3 25.4 3 24 3z" fill="#f3f5fb" stroke="#c7ccdb" strokeWidth="0.6" />
      <path d="M24 3c-1.4 0-2.5 1.3-2.5 3v10.5L6 25v3.6l15.5-4.6v9L17 37l.4 3 6.6-2v-32.7C24.3 3 24.1 3 24 3z" fill="#dfe3ef" opacity="0.6" />
      <circle cx="24" cy="13" r="1.7" fill="#9aa3bd" />
      <circle cx="24" cy="18.5" r="1.7" fill="#9aa3bd" />
    </svg>
  );
}
// אייקון-מעבורת מפורט (גוף-ספינה+תא-קברינה+ארובה+דגלון) — לא סירת-צעצוע פשוטה.
function DetailedFerryIcon({ size = 34 }: { size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 48 48" fill="none" aria-hidden>
      <path d="M6 30l3.5 10c.4 1.2 1.5 2 2.8 2h23.4c1.3 0 2.4-.8 2.8-2L42 30z" fill="#dfe6f2" stroke="#9aa8c4" strokeWidth="0.8" />
      <path d="M11 30V17a2 2 0 0 1 2-2h22a2 2 0 0 1 2 2v13z" fill="#f3f5fb" stroke="#9aa8c4" strokeWidth="0.8" />
      <rect x="16" y="20" width="5" height="5" rx="0.8" fill="#4f8fe0" />
      <rect x="24" y="20" width="5" height="5" rx="0.8" fill="#4f8fe0" />
      <rect x="21" y="8" width="4" height="8" rx="1" fill="#8a94ac" />
      <path d="M25 6l6 3-6 1z" fill="#e0524a" />
      <path d="M2 34c2 2 4 2 6 0s4-2 6 0 4 2 6 0 4-2 6 0 4 2 6 0 4-2 6 0" stroke="#4f8fe0" strokeWidth="1.4" fill="none" strokeLinecap="round" opacity="0.55" />
    </svg>
  );
}
// אייקון-רכב מפורט (גוף+חלונות+גלגלים+פנסים) — לא אימוג'י, לא עיגול צבעוני
// פשוט. צבע-הגוף פרמטרי כדי לשקף את צבע הרכב האמיתי בכרטיס-ההסעה.
function DetailedCarIcon({ size = 34, bodyColor = "#f3f5fb" }: { size?: number; bodyColor?: string }) {
  return (
    <svg width={size} height={size} viewBox="0 0 48 48" fill="none" aria-hidden>
      <path d="M6 30v-4l3-8c.6-1.5 2-2.5 3.6-2.5h18.8c1.6 0 3 1 3.6 2.5l3 8v4z" fill={bodyColor} stroke="#9aa8c4" strokeWidth="0.8" />
      <path d="M11.5 15.5h25l2.5 8h-30z" fill={bodyColor} stroke="#9aa8c4" strokeWidth="0.8" opacity="0.9" />
      <path d="M14 16.5l-1.8 6h6.4l1-6zM20.4 16.5l-0.6 6h8.4l-0.6-6zM29.6 16.5l1 6h6.4l-1.8-6z" fill="#8fb6e6" opacity="0.85" />
      <rect x="4" y="29" width="40" height="6" rx="2" fill={bodyColor} stroke="#9aa8c4" strokeWidth="0.8" />
      <circle cx="13" cy="35" r="3.4" fill="#2b2f3a" />
      <circle cx="13" cy="35" r="1.4" fill="#c7ccdb" />
      <circle cx="35" cy="35" r="3.4" fill="#2b2f3a" />
      <circle cx="35" cy="35" r="1.4" fill="#c7ccdb" />
      <rect x="5" y="24" width="3" height="2.4" rx="1" fill="#ffd25c" />
      <rect x="40" y="24" width="3" height="2.4" rx="1" fill="#e0524a" />
    </svg>
  );
}
// ברקוד-דמו דקורטיבי (לא סרוק אמיתי) — רוחב-פסים פסאודו-אקראי אך יציב
// (seed קבוע), רק לתחושה חזותית של כרטיס-אמיתי.
function DemoBarcode({ seed = "TM", height = 46 }: { seed?: string; height?: number }) {
  const bars = Array.from({ length: 34 }, (_, i) => {
    const n = seed.charCodeAt(i % seed.length) * (i + 7);
    return 1 + (n % 4);
  });
  return (
    <div style={{ display: "flex", alignItems: "stretch", gap: "1.5px", height }}>
      {bars.map((w, i) => (
        <div key={i} style={{ width: `${w}px`, background: "#1a1a1a", opacity: 0.88 }} />
      ))}
    </div>
  );
}

function PersonIcon({ color }: { color: string }) {
  return (
    <svg width="15" height="15" viewBox="0 0 24 24" fill={color}>
      <circle cx="12" cy="8" r="4" />
      <path d="M4 20c0-4.4 3.6-7 8-7s8 2.6 8 7v1H4v-1z" />
    </svg>
  );
}

// אייקון-מטוס ברור (לא "חץ") — צורת מטוס קלאסית ומוכרת (גוף+כנפיים+זנב),
// לא הדימוי המינימליסטי-מדי הקודם שנראה כמו חץ. צורה גנרית סטנדרטית.
function PlaneIcon({ color = "#fff", size = 22 }: { color?: string; size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill={color}>
      <path d="M21 16v-2l-8-5V3.5C13 2.67 12.33 2 11.5 2S10 2.67 10 3.5V9l-8 5v2l8-2.5V19l-2.5 1.5V22l4-1 4 1v-1.5L13 19v-5.5l8 2.5z" />
    </svg>
  );
}

// אייקון-AI מקורי: מטוס מלא (אותו path מוכח מ-PlaneIcon, בלי שינוי-קנה-מידה
// שעלול לעוות אותו) + ניצוץ-AI קטן בפינה — לא קו-מתאר, לא אמוג'י.
function AiPlaneIcon({ size = 28 }: { size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      <path d="M21 16v-2l-8-5V3.5C13 2.67 12.33 2 11.5 2S10 2.67 10 3.5V9l-8 5v2l8-2.5V19l-2.5 1.5V22l4-1 4 1v-1.5L13 19v-5.5l8 2.5z" fill="#ffffff" />
      <path d="M19.3 1.5 20 3.1l1.6.6-1.6.6-0.7 1.6-0.7-1.6-1.6-0.6 1.6-0.6z" fill="#ffffff" />
    </svg>
  );
}

function LogoMark() {
  return (
    <svg width="22" height="22" viewBox="0 0 24 24">
      <defs>
        <linearGradient id="preview-logo-grad" x1="0" y1="1" x2="1" y2="0">
          <stop offset="0%" stopColor="#4f7fe0" />
          <stop offset="100%" stopColor="#a855f7" />
        </linearGradient>
      </defs>
      <path d="M3 11 L21 3 L13 21 L11 13 Z" fill="url(#preview-logo-grad)" />
    </svg>
  );
}

// אייקוני שורת-המצב (רשת/wifi/סוללה) — SVG פשוט, לא אמוג'י (🔋/📡 מרונדרים
// צבעוניים/שגויים בפועל, ר' אותה בעיה שכבר תוקנה בדגלים).
function StatusBarIcons({ color }: { color: string }) {
  return (
    <div style={{ display: "flex", alignItems: "center", gap: "5px" }}>
      <svg width="16" height="11" viewBox="0 0 16 11" fill={color} aria-hidden>
        <rect x="0" y="7" width="3" height="4" rx="0.5" />
        <rect x="4.5" y="5" width="3" height="6" rx="0.5" />
        <rect x="9" y="3" width="3" height="8" rx="0.5" />
        <rect x="13" y="0" width="3" height="11" rx="0.5" />
      </svg>
      <svg width="14" height="11" viewBox="0 0 14 11" fill="none" stroke={color} strokeWidth={1.3} strokeLinecap="round" aria-hidden>
        <path d="M1 4.2a9 9 0 0 1 12 0" />
        <path d="M3.3 6.8a5.6 5.6 0 0 1 7.4 0" />
        <path d="M5.6 9.2a2.2 2.2 0 0 1 2.8 0" />
      </svg>
      <svg width="22" height="11" viewBox="0 0 22 11" fill="none" aria-hidden>
        <rect x="0.75" y="0.75" width="18.5" height="9.5" rx="2.25" stroke={color} strokeWidth={1.1} />
        <rect x="2.25" y="2.25" width="15.5" height="6.5" rx="1.1" fill={color} />
        <rect x="20" y="3.3" width="1.6" height="4.4" rx="0.8" fill={color} />
      </svg>
    </div>
  );
}

// ============================================================================
// ממתין לקובצי-אייקון אמיתיים מ-3dicons.co (בקשת משתמש מפורשת: "אל תנסה
// לצייר אייקונים נוספים בעצמך... אם אין לך אפשרות להוריד, אל תיצור תחליפים").
// אלה placeholder-ים נייטרליים בכוונה — לא עיצוב-תחליפי, רק שומרי-מקום
// שקופים/עדינים עד שיסופקו קובצי-התמונה האמיתיים (ר' הסבר בהודעה למשתמש).
// ============================================================================

function IconPlaceholder({ size = 22 }: { size?: number }) {
  return (
    <div
      style={{
        width: size,
        height: size,
        borderRadius: "30%",
        background: "rgba(255,255,255,0.08)",
        border: "1px dashed rgba(255,255,255,0.25)",
      }}
    />
  );
}


function AlertTileIcon({ size = 42, badge, tone, children }: { size?: number; badge: number; tone: "danger" | "warning"; children: React.ReactNode }) {
  const bg = tone === "danger" ? "linear-gradient(135deg, #ff8a6b, #e0524a)" : "linear-gradient(135deg, #ffcf5c, #f5a544)";
  return (
    <div style={{ position: "relative", width: size, height: size, flexShrink: 0 }}>
      <div style={{ width: size, height: size, borderRadius: "30%", background: bg, display: "flex", alignItems: "center", justifyContent: "center" }}>{children}</div>
      <NumberBadge value={badge} tone={tone} />
    </div>
  );
}
function HotelBedIcon({ size = 42, badge }: { size?: number; badge: number }) {
  return (
    <AlertTileIcon size={size} badge={badge} tone="danger">
      <BedNavIcon size={size * 0.52} color="#fff" />
    </AlertTileIcon>
  );
}

function CalendarPlanIcon({ size = 42, badge }: { size?: number; badge: number }) {
  return (
    <AlertTileIcon size={size} badge={badge} tone="warning">
      <CalendarNavIcon size={size * 0.52} color="#fff" />
    </AlertTileIcon>
  );
}
function TransferAlertIcon({ size = 42, badge }: { size?: number; badge: number }) {
  return (
    <AlertTileIcon size={size} badge={badge} tone="danger">
      <CarTransferIcon size={size * 0.52} color="#fff" />
    </AlertTileIcon>
  );
}
function InsuranceAlertIcon({ size = 42, badge }: { size?: number; badge: number }) {
  return (
    <AlertTileIcon size={size} badge={badge} tone="warning">
      <ShieldNavIcon size={size * 0.52} color="#fff" />
    </AlertTileIcon>
  );
}

function NumberBadge({ value, tone }: { value: number; tone: "danger" | "warning" }) {
  const gradient = tone === "danger" ? "linear-gradient(135deg, #ff8a6b, #e0524a)" : "linear-gradient(135deg, #ffcf5c, #f5a544)";
  const shadow = tone === "danger" ? "rgba(224,82,74,0.6)" : "rgba(245,165,68,0.55)";
  return (
    <span
      style={{
        position: "absolute",
        top: -4,
        insetInlineEnd: -4,
        minWidth: "18px",
        height: "18px",
        borderRadius: "999px",
        background: gradient,
        color: "#fff",
        fontSize: "11px",
        fontWeight: 800,
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        padding: "0 4px",
        boxShadow: `0 2px 6px ${shadow}`,
        border: "2px solid #1c2750",
      }}
    >
      {value}
    </span>
  );
}

function Card({ children, style }: { children: React.ReactNode; style?: React.CSSProperties }) {
  return (
    <div
      style={{
        background: COLOR.cardBg,
        border: `1px solid ${COLOR.cardBorder}`,
        borderRadius: "20px",
        padding: "13px",
        ...style,
      }}
    >
      {children}
    </div>
  );
}

// אריח-פעולה איכותי (לא שורת-טבלה טכנית): אייקון צבעוני, כותרת+תת-כותרת,
// ותג-CTA עם חץ קטן בקצה — כל האריח "נראה לחיץ" (cursor+hover-ready), עדיין
// visual-only בשלב הזה (בלי href אמיתי). המידע עצמו (2 לילות/1 יום) לא השתנה
// ולא הוסר — רק העיצוב, לפי בקשת המשתמש המפורשת.
function ActionTile({
  icon,
  title,
  subtitle,
  cta,
  onClick,
}: {
  icon: React.ReactNode;
  title: string;
  subtitle: string;
  cta: string;
  onClick: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      style={{
        display: "flex",
        alignItems: "center",
        gap: "10px",
        width: "100%",
        textAlign: "start",
        padding: "10px",
        borderRadius: "16px",
        background: COLOR.readinessTileBg,
        border: `1px solid ${COLOR.readinessTileBorder}`,
        cursor: "pointer",
      }}
    >
      {icon}
      <div style={{ flex: 1, minWidth: 0 }}>
        <div style={{ fontWeight: 800, fontSize: "13px", color: COLOR.readinessTextPrimary, marginBottom: "2px" }}>{title}</div>
        <div style={{ fontSize: "11px", color: COLOR.readinessTextSecondary, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{subtitle}</div>
      </div>
      <span
        style={{
          display: "flex",
          alignItems: "center",
          gap: "4px",
          flexShrink: 0,
          background: `linear-gradient(135deg, ${COLOR.readinessAccent}, ${COLOR.purpleDeep})`,
          borderRadius: "999px",
          padding: "6px 10px",
          fontSize: "11px",
          fontWeight: 700,
          color: COLOR.readinessTextPrimary,
          whiteSpace: "nowrap",
          boxShadow: `0 3px 10px ${COLOR.readinessCtaShadow}`,
        }}
      >
        {cta}
        <svg width="6" height="10" viewBox="0 0 6 10" fill="none" stroke="#fff" strokeWidth={1.8} strokeLinecap="round" strokeLinejoin="round" aria-hidden>
          <path d="M4.5 1 1 5l3.5 4" />
        </svg>
      </span>
    </button>
  );
}

function Ring({ percent, size = 56, color = COLOR.turquoise }: { percent: number; size?: number; color?: string }) {
  const strokeWidth = 6;
  const radius = (size - strokeWidth) / 2;
  const circumference = 2 * Math.PI * radius;
  const dash = (percent / 100) * circumference;
  return (
    <div style={{ position: "relative", width: size, height: size, flexShrink: 0 }}>
      <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`} style={{ transform: "rotate(-90deg)" }}>
        <circle cx={size / 2} cy={size / 2} r={radius} fill="none" stroke="rgba(255,255,255,0.08)" strokeWidth={strokeWidth} />
        <circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          fill="none"
          stroke={color}
          strokeWidth={strokeWidth}
          strokeDasharray={`${dash} ${circumference - dash}`}
          strokeLinecap="round"
        />
      </svg>
      <span style={{ position: "absolute", inset: 0, display: "flex", alignItems: "center", justifyContent: "center", fontSize: size * 0.24, fontWeight: 800, color: COLOR.textPrimary }}>
        {percent}%
      </span>
    </div>
  );
}

interface WalletGridCell {
  key: string;
  label: string;
  amountText: string;
  subLabel?: string;
  emphasize?: boolean;
}

/** כל המטבעות שבארנק (כולל יתרות-אפס — 4 מטבעות-הבסיס תמיד קיימים
 * ב-walletStore.balances, ר' defaultCurrencyPriority) + כל כרטיס-אשראי,
 * כל אחד "משבצת" משלו באותה מסגרת אחת — לפי בקשה מפורשת: "תחלק אותה לכל
 * סוגי המטבעות... לפחות 4 או 5, כי צריך תמיד שיהיה מטבע מקומי, שקל, דולר,
 * אירו, וכ.א". לא עוד טבעת-ענק אחת + שורה-גוללת נסתרת. */
function buildWalletGridCells(walletStore: ReturnType<typeof useWalletStore>): WalletGridCell[] {
  const localCode = walletStore.localCurrency.currencyCode;
  const cells: WalletGridCell[] = walletStore.balances.map((b) => ({
    key: `bal-${b.code}`,
    label: b.code,
    amountText: formatMoney(b.balance, b.code),
    subLabel: b.code === localCode ? "מקומי" : undefined,
    emphasize: b.code === localCode,
  }));
  for (const c of walletStore.cards) {
    const spent = walletStore.expenses.filter((e) => e.cardId === c.id).reduce((sum, e) => sum + (walletStore.convertAmount(e.amount, e.currency, c.currency) ?? 0), 0);
    const remaining = c.creditLimit != null ? Math.max(0, c.creditLimit - spent) : null;
    cells.push({
      key: `card-${c.id}`,
      label: c.nickname,
      amountText: formatMoney(remaining ?? spent, c.currency),
      subLabel: remaining != null ? "נותר במסגרת" : "הוצאתי בכרטיס",
    });
  }
  return cells;
}

function WalletCurrencyGrid({ walletStore }: { walletStore: ReturnType<typeof useWalletStore> }) {
  if (!walletStore.hydrated) return <div style={{ fontSize: "12px", color: COLOR.textMuted }}>טוען...</div>;
  const cells = buildWalletGridCells(walletStore);
  return (
    <div style={{ display: "grid", gridTemplateColumns: "repeat(2, 1fr)", gap: "8px" }}>
      {cells.map((cell) => (
        <div
          key={cell.key}
          style={{
            padding: "10px",
            borderRadius: "12px",
            background: cell.emphasize ? "rgba(67,214,170,0.12)" : "rgba(255,255,255,0.04)",
            border: `1px solid ${cell.emphasize ? `${COLOR.turquoise}55` : COLOR.cardBorder}`,
          }}
        >
          <div
            style={{
              fontSize: "10.5px",
              fontWeight: cell.emphasize ? 700 : 600,
              color: cell.emphasize ? COLOR.turquoise : COLOR.textMuted,
              marginBottom: "3px",
              overflow: "hidden",
              textOverflow: "ellipsis",
              whiteSpace: "nowrap",
            }}
          >
            {cell.label}
            {cell.subLabel ? ` · ${cell.subLabel}` : ""}
          </div>
          <div style={{ fontSize: "15px", fontWeight: 800, color: COLOR.textPrimary, fontVariantNumeric: "tabular-nums" }}>{cell.amountText}</div>
        </div>
      ))}
    </div>
  );
}

const NAV_HEIGHT = 64;

const CURRENCY_RATES_TO_THB: Record<"usd" | "eur" | "ils", number> = { usd: 36.2, eur: 39.4, ils: 9.8 };
const CURRENCY_LABEL: Record<"usd" | "eur" | "ils", string> = { usd: "דולר אמריקאי", eur: "אירו", ils: "שקל חדש" };
const CURRENCY_SYMBOL: Record<string, string> = { usd: "$", eur: "€", ils: "₪", thb: "฿", gbp: "£" };
const ALL_CURRENCIES = ["usd", "eur", "ils", "thb", "gbp"] as const;
type CurrencyCode = (typeof ALL_CURRENCIES)[number];
// שערי-דמו גסים מול דולר (בסיס משותף לחישוב חופשי בין כל זוג) — לא מקור אמיתי.
const CURRENCY_TO_USD: Record<CurrencyCode, number> = { usd: 1, eur: 1.08, ils: 0.27, thb: 0.0276, gbp: 1.26 };

interface Notification {
  id: string;
  title: string;
  body: string;
  time: string;
  read: boolean;
}
const INITIAL_NOTIFICATIONS: Notification[] = [
  { id: "n1", title: "אישור הזמנת מלון", body: "המלון בבנגקוק אישר את ההזמנה שלך", time: "לפני שעה", read: false },
  { id: "n2", title: "תזכורת הסעה", body: "ההסעה לשדה התעופה תגיע מחר ב-09:00", time: "לפני 3 שעות", read: false },
  { id: "n3", title: "עדכון מזג אוויר", body: "צפוי גשם קל בבנגקוק ביום חמישי", time: "אתמול", read: true },
];

type TimerKind = "pickup" | "hotel_leave" | "boarding" | "ferry";
interface FlightDetails {
  airline: string;
  flightNumber: string;
  originCode: string;
  originCity: string;
  destCode: string;
  destCity: string;
  departTime: string;
  arriveTime: string;
  gate: string;
  terminal: string;
  seat: string;
  status: string;
}
interface FerryDetails {
  company: string;
  departurePort: string;
  arrivalPort: string;
  departTime: string;
  durationMinutes: number;
  pier: string;
  bookingStatus: string;
  confirmationCode: string;
}
interface RideDetails {
  driverName: string;
  vehicleType: string;
  vehicleColor: string;
  plate: string;
  pickupPoint: string;
}
interface HomeTimerEvent {
  id: string;
  kind: TimerKind;
  label: string;
  location: string;
  offsetMinutes: number;
  flight?: FlightDetails;
  ferry?: FerryDetails;
  ride?: RideDetails;
}
// לפי בקשה מפורשת: אין יותר "אירוע קרוב" מומצא (הסעה/טיסה/מעבורת/מלון
// בדויים) שמוצג לכל משתמש בלי קשר לטיול האמיתי שלו. הכרטיס הזה מוצג רק
// כשיש אירוע אמיתי לקראתו — כרגע עוד אין מקור-נתונים אמיתי לכך (טיסות/
// הסעות/מעבורות אינן חלק ממודל-הטיול הקיים), אז הרשימה ריקה והכרטיס
// נעלם, ולא ממציא תוכן.
const HOME_TIMER_EVENTS: HomeTimerEvent[] = [];

function formatMinutesLabel(m: number) {
  const v = Math.max(0, Math.round(m));
  if (v < 60) return `${v} דקות`;
  const h = Math.floor(v / 60);
  const mm = v % 60;
  return mm > 0 ? `${h} שעות ו-${mm} דקות` : `${h} שעות`;
}
function timerTone(minutesLeft: number): { bg: string; fg: string; label: string } {
  if (minutesLeft <= 0) return { bg: "rgba(255,255,255,0.06)", fg: COLOR.textSecondary, label: "הסתיים" };
  if (minutesLeft < 5) return { bg: "rgba(239,111,97,0.18)", fg: COLOR.danger, label: "דחוף מאוד" };
  if (minutesLeft < 15) return { bg: "rgba(245,165,68,0.18)", fg: COLOR.warning, label: "בקרוב מאוד" };
  if (minutesLeft < 60) return { bg: "rgba(138,90,223,0.18)", fg: COLOR.purple, label: "בקרוב" };
  return { bg: "rgba(67,214,170,0.14)", fg: COLOR.turquoise, label: "רגוע" };
}

// גיליון-תחתון גנרי (backdrop + פאנל נשלף מלמטה) — לשימוש חוזר בכל
// החלוניות החדשות במסך-הבית (התראות/מזג-אוויר/אירוע-קרוב).
function BottomSheetPanel({ children, onClose, title }: { children: React.ReactNode; onClose: () => void; title: string }) {
  return (
    <>
      <div onClick={onClose} style={{ position: "fixed", inset: 0, background: "rgba(2,6,16,0.6)", zIndex: 45 }} />
      <div
        style={{
          position: "fixed",
          insetInlineStart: 0,
          insetInlineEnd: 0,
          bottom: 0,
          zIndex: 46,
          maxWidth: "480px",
          marginInline: "auto",
          background: "#0c1526",
          border: `1px solid ${COLOR.cardBorder}`,
          borderBottom: "none",
          borderRadius: "24px 24px 0 0",
          boxShadow: "0 -20px 60px rgba(0,0,0,0.5)",
          maxHeight: "80vh",
          overflowY: "auto",
          padding: "16px 16px calc(16px + env(safe-area-inset-bottom))",
        }}
      >
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: "14px" }}>
          <span style={{ fontWeight: 800, fontSize: "15px" }}>{title}</span>
          <button type="button" onClick={onClose} aria-label="סגירה" style={{ width: "28px", height: "28px", borderRadius: "50%", background: "rgba(255,255,255,0.08)", border: "none", color: "#fff", cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center" }}>
            <CloseIcon size={13} />
          </button>
        </div>
        {children}
      </div>
    </>
  );
}

// כרטיס-טיסה דיגיטלי איכותי — מחליף את הכרטיס הגנרי כאשר האירוע-הקרוב הוא
// עלייה-למטוס (בעקבות דיווח מפורש: "עיצוב העלייה למטוס אינו מאושר").
function FlightBoardingCard({ event, demoClock, onOpenDetail }: { event: HomeTimerEvent; demoClock: number; onOpenDetail: () => void }) {
  const [expanded, setExpanded] = useState(false);
  if (!event.flight) return null;
  const f = event.flight;
  const minutesLeft = event.offsetMinutes - demoClock;
  const tone = timerTone(minutesLeft);
  return (
    <Card style={{ padding: 0, overflow: "hidden", border: `1px solid ${tone.fg}55`, background: "#0c1526" }}>
      <div style={{ padding: "14px 16px 12px" }}>
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: "12px" }}>
          <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
            <DetailedPlaneIcon size={26} />
            <div>
              <div style={{ fontSize: "13px", fontWeight: 800, color: "#fff" }}>{f.airline}</div>
              <div style={{ fontSize: "11px", color: COLOR.textSecondary }}>{f.flightNumber}</div>
            </div>
          </div>
          <span style={{ fontSize: "10.5px", fontWeight: 800, color: tone.fg, background: "rgba(0,0,0,0.3)", padding: "3px 9px", borderRadius: "999px" }}>{f.status}</span>
        </div>

        {/* מסלול-טיסה: קוד-שדה+עיר+שעה משני הצדדים, קו-מסלול דק+מטוס-קטן במרכז */}
        <div style={{ display: "flex", alignItems: "center", gap: "8px", marginBottom: "12px" }}>
          <div style={{ textAlign: "center" }}>
            <div style={{ fontSize: "20px", fontWeight: 800, color: "#fff" }}>{f.originCode}</div>
            <div style={{ fontSize: "10px", color: COLOR.textMuted }}>{f.originCity}</div>
            <div style={{ fontSize: "11px", color: COLOR.textSecondary, marginTop: "2px" }}>{f.departTime}</div>
          </div>
          <div style={{ flex: 1, position: "relative", height: "14px", display: "flex", alignItems: "center" }}>
            <div style={{ position: "absolute", insetInlineStart: 0, insetInlineEnd: 0, borderTop: `1.5px dashed ${COLOR.cardBorder}` }} />
            <span style={{ position: "absolute", left: "50%", top: "50%", transform: "translate(-50%,-50%) rotate(90deg)", background: "#0c1526", padding: "0 2px" }}>
              <DetailedPlaneIcon size={16} />
            </span>
          </div>
          <div style={{ textAlign: "center" }}>
            <div style={{ fontSize: "20px", fontWeight: 800, color: "#fff" }}>{f.destCode}</div>
            <div style={{ fontSize: "10px", color: COLOR.textMuted }}>{f.destCity}</div>
            <div style={{ fontSize: "11px", color: COLOR.textSecondary, marginTop: "2px" }}>{f.arriveTime}</div>
          </div>
        </div>

        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: "6px", marginBottom: "12px" }}>
          {[
            { label: "שער", value: f.gate },
            { label: "טרמינל", value: f.terminal },
            { label: "מושב", value: f.seat },
          ].map((row) => (
            <div key={row.label} style={{ background: "#0e1930", border: `1px solid ${COLOR.cardBorder}`, borderRadius: "10px", padding: "8px", textAlign: "center" }}>
              <div style={{ fontSize: "9.5px", color: COLOR.textMuted }}>{row.label}</div>
              <div style={{ fontSize: "14px", fontWeight: 800, color: "#fff", marginTop: "1px" }}>{row.value}</div>
            </div>
          ))}
        </div>

        <div style={{ fontSize: "11px", color: COLOR.textSecondary, marginBottom: "2px" }}>זמן שנותר לפתיחת העלייה למטוס</div>
        <div style={{ fontSize: "19px", fontWeight: 800, color: tone.fg }}>{minutesLeft <= 0 ? "העלייה החלה" : `בעוד ${formatMinutesLabel(minutesLeft)}`}</div>
      </div>

      {/* קו-תלישה מחורר — הפרדה ברורה בין פרטי-הטיסה לפעולות, כמו כרטיס אמיתי */}
      <div style={{ position: "relative", height: "1px", background: "transparent" }}>
        <div style={{ position: "absolute", insetInlineStart: -8, top: -9, width: "16px", height: "16px", borderRadius: "50%", background: COLOR.pageBg }} />
        <div style={{ position: "absolute", insetInlineEnd: -8, top: -9, width: "16px", height: "16px", borderRadius: "50%", background: COLOR.pageBg }} />
        <div style={{ borderTop: `1.5px dashed ${COLOR.cardBorder}` }} />
      </div>

      <div style={{ padding: "12px 16px 14px" }}>
        {expanded ? (
          <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: "8px", marginBottom: "12px", padding: "12px", background: "#fff", borderRadius: "12px" }}>
            <DemoBarcode seed={f.flightNumber} />
            <div style={{ fontSize: "10.5px", color: "#333", fontWeight: 700, letterSpacing: "0.05em" }}>{f.flightNumber.replace(/\s/g, "")}-{f.seat}</div>
            <div style={{ fontSize: "9px", color: "#888" }}>קוד חזותי להדגמה בלבד — אינו כרטיס אמיתי</div>
          </div>
        ) : null}
        <div style={{ display: "flex", gap: "8px" }}>
          <button
            type="button"
            onClick={() => setExpanded((v) => !v)}
            style={{ flex: 1, padding: "11px", borderRadius: "12px", background: "rgba(255,255,255,0.08)", border: `1px solid ${COLOR.cardBorder}`, color: "#fff", fontSize: "12.5px", fontWeight: 700, cursor: "pointer" }}
          >
            {expanded ? "הסתרת הכרטיס" : "הצגת כרטיס העלייה למטוס"}
          </button>
          <a
            href={`https://www.openstreetmap.org/search?query=${encodeURIComponent(event.location)}`}
            target="_blank"
            rel="noopener noreferrer"
            onClick={onOpenDetail}
            style={{ flex: 1, display: "flex", alignItems: "center", justifyContent: "center", padding: "11px", borderRadius: "12px", background: "rgba(138,90,223,0.2)", border: `1px solid ${COLOR.purple}55`, color: "#c9b3ff", fontSize: "12.5px", fontWeight: 700, textDecoration: "none", textAlign: "center" }}
          >
            ניווט לשדה התעופה
          </a>
        </div>
      </div>
    </Card>
  );
}

// כרטיס-מעבורת איכותי — מחליף את הכרטיס הגנרי כאשר האירוע-הקרוב הוא מעבורת
// (בעקבות דיווח מפורש: "עיצוב המעבורת אינו מאושר").
function FerryCard({ event, demoClock, onOpenDetail }: { event: HomeTimerEvent; demoClock: number; onOpenDetail: () => void }) {
  const [expanded, setExpanded] = useState(false);
  if (!event.ferry) return null;
  const f = event.ferry;
  const minutesLeft = event.offsetMinutes - demoClock;
  const tone = timerTone(minutesLeft);
  return (
    <Card style={{ padding: 0, overflow: "hidden", border: `1px solid ${tone.fg}55`, background: "linear-gradient(180deg, #0c1526 70%, #0a1f30 100%)", position: "relative" }}>
      {/* תחושת-מים עדינה: גלים דקורטיביים בתחתית הכרטיס, מתחת לטקסט (z-index נמוך, שקיפות נמוכה) */}
      <svg aria-hidden style={{ position: "absolute", insetInlineStart: 0, insetInlineEnd: 0, bottom: 0, width: "100%", height: "40px", opacity: 0.18, pointerEvents: "none" }} viewBox="0 0 400 40" preserveAspectRatio="none">
        <path d="M0 20c25-12 50-12 75 0s50 12 75 0 50-12 75 0 50 12 75 0 50-12 75 0 50 12 75 0v20H0z" fill="#4f8fe0" />
      </svg>
      <div style={{ padding: "14px 16px 12px", position: "relative" }}>
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: "12px" }}>
          <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
            <DetailedFerryIcon size={28} />
            <div>
              <div style={{ fontSize: "13px", fontWeight: 800, color: "#fff" }}>{f.company}</div>
              <div style={{ fontSize: "11px", color: COLOR.textSecondary }}>אישור #{f.confirmationCode}</div>
            </div>
          </div>
          <span style={{ fontSize: "10.5px", fontWeight: 800, color: tone.fg, background: "rgba(0,0,0,0.3)", padding: "3px 9px", borderRadius: "999px" }}>{f.bookingStatus}</span>
        </div>

        <div style={{ display: "flex", alignItems: "center", gap: "8px", marginBottom: "12px" }}>
          <div style={{ textAlign: "center", flex: 1, minWidth: 0 }}>
            <div style={{ fontSize: "13px", fontWeight: 800, color: "#fff", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{f.departurePort}</div>
            <div style={{ fontSize: "11px", color: COLOR.textSecondary, marginTop: "2px" }}>{f.departTime}</div>
          </div>
          <div style={{ flex: 1, position: "relative", height: "14px", display: "flex", alignItems: "center", flexShrink: 0, maxWidth: "70px" }}>
            <div style={{ position: "absolute", insetInlineStart: 0, insetInlineEnd: 0, borderTop: `1.5px dashed rgba(79,143,224,0.6)` }} />
            <span style={{ position: "absolute", left: "50%", top: "50%", transform: "translate(-50%,-50%)", background: "#0c1526", padding: "0 2px" }}>
              <DetailedFerryIcon size={18} />
            </span>
          </div>
          <div style={{ textAlign: "center", flex: 1, minWidth: 0 }}>
            <div style={{ fontSize: "13px", fontWeight: 800, color: "#fff", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{f.arrivalPort}</div>
            <div style={{ fontSize: "11px", color: COLOR.textSecondary, marginTop: "2px" }}>משך: {f.durationMinutes} דק'</div>
          </div>
        </div>

        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: "6px", marginBottom: "12px" }}>
          {[
            { label: "רציף", value: f.pier },
            { label: "משך הפלגה", value: `${f.durationMinutes} דק'` },
            { label: "מס' אישור", value: f.confirmationCode.split("-")[1] ?? f.confirmationCode },
          ].map((row) => (
            <div key={row.label} style={{ background: "rgba(14,25,48,0.75)", border: `1px solid ${COLOR.cardBorder}`, borderRadius: "10px", padding: "8px", textAlign: "center" }}>
              <div style={{ fontSize: "9.5px", color: COLOR.textMuted }}>{row.label}</div>
              <div style={{ fontSize: "13px", fontWeight: 800, color: "#fff", marginTop: "1px" }}>{row.value}</div>
            </div>
          ))}
        </div>

        <div style={{ fontSize: "11px", color: COLOR.textSecondary, marginBottom: "2px" }}>זמן שנותר להגעה לנמל</div>
        <div style={{ fontSize: "19px", fontWeight: 800, color: tone.fg }}>{minutesLeft <= 0 ? "המעבורת יוצאת" : `בעוד ${formatMinutesLabel(minutesLeft)}`}</div>
      </div>

      <div style={{ position: "relative", height: "1px" }}>
        <div style={{ position: "absolute", insetInlineStart: -8, top: -9, width: "16px", height: "16px", borderRadius: "50%", background: COLOR.pageBg }} />
        <div style={{ position: "absolute", insetInlineEnd: -8, top: -9, width: "16px", height: "16px", borderRadius: "50%", background: COLOR.pageBg }} />
        <div style={{ borderTop: `1.5px dashed ${COLOR.cardBorder}` }} />
      </div>

      <div style={{ padding: "12px 16px 14px", position: "relative" }}>
        {expanded ? (
          <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: "8px", marginBottom: "12px", padding: "12px", background: "#fff", borderRadius: "12px" }}>
            <DemoBarcode seed={f.confirmationCode} />
            <div style={{ fontSize: "10.5px", color: "#333", fontWeight: 700, letterSpacing: "0.05em" }}>{f.confirmationCode}</div>
            <div style={{ fontSize: "9px", color: "#888" }}>קוד חזותי להדגמה בלבד — אינו כרטיס אמיתי</div>
          </div>
        ) : null}
        <div style={{ display: "flex", gap: "8px" }}>
          <button
            type="button"
            onClick={() => setExpanded((v) => !v)}
            style={{ flex: 1, padding: "11px", borderRadius: "12px", background: "rgba(255,255,255,0.08)", border: `1px solid ${COLOR.cardBorder}`, color: "#fff", fontSize: "12.5px", fontWeight: 700, cursor: "pointer" }}
          >
            {expanded ? "הסתרת הכרטיס" : "הצגת הכרטיס"}
          </button>
          <a
            href={`https://www.openstreetmap.org/search?query=${encodeURIComponent(f.departurePort)}`}
            target="_blank"
            rel="noopener noreferrer"
            onClick={onOpenDetail}
            style={{ flex: 1, display: "flex", alignItems: "center", justifyContent: "center", padding: "11px", borderRadius: "12px", background: "rgba(79,143,224,0.2)", border: "1px solid rgba(79,143,224,0.5)", color: "#a9cdf5", fontSize: "12.5px", fontWeight: 700, textDecoration: "none", textAlign: "center" }}
          >
            ניווט לנמל
          </a>
        </div>
      </div>
    </Card>
  );
}

type RideStatus = "בדרך" | "מתקרב" | "הגיע" | "מתעכב" | "בוטל";
const RIDE_STATUS_COLOR: Record<RideStatus, string> = {
  בדרך: COLOR.turquoise,
  מתקרב: COLOR.purple,
  הגיע: COLOR.success,
  מתעכב: COLOR.warning,
  בוטל: COLOR.danger,
};
// כרטיס-שירות-נסיעה קומפקטי (לא "אזהרת-מערכת") — מחליף את הכרטיס הגנרי
// כשהאירוע-הקרוב הוא הסעה, בעקבות דיווח מפורש: "העיצוב... נראה כמו אזהרת
// מערכת". הסטטוס נגזר אוטומטית מהזמן שנותר (שעון-דמו) — "מתעכב"/"בוטל"
// יתאפשרו כשמקור-נתונים אמיתי (שירות-שילוח) יחובר; כרגע ההדגמה עוברת באמת
// בין "בדרך" ל"הגיע" (לא מדומה בכפתור-דמו נפרד).
function RideStatusCard({ event, demoClock, showToast }: { event: HomeTimerEvent; demoClock: number; showToast: (message: string) => void }) {
  const [expanded, setExpanded] = useState(false);
  if (!event.ride) return null;
  const r = event.ride;
  const minutesLeft = event.offsetMinutes - demoClock;
  const status: RideStatus = minutesLeft > 5 ? "בדרך" : minutesLeft > 0 ? "מתקרב" : "הגיע";
  const color = RIDE_STATUS_COLOR[status];
  const waitingMinutes = status === "הגיע" ? Math.abs(minutesLeft) : 0;

  return (
    <Card style={{ padding: 0, overflow: "hidden", border: `1px solid ${color}55`, background: "#0c1526" }}>
      <button type="button" onClick={() => setExpanded((v) => !v)} aria-expanded={expanded} style={{ width: "100%", display: "flex", alignItems: "center", gap: "10px", padding: "12px 14px", background: "none", border: "none", cursor: "pointer", textAlign: "right" }}>
        <span style={{ width: "40px", height: "40px", borderRadius: "12px", background: "rgba(255,255,255,0.06)", border: `1px solid ${color}55`, display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
          <DetailedCarIcon size={26} bodyColor="#f3f5fb" />
        </span>
        <div style={{ flex: 1, minWidth: 0, textAlign: "right" }}>
          <div style={{ display: "flex", alignItems: "center", gap: "6px" }}>
            <span style={{ width: "7px", height: "7px", borderRadius: "50%", background: color, flexShrink: 0 }} />
            <span style={{ fontSize: "13.5px", fontWeight: 800, color: "#fff" }}>{status === "הגיע" ? "הנהג הגיע" : status === "מתקרב" ? "הנהג מתקרב" : "הנהג בדרך"}</span>
          </div>
          <div style={{ fontSize: "11.5px", color, fontWeight: 700, marginTop: "1px" }}>
            {status === "הגיע" ? `ממתין כ-${formatMinutesLabel(waitingMinutes)}` : `זמן הגעה משוער: ${formatMinutesLabel(minutesLeft)}`}
          </div>
        </div>
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#fff" strokeWidth={2.2} strokeLinecap="round" style={{ transform: expanded ? "rotate(180deg)" : "none", transition: "transform 0.2s", flexShrink: 0 }}>
          <path d="M6 9l6 6 6-6" />
        </svg>
      </button>

      {expanded ? (
        <div style={{ padding: "0 14px 14px" }}>
          <div style={{ display: "flex", flexDirection: "column", gap: "4px", fontSize: "12.5px", color: "#e4e8f2", marginBottom: "12px", paddingTop: "10px", borderTop: `1px solid ${COLOR.cardBorder}` }}>
            <div>
              {r.driverName} · {r.vehicleType} {r.vehicleColor} · {r.plate}
            </div>
            <div>נקודת איסוף: {status === "הגיע" ? r.pickupPoint : event.location}</div>
          </div>
          <div style={{ display: "flex", gap: "6px", flexWrap: "wrap" }}>
            {status === "הגיע" ? (
              <button type="button" onClick={() => showToast(`הודעה נשלחה ל${r.driverName}: "אני בדרך" (הדגמה בלבד)`)} style={{ display: "flex", alignItems: "center", justifyContent: "center", height: "32px", padding: "0 12px", borderRadius: "999px", fontSize: "11px", fontWeight: 700, cursor: "pointer", whiteSpace: "nowrap", background: "rgba(67,214,170,0.2)", border: `1px solid ${COLOR.success}55`, color: COLOR.success }}>
                אני בדרך
              </button>
            ) : null}
            <button type="button" onClick={() => showToast(`מתקשר ל${r.driverName}... (הדגמה בלבד, אין מספר טלפון אמיתי)`)} style={{ display: "flex", alignItems: "center", justifyContent: "center", height: "32px", padding: "0 12px", borderRadius: "999px", fontSize: "11px", fontWeight: 700, cursor: "pointer", whiteSpace: "nowrap", background: "rgba(255,255,255,0.1)", border: `1px solid ${COLOR.cardBorder}`, color: "#fff" }}>
              התקשרות לנהג
            </button>
            {status === "הגיע" ? (
              <button type="button" onClick={() => showToast(`${r.vehicleType} ${r.vehicleColor} · ${r.plate} — ${r.pickupPoint}`)} style={{ display: "flex", alignItems: "center", justifyContent: "center", height: "32px", padding: "0 12px", borderRadius: "999px", fontSize: "11px", fontWeight: 700, cursor: "pointer", whiteSpace: "nowrap", background: "rgba(255,255,255,0.1)", border: `1px solid ${COLOR.cardBorder}`, color: "#fff" }}>
                מצא את הרכב
              </button>
            ) : (
              <>
                <button type="button" onClick={() => showToast(`הודעה נשלחה ל${r.driverName} (הדגמה בלבד)`)} style={{ display: "flex", alignItems: "center", justifyContent: "center", height: "32px", padding: "0 12px", borderRadius: "999px", fontSize: "11px", fontWeight: 700, cursor: "pointer", whiteSpace: "nowrap", background: "rgba(255,255,255,0.1)", border: `1px solid ${COLOR.cardBorder}`, color: "#fff" }}>
                  שליחת הודעה
                </button>
                <a
                  href={`https://www.openstreetmap.org/search?query=${encodeURIComponent(event.location)}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  style={{ display: "flex", alignItems: "center", justifyContent: "center", height: "32px", padding: "0 12px", borderRadius: "999px", fontSize: "11px", fontWeight: 700, cursor: "pointer", whiteSpace: "nowrap", background: "rgba(138,90,223,0.2)", border: `1px solid ${COLOR.purple}55`, color: "#c9b3ff", textDecoration: "none" }}
                >
                  ניווט לנקודת האיסוף
                </a>
              </>
            )}
          </div>
        </div>
      ) : null}
    </Card>
  );
}

interface ReadinessItem {
  key: string;
  icon: React.ReactNode;
  title: string;
  subtitle: string;
  cta: string;
  onClick: () => void;
}

export function MobileHomeMock() {
  const router = useRouter();
  const currentUser = useCurrentUser();
  const walletStore = useWalletStore();
  // נטען בתוך useEffect (לא ישירות ב-render) כי activeTrip()/tripProgress
  // קוראים מ-localStorage — אותו דפוס-בטיחות-הידרציה כמו useWalletStore.
  // מחושב מהטיול הפעיל האמיתי (כולל עריכות שנשמרו), לא מקבועים.
  const [tripProgress, setTripProgress] = useState<{ dayIndex: number; totalDays: number; daysRemaining: number; percent: number } | null>(null);
  const [activeTripInfo, setActiveTripInfo] = useState<DemoTrip | null>(null);
  const [tripChecked, setTripChecked] = useState(false);
  useEffect(() => {
    const trip = activeTrip();
    if (trip) {
      setTripProgress(computeTripProgressFor(trip));
      setActiveTripInfo(trip);
    } else {
      setTripProgress(null);
      setActiveTripInfo(null);
    }
    setTripChecked(true);
  }, []);

  // "כמעט מוכנים לטיול" — לפני התיקון הזה כל הכרטיס היה מזויף לגמרי (מספרים
  // קבועים בקוד, לא מחוברים לשום נתון אמיתי, ושני מתוך ארבעת האריחים לא
  // הובילו לשום מקום אמיתי). עכשיו מחושב מנתונים אמיתיים של הטיול הפעיל,
  // ומציג רק את מה שבאמת חסר (אריח שהושלם בפועל פשוט לא מופיע יותר).
  const [readinessItems, setReadinessItems] = useState<ReadinessItem[]>([]);
  useEffect(() => {
    if (!activeTripInfo) {
      setReadinessItems([]);
      return;
    }
    const trip = activeTripInfo;
    const items: ReadinessItem[] = [];

    const hotelBookings = loadBookings().filter((b) => b.category === "hotel" && b.status !== "cancelled");
    let hotelNightsCovered = 0;
    for (const b of hotelBookings) {
      if (!b.checkOut) continue;
      const nights = Math.round((new Date(b.checkOut).getTime() - new Date(b.checkIn).getTime()) / 86400000);
      if (nights > 0) hotelNightsCovered += nights;
    }
    const missingHotelNights = Math.max(0, trip.nights - hotelNightsCovered);
    if (missingHotelNights > 0) {
      items.push({
        key: "hotel",
        icon: <HotelBedIcon size={42} badge={missingHotelNights} />,
        title: missingHotelNights === 1 ? "נותר לילה אחד ללא מלון" : `נותרו ${missingHotelNights} לילות ללא מלון`,
        subtitle: "השלימו את מקומות הלינה החסרים",
        cta: "להוספת הזמנה",
        onClick: () => router.push("/bookings/new"),
      });
    }

    const emptyDays = countDatesWithoutActivity(trip.id, trip.startDate, trip.endDate);
    if (emptyDays > 0) {
      const firstEmptyDay = firstDateWithoutActivity(trip.id, trip.startDate, trip.endDate);
      items.push({
        key: "plan",
        icon: <CalendarPlanIcon size={42} badge={emptyDays} />,
        title: emptyDays === 1 ? "נותר יום אחד ללא תוכנית" : `נותרו ${emptyDays} ימים ללא תוכנית`,
        subtitle: "הוסיפו פעילויות לימים הפנויים",
        cta: "לתכנון היום",
        onClick: () => router.push(`/trips/${trip.id}/plan${firstEmptyDay ? `?day=${firstEmptyDay}` : ""}`),
      });
    }

    const stops = loadStops(trip.id);
    const missingTransport = stops.slice(0, -1).filter((s) => !s.transportToNext.trim()).length;
    if (stops.length > 1 && missingTransport > 0) {
      items.push({
        key: "transport",
        icon: <TransferAlertIcon size={42} badge={missingTransport} />,
        title: missingTransport === 1 ? "מעבר אחד בין יעדים ללא תחבורה" : `${missingTransport} מעברים בין יעדים ללא תחבורה`,
        subtitle: "הוסיפו איך אתם עוברים בין התחנות",
        cta: "לעריכת המסלול",
        onClick: () => router.push("/route"),
      });
    }

    const documents = loadJSON<DocumentEntry[]>(SK.documents, []);
    if (!documents.some((d) => d.kind === "insurance")) {
      items.push({
        key: "insurance",
        icon: <InsuranceAlertIcon size={42} badge={1} />,
        title: "חסר מסמך ביטוח",
        subtitle: "העלו את פוליסת הביטוח לפני הטיסה",
        cta: "להעלאת מסמך",
        onClick: () => router.push("/documents"),
      });
    }

    setReadinessItems(items);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [activeTripInfo]);

  // "המסלול שלי" — היה מלבן גדול לתצוגת יום-בטיול בלבד. מחולק עכשיו ל-4
  // משבצות: יום-בטיול (כמו קודם) + 3 תוספות אמיתיות (עיר נוכחית / הפעילות
  // הבאה היום / המעבר הבא במסלול), כל אחת מנתונים אמיתיים של הטיול הפעיל.
  const [routeStatus, setRouteStatus] = useState<{ currentCity: string; todayActivity: TripActivity | null; nextTransitionLabel: string } | null>(null);
  useEffect(() => {
    if (!activeTripInfo) {
      setRouteStatus(null);
      return;
    }
    const trip = activeTripInfo;
    const todayStr = today();
    const currentCity = cityForDate(trip.id, todayStr) || trip.name;

    const todaysActivities = activitiesForDate(trip.id, todayStr);
    const nowHHMM = new Date().toTimeString().slice(0, 5);
    const upcoming = todaysActivities.filter((a) => a.time >= nowHHMM);
    const todayActivity = upcoming[0] ?? todaysActivities[todaysActivities.length - 1] ?? null;

    const sortedStops = [...loadStops(trip.id)].sort((a, b) => a.startDate.localeCompare(b.startDate));
    const currentIdx = sortedStops.findIndex((s) => todayStr >= s.startDate && todayStr <= s.endDate);
    let nextTransitionLabel: string;
    if (sortedStops.length === 0) {
      nextTransitionLabel = "עוד לא הוגדרו תחנות במסלול";
    } else if (currentIdx === -1) {
      nextTransitionLabel = "בדקו את לוח-הזמנים של המסלול";
    } else {
      const next = sortedStops[currentIdx + 1];
      if (!next) {
        nextTransitionLabel = "זהו היעד האחרון בטיול";
      } else {
        const daysUntil = Math.round((new Date(next.startDate).getTime() - new Date(todayStr).getTime()) / 86400000);
        nextTransitionLabel = daysUntil <= 0 ? `עוברים ל-${next.city} היום` : daysUntil === 1 ? `עוברים ל-${next.city} מחר` : `עוברים ל-${next.city} בעוד ${daysUntil} ימים`;
      }
    }

    setRouteStatus({ currentCity, todayActivity, nextTransitionLabel });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [activeTripInfo]);

  // התנתקות אמיתית — שני הכפתורים במסך הזה היו stubs של הדגמה.
  async function handleSignOut() {
    const errorMessage = await signOutCurrentUser();
    if (errorMessage) {
      showToast('ההתנתקות נכשלה: ' + errorMessage);
      return;
    }
    router.push('/login');
    router.refresh();
  }
  const [chatOpen, setChatOpen] = useState(false);
  const [profileOpen, setProfileOpen] = useState(false);
  const [aiPressed, setAiPressed] = useState(false);
  // ערך-זרע קבוע (לא new Date()) בכוונה: מונע חוסר-התאמת hydration (React
  // error #418) בין ה-HTML שנוצר בשרת לבין רינדור-הלקוח הראשון, כי "עכשיו"
  // תמיד שונה בין השניים (זמן-רשת). מתעדכן לזמן-אמת מיד ב-useEffect למטה
  // (client-only, אחרי hydration) — הבזק קצר של 01/01/1970 עד אז, לא שגיאה.
  const [now, setNow] = useState(() => new Date(0));
  // אותה בעיה בדיוק עבור אזור-הזמן של "שורת-המצב" המדומה: השרת (Vercel
  // Lambda) ולקוח-האמת (טלפון) פותרים Intl.DateTimeFormat().resolvedOptions()
  // .timeZone לאזורי-זמן שונים — קריאה ישירה בתוך ה-JSX גרמה ל-hydration
  // mismatch נוסף ונפרד מ-now. פותר באותו דפוס: ערך-זרע קבוע, מוחלף מיד
  // ב-useEffect (client-only).
  const [deviceTimeZone, setDeviceTimeZone] = useState("UTC");

  const [sideMenuOpen, setSideMenuOpen] = useState(false);
  const [notificationsOpen, setNotificationsOpen] = useState(false);
  const [notifications, setNotifications] = useState<Notification[]>(INITIAL_NOTIFICATIONS);
  const [weatherDetailOpen, setWeatherDetailOpen] = useState(false);
  const [timerDetailOpen, setTimerDetailOpen] = useState(false);
  const [demoClock, setDemoClock] = useState(0);

  const [currencyTab, setCurrencyTab] = useState<"usd" | "eur" | "ils" | "custom">("usd");
  const [customFrom, setCustomFrom] = useState<CurrencyCode>("usd");
  const [customTo, setCustomTo] = useState<CurrencyCode>("thb");
  const [customAmount, setCustomAmount] = useState("100");

  const [toast, setToast] = useState<string | null>(null);
  const toastTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  function showToast(message: string) {
    if (toastTimer.current) clearTimeout(toastTimer.current);
    setToast(message);
    toastTimer.current = setTimeout(() => setToast(null), 3200);
  }

  const unreadCount = notifications.filter((n) => !n.read).length;

  // חיבור-קריאה-בלבד לשירותים אמיתיים שכבר קיימים (Open-Meteo / בנק-ישראל
  // +Frankfurter — ר' actions.ts). "loading" אמיתי (לא מדומה) עד שהקריאה
  // חוזרת; "error" אמיתי אם הספק נכשל/אין אינטרנט — לא מומצא ערך.
  const [weather, setWeather] = useState<{ status: "loading" | "success" | "error"; data: DemoWeatherResult | null }>({ status: "loading", data: null });
  const [currency, setCurrency] = useState<{ status: "loading" | "success" | "error"; data: DemoCurrencyResult | null }>({ status: "loading", data: null });
  const [isOnline, setIsOnline] = useState(true);

  useEffect(() => {
    setIsOnline(navigator.onLine);
    function onOnline() {
      setIsOnline(true);
    }
    function onOffline() {
      setIsOnline(false);
    }
    window.addEventListener("online", onOnline);
    window.addEventListener("offline", onOffline);
    return () => {
      window.removeEventListener("online", onOnline);
      window.removeEventListener("offline", onOffline);
    };
  }, []);

  useEffect(() => {
    let cancelled = false;
    // ניסיון-חוזר יחיד אחרי השהיה קצרה: נצפה בפועל ש-server action שקורא
    // ל-API חיצוני נכשל לפעמים דווקא בקריאה הראשונה אחרי דיפלוי חדש (cold
    // start בצד Vercel), אך תמיד מצליח ברגע שהפונקציה כבר "חמה" — כמה שניות
    // מספיקות. בלי זה המסך היה מציג "אין חיבור" לצמיתות על סמך כישלון חד-
    // פעמי וחולף, במקום לתת לו הזדמנות שנייה אמיתית.
    fetchWithRetries(() => fetchWeather()).then((res) => {
      if (!cancelled) setWeather({ status: res ? "success" : "error", data: res });
    });
    fetchWithRetries(getDemoCurrencyRatesAction).then((res) => {
      if (!cancelled) setCurrency({ status: res ? "success" : "error", data: res });
    });
    return () => {
      cancelled = true;
    };
  }, []);

  useEffect(() => {
    setNow(new Date());
    setDeviceTimeZone(Intl.DateTimeFormat().resolvedOptions().timeZone);
    const id = setInterval(() => setNow(new Date()), 30_000);
    return () => clearInterval(id);
  }, []);

  useEffect(() => {
    const id = setInterval(() => setDemoClock((m) => m + 1), 1000);
    return () => clearInterval(id);
  }, []);

  // מיקום עוזר ה-AI בדף הבית בלבד: האזור הפנוי בשורת הכותרת העליונה
  // (בין קבוצת הפעמון/פרופיל לקבוצת הלוגו/המבורגר), כי המיקום הקבוע
  // בפינה הימנית-תחתונה חופף לכרטיס "כמעט מוכנים לטיול" בתחתית הדף.
  useEffect(() => {
    const btn = document.querySelector<HTMLButtonElement>('button[aria-label="עוזר AI"]');
    if (!btn) return;
    const original = btn.getAttribute("style");
    btn.style.width = "34px";
    btn.style.height = "34px";
    btn.style.bottom = "auto";
    btn.style.insetInlineStart = "auto";
    btn.style.insetInlineEnd = "auto";
    btn.style.left = "123px";
    btn.style.top = "33px";
    return () => {
      if (original) btn.setAttribute("style", original);
      else btn.removeAttribute("style");
    };
  }, []);

  const nearestTimerEvent = useMemo(() => {
    const upcoming = HOME_TIMER_EVENTS.filter((e) => e.offsetMinutes - demoClock > -5);
    if (upcoming.length === 0) return null;
    return upcoming.reduce((min, e) => (e.offsetMinutes - demoClock < min.offsetMinutes - demoClock ? e : min));
  }, [demoClock]);

  function timeDiffLabel(zoneA: string, zoneB: string): string {
    const offset = (zone: string) => {
      const parts = new Intl.DateTimeFormat("en-US", { timeZone: zone, timeZoneName: "shortOffset" }).formatToParts(now);
      const tzName = parts.find((p) => p.type === "timeZoneName")?.value ?? "GMT+0";
      const match = tzName.match(/GMT([+-]\d+)/);
      return match ? parseInt(match[1]!, 10) : 0;
    };
    const diff = offset(zoneB) - offset(zoneA);
    if (diff === 0) return "אין הפרש שעות";
    return `הפרש שעות: ${diff > 0 ? "+" : ""}${diff} שעות`;
  }

  function convert(amount: number, from: CurrencyCode, to: CurrencyCode) {
    if (currency.status === "success" && currency.data) {
      const rates = currency.data.ratesToILS;
      const fromRate = rates[from.toUpperCase()];
      const toRate = rates[to.toUpperCase()];
      if (fromRate && toRate) return (amount * fromRate) / toRate;
    }
    const usd = amount * CURRENCY_TO_USD[from];
    return usd / CURRENCY_TO_USD[to];
  }
  function rateToThb(code: "usd" | "eur" | "ils"): number {
    if (currency.status === "success" && currency.data) {
      const rates = currency.data.ratesToILS;
      const thb = rates.THB;
      const x = rates[code.toUpperCase()];
      if (thb && x) return x / thb;
    }
    return CURRENCY_RATES_TO_THB[code];
  }

  return (
    <div
      style={{
        width: "100%",
        height: "100dvh",
        maxHeight: "100dvh",
        overflowY: "auto",
        overflowX: "hidden",
        background: `radial-gradient(50rem 26rem at 92% -4%, ${COLOR.blueGlow}, transparent 55%), radial-gradient(40rem 24rem at -6% 40%, ${COLOR.purpleGlow}, transparent 55%), ${COLOR.pageBg}`,
        color: COLOR.textPrimary,
        fontFamily: "var(--font-assistant), sans-serif",
        display: "flex",
        flexDirection: "column",
        position: "relative",
      }}
    >
      <div
        style={{
          flex: 1,
          display: "flex",
          flexDirection: "column",
          gap: "9px",
          padding: `8px 16px ${NAV_HEIGHT + 8}px`,
          maxWidth: "480px",
          width: "100%",
          marginInline: "auto",
        }}
      >
        {/* באנר-אין-אינטרנט אמיתי (navigator.onLine + online/offline events —
            לא מדומה) — מוצג רק כשבאמת אין חיבור. */}
        {!isOnline ? (
          <div style={{ display: "flex", alignItems: "center", justifyContent: "center", gap: "6px", padding: "7px 10px", borderRadius: "10px", background: "rgba(245,165,68,0.16)", border: `1px solid ${COLOR.warning}55`, fontSize: "11.5px", fontWeight: 700, color: COLOR.warning }}>
            אין חיבור לאינטרנט — חלק מהנתונים עשויים להיות לא מעודכנים
          </div>
        ) : null}

        {/* 1. שורת-מצב עליונה — דימוי חזותי בלבד (שעה + סמלי רשת/wifi/סוללה),
            בדיוק כמו בתמונת הייחוס. direction:ltr כי מספרי-שעה וסמלי-מכשיר
            הם תמיד LTR גם במסך RTL. */}
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", direction: "ltr", fontSize: "13px", fontWeight: 700 }}>
          <span>{formatClockTime(now, deviceTimeZone)}</span>
          <StatusBarIcons color={COLOR.textPrimary} />
        </div>

        {/* 2. לוגו+כותרת — כיוון-RTL תקין לעברית: המבורגר+לוגו בצד ימין,
            פעמון+פרופיל בצד שמאל (תוקן לפי משוב מפורש — לא עוד "מראה-המוקאפ
            המקורי שהיה LTR", אלא RTL נכון). אייקונים כ-SVG (לא אמוג'י). */}
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
          <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
            <button
              type="button"
              onClick={() => setSideMenuOpen(true)}
              aria-label="פתיחת תפריט"
              style={{ width: "34px", height: "34px", borderRadius: "50%", background: "transparent", border: "none", display: "flex", alignItems: "center", justifyContent: "center", cursor: "pointer", padding: 0 }}
            >
              <HamburgerIcon size={19} color={COLOR.textPrimary} />
            </button>
            <span style={{ display: "flex", alignItems: "center", gap: "6px", fontWeight: 800, fontSize: "16px", letterSpacing: "0.02em", direction: "ltr" }}>
              <LogoMark />
              TRIP <span style={{ color: COLOR.purple }}>MASTER</span>
            </span>
          </div>
          <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
            <button
              type="button"
              onClick={() => setNotificationsOpen(true)}
              aria-label={`התראות${unreadCount > 0 ? ` (${unreadCount} חדשות)` : ""}`}
              style={{
                position: "relative",
                width: "34px",
                height: "34px",
                borderRadius: "50%",
                background: COLOR.cardBg,
                border: `1px solid ${COLOR.cardBorder}`,
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                cursor: "pointer",
                padding: 0,
              }}
            >
              <BellIcon color={COLOR.textPrimary} />
              {unreadCount > 0 ? (
                <span
                  aria-hidden
                  style={{
                    position: "absolute",
                    top: -2,
                    insetInlineEnd: -2,
                    minWidth: "16px",
                    height: "16px",
                    borderRadius: "999px",
                    background: COLOR.danger,
                    color: "#fff",
                    fontSize: "9.5px",
                    fontWeight: 800,
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    padding: "0 3px",
                    border: `2px solid ${COLOR.pageBg}`,
                  }}
                >
                  {unreadCount}
                </span>
              ) : null}
            </button>
            {/* 2ב. תמונת-פרופיל עגולה — לחיצה פותחת חלונית-חשבון (שם, אימייל,
                מעבר-לפרופיל, התנתקות). אין למשתמש-הדוגמה תמונה אמיתית, אז
                מוצגת תמונת-ברירת-מחדל איכותית (אווטאר-SVG על גרדיאנט) — לא
                תצלום מומצא של אדם שלא קיים. */}
            <div style={{ position: "relative" }}>
              <button
                type="button"
                onClick={() => setProfileOpen((v) => !v)}
                aria-label="חשבון המשתמש"
                aria-expanded={profileOpen}
                style={{
                  width: "34px",
                  height: "34px",
                  borderRadius: "50%",
                  background: `linear-gradient(150deg, ${COLOR.purple}, #4f7fe0)`,
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  border: "none",
                  cursor: "pointer",
                  padding: 0,
                }}
              >
                <PersonIcon color="#fff" />
              </button>

              {profileOpen ? (
                <>
                  <div onClick={() => setProfileOpen(false)} style={{ position: "fixed", inset: 0, zIndex: 40 }} />
                  <div
                    style={{
                      position: "absolute",
                      top: "calc(100% + 10px)",
                      left: 0,
                      width: "230px",
                      background: "#0c1526",
                      border: `1px solid ${COLOR.cardBorder}`,
                      borderRadius: "18px",
                      padding: "14px",
                      boxShadow: "0 16px 40px rgba(0,0,0,0.5)",
                      zIndex: 41,
                      direction: "rtl",
                      textAlign: "start",
                    }}
                  >
                    <div style={{ display: "flex", alignItems: "center", gap: "10px", marginBottom: "12px" }}>
                      <span
                        aria-hidden
                        style={{ width: "42px", height: "42px", borderRadius: "50%", background: `linear-gradient(150deg, ${COLOR.purple}, #4f7fe0)`, display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}
                      >
                        <PersonIcon color="#fff" />
                      </span>
                      <div style={{ minWidth: 0 }}>
                        <div style={{ fontWeight: 800, fontSize: "14px", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{currentUser?.displayName ?? ""}</div>
                        <div style={{ fontSize: "11px", color: COLOR.textMuted, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{currentUser?.email ?? ""}</div>
                      </div>
                    </div>
                    <div style={{ height: 1, background: COLOR.cardBorder, margin: "4px 0 10px" }} />
                    <button
                      type="button"
                      onClick={() => {
                        setProfileOpen(false);
                        router.push("/profile");
                      }}
                      style={{ display: "flex", alignItems: "center", gap: "8px", width: "100%", padding: "9px 8px", borderRadius: "10px", border: "none", background: "transparent", color: COLOR.textPrimary, fontSize: "13px", fontWeight: 600, cursor: "pointer", textAlign: "start" }}
                    >
                      <PersonIcon color={COLOR.textSecondary} />
                      מעבר לפרופיל
                    </button>
                    <button
                      type="button"
                      onClick={() => void handleSignOut()}
                      style={{ display: "flex", alignItems: "center", gap: "8px", width: "100%", padding: "9px 8px", borderRadius: "10px", border: "none", background: "transparent", color: COLOR.danger, fontSize: "13px", fontWeight: 700, cursor: "pointer", textAlign: "start" }}
                    >
                      <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke={COLOR.danger} strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" aria-hidden>
                        <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4" />
                        <path d="M16 17l5-5-5-5" />
                        <path d="M21 12H9" />
                      </svg>
                      התנתקות
                    </button>
                  </div>
                </>
              ) : null}
            </div>
          </div>
        </div>
        {/* 3. ברכה דינמית לפי שעת-המכשיר (לא "שלום" קבוע) + 4. מזג-אוויר
            קומפקטי לידה — נתוני-דוגמה בלבד, בלי שירות-חיצוני. אייקון-מזג-
            האוויר הוא placeholder נייטרלי (כמו שאר האייקונים כרגע) —
            בהמתנה לחבילת-האייקונים החדשה, לא הוחלף. */}
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: "10px" }}>
          <h1 style={{ margin: 0, fontSize: "20px", fontWeight: 800, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
            {getTimeGreeting(now.getHours())}{currentUser ? `, ${currentUser.displayName}` : ""} 👋
          </h1>
          <button
            type="button"
            onClick={() => setWeatherDetailOpen(true)}
            style={{
              display: "flex",
              alignItems: "center",
              gap: "7px",
              padding: "6px 10px",
              borderRadius: "999px",
              background: "rgba(255,255,255,0.07)",
              border: `1px solid ${COLOR.cardBorder}`,
              flexShrink: 0,
              cursor: "pointer",
            }}
          >
            <IconPlaceholder size={18} />
            {weather.status === "loading" ? (
              <span style={{ fontSize: "11px", color: COLOR.textSecondary }}>טוען...</span>
            ) : weather.status === "success" && weather.data ? (
              <>
                <span style={{ fontSize: "13px", fontWeight: 800, fontVariantNumeric: "tabular-nums" }}>{Math.round(weather.data.temperatureC ?? 0)}°</span>
                <span style={{ fontSize: "10.5px", color: COLOR.textSecondary, whiteSpace: "nowrap" }}>בנגקוק · {weather.data.condition}</span>
              </>
            ) : (
              <span style={{ fontSize: "10.5px", color: COLOR.warning, whiteSpace: "nowrap" }}>אין חיבור למזג אוויר</span>
            )}
          </button>
        </div>

        {/* שני שעוני-העולם עברו לאותו מלבן אחד (לפי בקשה מפורשת: "תשים את
            שניהם באותו מלבן") — המלבן השני שהתפנה נשאר ריק בינתיים, ממתין
            להחלטה מה יהיה בו. */}
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "9px" }}>
          <Card style={{ padding: "11px" }}>
            <div style={{ display: "flex", alignItems: "flex-start", gap: "10px" }}>
              <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{ display: "flex", alignItems: "center", gap: "6px", marginBottom: "6px" }}>
                  <IsraelFlag />
                  <span style={{ fontSize: "10px", color: COLOR.textSecondary }}>ישראל</span>
                </div>
                <div style={{ fontSize: "17px", fontWeight: 800, fontVariantNumeric: "tabular-nums" }}>{formatClockTime(now, "Asia/Jerusalem")}</div>
                <div style={{ fontSize: "9px", color: COLOR.textMuted, marginTop: "1px" }}>{formatClockDate(now, "Asia/Jerusalem")}</div>
              </div>
              <div style={{ width: "1px", alignSelf: "stretch", background: COLOR.cardBorder }} />
              <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{ display: "flex", alignItems: "center", gap: "6px", marginBottom: "6px" }}>
                  <ThailandFlag />
                  <span style={{ fontSize: "10px", color: COLOR.textSecondary }}>תאילנד</span>
                </div>
                <div style={{ fontSize: "17px", fontWeight: 800, fontVariantNumeric: "tabular-nums" }}>{formatClockTime(now, "Asia/Bangkok")}</div>
                <div style={{ fontSize: "9px", color: COLOR.textMuted, marginTop: "1px" }}>{formatClockDate(now, "Asia/Bangkok")}</div>
              </div>
            </div>
            <div style={{ textAlign: "center", fontSize: "10px", color: COLOR.textSecondary, marginTop: "8px" }}>
              {timeDiffLabel("Asia/Jerusalem", "Asia/Bangkok")}
            </div>
          </Card>
          <Card style={{ padding: "11px", border: `1px dashed ${COLOR.cardBorder}`, background: "transparent", display: "flex", alignItems: "center", justifyContent: "center", textAlign: "center" }}>
            <span style={{ fontSize: "11px", color: COLOR.textMuted }}>מקום פנוי — נחליט יחד מה יהיה כאן</span>
          </Card>
        </div>

        {/* שם הטיול הפעיל + מעבר-מהיר למסך "הטיולים שלי" להחלפת טיול —
            צ'יפ נפרד מחוץ ל-Link של כרטיס-ההתקדמות (לא ניתן לקנן קישורים). */}
        {activeTripInfo ? (
          <Link href="/trips" style={{ display: "flex", alignItems: "center", gap: "6px", textDecoration: "none", fontSize: "11.5px", fontWeight: 700, color: COLOR.textSecondary, padding: "0 2px" }}>
            <FlagIcon countryCode={activeTripInfo.countryCode} size={14} />
            <span>{activeTripInfo.name}</span>
            <span style={{ color: COLOR.purple }}>· החלפת טיול</span>
          </Link>
        ) : null}

        {/* תזכורת פיקדונות שהגיע/עבר הזמן להחזרתם — לפי בקשה מפורשת
            "שיתזכר אותנו שאנחנו עוזבים את המלון או מחזירים את הרכב". */}
        {walletStore.hydrated && walletStore.deposits.some((d) => d.status === "pending" && d.expectedReturnDate && d.expectedReturnDate <= today()) ? (
          <Link href="/wallet/deposits" style={{ display: "block", textDecoration: "none", color: "inherit" }}>
            <Card style={{ cursor: "pointer", border: `1px solid ${COLOR.warning}66`, background: "rgba(245,158,11,0.12)" }}>
              <div style={{ fontSize: "12.5px", fontWeight: 700, color: COLOR.warning }}>
                תזכורת: יש לכם פיקדון שזמן ההחזרה שלו הגיע — ודאו שקיבלתם אותו בחזרה
              </div>
            </Card>
          </Link>
        ) : null}

        {/* "המסלול שלי" — היה מלבן גדול לתצוגת יום-בטיול בלבד. מחולק עכשיו
            ל-4 משבצות (לפי בקשה מפורשת): יום-בטיול, עיר נוכחית, הפעילות
            הבאה היום, והמעבר הבא במסלול — כל אחת מנתונים אמיתיים. */}
        {tripChecked && !activeTripInfo ? (
          <Link href="/trips/new" style={{ display: "block", textDecoration: "none", color: "inherit" }}>
            <Card style={{ cursor: "pointer", textAlign: "center" }}>
              <div style={{ fontWeight: 800, fontSize: "14px", marginBottom: "6px" }}>אין טיול פעיל</div>
              <div style={{ fontSize: "12px", color: COLOR.textSecondary }}>לחצו כדי ליצור את הטיול הראשון שלכם</div>
            </Card>
          </Link>
        ) : (
          <div style={{ display: "grid", gridTemplateColumns: "repeat(2, 1fr)", gap: "8px" }}>
            <Link href="/route" style={{ textDecoration: "none", color: "inherit" }}>
              <div style={{ padding: "10px", borderRadius: "12px", background: "rgba(255,255,255,0.04)", border: `1px solid ${COLOR.cardBorder}` }}>
                <div style={{ display: "flex", alignItems: "center", gap: "8px", marginBottom: "6px" }}>
                  <Ring percent={tripProgress?.percent ?? 0} size={26} color={COLOR.turquoise} />
                  <span style={{ fontSize: "10.5px", fontWeight: 600, color: COLOR.textMuted }}>המסלול שלי</span>
                </div>
                <div style={{ fontSize: "14px", fontWeight: 800, color: COLOR.turquoise }}>
                  יום {tripProgress?.dayIndex ?? "—"} <span style={{ color: COLOR.textSecondary, fontWeight: 600, fontSize: "11px" }}>מתוך {tripProgress?.totalDays ?? "—"}</span>
                </div>
                <div style={{ fontSize: "10.5px", color: COLOR.textSecondary, marginTop: "2px" }}>
                  נותרו <span style={{ color: COLOR.purple, fontWeight: 700 }}>{tripProgress?.daysRemaining ?? "—"}</span> ימים
                </div>
              </div>
            </Link>
            <Link href="/route" style={{ textDecoration: "none", color: "inherit" }}>
              <div style={{ padding: "10px", borderRadius: "12px", background: "rgba(255,255,255,0.04)", border: `1px solid ${COLOR.cardBorder}` }}>
                <div style={{ fontSize: "10.5px", fontWeight: 600, color: COLOR.textMuted, marginBottom: "6px" }}>כרגע ב</div>
                <div style={{ fontSize: "14px", fontWeight: 800, color: COLOR.textPrimary, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{routeStatus?.currentCity ?? "—"}</div>
              </div>
            </Link>
            <Link
              href={routeStatus?.todayActivity ? `/activities/${routeStatus.todayActivity.id}` : activeTripInfo ? `/trips/${activeTripInfo.id}/plan?day=${today()}` : "/route"}
              style={{ textDecoration: "none", color: "inherit" }}
            >
              <div style={{ padding: "10px", borderRadius: "12px", background: "rgba(255,255,255,0.04)", border: `1px solid ${COLOR.cardBorder}` }}>
                <div style={{ fontSize: "10.5px", fontWeight: 600, color: COLOR.textMuted, marginBottom: "6px" }}>הפעילות הבאה היום</div>
                <div style={{ fontSize: "13px", fontWeight: 700, color: COLOR.textPrimary, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                  {routeStatus?.todayActivity ? `${routeStatus.todayActivity.time} · ${routeStatus.todayActivity.title}` : "אין פעילויות היום"}
                </div>
              </div>
            </Link>
            <Link href="/route" style={{ textDecoration: "none", color: "inherit" }}>
              <div style={{ padding: "10px", borderRadius: "12px", background: "rgba(255,255,255,0.04)", border: `1px solid ${COLOR.cardBorder}` }}>
                <div style={{ fontSize: "10.5px", fontWeight: 600, color: COLOR.textMuted, marginBottom: "6px" }}>המעבר הבא</div>
                <div style={{ fontSize: "13px", fontWeight: 700, color: COLOR.textPrimary, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{routeStatus?.nextTransitionLabel ?? "—"}</div>
              </div>
            </Link>
          </div>
        )}

        {/* ארנק — מסגרת אחת מחולקת למשבצת לכל מטבע שיש בו יתרה (כולל
            יתרות-אפס — 4 מטבעות-הבסיס תמיד קיימים) וכל כרטיס-אשראי, לפי
            בקשה מפורשת: "תחלק אותה לכל סוגי המטבעות... לפחות 4 או 5".
            מסך-ארנק אמיתי קיים כעת ב-/design-preview/wallet — לחיצה מנווטת
            אליו. */}
        <Link href="/wallet" style={{ display: "block", textDecoration: "none", color: "inherit" }}>
          <Card style={{ cursor: "pointer" }}>
            <div style={{ fontWeight: 800, fontSize: "14px", marginBottom: "10px" }}>הארנק שלי</div>
            <WalletCurrencyGrid walletStore={walletStore} />
          </Card>
        </Link>

        {/* כרטיס שערי-מטבעות — 3 זוגות קבועים מותאמים ליעד (תאילנד) + מחשבון
            חופשי. נתוני-הדגמה בלבד (אין עדיין שירות-שערים אמיתי מחובר). */}
        <Card>
          <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: "10px" }}>
            <span style={{ fontWeight: 800, fontSize: "14px" }}>שערי מטבעות</span>
            {currency.status === "success" ? (
              <span style={{ fontSize: "9.5px", fontWeight: 700, color: COLOR.success, background: "rgba(67,214,170,0.14)", border: `1px solid ${COLOR.success}40`, borderRadius: "999px", padding: "2px 7px" }}>שער חי</span>
            ) : currency.status === "loading" ? (
              <span style={{ fontSize: "9.5px", fontWeight: 700, color: COLOR.textSecondary, background: "rgba(255,255,255,0.06)", border: `1px solid ${COLOR.cardBorder}`, borderRadius: "999px", padding: "2px 7px" }}>טוען...</span>
            ) : (
              <span style={{ fontSize: "9.5px", fontWeight: 700, color: COLOR.warning, background: "rgba(245,165,68,0.14)", border: `1px solid ${COLOR.warning}40`, borderRadius: "999px", padding: "2px 7px" }}>נתוני הדגמה</span>
            )}
          </div>
          <div style={{ display: "flex", gap: "6px", marginBottom: "12px", overflowX: "auto" }}>
            {(["usd", "eur", "ils", "custom"] as const).map((tab) => (
              <button
                key={tab}
                type="button"
                onClick={() => setCurrencyTab(tab)}
                aria-pressed={currencyTab === tab}
                style={{
                  padding: "6px 12px",
                  borderRadius: "999px",
                  fontSize: "11px",
                  fontWeight: 700,
                  whiteSpace: "nowrap",
                  cursor: "pointer",
                  background: currencyTab === tab ? COLOR.purple : "rgba(255,255,255,0.06)",
                  border: `1px solid ${currencyTab === tab ? COLOR.purple : COLOR.cardBorder}`,
                  color: "#fff",
                }}
              >
                {tab === "custom" ? "מחשבון חופשי" : `${CURRENCY_SYMBOL[tab]} / ฿`}
              </button>
            ))}
          </div>

          {currencyTab !== "custom" ? (
            currency.status === "loading" ? (
              <div style={{ fontSize: "13px", color: COLOR.textSecondary }}>טוען שער עדכני...</div>
            ) : (
              <div style={{ display: "flex", alignItems: "baseline", justifyContent: "space-between" }}>
                <div>
                  <div style={{ fontSize: "11px", color: COLOR.textMuted }}>{CURRENCY_LABEL[currencyTab]} ← באט תאילנדי</div>
                  <div style={{ fontSize: "22px", fontWeight: 800, color: COLOR.turquoise, fontVariantNumeric: "tabular-nums" }}>
                    1 {CURRENCY_SYMBOL[currencyTab]} = ฿{rateToThb(currencyTab).toFixed(2)}
                  </div>
                </div>
              </div>
            )
          ) : (
            <div style={{ display: "flex", flexDirection: "column", gap: "8px" }}>
              <div style={{ display: "flex", gap: "6px", alignItems: "center" }}>
                <input
                  type="number"
                  value={customAmount}
                  onChange={(e) => setCustomAmount(e.target.value)}
                  onFocus={(e) => e.target.select()}
                  style={{ flex: 1, minWidth: 0, padding: "9px 10px", borderRadius: "10px", background: "#0e1930", border: `1px solid ${COLOR.cardBorder}`, color: "#fff", fontSize: "14px" }}
                />
                <select
                  value={customFrom}
                  onChange={(e) => setCustomFrom(e.target.value as CurrencyCode)}
                  style={{ padding: "9px 6px", borderRadius: "10px", background: "#0e1930", border: `1px solid ${COLOR.cardBorder}`, color: "#fff", fontSize: "13px" }}
                >
                  {ALL_CURRENCIES.map((c) => (
                    <option key={c} value={c}>
                      {c.toUpperCase()}
                    </option>
                  ))}
                </select>
                <button
                  type="button"
                  onClick={() => {
                    setCustomFrom(customTo);
                    setCustomTo(customFrom);
                  }}
                  aria-label="החלפת מטבעות"
                  style={{ width: "34px", height: "34px", borderRadius: "10px", background: "rgba(255,255,255,0.06)", border: `1px solid ${COLOR.cardBorder}`, color: "#fff", cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}
                >
                  <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="#fff" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round">
                    <path d="M7 10h13l-4-4M17 14H4l4 4" />
                  </svg>
                </button>
                <select
                  value={customTo}
                  onChange={(e) => setCustomTo(e.target.value as CurrencyCode)}
                  style={{ padding: "9px 6px", borderRadius: "10px", background: "#0e1930", border: `1px solid ${COLOR.cardBorder}`, color: "#fff", fontSize: "13px" }}
                >
                  {ALL_CURRENCIES.map((c) => (
                    <option key={c} value={c}>
                      {c.toUpperCase()}
                    </option>
                  ))}
                </select>
              </div>
              <div style={{ fontSize: "20px", fontWeight: 800, color: COLOR.turquoise, fontVariantNumeric: "tabular-nums" }}>
                {(Number(customAmount) || 0).toLocaleString()} {customFrom.toUpperCase()} = {convert(Number(customAmount) || 0, customFrom, customTo).toLocaleString(undefined, { maximumFractionDigits: 2 })} {customTo.toUpperCase()}
              </div>
            </div>
          )}
          <div style={{ fontSize: "10px", color: COLOR.textMuted, marginTop: "10px" }}>
            {currency.status === "success" && currency.data
              ? `מקור: ${currency.data.source === "boi" ? "בנק ישראל" : "Frankfurter (ECB)"}${currency.data.asOf ? ` · נכון ל-${currency.data.asOf}` : ""}`
              : currency.status === "loading"
                ? "טוען שער מבנק ישראל..."
                : "אין חיבור לשער חי כרגע · מוצגים נתוני הדגמה"}
          </div>
        </Card>

        {/* "כמעט מוכנים לטיול" — מחושב מנתונים אמיתיים (הזמנות/פעילויות/
            מסלול/מסמכים), מציג רק מה שבאמת חסר; אם הכול הושלם הכרטיס כולו
            לא מוצג. רקע-כרטיס בגרדיאנט-סגול עדין; האייקונים נשארים צבעוניים
            per-type. */}
        {readinessItems.length > 0 ? (
          <Card
            style={{
              background: `linear-gradient(150deg, ${COLOR.readinessGradientStart} 0%, ${COLOR.readinessGradientMid} 55%, ${COLOR.readinessGradientEnd} 100%)`,
              border: `1px solid ${COLOR.readinessBorder}`,
              boxShadow: `0 0 0 1px rgba(168,128,245,0.12), 0 0 26px ${COLOR.readinessGlow}, 0 14px 30px rgba(0,0,0,0.4)`,
            }}
          >
            <div style={{ fontWeight: 800, fontSize: "16px", color: COLOR.readinessTextPrimary, marginBottom: "3px" }}>כמעט מוכנים לטיול ✨</div>
            <div style={{ fontSize: "12px", color: COLOR.readinessTextSecondary, marginBottom: "10px" }}>
              {readinessItems.length === 1 ? "נותרה השלמה חשובה אחת" : `נותרו ${readinessItems.length} השלמות חשובות`}
            </div>
            <div style={{ display: "flex", flexDirection: "column", gap: "8px" }}>
              {readinessItems.map((item) => (
                <ActionTile key={item.key} icon={item.icon} title={item.title} subtitle={item.subtitle} cta={item.cta} onClick={item.onClick} />
              ))}
            </div>
          </Card>
        ) : null}

        {/* אירוע קרוב + טיימר חכם — מתעדכן בזמן אמת (שעון-דמו מואץ, ר' דוח
            הבדיקה). טיסה/מעבורת מקבלות כרטיס-ייעודי איכותי; שאר הסוגים
            משתמשים בכרטיס הגנרי. לחיצה על הכרטיס הגנרי פותחת פרטים מלאים. */}
        {nearestTimerEvent?.kind === "pickup" ? (
          <RideStatusCard event={nearestTimerEvent} demoClock={demoClock} showToast={showToast} />
        ) : nearestTimerEvent?.kind === "boarding" ? (
          <FlightBoardingCard event={nearestTimerEvent} demoClock={demoClock} onOpenDetail={() => {}} />
        ) : nearestTimerEvent?.kind === "ferry" ? (
          <FerryCard event={nearestTimerEvent} demoClock={demoClock} onOpenDetail={() => {}} />
        ) : nearestTimerEvent ? (
          (() => {
            const minutesLeft = nearestTimerEvent.offsetMinutes - demoClock;
            const tone = timerTone(minutesLeft);
            return (
              <button
                type="button"
                onClick={() => setTimerDetailOpen(true)}
                style={{ display: "block", width: "100%", textAlign: "start", background: "none", border: "none", padding: 0, cursor: "pointer" }}
              >
                <Card style={{ background: tone.bg, border: `1px solid ${tone.fg}55` }}>
                  <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: "6px" }}>
                    <span style={{ fontWeight: 800, fontSize: "14px", color: "#fff" }}>האירוע הקרוב</span>
                    <span style={{ fontSize: "10.5px", fontWeight: 800, color: tone.fg, background: "rgba(0,0,0,0.25)", padding: "3px 9px", borderRadius: "999px" }}>{tone.label}</span>
                  </div>
                  <div style={{ fontSize: "15px", fontWeight: 800, color: "#fff", marginBottom: "2px" }}>{nearestTimerEvent.label}</div>
                  <div style={{ fontSize: "11.5px", color: COLOR.textSecondary, marginBottom: "6px" }}>{nearestTimerEvent.location}</div>
                  <div style={{ fontSize: "18px", fontWeight: 800, color: tone.fg }}>
                    {minutesLeft <= 0 ? "האירוע החל" : `בעוד ${formatMinutesLabel(minutesLeft)}`}
                  </div>
                </Card>
              </button>
            );
          })()
        ) : null}

      </div>

      {/* תפריט תחתון — אייקוני SVG מקצועיים (lucide-react, כבר מותקן בפרויקט),
          לא אמוג'י/אותיות. אותו סגנון/עובי-קו/גודל לכולם. פעיל: סגול + זוהר
          עדין + רקע מעוגל. לא-פעיל: אפור בהיר וברור. אזור-לחיצה מוגדל לנוחות
          מובייל, רווחים שווים. */}
      <div
        style={{
          position: "fixed",
          insetInlineStart: 0,
          insetInlineEnd: 0,
          bottom: 0,
          minHeight: `${NAV_HEIGHT}px`,
          display: "flex",
          alignItems: "center",
          justifyContent: "space-around",
          padding: "4px 4px calc(4px + env(safe-area-inset-bottom))",
          background: "rgba(10,15,32,0.94)",
          backdropFilter: "blur(16px)",
          borderTop: "1px solid rgba(255,255,255,0.1)",
          boxShadow: "0 -8px 24px rgba(0,0,0,0.35)",
          direction: "ltr",
          zIndex: 20,
        }}
      >
        {[
          { Icon: HouseNavIcon, label: "בית", active: true, href: "/" },
          { Icon: SuitcaseNavIcon, label: "מסלול", active: false, href: "/route" },
          { Icon: JournalNavIcon, label: "יומן", active: false, href: "/planner?day=2026-05-04&city=%D7%91%D7%A0%D7%92%D7%A7%D7%95%D7%A7" },
          { Icon: WalletNavIcon, label: "ארנק", active: false, href: "/wallet" },
          { Icon: MoreNavIcon, label: "עוד", active: false, href: "/more" },
        ].map(({ Icon, label, active, href }) => (
          <Link
            key={label}
            href={href ?? "#"}
            onClick={
              href
                ? undefined
                : (e) => {
                    e.preventDefault();
                    showToast(`מסך "${label}" עדיין בבנייה בהדגמה זו`);
                  }
            }
            aria-disabled={href ? undefined : true}
            style={{
              display: "flex",
              flexDirection: "column",
              alignItems: "center",
              justifyContent: "center",
              gap: "3px",
              flex: "1 1 0",
              minHeight: "54px",
              padding: "6px 2px",
              borderRadius: "14px",
              background: "transparent",
              textDecoration: "none",
              cursor: href ? "pointer" : "default",
            }}
          >
            <span
              aria-hidden
              style={{
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                width: "38px",
                height: "38px",
                borderRadius: "13px",
                background: active ? "rgba(138,90,223,0.22)" : "transparent",
                boxShadow: active ? "0 0 0 1px rgba(168,128,245,0.35), 0 0 12px rgba(138,90,223,0.5)" : "none",
                opacity: active ? 1 : 0.72,
                filter: active ? "none" : "saturate(0.75)",
              }}
            >
              <Icon size={21} />
            </span>
            <span style={{ fontSize: "10px", fontWeight: active ? 700 : 500, color: active ? COLOR.purple : "#a7afc9" }}>{label}</span>
          </Link>
        ))}
      </div>

      {/* כפתור-AI יחיד — עגול (64px), מרחף במרכז מעל התפריט (position:fixed
          נפרד לגמרי, לא child של שורת-הניווט — לא מזיז שום פריט-ניווט). דרישה
          מחייבת: זה כפתור-ה-AI היחיד באפליקציה. שכבות: פעימת-אור חד-פעמית
          (keyframe בלי infinite — רצה פעם אחת ב-mount ונעצרת) → טבעת-זכוכית
          שקופה → הכפתור עצמו (גרדיאנט סגול-עמוק→כחול-חשמלי, נקודת-אור עליונה
          ל"עומק", מצטמצם קלות בלחיצה דרך aiPressed). פותח כרגע חלונית-תצוגה
          (state מקומי) — בעתיד יתחבר לשירות-AI אמיתי. */}
      <style>{`@keyframes aiFabPulseOnce { 0% { transform: scale(1); opacity: 0.5; } 100% { transform: scale(1.85); opacity: 0; } }`}</style>
      <div
        style={{
          position: "fixed",
          left: "50%",
          transform: "translateX(-50%)",
          bottom: `${NAV_HEIGHT + 6}px`,
          width: "84px",
          height: "84px",
          zIndex: 21,
          pointerEvents: "none",
        }}
      >
        {/* פעימת-אור חד-פעמית */}
        <span
          aria-hidden
          style={{
            position: "absolute",
            inset: "10px",
            borderRadius: "50%",
            background: `radial-gradient(circle, ${COLOR.purpleGlow} 0%, transparent 70%)`,
            animation: "aiFabPulseOnce 1.3s ease-out 1",
          }}
        />
        {/* טבעת-זכוכית שקופה */}
        <span
          aria-hidden
          style={{
            position: "absolute",
            inset: "6px",
            borderRadius: "50%",
            border: "1px solid rgba(255,255,255,0.32)",
            background: "rgba(255,255,255,0.05)",
            backdropFilter: "blur(6px)",
            WebkitBackdropFilter: "blur(6px)",
          }}
        />
        {/* הכפתור עצמו */}
        <button
          type="button"
          onClick={() => setChatOpen((v) => !v)}
          onMouseDown={() => setAiPressed(true)}
          onMouseUp={() => setAiPressed(false)}
          onMouseLeave={() => setAiPressed(false)}
          onTouchStart={() => setAiPressed(true)}
          onTouchEnd={() => setAiPressed(false)}
          aria-label={chatOpen ? "סגירת עוזר AI" : "פתיחת עוזר AI"}
          style={{
            position: "absolute",
            inset: "10px",
            borderRadius: "50%",
            border: "none",
            cursor: "pointer",
            background: "linear-gradient(155deg, #5b21b6 0%, #6d28d9 38%, #2f7bf6 100%)",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            boxShadow: `0 0 0 7px ${COLOR.purpleGlow}, 0 0 26px 6px ${COLOR.blueGlow}, 0 16px 30px rgba(0,0,0,0.55)`,
            transform: aiPressed ? "scale(0.92)" : "scale(1)",
            transition: "transform 160ms ease-out",
            pointerEvents: "auto",
            overflow: "hidden",
          }}
        >
          {/* נקודת-אור עליונה — תחושת-עומק/זכוכית */}
          <span
            aria-hidden
            style={{
              position: "absolute",
              top: "7px",
              insetInlineStart: "16px",
              width: "26px",
              height: "13px",
              borderRadius: "50%",
              background: "rgba(255,255,255,0.5)",
              filter: "blur(3px)",
            }}
          />
          <AiPlaneIcon size={28} />
        </button>
      </div>

      {/* חלונית-שיחה — עיצוב בלבד בשלב זה (בקשת משתמש: "מספיק להראות את הכפתור
          ואת חלון השיחה בעיצוב"). מסך מלא בעתיד יכלול כתיבה/דיבור/צילום/העלאת
          תמונה/מסמך ופעולות-מערכת אמיתיות — כאן רק דימוי חזותי של הכפתורים. */}
      {chatOpen ? (
        <>
          <div onClick={() => setChatOpen(false)} style={{ position: "fixed", inset: 0, background: "rgba(2,6,16,0.6)", zIndex: 25 }} />
          <div
            style={{
              position: "fixed",
              insetInlineStart: 0,
              insetInlineEnd: 0,
              bottom: 0,
              zIndex: 31,
              maxWidth: "480px",
              marginInline: "auto",
              background: "#0c1526",
              border: `1px solid ${COLOR.cardBorder}`,
              borderBottom: "none",
              borderRadius: "24px 24px 0 0",
              boxShadow: "0 -20px 60px rgba(0,0,0,0.5)",
              display: "flex",
              flexDirection: "column",
              maxHeight: "78vh",
            }}
          >
            <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", padding: "16px 16px 12px", borderBottom: `1px solid ${COLOR.cardBorder}` }}>
              <span style={{ display: "flex", alignItems: "center", gap: "8px", fontWeight: 800, fontSize: "15px" }}>
                <span aria-hidden style={{ width: "30px", height: "30px", borderRadius: "50%", background: `linear-gradient(150deg, ${COLOR.purple}, #4f7fe0)`, display: "flex", alignItems: "center", justifyContent: "center", fontSize: "14px" }}>
                  ✨
                </span>
                עוזר AI
              </span>
              <button type="button" onClick={() => setChatOpen(false)} aria-label="סגור" style={{ background: "transparent", border: "none", color: COLOR.textMuted, fontSize: "18px", cursor: "pointer", padding: "4px" }}>
                ✕
              </button>
            </div>

            <div style={{ flex: 1, overflowY: "auto", padding: "16px", display: "flex", flexDirection: "column", gap: "10px" }}>
              <div style={{ alignSelf: "flex-start", maxWidth: "80%", background: COLOR.cardBg, border: `1px solid ${COLOR.cardBorder}`, borderRadius: "16px 16px 16px 4px", padding: "10px 14px", fontSize: "13px" }}>
                היי{currentUser ? ` ${currentUser.displayName}` : ""}! איך אפשר לעזור לך עם הטיול לתאילנד היום? 👋
              </div>
              <div
                style={{
                  alignSelf: "flex-end",
                  maxWidth: "80%",
                  background: `linear-gradient(150deg, ${COLOR.purple}, ${COLOR.purpleDeep})`,
                  borderRadius: "16px 16px 4px 16px",
                  padding: "10px 14px",
                  fontSize: "13px",
                  color: "#fff",
                }}
              >
                תמצא לי מסעדה טובה ליד המלון?
              </div>
            </div>

            <div style={{ padding: "12px 16px", borderTop: `1px solid ${COLOR.cardBorder}` }}>
              <div style={{ display: "flex", alignItems: "center", gap: "8px", background: "rgba(255,255,255,0.05)", border: `1px solid ${COLOR.cardBorder}`, borderRadius: "999px", padding: "8px 8px 8px 16px" }}>
                <span style={{ flex: 1, fontSize: "13px", color: COLOR.textMuted }}>כתוב הודעה...</span>
                {["📎", "📷", "🎤"].map((icon) => (
                  <span
                    key={icon}
                    aria-hidden
                    style={{ width: "30px", height: "30px", borderRadius: "50%", background: "rgba(255,255,255,0.06)", display: "flex", alignItems: "center", justifyContent: "center", fontSize: "13px", flexShrink: 0 }}
                  >
                    {icon}
                  </span>
                ))}
                <span
                  aria-hidden
                  style={{
                    width: "30px",
                    height: "30px",
                    borderRadius: "50%",
                    background: `linear-gradient(150deg, ${COLOR.purple}, #4f7fe0)`,
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    fontSize: "13px",
                    flexShrink: 0,
                    color: "#fff",
                  }}
                >
                  ➤
                </span>
              </div>
              <div style={{ fontSize: "10px", color: COLOR.textMuted, textAlign: "center", marginTop: "8px" }}>
                בעתיד: כתיבה, דיבור, צילום, העלאת תמונה/מסמך, וביצוע פעולות במערכת
              </div>
            </div>
          </div>
        </>
      ) : null}

      {/* תפריט-צד אמיתי (נגרר מימין, בהתאמה למיקום ההמבורגר ב-RTL) */}
      {sideMenuOpen ? (
        <>
          <div onClick={() => setSideMenuOpen(false)} style={{ position: "fixed", inset: 0, background: "rgba(2,6,16,0.6)", zIndex: 48 }} />
          <div
            style={{
              position: "fixed",
              top: 0,
              bottom: 0,
              right: 0,
              width: "78%",
              maxWidth: "300px",
              background: "#0c1526",
              borderInlineStart: `1px solid ${COLOR.cardBorder}`,
              zIndex: 49,
              padding: "18px 16px calc(16px + env(safe-area-inset-bottom))",
              display: "flex",
              flexDirection: "column",
              boxShadow: "-16px 0 40px rgba(0,0,0,0.5)",
            }}
          >
            <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: "18px" }}>
              <span style={{ display: "flex", alignItems: "center", gap: "6px", fontWeight: 800, fontSize: "16px", direction: "ltr" }}>
                <LogoMark />
                TRIP <span style={{ color: COLOR.purple }}>MASTER</span>
              </span>
              <button type="button" onClick={() => setSideMenuOpen(false)} aria-label="סגירת תפריט" style={{ width: "30px", height: "30px", borderRadius: "50%", background: "rgba(255,255,255,0.08)", border: "none", color: "#fff", cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center" }}>
                <CloseIcon size={14} />
              </button>
            </div>
            <div style={{ display: "flex", flexDirection: "column", gap: "2px" }}>
              {[
                { icon: <HouseNavIcon size={19} color={COLOR.textPrimary} />, label: "דף הבית", href: "/" },
                { icon: <SuitcaseNavIcon size={19} color={COLOR.textPrimary} />, label: "המסלול שלי", href: "/route" },
                { icon: <JournalNavIcon size={19} color={COLOR.textPrimary} />, label: "היומן היומי", href: "/planner?day=2026-05-04&city=%D7%91%D7%A0%D7%92%D7%A7%D7%95%D7%A7" },
                { icon: <WalletNavIcon size={19} color={COLOR.textPrimary} />, label: "הארנק שלי", href: "/wallet" },
                { icon: <ShieldNavIcon size={19} color={COLOR.textPrimary} />, label: "מסמכים וביטוח", href: "/documents" },
                { icon: <MoreNavIcon size={19} color={COLOR.textPrimary} />, label: "הגדרות", href: "/settings" },
              ].map((item) =>
                item.href ? (
                  <Link
                    key={item.label}
                    href={item.href}
                    style={{ display: "flex", alignItems: "center", gap: "12px", padding: "12px 8px", borderRadius: "12px", color: "#fff", textDecoration: "none", fontSize: "14px", fontWeight: 700 }}
                  >
                    {item.icon}
                    {item.label}
                  </Link>
                ) : (
                  <button
                    key={item.label}
                    type="button"
                    onClick={() => {
                      setSideMenuOpen(false);
                      showToast(`מסך "${item.label}" עדיין בבנייה בהדגמה זו`);
                    }}
                    style={{ display: "flex", alignItems: "center", gap: "12px", padding: "12px 8px", borderRadius: "12px", background: "none", border: "none", color: "#fff", fontSize: "14px", fontWeight: 700, cursor: "pointer", textAlign: "start" }}
                  >
                    {item.icon}
                    {item.label}
                  </button>
                ),
              )}
            </div>
            <div style={{ marginTop: "auto", paddingTop: "16px", borderTop: `1px solid ${COLOR.cardBorder}` }}>
              <button
                type="button"
                onClick={() => {
                  setSideMenuOpen(false);
                  void handleSignOut();
                }}
                style={{ display: "flex", alignItems: "center", gap: "10px", width: "100%", padding: "10px 8px", borderRadius: "12px", background: "none", border: "none", color: COLOR.danger, fontSize: "13.5px", fontWeight: 700, cursor: "pointer", textAlign: "start" }}
              >
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke={COLOR.danger} strokeWidth={2} strokeLinecap="round" strokeLinejoin="round">
                  <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4" />
                  <path d="M16 17l5-5-5-5" />
                  <path d="M21 12H9" />
                </svg>
                התנתקות
              </button>
            </div>
          </div>
        </>
      ) : null}

      {/* התראות — עם אפשרות לסמן כנקראה */}
      {notificationsOpen ? (
        <BottomSheetPanel title="התראות" onClose={() => setNotificationsOpen(false)}>
          <div style={{ display: "flex", flexDirection: "column", gap: "8px" }}>
            {notifications.map((n) => (
              <div
                key={n.id}
                style={{
                  display: "flex",
                  alignItems: "flex-start",
                  gap: "10px",
                  padding: "12px",
                  borderRadius: "14px",
                  background: n.read ? "transparent" : "rgba(138,90,223,0.1)",
                  border: `1px solid ${n.read ? COLOR.cardBorder : COLOR.purple + "40"}`,
                }}
              >
                <span aria-hidden style={{ width: "8px", height: "8px", borderRadius: "50%", background: n.read ? "transparent" : COLOR.purple, marginTop: "6px", flexShrink: 0 }} />
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ fontWeight: 800, fontSize: "13px", color: "#fff" }}>{n.title}</div>
                  <div style={{ fontSize: "12px", color: COLOR.textSecondary, marginTop: "2px" }}>{n.body}</div>
                  <div style={{ fontSize: "10.5px", color: COLOR.textMuted, marginTop: "4px" }}>{n.time}</div>
                </div>
                {!n.read ? (
                  <button
                    type="button"
                    onClick={() => setNotifications((prev) => prev.map((x) => (x.id === n.id ? { ...x, read: true } : x)))}
                    style={{ fontSize: "10.5px", fontWeight: 700, color: COLOR.purple, background: "none", border: "none", cursor: "pointer", whiteSpace: "nowrap", flexShrink: 0 }}
                  >
                    סמן כנקרא
                  </button>
                ) : null}
              </div>
            ))}
          </div>
        </BottomSheetPanel>
      ) : null}

      {/* פירוט מזג-אוויר יומי — נתונים אמיתיים מ-Open-Meteo כשזמינים (ר'
          actions.ts), עם מצב-טעינה/שגיאה אמיתיים; נופל חזרה לנתוני-הדגמה
          המסומנים בבירור רק אם החיבור נכשל. */}
      {weatherDetailOpen ? (
        <BottomSheetPanel title="מזג אוויר — בנגקוק" onClose={() => setWeatherDetailOpen(false)}>
          {weather.status === "loading" ? (
            <div style={{ fontSize: "9.5px", fontWeight: 700, color: COLOR.textSecondary, background: "rgba(255,255,255,0.06)", border: `1px solid ${COLOR.cardBorder}`, borderRadius: "999px", padding: "2px 8px", display: "inline-block", marginBottom: "12px" }}>
              טוען נתונים מ-Open-Meteo...
            </div>
          ) : weather.status === "success" ? (
            <div style={{ fontSize: "9.5px", fontWeight: 700, color: COLOR.success, background: "rgba(67,214,170,0.14)", border: `1px solid ${COLOR.success}40`, borderRadius: "999px", padding: "2px 8px", display: "inline-block", marginBottom: "12px" }}>
              נתונים חיים מ-Open-Meteo
            </div>
          ) : (
            <div style={{ fontSize: "9.5px", fontWeight: 700, color: COLOR.warning, background: "rgba(245,165,68,0.14)", border: `1px solid ${COLOR.warning}40`, borderRadius: "999px", padding: "2px 8px", display: "inline-block", marginBottom: "12px" }}>
              {isOnline ? "החיבור למקור מזג-האוויר נכשל" : "אין חיבור לאינטרנט"} — מוצגים נתוני הדגמה
            </div>
          )}
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "10px" }}>
            {[
              { label: "טמפרטורה", value: weather.data ? `${Math.round(weather.data.temperatureC ?? 0)}°` : "26°" },
              { label: "מרגיש כמו", value: weather.data?.feelsLikeC != null ? `${Math.round(weather.data.feelsLikeC)}°` : "29°" },
              { label: "מצב שמיים", value: weather.data?.condition ?? "בהיר" },
              { label: "סיכוי לגשם", value: weather.data?.precipitationProbabilityPercent != null ? `${weather.data.precipitationProbabilityPercent}%` : "10%" },
              { label: "מינימום", value: weather.data?.minTemperatureC != null ? `${Math.round(weather.data.minTemperatureC)}°` : "24°" },
              { label: "מקסימום", value: weather.data?.maxTemperatureC != null ? `${Math.round(weather.data.maxTemperatureC)}°` : "33°" },
            ].map((row) => (
              <div key={row.label} style={{ background: "#0e1930", border: `1px solid ${COLOR.cardBorder}`, borderRadius: "12px", padding: "10px" }}>
                <div style={{ fontSize: "11px", color: COLOR.textMuted }}>{row.label}</div>
                <div style={{ fontSize: "17px", fontWeight: 800, color: "#fff", marginTop: "2px" }}>{row.value}</div>
              </div>
            ))}
          </div>
        </BottomSheetPanel>
      ) : null}

      {/* פירוט האירוע הקרוב */}
      {timerDetailOpen && nearestTimerEvent
        ? (() => {
            const minutesLeft = nearestTimerEvent.offsetMinutes - demoClock;
            const tone = timerTone(minutesLeft);
            return (
              <BottomSheetPanel title="פרטי האירוע" onClose={() => setTimerDetailOpen(false)}>
                <div style={{ fontSize: "16px", fontWeight: 800, color: "#fff", marginBottom: "4px" }}>{nearestTimerEvent.label}</div>
                <div style={{ fontSize: "12.5px", color: COLOR.textSecondary, marginBottom: "12px" }}>{nearestTimerEvent.location}</div>
                <div style={{ fontSize: "22px", fontWeight: 800, color: tone.fg, marginBottom: "14px" }}>
                  {minutesLeft <= 0 ? "האירוע החל" : `בעוד ${formatMinutesLabel(minutesLeft)}`}
                </div>
                <div style={{ fontSize: "12.5px", color: "#e4e8f2", marginBottom: "14px" }}>
                  פעולה מומלצת: {nearestTimerEvent.kind === "pickup" ? "רדו ללובי בזמן כדי לא לפספס את ההסעה" : nearestTimerEvent.kind === "hotel_leave" ? "התארגנו ובצעו צ׳ק-אאוט מבעוד מועד" : "עברו לביקורת הביטחון מוקדם"}
                </div>
                <button
                  type="button"
                  onClick={() => setTimerDetailOpen(false)}
                  style={{ width: "100%", padding: "13px", borderRadius: "12px", background: COLOR.purple, border: "none", color: "#fff", fontSize: "14px", fontWeight: 800, cursor: "pointer" }}
                >
                  הבנתי
                </button>
              </BottomSheetPanel>
            );
          })()
        : null}

      {/* Toast משוב */}
      {toast ? (
        <div style={{ position: "fixed", insetInlineStart: "16px", insetInlineEnd: "16px", bottom: `calc(${NAV_HEIGHT}px + 16px)`, zIndex: 60, display: "flex", justifyContent: "center" }}>
          <div style={{ background: "rgba(15,22,42,0.97)", border: `1px solid ${COLOR.cardBorder}`, borderRadius: "14px", padding: "11px 18px", fontSize: "13px", color: "#fff", boxShadow: "0 10px 30px rgba(0,0,0,0.4)", maxWidth: "460px", textAlign: "center" }}>
            {toast}
          </div>
        </div>
      ) : null}
    </div>
  );
}
