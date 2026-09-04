"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";

/**
 * גרסה מבודדת ומקומית (רק למסך /route) של רכיבי-shared.tsx המקוריים,
 * כפי שהיו בנקודת השמירה a2b2501 — לפני ש-shared.tsx עבר לפלטת-הצבעים
 * ולסרגל-הניווט של מערכת-העיצוב החדשה (design-system.tsx). לא נוגעת
 * ב-shared.tsx/design-system.tsx הקיימים ולא משפיעה על שום מסך אחר —
 * לפי דרישה מפורשת "צור רכיבים נפרדים, אל תדרוס את מערכת העיצוב".
 *
 * הבדל-הכרחי היחיד מהמקור: fontFamily מצביע ל---font-heebo (לא
 * --font-rubik) כי גופן Rubik כבר לא נטען ב-layout.tsx (הוחלף ב-Heebo
 * במסגרת מערכת-העיצוב החדשה) — לא ניתן לשנות את layout.tsx (משותף לכל
 * המסכים) בלי להפר "אל תשנה מסכים אחרים". Heebo קרוב מאוד ויזואלית.
 */

export const LEGACY_COLOR = {
  pageBg: "#050f24",
  cardBg: "#0a1830",
  cardBorder: "rgba(120, 150, 200, 0.16)",
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

export const LEGACY_NAV_HEIGHT = 64;

export function LegacyCard({ children, style, onClick }: { children: React.ReactNode; style?: React.CSSProperties; onClick?: () => void }) {
  return (
    <div
      onClick={onClick}
      style={{
        background: LEGACY_COLOR.cardBg,
        border: `1px solid ${LEGACY_COLOR.cardBorder}`,
        borderRadius: "20px",
        padding: "13px",
        ...style,
      }}
    >
      {children}
    </div>
  );
}

/**
 * אייקוני-SVG מצוירים (לא placeholder מקווקו) — באותה שפה חזותית של
 * design-system.tsx (stroke, viewBox 24x24, קצוות עגולים) אך מוגדרים כאן
 * באופן עצמאי, לפי אותו עיקרון-בידוד של הקובץ הזה כולו: לא מייבאים
 * מ-design-system.tsx כדי לא ליצור תלות בין שתי מערכות-העיצוב.
 */
function legacyIconProps(color: string, size: number) {
  return { width: size, height: size, viewBox: "0 0 24 24", fill: "none", stroke: color, strokeWidth: 1.8, strokeLinecap: "round" as const, strokeLinejoin: "round" as const };
}
export function LegacyHomeIcon({ color = "#fff", size = 21 }: { color?: string; size?: number }) {
  return (
    <svg {...legacyIconProps(color, size)}>
      <path d="M4 11.5 12 4l8 7.5" />
      <path d="M6 10v9a1 1 0 0 0 1 1h3v-6h4v6h3a1 1 0 0 0 1-1v-9" />
    </svg>
  );
}
export function LegacyRouteIcon({ color = "#fff", size = 21 }: { color?: string; size?: number }) {
  return (
    <svg {...legacyIconProps(color, size)}>
      <path d="M5 19c0-3.5 2-5.5 4.5-5.5S13 15.5 13 12s2-5.5 4.5-5.5" />
      <circle cx="5" cy="19" r="1.6" fill={color} stroke="none" />
      <circle cx="19" cy="5.5" r="1.6" fill={color} stroke="none" />
    </svg>
  );
}
export function LegacyCalendarIcon({ color = "#fff", size = 21 }: { color?: string; size?: number }) {
  return (
    <svg {...legacyIconProps(color, size)}>
      <rect x="3.5" y="5" width="17" height="16" rx="2" />
      <path d="M3.5 10h17M8 3v4M16 3v4" />
    </svg>
  );
}
export function LegacyMapPinIcon({ color = "#fff", size = 21 }: { color?: string; size?: number }) {
  return (
    <svg {...legacyIconProps(color, size)}>
      <path d="M12 21s7-6.2 7-11.5a7 7 0 0 0-14 0C5 14.8 12 21 12 21z" />
      <circle cx="12" cy="9.5" r="2.4" />
    </svg>
  );
}
export function LegacyWalletIcon({ color = "#fff", size = 21 }: { color?: string; size?: number }) {
  return (
    <svg {...legacyIconProps(color, size)}>
      <path d="M4 7a2 2 0 0 1 2-2h11a2 2 0 0 1 2 2v2h1a1 1 0 0 1 1 1v7a2 2 0 0 1-2 2H6a2 2 0 0 1-2-2z" />
      <circle cx="15.2" cy="13.5" r="1.3" fill={color} stroke="none" />
    </svg>
  );
}
export function LegacyMoreIcon({ color = "#fff", size = 21 }: { color?: string; size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill={color}>
      <circle cx="12" cy="6" r="1.7" />
      <circle cx="12" cy="12" r="1.7" />
      <circle cx="12" cy="18" r="1.7" />
    </svg>
  );
}
export function LegacyPlusIcon({ color = "#fff", size = 15 }: { color?: string; size?: number }) {
  return (
    <svg {...legacyIconProps(color, size)}>
      <path d="M12 5v14M5 12h14" />
    </svg>
  );
}
export function LegacyReorderIcon({ color = "#fff", size = 15 }: { color?: string; size?: number }) {
  return (
    <svg {...legacyIconProps(color, size)}>
      <path d="M8 6 5 9m0 0 3 3M5 9h11" />
      <path d="M16 18l3-3m0 0-3-3m3 3H8" />
    </svg>
  );
}
export function LegacyNavigateIcon({ color = "#fff", size = 15 }: { color?: string; size?: number }) {
  return (
    <svg {...legacyIconProps(color, size)}>
      <path d="M12 2 4 21l8-4 8 4z" />
    </svg>
  );
}
export function LegacyExpenseIcon({ color = "#fff", size = 18 }: { color?: string; size?: number }) {
  return (
    <svg {...legacyIconProps(color, size)}>
      <path d="M7 3h7l4 4v14a1 1 0 0 1-1 1H7a1 1 0 0 1-1-1V4a1 1 0 0 1 1-1z" />
      <path d="M14 3v4h4M9 12h6M9 16h6" />
    </svg>
  );
}
export function LegacyAddMoneyIcon({ color = "#fff", size = 16 }: { color?: string; size?: number }) {
  return (
    <svg {...legacyIconProps(color, size)}>
      <circle cx="12" cy="12" r="8" />
      <path d="M12 8v8M8 12h8" />
    </svg>
  );
}
export function LegacyConvertIcon({ color = "#fff", size = 16 }: { color?: string; size?: number }) {
  return (
    <svg {...legacyIconProps(color, size)}>
      <path d="M4 8h13l-3-3m3 3-3 3" />
      <path d="M20 16H7l3 3m-3-3 3-3" />
    </svg>
  );
}
export function LegacyDepositIcon({ color = "#fff", size = 16 }: { color?: string; size?: number }) {
  return (
    <svg {...legacyIconProps(color, size)}>
      <path d="M12 3l7 3v6c0 4.5-3 7.5-7 9-4-1.5-7-4.5-7-9V6z" />
      <path d="m9 12 2 2 4-4" />
    </svg>
  );
}

export function LegacyScreenHeader({ title, subtitle, action }: { title: string; subtitle?: string; action?: React.ReactNode }) {
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
          background: LEGACY_COLOR.cardBg,
          border: `1px solid ${LEGACY_COLOR.cardBorder}`,
          color: LEGACY_COLOR.textPrimary,
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
        {subtitle ? <p style={{ margin: "1px 0 0", fontSize: "11px", color: LEGACY_COLOR.textSecondary }}>{subtitle}</p> : null}
      </div>
      {action}
    </div>
  );
}

const LEGACY_NAV_ITEMS = [
  { href: "/", label: "בית", key: "home", icon: LegacyHomeIcon },
  { href: "/route", label: "מסלול", key: "route", icon: LegacyRouteIcon },
  { href: "/planner", label: "יומן", key: "planner", icon: LegacyCalendarIcon },
  { href: "/map", label: "מפה", key: "map", icon: LegacyMapPinIcon },
  { href: "/wallet", label: "ארנק", key: "wallet", icon: LegacyWalletIcon },
  { href: "/expenses", label: "הוצאות", key: "expenses", icon: LegacyExpenseIcon },
  { href: "/more", label: "עוד", key: "more", icon: LegacyMoreIcon },
] as const;

export function LegacyBottomNav({ active }: { active: "home" | "route" | "planner" | "map" | "wallet" | "expenses" | "more" }) {
  return (
    <div
      style={{
        position: "fixed",
        insetInlineStart: 0,
        insetInlineEnd: 0,
        bottom: 0,
        minHeight: `${LEGACY_NAV_HEIGHT}px`,
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
      {LEGACY_NAV_ITEMS.map((item) => {
        const isActive = item.key === active;
        const iconColor = isActive ? LEGACY_COLOR.purple : "#a7afc9";
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
                opacity: isActive ? 1 : 0.85,
              }}
            >
              <item.icon color={iconColor} size={21} />
            </span>
            <span style={{ fontSize: "10px", fontWeight: isActive ? 700 : 500, color: iconColor }}>{item.label}</span>
          </Link>
        );
      })}
    </div>
  );
}

export function LegacyStatusChip({ label, tone }: { label: string; tone: "success" | "warning" | "danger" | "muted" | "purple" }) {
  const colors: Record<string, string> = {
    success: LEGACY_COLOR.success,
    warning: LEGACY_COLOR.warning,
    danger: LEGACY_COLOR.danger,
    muted: LEGACY_COLOR.textMuted,
    purple: LEGACY_COLOR.purple,
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

export function LegacyScreenShell({ children }: { children: React.ReactNode }) {
  return (
    <div
      style={{
        width: "100%",
        minHeight: "100vh",
        background: `radial-gradient(50rem 26rem at 92% -4%, ${LEGACY_COLOR.blueGlow}, transparent 55%), radial-gradient(40rem 24rem at -6% 40%, ${LEGACY_COLOR.purpleGlow}, transparent 55%), ${LEGACY_COLOR.pageBg}`,
        color: LEGACY_COLOR.textPrimary,
        fontFamily: "var(--font-assistant), sans-serif",
        direction: "rtl",
      }}
    >
      <div
        style={{
          display: "flex",
          flexDirection: "column",
          gap: "12px",
          padding: `14px 16px ${LEGACY_NAV_HEIGHT + 20}px`,
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
