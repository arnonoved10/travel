"use server";

import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { backupFileSchema, createPushSubscriptionInputSchema, type RestoreSummary } from "@travel-app/shared-types";
import { getCurrentUser } from "@/lib/auth/get-current-user";
import { logger } from "@/lib/logger";
import { restoreBackup } from "@/lib/backup/restore-backup";
import { getPushSubscriptionRepository, getUserRepository } from "@travel-app/data-layer";
import { sendPushToUser } from "@/lib/push/send-push";

export interface RestoreBackupFormState {
  summary?: RestoreSummary;
  formError?: string;
}

const MAX_BACKUP_FILE_SIZE_BYTES = 20 * 1024 * 1024; // 20MB — כולל מסמכים/תמונות מוטבעים כ-data: URI

export async function restoreBackupAction(_prevState: RestoreBackupFormState, formData: FormData): Promise<RestoreBackupFormState> {
  const user = await getCurrentUser();
  if (!user) redirect("/login");

  const file = formData.get("file");
  if (!(file instanceof File) || file.size === 0) {
    return { formError: "יש לבחור קובץ גיבוי (JSON)." };
  }
  if (file.size > MAX_BACKUP_FILE_SIZE_BYTES) {
    return { formError: `הקובץ גדול מדי (מקסימום ${MAX_BACKUP_FILE_SIZE_BYTES / 1024 / 1024}MB).` };
  }

  let rawJson: unknown;
  try {
    rawJson = JSON.parse(await file.text());
  } catch {
    return { formError: "הקובץ אינו JSON תקין." };
  }

  const parsed = backupFileSchema.safeParse(rawJson);
  if (!parsed.success) {
    return { formError: "מבנה קובץ הגיבוי אינו תואם — ייתכן שהוא מגרסה לא נתמכת או שהוא לא קובץ גיבוי של המערכת." };
  }

  const summary = await restoreBackup(user.id, parsed.data);
  logger.info("backup restored", { userId: user.id, restoredCounts: summary.restoredCounts });

  revalidatePath("/trips");
  revalidatePath("/places");
  revalidatePath("/dashboard");
  return { summary };
}

export interface PushActionResult {
  ok: boolean;
  error?: string;
}

/** נקרא אחרי ש-PushManager.subscribe() הצליח בדפדפן — שומר את המנוי כדי
 * ש-sendPushToUser יוכל לשלוח אליו בהמשך. אותו endpoint תמיד עושה upsert
 * (לא כפילות), ר' push-subscription-repository. */
export async function subscribeToPushAction(input: { endpoint: string; p256dh: string; auth: string; userAgent?: string }): Promise<PushActionResult> {
  const user = await getCurrentUser();
  if (!user) redirect("/login");

  const parsed = createPushSubscriptionInputSchema.safeParse(input);
  if (!parsed.success) return { ok: false, error: "נתוני המנוי לא תקינים." };

  const pushSubscriptionRepository = await getPushSubscriptionRepository();
  await pushSubscriptionRepository.upsert({ userId: user.id, input: parsed.data });
  logger.info("push subscription saved", { userId: user.id });

  revalidatePath("/settings");
  return { ok: true };
}

export async function unsubscribeFromPushAction(endpoint: string): Promise<PushActionResult> {
  const user = await getCurrentUser();
  if (!user) redirect("/login");

  const pushSubscriptionRepository = await getPushSubscriptionRepository();
  await pushSubscriptionRepository.deleteByEndpoint({ endpoint });
  logger.info("push subscription removed", { userId: user.id });

  revalidatePath("/settings");
  return { ok: true };
}

/** כפתור-בדיקה במסך ההגדרות — מוודא שהמנוי אכן עובד לפני שסומכים עליו
 * להתראות אמיתיות (עיכוב-טיסה וכו'), לא רק "שמור והנח שזה עובד". */
export async function sendTestPushAction(): Promise<PushActionResult> {
  const user = await getCurrentUser();
  if (!user) redirect("/login");

  await sendPushToUser(user.id, { title: "התראות דחיפה פעילות ✅", body: "אם אתה רואה את זה — ההתראות עובדות." });
  return { ok: true };
}

export interface DisplayNameFormState {
  formError?: string;
}

/** שם-תצוגה חופשי (לא firstName/lastName נפרדים) — המשתמש מקליד את השם המלא
 * שלו בעצמו, כולל הרווח הטבעי בין פרטי למשפחה. משמש בברכה בדשבורד במקום
 * חילוץ-שם מתוך כתובת-האימייל (ר' תלונת-משתמש "רווח בין שם פרטי לשם משפחה"). */
export async function updateDisplayNameAction(_prevState: DisplayNameFormState, formData: FormData): Promise<DisplayNameFormState> {
  const user = await getCurrentUser();
  if (!user) redirect("/login");

  const raw = formData.get("displayName");
  const trimmed = typeof raw === "string" ? raw.trim() : "";
  if (trimmed.length > 100) {
    return { formError: "שם ארוך מדי." };
  }

  const userRepository = await getUserRepository();
  await userRepository.updateDisplayName({ userId: user.id, displayName: trimmed || null });

  revalidatePath("/settings");
  revalidatePath("/dashboard");
  return {};
}
