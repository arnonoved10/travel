"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import {
  ScreenShell,
  BottomNav,
  Card,
  Badge,
  PrimaryButton,
  COLOR,
  SPACE,
  RADIUS,
  BellIcon,
  SearchIcon,
  PlusIcon,
  SuitcaseIcon,
  PinIcon,
  DocumentIcon,
} from "./design-system";
import { SideMenu } from "./side-menu";
import { FlagIcon } from "./country-currency-data";
import { JAPAN_TRIP, DEMO_TRIPS, daysUntil } from "./trips-data";

const QUICK_TOOLS = [
  { label: "טיול חדש", href: "/trips/new", icon: PlusIcon },
  { label: "פעילויות", href: `/trips/${JAPAN_TRIP.id}/plan`, icon: SuitcaseIcon },
  { label: "אתרים", href: "/nearby", icon: PinIcon },
  { label: "רשימת אריזה", href: "/packing", icon: DocumentIcon },
] as const;

const INSPIRATION = [
  { label: "איסלנד", countryCode: "IS" },
  { label: "פורטוגל", countryCode: "PT" },
  { label: "ניו זילנד", countryCode: "NZ" },
];

// שם-משתמש-דמו קבוע — עקבי בכל האפליקציה (גם במסך "פרופיל והגדרות").
export const DEMO_USER_NAME = "דניאל";

export default function HomePage() {
  const router = useRouter();
  const [menuOpen, setMenuOpen] = useState(false);
  const [query, setQuery] = useState("");
  const nextTripIn = daysUntil(JAPAN_TRIP.startDate);

  function submitSearch(e: React.FormEvent) {
    e.preventDefault();
    router.push(query.trim() ? `/search?q=${encodeURIComponent(query.trim())}` : "/search");
  }

  return (
    <ScreenShell>
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
        <button type="button" onClick={() => setMenuOpen(true)} aria-label="תפריט" style={{ width: "40px", height: "40px", borderRadius: "50%", background: COLOR.card, border: `1px solid ${COLOR.border}`, display: "flex", alignItems: "center", justifyContent: "center", cursor: "pointer" }}>
          <HamburgerIcon />
        </button>
        <div style={{ display: "flex", alignItems: "center", gap: SPACE.sm }}>
          <PlaneLogo />
          <span style={{ fontSize: "16px", fontWeight: 700, color: COLOR.textPrimary, letterSpacing: "0.3px" }}>TRIP MASTER</span>
        </div>
        <button type="button" onClick={() => router.push("/notifications")} aria-label="התראות" style={{ width: "40px", height: "40px", borderRadius: "50%", background: COLOR.card, border: `1px solid ${COLOR.border}`, display: "flex", alignItems: "center", justifyContent: "center", cursor: "pointer" }}>
          <BellIcon color={COLOR.textPrimary} />
        </button>
      </div>

      <div>
        <h1 style={{ margin: 0, fontSize: "22px", fontWeight: 700, color: COLOR.textPrimary }}>שלום {DEMO_USER_NAME}! 👋</h1>
        <p style={{ margin: "4px 0 0", fontSize: "13.5px", color: COLOR.textSecondary }}>לאן נטייל היום?</p>
      </div>

      <div style={{ position: "relative", borderRadius: `${RADIUS.card}px`, overflow: "hidden", height: "150px", background: `linear-gradient(160deg, ${COLOR.primary}55, ${COLOR.cardElevated} 70%)`, border: `1px solid ${COLOR.border}` }}>
        <form onSubmit={submitSearch} style={{ position: "absolute", insetInlineStart: SPACE.md, insetInlineEnd: SPACE.md, bottom: SPACE.md, display: "flex", alignItems: "center", gap: SPACE.sm, background: "rgba(7,23,45,0.85)", border: `1px solid ${COLOR.border}`, borderRadius: `${RADIUS.pill}px`, padding: "10px 14px" }}>
          <SearchIcon />
          <input
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="חפש יעד, פעילות, מלון..."
            style={{ flex: 1, background: "transparent", border: "none", outline: "none", color: COLOR.textPrimary, fontSize: "13px" }}
          />
        </form>
      </div>

      <div>
        <div style={{ fontSize: "14px", fontWeight: 700, color: COLOR.textPrimary, marginBottom: SPACE.sm }}>הטיול הבא שלך</div>
        <Card onClick={() => router.push(`/trips/${JAPAN_TRIP.id}`)} style={{ display: "flex", alignItems: "center", gap: SPACE.md }}>
          <FlagIcon countryCode={JAPAN_TRIP.countryCode} size={34} />
          <div style={{ flex: 1, minWidth: 0 }}>
            <div style={{ fontSize: "15px", fontWeight: 700, color: COLOR.textPrimary }}>{JAPAN_TRIP.name}</div>
            <div style={{ fontSize: "12px", color: COLOR.textSecondary, marginTop: "2px" }}>
              {formatDateHe(JAPAN_TRIP.startDate)} - {formatDateHe(JAPAN_TRIP.endDate)}
            </div>
          </div>
          <Badge tone={nextTripIn <= 0 ? "primary" : "success"}>{nextTripIn <= 0 ? "פעיל עכשיו" : `בעוד ${nextTripIn} ימים`}</Badge>
        </Card>
      </div>

      <div>
        <div style={{ fontSize: "14px", fontWeight: 700, color: COLOR.textPrimary, marginBottom: SPACE.sm }}>כלים מהירים</div>
        <div style={{ display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: SPACE.sm }}>
          {QUICK_TOOLS.map((tool) => (
            <button
              key={tool.label}
              type="button"
              onClick={() => router.push(tool.href)}
              style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: SPACE.xs, padding: `${SPACE.md}px ${SPACE.xs}px`, borderRadius: `${RADIUS.card}px`, background: COLOR.card, border: `1px solid ${COLOR.border}`, cursor: "pointer", minHeight: "44px" }}
            >
              <tool.icon color={COLOR.primaryLight} />
              <span style={{ fontSize: "10.5px", fontWeight: 600, color: COLOR.textSecondary, textAlign: "center" }}>{tool.label}</span>
            </button>
          ))}
        </div>
      </div>

      <div>
        <div style={{ fontSize: "14px", fontWeight: 700, color: COLOR.textPrimary, marginBottom: SPACE.sm }}>השראה בשבילך</div>
        <div style={{ display: "flex", gap: SPACE.sm, overflowX: "auto" }}>
          {INSPIRATION.map((item) => (
            <button
              key={item.countryCode}
              type="button"
              onClick={() => router.push(`/trips/new?country=${item.countryCode}`)}
              style={{
                flexShrink: 0,
                width: "104px",
                height: "78px",
                borderRadius: "14px",
                background: `linear-gradient(160deg, ${COLOR.cardElevated}, ${COLOR.card})`,
                border: `1px solid ${COLOR.border}`,
                display: "flex",
                flexDirection: "column",
                alignItems: "center",
                justifyContent: "center",
                gap: "6px",
                cursor: "pointer",
              }}
            >
              <FlagIcon countryCode={item.countryCode} size={22} />
              <span style={{ fontSize: "11px", fontWeight: 700, color: COLOR.textPrimary }}>{item.label}</span>
            </button>
          ))}
        </div>
      </div>

      <SideMenu open={menuOpen} onClose={() => setMenuOpen(false)} />
      <BottomNav active="home" />
    </ScreenShell>
  );
}

function formatDateHe(iso: string): string {
  const d = new Date(iso);
  return d.toLocaleDateString("he-IL", { day: "2-digit", month: "2-digit" });
}

function HamburgerIcon() {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke={COLOR.textPrimary} strokeWidth={1.8} strokeLinecap="round">
      <path d="M4 6h16M4 12h16M4 18h16" />
    </svg>
  );
}

function PlaneLogo() {
  return (
    <svg width="20" height="20" viewBox="0 0 24 24" fill={COLOR.primaryLight} style={{ transform: "rotate(45deg)" }}>
      <path d="M21 3 3 10.5l7 3 3 7L21 3z" />
    </svg>
  );
}
