import { z } from "zod";

export const currencyExchangeSchema = z.object({
  id: z.uuid(),
  tripId: z.uuid(),
  givenAmount: z.number().positive(),
  givenCurrencyCode: z.string().length(3),
  receivedAmount: z.number().positive(),
  receivedCurrencyCode: z.string().length(3),
  actualRate: z.number().positive(),
  feeAmount: z.number().nonnegative().nullable(),
  exchangeAt: z.iso.datetime(),
  notes: z.string().nullable(),
});
export type CurrencyExchange = z.infer<typeof currencyExchangeSchema>;

export const createCurrencyExchangeInputSchema = z.object({
  tripId: z.uuid(),
  givenAmount: z.number().positive("הסכום שהומר חייב להיות גדול מאפס"),
  givenCurrencyCode: z.string().length(3, "קוד מטבע חייב להיות בן 3 תווים (ISO 4217)"),
  receivedAmount: z.number().positive("הסכום שהתקבל חייב להיות גדול מאפס"),
  receivedCurrencyCode: z.string().length(3, "קוד מטבע חייב להיות בן 3 תווים (ISO 4217)"),
  actualRate: z.number().positive("שער ההמרה חייב להיות גדול מאפס"),
  feeAmount: z.number().nonnegative().optional(),
  locationName: z.string().optional(),
  exchangeAt: z.iso.datetime("תאריך ההמרה לא תקין"),
  notes: z.string().optional(),
});
export type CreateCurrencyExchangeInput = z.infer<typeof createCurrencyExchangeInputSchema>;

/** תיקון להמרה קיימת — רק סכומים (לא מטבעות), ר' ההערה על correctCurrencyExchange ב-FinanceRepository. */
export const correctCurrencyExchangeInputSchema = z.object({
  exchangeId: z.uuid(),
  correctedGivenAmount: z.number().positive("הסכום שניתן חייב להיות גדול מאפס"),
  correctedReceivedAmount: z.number().positive("הסכום שהתקבל חייב להיות גדול מאפס"),
  reason: z.string().optional(),
});
export type CorrectCurrencyExchangeInput = z.infer<typeof correctCurrencyExchangeInputSchema>;
