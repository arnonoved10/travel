import { z } from "zod";

export const paymentCardSchema = z.object({
  id: z.uuid(),
  userId: z.uuid(),
  cardName: z.string().min(1),
  defaultCurrencyCode: z.string().length(3).nullable(),
});
export type PaymentCard = z.infer<typeof paymentCardSchema>;

export const createPaymentCardInputSchema = z.object({
  cardName: z.string().trim().min(1, "שם הכרטיס הוא שדה חובה"),
  defaultCurrencyCode: z.string().length(3, "קוד מטבע חייב להיות בן 3 תווים (ISO 4217)").optional(),
});
export type CreatePaymentCardInput = z.infer<typeof createPaymentCardInputSchema>;
