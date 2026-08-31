"use server";

import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { createDocumentInputSchema, createPlaceInputSchema } from "@travel-app/shared-types";
import { getDocumentRepository, getPlaceRepository, getTripPlaceRepository, getTripRepository } from "@travel-app/data-layer";
import { getCurrentUser } from "@/lib/auth/get-current-user";
import { logger } from "@/lib/logger";

export interface PlaceFormState {
  fieldErrors?: Record<string, string[]>;
  formError?: string;
  /** מזהה המקום שנוצר — כדי שהוספה-מהירה (quick-add-panel-content.tsx) תוכל
   * להציע מיד "צרף מסמך/תמונה לזה" בלי לצאת מהפאנל. */
  createdId?: string;
}

export interface PlacePhotoFormState {
  formError?: string;
}

const MAX_FILE_SIZE_BYTES = 3 * 1024 * 1024; // 3MB — אותה מגבלה כמו uploadDocumentAction

function readOptionalString(formData: FormData, key: string): string | undefined {
  const value = formData.get(key);
  if (typeof value !== "string" || value.trim() === "") return undefined;
  return value;
}

function readOptionalNumber(formData: FormData, key: string): number | undefined {
  const value = formData.get(key);
  if (typeof value !== "string" || value.trim() === "") return undefined;
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : undefined;
}

function readOpeningHours(formData: FormData): unknown {
  const raw = formData.get("openingHours");
  if (typeof raw !== "string" || raw.trim() === "") return undefined;
  try {
    return JSON.parse(raw);
  } catch {
    return undefined;
  }
}

/**
 * tripId/redirectOnSuccess מוזרמים (bind) לפי הקשר-השימוש: /places/new הרגיל
 * (tripId=null, redirect=true, ההתנהגות המקורית) מול הוספה-מהירה בדשבורד
 * (quick-add-panel-content.tsx: tripId אמיתי, redirect=false — כדי שהפאנל
 * יישאר פתוח ויקשר את המקום לטיול כ"רוצה לבקר", אותו דפוס בדיוק כמו
 * createPlaceFromMapAction ב-map/actions.ts).
 */
export async function createPlaceAction(
  tripId: string | null,
  redirectOnSuccess: boolean,
  _prevState: PlaceFormState,
  formData: FormData,
): Promise<PlaceFormState> {
  const user = await getCurrentUser();
  if (!user) redirect("/login");

  const parsed = createPlaceInputSchema.safeParse({
    name: formData.get("name"),
    category: formData.get("category"),
    city: readOptionalString(formData, "city"),
    country: readOptionalString(formData, "country"),
    address: readOptionalString(formData, "address"),
    lat: readOptionalNumber(formData, "lat"),
    lng: readOptionalNumber(formData, "lng"),
    officialWebsite: readOptionalString(formData, "officialWebsite"),
    phone: readOptionalString(formData, "phone"),
    whatsapp: readOptionalString(formData, "whatsapp"),
    email: readOptionalString(formData, "email"),
    openingHours: readOpeningHours(formData),
    generalNotes: readOptionalString(formData, "generalNotes"),
  });

  if (!parsed.success) {
    return { fieldErrors: parsed.error.flatten().fieldErrors };
  }

  const placeRepository = await getPlaceRepository();
  const place = await placeRepository.create({ userId: user.id, input: parsed.data });
  logger.info("place created", { placeId: place.id });

  if (tripId) {
    const tripRepository = await getTripRepository();
    const trip = await tripRepository.getById({ userId: user.id, tripId });
    if (trip) {
      const tripPlaceRepository = await getTripPlaceRepository();
      await tripPlaceRepository.linkPlaceToTrip({ userId: user.id, tripId, placeId: place.id, status: "want_to_go" });
      logger.info("place linked to trip from quick-add", { tripId, placeId: place.id });
      revalidatePath(`/trips/${tripId}`);
    }
  }

  revalidatePath("/places");
  if (redirectOnSuccess) redirect("/places");
  return { createdId: place.id };
}

export async function softDeletePlaceAction(placeId: string): Promise<void> {
  const user = await getCurrentUser();
  if (!user) redirect("/login");

  const placeRepository = await getPlaceRepository();
  await placeRepository.softDelete({ userId: user.id, placeId });
  logger.info("place soft-deleted", { placeId });

  revalidatePath("/places");
}

export async function toggleFavoritePlaceAction(placeId: string): Promise<void> {
  const user = await getCurrentUser();
  if (!user) redirect("/login");

  const placeRepository = await getPlaceRepository();
  await placeRepository.toggleFavorite({ userId: user.id, placeId });
  logger.info("place favorite toggled", { placeId });

  revalidatePath("/places");
}

export async function toggleDontReturnPlaceAction(placeId: string): Promise<void> {
  const user = await getCurrentUser();
  if (!user) redirect("/login");

  const placeRepository = await getPlaceRepository();
  await placeRepository.toggleDontReturn({ userId: user.id, placeId });
  logger.info("place dontReturn toggled", { placeId });

  revalidatePath("/places");
}

export async function setPlacePersonalRatingAction(placeId: string, personalRating: number | null): Promise<void> {
  const user = await getCurrentUser();
  if (!user) redirect("/login");

  const placeRepository = await getPlaceRepository();
  await placeRepository.setPersonalRating({ userId: user.id, placeId, personalRating });
  logger.info("place personal rating set", { placeId, personalRating });

  revalidatePath("/places");
}

// תמונות-מקום: Place הוא ישות גלובלית (לא פר-טיול), אז בדיקת הבעלות היא
// מול המקום עצמו (place.userId), לא מול טיול — בניגוד ל-uploadDocumentAction
// הרגיל שבודק בעלות-טיול. ר' ההערה המקבילה ב-schema.prisma (Document.tripId).
export async function uploadPlacePhotoAction(
  placeId: string,
  _prevState: PlacePhotoFormState,
  formData: FormData,
): Promise<PlacePhotoFormState> {
  const user = await getCurrentUser();
  if (!user) redirect("/login");

  const placeRepository = await getPlaceRepository();
  const place = await placeRepository.getById({ userId: user.id, placeId });
  if (!place) {
    return { formError: "המקום לא נמצא או שאין לך הרשאה אליו." };
  }

  const file = formData.get("file");
  if (!(file instanceof File) || file.size === 0) {
    return { formError: "יש לבחור קובץ." };
  }
  if (file.size > MAX_FILE_SIZE_BYTES) {
    return { formError: `הקובץ גדול מדי (מקסימום ${MAX_FILE_SIZE_BYTES / 1024 / 1024}MB).` };
  }

  const buffer = Buffer.from(await file.arrayBuffer());
  const fileUrl = `data:${file.type || "application/octet-stream"};base64,${buffer.toString("base64")}`;

  const parsed = createDocumentInputSchema.safeParse({
    entityType: "place",
    entityId: placeId,
    documentType: "image",
    fileUrl,
    fileName: file.name,
    mimeType: file.type || undefined,
  });
  if (!parsed.success) {
    return { formError: "לא ניתן לשמור את התמונה." };
  }

  const documentRepository = await getDocumentRepository();
  const document = await documentRepository.create({ input: parsed.data });
  logger.info("place photo uploaded", { documentId: document.id, placeId });

  revalidatePath("/places");
  return {};
}

export async function softDeletePlacePhotoAction(placeId: string, documentId: string): Promise<void> {
  const user = await getCurrentUser();
  if (!user) redirect("/login");

  const placeRepository = await getPlaceRepository();
  const place = await placeRepository.getById({ userId: user.id, placeId });
  if (!place) return;

  const documentRepository = await getDocumentRepository();
  await documentRepository.softDelete({ documentId });
  logger.info("place photo removed", { documentId, placeId });

  revalidatePath("/places");
}
