import { z } from "zod";

// TripCountry/TripCity קיימים בסכימה מהתחלה אך היו ב-0% שימוש (לא נשמרו/לא
// הוצגו בשום UI) — ר' FEATURE_AUDIT.md #79. אין deletedAt בכוונה (רשימת
// תגיות קלה, לא ישות עסקית שדורשת Soft Delete/היסטוריה).
export const tripCountrySchema = z.object({
  id: z.uuid(),
  tripId: z.uuid(),
  countryName: z.string().min(1),
  orderIndex: z.number().int(),
});
export type TripCountry = z.infer<typeof tripCountrySchema>;

export const createTripCountryInputSchema = z.object({
  tripId: z.uuid(),
  countryName: z.string().trim().min(1, "שם המדינה הוא שדה חובה"),
});
export type CreateTripCountryInput = z.infer<typeof createTripCountryInputSchema>;

export const tripCitySchema = z.object({
  id: z.uuid(),
  tripId: z.uuid(),
  countryId: z.uuid().nullable(),
  cityName: z.string().min(1),
  orderIndex: z.number().int(),
});
export type TripCity = z.infer<typeof tripCitySchema>;

export const createTripCityInputSchema = z.object({
  tripId: z.uuid(),
  countryId: z.uuid().optional(),
  cityName: z.string().trim().min(1, "שם העיר הוא שדה חובה"),
});
export type CreateTripCityInput = z.infer<typeof createTripCityInputSchema>;
