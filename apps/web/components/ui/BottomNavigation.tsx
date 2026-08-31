"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { ROUTE_ICONS } from "@/components/nav-icons";
import { MobileMoreSheet } from "@/components/mobile-more-sheet";
import { ICON_SIZE, ICON_STROKE_WIDTH } from "./tokens";

const PRIMARY_ITEMS = [
  { href: "/dashboard", label: "בית" },
  { href: "/trips", label: "טיולים" },
  { href: "/map", label: "מפה" },
  { href: "/places", label: "מקומות" },
];

// עודכן 2026-08-28: "עכשיו" מוזג ל"היום שלי", "כרטיסי תשלום" התאחד לתוך
// "אנשי קשר ופרטים" — ובמקומם נוספו 3 יעדים שהיו קיימים בסרגל-הצד של
// דסקטופ אבל לא נגישים בכלל במובייל (בקשת משתמש: א-סימטריה בין הפלטפורמות).
const MORE_ITEMS = [
  { href: "/today", label: "היום שלי" },
  { href: "/contacts", label: "אנשי קשר ופרטים" },
  { href: "/stats", label: "סטטיסטיקות" },
  { href: "/emergency", label: "חירום" },
  { href: "/trash", label: "פח" },
  { href: "/settings", label: "הגדרות" },
];

export function BottomNavigation() {
  const pathname = usePathname();

  return (
    <nav
      aria-label="ניווט תחתון"
      className="app-bottom-nav"
      style={{
        position: "fixed",
        insetInlineStart: 0,
        insetInlineEnd: 0,
        bottom: 0,
        width: "100%",
        maxWidth: "100vw",
        overflowX: "hidden",
        boxSizing: "border-box",
        justifyContent: "space-around",
        background: "var(--color-surface-elevated)",
        backdropFilter: "blur(20px)",
        WebkitBackdropFilter: "blur(20px)",
        borderTop: "1px solid var(--color-border)",
        padding: "0.5rem 0 max(0.5rem, env(safe-area-inset-bottom))",
        zIndex: 30,
      }}
    >
      {PRIMARY_ITEMS.map((item) => {
        const Icon = ROUTE_ICONS[item.href];
        const active = pathname === item.href || pathname.startsWith(`${item.href}/`);
        return (
          <Link
            key={item.href}
            href={item.href}
            style={{
              display: "flex",
              flexDirection: "column",
              alignItems: "center",
              gap: "0.125rem",
              padding: "0.25rem 0.125rem",
              flex: "1 1 0",
              minWidth: 0,
              color: active ? "var(--color-primary)" : "var(--color-text-muted)",
              textDecoration: "none",
            }}
          >
            {Icon ? (
              <Icon
                size={ICON_SIZE.lg}
                strokeWidth={ICON_STROKE_WIDTH}
                aria-hidden
                style={{ filter: active ? "drop-shadow(var(--glow-primary))" : "none" }}
              />
            ) : null}
            <span
              style={{
                font: "var(--text-caption)",
                fontSize: "0.6875rem",
                maxWidth: "100%",
                overflow: "hidden",
                textOverflow: "ellipsis",
                whiteSpace: "nowrap",
              }}
            >
              {item.label}
            </span>
          </Link>
        );
      })}
      <MobileMoreSheet items={MORE_ITEMS} />
    </nav>
  );
}
