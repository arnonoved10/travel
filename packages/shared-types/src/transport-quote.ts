import { z } from "zod";
import { vehicleTypeSchema } from "./enums";

// שלב השוואה בין ספקי תחבורה שונים לפני הזמנה בפועל — לא מקושר אוטומטית
// ל-TransportBooking (transportBookingId נשאר null עד שהוזמן בפועל).
// isSelected הוא סימון ידני ("זו ההצעה שבחרתי"), לא המרה אוטומטית להזמנה.
export const transportQuoteSchema = z.object({
  id: z.uuid(),
  tripId: z.uuid(),
  transportBookingId: z.uuid().nullable(),
  provider: z.string().min(1),
  price: z.number().positive(),
  currencyCode: z.string().length(3),
  vehicleType: vehicleTypeSchema.nullable(),
  terms: z.string().nullable(),
  notes: z.string().nullable(),
  isSelected: z.boolean(),
  createdAt: z.iso.datetime(),
});
export type TransportQuote = z.infer<typeof transportQuoteSchema>;

export const createTransportQuoteInputSchema = z.object({
  tripId: z.uuid(),
  provider: z.string().trim().min(1, "שם הספק הוא שדה חובה"),
  price: z.number().positive("המחיר חייב להיות גדול מאפס"),
  currencyCode: z.string().length(3, "קוד מטבע חייב להיות בן 3 תווים (ISO 4217)"),
  vehicleType: vehicleTypeSchema.optional(),
  terms: z.string().optional(),
  notes: z.string().optional(),
});
export type CreateTransportQuoteInput = z.infer<typeof createTransportQuoteInputSchema>;
