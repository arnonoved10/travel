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

export interface TripStop {
  id: string;
  city: string;
  countryCode: string;
  startDate: string;
  endDate: string;
  transportToNext: string;
}

const SK_STOPS = "design-preview-trip-stops-v1";
const SK_ACTIVITIES = "design-preview-trip-activities-v1";

export const DEFAULT_STOPS: TripStop[] = [
  { id: "stop-tokyo-1", city: "טוקיו", countryCode: "JP", startDate: "2025-06-15", endDate: "2025-06-17", transportToNext: "רכבת שינקנסן · כ-2:15 שעות" },
  { id: "stop-kyoto", city: "קיוטו", countryCode: "JP", startDate: "2025-06-18", endDate: "2025-06-20", transportToNext: "רכבת · כ-15 דקות" },
  { id: "stop-osaka", city: "אוסקה", countryCode: "JP", startDate: "2025-06-21", endDate: "2025-06-22", transportToNext: "רכבת שינקנסן · כ-1:45 שעות" },
  { id: "stop-hiroshima", city: "הירושימה", countryCode: "JP", startDate: "2025-06-23", endDate: "2025-06-25", transportToNext: "רכבת שינקנסן · כ-1:20 שעות" },
  { id: "stop-tokyo-2", city: "טוקיו", countryCode: "JP", startDate: "2025-06-26", endDate: "2025-06-28", transportToNext: "" },
];

const DEFAULT_ACTIVITIES: Record<string, TripActivity[]> = {
  "2025-06-15": [
    { id: nextId("act"), time: "09:00", durationLabel: "שעתיים", title: "מקדש סנסו-ג'י", category: "אתר", location: "2 Chome-3-1 Asakusa, Taito City, Tokyo", notes: "אתר היסטורי" },
    { id: nextId("act"), time: "12:00", durationLabel: "שעה וחצי", title: "שוק אמיוקו", category: "קניות", location: "Ameyoko, Taito City, Tokyo", notes: "שופינג" },
    { id: nextId("act"), time: "15:00", durationLabel: "שעה", title: "סיור בשינג'וקו", category: "טיול", location: "Shinjuku, Tokyo", notes: "סיור עירוני" },
    { id: nextId("act"), time: "19:00", durationLabel: "שעתיים", title: "ארוחת ערב בשינג'וקו", category: "אוכל", location: "Shinjuku, Tokyo", notes: "קולינרי" },
  ],
  "2025-06-18": [
    { id: nextId("act"), time: "10:00", durationLabel: "שעתיים", title: "פושימי אינרי טאישה", category: "אתר", location: "Fushimi-ku, Kyoto", notes: "אתר היסטורי" },
    { id: nextId("act"), time: "14:00", durationLabel: "שעה", title: "גיון ורובע הגיישות", category: "טיול", location: "Gion, Kyoto", notes: "סיור עירוני" },
  ],
};

export function loadStops(): TripStop[] {
  return loadJSON(SK_STOPS, DEFAULT_STOPS);
}
export function saveStops(stops: TripStop[]) {
  saveJSON(SK_STOPS, stops);
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
