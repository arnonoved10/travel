"use server";

import { searchPlacesByText, type PlaceSearchOutcome } from "@/lib/geocoding/google-place-search";

/** קרוא מ-location-picker-map.tsx (client component) — עוטף חיפוש-שרת אמיתי
 * (Google Places, ר' lib/geocoding/google-place-search.ts) כי מפתח ה-API
 * הוא סוד-שרת, לא NEXT_PUBLIC_. */
export async function searchLocationAction(query: string): Promise<PlaceSearchOutcome> {
  const trimmed = query.trim();
  if (trimmed.length === 0) return { ok: true, results: [] };
  return searchPlacesByText(trimmed);
}
