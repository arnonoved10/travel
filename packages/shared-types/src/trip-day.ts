import { z } from "zod";

// TripDay קיים ב-schema.prisma כבר מ-2026-08-15 (ראה DECISIONS.md), אבל שימש
// רק כטבלת-קישור פנימית ל-Route (get-or-create שקוף, RouteStop API עובד
// לפי tripId+date ולא tripDayId). זה חושף אותו כישות ממשית: לתמיכה בהערות-יום
// (סעיף 4 באפיון, "ימי טיול") — לא כפילות מידע שכבר מחושב חי במקום אחר.
export const tripDaySchema = z.object({
  id: z.uuid(),
  tripId: z.uuid(),
  date: z.iso.date(),
  dayIndex: z.number().int().nullable(),
  notes: z.string().nullable(),
});
export type TripDay = z.infer<typeof tripDaySchema>;

export const updateTripDayNotesInputSchema = z.object({
  tripDayId: z.uuid(),
  notes: z.string().nullable(),
});
export type UpdateTripDayNotesInput = z.infer<typeof updateTripDayNotesInputSchema>;
