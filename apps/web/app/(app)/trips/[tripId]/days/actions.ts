"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { createRouteStopInputSchema, routingQuerySchema, type RoutingResult } from "@travel-app/shared-types";
import {
  getBookingRepository,
  getPlaceRepository,
  getRouteRepository,
  getRoutingProvider,
  getTripDayRepository,
  getTripRepository,
} from "@travel-app/data-layer";
import { getCurrentUser } from "@/lib/auth/get-current-user";
import { logger } from "@/lib/logger";
import { resolveDayHotelContext } from "@/lib/day-hotel-context";

export interface RouteStopFormState {
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

export async function addRouteStopAction(
  tripId: string,
  date: string,
  _prevState: RouteStopFormState,
  formData: FormData,
): Promise<RouteStopFormState> {
  const user = await getCurrentUser();
  if (!user) redirect("/login");

  try {
    await assertTripOwnership(user.id, tripId);
  } catch {
    return { formError: "הטיול לא נמצא או שאין לך הרשאה אליו." };
  }

  const parsed = createRouteStopInputSchema.safeParse({
    tripId,
    date,
    placeId: formData.get("placeId"),
    plannedArrivalAt: readOptionalIsoDateTime(formData, "plannedArrivalAt"),
    plannedDepartureAt: readOptionalIsoDateTime(formData, "plannedDepartureAt"),
    distanceKm: readOptionalNumber(formData, "distanceKm"),
    travelTimeMinutes: readOptionalNumber(formData, "travelTimeMinutes"),
    travelMode: readOptionalString(formData, "travelMode"),
  });

  if (!parsed.success) {
    return { fieldErrors: parsed.error.flatten().fieldErrors };
  }

  const routeRepository = await getRouteRepository();
  const stop = await routeRepository.addStop({ input: parsed.data });
  logger.info("route stop added", { routeStopId: stop.id, tripId, date });

  revalidatePath(`/trips/${tripId}/days/${date}`);
  return {};
}

export async function calculateRouteDistanceAction(
  query: unknown,
): Promise<{ ok: true; result: RoutingResult } | { ok: false; error: string }> {
  const user = await getCurrentUser();
  if (!user) redirect("/login");

  const parsed = routingQuerySchema.safeParse(query);
  if (!parsed.success) {
    return { ok: false, error: "נקודות מוצא/יעד לא תקינות." };
  }

  try {
    const routingProvider = getRoutingProvider();
    const result = await routingProvider.getDrivingRoute(parsed.data);
    if (!result) {
      return { ok: false, error: "לא נמצא מסלול נהיגה בין שתי הנקודות." };
    }
    return { ok: true, result };
  } catch (error) {
    logger.warn("routing calculation failed", { error: error instanceof Error ? error.message : String(error) });
    return { ok: false, error: "חישוב המרחק נכשל כרגע — אפשר להזין ידנית." };
  }
}

/** מוסיף הצעה מ"מה שווה לעשות היום" למסלול היום כעצירה אחרונה — אותה קריאת Repository כמו addRouteStopAction. */
export async function addSuggestedStopAction(tripId: string, date: string, placeId: string): Promise<void> {
  const user = await getCurrentUser();
  if (!user) redirect("/login");

  await assertTripOwnership(user.id, tripId);

  const parsed = createRouteStopInputSchema.parse({ tripId, date, placeId });
  const routeRepository = await getRouteRepository();
  const stop = await routeRepository.addStop({ input: parsed });
  logger.info("route stop added from daily suggestion", { routeStopId: stop.id, tripId, date, placeId });

  revalidatePath(`/trips/${tripId}/days/${date}`);
}

export async function moveRouteStopAction(
  tripId: string,
  date: string,
  routeStopId: string,
  direction: "up" | "down",
): Promise<void> {
  const user = await getCurrentUser();
  if (!user) redirect("/login");

  await assertTripOwnership(user.id, tripId);

  const routeRepository = await getRouteRepository();
  await routeRepository.moveStop({ routeStopId, direction });
  logger.info("route stop moved", { routeStopId, direction, tripId, date });

  revalidatePath(`/trips/${tripId}/days/${date}`);
}

export async function removeRouteStopAction(tripId: string, date: string, routeStopId: string): Promise<void> {
  const user = await getCurrentUser();
  if (!user) redirect("/login");

  await assertTripOwnership(user.id, tripId);

  const routeRepository = await getRouteRepository();
  await routeRepository.removeStop({ routeStopId });
  logger.info("route stop removed", { routeStopId, tripId, date });

  revalidatePath(`/trips/${tripId}/days/${date}`);
}

export interface OptimizeRouteResult {
  ok: boolean;
  error?: string;
}

/**
 * מוצא סדר-ביקור אופטימלי לעצירות היום דרך OSRM Trip service, עם נקודת
 * התחלה=המלון שיצאת ממנו בבוקר ונקודת סיום=המלון שאתה חוזר אליו בלילה
 * (נמצאים אוטומטית לפי HotelStay.checkInDate/checkOutDate — לא קלט ידני).
 * לא ממציא נקודת התחלה/סיום אם אין מלון עם קואורדינטות — מחזיר שגיאה ברורה.
 */
export async function optimizeDayRouteAction(tripId: string, date: string): Promise<OptimizeRouteResult> {
  const user = await getCurrentUser();
  if (!user) redirect("/login");

  try {
    await assertTripOwnership(user.id, tripId);
  } catch {
    return { ok: false, error: "הטיול לא נמצא או שאין לך הרשאה אליו." };
  }

  const routeRepository = await getRouteRepository();
  const stops = await routeRepository.listForDay({ tripId, date });
  if (stops.length < 2) {
    return { ok: false, error: "צריך לפחות שתי עצירות כדי לייעל מסלול." };
  }

  const placeRepository = await getPlaceRepository();
  const allPlaces = await placeRepository.list({ userId: user.id });
  const placesById = new Map(allPlaces.map((p) => [p.id, p]));

  const stopsWithCoords = stops
    .map((stop) => {
      const place = stop.placeId ? placesById.get(stop.placeId) : undefined;
      if (!place || place.lat === null || place.lng === null) return null;
      return { stop, lat: place.lat, lng: place.lng };
    })
    .filter((entry): entry is { stop: (typeof stops)[number]; lat: number; lng: number } => entry !== null);

  if (stopsWithCoords.length < 2) {
    return { ok: false, error: "צריך לפחות שתי עצירות עם מקום בעל קואורדינטות כדי לייעל מסלול." };
  }

  const bookingRepository = await getBookingRepository();
  const hotelStays = await bookingRepository.listHotelStays({ tripId });
  const { morningHotel, nightHotel } = resolveDayHotelContext(hotelStays, date);

  if (!morningHotel || morningHotel.lat === null || morningHotel.lng === null) {
    return { ok: false, error: "אין מלון עם קואורדינטות רשום כנקודת ההתחלה של היום הזה — ייעול מסלול לא זמין." };
  }
  if (!nightHotel || nightHotel.lat === null || nightHotel.lng === null) {
    return { ok: false, error: "אין מלון עם קואורדינטות רשום כנקודת הסיום של היום הזה — ייעול מסלול לא זמין." };
  }

  const waypoints = [
    { lat: morningHotel.lat, lng: morningHotel.lng },
    ...stopsWithCoords.map((s) => ({ lat: s.lat, lng: s.lng })),
    { lat: nightHotel.lat, lng: nightHotel.lng },
  ];

  try {
    const routingProvider = getRoutingProvider();
    const result = await routingProvider.getOptimizedTripOrder(waypoints);
    if (!result) {
      return { ok: false, error: "לא הצלחנו למצוא מסלול מיטבי כרגע. אפשר לנסות שוב מאוחר יותר, או לסדר ידנית." };
    }

    // waypoints[0]=מלון-בוקר, waypoints[1..N]=stopsWithCoords, waypoints[N+1]=מלון-לילה.
    // רק העצירות עצמן (לא המלונות) הופכות ל-RouteStop מסודר מחדש.
    const orderedStopEntries: { routeStopId: string; distanceKm?: number; travelTimeMinutes?: number }[] = [];
    for (let position = 0; position < result.orderedIndices.length; position++) {
      const waypointIndex = result.orderedIndices[position]!;
      if (waypointIndex === 0 || waypointIndex === waypoints.length - 1) continue; // מלון, לא עצירה אמיתית
      const stopEntry = stopsWithCoords[waypointIndex - 1]!;
      const legDistanceKm = result.legDistancesKm[position - 1];
      const legTravelTimeMinutes = result.legTravelTimeMinutes[position - 1];
      orderedStopEntries.push({
        routeStopId: stopEntry.stop.id,
        ...(legDistanceKm !== undefined ? { distanceKm: legDistanceKm } : {}),
        ...(legTravelTimeMinutes !== undefined ? { travelTimeMinutes: legTravelTimeMinutes } : {}),
      });
    }

    await routeRepository.reorderStops({ tripId, date, stops: orderedStopEntries });
    logger.info("day route optimized", { tripId, date, stopCount: orderedStopEntries.length });
  } catch (error) {
    logger.warn("route optimization failed", { error: error instanceof Error ? error.message : String(error) });
    return { ok: false, error: "אופטימיזציית המסלול נכשלה כרגע. אפשר לנסות שוב או לסדר ידנית." };
  }

  revalidatePath(`/trips/${tripId}/days/${date}`);
  return { ok: true };
}

export interface TripDayNotesFormState {
  formError?: string;
}

export async function updateTripDayNotesAction(
  tripId: string,
  date: string,
  _prevState: TripDayNotesFormState,
  formData: FormData,
): Promise<TripDayNotesFormState> {
  const user = await getCurrentUser();
  if (!user) redirect("/login");

  try {
    await assertTripOwnership(user.id, tripId);
  } catch {
    return { formError: "הטיול לא נמצא או שאין לך הרשאה אליו." };
  }

  const notes = readOptionalString(formData, "notes") ?? null;
  const tripDayRepository = await getTripDayRepository();
  const tripDay = await tripDayRepository.getOrCreate({ tripId, date });
  await tripDayRepository.updateNotes({ tripDayId: tripDay.id, notes });
  logger.info("trip day notes updated", { tripDayId: tripDay.id, tripId, date });

  revalidatePath(`/trips/${tripId}/days/${date}`);
  return {};
}
