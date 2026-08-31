"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { getPlaceRecommendationRepository, getTripRepository } from "@travel-app/data-layer";
import { getCurrentUser } from "@/lib/auth/get-current-user";
import { getRecommendationsProvider } from "@/lib/recommendations/get-recommendations-provider";
import { logger } from "@/lib/logger";

export interface GenerateRecommendationsResult {
  ok: boolean;
  error?: string;
}

async function assertTripOwnership(userId: string, tripId: string): Promise<void> {
  const tripRepository = await getTripRepository();
  const trip = await tripRepository.getById({ userId, tripId });
  if (!trip) throw new Error("הטיול לא נמצא או שאין לך הרשאה אליו");
}

// scopeLabel = שם היעד (עיר, או מדינה כשאין ערים רשומות) — ר' recommendations/page.tsx.
// לעולם לא ממציא תוצאות: אם ה-API נכשל, השגיאה חוזרת ל-UI כמו שהיא.
export async function generateRecommendationsAction(
  tripId: string,
  scopeLabel: string,
  countryName: string | null,
): Promise<GenerateRecommendationsResult> {
  const user = await getCurrentUser();
  if (!user) redirect("/login");

  try {
    await assertTripOwnership(user.id, tripId);
  } catch {
    return { ok: false, error: "הטיול לא נמצא או שאין לך הרשאה אליו." };
  }

  const query = countryName ? `מסעדות ואטרקציות מומלצות ב${scopeLabel}, ${countryName}` : `מסעדות ואטרקציות מומלצות ב${scopeLabel}`;

  try {
    const provider = getRecommendationsProvider();
    const results = await provider.searchRecommendations({ query });

    const placeRecommendationRepository = await getPlaceRecommendationRepository();
    await placeRecommendationRepository.replaceForTrip({
      tripId,
      scopeLabel,
      items: results.map((r) => ({
        category: r.category,
        name: r.name,
        address: r.address,
        rating: r.rating,
        userRatingsTotal: r.userRatingsTotal,
        mapsUrl: r.mapsUrl,
        photoUrl: r.photoUrl,
      })),
    });
    logger.info("place recommendations generated", { tripId, scopeLabel, count: results.length });
  } catch (error) {
    logger.warn("place recommendations generation failed", { tripId, scopeLabel, error: String(error) });
    return { ok: false, error: error instanceof Error ? error.message : "שגיאה בקבלת המלצות." };
  }

  revalidatePath(`/trips/${tripId}/recommendations`);
  return { ok: true };
}

export async function clearRecommendationsAction(tripId: string): Promise<void> {
  const user = await getCurrentUser();
  if (!user) redirect("/login");
  await assertTripOwnership(user.id, tripId);

  const placeRecommendationRepository = await getPlaceRecommendationRepository();
  await placeRecommendationRepository.clearForTrip({ tripId });
  logger.info("place recommendations cleared", { tripId });

  revalidatePath(`/trips/${tripId}/recommendations`);
}
