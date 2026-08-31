"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { createPlaceInputSchema } from "@travel-app/shared-types";
import { getPlaceRepository, getTripPlaceRepository, getTripRepository } from "@travel-app/data-layer";
import { getCurrentUser } from "@/lib/auth/get-current-user";
import { logger } from "@/lib/logger";

export interface CreatePlaceFromMapState {
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
 * כמו createPlaceAction (apps/web/app/(app)/places/actions.ts) אבל בלי
 * redirect ל-/places — נשאר על /map כדי שהמשתמש ימשיך לסמן/לראות את
 * המקום החדש על המפה עצמה, לא עובר מסך.
 */
export async function createPlaceFromMapAction(
  _prevState: CreatePlaceFromMapState,
  formData: FormData,
): Promise<CreatePlaceFromMapState> {
  const user = await getCurrentUser();
  if (!user) redirect("/login");

  const lat = Number(formData.get("lat"));
  const lng = Number(formData.get("lng"));
  if (!Number.isFinite(lat) || !Number.isFinite(lng)) {
    return { formError: "לא זוהתה נקודה על המפה. נסה ללחוץ שוב." };
  }

  const parsed = createPlaceInputSchema.safeParse({
    name: formData.get("name"),
    category: formData.get("category"),
    lat,
    lng,
    // ממולא-מראש מתוצאת-חיפוש (ר' map-page-interactive.tsx handleSearchSelect) —
    // בלעדיו למקום שנוצר דרך המפה לא היה country בכלל, ולכן שעון-העולם (ר'
    // components/world-clock-card.tsx) לא הצליח להציג דגל.
    country: readOptionalString(formData, "country"),
    city: readOptionalString(formData, "city"),
  });
  if (!parsed.success) {
    return { fieldErrors: parsed.error.flatten().fieldErrors };
  }

  const placeRepository = await getPlaceRepository();
  const place = await placeRepository.create({ userId: user.id, input: parsed.data });
  logger.info("place created from map click", { placeId: place.id });

  // מצב-טיול (מגיע מ-/map?tripId=..., ר' map-page-interactive.tsx) — מקשר את
  // המקום החדש לטיול כ"רוצה לבקר" באותה פעולה, בלי צעד נפרד. אותה בדיקת-בעלות
  // כמו quickLinkPlaceToTripAction (trips/[tripId]/trip-places/actions.ts).
  const tripId = readOptionalString(formData, "tripId");
  if (tripId) {
    const tripRepository = await getTripRepository();
    const trip = await tripRepository.getById({ userId: user.id, tripId });
    if (trip) {
      const tripPlaceRepository = await getTripPlaceRepository();
      await tripPlaceRepository.linkPlaceToTrip({ userId: user.id, tripId, placeId: place.id, status: "want_to_go" });
      logger.info("place linked to trip from map", { tripId, placeId: place.id });
      revalidatePath(`/trips/${tripId}`);
    }
  }

  revalidatePath("/map");
  return { success: true };
}
