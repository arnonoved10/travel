import { z } from "zod";

// TripCompanion קיים ב-Prisma schema מהתחלה (עם relations מ-BookingParticipant
// ו-Payment.paidByCompanionId) אך היה ב-0% שימוש בקוד — נחשף עכשיו לצורך
// "מלווים בטיול" + חלוקת-הוצאות. אין softDelete-restore (בשונה מ-Contact) —
// deletedAt קיים אך אין UI לשחזור, "מלווה" הוא רשומה קלה יותר.
export const tripCompanionSchema = z.object({
  id: z.uuid(),
  tripId: z.uuid(),
  displayName: z.string().min(1),
  relation: z.string().nullable(),
  notes: z.string().nullable(),
  deletedAt: z.iso.datetime().nullable(),
});
export type TripCompanion = z.infer<typeof tripCompanionSchema>;

export const createTripCompanionInputSchema = z.object({
  tripId: z.uuid(),
  displayName: z.string().trim().min(1, "שם המלווה הוא שדה חובה"),
  relation: z.string().optional(),
  notes: z.string().optional(),
});
export type CreateTripCompanionInput = z.infer<typeof createTripCompanionInputSchema>;
