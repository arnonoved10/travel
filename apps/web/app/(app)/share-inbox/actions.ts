"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { createDocumentInputSchema, createFlightInputSchema, createHotelStayInputSchema } from "@travel-app/shared-types";
import { getBookingRepository, getDocumentRepository, getSharedInboxRepository, getTripRepository } from "@travel-app/data-layer";
import { getCurrentUser } from "@/lib/auth/get-current-user";
import { logger } from "@/lib/logger";

export interface AssignSharedItemFormState {
  formError?: string;
}

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

function toIsoDateTime(localValue: FormDataEntryValue | null): string {
  if (typeof localValue !== "string" || localValue === "") return "";
  return localValue.length === 16 ? `${localValue}:00.000Z` : localValue;
}

/** מצרף את התמונה/PDF ששותפה כמסמך על ההזמנה החדשה שנוצרה, ואז מוחק את
 * פריט-הקליטה — אותו ניקוי בדיוק כמו assignSharedInboxItemAction, רק
 * שההזמנה עצמה נוצרת כאן במקום להיבחר מרשימה קיימת. */
async function attachSharedItemAndCleanUp(params: {
  userId: string;
  itemId: string;
  tripId: string;
  entityType: "hotel_stay" | "flight";
  entityId: string;
  fileUrl: string;
  fileName: string | null;
  mimeType: string | null;
}): Promise<void> {
  const documentRepository = await getDocumentRepository();
  const parsed = createDocumentInputSchema.parse({
    tripId: params.tripId,
    entityType: params.entityType,
    entityId: params.entityId,
    documentType: "booking_confirmation",
    fileUrl: params.fileUrl,
    fileName: params.fileName ?? undefined,
    mimeType: params.mimeType ?? undefined,
  });
  await documentRepository.create({ input: parsed });

  const sharedInboxRepository = await getSharedInboxRepository();
  await sharedInboxRepository.delete({ userId: params.userId, itemId: params.itemId });
}

export async function discardSharedInboxItemAction(itemId: string): Promise<void> {
  const user = await getCurrentUser();
  if (!user) redirect("/login");

  const sharedInboxRepository = await getSharedInboxRepository();
  await sharedInboxRepository.delete({ userId: user.id, itemId });
  logger.info("shared inbox item discarded", { itemId });
  revalidatePath("/share-inbox");
}

export async function assignSharedInboxItemAction(
  itemId: string,
  _prevState: AssignSharedItemFormState,
  formData: FormData,
): Promise<AssignSharedItemFormState> {
  const user = await getCurrentUser();
  if (!user) redirect("/login");

  const sharedInboxRepository = await getSharedInboxRepository();
  const item = await sharedInboxRepository.getById({ userId: user.id, itemId });
  if (!item) return { formError: "הפריט לא נמצא." };
  if (!item.fileUrl) return { formError: "אי אפשר לשייך פריט בלי קובץ מצורף (רק טקסט/קישור)." };

  const tripId = formData.get("tripId");
  const entityType = formData.get("entityType");
  const entityId = formData.get("entityId");
  const documentType = formData.get("documentType");
  const notesRaw = formData.get("notes");

  if (typeof tripId !== "string" || tripId === "") return { formError: "יש לבחור טיול." };
  if (typeof entityType !== "string" || entityType === "") return { formError: "יש לבחור לאיזה סוג הזמנה זה שייך." };
  if (typeof entityId !== "string" || entityId === "") return { formError: "יש לבחור למה בדיוק זה משויך." };

  const tripRepository = await getTripRepository();
  const trip = await tripRepository.getById({ userId: user.id, tripId });
  if (!trip) return { formError: "הטיול לא נמצא או שאין לך הרשאה אליו." };

  const parsed = createDocumentInputSchema.safeParse({
    tripId,
    entityType,
    entityId,
    documentType,
    fileUrl: item.fileUrl,
    fileName: item.fileName ?? undefined,
    mimeType: item.mimeType ?? undefined,
    notes: typeof notesRaw === "string" && notesRaw.trim() !== "" ? notesRaw : undefined,
  });
  if (!parsed.success) return { formError: "הנתונים לא תקינים." };

  const documentRepository = await getDocumentRepository();
  const document = await documentRepository.create({ input: parsed.data });
  await sharedInboxRepository.delete({ userId: user.id, itemId });

  logger.info("shared inbox item assigned to document", { itemId, documentId: document.id, tripId, entityType, entityId });

  revalidatePath(`/trips/${tripId}`);
  revalidatePath("/share-inbox");
  redirect(`/trips/${tripId}`);
}

export async function createHotelStayFromSharedItemAction(
  itemId: string,
  _prevState: AssignSharedItemFormState,
  formData: FormData,
): Promise<AssignSharedItemFormState> {
  const user = await getCurrentUser();
  if (!user) redirect("/login");

  const tripId = formData.get("tripId");
  if (typeof tripId !== "string" || tripId === "") return { formError: "יש לבחור טיול." };

  const tripRepository = await getTripRepository();
  const trip = await tripRepository.getById({ userId: user.id, tripId });
  if (!trip) return { formError: "הטיול לא נמצא או שאין לך הרשאה אליו." };

  const sharedInboxRepository = await getSharedInboxRepository();
  const item = await sharedInboxRepository.getById({ userId: user.id, itemId });
  if (!item?.fileUrl) return { formError: "הפריט לא נמצא או שאין לו קובץ מצורף." };

  const parsed = createHotelStayInputSchema.safeParse({
    tripId,
    hotelName: formData.get("hotelName"),
    checkInDate: formData.get("checkInDate"),
    checkOutDate: formData.get("checkOutDate"),
    agreedPrice: readOptionalNumber(formData, "agreedPrice"),
    agreedCurrencyCode: readOptionalString(formData, "agreedCurrencyCode"),
    confirmationNumber: readOptionalString(formData, "confirmationNumber"),
    phone: readOptionalString(formData, "phone"),
    email: readOptionalString(formData, "email"),
  });
  if (!parsed.success) return { formError: "יש להשלים את השדות הנדרשים (שם מלון, תאריכי צ'ק-אין/אאוט)." };

  const bookingRepository = await getBookingRepository();
  const hotelStay = await bookingRepository.createHotelStay({ input: parsed.data });
  await attachSharedItemAndCleanUp({
    userId: user.id,
    itemId,
    tripId,
    entityType: "hotel_stay",
    entityId: hotelStay.id,
    fileUrl: item.fileUrl,
    fileName: item.fileName,
    mimeType: item.mimeType,
  });
  logger.info("hotel stay created from shared item", { hotelStayId: hotelStay.id, itemId, tripId });

  revalidatePath(`/trips/${tripId}`);
  revalidatePath("/share-inbox");
  redirect(`/trips/${tripId}`);
}

export async function createFlightFromSharedItemAction(
  itemId: string,
  _prevState: AssignSharedItemFormState,
  formData: FormData,
): Promise<AssignSharedItemFormState> {
  const user = await getCurrentUser();
  if (!user) redirect("/login");

  const tripId = formData.get("tripId");
  if (typeof tripId !== "string" || tripId === "") return { formError: "יש לבחור טיול." };

  const tripRepository = await getTripRepository();
  const trip = await tripRepository.getById({ userId: user.id, tripId });
  if (!trip) return { formError: "הטיול לא נמצא או שאין לך הרשאה אליו." };

  const sharedInboxRepository = await getSharedInboxRepository();
  const item = await sharedInboxRepository.getById({ userId: user.id, itemId });
  if (!item?.fileUrl) return { formError: "הפריט לא נמצא או שאין לו קובץ מצורף." };

  const parsed = createFlightInputSchema.safeParse({
    tripId,
    airline: formData.get("airline"),
    flightNumber: readOptionalString(formData, "flightNumber"),
    departureAirport: formData.get("departureAirport"),
    arrivalAirport: formData.get("arrivalAirport"),
    departureAt: toIsoDateTime(formData.get("departureAt")),
    departureTimezone: formData.get("departureTimezone"),
    arrivalAt: toIsoDateTime(formData.get("arrivalAt")),
    arrivalTimezone: formData.get("arrivalTimezone"),
    agreedPrice: readOptionalNumber(formData, "agreedPrice"),
    agreedCurrencyCode: readOptionalString(formData, "agreedCurrencyCode"),
    confirmationNumber: readOptionalString(formData, "confirmationNumber"),
    phone: readOptionalString(formData, "phone"),
    email: readOptionalString(formData, "email"),
  });
  if (!parsed.success) return { formError: "יש להשלים את השדות הנדרשים (חברת תעופה, שדות תעופה, שעות/אזורי-זמן)." };

  const bookingRepository = await getBookingRepository();
  const flight = await bookingRepository.createFlight({ input: parsed.data });
  await attachSharedItemAndCleanUp({
    userId: user.id,
    itemId,
    tripId,
    entityType: "flight",
    entityId: flight.id,
    fileUrl: item.fileUrl,
    fileName: item.fileName,
    mimeType: item.mimeType,
  });
  logger.info("flight created from shared item", { flightId: flight.id, itemId, tripId });

  revalidatePath(`/trips/${tripId}`);
  revalidatePath("/share-inbox");
  redirect(`/trips/${tripId}`);
}
