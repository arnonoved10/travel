import { z } from "zod";

export const depositSchema = z.object({
  id: z.uuid(),
  tripId: z.uuid(),
  bookingId: z.uuid().nullable(),
  amount: z.number().positive(),
  currencyCode: z.string().length(3),
  paidTo: z.string().nullable(),
  reason: z.string().nullable(),
  expectedReturnDate: z.iso.date().nullable(),
  isReturned: z.boolean(),
  returnedAmount: z.number().nonnegative().nullable(),
  returnedDate: z.iso.date().nullable(),
  deletedAt: z.iso.datetime().nullable(),
  createdAt: z.iso.datetime(),
});
export type Deposit = z.infer<typeof depositSchema>;

export const createDepositInputSchema = z.object({
  tripId: z.uuid(),
  bookingId: z.uuid().optional(),
  amount: z.number().positive("סכום הפיקדון חייב להיות גדול מאפס"),
  currencyCode: z.string().length(3, "קוד מטבע חייב להיות בן 3 תווים (ISO 4217)"),
  paidTo: z.string().optional(),
  reason: z.string().optional(),
  expectedReturnDate: z.iso.date("תאריך החזר צפוי לא תקין").optional(),
});
export type CreateDepositInput = z.infer<typeof createDepositInputSchema>;

export const markDepositReturnedInputSchema = z.object({
  depositId: z.uuid(),
  returnedAmount: z.number().nonnegative("סכום ההחזר לא יכול להיות שלילי"),
  returnedDate: z.iso.date("תאריך ההחזר לא תקין"),
});
export type MarkDepositReturnedInput = z.infer<typeof markDepositReturnedInputSchema>;
