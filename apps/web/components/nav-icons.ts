import {
  LayoutDashboard,
  CalendarDays,
  Luggage,
  MapPin,
  Map,
  Contact,
  Settings,
  MoreHorizontal,
  Plus,
  Siren,
  Trash2,
  BarChart3,
  type LucideIcon,
} from "lucide-react";
import {
  Receipt,
  MapPin as PhMapPin,
  Ticket,
  CalendarPlus,
  FileText,
  Scan,
  NavigationArrow,
  ArrowsLeftRight,
  HandCoins,
  Sparkle,
} from "@phosphor-icons/react/ssr";
import type { Icon as PhosphorIcon } from "@phosphor-icons/react";

/** Single source of truth mapping a top-level route to its Lucide icon — reused by the
 * desktop sidebar, the mobile bottom nav, and the "More" sheet. */
export const ROUTE_ICONS: Record<string, LucideIcon> = {
  "/dashboard": LayoutDashboard,
  "/today": CalendarDays,
  "/emergency": Siren,
  "/trips": Luggage,
  "/places": MapPin,
  "/map": Map,
  "/contacts": Contact,
  "/trash": Trash2,
  "/stats": BarChart3,
  "/settings": Settings,
};

/** אמוג'י בדיוק כמו בתפריט-הצד של מוקאפ ה-Dashboard (Claude Design, 2026-08-27) —
 * רק ל-routes שיש להם מקבילה ברורה במוקאפ. שאר ה-routes (today/emergency/
 * places/trash/settings) נשארים על Lucide (ROUTE_ICONS למעלה) — אין להמציא
 * אמוג'י שלא הופיע במוקאפ בפועל. */
export const ROUTE_EMOJI: Record<string, string> = {
  "/dashboard": "🏠",
  "/trips": "🧳",
  "/map": "🗺️",
  "/contacts": "👥",
  "/stats": "📊",
};

export const MORE_ICON = MoreHorizontal;
export const ADD_ICON = Plus;

/** Icons for the mobile Quick-Add action sheet and the dashboard's Quick Actions row —
 * Phosphor Fill, matching the Trip Master Dashboard mockup (Claude Design, 2026-08-27). */
export const QUICK_ADD_ICONS = {
  expense: Receipt,
  place: PhMapPin,
  booking: Ticket,
  activity: CalendarPlus,
  document: FileText,
  scan: Scan,
  navigate: NavigationArrow,
  currencyExchange: ArrowsLeftRight,
  tip: HandCoins,
  massage: Sparkle,
} satisfies Record<string, PhosphorIcon>;
