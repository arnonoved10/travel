import { z } from "zod";
import { paymentMethodSchema } from "./enums";

export const paymentSchema = z.object({
  id: z.uuid(),
  expenseId: z.uuid().nullable(),
  bookingId: z.uuid().nullable(),
  amount: z.number().positive(),
  currencyCode: z.string().length(3),
  paymentAt: z.iso.datetime(),
  paymentMethod: paymentMethodSchema,
  cardId: z.uuid().nullable(),
  // מי שילם בפועל, כשלא בעל החשבון (TripCompanion) — ר' settle-up.ts.
  // null = בהנחה "אני שילמתי" (ברירת המחדל בשאר המודל הכספי של האפליקציה).
  paidByCompanionId: z.uuid().nullable(),
  notes: z.string().nullable(),
  deletedAt: z.iso.datetime().nullable(),
});
export type Payment = z.infer<typeof paymentSchema>;

export const createPaymentInputSchema = z
  .object({
    expenseId: z.uuid().optional(),
    bookingId: z.uuid().optional(),
    amount: z.number().positive("סכום התשלום חייב להיות גדול מאפס"),
    currencyCode: z.string().length(3, "קוד מטבע חייב להיות בן 3 תווים (ISO 4217)"),
    paymentAt: z.iso.datetime("תאריך התשלום לא תקין"),
    paymentMethod: paymentMethodSchema,
    cardId: z.uuid().optional(),
    cardChargedAmount: z.number().nonnegative().optional(),
    cardChargedCurrencyCode: z.string().length(3).optional(),
    paidByCompanionId: z.uuid().optional(),
    notes: z.string().optional(),
  })
  .refine((data) => data.expenseId !== undefined || data.bookingId !== undefined, {
    message: "יש לקשר תשלום להוצאה או להזמנה",
    path: ["expenseId"],
  });
export type CreatePaymentInput = z.infer<typeof createPaymentInputSchema>;
