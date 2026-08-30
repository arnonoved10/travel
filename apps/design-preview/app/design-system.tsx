"use client";

import { useRouter } from "next/navigation";
import type { CSSProperties, ReactNode } from "react";

/**
 * שכבת-העיצוב האחידה לכל 38 המסכים, לפי המפרט המדויק שסופק (ערכי-צבע/
 * ריווח/רדיוס/טיפוגרפיה מפורשים במילים, לא ניחוש מהתמונות). קובץ אחד
 * לכל האפליקציה — כל מסך מייבא מכאן, לא מגדיר צבעים/גדלים מקומיים משלו.
 */

export const COLOR = {
  bg: "#020D1F",
  card: "#07172D",
  cardElevated: "#0B1D36",
  primary: "#7C3AED",
  primaryLight: "#A855F7",
  success: "#34D399",
  warning: "#F59E0B",
  danger: "#EF4444",
  textPrimary: "#F8FAFC",
  textSecondary: "#94A3B8",
  border: "#1E3A5F",
} as const;

export const SPACE = { xs: 4, sm: 8, md: 12, lg: 16, xl: 20, xxl: 24 } as const;

export const RADIUS = { card: 16, sheet: 20, pill: 999 } as const;

export const FONT = {
  h1: { fontSize: "22px", fontWeight: 700 },
  cardTitle: { fontSize: "16px", fontWeight: 600 },
  body: { fontSize: "14px", fontWeight: 500 },
  small: { fontSize: "12px", fontWeight: 500 },
} as const;

export const NAV_HEIGHT = 64;
export const AI_BUTTON_SIZE = 52;

// ============================== מבנה-עמוד ==============================

export function ScreenShell({ children, noBottomPad = false }: { children: ReactNode; noBottomPad?: boolean }) {
  return (
    <div
      style={{
        width: "100%",
        minHeight: "100vh",
        background: COLOR.bg,
        color: COLOR.textPrimary,
        fontFamily: "var(--font-heebo), sans-serif",
        direction: "rtl",
      }}
    >
      <div
        style={{
          display: "flex",
          flexDirection: "column",
          gap: SPACE.lg,
          padding: `${SPACE.lg}px ${SPACE.lg}px ${noBottomPad ? SPACE.lg : NAV_HEIGHT + AI_BUTTON_SIZE + 24}px`,
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

export function ScreenHeader({ title, subtitle, action }: { title: string; subtitle?: string; action?: ReactNode }) {
  const router = useRouter();
  return (
    <div style={{ display: "flex", alignItems: "center", gap: SPACE.md }}>
      <button
        type="button"
        onClick={() => router.back()}
        aria-label="חזרה"
        style={{
          width: "40px",
          height: "40px",
          minWidth: "44px",
          minHeight: "44px",
          borderRadius: "50%",
          background: COLOR.card,
          border: `1px solid ${COLOR.border}`,
          color: COLOR.textPrimary,
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          flexShrink: 0,
          cursor: "pointer",
        }}
      >
        <BackIcon />
      </button>
      <div style={{ minWidth: 0, flex: 1 }}>
        <h1 style={{ margin: 0, ...FONT.h1, color: COLOR.textPrimary, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{title}</h1>
        {subtitle ? <p style={{ margin: "2px 0 0", ...FONT.small, color: COLOR.textSecondary }}>{subtitle}</p> : null}
      </div>
      {action}
    </div>
  );
}

export function PageTitle({ title, right }: { title: string; right?: ReactNode }) {
  return (
    <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
      <h1 style={{ margin: 0, ...FONT.h1, color: COLOR.textPrimary }}>{title}</h1>
      {right}
    </div>
  );
}

// ============================== רכיבים ==============================

export function Card({ children, style, onClick }: { children: ReactNode; style?: CSSProperties; onClick?: () => void }) {
  return (
    <div
      onClick={onClick}
      style={{
        background: COLOR.card,
        border: `1px solid ${COLOR.border}`,
        borderRadius: `${RADIUS.card}px`,
        padding: `${SPACE.lg}px`,
        cursor: onClick ? "pointer" : undefined,
        ...style,
      }}
    >
      {children}
    </div>
  );
}

export function ElevatedCard({ children, style }: { children: ReactNode; style?: CSSProperties }) {
  return (
    <div style={{ background: COLOR.cardElevated, border: `1px solid ${COLOR.border}`, borderRadius: `${RADIUS.card}px`, padding: `${SPACE.lg}px`, ...style }}>
      {children}
    </div>
  );
}

export function CardTitle({ children, style }: { children: ReactNode; style?: CSSProperties }) {
  return <div style={{ ...FONT.cardTitle, color: COLOR.textPrimary, ...style }}>{children}</div>;
}

export function TextMuted({ children, style }: { children: ReactNode; style?: CSSProperties }) {
  return <div style={{ ...FONT.small, color: COLOR.textSecondary, ...style }}>{children}</div>;
}

/**
 * מבודד מחרוזת (סכום+סמל-מטבע, מספר-טלפון, תאריך לועזי וכו') מכיוון-RTL
 * של העמוד סביבה — באג ידוע ומתועד (ר' CONTINUATION.md הישן: "מחרוזת
 * שמערבת קודי-מטבע/מספרים בלי טקסט-עברי עוגן, בתוך container עם
 * direction:rtl"), שאומת שוב בצילומי-מסך אמיתיים כאן (גם ביתרות-ארנק וגם
 * במספרי-טלפון במסך אנשי-קשר-לחירום). span מבודד-בכיוון (unicodeBidi:
 * isolate + dir=ltr) כדי שהתוכן תמיד יוצג בסדר-הנכון, בלי קשר לסביבתו.
 */
export function Ltr({ text, style }: { text: string; style?: CSSProperties }) {
  return (
    <span dir="ltr" style={{ unicodeBidi: "isolate", ...style }}>
      {text}
    </span>
  );
}
export function Money({ text, style }: { text: string; style?: CSSProperties }) {
  return <Ltr text={text} style={style} />;
}

type BtnProps = { children: ReactNode; onClick?: () => void; style?: CSSProperties; disabled?: boolean; type?: "button" | "submit" };

export function PrimaryButton({ children, onClick, style, disabled, type = "button" }: BtnProps) {
  return (
    <button
      type={type}
      onClick={onClick}
      disabled={disabled}
      style={{
        width: "100%",
        minHeight: "48px",
        borderRadius: `${RADIUS.card}px`,
        background: disabled ? `${COLOR.primary}55` : COLOR.primary,
        color: "#fff",
        border: "none",
        fontSize: "15px",
        fontWeight: 700,
        cursor: disabled ? "default" : "pointer",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        gap: SPACE.sm,
        ...style,
      }}
    >
      {children}
    </button>
  );
}

export function SecondaryButton({ children, onClick, style, disabled }: BtnProps) {
  return (
    <button
      type="button"
      onClick={onClick}
      disabled={disabled}
      style={{
        width: "100%",
        minHeight: "48px",
        borderRadius: `${RADIUS.card}px`,
        background: "transparent",
        color: COLOR.textPrimary,
        border: `1px solid ${COLOR.border}`,
        fontSize: "15px",
        fontWeight: 700,
        cursor: "pointer",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        gap: SPACE.sm,
        ...style,
      }}
    >
      {children}
    </button>
  );
}

export function DangerButton({ children, onClick, style, disabled }: BtnProps) {
  return (
    <button
      type="button"
      onClick={onClick}
      disabled={disabled}
      style={{
        width: "100%",
        minHeight: "48px",
        borderRadius: `${RADIUS.card}px`,
        background: `${COLOR.danger}1A`,
        color: COLOR.danger,
        border: `1px solid ${COLOR.danger}55`,
        fontSize: "15px",
        fontWeight: 700,
        cursor: "pointer",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        gap: SPACE.sm,
        ...style,
      }}
    >
      {children}
    </button>
  );
}

export function IconButton({ children, onClick, style, active, "aria-label": ariaLabel }: { children: ReactNode; onClick?: () => void; style?: CSSProperties; active?: boolean; "aria-label"?: string }) {
  return (
    <button
      type="button"
      onClick={onClick}
      aria-label={ariaLabel}
      style={{
        width: "44px",
        height: "44px",
        borderRadius: "50%",
        background: active ? `${COLOR.primary}2A` : COLOR.card,
        border: `1px solid ${active ? COLOR.primary : COLOR.border}`,
        color: active ? COLOR.primaryLight : COLOR.textPrimary,
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        cursor: "pointer",
        flexShrink: 0,
        ...style,
      }}
    >
      {children}
    </button>
  );
}

export function Badge({ children, tone = "muted" }: { children: ReactNode; tone?: "success" | "warning" | "danger" | "muted" | "primary" }) {
  const colors: Record<string, string> = { success: COLOR.success, warning: COLOR.warning, danger: COLOR.danger, muted: COLOR.textSecondary, primary: COLOR.primaryLight };
  const c = colors[tone];
  return (
    <span
      style={{
        display: "inline-flex",
        alignItems: "center",
        padding: "3px 10px",
        borderRadius: `${RADIUS.pill}px`,
        background: `${c}22`,
        border: `1px solid ${c}55`,
        color: c,
        fontSize: "11px",
        fontWeight: 700,
        whiteSpace: "nowrap",
      }}
    >
      {children}
    </span>
  );
}

export function Field({ label, children }: { label: string; children: ReactNode }) {
  return (
    <div style={{ display: "flex", flexDirection: "column", gap: SPACE.xs }}>
      <label style={{ ...FONT.small, color: COLOR.textSecondary, fontWeight: 600 }}>{label}</label>
      {children}
    </div>
  );
}

export const inputStyle: CSSProperties = {
  width: "100%",
  minHeight: "44px",
  borderRadius: "12px",
  background: COLOR.cardElevated,
  border: `1px solid ${COLOR.border}`,
  color: COLOR.textPrimary,
  fontSize: "14px",
  padding: "0 12px",
  fontFamily: "inherit",
};

export const textareaStyle: CSSProperties = { ...inputStyle, minHeight: "80px", padding: "10px 12px", resize: "none" };

export function PillTabs<T extends string>({ options, value, onChange }: { options: { key: T; label: string }[]; value: T; onChange: (v: T) => void }) {
  return (
    <div style={{ display: "flex", gap: SPACE.sm, overflowX: "auto" }}>
      {options.map((opt) => {
        const isActive = opt.key === value;
        return (
          <button
            key={opt.key}
            type="button"
            onClick={() => onChange(opt.key)}
            style={{
              padding: "9px 16px",
              borderRadius: `${RADIUS.pill}px`,
              background: isActive ? COLOR.primary : COLOR.card,
              border: `1px solid ${isActive ? COLOR.primary : COLOR.border}`,
              color: isActive ? "#fff" : COLOR.textSecondary,
              fontSize: "13px",
              fontWeight: 700,
              whiteSpace: "nowrap",
              cursor: "pointer",
              flexShrink: 0,
            }}
          >
            {opt.label}
          </button>
        );
      })}
    </div>
  );
}

export function IconPill({ icon, label, active, onClick }: { icon: ReactNode; label: string; active?: boolean; onClick?: () => void }) {
  return (
    <button
      type="button"
      onClick={onClick}
      style={{
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        justifyContent: "center",
        gap: SPACE.xs,
        padding: "10px 6px",
        minWidth: "60px",
        minHeight: "44px",
        borderRadius: "14px",
        background: active ? `${COLOR.primary}22` : COLOR.card,
        border: `1px solid ${active ? COLOR.primary : COLOR.border}`,
        color: active ? COLOR.primaryLight : COLOR.textSecondary,
        cursor: "pointer",
        flexShrink: 0,
      }}
    >
      {icon}
      <span style={{ fontSize: "10.5px", fontWeight: 700 }}>{label}</span>
    </button>
  );
}

// ============================== סרגל ניווט גלובלי ==============================

export type NavKey = "home" | "trips" | "notifications" | "profile";

export function BottomNav({ active, onQuickAdd }: { active: NavKey | null; onQuickAdd?: () => void }) {
  const router = useRouter();
  const items: { key: NavKey; label: string; href: string; icon: (c: string) => ReactNode }[] = [
    { key: "profile", label: "פרופיל", href: "/profile", icon: (c) => <ProfileIcon color={c} /> },
    { key: "notifications", label: "התראות", href: "/notifications", icon: (c) => <BellIcon color={c} /> },
    { key: "trips", label: "הטיולים שלי", href: "/trips", icon: (c) => <SuitcaseIcon color={c} /> },
    { key: "home", label: "דף הבית", href: "/", icon: (c) => <HomeIcon color={c} /> },
  ];
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
        background: "rgba(7,23,45,0.95)",
        backdropFilter: "blur(16px)",
        WebkitBackdropFilter: "blur(16px)",
        borderTop: `1px solid ${COLOR.border}`,
        zIndex: 20,
        maxWidth: "480px",
        marginInline: "auto",
      }}
    >
      {items.slice(0, 2).map((item) => (
        <NavButton key={item.key} item={item} isActive={item.key === active} router={router} />
      ))}
      <button
        type="button"
        onClick={onQuickAdd ?? (() => router.push("/trips/new"))}
        aria-label="הוספה מהירה"
        style={{
          width: "52px",
          height: "52px",
          borderRadius: "50%",
          background: COLOR.primary,
          border: "none",
          color: "#fff",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          cursor: "pointer",
          flexShrink: 0,
          marginTop: "-18px",
          boxShadow: `0 4px 16px ${COLOR.primary}66`,
        }}
      >
        <PlusIcon />
      </button>
      {items.slice(2).map((item) => (
        <NavButton key={item.key} item={item} isActive={item.key === active} router={router} />
      ))}
    </div>
  );
}

function NavButton({ item, isActive, router }: { item: { label: string; href: string; icon: (c: string) => ReactNode }; isActive: boolean; router: ReturnType<typeof useRouter> }) {
  const color = isActive ? COLOR.primaryLight : COLOR.textSecondary;
  return (
    <button
      type="button"
      onClick={() => router.push(item.href)}
      style={{ display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", gap: "3px", flex: "1 1 0", minHeight: "54px", background: "none", border: "none", cursor: "pointer" }}
    >
      {item.icon(color)}
      <span style={{ fontSize: "10px", fontWeight: isActive ? 700 : 500, color }}>{item.label}</span>
    </button>
  );
}

// ============================== אייקונים (SVG מצוירים, לא אימוג'י) ==============================

function iconProps(color: string, size = 22) {
  return { width: size, height: size, viewBox: "0 0 24 24", fill: "none", stroke: color, strokeWidth: 1.8, strokeLinecap: "round" as const, strokeLinejoin: "round" as const };
}

export function BackIcon({ color = COLOR.textPrimary }: { color?: string }) {
  return (
    <svg {...iconProps(color, 16)}>
      <path d="M15 5 8 12l7 7" />
    </svg>
  );
}
export function HomeIcon({ color = COLOR.textSecondary }: { color?: string }) {
  return (
    <svg {...iconProps(color)}>
      <path d="M4 11.5 12 4l8 7.5" />
      <path d="M6 10v9a1 1 0 0 0 1 1h3v-6h4v6h3a1 1 0 0 0 1-1v-9" />
    </svg>
  );
}
export function SuitcaseIcon({ color = COLOR.textSecondary }: { color?: string }) {
  return (
    <svg {...iconProps(color)}>
      <rect x="3.5" y="7.5" width="17" height="12" rx="2" />
      <path d="M9 7.5V6a2 2 0 0 1 2-2h2a2 2 0 0 1 2 2v1.5" />
      <path d="M3.5 13h17" />
    </svg>
  );
}
export function BellIcon({ color = COLOR.textSecondary }: { color?: string }) {
  return (
    <svg {...iconProps(color)}>
      <path d="M6 9a6 6 0 0 1 12 0c0 5 2 6 2 6H4s2-1 2-6" />
      <path d="M10 20a2 2 0 0 0 4 0" />
    </svg>
  );
}
export function ProfileIcon({ color = COLOR.textSecondary }: { color?: string }) {
  return (
    <svg {...iconProps(color)}>
      <circle cx="12" cy="8" r="3.3" />
      <path d="M5 20c1.2-3.8 4.2-5.5 7-5.5s5.8 1.7 7 5.5" />
    </svg>
  );
}
export function PlusIcon({ color = "#fff", size = 24 }: { color?: string; size?: number }) {
  return (
    <svg {...iconProps(color, size)}>
      <path d="M12 5v14M5 12h14" />
    </svg>
  );
}
export function SparkleIcon({ color = "#fff", size = 22 }: { color?: string; size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill={color}>
      <path d="M12 2l1.8 5.4L19 9l-5.2 1.6L12 16l-1.8-5.4L5 9l5.2-1.6L12 2z" />
      <path d="M19 14l.8 2.3L22 17l-2.2.7L19 20l-.8-2.3L16 17l2.2-.7L19 14z" opacity=".8" />
    </svg>
  );
}
export function MicIcon({ color = COLOR.textPrimary, size = 20 }: { color?: string; size?: number }) {
  return (
    <svg {...iconProps(color, size)}>
      <rect x="9" y="3" width="6" height="11" rx="3" />
      <path d="M5 11a7 7 0 0 0 14 0" />
      <path d="M12 18v3" />
    </svg>
  );
}
export function CameraIcon({ color = COLOR.textPrimary, size = 20 }: { color?: string; size?: number }) {
  return (
    <svg {...iconProps(color, size)}>
      <path d="M4 8a2 2 0 0 1 2-2h1.5l1-2h7l1 2H18a2 2 0 0 1 2 2v9a2 2 0 0 1-2 2H6a2 2 0 0 1-2-2z" />
      <circle cx="12" cy="13" r="3.3" />
    </svg>
  );
}
export function AttachIcon({ color = COLOR.textPrimary, size = 20 }: { color?: string; size?: number }) {
  return (
    <svg {...iconProps(color, size)}>
      <path d="M8 12.5 15 5.5a3 3 0 0 1 4 4l-8.5 8.5a5 5 0 0 1-7-7L12 2.5" />
    </svg>
  );
}
export function SendIcon({ color = "#fff", size = 18 }: { color?: string; size?: number }) {
  return (
    <svg {...iconProps(color, size)}>
      <path d="M21 3 3 10.5l7 3 3 7L21 3z" />
    </svg>
  );
}
export function ChevronIcon({ color = COLOR.textSecondary, size = 14 }: { color?: string; size?: number }) {
  return (
    <svg {...iconProps(color, size)}>
      <path d="M9 5l7 7-7 7" />
    </svg>
  );
}
export function CheckIcon({ color = COLOR.success, size = 16 }: { color?: string; size?: number }) {
  return (
    <svg {...iconProps(color, size)}>
      <path d="M4 12.5l5 5L20 6" />
    </svg>
  );
}
export function CloseIcon({ color = COLOR.textPrimary, size = 16 }: { color?: string; size?: number }) {
  return (
    <svg {...iconProps(color, size)}>
      <path d="M5 5l14 14M19 5 5 19" />
    </svg>
  );
}
export function SearchIcon({ color = COLOR.textSecondary, size = 18 }: { color?: string; size?: number }) {
  return (
    <svg {...iconProps(color, size)}>
      <circle cx="11" cy="11" r="6.5" />
      <path d="m20 20-3.6-3.6" />
    </svg>
  );
}
export function PinIcon({ color = COLOR.textSecondary, size = 18 }: { color?: string; size?: number }) {
  return (
    <svg {...iconProps(color, size)}>
      <path d="M12 21s7-6.2 7-11.5a7 7 0 0 0-14 0C5 14.8 12 21 12 21z" />
      <circle cx="12" cy="9.5" r="2.4" />
    </svg>
  );
}
export function CalendarIcon({ color = COLOR.textSecondary, size = 18 }: { color?: string; size?: number }) {
  return (
    <svg {...iconProps(color, size)}>
      <rect x="3.5" y="5" width="17" height="16" rx="2" />
      <path d="M3.5 10h17M8 3v4M16 3v4" />
    </svg>
  );
}
export function ClockIcon({ color = COLOR.textSecondary, size = 18 }: { color?: string; size?: number }) {
  return (
    <svg {...iconProps(color, size)}>
      <circle cx="12" cy="12" r="8.5" />
      <path d="M12 7.5V12l3 2" />
    </svg>
  );
}
export function ShareIcon({ color = COLOR.textPrimary, size = 18 }: { color?: string; size?: number }) {
  return (
    <svg {...iconProps(color, size)}>
      <circle cx="18" cy="5.5" r="2.3" />
      <circle cx="6" cy="12" r="2.3" />
      <circle cx="18" cy="18.5" r="2.3" />
      <path d="M8 10.8 16 7M8 13.2l8 3.8" />
    </svg>
  );
}
export function HeartIcon({ color = COLOR.textPrimary, filled = false, size = 18 }: { color?: string; filled?: boolean; size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill={filled ? color : "none"} stroke={color} strokeWidth={1.8}>
      <path d="M12 20.5s-7.5-4.6-9.8-9.3C.8 7.8 2.6 4.5 6 4c2.2-.3 4 .8 6 3 2-2.2 3.8-3.3 6-3 3.4.5 5.2 3.8 3.8 7.2C19.5 15.9 12 20.5 12 20.5z" />
    </svg>
  );
}
export function TrashIcon({ color = COLOR.danger, size = 18 }: { color?: string; size?: number }) {
  return (
    <svg {...iconProps(color, size)}>
      <path d="M4 7h16M9 7V5a1 1 0 0 1 1-1h4a1 1 0 0 1 1 1v2m2 0-1 13a1 1 0 0 1-1 1H8a1 1 0 0 1-1-1L6 7" />
    </svg>
  );
}
export function EditIcon({ color = COLOR.primaryLight, size = 16 }: { color?: string; size?: number }) {
  return (
    <svg {...iconProps(color, size)}>
      <path d="M4 20l1-4L16 5l3 3L8 19l-4 1z" />
    </svg>
  );
}
export function NavigateIcon({ color = COLOR.textPrimary, size = 18 }: { color?: string; size?: number }) {
  return (
    <svg {...iconProps(color, size)}>
      <path d="M12 2 4 21l8-4 8 4z" />
    </svg>
  );
}
export function UploadIcon({ color = COLOR.textPrimary, size = 18 }: { color?: string; size?: number }) {
  return (
    <svg {...iconProps(color, size)}>
      <path d="M12 16V4m0 0L7 9m5-5 5 5" />
      <path d="M4 17v2a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2v-2" />
    </svg>
  );
}
export function DownloadIcon({ color = COLOR.textPrimary, size = 18 }: { color?: string; size?: number }) {
  return (
    <svg {...iconProps(color, size)}>
      <path d="M12 4v12m0 0-5-5m5 5 5-5" />
      <path d="M4 17v2a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2v-2" />
    </svg>
  );
}
export function ShieldIcon({ color = COLOR.success, size = 20 }: { color?: string; size?: number }) {
  return (
    <svg {...iconProps(color, size)}>
      <path d="M12 3l7 3v6c0 4.5-3 7.5-7 9-4-1.5-7-4.5-7-9V6z" />
      <path d="m9 12 2 2 4-4" />
    </svg>
  );
}
export function PhoneIcon({ color = COLOR.textPrimary, size = 18 }: { color?: string; size?: number }) {
  return (
    <svg {...iconProps(color, size)}>
      <path d="M6 3h3l1.5 4L8 9a12 12 0 0 0 7 7l2-2.5 4 1.5v3a2 2 0 0 1-2 2C10.5 20 4 13.5 4 5a2 2 0 0 1 2-2z" />
    </svg>
  );
}
export function CarIcon({ color = COLOR.textPrimary, size = 20 }: { color?: string; size?: number }) {
  return (
    <svg {...iconProps(color, size)}>
      <path d="M4 16V12l2-5h12l2 5v4" />
      <path d="M4 16h16v2a1 1 0 0 1-1 1h-2a1 1 0 0 1-1-1v-1H8v1a1 1 0 0 1-1 1H5a1 1 0 0 1-1-1z" />
      <circle cx="7.5" cy="16" r="1.3" />
      <circle cx="16.5" cy="16" r="1.3" />
    </svg>
  );
}
export function ScooterIcon({ color = COLOR.textPrimary, size = 20 }: { color?: string; size?: number }) {
  return (
    <svg {...iconProps(color, size)}>
      <circle cx="6" cy="18" r="2.3" />
      <circle cx="18" cy="18" r="2.3" />
      <path d="M6 18h6l2-8h4M12 10h3M8 5h3l1 3" />
    </svg>
  );
}
export function DocumentIcon({ color = COLOR.textPrimary, size = 18 }: { color?: string; size?: number }) {
  return (
    <svg {...iconProps(color, size)}>
      <path d="M7 3h7l4 4v14a1 1 0 0 1-1 1H7a1 1 0 0 1-1-1V4a1 1 0 0 1 1-1z" />
      <path d="M14 3v4h4M9 12h6M9 16h6" />
    </svg>
  );
}
export function WeatherSunIcon({ size = 28 }: { size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="#f5c344" strokeWidth={1.8} strokeLinecap="round">
      <circle cx="12" cy="12" r="4.2" fill="#f5c344" stroke="none" />
      <path d="M12 2.5v2.2M12 19.3v2.2M4.2 4.2l1.5 1.5M18.3 18.3l1.5 1.5M2.5 12h2.2M19.3 12h2.2M4.2 19.8l1.5-1.5M18.3 5.7l1.5-1.5" />
    </svg>
  );
}
export function WeatherCloudIcon({ size = 28, color = "#9aa3bd" }: { size?: number; color?: string }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill={color}>
      <path d="M6.5 18a4.2 4.2 0 0 1 .4-8.4 5.3 5.3 0 0 1 10.2 1.3A3.7 3.7 0 0 1 16.3 18z" />
    </svg>
  );
}
export function WeatherRainIcon({ size = 28 }: { size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      <path d="M6.5 13a4.2 4.2 0 0 1 .4-8.4 5.3 5.3 0 0 1 10.2 1.3A3.7 3.7 0 0 1 16.3 13z" fill="#9aa3bd" />
      <path d="M8 16l-1 3M12 16l-1 3M16 16l-1 3" stroke="#5b9df9" strokeWidth={1.8} strokeLinecap="round" />
    </svg>
  );
}
export function ThermometerIcon({ color = COLOR.textSecondary, size = 16 }: { color?: string; size?: number }) {
  return (
    <svg {...iconProps(color, size)}>
      <path d="M12 3a2 2 0 0 0-2 2v9.2a3.5 3.5 0 1 0 4 0V5a2 2 0 0 0-2-2z" />
    </svg>
  );
}
export function WindIcon({ color = COLOR.textSecondary, size = 16 }: { color?: string; size?: number }) {
  return (
    <svg {...iconProps(color, size)}>
      <path d="M3 8h11a2.5 2.5 0 1 0-2.5-2.5M3 12h15a2.5 2.5 0 1 1-2.5 2.5M3 16h8a2 2 0 1 1-2 2" />
    </svg>
  );
}
export function DropletIcon({ color = COLOR.textSecondary, size = 16 }: { color?: string; size?: number }) {
  return (
    <svg {...iconProps(color, size)}>
      <path d="M12 3s6 6.5 6 10.5a6 6 0 0 1-12 0C6 9.5 12 3 12 3z" />
    </svg>
  );
}
