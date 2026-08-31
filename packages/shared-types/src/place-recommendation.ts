import { z } from "zod";

// Cache של תוצאות Google Places פר-טיול (ר' schema.prisma) — לא ישות שהמשתמש
// יוצר ידנית, לכן אין createXInputSchema; רק הטיפוס-לקריאה ופלט-הספק הגולמי.
export const placeRecommendationSchema = z.object({
  id: z.uuid(),
  tripId: z.uuid(),
  scopeLabel: z.string(),
  category: z.string().nullable(),
  name: z.string(),
  address: z.string().nullable(),
  rating: z.number().nullable(),
  userRatingsTotal: z.number().int().nullable(),
  mapsUrl: z.string(),
  photoUrl: z.string().nullable(),
  createdAt: z.iso.datetime(),
});
export type PlaceRecommendation = z.infer<typeof placeRecommendationSchema>;

export const placeRecommendationItemInputSchema = z.object({
  category: z.string().nullable(),
  name: z.string(),
  address: z.string().nullable(),
  rating: z.number().nullable(),
  userRatingsTotal: z.number().int().nullable(),
  mapsUrl: z.string(),
  photoUrl: z.string().nullable(),
});
export type PlaceRecommendationItemInput = z.infer<typeof placeRecommendationItemInputSchema>;
