"use client";

import { loadJSON, saveJSON, nextId } from "./wallet-data";

/**
 * תוכן-הטיול (תחנות-מסלול + פעילויות-יומיות) לטיול-הדמו של יפן, לפי
 * חבילת-העיצוב המחייבת (מסכי מסלול/שינוי-סדר/יומן/מפה/פעילות). נשמר
 * ב-localStorage כדי ששינוי-סדר/הוספת-פעילות/מחיקה יהיו פעולות אמיתיות
 * שנשמרות (לא רק state זמני שנעלם ברענון), באותו עיקרון כמו wallet-data.ts.
 */

export interface TripActivity {
  id: string;
  time: string;
  durationLabel: string;
  title: string;
  category: "אתר" | "אוכל" | "קניות" | "טיול" | "עוד";
  location: string;
  notes: string;
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
}

const SK_STOPS = "design-preview-trip-stops-v1";
const SK_ACTIVITIES = "design-preview-trip-activities-v1";

// לפי בקשה מפורשת: אין יותר מסלול-דמו שמופיע מעצמו. מסלול חדש (או אחרי
// איפוס) מתחיל ריק — המשתמש בונה אותו בעצמו דרך "הוספת תחנה".
export const DEFAULT_STOPS: TripStop[] = [];

const DEFAULT_ACTIVITIES: Record<string, TripActivity[]> = {};

export function loadStops(): TripStop[] {
  return loadJSON(SK_STOPS, DEFAULT_STOPS);
}
export function saveStops(stops: TripStop[]) {
  saveJSON(SK_STOPS, stops);
}
/** מוסיפה תחנה חדשה למסלול (ממוינת לפי תאריך-התחלה) — לפני כן לא הייתה
 * שום דרך אמיתית להוסיף תחנה; כפתור "הוסף תחנה" במסך המסלול לא עשה כלום. */
export function addStop(stop: Omit<TripStop, "id">): TripStop {
  const full: TripStop = { ...stop, id: nextId("stop") };
  const stops = [...loadStops(), full].sort((a, b) => a.startDate.localeCompare(b.startDate));
  saveStops(stops);
  return full;
}
export function updateStop(stopId: string, patch: Partial<Omit<TripStop, "id">>): TripStop | null {
  const stops = loadStops();
  const idx = stops.findIndex((s) => s.id === stopId);
  if (idx === -1) return null;
  const updated = { ...stops[idx]!, ...patch };
  const arr = [...stops];
  arr[idx] = updated;
  arr.sort((a, b) => a.startDate.localeCompare(b.startDate));
  saveStops(arr);
  return updated;
}
export function deleteStop(stopId: string) {
  saveStops(loadStops().filter((s) => s.id !== stopId));
}
export function loadActivities(): Record<string, TripActivity[]> {
  return loadJSON(SK_ACTIVITIES, DEFAULT_ACTIVITIES);
}
export function saveActivities(map: Record<string, TripActivity[]>) {
  saveJSON(SK_ACTIVITIES, map);
}
export function activitiesForDate(date: string): TripActivity[] {
  return loadActivities()[date] ?? [];
}
export function findActivity(id: string): { activity: TripActivity; date: string } | null {
  const map = loadActivities();
  for (const date of Object.keys(map)) {
    const found = map[date]!.find((a) => a.id === id);
    if (found) return { activity: found, date };
  }
  return null;
}
export function saveActivity(date: string, activity: TripActivity) {
  const map = loadActivities();
  const list = map[date] ?? [];
  const idx = list.findIndex((a) => a.id === activity.id);
  if (idx === -1) map[date] = [...list, activity].sort((a, b) => a.time.localeCompare(b.time));
  else map[date] = list.map((a) => (a.id === activity.id ? activity : a));
  saveActivities(map);
}
export function deleteActivity(id: string) {
  const map = loadActivities();
  for (const date of Object.keys(map)) {
    map[date] = map[date]!.filter((a) => a.id !== id);
  }
  saveActivities(map);
}
export const ALL_TRIP_DATES = ["2025-06-15", "2025-06-16", "2025-06-17", "2025-06-18", "2025-06-19", "2025-06-20", "2025-06-21", "2025-06-22", "2025-06-23", "2025-06-24", "2025-06-25", "2025-06-26", "2025-06-27", "2025-06-28"];

export function cityForDate(date: string): string {
  const stops = loadStops();
  const stop = stops.find((s) => date >= s.startDate && date <= s.endDate);
  return stop?.city ?? "";
}
