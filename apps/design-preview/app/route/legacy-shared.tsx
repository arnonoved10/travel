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

export function LegacyIconSlot({ size = 22 }: { size?: number }) {
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
  { href: "/", label: "בית", key: "home" },
  { href: "/route", label: "מסלול", key: "route" },
  { href: "/planner", label: "יומן", key: "planner" },
  { href: "/map", label: "מפה", key: "map" },
  { href: "/wallet", label: "ארנק", key: "wallet" },
  { href: "/more", label: "עוד", key: "more" },
] as const;

export function LegacyBottomNav({ active }: { active: "home" | "route" | "planner" | "map" | "wallet" | "more" }) {
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
              <LegacyIconSlot size={21} />
            </span>
            <span style={{ fontSize: "10px", fontWeight: isActive ? 700 : 500, color: isActive ? LEGACY_COLOR.purple : "#a7afc9" }}>{item.label}</span>
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
