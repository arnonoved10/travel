import { z } from "zod";

// הצבעות בין המלווים ("איפה אוכלים הערב") — proxy voting: בעל החשבון מזין
// את ההצבעות בעצמו, כי TripCompanion הן רשומות קלות בלי חשבון/התחברות
// משלהן (ר' DECISIONS.md). הצבעה אחת פר-מלווה-פר-סקר (לא כפילות) — נאכף
// ב-DB דרך unique([pollId, companionId]) על CompanionPollVote, לא כאן.

export const companionPollOptionSchema = z.object({
  id: z.uuid(),
  pollId: z.uuid(),
  text: z.string().min(1),
  orderIndex: z.number().int().nonnegative(),
});
export type CompanionPollOption = z.infer<typeof companionPollOptionSchema>;

export const companionPollSchema = z.object({
  id: z.uuid(),
  tripId: z.uuid(),
  question: z.string().min(1),
  createdAt: z.iso.datetime(),
});
export type CompanionPoll = z.infer<typeof companionPollSchema>;

export const createCompanionPollInputSchema = z.object({
  tripId: z.uuid(),
  question: z.string().trim().min(1, "השאלה היא שדה חובה"),
  optionTexts: z
    .array(z.string().trim().min(1))
    .min(2, "צריך לפחות 2 אפשרויות")
    .max(5, "עד 5 אפשרויות"),
});
export type CreateCompanionPollInput = z.infer<typeof createCompanionPollInputSchema>;
