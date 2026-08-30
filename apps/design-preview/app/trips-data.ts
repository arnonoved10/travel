import { TRIP_STOP_COUNTRIES, TRIP_LAST_DAY, DEMO_REFERENCE_DATE, loadJSON, saveJSON, nextId } from "./wallet-data";

/**
 * מאגר-הטיולים המשותף למסכי "דף הבית" / "הטיולים שלי" / "סקירת הטיול" /
 * "מסלול" / "מפה" וכו'. הטיול הפעיל (יפן) בנוי ישירות מעל TRIP_STOP_COUNTRIES
 * הקיים ב-wallet-data.ts (לא כפילות-מידע: אותו מקור-אמת בדיוק קובע גם את
 * "מטבע מקומי" בארנק וגם את תאריכי-הטיול כאן). שאר-הטיולים (איטליה/ניו
 * יורק/תאילנד) הם דמו-בלבד למסך "הטיולים שלי", לפי חבילת-העיצוב המחייבת.
 */

export type TripStatus = "upcoming" | "active" | "completed";

export interface DemoTrip {
  id: string;
  name: string;
  countryCode: string;
  status: TripStatus;
  startDate: string;
  endDate: string;
  nights: number;
  travelers: number;
}

function daysBetween(a: string, b: string): number {
  return Math.round((new Date(b).getTime() - new Date(a).getTime()) / 86400000);
}

const JAPAN_START = TRIP_STOP_COUNTRIES[0]!.firstDay;
const JAPAN_END = TRIP_LAST_DAY;

export const JAPAN_TRIP: DemoTrip = {
  id: "japan-2025",
  name: "יפן",
  countryCode: "JP",
  status: "active",
  startDate: JAPAN_START,
  endDate: JAPAN_END,
  nights: daysBetween(JAPAN_START, JAPAN_END),
  travelers: 2,
};

export const DEMO_TRIPS: DemoTrip[] = [
  JAPAN_TRIP,
  { id: "italy-2025", name: "איטליה", countryCode: "IT", status: "upcoming", startDate: "2025-09-05", endDate: "2025-09-15", nights: 10, travelers: 2 },
  { id: "newyork-2026", name: "ניו יורק", countryCode: "US", status: "upcoming", startDate: "2026-01-26", endDate: "2026-02-01", nights: 6, travelers: 1 },
  { id: "thailand-2026", name: "תאילנד", countryCode: "TH", status: "upcoming", startDate: "2026-10-24", endDate: "2026-11-03", nights: 10, travelers: 2 },
];

export function daysUntil(dateISO: string, referenceDate = DEMO_REFERENCE_DATE): number {
  return daysBetween(referenceDate, dateISO);
}

export function findTrip(id: string): DemoTrip | null {
  return DEMO_TRIPS.find((t) => t.id === id) ?? null;
}

export function tripProgress(trip: DemoTrip, referenceDate = DEMO_REFERENCE_DATE): { dayIndex: number; totalDays: number } {
  const totalDays = daysBetween(trip.startDate, trip.endDate) + 1;
  const dayIndex = Math.min(totalDays, Math.max(1, daysBetween(trip.startDate, referenceDate) + 1));
  return { dayIndex, totalDays };
}

// ============================== טיולים שנוצרו ע"י המשתמש ==============================

const SK_CUSTOM_TRIPS = "design-preview-custom-trips-v1";

export function loadCustomTrips(): DemoTrip[] {
  return loadJSON<DemoTrip[]>(SK_CUSTOM_TRIPS, []);
}
export function saveCustomTrip(trip: Omit<DemoTrip, "id" | "status">): DemoTrip {
  const trips = loadCustomTrips();
  const full: DemoTrip = { ...trip, id: nextId("trip"), status: new Date(trip.startDate) > new Date(DEMO_REFERENCE_DATE) ? "upcoming" : "active" };
  saveJSON(SK_CUSTOM_TRIPS, [...trips, full]);
  return full;
}
export function deleteCustomTrip(id: string) {
  saveJSON(SK_CUSTOM_TRIPS, loadCustomTrips().filter((t) => t.id !== id));
}
export function allTrips(): DemoTrip[] {
  return [...DEMO_TRIPS, ...loadCustomTrips()];
}
export function findAnyTrip(id: string): DemoTrip | null {
  return allTrips().find((t) => t.id === id) ?? null;
}
