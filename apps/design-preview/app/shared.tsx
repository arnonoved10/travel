"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";

/**
 * בסיס-עיצוב משותף למסכי-התצוגה החדשים (מסלול/יומן/וכו') — נגזר מאותם
 * ערכים בדיוק כמו mobile-home-mock.tsx (אותו קו עיצובי, בקשת משתמש מפורשת),
 * אבל כקובץ נפרד ועצמאי לגמרי: mobile-home-mock.tsx (מסך-הבית המאושר) לא
 * מיובא ולא משתנה בשום צורה — "מסך הבית הנוכחי נשאר כפי שהוא".
 */

export const COLOR = {
  pageBg: "#050f24",
  cardBg: "#0a1830",
  cardBorder: "rgba(120, 150, 200, 0.16)",
  tealCardBg: "linear-gradient(160deg, rgba(5,50,60,0.55), #0a1830)",
  blueCardBg: "linear-gradient(160deg, rgba(12,40,80,0.55), #0a1830)",
  turquoise: "#43d6aa",
  purple: "#8a5adf",
  purpleDeep: "#6642b9",
  blueGlow: "rgba(59,130,246,0.16)",
  purpleGlow: "rgba(138,90,223,0.2)",
  textPrimary: "#f4f6fb",
  textSecondary: "#9aa3bd",
  textMuted: "#6b7290",
  danger: "#ef6f61",
  warning: "#f5a544",
  success: "#43d6aa",
};

export const NAV_HEIGHT = 64;

export function Card({ children, style }: { children: React.ReactNode; style?: React.CSSProperties }) {
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

const NAV_ITEMS = [
  { href: "/", label: "בית", key: "home" },
  { href: "/route", label: "מסלול", key: "route" },
  { href: "/planner", label: "יומן", key: "planner" },
  { href: "/map", label: "מפה", key: "map" },
  { href: "/wallet", label: "ארנק", key: "wallet" },
  { href: "/more", label: "עוד", key: "more" },
] as const;

/** תפריט-תחתון משותף למסכי-התצוגה החדשים (route/planner/wallet/וכו') —
 * זהה ויזואלית לתפריט של מסך-הבית, אבל רכיב-נפרד: מסך-הבית לא נוגע ולא
 * מייבא מכאן (נשאר בדיוק כפי שהוא, בלי שינוי קוד). קישורי-אמת (Link) —
 * "כל כפתורי הניווט יעבדו ויעברו למסך המתאים". "יומן" נוסף כפריט עצמאי
 * (בקשה מפורשת) — לא עוד תלוי בלחיצה על תחנה במסך-המסלול. מסכים שעדיין לא
 * נבנו (מפה/ארנק/עוד) פשוט לא קיימים עדיין כ-route. */
export function BottomNav({ active }: { active: "home" | "route" | "planner" | "map" | "wallet" | "more" }) {
  return (
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
        WebkitBackdropFilter: "blur(16px)",
        borderTop: "1px solid rgba(255,255,255,0.1)",
        boxShadow: "0 -8px 24px rgba(0,0,0,0.35)",
        direction: "ltr",
        zIndex: 20,
      }}
    >
      {NAV_ITEMS.map((item) => {
        const isActive = item.key === active;
        return (
          <Link
            key={item.key}
            href={item.href}
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
              textDecoration: "none",
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
                background: isActive ? "rgba(138,90,223,0.22)" : "transparent",
                boxShadow: isActive ? "0 0 0 1px rgba(168,128,245,0.35), 0 0 12px rgba(138,90,223,0.5)" : "none",
                opacity: isActive ? 1 : 0.72,
              }}
            >
              <IconSlot size={21} />
            </span>
            <span style={{ fontSize: "10px", fontWeight: isActive ? 700 : 500, color: isActive ? COLOR.purple : "#a7afc9" }}>{item.label}</span>
          </Link>
        );
      })}
    </div>
  );
}

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
        fontFamily: "var(--font-rubik), sans-serif",
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
