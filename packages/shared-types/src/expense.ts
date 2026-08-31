import { z } from "zod";
import { dataSourceSchema, expenseCategorySchema, tipCategorySchema } from "./enums";

export const expenseSchema = z.object({
  id: z.uuid(),
  tripId: z.uuid(),
  bookingId: z.uuid().nullable(),
  placeId: z.uuid().nullable(),
  category: expenseCategorySchema,
  description: z.string().nullable(),
  // רלוונטי בעיקר לקניות — מה בדיוק נקנה ובאיזו כמות
  itemName: z.string().nullable(),
  quantity: z.number().int().positive().nullable(),
  amount: z.number().positive(),
  currencyCode: z.string().length(3),
  expenseAt: z.iso.datetime(),
  timezone: z.string().nullable(),
  // דירוג אישי 1-5 — רלוונטי בעיקר למסאז'ים/אוכל/אטרקציות
  personalRating: z.number().int().min(1).max(5).nullable(),
  // רלוונטי רק כש-category === "tip"
  tipRecipient: z.string().nullable(),
  tipCategory: tipCategorySchema.nullable(),
  notes: z.string().nullable(),
  dataSource: dataSourceSchema,
  deletedAt: z.iso.datetime().nullable(),
});
export type Expense = z.infer<typeof expenseSchema>;

export const createExpenseInputSchema = z.object({
  tripId: z.uuid(),
  bookingId: z.uuid().optional(),
  placeId: z.uuid().optional(),
  category: expenseCategorySchema,
  description: z.string().optional(),
  itemName: z.string().optional(),
  quantity: z.number().int().positive().optional(),
  amount: z.number().positive("סכום ההוצאה חייב להיות גדול מאפס"),
  currencyCode: z.string().length(3, "קוד מטבע חייב להיות בן 3 תווים (ISO 4217)"),
  expenseAt: z.iso.datetime("תאריך ההוצאה לא תקין"),
  timezone: z.string().optional(),
  personalRating: z.number().int().min(1).max(5).optional(),
  tipRecipient: z.string().optional(),
  tipCategory: tipCategorySchema.optional(),
  notes: z.string().optional(),
  // מלווים (TripCompanion) שמשתתפים בהוצאה הזו — לא עמודה על Expense עצמו,
  // נשמר בטבלת ExpenseParticipant נפרדת. ר' expense-participant.ts.
  participantCompanionIds: z.array(z.uuid()).optional(),
});
export type CreateExpenseInput = z.infer<typeof createExpenseInputSchema>;

// עדכון-חלקי — כל שדה אופציונלי חוץ מ-expenseId, רק מה שהמשתמש ציין באמת
// משתנה. נועד בעיקר לתיקון-אחרי-מעשה (עוזר-הצ'אט, "בעצם שילמתי 600 לא 500").
export const updateExpenseInputSchema = z.object({
  expenseId: z.uuid(),
  category: expenseCategorySchema.optional(),
  description: z.string().optional(),
  amount: z.number().positive("סכום ההוצאה חייב להיות גדול מאפס").optional(),
  currencyCode: z.string().length(3, "קוד מטבע חייב להיות בן 3 תווים (ISO 4217)").optional(),
  expenseAt: z.iso.datetime("תאריך ההוצאה לא תקין").optional(),
});
export type UpdateExpenseInput = z.infer<typeof updateExpenseInputSchema>;
