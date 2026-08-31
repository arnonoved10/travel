"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { createDocumentInputSchema } from "@travel-app/shared-types";
import { getDocumentRepository, getTripRepository } from "@travel-app/data-layer";
import { getCurrentUser } from "@/lib/auth/get-current-user";
import { logger } from "@/lib/logger";

export interface DocumentFormState {
  fieldErrors?: Record<string, string[]>;
  formError?: string;
}

// 3MB — לא מגבלת "מצב-דמו": הקובץ תמיד מקודד ל-data: URI בזיכרון-השרת לפני
// ההעלאה (גם ב-Storage אמיתי, ר' ההערה בהמשך), וזה קרוב למגבלת גודל-הבקשה של
// Vercel Server Actions אחרי תקורת ה-base64 (~33%). נכון בשני המצבים כאחד.
const MAX_FILE_SIZE_BYTES = 3 * 1024 * 1024;

async function assertTripOwnership(userId: string, tripId: string): Promise<void> {
  const tripRepository = await getTripRepository();
  const trip = await tripRepository.getById({ userId, tripId });
  if (!trip) throw new Error("trip not found or not owned by user");
}

function readOptionalString(formData: FormData, key: string): string | undefined {
  const value = formData.get(key);
  if (typeof value !== "string" || value.trim() === "") return undefined;
  return value;
}

export async function uploadDocumentAction(
  tripId: string,
  entityType: string,
  _prevState: DocumentFormState,
  formData: FormData,
): Promise<DocumentFormState> {
  const user = await getCurrentUser();
  if (!user) redirect("/login");

  try {
    await assertTripOwnership(user.id, tripId);
  } catch {
    return { formError: "הטיול לא נמצא או שאין לך הרשאה אליו." };
  }

  const entityId = formData.get("entityId");
  const file = formData.get("file");

  if (typeof entityId !== "string" || entityId === "") {
    return { formError: "יש לבחור למה משויך המסמך." };
  }
  if (!(file instanceof File) || file.size === 0) {
    return { formError: "יש לבחור קובץ." };
  }
  if (file.size > MAX_FILE_SIZE_BYTES) {
    return { formError: `הקובץ גדול מדי (מקסימום ${MAX_FILE_SIZE_BYTES / 1024 / 1024}MB).` };
  }

  // ראה ההערה ב-document-repository.ts: data: URI הוא הקובץ האמיתי, לא כתובת
  // מזויפת — פשוט נשמר בזיכרון (Mock) במקום ב-Cloud Storage אמיתי.
  const buffer = Buffer.from(await file.arrayBuffer());
  const fileUrl = `data:${file.type || "application/octet-stream"};base64,${buffer.toString("base64")}`;

  const parsed = createDocumentInputSchema.safeParse({
    tripId,
    entityType,
    entityId,
    documentType: formData.get("documentType"),
    fileUrl,
    fileName: file.name,
    mimeType: file.type || undefined,
    notes: readOptionalString(formData, "notes"),
  });

  if (!parsed.success) {
    return { fieldErrors: parsed.error.flatten().fieldErrors };
  }

  const documentRepository = await getDocumentRepository();
  const document = await documentRepository.create({ input: parsed.data });
  logger.info("document uploaded", { documentId: document.id, tripId, entityType, entityId });

  revalidatePath(`/trips/${tripId}`);
  return {};
}

export async function softDeleteDocumentAction(tripId: string, documentId: string): Promise<void> {
  const user = await getCurrentUser();
  if (!user) redirect("/login");

  await assertTripOwnership(user.id, tripId);

  const documentRepository = await getDocumentRepository();
  await documentRepository.softDelete({ documentId });
  logger.info("document soft-deleted", { documentId, tripId });

  revalidatePath(`/trips/${tripId}`);
}
