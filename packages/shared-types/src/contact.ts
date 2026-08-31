import { z } from "zod";
import { contactCategorySchema } from "./enums";

export const contactSchema = z.object({
  id: z.uuid(),
  userId: z.uuid(),
  tripId: z.uuid().nullable(),
  name: z.string().min(1),
  company: z.string().nullable(),
  role: z.string().nullable(),
  phone: z.string().nullable(),
  whatsapp: z.string().nullable(),
  email: z.email().nullable(),
  website: z.url().nullable(),
  category: contactCategorySchema.nullable(),
  notes: z.string().nullable(),
  deletedAt: z.iso.datetime().nullable(),
});
export type Contact = z.infer<typeof contactSchema>;

export const createContactInputSchema = z.object({
  tripId: z.uuid().optional(),
  name: z.string().trim().min(1, "שם איש הקשר הוא שדה חובה"),
  company: z.string().optional(),
  role: z.string().optional(),
  phone: z.string().optional(),
  whatsapp: z.string().optional(),
  email: z.email().optional(),
  website: z.url().optional(),
  category: contactCategorySchema.optional(),
  notes: z.string().optional(),
});
export type CreateContactInput = z.infer<typeof createContactInputSchema>;
