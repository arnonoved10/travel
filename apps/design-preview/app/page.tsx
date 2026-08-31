"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import Image from "next/image";
import {
  ScreenShell,
  BottomNav,
  Card,
  Badge,
  COLOR,
  SPACE,
  RADIUS,
  Ltr,
  BellIcon,
  SearchIcon,
  PlusIcon,
  DocumentIcon,
  PinIcon,
  SuitcaseIcon,
  ChevronIcon,
} from "./design-system";
import { SideMenu } from "./side-menu";
import { FlagIcon } from "./country-currency-data";
import { JAPAN_TRIP, daysUntil } from "./trips-data";

/**
 * דף הבית — עדכון לפי משוב-תיקון שני על תמונת-הייחוס:
 * 1. תמונת-הזוהר-הצפוני הפכה לתצלום-טבע אמיתי (לא איור-וקטורי) —
 *    apps/design-preview/public/photos/aurora-mountains.jpg, תצלום של
 *    הר-הקרח אייאפיאטלايוקוץ' באיסלנד מתחת לזוהר-צפוני. מקור: Wikimedia
 *    Commons, "L'Eyjafjallajökull sous les aurores boréales" מאת Sébastien
 *    Giguère (Thaumazein1), רישיון CC BY 4.0 — קרדיט מוצג בתמונה עצמה.
 * 2-6. הוגדלו משמעותית: אזור-התמונה, הברכה, כרטיס-הטיול (כולל התמונה
 *    שבו), כפתורי "כלים מהירים", וכרטיסי "השראה בשבילך".
 * 7. סדר כרטיסי-ההשראה אומת שוב מול התמונה: איסלנד-פורטוגל-ניו זילנד
 *    משמאל לימין.
 * 8. אייקון-העוזר של הכפתור המרחף הוגדל להבלטה ברורה יותר כסמל-קסם/AI.
 * 9-10. לא נכפה יותר "הכל בתוך 844px" — התוכן מקבל את הגודל הטבעי שלו
 *    וקורא-הדף גולל אנכית; סרגל-הניווט התחתון (position:fixed, מוגדר
 *    ב-design-system.tsx, לא שונה) נשאר קבוע בכל מצב-גלילה כי fixed
 *    positioning הוא יחסי ל-viewport ולא למסמך.
 */

const QUICK_TOOLS = [
  { label: "טיול חדש", href: "/trips/new", icon: PlusIcon },
  { label: "תוכניות טיול", href: `/trips/${JAPAN_TRIP.id}/plan`, icon: DocumentIcon },
  { label: "יעדים", href: "/nearby", icon: GlobeIcon },
  { label: "רשימת אריזה", href: "/packing", icon: SuitcaseIcon },
] as const;

// סדר-המערך הפוך במכוון לסדר-התצוגה הרצוי (איסלנד-פורטוגל-ניו זילנד
// משמאל לימין, כמו בתמונה): container בכיוון RTL עם display:flex הופך
// את סדר-ה-DOM ויזואלית (הפריט הראשון מוצג מימין) — אומת אמפירית
// בצילום-מסך, לא ניחוש.
const INSPIRATION = [
  { label: "ניו זילנד", countryCode: "NZ", Thumb: NewZealandThumb },
  { label: "פורטוגל", countryCode: "PT", Thumb: PortugalThumb },
  { label: "איסלנד", countryCode: "IS", Thumb: IcelandThumb },
] as const;

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
        <button type="button" onClick={() => setMenuOpen(true)} aria-label="תפריט" style={{ width: "36px", height: "36px", borderRadius: "50%", background: "transparent", border: "none", display: "flex", alignItems: "center", justifyContent: "center", cursor: "pointer" }}>
          <HamburgerIcon />
        </button>
        <span style={{ fontSize: "17px", fontWeight: 700, color: COLOR.textPrimary, letterSpacing: "0.4px" }}>TRIP MASTER</span>
        <button type="button" onClick={() => router.push("/notifications")} aria-label="התראות" style={{ width: "36px", height: "36px", borderRadius: "50%", background: "transparent", border: "none", display: "flex", alignItems: "center", justifyContent: "center", cursor: "pointer" }}>
          <BellIcon color={COLOR.textPrimary} />
        </button>
      </div>

      <div style={{ marginTop: SPACE.sm, marginBottom: SPACE.xs }}>
        <h1 style={{ margin: 0, fontSize: "27px", fontWeight: 700, color: COLOR.textPrimary, textAlign: "center" }}>שלום {DEMO_USER_NAME}!</h1>
        <p style={{ margin: "8px 0 0", fontSize: "15.5px", color: COLOR.textSecondary, textAlign: "center" }}>לאן נטייל היום?</p>
        <div style={{ width: "42px", height: "3px", borderRadius: "999px", background: COLOR.primary, margin: "14px auto 0" }} />
      </div>

      <div style={{ position: "relative", borderRadius: `${RADIUS.card}px`, overflow: "hidden", height: "300px", border: `1px solid ${COLOR.border}` }}>
        <Image src="/photos/aurora-mountains.jpg" alt="זוהר צפוני מעל הרים" fill sizes="480px" style={{ objectFit: "cover" }} priority />
        <div style={{ position: "absolute", inset: 0, background: "linear-gradient(to top, rgba(2,13,31,0.75) 0%, rgba(2,13,31,0.05) 35%, transparent 55%)" }} />
        <span style={{ position: "absolute", top: "6px", insetInlineStart: "8px", fontSize: "8px", color: "rgba(255,255,255,0.55)" }}>
          <Ltr text="Photo: S. Giguère · CC BY 4.0 · Wikimedia Commons" />
        </span>
        <form
          onSubmit={submitSearch}
          style={{ position: "absolute", insetInlineStart: SPACE.md, insetInlineEnd: SPACE.md, bottom: SPACE.md, display: "flex", alignItems: "center", gap: SPACE.sm, background: "rgba(7,23,45,0.82)", border: `1px solid ${COLOR.border}`, borderRadius: `${RADIUS.pill}px`, padding: "12px 16px", backdropFilter: "blur(6px)" }}
        >
          <SearchIcon />
          <input
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="חפש יעד, פעילות, מלון..."
            style={{ flex: 1, background: "transparent", border: "none", outline: "none", color: COLOR.textPrimary, fontSize: "13.5px" }}
          />
        </form>
      </div>

      <div style={{ marginTop: SPACE.sm }}>
        <div style={{ fontSize: "15px", fontWeight: 700, color: COLOR.textPrimary, marginBottom: SPACE.md }}>הטיול הבא שלך</div>
        <Card onClick={() => router.push(`/trips/${JAPAN_TRIP.id}`)} style={{ display: "flex", alignItems: "center", gap: SPACE.lg, padding: SPACE.md }}>
          <div style={{ flex: 1, minWidth: 0 }}>
            <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
              <span style={{ fontSize: "18px", fontWeight: 700, color: COLOR.textPrimary }}>{JAPAN_TRIP.name}</span>
              <FlagIcon countryCode={JAPAN_TRIP.countryCode} size={20} />
            </div>
            <div style={{ fontSize: "13px", color: COLOR.textSecondary, marginTop: "5px" }}>
              <Ltr text={`${formatDateHe(JAPAN_TRIP.startDate)} - ${formatDateHe(JAPAN_TRIP.endDate)}`} />
            </div>
            <div style={{ marginTop: "10px" }}>
              <Badge tone={nextTripIn <= 0 ? "primary" : "success"}>{nextTripIn <= 0 ? "פעיל עכשיו" : `עוד ${nextTripIn} ימים`}</Badge>
            </div>
          </div>
          <div style={{ width: "128px", height: "104px", borderRadius: "14px", overflow: "hidden", flexShrink: 0 }}>
            <JapanThumb />
          </div>
        </Card>
      </div>

      <div style={{ marginTop: SPACE.sm }}>
        <div style={{ fontSize: "15px", fontWeight: 700, color: COLOR.textPrimary, marginBottom: SPACE.md }}>כלים מהירים</div>
        <div style={{ display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: SPACE.sm }}>
          {QUICK_TOOLS.map((tool) => (
            <button
              key={tool.label}
              type="button"
              onClick={() => router.push(tool.href)}
              style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: SPACE.sm, padding: `${SPACE.lg}px ${SPACE.xs}px`, borderRadius: `${RADIUS.card}px`, background: COLOR.card, border: `1px solid ${COLOR.border}`, cursor: "pointer", minHeight: "44px" }}
            >
              <tool.icon color={COLOR.primaryLight} size={28} />
              <span style={{ fontSize: "11.5px", fontWeight: 600, color: COLOR.textSecondary, textAlign: "center" }}>{tool.label}</span>
            </button>
          ))}
        </div>
      </div>

      <div style={{ marginTop: SPACE.sm, marginBottom: SPACE.lg }}>
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: SPACE.md }}>
          <span style={{ fontSize: "15px", fontWeight: 700, color: COLOR.textPrimary }}>השראה בשבילך</span>
          <button type="button" onClick={() => router.push("/search")} style={{ display: "flex", alignItems: "center", gap: "2px", background: "none", border: "none", cursor: "pointer", color: COLOR.primaryLight, fontSize: "12.5px", fontWeight: 700 }}>
            הצג הכל
            <ChevronIcon color={COLOR.primaryLight} size={13} />
          </button>
        </div>
        <div style={{ display: "flex", gap: SPACE.md, overflowX: "auto" }}>
          {INSPIRATION.map((item) => (
            <button
              key={item.countryCode}
              type="button"
              onClick={() => router.push(`/trips/new?country=${item.countryCode}`)}
              style={{ flexShrink: 0, width: "168px", height: "136px", borderRadius: "16px", overflow: "hidden", position: "relative", border: `1px solid ${COLOR.border}`, cursor: "pointer", padding: 0 }}
            >
              <item.Thumb />
              <span
                style={{
                  position: "absolute",
                  insetInlineStart: 0,
                  insetInlineEnd: 0,
                  bottom: 0,
                  padding: "6px 10px 9px",
                  fontSize: "13px",
                  fontWeight: 700,
                  color: "#fff",
                  background: "linear-gradient(to top, rgba(2,13,31,0.85), transparent)",
                  textAlign: "center",
                }}
              >
                {item.label}
              </span>
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
  return d.toLocaleDateString("he-IL", { day: "2-digit", month: "2-digit", year: "numeric" });
}

function HamburgerIcon() {
  return (
    <svg width="19" height="19" viewBox="0 0 24 24" fill="none" stroke={COLOR.textPrimary} strokeWidth={1.8} strokeLinecap="round">
      <path d="M4 6h16M4 12h16M4 18h16" />
    </svg>
  );
}

function GlobeIcon({ color = COLOR.textSecondary, size = 22 }: { color?: string; size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth={1.8} strokeLinecap="round">
      <circle cx="12" cy="12" r="9" />
      <path d="M3 12h18M12 3c2.8 2.5 4.3 5.7 4.3 9s-1.5 6.5-4.3 9c-2.8-2.5-4.3-5.7-4.3-9s1.5-6.5 4.3-9z" />
    </svg>
  );
}

/** תמונה-ממוינת של יפן (פוג'י + פגודה) — איור-SVG. הדרישה לתצלום-אמיתי
 * חלה במפורש רק על "האיור באזור העליון" (בנר-הזוהר-הצפוני, תוקן למעלה
 * לתצלום אמיתי); כאן לא התבקש שינוי, רק הגדלה. */
function JapanThumb() {
  return (
    <svg viewBox="0 0 100 80" width="100%" height="100%" preserveAspectRatio="xMidYMid slice">
      <defs>
        <linearGradient id="jpSky" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor={COLOR.primary} />
          <stop offset="100%" stopColor={COLOR.warning} />
        </linearGradient>
      </defs>
      <rect width="100" height="80" fill="url(#jpSky)" />
      <circle cx="78" cy="20" r="10" fill={COLOR.textPrimary} opacity="0.85" />
      <path d="M20 55 L38 25 L48 40 L60 15 L85 55 Z" fill={COLOR.cardElevated} opacity="0.9" />
      <path d="M55 22 L60 15 L65 22 L61 30 L59 30 Z" fill={COLOR.textPrimary} />
      <rect x="8" y="58" width="10" height="4" fill={COLOR.danger} />
      <rect x="10" y="52" width="6" height="6" fill={COLOR.danger} />
      <rect x="11.5" y="46" width="3" height="6" fill={COLOR.danger} />
      <rect x="0" y="62" width="100" height="18" fill={COLOR.bg} opacity="0.55" />
    </svg>
  );
}

function IcelandThumb() {
  return (
    <svg viewBox="0 0 100 80" width="100%" height="100%" preserveAspectRatio="xMidYMid slice">
      <defs>
        <linearGradient id="isSky" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor={COLOR.cardElevated} />
          <stop offset="100%" stopColor={COLOR.primary} />
        </linearGradient>
      </defs>
      <rect width="100" height="80" fill="url(#isSky)" />
      <path d="M0 45 L30 20 L55 40 L75 15 L100 42 L100 80 L0 80 Z" fill={COLOR.bg} opacity="0.7" />
      <path d="M0 55 Q25 45 50 55 T100 55 L100 80 L0 80 Z" fill={COLOR.cardElevated} />
      <path d="M40 58 L60 58 L58 66 L42 66 Z" fill={COLOR.textSecondary} opacity="0.8" />
    </svg>
  );
}

function PortugalThumb() {
  return (
    <svg viewBox="0 0 100 80" width="100%" height="100%" preserveAspectRatio="xMidYMid slice">
      <rect width="100" height="80" fill={COLOR.warning} opacity="0.35" />
      <rect width="100" height="80" fill={COLOR.cardElevated} opacity="0.5" />
      <rect x="25" y="30" width="50" height="42" fill={COLOR.danger} opacity="0.9" />
      <rect x="35" y="18" width="30" height="18" fill={COLOR.primary} />
      <circle cx="50" cy="18" r="7" fill={COLOR.warning} />
      <rect x="42" y="45" width="16" height="27" fill={COLOR.bg} opacity="0.6" />
      <rect x="30" y="40" width="8" height="8" fill={COLOR.textPrimary} opacity="0.5" />
      <rect x="62" y="40" width="8" height="8" fill={COLOR.textPrimary} opacity="0.5" />
    </svg>
  );
}

function NewZealandThumb() {
  return (
    <svg viewBox="0 0 100 80" width="100%" height="100%" preserveAspectRatio="xMidYMid slice">
      <defs>
        <linearGradient id="nzSky" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor={COLOR.bg} />
          <stop offset="100%" stopColor={COLOR.cardElevated} />
        </linearGradient>
      </defs>
      <rect width="100" height="80" fill="url(#nzSky)" />
      <path d="M10 65 L35 20 L50 45 L65 10 L90 65 Z" fill={COLOR.textSecondary} opacity="0.6" />
      <path d="M60 20 L65 10 L70 20 L66 28 L64 28 Z" fill={COLOR.textPrimary} />
      <path d="M30 32 L35 20 L40 32 L36 38 L34 38 Z" fill={COLOR.textPrimary} opacity="0.9" />
      <rect x="0" y="60" width="100" height="20" fill={COLOR.bg} opacity="0.5" />
    </svg>
  );
}
