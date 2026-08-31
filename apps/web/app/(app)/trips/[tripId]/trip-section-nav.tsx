"use client";

import Link from "next/link";
import { useEffect, useRef, useState } from "react";

type NavItem = { href: string; label: string; indent?: boolean; external?: boolean };
type NavGroup = { title: string; items: NavItem[] };

/**
 * "בצד...טבלה...ומשם בוחרים" (בקשת משתמש) — מכסה את כל מה שקיים בעמוד הטיול,
 * כולל פריטים מקוננים בתוך <details> סגורים (מלונות/טיסות/ארנק/הוצאות/וכו') —
 * לא רק הכותרות העליונות. עברה משכתוב 2026-08-28 (בקשת "ברור יותר, איפה לשים
 * כל דבר"): מרשימה שטוחה של 21 קישורים ל-4 קבוצות עם כותרת + קבוצה חמישית
 * נפרדת חזותית לקישורים-שעוזבים-את-העמוד (report/calendar/packing/
 * recommendations) — כדי שיהיה ברור מה נשאר כאן ומה קופץ למסך אחר. גם נוסף
 * scroll-spy (IntersectionObserver) שמדגיש את הסעיף-הנוכחי, כי בעמוד של
 * 1400+ שורות קל לאבד התמצאות.
 *
 * שני רכיבים נפרדים מאותה רשימת-קבוצות בדיוק: עמודה דביקה בצד לרוחב-מסך רחב
 * (Desktop, יושבת כאח בתוך אותה שורת-flex כמו עמודת-התוכן), ושורה אופקית-
 * גוללת דביקה למעלה לרוחב-מסך צר (Mobile, יושבת מעל שורת ה-flex, ברוחב מלא) —
 * אותה מוסכמה בדיוק כמו app-sidebar/app-bottom-nav ב-globals.css. קישורי-עוגן
 * ל-<details> סגור (BookingGroup) נפתחים אוטומטית דרך OpenDetailsFromHash.
 */
function buildGroups(tripId: string, hasSettleUp: boolean, hasRepeatVisits: boolean): NavGroup[] {
  return [
    {
      title: "כללי",
      items: [
        { href: "#trip-profile", label: "👤 פרופיל הטיול" },
        { href: "#geography", label: "🌍 מדינות וערים" },
        { href: "#memories", label: "📷 זכרונות" },
        { href: "#days", label: "📆 לוח ימי הטיול" },
        { href: "#planning", label: "🗺️ תכנון עתידי" },
        { href: "#places", label: "📍 מקומות" },
        ...(hasRepeatVisits ? [{ href: "#repeat-visits", label: "🔁 חזרת ליעד?", indent: true }] : []),
      ],
    },
    {
      title: "הזמנות",
      items: [
        { href: "#bookings", label: "🛎️ כל ההזמנות" },
        { href: "#hotels", label: "🏨 מלונות", indent: true },
        { href: "#flights", label: "✈️ טיסות", indent: true },
        { href: "#transport", label: "🚕 תחבורה", indent: true },
        { href: "#insurance", label: "🛡️ ביטוח", indent: true },
        { href: "#activities", label: "🎟️ אטרקציות וכרטיסים", indent: true },
        { href: "#car-rentals", label: "🚗 השכרת רכב/אופנוע", indent: true },
      ],
    },
    {
      title: "כספים",
      items: [
        { href: "#budget", label: "🎯 תקציב" },
        ...(hasSettleUp ? [{ href: "#settle-up", label: "💰 סגירת חשבונות" }] : []),
        { href: "#finances", label: "💳 כל הכספים" },
        { href: "#exchange-rates", label: "💱 שערי חליפין", indent: true },
        { href: "#wallet", label: "👛 ארנק", indent: true },
        { href: "#currency-converter", label: "🔁 ממיר מטבע", indent: true },
        { href: "#atm-finder", label: "🏧 כספומט קרוב", indent: true },
        { href: "#companions", label: "🧑‍🤝‍🧑 מלווים", indent: true },
        { href: "#companion-polls", label: "🗳️ הצבעות", indent: true },
        { href: "#share-link", label: "🔗 שיתוף מסלול", indent: true },
        { href: "#expenses", label: "🛍️ הוצאות/קניות", indent: true },
        { href: "#expense-documents", label: "📎 מסמכים על הוצאות", indent: true },
        { href: "#payments", label: "💵 תשלומים", indent: true },
        { href: "#tips", label: "🙏 דוח טיפים", indent: true },
        { href: "#refunds", label: "↩️ החזרים", indent: true },
        { href: "#deposits", label: "🔒 פיקדונות", indent: true },
        { href: "#wallet-tx-history", label: "🧾 היסטוריית ארנק", indent: true },
      ],
    },
    {
      title: "מסמכים והתראות",
      items: [
        { href: "#document-center", label: "📎 מרכז מסמכים" },
        { href: "#notification-prefs", label: "🔔 התראות" },
        { href: "#audit-log", label: "🕓 יומן שינויים" },
      ],
    },
    {
      title: "דוחות ומסכים נוספים",
      items: [
        { href: `/trips/${tripId}/report`, label: "📊 דוח טיול מלא ←", external: true },
        { href: `/trips/${tripId}/calendar`, label: "📅 לוח שנה ←", external: true },
        { href: `/trips/${tripId}/packing`, label: "🧳 רשימת אריזה ←", external: true },
        { href: `/trips/${tripId}/recommendations`, label: "✨ המלצות מקומות ←", external: true },
      ],
    },
  ];
}

/** מעקב-scroll פשוט: איזה עוגן-בעמוד (לא קישורי-דפים-אחרים) נראה כרגע הכי
 * למעלה במסך. לא משתמש ב-IntersectionObserver הרגיל (שמדווח "נכנס/יצא",
 * לא "הכי קרוב לראש") — בעמוד עם עשרות סעיפים בגדלים שונים זה נותן לפעמים
 * כמה סעיפים "פעילים" בו-זמנית; במקום זה עוקבים מי הכי קרוב לקו 96px מראש
 * המסך (מתחת לניווט הדביק), בדיקה ב-scroll עם throttle-בעזרת-rAF. */
function useActiveHash(ids: string[]): string | null {
  const [active, setActive] = useState<string | null>(null);
  const ticking = useRef(false);

  useEffect(() => {
    const elements = ids.map((id) => document.getElementById(id)).filter((el): el is HTMLElement => el !== null);
    if (elements.length === 0) return;

    function update() {
      const anchorLine = 96;
      let current: string | null = null;
      let bestDistance = -Infinity;
      for (const el of elements) {
        const top = el.getBoundingClientRect().top;
        if (top <= anchorLine && top > bestDistance) {
          bestDistance = top;
          current = el.id;
        }
      }
      setActive(current ?? elements[0]?.id ?? null);
      ticking.current = false;
    }

    function onScroll() {
      if (ticking.current) return;
      ticking.current = true;
      requestAnimationFrame(update);
    }

    update();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [ids.join(",")]);

  return active;
}

function groupItemIds(groups: NavGroup[]): string[] {
  return groups
    .flatMap((g) => g.items)
    .map((item) => item.href)
    .filter((href) => href.startsWith("#"))
    .map((href) => href.slice(1));
}

export function TripSectionNavDesktop({
  tripId,
  hasSettleUp,
  hasRepeatVisits,
}: {
  tripId: string;
  hasSettleUp: boolean;
  hasRepeatVisits: boolean;
}) {
  const groups = buildGroups(tripId, hasSettleUp, hasRepeatVisits);
  const activeHash = useActiveHash(groupItemIds(groups));

  return (
    <nav className="trip-section-nav-desktop" aria-label="ניווט מהיר בעמוד הטיול" style={desktopNavStyle}>
      {groups.map((group) => (
        <div key={group.title} style={{ marginBottom: "0.625rem" }}>
          <div style={groupTitleStyle}>{group.title}</div>
          {group.items.map((item) => {
            const isActive = activeHash !== null && item.href === `#${activeHash}`;
            return (
              <Link
                key={item.href}
                href={item.href}
                className="ui-card-interactive"
                style={{
                  ...linkStyle,
                  ...(item.indent ? indentStyle : null),
                  ...(item.external ? externalLinkStyle : null),
                  ...(isActive ? activeLinkStyle : null),
                }}
              >
                {item.label}
              </Link>
            );
          })}
        </div>
      ))}
    </nav>
  );
}

export function TripSectionNavMobile({
  tripId,
  hasSettleUp,
  hasRepeatVisits,
}: {
  tripId: string;
  hasSettleUp: boolean;
  hasRepeatVisits: boolean;
}) {
  const groups = buildGroups(tripId, hasSettleUp, hasRepeatVisits);
  const activeHash = useActiveHash(groupItemIds(groups));

  return (
    <nav className="trip-section-nav-mobile" aria-label="ניווט מהיר בעמוד הטיול" style={mobileNavStyle}>
      {groups.flatMap((group) => group.items).map((item) => {
        const isActive = activeHash !== null && item.href === `#${activeHash}`;
        return (
          <Link
            key={item.href}
            href={item.href}
            className="ui-card-interactive"
            style={{ ...chipStyle, ...(item.external ? externalChipStyle : null), ...(isActive ? activeChipStyle : null) }}
          >
            {item.label}
          </Link>
        );
      })}
    </nav>
  );
}

const desktopNavStyle: React.CSSProperties = {
  position: "sticky",
  top: "var(--space-4)",
  alignSelf: "flex-start",
  width: "230px",
  flexShrink: 0,
  flexDirection: "column",
  padding: "var(--space-3)",
  borderRadius: "var(--radius-lg)",
  border: "1px solid var(--color-border)",
  background: "var(--color-glass)",
  backdropFilter: "blur(12px)",
  WebkitBackdropFilter: "blur(12px)",
  boxShadow: "var(--shadow-sm)",
  maxHeight: "calc(100dvh - 2rem)",
  overflowY: "auto",
};

const groupTitleStyle: React.CSSProperties = {
  font: "var(--text-label)",
  color: "var(--color-text-muted)",
  textTransform: "uppercase",
  padding: "0 0.5rem",
  marginBottom: "0.25rem",
};

const mobileNavStyle: React.CSSProperties = {
  position: "sticky",
  top: 0,
  zIndex: 5,
  gap: "0.375rem",
  overflowX: "auto",
  padding: "0.625rem",
  marginInline: "-0.5rem",
  marginBottom: "-0.5rem",
  background: "var(--color-bg-elevated)",
  borderBottom: "1px solid var(--color-border)",
};

const linkStyle: React.CSSProperties = {
  display: "block",
  color: "var(--color-text-secondary)",
  textDecoration: "none",
  font: "var(--text-caption)",
  padding: "0.5rem 0.625rem",
  borderRadius: "var(--radius-md)",
};

const indentStyle: React.CSSProperties = { paddingInlineStart: "1.5rem", color: "var(--color-text-muted)" };

const externalLinkStyle: React.CSSProperties = { fontStyle: "italic" };

const activeLinkStyle: React.CSSProperties = {
  background: "color-mix(in srgb, var(--color-primary) 14%, transparent)",
  color: "var(--color-primary)",
  fontWeight: 700,
};

const chipStyle: React.CSSProperties = {
  flexShrink: 0,
  color: "var(--color-text-secondary)",
  textDecoration: "none",
  font: "var(--text-caption)",
  padding: "0.5rem 0.875rem",
  borderRadius: "var(--radius-full)",
  border: "1px solid var(--color-border)",
  background: "var(--color-surface)",
  whiteSpace: "nowrap",
};

const externalChipStyle: React.CSSProperties = { borderStyle: "dashed" };

const activeChipStyle: React.CSSProperties = {
  border: "1px solid var(--color-primary)",
  background: "color-mix(in srgb, var(--color-primary) 14%, transparent)",
  color: "var(--color-primary)",
  fontWeight: 700,
};
