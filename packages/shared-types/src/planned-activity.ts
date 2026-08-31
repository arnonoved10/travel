import { z } from "zod";
import { lifecycleStatusSchema } from "./enums";

export const plannedActivitySchema = z.object({
  id: z.uuid(),
  tripId: z.uuid(),
  placeId: z.uuid().nullable(),
  bookingId: z.uuid().nullable(),
  name: z.string().min(1),
  activityType: z.string().nullable(),
  plannedAt: z.iso.datetime().nullable(),
  plannedTimezone: z.string().nullable(),
  estimatedDurationMinutes: z.number().int().positive().nullable(),
  estimatedPrice: z.number().nonnegative().nullable(),
  estimatedCurrencyCode: z.string().length(3).nullable(),
  notes: z.string().nullable(),
  status: lifecycleStatusSchema,
  personalRating: z.number().int().min(1).max(5).nullable(),
  deletedAt: z.iso.datetime().nullable(),
  createdAt: z.iso.datetime(),
  updatedAt: z.iso.datetime(),
});
export type PlannedActivity = z.infer<typeof plannedActivitySchema>;

export const createPlannedActivityInputSchema = z.object({
  tripId: z.uuid(),
  placeId: z.uuid().optional(),
  name: z.string().trim().min(1, "שם הפעילות הוא שדה חובה"),
  activityType: z.string().optional(),
  plannedAt: z.iso.datetime("תאריך/שעה מתוכננים לא תקינים").optional(),
  plannedTimezone: z.string().optional(),
  estimatedDurationMinutes: z.number().int().positive().optional(),
  estimatedPrice: z.number().nonnegative().optional(),
  estimatedCurrencyCode: z.string().length(3, "קוד מטבע חייב להיות בן 3 תווים (ISO 4217)").optional(),
  notes: z.string().optional(),
  status: lifecycleStatusSchema.default("want_to_book"),
});
// z.input (לא z.infer) כדי ש-status יישאר אופציונלי בטיפוס — ל-.default()
// יש ערך רק אחרי .parse(), לא לפני. ראה גם createTripInputSchema אם קיים דפוס דומה.
export type CreatePlannedActivityInput = z.input<typeof createPlannedActivityInputSchema>;

export const updatePlannedActivityStatusInputSchema = z.object({
  plannedActivityId: z.uuid(),
  status: lifecycleStatusSchema,
});
export type UpdatePlannedActivityStatusInput = z.infer<typeof updatePlannedActivityStatusInputSchema>;

export const updatePlannedActivityPersonalRatingInputSchema = z.object({
  plannedActivityId: z.uuid(),
  personalRating: z.number().int().min(1).max(5).nullable(),
});
export type UpdatePlannedActivityPersonalRatingInput = z.infer<typeof updatePlannedActivityPersonalRatingInputSchema>;
