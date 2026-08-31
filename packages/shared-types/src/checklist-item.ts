import { z } from "zod";
import { checklistListTypeSchema } from "./enums";

// רשימת אריזה וצ'קליסט לפני הטיול חולקים מבנה זהה (פריט+וי) — listType מבחין
// ביניהם, ר' ההערה המקבילה ב-schema.prisma.
export const checklistItemSchema = z.object({
  id: z.uuid(),
  tripId: z.uuid(),
  listType: checklistListTypeSchema,
  name: z.string().min(1),
  category: z.string().nullable(),
  quantity: z.number().int().positive().nullable(),
  isDone: z.boolean(),
  orderIndex: z.number().int(),
  deletedAt: z.iso.datetime().nullable(),
  createdAt: z.iso.datetime(),
});
export type ChecklistItem = z.infer<typeof checklistItemSchema>;

export const createChecklistItemInputSchema = z.object({
  tripId: z.uuid(),
  listType: checklistListTypeSchema,
  name: z.string().trim().min(1, "שם הפריט הוא שדה חובה"),
  category: z.string().trim().optional(),
  quantity: z.number().int().positive().optional(),
});
export type CreateChecklistItemInput = z.infer<typeof createChecklistItemInputSchema>;
