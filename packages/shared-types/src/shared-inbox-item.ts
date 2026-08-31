import { z } from "zod";

// גלובלי פר-משתמש, זמני — ראה ההערה המקבילה ב-schema.prisma. fileUrl יכול
// להיות null (שיתוף טקסט/קישור בלבד בלי קובץ), בשונה מ-Document.fileUrl
// שהוא חובה שם — זה בדיוק ההבדל בין "תא-קליטה" לבין מסמך אמיתי שכבר שויך.
export const sharedInboxItemSchema = z.object({
  id: z.uuid(),
  userId: z.uuid(),
  fileUrl: z.url().nullable(),
  fileName: z.string().nullable(),
  mimeType: z.string().nullable(),
  sharedTitle: z.string().nullable(),
  sharedText: z.string().nullable(),
  sharedUrl: z.string().nullable(),
  createdAt: z.iso.datetime(),
});
export type SharedInboxItem = z.infer<typeof sharedInboxItemSchema>;

export const createSharedInboxItemInputSchema = z.object({
  fileUrl: z.url().optional(),
  fileName: z.string().optional(),
  mimeType: z.string().optional(),
  sharedTitle: z.string().optional(),
  sharedText: z.string().optional(),
  sharedUrl: z.string().optional(),
});
export type CreateSharedInboxItemInput = z.infer<typeof createSharedInboxItemInputSchema>;
