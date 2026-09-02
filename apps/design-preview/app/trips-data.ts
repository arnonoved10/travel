import { TRIP_STOP_COUNTRIES, TRIP_LAST_DAY, DEMO_REFERENCE_DATE, loadJSON, saveJSON, nextId } from "./wallet-data";

/**
 * מאגר-הטיולים המשותף למסכי "דף הבית" / "הטיולים שלי" / "סקירת הטיול" /
 * "מסלול" / "מפה" וכו'. הטיול הפעיל (יפן) בנוי ישירות מעל TRIP_STOP_COUNTRIES
 * הקיים ב-wallet-data.ts (לא כפילות-מידע: אותו מקור-אמת בדיוק קובע גם את
 * "מטבע מקומי" בארנק וגם את תאריכי-הטיול כאן). שאר-הטיולים (איטליה/ניו
 * יורק/תאילנד) הם דמו-בלבד למסך "הטיולים שלי", לפי חבילת-העיצוב המחייבת.
 *
 * עודכן: נוספה יכולת עריכה אמיתית — לפני כן לא הייתה שום דרך לערוך את
 * הטיול הפעיל (הכל היה קבוע בקוד). עכשיו כל טיול (כולל "יפן" הבנוי-מראש)
 * יכול לקבל override (שם/תאריכים/וכו'), נשמר ב-localStorage ומוחל בזמן-
 * אמת דרך findAnyTrip/allTrips/activeTrip. תחנות-המסלול (יעדים בתוך
 * הטיול) מנוהלות בנפרד ב-trip-content.ts (loadStops/saveStops) — לא כאן,
 * כדי לא לשכפל מקור-אמת שכבר קיים ומחובר גם למסך "שינוי סדר היעדים".
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

export function tripProgress(trip: DemoTrip, referenceDate = DEMO_REFERENCE_DATE): { dayIndex: number; totalDays: number; daysRemaining: number; percent: number } {
  const totalDays = daysBetween(trip.startDate, trip.endDate) + 1;
  const dayIndex = Math.min(totalDays, Math.max(1, daysBetween(trip.startDate, referenceDate) + 1));
  const daysRemaining = Math.max(0, daysBetween(referenceDate, trip.endDate));
  const percent = totalDays > 0 ? Math.min(100, Math.round((dayIndex / totalDays) * 100)) : 0;
  return { totalDays, dayIndex, daysRemaining, percent };
}

// ============================== טיולים שנוצרו ע"י המשתמש ==============================

const SK_CUSTOM_TRIPS = "design-preview-custom-trips-v1";
// עריכות על טיולים קיימים (כולל "יפן" הבנוי-מראש) — לא דורסות את הקבועים
// המקוריים, רק שכבת-override שמוחלת בזמן-קריאה.
const SK_TRIP_OVERRIDES = "design-preview-trip-overrides-v1";

export function loadCustomTrips(): DemoTrip[] {
  return loadJSON<DemoTrip[]>(SK_CUSTOM_TRIPS, []);
}
export function saveCustomTrip(trip: Omit<DemoTrip, "id" | "status">): DemoTrip {
  const trips = loadCustomTrips();
  // סטטוס ראשוני לפי תאריכים בלבד — לעולם לא "active" אוטומטית, כדי שלא
  // יהיו כמה טיולים "פעילים" בו-זמנית: הפיכה לטיול-הפעיל היא תמיד פעולה
  // מפורשת דרך setActiveTrip (שגם מוריד את הטיול-הפעיל-הקודם).
  const full: DemoTrip = { ...trip, id: nextId("trip"), status: new Date(trip.endDate) < new Date(DEMO_REFERENCE_DATE) ? "completed" : "upcoming" };
  saveJSON(SK_CUSTOM_TRIPS, [...trips, full]);
  return full;
}
const SK_HIDDEN_TRIPS = "design-preview-hidden-trips-v1";

/** מוחקת טיול — עובד גם על טיולים-מותאמים-אישית (מוסרים לגמרי) וגם על
 * טיולי-הדמו הקבועים (japan-2025 וכו', שמוסתרים במקום נמחקים פיזית,
 * כי הם קבועים בקוד). באג קודם: מחיקת טיול-דמו (כולל "יפן") לא עשתה
 * כלום בפועל — allTrips() המשיך להחזיר אותו. */
export function deleteCustomTrip(id: string) {
  saveJSON(SK_CUSTOM_TRIPS, loadCustomTrips().filter((t) => t.id !== id));
  saveJSON(SK_TRIP_OVERRIDES, { ...loadTripOverrides(), [id]: undefined });
  const isBuiltIn = DEMO_TRIPS.some((t) => t.id === id);
  if (isBuiltIn) {
    const hidden = loadJSON<string[]>(SK_HIDDEN_TRIPS, []);
    if (!hidden.includes(id)) saveJSON(SK_HIDDEN_TRIPS, [...hidden, id]);
  }
}

function loadTripOverrides(): Record<string, Partial<DemoTrip> | undefined> {
  return loadJSON(SK_TRIP_OVERRIDES, {});
}

/** מעדכן טיול קיים (כולל "יפן" ושאר טיולי-הדמו הקבועים) — שם/תאריכים/וכו'.
 * לא זמין לטיולים-מותאמים-אישית (saveCustomTrip) שבהם עורכים ישירות. */
export function updateTrip(id: string, patch: Partial<Omit<DemoTrip, "id">>): DemoTrip | null {
  const custom = loadCustomTrips();
  const customIdx = custom.findIndex((t) => t.id === id);
  if (customIdx !== -1) {
    const updated = { ...custom[customIdx]!, ...patch };
    const arr = [...custom];
    arr[customIdx] = updated;
    saveJSON(SK_CUSTOM_TRIPS, arr);
    return updated;
  }
  const overrides = loadTripOverrides();
  const base = findAnyTrip(id);
  if (!base) return null;
  const updated = { ...base, ...patch };
  saveJSON(SK_TRIP_OVERRIDES, { ...overrides, [id]: { name: updated.name, countryCode: updated.countryCode, startDate: updated.startDate, endDate: updated.endDate, nights: daysBetween(updated.startDate, updated.endDate), travelers: updated.travelers, status: updated.status } });
  return updated;
}

export function allTrips(): DemoTrip[] {
  const overrides = loadTripOverrides();
  const hidden = new Set(loadJSON<string[]>(SK_HIDDEN_TRIPS, []));
  return [...DEMO_TRIPS, ...loadCustomTrips()]
    .filter((t) => !hidden.has(t.id))
    .map((t) => (overrides[t.id] ? { ...t, ...overrides[t.id] } : t));
}
export function findTrip(id: string): DemoTrip | null {
  return DEMO_TRIPS.find((t) => t.id === id) ?? null;
}
export function findAnyTrip(id: string): DemoTrip | null {
  return allTrips().find((t) => t.id === id) ?? null;
}

/** הטיול "הפעיל" כרגע לצורך דף-הבית/מסלול/מפה — הראשון עם status==="active",
 * אחרת נופל חזרה לטיול-יפן (תמיד קיים). */
export function activeTrip(): DemoTrip {
  return allTrips().find((t) => t.status === "active") ?? findAnyTrip(JAPAN_TRIP.id) ?? JAPAN_TRIP;
}

/** מעביר את "הטיול הפעיל" לטיול אחר — פעולה מפורשת ויחידה שמשנה status
 * ל-"active", ומורידה כל טיול אחר שהיה "active" (לפי תאריכים, ל-upcoming/
 * completed) כדי שלעולם לא יהיו כמה טיולים "פעילים" בו-זמנית. */
export function setActiveTrip(id: string, referenceDate = DEMO_REFERENCE_DATE): DemoTrip | null {
  if (!findAnyTrip(id)) return null;
  for (const t of allTrips()) {
    if (t.id === id || t.status !== "active") continue;
    updateTrip(t.id, { status: new Date(t.endDate) < new Date(referenceDate) ? "completed" : "upcoming" });
  }
  return updateTrip(id, { status: "active" });
}
