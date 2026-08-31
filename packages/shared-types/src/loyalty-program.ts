import { z } from "zod";
import { loyaltyProgramTypeSchema } from "./enums";

// גלובלי פר-משתמש (לא פר-טיול) — אותו עיקרון כמו PaymentCard/Contact: כרטיס-
// מועדון אחד משמש בכמה טיולים.
export const loyaltyProgramSchema = z.object({
  id: z.uuid(),
  userId: z.uuid(),
  programName: z.string().min(1),
  programType: loyaltyProgramTypeSchema.nullable(),
  memberNumber: z.string().nullable(),
  currentBalance: z.number().int().nullable(),
  tierStatus: z.string().nullable(),
  notes: z.string().nullable(),
  deletedAt: z.iso.datetime().nullable(),
});
export type LoyaltyProgram = z.infer<typeof loyaltyProgramSchema>;

export const createLoyaltyProgramInputSchema = z.object({
  programName: z.string().trim().min(1, "שם התוכנית הוא שדה חובה"),
  programType: loyaltyProgramTypeSchema.optional(),
  memberNumber: z.string().optional(),
  currentBalance: z.number().int().optional(),
  tierStatus: z.string().optional(),
  notes: z.string().optional(),
});
export type CreateLoyaltyProgramInput = z.infer<typeof createLoyaltyProgramInputSchema>;
