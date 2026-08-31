import { getTripDayDates } from "./trip-days";

export interface LifetimeStatsTripInput {
  id: string;
  name: string;
  startDate: string;
  endDate: string;
}

export interface LifetimeStatsExpenseInput {
  amount: number;
  currencyCode: string;
}

export interface LifetimeStats {
  tripsCount: number;
  daysTraveledCount: number;
  uniquePlacesVisitedCount: number;
  uniqueCountriesCount: number;
  uniqueCitiesCount: number;
  /** בלי המרת מטבע מומצאת — אותו עיקרון כמו computeTripInsights ב-dashboard/compare. */
  totalSpentByCurrency: Map<string, number>;
  longestTrip: { tripId: string; name: string; dayCount: number } | null;
}

/**
 * אגרגציה חוצת-כל-הטיולים ("סטטיסטיקות חיים") — אותם עקרונות בדיוק כמו
 * computeTripInsights (dashboard/page.tsx) ו-trips/compare/page.tsx, רק
 * כפונקציה טהורה נפרדת+נבדקת (הן היו inline). דה-דופ מדינות/ערים לפי שם
 * מנוקה (trim) — אין מזהה-גיאוגרפי משותף בין טיולים, רק טקסט חופשי.
 */
export function computeLifetimeStats(input: {
  trips: LifetimeStatsTripInput[];
  visitedPlaceIdsByTrip: Map<string, string[]>;
  countryNamesByTrip: Map<string, string[]>;
  cityNamesByTrip: Map<string, string[]>;
  expensesByTrip: Map<string, LifetimeStatsExpenseInput[]>;
}): LifetimeStats {
  const { trips, visitedPlaceIdsByTrip, countryNamesByTrip, cityNamesByTrip, expensesByTrip } = input;

  const visitedPlaceIds = new Set<string>();
  const countryNames = new Set<string>();
  const cityNames = new Set<string>();
  const totalSpentByCurrency = new Map<string, number>();
  let longestTrip: LifetimeStats["longestTrip"] = null;
  let daysTraveledCount = 0;

  for (const trip of trips) {
    const dayCount = getTripDayDates(trip.startDate, trip.endDate).length;
    daysTraveledCount += dayCount;

    for (const placeId of visitedPlaceIdsByTrip.get(trip.id) ?? []) visitedPlaceIds.add(placeId);
    for (const name of countryNamesByTrip.get(trip.id) ?? []) countryNames.add(name.trim());
    for (const name of cityNamesByTrip.get(trip.id) ?? []) cityNames.add(name.trim());

    for (const expense of expensesByTrip.get(trip.id) ?? []) {
      totalSpentByCurrency.set(expense.currencyCode, (totalSpentByCurrency.get(expense.currencyCode) ?? 0) + expense.amount);
    }

    if (!longestTrip || dayCount > longestTrip.dayCount) {
      longestTrip = { tripId: trip.id, name: trip.name, dayCount };
    }
  }

  return {
    tripsCount: trips.length,
    daysTraveledCount,
    uniquePlacesVisitedCount: visitedPlaceIds.size,
    uniqueCountriesCount: countryNames.size,
    uniqueCitiesCount: cityNames.size,
    totalSpentByCurrency,
    longestTrip,
  };
}
