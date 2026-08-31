"use server";

import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import {
  getChecklistItemRepository,
  getFinanceRepository,
  getRouteRepository,
  getTripCompanionRepository,
  getTripGeographyRepository,
  getTripRepository,
} from "@travel-app/data-layer";
import { getCurrentUser } from "@/lib/auth/get-current-user";
import { getTripDayDates } from "@/lib/trip-days";
import { logger } from "@/lib/logger";

export interface DuplicateTripFormState {
  fieldErrors?: Record<string, string[]>;
  formError?: string;
}

function addDays(date: string, days: number): string {
  const d = new Date(`${date}T00:00:00Z`);
  d.setUTCDate(d.getUTCDate() + days);
  return d.toISOString().slice(0, 10);
}

/**
 * שכפול טיול — כולל את המסלול היומי המלא (RouteStop-ים, בהזזת-תאריכים
 * יחסית ל-newStartDate), לפי בקשת המשתמש (ר' plan, "חלק F"). לא מבצע
 * טרנזקציית-DB אחת (Mock repository לא תומך בזה, כמו שאר ה-actions
 * בפרויקט) — אם שלב באמצע נכשל, הטיול החדש כבר נוצר עם מה שהושלם עד אז.
 * לא מועתקים: notes/medicalNotes/coverImageUrl/status, יומן-יום ותמונות-
 * יום, PlannedActivity, הזמנות, הוצאות/תשלומים, מסמכים, קישור-שיתוף —
 * כל אלה ספציפיים-לטיול-המקורי (ר' plan להנמקה המלאה).
 */
export async function duplicateTripAction(
  sourceTripId: string,
  _prevState: DuplicateTripFormState,
  formData: FormData,
): Promise<DuplicateTripFormState> {
  const user = await getCurrentUser();
  if (!user) redirect("/login");

  const tripRepository = await getTripRepository();
  const sourceTrip = await tripRepository.getById({ userId: user.id, tripId: sourceTripId });
  if (!sourceTrip) {
    return { formError: "הטיול המקורי לא נמצא או שאין לך הרשאה אליו." };
  }

  const newStartDate = formData.get("newStartDate");
  if (typeof newStartDate !== "string" || newStartDate.trim() === "") {
    return { fieldErrors: { newStartDate: ["יש להזין תאריך התחלה לטיול החדש."] } };
  }

  const oldDates = getTripDayDates(sourceTrip.startDate, sourceTrip.endDate);
  if (oldDates.length === 0) {
    return { formError: "לטיול המקורי אין ימים תקינים לשכפול." };
  }
  const newEndDate = addDays(newStartDate, oldDates.length - 1);

  const newTrip = await tripRepository.create({
    userId: user.id,
    input: {
      name: `${sourceTrip.name} (עותק)`,
      startDate: newStartDate,
      endDate: newEndDate,
      baseCurrencyCode: sourceTrip.baseCurrencyCode ?? undefined,
      primaryTimezone: sourceTrip.primaryTimezone ?? undefined,
      tripType: sourceTrip.tripType ?? undefined,
      totalBudgetAmount: sourceTrip.totalBudgetAmount ?? undefined,
      dailyBudgetAmount: sourceTrip.dailyBudgetAmount ?? undefined,
    },
  });
  logger.info("trip duplicated: new trip created", { sourceTripId, newTripId: newTrip.id });

  const tripGeographyRepository = await getTripGeographyRepository();
  const [sourceCountries, sourceCities] = await Promise.all([
    tripGeographyRepository.listCountries({ tripId: sourceTripId }),
    tripGeographyRepository.listCities({ tripId: sourceTripId }),
  ]);
  const countryIdMap = new Map<string, string>();
  for (const country of sourceCountries) {
    const newCountry = await tripGeographyRepository.addCountry({ input: { tripId: newTrip.id, countryName: country.countryName } });
    countryIdMap.set(country.id, newCountry.id);
  }
  for (const city of sourceCities) {
    await tripGeographyRepository.addCity({
      input: {
        tripId: newTrip.id,
        cityName: city.cityName,
        countryId: city.countryId ? countryIdMap.get(city.countryId) : undefined,
      },
    });
  }

  const financeRepository = await getFinanceRepository();
  const budgetCategoryLimits = await financeRepository.listBudgetCategoryLimits({ tripId: sourceTripId });
  for (const limit of budgetCategoryLimits) {
    await financeRepository.upsertBudgetCategoryLimit({
      input: { tripId: newTrip.id, category: limit.category, limitAmount: limit.limitAmount },
    });
  }

  const checklistItemRepository = await getChecklistItemRepository();
  for (const listType of ["packing", "before_trip"] as const) {
    const items = await checklistItemRepository.listForTrip({ tripId: sourceTripId, listType });
    for (const item of items) {
      await checklistItemRepository.create({
        input: { tripId: newTrip.id, listType, name: item.name, category: item.category ?? undefined, quantity: item.quantity ?? undefined },
      });
    }
  }

  const tripCompanionRepository = await getTripCompanionRepository();
  const companions = await tripCompanionRepository.listForTrip({ tripId: sourceTripId });
  for (const companion of companions) {
    await tripCompanionRepository.create({
      input: { tripId: newTrip.id, displayName: companion.displayName, relation: companion.relation ?? undefined, notes: companion.notes ?? undefined },
    });
  }

  // מסלול יומי מלא, בהזזת-תאריכים 1:1 (יום i בטיול המקורי -> יום i בטיול החדש).
  // עצירות בלי placeId (לא אמור לקרות בפועל, אבל RouteStop.placeId נאלבילי
  // בסכימה) מדולגות — createRouteStopInputSchema דורש placeId אמיתי, לא ממציאים.
  const routeRepository = await getRouteRepository();
  const newDates = getTripDayDates(newStartDate, newEndDate);
  for (let i = 0; i < oldDates.length; i++) {
    const stops = await routeRepository.listForDay({ tripId: sourceTripId, date: oldDates[i]! });
    for (const stop of stops) {
      if (!stop.placeId) continue;
      await routeRepository.addStop({
        input: {
          tripId: newTrip.id,
          date: newDates[i]!,
          placeId: stop.placeId,
          distanceKm: stop.distanceKm ?? undefined,
          travelTimeMinutes: stop.travelTimeMinutes ?? undefined,
          travelMode: stop.travelMode ?? undefined,
        },
      });
    }
  }

  logger.info("trip duplicated: finished copying structure", { sourceTripId, newTripId: newTrip.id });
  revalidatePath("/trips");
  revalidatePath("/dashboard");
  redirect(`/trips/${newTrip.id}`);
}
