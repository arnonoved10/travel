import { z } from "zod";
import { walletTxTypeSchema } from "./enums";

export const walletSchema = z.object({
  id: z.uuid(),
  tripId: z.uuid(),
  currencyCode: z.string().length(3),
  /** מה שהיה בארנק ברגע שנוצר — קפוא לתמיד, לא גדל עם top-up נוסף (בשונה מ-initialAmount). */
  openingBalance: z.number().nonnegative(),
  initialAmount: z.number().nonnegative(),
  currentBalance: z.number(),
});
export type Wallet = z.infer<typeof walletSchema>;

export const createWalletInputSchema = z.object({
  tripId: z.uuid(),
  currencyCode: z.string().length(3, "קוד מטבע חייב להיות בן 3 תווים (ISO 4217)"),
  initialAmount: z.number().nonnegative("סכום פתיחה לא יכול להיות שלילי"),
});
export type CreateWalletInput = z.infer<typeof createWalletInputSchema>;

export const reconcileWalletInputSchema = z.object({
  walletId: z.uuid(),
  actualBalance: z.number(),
  reason: z.string().optional(),
});
export type ReconcileWalletInput = z.infer<typeof reconcileWalletInputSchema>;

/** מתקן/מבטל הפקדה (top_up) ספציפית שנרשמה בטעות — למשל במטבע הלא-נכון.
 * correctedAmount=0 מבטל אותה לגמרי (המשתמש יכול אז להפקיד מחדש במטבע הנכון). */
export const correctWalletTopUpInputSchema = z.object({
  transactionId: z.uuid(),
  correctedAmount: z.number().nonnegative("סכום מתוקן לא יכול להיות שלילי"),
  reason: z.string().optional(),
});
export type CorrectWalletTopUpInput = z.infer<typeof correctWalletTopUpInputSchema>;

export const walletTransactionSchema = z.object({
  id: z.uuid(),
  walletId: z.uuid(),
  type: walletTxTypeSchema,
  amount: z.number(),
  txAt: z.iso.datetime(),
  notes: z.string().nullable(),
});
export type WalletTransaction = z.infer<typeof walletTransactionSchema>;
