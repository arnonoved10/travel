"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { getDocumentRepository, getTripRepository } from "@travel-app/data-layer";
import { getCurrentUser } from "@/lib/auth/get-current-user";
import { getOcrProvider } from "@/lib/ocr/get-ocr-provider";
import { logger } from "@/lib/logger";

export interface RunOcrResult {
  ok: boolean;
  error?: string;
  providerName?: string;
}

async function assertTripOwnership(userId: string, tripId: string): Promise<void> {
  const tripRepository = await getTripRepository();
  const trip = await tripRepository.getById({ userId, tripId });
  if (!trip) throw new Error("trip not found or not owned by user");
}

/**
 * מריץ OCR על מסמך קיים — ר' lib/ocr/get-ocr-provider.ts לבחירת הספק
 * (Claude אם GOOGLE_PLACES... לא, ANTHROPIC_API_KEY מוגדר, אחרת Tesseract
 * מקומי חינמי תמיד). כל שדה שמתקבל נשמר כ-"טרם אושר" — שום שדה לא נכנס
 * להזמנה/הוצאה אמיתית בלי אישור מפורש של המשתמש (confirmExtractedFieldAction).
 */
export async function runOcrAction(tripId: string, documentId: string): Promise<RunOcrResult> {
  const user = await getCurrentUser();
  if (!user) redirect("/login");

  try {
    await assertTripOwnership(user.id, tripId);
  } catch {
    return { ok: false, error: "הטיול לא נמצא או שאין לך הרשאה אליו." };
  }

  const documentRepository = await getDocumentRepository();
  const document = await documentRepository.getById({ documentId });
  if (!document) return { ok: false, error: "המסמך לא נמצא." };

  const file = await documentRepository.getFileBase64({ documentId });
  if (!file) {
    return { ok: false, error: "לא ניתן לקרוא את תוכן הקובץ." };
  }

  const provider = getOcrProvider();
  let result;
  try {
    result = await provider.extractFields({ imageBase64: file.base64, mimeType: document.mimeType ?? file.mimeType });
  } catch (error) {
    logger.warn("ocr extraction threw", { documentId, tripId, provider: provider.name, error: String(error) });
    await documentRepository.updateOcrStatus({ documentId, ocrStatus: "failed" });
    revalidatePath(`/trips/${tripId}`);
    return { ok: false, error: "קריאת המסמך נכשלה עם שגיאה לא צפויה." };
  }

  if (!result.ok) {
    await documentRepository.updateOcrStatus({ documentId, ocrStatus: "failed" });
    logger.warn("ocr extraction failed", { documentId, tripId, provider: provider.name, error: result.error });
    revalidatePath(`/trips/${tripId}`);
    return { ok: false, error: result.error ?? "קריאת המסמך נכשלה." };
  }

  await documentRepository.replaceExtractedFields({ documentId, fields: result.fields });
  await documentRepository.updateOcrStatus({ documentId, ocrStatus: result.fields.length > 0 ? "needs_confirmation" : "parsed" });
  logger.info("ocr extraction succeeded", { documentId, tripId, provider: provider.name, fieldCount: result.fields.length });

  revalidatePath(`/trips/${tripId}`);
  return { ok: true, providerName: provider.name };
}

export async function confirmExtractedFieldAction(tripId: string, fieldId: string, confirmedValue: string): Promise<void> {
  const user = await getCurrentUser();
  if (!user) redirect("/login");
  await assertTripOwnership(user.id, tripId);

  const documentRepository = await getDocumentRepository();
  await documentRepository.confirmExtractedField({ fieldId, confirmedValue });
  logger.info("extracted field confirmed", { fieldId, tripId });

  revalidatePath(`/trips/${tripId}`);
}

export async function markDocumentConfirmedAction(tripId: string, documentId: string): Promise<void> {
  const user = await getCurrentUser();
  if (!user) redirect("/login");
  await assertTripOwnership(user.id, tripId);

  const documentRepository = await getDocumentRepository();
  await documentRepository.updateOcrStatus({ documentId, ocrStatus: "confirmed" });
  logger.info("document ocr marked confirmed", { documentId, tripId });

  revalidatePath(`/trips/${tripId}`);
}
