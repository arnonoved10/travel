"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import {
  createPlannedActivityInputSchema,
  updatePlannedActivityPersonalRatingInputSchema,
  updatePlannedActivityStatusInputSchema,
  type LifecycleStatus,
} from "@travel-app/shared-types";
import {
  getAuditLogRepository,
  getPlaceRepository,
  getPlannedActivityRepository,
  getRoutingProvider,
  getStatusHistoryRepository,
  getTripRepository,
} from "@travel-app/data-layer";
import { LIFECYCLE_STATUS_LABELS } from "@/lib/lifecycle-status-labels";
import { getCurrentUser } from "@/lib/auth/get-current-user";
import { logger } from "@/lib/logger";

export interface PlannedActivityFormState {
  fieldErrors?: Record<string, string[]>;
  formError?: string;
}

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

function readOptionalNumber(formData: FormData, key: string): number | undefined {
  const value = formData.get(key);
  if (typeof value !== "string" || value.trim() === "") return undefined;
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : undefined;
}

// ראה ההערה המקבילה ב-bookings/actions.ts על datetime-local ↔ ISO.
function readOptionalIsoDateTime(formData: FormData, key: string): string | undefined {
  const value = formData.get(key);
  if (typeof value !== "string" || value === "") return undefined;
  return value.length === 16 ? `${value}:00.000Z` : value;
}

export async function createPlannedActivityAction(
  tripId: string,
  _prevState: PlannedActivityFormState,
  formData: FormData,
): Promise<PlannedActivityFormState> {
  const user = await getCurrentUser();
  if (!user) redirect("/login");

  try {
    await assertTripOwnership(user.id, tripId);
  } catch {
    return { formError: "הטיול לא נמצא או שאין לך הרשאה אליו." };
  }

  const parsed = createPlannedActivityInputSchema.safeParse({
    tripId,
    name: formData.get("name"),
    activityType: readOptionalString(formData, "activityType"),
    plannedAt: readOptionalIsoDateTime(formData, "plannedAt"),
    estimatedDurationMinutes: readOptionalNumber(formData, "estimatedDurationMinutes"),
    estimatedPrice: readOptionalNumber(formData, "estimatedPrice"),
    estimatedCurrencyCode: readOptionalString(formData, "estimatedCurrencyCode"),
    notes: readOptionalString(formData, "notes"),
  });

  if (!parsed.success) {
    return { fieldErrors: parsed.error.flatten().fieldErrors };
  }

  const plannedActivityRepository = await getPlannedActivityRepository();
  const activity = await plannedActivityRepository.create({ input: parsed.data });
  logger.info("planned activity created", { plannedActivityId: activity.id, tripId });

  revalidatePath(`/trips/${tripId}`);
  return {};
}

export async function updatePlannedActivityStatusAction(
  tripId: string,
  plannedActivityId: string,
  status: LifecycleStatus,
): Promise<void> {
  const user = await getCurrentUser();
  if (!user) redirect("/login");

  await assertTripOwnership(user.id, tripId);

  const parsed = updatePlannedActivityStatusInputSchema.parse({ plannedActivityId, status });
  const plannedActivityRepository = await getPlannedActivityRepository();
  const existing = await plannedActivityRepository.getById({ plannedActivityId });
  await plannedActivityRepository.updateStatus({ input: parsed });
  logger.info("planned activity status updated", { plannedActivityId, status, tripId });

  if (existing && existing.status !== status) {
    const auditLogRepository = await getAuditLogRepository();
    await auditLogRepository.record({
      input: {
        userId: user.id,
        entityType: "planned_activity",
        entityId: plannedActivityId,
        fieldName: "status",
        oldValue: LIFECYCLE_STATUS_LABELS[existing.status],
        newValue: LIFECYCLE_STATUS_LABELS[status],
        action: "status_change",
      },
    });

    const statusHistoryRepository = await getStatusHistoryRepository();
    await statusHistoryRepository.record({
      input: {
        userId: user.id,
        entityType: "planned_activity",
        entityId: plannedActivityId,
        oldStatus: existing.status,
        newStatus: status,
      },
    });
  }
  // בכוונה בלי revalidatePath — PlannedActivityStatusSelect כבר מעדכן אופטימית.
}

export async function setPlannedActivityPersonalRatingAction(
  tripId: string,
  plannedActivityId: string,
  personalRating: number | null,
): Promise<void> {
  const user = await getCurrentUser();
  if (!user) redirect("/login");

  await assertTripOwnership(user.id, tripId);

  const parsed = updatePlannedActivityPersonalRatingInputSchema.parse({ plannedActivityId, personalRating });
  const plannedActivityRepository = await getPlannedActivityRepository();
  await plannedActivityRepository.updatePersonalRating({ input: parsed });
  logger.info("planned activity personal rating set", { plannedActivityId, personalRating, tripId });
  // בכוונה בלי revalidatePath — PersonalRatingSelect כבר מעדכן אופטימית.
}

export async function softDeletePlannedActivityAction(tripId: string, plannedActivityId: string): Promise<void> {
  const user = await getCurrentUser();
  if (!user) redirect("/login");

  await assertTripOwnership(user.id, tripId);

  const plannedActivityRepository = await getPlannedActivityRepository();
  await plannedActivityRepository.softDelete({ plannedActivityId });
  logger.info("planned activity soft-deleted", { plannedActivityId, tripId });

  revalidatePath(`/trips/${tripId}`);
}

export interface LiveDistanceEntry {
  plannedActivityId: string;
  distanceKm: number;
  travelTimeMinutes: number;
}

/**
 * זמן/מרחק נהיגה אמיתי (OSRM) מהמיקום הנוכחי (GPS) לכל תכנון-עתידי שיש לו
 * מקום עם קואורדינטות. יעד שהחישוב נכשל עבורו פשוט לא מופיע בתוצאה —
 * הצד הלקוח ממשיך להציג את הערכת ה-Haversine המיידית שלו, לא ממציאים ערך.
 */
export async function getLiveDistancesAction(tripId: string, lat: number, lng: number): Promise<LiveDistanceEntry[]> {
  const user = await getCurrentUser();
  if (!user) redirect("/login");

  try {
    await assertTripOwnership(user.id, tripId);
  } catch {
    return [];
  }

  const [plannedActivityRepository, placeRepository] = await Promise.all([getPlannedActivityRepository(), getPlaceRepository()]);
  const [activities, allPlaces] = await Promise.all([
    plannedActivityRepository.listForTrip({ tripId }),
    placeRepository.list({ userId: user.id }),
  ]);
  const placesById = new Map(allPlaces.map((p) => [p.id, p]));

  const routingProvider = getRoutingProvider();
  const results = await Promise.all(
    activities.map(async (activity): Promise<LiveDistanceEntry | null> => {
      const place = activity.placeId ? placesById.get(activity.placeId) : undefined;
      if (!place || place.lat === null || place.lng === null) return null;
      try {
        const result = await routingProvider.getDrivingRoute({ fromLat: lat, fromLng: lng, toLat: place.lat, toLng: place.lng });
        if (!result) return null;
        return { plannedActivityId: activity.id, distanceKm: result.distanceKm, travelTimeMinutes: result.travelTimeMinutes };
      } catch (error) {
        logger.warn("live distance calculation failed", { plannedActivityId: activity.id, error: error instanceof Error ? error.message : String(error) });
        return null;
      }
    }),
  );

  return results.filter((entry): entry is LiveDistanceEntry => entry !== null);
}
