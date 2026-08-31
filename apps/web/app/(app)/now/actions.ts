"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { createPlaceInputSchema, poiSearchQuerySchema, type PlaceCategory, type PoiCandidate } from "@travel-app/shared-types";
import { getPlaceRepository, getPoiProvider, getTripPlaceRepository, getTripRepository } from "@travel-app/data-layer";
import { getCurrentUser } from "@/lib/auth/get-current-user";
import { logger } from "@/lib/logger";

export interface RateHereFormState {
  fieldErrors?: Record<string, string[]>;
  formError?: string;
  success?: boolean;
}

function readOptionalString(formData: FormData, key: string): string | undefined {
  const value = formData.get(key);
  if (typeof value !== "string" || value.trim() === "") return undefined;
  return value;
}

/**
 * יוצר מקום חדש בספריית המקומות מתוך המיקום הנוכחי בפועל (GPS), מדרג אותו
 * מיד, ומקשר אותו לטיול הפעיל בסטטוס "visited" — כי אם אתה מדרג את המקום
 * שאתה נמצא בו כרגע, כבר ביקרת בו. שלושה קריאות ל-Repository קיימות
 * (create/setPersonalRating/linkPlaceToTrip), לא נדרש שינוי סכימה.
 */
export async function rateCurrentLocationAction(
  tripId: string,
  _prevState: RateHereFormState,
  formData: FormData,
): Promise<RateHereFormState> {
  const user = await getCurrentUser();
  if (!user) redirect("/login");

  const tripRepository = await getTripRepository();
  const trip = await tripRepository.getById({ userId: user.id, tripId });
  if (!trip) {
    return { formError: "הטיול לא נמצא או שאין לך הרשאה אליו." };
  }

  const lat = Number(formData.get("lat"));
  const lng = Number(formData.get("lng"));
  if (!Number.isFinite(lat) || !Number.isFinite(lng)) {
    return { formError: "לא הצלחנו לקבל את המיקום שלך. נסה שוב." };
  }

  const parsed = createPlaceInputSchema.safeParse({
    name: formData.get("name"),
    category: formData.get("category"),
    lat,
    lng,
    generalNotes: readOptionalString(formData, "generalNotes"),
  });
  if (!parsed.success) {
    return { fieldErrors: parsed.error.flatten().fieldErrors };
  }

  const ratingRaw = formData.get("personalRating");
  const personalRating = typeof ratingRaw === "string" && ratingRaw !== "" ? Number(ratingRaw) : null;

  const placeRepository = await getPlaceRepository();
  const place = await placeRepository.create({ userId: user.id, input: parsed.data });
  if (personalRating !== null) {
    await placeRepository.setPersonalRating({ userId: user.id, placeId: place.id, personalRating });
  }

  const tripPlaceRepository = await getTripPlaceRepository();
  await tripPlaceRepository.linkPlaceToTrip({ userId: user.id, tripId, placeId: place.id, status: "visited" });
  logger.info("place created and rated from current location", { placeId: place.id, tripId, personalRating });

  revalidatePath("/today");
  revalidatePath("/places");
  revalidatePath(`/trips/${tripId}`);
  return { success: true };
}

/** חיפוש מקומות אמיתיים בקרבת נקודה (Overpass/OpenStreetMap) — לא רק מה שכבר שמור. */
export async function discoverNearbyPlacesAction(
  lat: number,
  lng: number,
  radiusKm: number,
  categories: PlaceCategory[],
): Promise<{ ok: true; results: PoiCandidate[] } | { ok: false; error: string }> {
  const user = await getCurrentUser();
  if (!user) redirect("/login");

  const parsed = poiSearchQuerySchema.safeParse({ lat, lng, radiusKm, categories });
  if (!parsed.success) {
    return { ok: false, error: "פרמטרי החיפוש לא תקינים." };
  }

  try {
    const poiProvider = getPoiProvider();
    const results = await poiProvider.searchNearby(parsed.data);
    if (results === null) {
      return { ok: false, error: "לא הצלחנו לחפש מקומות כרגע. אפשר לנסות שוב מאוחר יותר." };
    }
    return { ok: true, results };
  } catch (error) {
    logger.warn("poi discovery failed", { error: error instanceof Error ? error.message : String(error) });
    return { ok: false, error: "החיפוש נכשל כרגע. אפשר לנסות שוב." };
  }
}

export interface AddDiscoveredPlaceInput {
  externalId: string;
  name: string;
  category: PlaceCategory;
  lat: number;
  lng: number;
  address: string | null;
}

/** שומר תוצאת-חיפוש כמקום אמיתי בספרייה, ומקשר אותו לטיול הפעיל כ"מעוניין בו" (want_to_go). */
export async function addDiscoveredPlaceAction(
  tripId: string,
  candidate: AddDiscoveredPlaceInput,
): Promise<{ ok: true } | { ok: false; error: string }> {
  const user = await getCurrentUser();
  if (!user) redirect("/login");

  const tripRepository = await getTripRepository();
  const trip = await tripRepository.getById({ userId: user.id, tripId });
  if (!trip) {
    return { ok: false, error: "הטיול לא נמצא או שאין לך הרשאה אליו." };
  }

  const parsed = createPlaceInputSchema.safeParse({
    name: candidate.name,
    category: candidate.category,
    lat: candidate.lat,
    lng: candidate.lng,
    address: candidate.address ?? undefined,
  });
  if (!parsed.success) {
    return { ok: false, error: "לא ניתן להוסיף את המקום הזה." };
  }

  const placeRepository = await getPlaceRepository();
  const place = await placeRepository.create({ userId: user.id, input: parsed.data });

  const tripPlaceRepository = await getTripPlaceRepository();
  await tripPlaceRepository.linkPlaceToTrip({ userId: user.id, tripId, placeId: place.id, status: "want_to_go" });
  logger.info("discovered place added to wishlist", { placeId: place.id, tripId, externalId: candidate.externalId });

  revalidatePath("/today");
  revalidatePath("/places");
  revalidatePath(`/trips/${tripId}`);
  return { ok: true };
}
