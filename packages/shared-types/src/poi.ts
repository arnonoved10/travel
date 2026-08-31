// חיפוש מקומות אמיתיים בעולם (לא רק מה שכבר שמור בספריית המשתמש) — ראה
// DECISIONS.md ל"מצב POI": מחובר ל-Overpass API (שרת ציבורי חינמי של
// OpenStreetMap, בלי מפתח — אותו דפוס בדיוק כמו Weather/Routing). אם אין
// תשובה אמיתית מהספק, לא ממציאים תוצאות; מחזירים null.
import { z } from "zod";
import { placeCategorySchema } from "./enums";

export const poiSearchQuerySchema = z.object({
  lat: z.number().min(-90).max(90),
  lng: z.number().min(-180).max(180),
  radiusKm: z.number().positive().max(20),
  categories: z.array(placeCategorySchema).min(1),
});
export type PoiSearchQuery = z.infer<typeof poiSearchQuerySchema>;

export const poiCandidateSchema = z.object({
  externalId: z.string(),
  name: z.string(),
  category: placeCategorySchema,
  lat: z.number(),
  lng: z.number(),
  address: z.string().nullable(),
});
export type PoiCandidate = z.infer<typeof poiCandidateSchema>;

export interface PoiProvider {
  readonly name: string;
  /** null אם הספק נכשל/לא הגיב. מערך ריק (לא null) אם הצליח אבל לא נמצא כלום. */
  searchNearby(query: PoiSearchQuery): Promise<PoiCandidate[] | null>;
}
