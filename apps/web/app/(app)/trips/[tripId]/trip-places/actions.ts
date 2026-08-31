"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { getTripPlaceRepository, getTripRepository } from "@travel-app/data-layer";
import { getCurrentUser } from "@/lib/auth/get-current-user";
import { logger } from "@/lib/logger";
import type { TripPlaceStatus } from "@travel-app/shared-types";

export interface TripPlaceFormState {
  formError?: string;
}

export async function linkPlaceToTripAction(
  tripId: string,
  _prevState: TripPlaceFormState,
  formData: FormData,
): Promise<TripPlaceFormState> {
  const user = await getCurrentUser();
  if (!user) redirect("/login");

  const tripRepository = await getTripRepository();
  const trip = await tripRepository.getById({ userId: user.id, tripId });
  if (!trip) {
    return { formError: "הטיול לא נמצא או שאין לך הרשאה אליו." };
  }

  const placeId = formData.get("placeId");
  const status = formData.get("status");
  if (typeof placeId !== "string" || placeId === "" || typeof status !== "string") {
    return { formError: "יש לבחור מקום וסטטוס." };
  }

  const tripPlaceRepository = await getTripPlaceRepository();
  try {
    await tripPlaceRepository.linkPlaceToTrip({
      userId: user.id,
      tripId,
      placeId,
      status: status as TripPlaceStatus,
    });
  } catch {
    return { formError: "המקום לא נמצא או שאין לך הרשאה אליו." };
  }

  logger.info("place linked to trip", { tripId, placeId });
  revalidatePath(`/trips/${tripId}`);
  return {};
}

/** קישור מהיר בלי טופס (למשל מכרטיס הצעת "חזרת לעיר") — לא useActionState, פעולה ישירה כמו שאר ה-set/toggle הצרים בקוד. */
export async function quickLinkPlaceToTripAction(tripId: string, placeId: string, status: TripPlaceStatus): Promise<void> {
  const user = await getCurrentUser();
  if (!user) redirect("/login");

  const tripRepository = await getTripRepository();
  const trip = await tripRepository.getById({ userId: user.id, tripId });
  if (!trip) return;

  const tripPlaceRepository = await getTripPlaceRepository();
  await tripPlaceRepository.linkPlaceToTrip({ userId: user.id, tripId, placeId, status });
  logger.info("place quick-linked to trip", { tripId, placeId, status });

  revalidatePath(`/trips/${tripId}`);
}
