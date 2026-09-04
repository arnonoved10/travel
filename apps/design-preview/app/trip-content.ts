"use client";

import { loadJSON, saveJSON, nextId, tripScopedKey } from "./wallet-data";

/**
 * תוכן-הטיול (תחנות-מסלול + פעילויות-יומיות) של הטיול האמיתי של המשתמש —
 * מקור-האמת המשותף למסכי מסלול/שינוי-סדר/תוכנית-יומית/מפה/פעילות. נשמר
 * ב-localStorage כדי ששינוי-סדר/הוספת-פעילות/מחיקה יהיו פעולות אמיתיות
 * שנשמרות (לא רק state זמני שנעלם ברענון), באותו עיקרון כמו wallet-data.ts.
 *
 * כל הפונקציות מקבלות tripId מפורש (לא מחשבות אותו בעצמן דרך
 * currentScopeTripId) — בניגוד לארנק/הזמנות/אריזה/מעקב. הסיבה: מסך זה
 * נגיש גם מ-URL-ים גלובליים בלי מזהה-טיול (/route, /map) וגם מ-/trips/[id]/plan
 * שיכול להצביע על טיול שאינו הטיול-הפעיל (למשל טיול עתידי/היסטורי) — קורא
 * מפורש חייב להחליט בעצמו איזה tripId רלוונטי, אחרת צפייה בתוכנית של טיול
 * לא-פעיל הייתה בטעות מציגה/עורכת את המסלול של הטיול הפעיל.
 */

export interface TripActivity {
  id: string;
  time: string;
  durationLabel: string;
  title: string;
  category: "אתר" | "אוכל" | "קניות" | "טיול" | "עוד";
  location: string;
  notes: string;
  lat?: number;
  lon?: number;
  /** סדר-ביקור בפועל ליום (0,1,2...) — נפרד מ-time (שנשאר תווית-שעה חופשית
   * שהמשתמש הזין, לא "אמת" לסדר). מוגדר רק אחרי מיטוב-סדר או גרירה ידנית;
   * activityForDate/sortActivities נופלים חזרה למיון-לפי-time כשאין order
   * בכלל, כדי לא לשבור התנהגות קיימת של הזמנות ישנות. */
  order?: number;
}

export type StopStatus = "בוצע" | "מאושר" | "ממתין לאישור";

export interface TripStop {
  id: string;
  city: string;
  countryCode: string;
  startDate: string;
  endDate: string;
  transportToNext: string;
  status?: StopStatus;
  hotel?: string;
  attractions?: string[];
  restaurants?: string[];
  lat?: number;
  lon?: number;
}

const SK_STOPS = "design-preview-trip-stops-v1";
const SK_ACTIVITIES = "design-preview-trip-activities-v1";

// לפי בקשה מפורשת: אין יותר מסלול-דמו שמופיע מעצמו. מסלול חדש (או אחרי
// איפוס) מתחיל ריק — המשתמש בונה אותו בעצמו דרך "הוספת תחנה".
export const DEFAULT_STOPS: TripStop[] = [];

const DEFAULT_ACTIVITIES: Record<string, TripActivity[]> = {};

export function loadStops(tripId: string): TripStop[] {
  return loadJSON(tripScopedKey(SK_STOPS, tripId), DEFAULT_STOPS);
}
export function saveStops(tripId: string, stops: TripStop[]) {
  saveJSON(tripScopedKey(SK_STOPS, tripId), stops);
}
/** מוסיפה תחנה חדשה למסלול (ממוינת לפי תאריך-התחלה) — לפני כן לא הייתה
 * שום דרך אמיתית להוסיף תחנה; כפתור "הוסף תחנה" במסך המסלול לא עשה כלום. */
export function addStop(tripId: string, stop: Omit<TripStop, "id">): TripStop {
  const full: TripStop = { ...stop, id: nextId("stop") };
  const stops = [...loadStops(tripId), full].sort((a, b) => a.startDate.localeCompare(b.startDate));
  saveStops(tripId, stops);
  return full;
}
export function updateStop(tripId: string, stopId: string, patch: Partial<Omit<TripStop, "id">>): TripStop | null {
  const stops = loadStops(tripId);
  const idx = stops.findIndex((s) => s.id === stopId);
  if (idx === -1) return null;
  const updated = { ...stops[idx]!, ...patch };
  const arr = [...stops];
  arr[idx] = updated;
  arr.sort((a, b) => a.startDate.localeCompare(b.startDate));
  saveStops(tripId, arr);
  return updated;
}
export function deleteStop(tripId: string, stopId: string) {
  saveStops(tripId, loadStops(tripId).filter((s) => s.id !== stopId));
}
export function loadActivities(tripId: string): Record<string, TripActivity[]> {
  return loadJSON(tripScopedKey(SK_ACTIVITIES, tripId), DEFAULT_ACTIVITIES);
}
export function saveActivities(tripId: string, map: Record<string, TripActivity[]>) {
  saveJSON(tripScopedKey(SK_ACTIVITIES, tripId), map);
}
/** מיון-ברירת-מחדל: אם יש order מוגדר (אחרי מיטוב-סדר/גרירה ידנית) הוא
 * קובע; אחרת נופלים למיון-לפי-שעה הקיים, כדי לא לשנות התנהגות של ימים
 * שעדיין לא עברו מיטוב-סדר בכלל. */
export function sortActivities(list: TripActivity[]): TripActivity[] {
  return [...list].sort((a, b) => {
    if (a.order != null && b.order != null) return a.order - b.order;
    if (a.order != null) return -1;
    if (b.order != null) return 1;
    return a.time.localeCompare(b.time);
  });
}
export function activitiesForDate(tripId: string, date: string): TripActivity[] {
  return sortActivities(loadActivities(tripId)[date] ?? []);
}
/** קובעת סדר-ביקור מפורש לכל הפעילויות של יום מסוים, לפי רשימת-ID
 * בסדר הרצוי — משמשת גם למיטוב-סדר אוטומטי (Haversine) וגם לגרירה/
 * הזזה ידנית, שתי הדרכים כותבות דרך אותה פונקציה כדי שלא יהיו שני
 * מנגנוני-שמירה נפרדים. מזהי-ID שלא ברשימה (לא אמורים לקרות, אך ליתר-
 * ביטחון) מקבלים את הסדר הבא בתור, לא נעלמים.
 */
export function reorderActivitiesForDate(tripId: string, date: string, orderedIds: string[]): TripActivity[] {
  const map = loadActivities(tripId);
  const list = map[date] ?? [];
  const orderIndex = new Map(orderedIds.map((id, i) => [id, i]));
  let nextFallback = orderedIds.length;
  const updated = list.map((a) => ({ ...a, order: orderIndex.get(a.id) ?? nextFallback++ }));
  map[date] = updated;
  saveActivities(tripId, map);
  return sortActivities(updated);
}

// מרחק-קווי (Haversine, ק"מ) בין שתי נקודות — לא זמן-נסיעה אמיתי בכביש
// (זה ידרוש שירות-ניתוב חיצוני עם מפתח-API, החלטה מפורשת לדחות לעתיד).
function haversineKm(a: { lat: number; lon: number }, b: { lat: number; lon: number }): number {
  const R = 6371;
  const toRad = (deg: number) => (deg * Math.PI) / 180;
  const dLat = toRad(b.lat - a.lat);
  const dLon = toRad(b.lon - a.lon);
  const h = Math.sin(dLat / 2) ** 2 + Math.cos(toRad(a.lat)) * Math.cos(toRad(b.lat)) * Math.sin(dLon / 2) ** 2;
  return 2 * R * Math.asin(Math.sqrt(h));
}

/** מציעה סדר-ביקור טוב ליום — "השכן הקרוב הבא" (nearest-neighbor) בין
 * הפעילויות עם מיקום אמיתי, כדי להימנע מסיבובים מיותרים. נקודת-ההתחלה
 * היא הפעילות הראשונה בסדר הנוכחי; נקודת-הסיום (endId, אם צוינה) נשמרת
 * תמיד אחרונה — ברירת-המחדל היא הפעילות האחרונה בסדר הנוכחי, בדיוק כמו
 * שהיה קודם, אלא אם המשתמש יבחר endId אחר. פעילויות בלי מיקום ידוע
 * (lat/lon) לא משתתפות בחישוב-המרחקים ומתווספות בסוף, בסדר-הזמן הקיים
 * שלהן — לא ממציאים להן מיקום. תוצאה: מערך ה-ID בסדר המומלץ, לא נשמר
 * בעצמו — הקורא מעביר אותו ל-reorderActivitiesForDate כדי לשמור בפועל. */
export function optimizeActivityOrder(activities: TripActivity[], endId?: string): string[] {
  const geocoded = activities.filter((a): a is TripActivity & { lat: number; lon: number } => a.lat != null && a.lon != null);
  const nonGeocoded = activities.filter((a) => a.lat == null || a.lon == null);
  if (geocoded.length <= 2) return [...geocoded, ...nonGeocoded].map((a) => a.id);

  const remaining = [...geocoded];
  const start = remaining.shift()!;
  const ordered = [start];

  const resolvedEndId = endId ?? geocoded[geocoded.length - 1]!.id;
  let endActivity: (typeof geocoded)[number] | undefined;
  if (resolvedEndId !== start.id) {
    const idx = remaining.findIndex((a) => a.id === resolvedEndId);
    if (idx !== -1) {
      endActivity = remaining[idx];
      remaining.splice(idx, 1);
    }
  }

  while (remaining.length > 0) {
    const last = ordered[ordered.length - 1]!;
    let bestIdx = 0;
    let bestDist = Infinity;
    remaining.forEach((a, i) => {
      const d = haversineKm(last, a);
      if (d < bestDist) {
        bestDist = d;
        bestIdx = i;
      }
    });
    ordered.push(remaining[bestIdx]!);
    remaining.splice(bestIdx, 1);
  }
  if (endActivity) ordered.push(endActivity);

  return [...ordered.map((a) => a.id), ...nonGeocoded.map((a) => a.id)];
}
export function findActivity(tripId: string, id: string): { activity: TripActivity; date: string } | null {
  const map = loadActivities(tripId);
  for (const date of Object.keys(map)) {
    const found = map[date]!.find((a) => a.id === id);
    if (found) return { activity: found, date };
  }
  return null;
}
export function saveActivity(tripId: string, date: string, activity: TripActivity) {
  const map = loadActivities(tripId);
  const list = map[date] ?? [];
  const idx = list.findIndex((a) => a.id === activity.id);
  if (idx === -1) map[date] = [...list, activity].sort((a, b) => a.time.localeCompare(b.time));
  else map[date] = list.map((a) => (a.id === activity.id ? activity : a));
  saveActivities(tripId, map);
}
export function deleteActivity(tripId: string, id: string) {
  const map = loadActivities(tripId);
  for (const date of Object.keys(map)) {
    map[date] = map[date]!.filter((a) => a.id !== id);
  }
  saveActivities(tripId, map);
}
export function cityForDate(tripId: string, date: string): string {
  const stops = loadStops(tripId);
  const stop = stops.find((s) => date >= s.startDate && date <= s.endDate);
  return stop?.city ?? "";
}
/** סך כל הפעילויות בטיול (על פני כל התאריכים) — לשימוש בכרטיס "סיכום
 * הטיול", שהיה מציג "0" קבוע לכל טיול חוץ מ"יפן" בלי לספור בפועל. */
export function countActivities(tripId: string): number {
  const map = loadActivities(tripId);
  return Object.values(map).reduce((sum, list) => sum + list.length, 0);
}
/** התאריך הראשון (מסודר) בטווח [startDate, endDate] שאין בו אף פעילות —
 * לשימוש בכרטיס "כמעט מוכנים לטיול" בדף הבית. */
export function firstDateWithoutActivity(tripId: string, startDate: string, endDate: string): string | null {
  const map = loadActivities(tripId);
  let d = startDate;
  while (d <= endDate) {
    if (!(map[d]?.length)) return d;
    const next = new Date(d);
    next.setDate(next.getDate() + 1);
    d = next.toISOString().slice(0, 10);
  }
  return null;
}
/** כמה ימים בטווח הטיול אין בהם אף פעילות — לשימוש באותו כרטיס. */
export function countDatesWithoutActivity(tripId: string, startDate: string, endDate: string): number {
  const map = loadActivities(tripId);
  let count = 0;
  let d = startDate;
  while (d <= endDate) {
    if (!(map[d]?.length)) count += 1;
    const next = new Date(d);
    next.setDate(next.getDate() + 1);
    d = next.toISOString().slice(0, 10);
  }
  return count;
}
