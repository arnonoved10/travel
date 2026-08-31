import { z } from "zod";

// limitAmount תמיד ב-₪ — ר' Trip.totalBudgetAmount/dailyBudgetAmount (trip.ts) לאותה החלטה.
export const budgetCategoryLimitSchema = z.object({
  id: z.uuid(),
  tripId: z.uuid(),
  category: z.string().min(1),
  limitAmount: z.number().positive(),
  createdAt: z.iso.datetime(),
  updatedAt: z.iso.datetime(),
});
export type BudgetCategoryLimit = z.infer<typeof budgetCategoryLimitSchema>;

export const upsertBudgetCategoryLimitInputSchema = z.object({
  tripId: z.uuid(),
  category: z.string().trim().min(1, "קטגוריה היא שדה חובה"),
  limitAmount: z.number().positive("תקציב הקטגוריה חייב להיות גדול מאפס"),
});
export type UpsertBudgetCategoryLimitInput = z.infer<typeof upsertBudgetCategoryLimitInputSchema>;
