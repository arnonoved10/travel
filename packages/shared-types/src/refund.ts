import { z } from "zod";

export const refundSchema = z.object({
  id: z.uuid(),
  tripId: z.uuid(),
  sourceExpenseId: z.uuid(),
  sourcePaymentId: z.uuid().nullable(),
  amount: z.number().positive(),
  currencyCode: z.string().length(3),
  reason: z.string().nullable(),
  refundAt: z.iso.datetime(),
  isReceived: z.boolean(),
  notes: z.string().nullable(),
});
export type Refund = z.infer<typeof refundSchema>;

export const createRefundInputSchema = z.object({
  tripId: z.uuid(),
  sourceExpenseId: z.uuid({ message: "יש לבחור את ההוצאה שעליה מתקבל ההחזר" }),
  sourcePaymentId: z.uuid().optional(),
  amount: z.number().positive("סכום ההחזר חייב להיות גדול מאפס"),
  currencyCode: z.string().length(3, "קוד מטבע חייב להיות בן 3 תווים (ISO 4217)"),
  reason: z.string().optional(),
  refundAt: z.iso.datetime("תאריך ההחזר לא תקין"),
  isReceived: z.boolean().optional(),
  notes: z.string().optional(),
});
export type CreateRefundInput = z.infer<typeof createRefundInputSchema>;

export const markRefundReceivedInputSchema = z.object({
  refundId: z.uuid(),
  receivedDate: z.iso.date("תאריך הקבלה לא תקין"),
});
export type MarkRefundReceivedInput = z.infer<typeof markRefundReceivedInputSchema>;
