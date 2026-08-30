"use client";

import { useRouter } from "next/navigation";

/**
 * בסיס-עיצוב משותף למסכי-התצוגה החדשים (מסלול/יומן/וכו') — נגזר מאותם
 * ערכים בדיוק כמו mobile-home-mock.tsx (אותו קו עיצובי, בקשת משתמש מפורשת),
 * אבל כקובץ נפרד ועצמאי לגמרי: mobile-home-mock.tsx (מסך-הבית המאושר) לא
 * מיובא ולא משתנה בשום צורה — "מסך הבית הנוכחי נשאר כפי שהוא".
 */

// עודכן לערכי-הצבע המדויקים של חבילת-העיצוב המחייבת (7 תמונות) — אותם
// שמות-מפתח כדי לא לשבור מסכים קיימים שכבר צורכים COLOR.* מכאן (map/
// planner/more), רק ערכי-hex חדשים. purple==primary, purpleDeep==primaryLight
// (שם-המפתח הישן נשאר, הערך תואם למפרט).
export const COLOR = {
  pageBg: "#020D1F",
  cardBg: "#07172D",
  cardBorder: "#1E3A5F",
  tealCardBg: "linear-gradient(160deg, rgba(124,58,237,0.18), #0B1D36)",
  blueCardBg: "linear-gradient(160deg, rgba(124,58,237,0.12), #0B1D36)",
  turquoise: "#34D399",
  purple: "#7C3AED",
  purpleDeep: "#A855F7",
  blueGlow: "rgba(124,58,237,0.16)",
  purpleGlow: "rgba(168,85,247,0.2)",
  textPrimary: "#F8FAFC",
  textSecondary: "#94A3B8",
  textMuted: "#7C8BA3",
  danger: "#EF4444",
  warning: "#F59E0B",
  success: "#34D399",
};

export const NAV_HEIGHT = 64;

export function Card({ children, style }: { children: React.ReactNode; style?: React.CSSProperties }) {
  return (
    <div
      style={{
        background: COLOR.cardBg,
        border: `1px solid ${COLOR.cardBorder}`,
        borderRadius: "16px",
        padding: "13px",
        ...style,
      }}
    >
      {children}
    </div>
  );
}

export function Ring({ percent, size = 56, color = COLOR.turquoise }: { percent: number; size?: number; color?: string }) {
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

// placeholder נייטרלי לאייקונים — עד שתסופק חבילת-האייקונים החדשה (בקשת
// משתמש מפורשת: "אל תחליף את האייקונים הקיימים כרגע... השאר רכיבים ברורים").
export function IconSlot({ size = 22 }: { size?: number }) {
  return (
    <div
      style={{
        width: size,
        height: size,
        borderRadius: "30%",
        background: "rgba(255,255,255,0.08)",
        border: "1px dashed rgba(255,255,255,0.25)",
        flexShrink: 0,
      }}
    />
  );
}

/** כותרת-מסך משותפת: חץ-חזרה + כותרת. אותה מוסכמה בכל מסכי-התצוגה החדשים. */
export function ScreenHeader({ title, subtitle, action }: { title: string; subtitle?: string; action?: React.ReactNode }) {
  const router = useRouter();
  return (
    <div style={{ display: "flex", alignItems: "center", gap: "12px" }}>
      <button
        type="button"
        onClick={() => router.back()}
        aria-label="חזרה"
        style={{
          width: "36px",
          height: "36px",
          borderRadius: "50%",
          background: COLOR.cardBg,
          border: `1px solid ${COLOR.cardBorder}`,
          color: COLOR.textPrimary,
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          flexShrink: 0,
          cursor: "pointer",
        }}
      >
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2.2} strokeLinecap="round" strokeLinejoin="round">
          <path d="M15 5 8 12l7 7" />
        </svg>
      </button>
      <div style={{ minWidth: 0, flex: 1 }}>
        <h1 style={{ margin: 0, fontSize: "17px", fontWeight: 800, color: "#fff", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{title}</h1>
        {subtitle ? <p style={{ margin: "1px 0 0", fontSize: "11px", color: COLOR.textSecondary }}>{subtitle}</p> : null}
      </div>
      {action}
    </div>
  );
}

/**
 * עודכן: לא עוד תפריט-6-פריטים ישן (בית/מסלול/יומן/מפה/ארנק/עוד) — חבילת-
 * העיצוב המחייבת קובעת סרגל-ניווט גלובלי אחד קבוע (בית/הטיולים-שלי/+/
 * התראות/פרופיל) בכל האפליקציה ("אל תשנה את מיקום סרגל הניווט"). כדי
 * שמסכים ישנים שעדיין מייבאים BottomNav מכאן (map/planner/more) יציגו
 * בדיוק אותו סרגל כמו כל שאר האפליקציה — עטיפה דקה סביב הרכיב הגלובלי,
 * לא מימוש כפול. הפרמטר active מתעלם מערכי-המסכים-הישנים (route/planner/
 * map/wallet/more אינם עוד לשוניות בסרגל) ומוצג תמיד בלי משבצת פעילה.
 */
export { BottomNav } from "./design-system";

/** תג-מצב קטן (מתוכנן/בוצע/בוטל/נדחה, מאושר/ממתין, וכו') — שימוש חוזר בכל
 * מסכי-התצוגה החדשים. */
export function StatusChip({ label, tone }: { label: string; tone: "success" | "warning" | "danger" | "muted" | "purple" }) {
  const colors: Record<string, string> = {
    success: COLOR.success,
    warning: COLOR.warning,
    danger: COLOR.danger,
    muted: COLOR.textMuted,
    purple: COLOR.purple,
  };
  const c = colors[tone];
  return (
    <span
      style={{
        display: "inline-flex",
        alignItems: "center",
        padding: "3px 9px",
        borderRadius: "999px",
        background: `color-mix(in srgb, ${c} 18%, transparent)`,
        border: `1px solid ${c}55`,
        color: c,
        fontSize: "10.5px",
        fontWeight: 700,
        whiteSpace: "nowrap",
      }}
    >
      {label}
    </span>
  );
}

/** מעטפת-מסך משותפת: רקע זהה למסך-הבית, container ברוחב-מקסימלי, ריפוד
 * תחתון שמפנה מקום לתפריט הקבוע. */
export function ScreenShell({ children }: { children: React.ReactNode }) {
  return (
    <div
      style={{
        width: "100%",
        minHeight: "100vh",
        background: `radial-gradient(50rem 26rem at 92% -4%, ${COLOR.blueGlow}, transparent 55%), radial-gradient(40rem 24rem at -6% 40%, ${COLOR.purpleGlow}, transparent 55%), ${COLOR.pageBg}`,
        color: COLOR.textPrimary,
        fontFamily: "var(--font-heebo), sans-serif",
        direction: "rtl",
      }}
    >
      <div
        style={{
          display: "flex",
          flexDirection: "column",
          gap: "12px",
          padding: `14px 16px ${NAV_HEIGHT + 20}px`,
          maxWidth: "480px",
          width: "100%",
          marginInline: "auto",
        }}
      >
        {children}
      </div>
    </div>
  );
}
