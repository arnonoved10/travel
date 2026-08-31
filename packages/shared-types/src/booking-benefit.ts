import { z } from "zod";
import { benefitTypeSchema } from "./enums";

export const bookingBenefitSchema = z.object({
  id: z.uuid(),
  bookingId: z.uuid(),
  benefitName: z.string(),
  benefitType: benefitTypeSchema.nullable(),
  notes: z.string().nullable(),
  valueAmount: z.number().nullable(),
  valueCurrencyCode: z.string().nullable(),
});
export type BookingBenefit = z.infer<typeof bookingBenefitSchema>;

export const createBookingBenefitInputSchema = z.object({
  bookingId: z.uuid(),
  benefitName: z.string().trim().min(1, "שם ההטבה הוא שדה חובה"),
  benefitType: benefitTypeSchema.optional(),
  notes: z.string().optional(),
  valueAmount: z.number().nonnegative().optional(),
  valueCurrencyCode: z.string().length(3).optional(),
});
export type CreateBookingBenefitInput = z.infer<typeof createBookingBenefitInputSchema>;
