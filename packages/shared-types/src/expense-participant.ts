import { z } from "zod";

// מי (TripCompanion) משתתף בהוצאה משותפת — הבסיס ל"סגירת חשבונות"
// (ר' apps/web/lib/settle-up.ts). רק הוצאות עם משתתפים נבחרים-במפורש
// נכללות בחישוב; בעל החשבון עצמו אינו שורה כאן (מובלע תמיד כמשתתף).
export const expenseParticipantSchema = z.object({
  id: z.uuid(),
  expenseId: z.uuid(),
  companionId: z.uuid(),
});
export type ExpenseParticipant = z.infer<typeof expenseParticipantSchema>;
