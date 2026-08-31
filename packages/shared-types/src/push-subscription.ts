import { z } from "zod";

// מנוי Web Push אמיתי (endpoint+keys שהדפדפן מייצר, ר' PushManager.subscribe
// בצד-לקוח) — לא ה-Notification API המקומי הקיים שרק פועל כשהדף פתוח.
export const pushSubscriptionSchema = z.object({
  id: z.uuid(),
  userId: z.uuid(),
  endpoint: z.url(),
  p256dh: z.string(),
  auth: z.string(),
  userAgent: z.string().nullable(),
  createdAt: z.iso.datetime(),
});
export type PushSubscription = z.infer<typeof pushSubscriptionSchema>;

export const createPushSubscriptionInputSchema = z.object({
  endpoint: z.url(),
  p256dh: z.string().min(1),
  auth: z.string().min(1),
  userAgent: z.string().optional(),
});
export type CreatePushSubscriptionInput = z.infer<typeof createPushSubscriptionInputSchema>;
