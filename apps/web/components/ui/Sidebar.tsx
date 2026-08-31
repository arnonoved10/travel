"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { ROUTE_ICONS, ROUTE_EMOJI } from "@/components/nav-icons";
import { useTheme } from "@/components/theme-provider";
import { Avatar } from "./Avatar";
import { ICON_SIZE, ICON_STROKE_WIDTH } from "./tokens";

/** אותו path בדיוק כמו הלוגו במוקאפ (Trip Master Dashboard, Claude Design 2026-08-27) —
 * לא אייקון-ספרייה, SVG מקורי מהעיצוב. */
function LogoMark() {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="#fff" strokeWidth={2.4} strokeLinecap="round" strokeLinejoin="round" style={{ width: 20, height: 20 }} aria-hidden>
      <path d="M4 4l7.5 8.5L19 4" />
      <path d="M11.5 12.5V20" />
    </svg>
  );
}

export interface SidebarGroup {
  title: string;
  items: {
    href: string;
    label: string;
    /** דורס את ROUTE_EMOJI[href] — נדרש לפריטים דינמיים כמו "ארנק" שה-href שלהם
     * כולל tripId משתנה, כך שאין להם מפתח קבוע ב-ROUTE_EMOJI/ROUTE_ICONS. */
    emoji?: string;
    /** false לפריטים שמצביעים על עמוד כבד/דינמי (כמו טיול ספציפי) — הסיידבר
     * קבוע-נראה בכל עמוד, אז Next.js היה מבצע prefetch לקישור הזה מחדש בכל
     * ניווט לכל עמוד באפליקציה. כברירת-מחדל (undefined) מתנהג כמו prefetch
     * רגיל של Next.js (true). */
    prefetch?: boolean;
  }[];
}

/** Desktop-only (see .app-sidebar in globals.css, hidden under 900px). Active item gets a
 * subtle brand-gradient background, a lit icon, and a soft glow — per the redesign brief. */
export function Sidebar({ groups, userLabel }: { groups: SidebarGroup[]; userLabel: string }) {
  const pathname = usePathname();
  const { resolvedMode, setPrefs } = useTheme();
  const isDark = resolvedMode === "dark";

  return (
    <nav
      aria-label="ניווט ראשי"
      className="app-sidebar"
      style={{
        flexDirection: "column",
        width: "236px",
        flexShrink: 0,
        borderInlineEnd: "1px solid var(--color-border)",
        background: "linear-gradient(180deg, #0d1222 0%, #080b16 54%, #060811 100%)",
        color: "#f4f6ff",
        boxShadow: "-24px 0 70px rgba(0,0,0,.2)",
        padding: "var(--space-5) var(--space-3)",
        gap: "var(--space-6)",
        height: "100dvh",
        position: "sticky",
        top: 0,
        overflowY: "auto",
      }}
    >
      <Link
        href="/dashboard"
        style={{ display: "flex", alignItems: "center", gap: "0.625rem", textDecoration: "none", padding: "0 var(--space-2)" }}
      >
        <div
          style={{
            width: "36px",
            height: "36px",
            flexShrink: 0,
            borderRadius: "11px",
            background: "linear-gradient(150deg, var(--color-primary), var(--color-accent-blue))",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            color: "#fff",
            boxShadow: "var(--glow-brand)",
          }}
        >
          <LogoMark />
        </div>
        <span style={{ lineHeight: 1 }}>
          <span style={{ display: "block", fontWeight: 800, fontSize: "0.875rem", letterSpacing: "0.02em", color: "var(--color-text-primary)" }}>TRIP</span>
          <span style={{ display: "block", fontWeight: 800, fontSize: "0.875rem", letterSpacing: "0.14em", color: "var(--color-text-secondary)" }}>MASTER</span>
        </span>
      </Link>

      {/* רשימה שטוחה-רציפה אחת, בלי כותרות-קבוצה — לפי המוקאפ (Trip Master
          Dashboard, Claude Design): כותרות-האמת של group.title עדיין קיימות
          בנתונים (buildSidebarGroups ב-layout.tsx) ומשמשות ל-aria/מבנה, רק לא
          מוצגות ויזואלית — אין כאן איבוד של שום פריט-ניווט אמיתי. */}
      <div style={{ display: "flex", flexDirection: "column", gap: "0.125rem", flex: 1 }}>
        {groups.map((group) => (
          <div key={group.title} role="group" aria-label={group.title} style={{ display: "flex", flexDirection: "column", gap: "0.125rem" }}>
            {group.items.map((item) => {
              const emoji = item.emoji ?? ROUTE_EMOJI[item.href];
              const Icon = ROUTE_ICONS[item.href];
              const active = pathname === item.href || pathname.startsWith(`${item.href}/`);
              return (
                <Link
                  key={item.href}
                  href={item.href}
                  prefetch={item.prefetch}
                  style={{
                    display: "flex",
                    alignItems: "center",
                    gap: "0.6875rem",
                    height: "2.875rem",
                    padding: "0 0.625rem",
                    borderRadius: "13px",
                    textDecoration: "none",
                    fontSize: "0.84375rem",
                    color: active ? "#fff" : "var(--color-text-secondary)",
                    background: active ? "var(--gradient-brand)" : "transparent",
                    border: active ? "1px solid rgba(255,255,255,.14)" : "1px solid transparent",
                    boxShadow: active ? "var(--glow-brand)" : "none",
                    fontWeight: active ? 600 : 500,
                    transition: "all var(--duration-base) var(--ease-out)",
                  }}
                >
                  {emoji ? (
                    <span aria-hidden style={{ fontSize: "1.375rem", lineHeight: 1, width: "1.6875rem", flexShrink: 0, textAlign: "center" }}>
                      {emoji}
                    </span>
                  ) : Icon ? (
                    <Icon size={ICON_SIZE.md} strokeWidth={ICON_STROKE_WIDTH} aria-hidden />
                  ) : null}
                  {item.label}
                </Link>
              );
            })}
          </div>
        ))}
      </div>

      <div style={{ display: "flex", flexDirection: "column", gap: "var(--space-2)", borderTop: "1px solid var(--color-border)", paddingTop: "var(--space-4)" }}>
        <div style={{ display: "flex", alignItems: "center", gap: "0.625rem", padding: "0 var(--space-3)" }}>
          <Avatar label={userLabel} size={34} href="/settings" />
          <div style={{ minWidth: 0 }}>
            <div style={{ font: "var(--text-caption)", fontWeight: 600, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
              {userLabel}
            </div>
          </div>
        </div>

        <button
          type="button"
          onClick={() => setPrefs({ mode: isDark ? "light" : "dark" })}
          style={{
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            gap: "0.75rem",
            padding: "0.625rem var(--space-3)",
            borderRadius: "var(--radius-md)",
            border: "none",
            background: "transparent",
            color: "var(--color-text-secondary)",
            cursor: "pointer",
            width: "100%",
          }}
        >
          <span style={{ display: "flex", alignItems: "center", gap: "0.75rem" }}>
            <span aria-hidden style={{ fontSize: "1.1875rem", lineHeight: 1, width: "1.5rem", textAlign: "center" }}>🌙</span>
            מצב כהה
          </span>
          <span
            aria-hidden
            style={{
              width: "2.25rem",
              height: "1.25rem",
              borderRadius: "var(--radius-full)",
              background: isDark ? "var(--gradient-brand)" : "var(--color-surface)",
              border: "1px solid var(--color-border)",
              position: "relative",
              transition: "background var(--duration-base) var(--ease-out)",
            }}
          >
            <span
              style={{
                position: "absolute",
                top: "1px",
                insetInlineStart: isDark ? "calc(100% - 1.125rem)" : "1px",
                width: "1rem",
                height: "1rem",
                borderRadius: "50%",
                background: "#fff",
                transition: "inset-inline-start var(--duration-base) var(--ease-out)",
              }}
            />
          </span>
        </button>

        <Link
          href="/settings"
          style={{
            display: "flex",
            alignItems: "center",
            gap: "0.75rem",
            padding: "0.625rem var(--space-3)",
            borderRadius: "var(--radius-md)",
            textDecoration: "none",
            color: pathname === "/settings" ? "#fff" : "var(--color-text-secondary)",
            background: pathname === "/settings" ? "var(--gradient-brand)" : "transparent",
          }}
        >
          <span aria-hidden style={{ fontSize: "1.1875rem", lineHeight: 1, width: "1.5rem", textAlign: "center" }}>⚙️</span>
          הגדרות
        </Link>
      </div>
    </nav>
  );
}
