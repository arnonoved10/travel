"use server";

import { z } from "zod";
import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { getTripRepository, getTripShareLinkRepository } from "@travel-app/data-layer";
import { getCurrentUser } from "@/lib/auth/get-current-user";
import { getEmailProvider } from "@/lib/email/get-email-provider";
import { escapeHtml } from "@/lib/email/escape-html";
import { logger } from "@/lib/logger";

// אין assertTripOwnership כאן — TripShareLinkRepository מאמת בעלות בעצמו
// (getOrCreateForTrip/revoke/regenerate מקבלים userId+tripId), בכוונה,
// כי זו נקודת-הכתיבה שיוצרת גישה ציבורית לנתוני הטיול. ר' trip-share-link-repository.ts.

export async function createShareLinkAction(tripId: string): Promise<void> {
  const user = await getCurrentUser();
  if (!user) redirect("/login");

  const tripShareLinkRepository = await getTripShareLinkRepository();
  await tripShareLinkRepository.getOrCreateForTrip({ userId: user.id, tripId });
  logger.info("trip share link created/fetched", { tripId });

  revalidatePath(`/trips/${tripId}`);
}

export async function revokeShareLinkAction(tripId: string): Promise<void> {
  const user = await getCurrentUser();
  if (!user) redirect("/login");

  const tripShareLinkRepository = await getTripShareLinkRepository();
  await tripShareLinkRepository.revoke({ userId: user.id, tripId });
  logger.info("trip share link revoked", { tripId });

  revalidatePath(`/trips/${tripId}`);
}

export async function regenerateShareLinkAction(tripId: string): Promise<void> {
  const user = await getCurrentUser();
  if (!user) redirect("/login");

  const tripShareLinkRepository = await getTripShareLinkRepository();
  await tripShareLinkRepository.regenerate({ userId: user.id, tripId });
  logger.info("trip share link regenerated", { tripId });

  revalidatePath(`/trips/${tripId}`);
}

export interface SendShareLinkEmailResult {
  ok: boolean;
  error?: string;
}

/** שולח את קישור-השיתוף (Read-Only) באימייל אמיתי — shareUrl מגיע כבר מחושב
 * מהלקוח (window.location.origin), כי לשרת אין גישה אמינה למקור-הבקשה כאן.
 * לעולם לא ממציא "נשלח בהצלחה" — כשל-ספק אמיתי (מפתח חסר/API דחה) חוזר כשגיאה. */
export async function sendShareLinkEmailAction(
  tripId: string,
  recipientEmail: string,
  shareUrl: string,
  message: string,
): Promise<SendShareLinkEmailResult> {
  const user = await getCurrentUser();
  if (!user) redirect("/login");

  const parsedEmail = z.string().trim().email().safeParse(recipientEmail);
  if (!parsedEmail.success) {
    return { ok: false, error: "כתובת אימייל לא תקינה." };
  }

  const tripRepository = await getTripRepository();
  const trip = await tripRepository.getById({ userId: user.id, tripId });
  if (!trip) {
    return { ok: false, error: "הטיול לא נמצא או שאין לך הרשאה אליו." };
  }

  const trimmedMessage = message.trim();
  const html = `<div style="font-family:sans-serif;direction:rtl;text-align:right;line-height:1.6;">
    <p>שותפה איתך תוכנית הטיול &quot;${escapeHtml(trip.name)}&quot;.</p>
    ${trimmedMessage ? `<p>${escapeHtml(trimmedMessage)}</p>` : ""}
    <p><a href="${shareUrl}">${escapeHtml(shareUrl)}</a></p>
    <p style="color:#888;font-size:0.8em;">קישור לצפייה בלבד — בלי אפשרות עריכה.</p>
  </div>`;
  const text = `שותפה איתך תוכנית הטיול "${trip.name}".\n${trimmedMessage ? `${trimmedMessage}\n` : ""}${shareUrl}\n\nקישור לצפייה בלבד — בלי אפשרות עריכה.`;

  const provider = getEmailProvider();
  const result = await provider.sendEmail({
    to: parsedEmail.data,
    subject: `הוזמנת לצפות בטיול: ${trip.name}`,
    html,
    text,
  });

  if (!result.ok) {
    logger.warn("share link email failed", { tripId, provider: provider.name, error: result.error });
    return { ok: false, error: result.error ?? "שליחת האימייל נכשלה." };
  }

  logger.info("share link email sent", { tripId, provider: provider.name });
  return { ok: true };
}
