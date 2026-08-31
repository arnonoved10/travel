import webpush from "web-push";
import { getPushSubscriptionRepository } from "@travel-app/data-layer";
import { logger } from "@/lib/logger";
import { isPushConfigured } from "./config";

export interface PushPayload {
  title: string;
  body: string;
  /** נתיב-יעד יחסי לניווט כשלוחצים על ההתראה (ר' notificationclick ב-sw.js). */
  url?: string;
}

let vapidConfigured = false;
function ensureVapidConfigured(): void {
  if (vapidConfigured) return;
  webpush.setVapidDetails("mailto:push@trip-master.local", process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY!, process.env.VAPID_PRIVATE_KEY!);
  vapidConfigured = true;
}

/**
 * שולח Push אמיתי לכל המכשירים שהמשתמש הפעיל בהם התראות (לא רק אחד) — ר'
 * ההערה ב-PushSubscription.schema.prisma. מנוי שפג (410/404, הדפדפן ביטל
 * אותו בעצמו) נמחק בשקט — לא שגיאה אמיתית, זה המצב הצפוי לאורך זמן.
 * לא נכשל בשקט: אם אין אף מנוי פעיל, פשוט לא נשלח כלום (לא זורק).
 */
export async function sendPushToUser(userId: string, payload: PushPayload): Promise<void> {
  if (!isPushConfigured()) return;
  ensureVapidConfigured();

  const pushSubscriptionRepository = await getPushSubscriptionRepository();
  const subscriptions = await pushSubscriptionRepository.listForUser({ userId });
  if (subscriptions.length === 0) return;

  const body = JSON.stringify(payload);
  await Promise.all(
    subscriptions.map(async (sub) => {
      try {
        await webpush.sendNotification({ endpoint: sub.endpoint, keys: { p256dh: sub.p256dh, auth: sub.auth } }, body);
      } catch (error) {
        const statusCode = (error as { statusCode?: number }).statusCode;
        if (statusCode === 404 || statusCode === 410) {
          await pushSubscriptionRepository.deleteByEndpoint({ endpoint: sub.endpoint });
          logger.info("push subscription expired, removed", { userId, endpoint: sub.endpoint });
        } else {
          logger.warn("push send failed", { userId, endpoint: sub.endpoint, error: error instanceof Error ? error.message : String(error) });
        }
      }
    }),
  );
}
