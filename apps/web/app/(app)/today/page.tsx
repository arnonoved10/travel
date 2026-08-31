import Link from "next/link";
import { redirect } from "next/navigation";
import { getCurrentUser } from "@/lib/auth/get-current-user";
import {
  getBookingRepository,
  getCurrencyRateProvider,
  getFinanceRepository,
  getNotificationPreferenceRepository,
  getPlaceRepository,
  getPlannedActivityRepository,
  getTripPlaceRepository,
  getTripRepository,
  getWeatherProvider,
} from "@travel-app/data-layer";
import type { ReminderCandidate } from "@/lib/notification-reminders";
import type { WeatherForecastSnapshot } from "@travel-app/shared-types";
import { computeBudgetProgress } from "@/lib/budget";
import { NOTIFICATION_EVENT_TYPE_LABELS } from "@/lib/notification-event-type-labels";
import { getWeatherAdvice } from "@/lib/weather-advice";
import { detectWeatherAlerts, detectRainDuringActivities } from "@/lib/weather-alerts";
import { computeRainWindows } from "@/lib/rain-window";
import { formatTimeWithIsraelReference } from "@/lib/dates";
import { TRANSPORT_MODE_LABELS } from "@/lib/transport-mode-labels";
import { computeAirportTiming } from "@/lib/airport-timing";
import { Temperature } from "@/components/temperature";
import { GpsWeatherCard } from "./gps-weather-card";
import { WorldClockCard } from "@/components/world-clock-card";
import { getActiveTrip } from "@/lib/active-trip";
import { resolveWeatherReferencePlace } from "@/lib/weather-reference-place";
import { NearbyPlaces, type NearbyCandidate } from "../now/nearby-places";
import { NotificationReminders } from "../now/notification-reminders";
import { RateHereCard } from "../now/rate-here-card";
import { DiscoverPlaces } from "../now/discover-places";

export const dynamic = "force-dynamic";

type TimedEvent = { at: Date; title: string; subtitle: string; timezone: string };

function formatTimeRemaining(ms: number): string {
  const totalMinutes = Math.max(0, Math.round(ms / 60000));
  const hours = Math.floor(totalMinutes / 60);
  const minutes = totalMinutes % 60;
  if (hours === 0) return `${minutes} דקות`;
  if (minutes === 0) return `${hours} שעות`;
  return `${hours} שעות ו-${minutes} דקות`;
}

// היום — לפי שעון השרת, בפורמט תאריך בלבד (ראה הערת Time Zones הידועה
// ב-apps/web/app/(app)/trips/[tripId]/bookings/actions.ts).
function getTodayIsoDate(): string {
  return new Date().toISOString().slice(0, 10);
}

/**
 * מיזוג 2026-08-28 של /now לתוך /today (בקשת משתמש: "מה צריך להוריד... שיהיה
 * מובן ומסודר") — שני מסכים נפרדים ענו בעצם על אותה שאלה ("מה קורה עכשיו
 * בטיול"), עם חפיפה ממשית: מזג-אוויר-נוכחי, איפה-אני-ישן-הלילה, טיסות/הסעות-
 * של-היום, הוצאתי-היום היו מחושבים פעמיים בשני קבצים נפרדים. כאן מחושבים
 * פעם אחת. /now הפך ל-redirect לכאן.
 */
export default async function TodayPage() {
  const user = await getCurrentUser();
  if (!user) redirect("/login");

  const now = new Date();
  const today = getTodayIsoDate();

  const tripRepository = await getTripRepository();
  const allTrips = await tripRepository.list({ userId: user.id });
  // /today ממוקד-תאריך-ממש ("עכשיו", "הלילה") — טיול שעוד לא התחיל אין לו
  // "היום" בתוכו, אז נשארים בתצוגה הפשוטה (בשונה מדשבורד/חירום, ר' lib/active-trip.ts).
  const activeTripResult = getActiveTrip(allTrips, today);
  const activeTrip = activeTripResult && !activeTripResult.isUpcoming ? activeTripResult.trip : null;

  if (!activeTrip) {
    return (
      <div>
        <h1 style={{ marginTop: 0 }}>היום שלי</h1>
        <p style={{ color: "var(--color-text-muted)" }}>{today} — אין טיול פעיל היום.</p>
        {activeTripResult ? (
          <div style={{ marginTop: "1rem" }}>
            <h2 style={{ fontSize: "1rem" }}>הטיול הבא שלך</h2>
            <Link href={`/trips/${activeTripResult.trip.id}`} style={{ color: "var(--color-primary)" }}>
              {activeTripResult.trip.name} — מתחיל ב-{activeTripResult.trip.startDate}
            </Link>
          </div>
        ) : null}
      </div>
    );
  }

  const bookingRepository = await getBookingRepository();
  const financeRepository = await getFinanceRepository();
  const tripPlaceRepository = await getTripPlaceRepository();
  const notificationPreferenceRepository = await getNotificationPreferenceRepository();
  const plannedActivityRepository = await getPlannedActivityRepository();
  const placeRepository = await getPlaceRepository();
  const [
    hotelStays,
    flights,
    transportBookings,
    expenses,
    wallets,
    tripPlaces,
    notificationPreferences,
    plannedActivities,
    insurances,
    deposits,
    activityReservations,
    carRentals,
    payments,
    allPlaces,
  ] = await Promise.all([
    bookingRepository.listHotelStays({ tripId: activeTrip.id }),
    bookingRepository.listFlights({ tripId: activeTrip.id }),
    bookingRepository.listTransportBookings({ tripId: activeTrip.id }),
    financeRepository.listExpenses({ tripId: activeTrip.id }),
    financeRepository.listWallets({ tripId: activeTrip.id }),
    tripPlaceRepository.listForTrip({ userId: user.id, tripId: activeTrip.id }),
    notificationPreferenceRepository.listForTrip({ tripId: activeTrip.id }),
    plannedActivityRepository.listForTrip({ tripId: activeTrip.id }),
    bookingRepository.listInsurances({ tripId: activeTrip.id }),
    financeRepository.listDeposits({ tripId: activeTrip.id }),
    bookingRepository.listActivityReservations({ tripId: activeTrip.id }),
    bookingRepository.listCarRentals({ tripId: activeTrip.id }),
    financeRepository.listPaymentsByTrip({ tripId: activeTrip.id }),
    placeRepository.list({ userId: user.id }),
  ]);

  // ---- מיקום/זמן היום (משותף לשני החלקים הישנים) ----
  const tonightHotel = hotelStays.find((h) => h.checkInDate <= today && today < h.checkOutDate);
  const checkingInToday = hotelStays.find((h) => h.checkInDate === today);
  const checkingOutToday = hotelStays.find((h) => h.checkOutDate === today);
  const todayFlights = flights.filter((f) => f.departureAt.slice(0, 10) === today);
  const todayTransport = transportBookings.filter((t) => t.pickupAt.slice(0, 10) === today);
  const todayExpenses = expenses.filter((e) => e.expenseAt.slice(0, 10) === today);
  const spentToday = todayExpenses.reduce((sum, e) => sum + e.amount, 0);

  const todayEvents: TimedEvent[] = [
    ...todayFlights.map((f) => ({
      at: new Date(f.departureAt),
      title: `טיסה ${f.airline} ${f.flightNumber ?? ""}`.trim(),
      subtitle: `${f.departureAirport} → ${f.arrivalAirport}`,
      timezone: f.departureTimezone,
    })),
    ...todayTransport.map((t) => ({
      at: new Date(t.pickupAt),
      title: "הסעה",
      subtitle: `${t.pickupText ?? "?"} → ${t.dropoffText ?? "?"}`,
      timezone: t.pickupTimezone,
    })),
  ].sort((a, b) => a.at.getTime() - b.at.getTime());
  const nextEvent = todayEvents.find((e) => e.at.getTime() > now.getTime());
  const restOfDay = todayEvents.filter((e) => e.at.getTime() > now.getTime());

  // ---- מזג אוויר/שעון-יעד (מקום מקושר, ובלעדיו מלון-ראשון-עם-קואורדינטות —
  // ר' lib/weather-reference-place.ts) ----
  const weatherPlace = resolveWeatherReferencePlace(tripPlaces, hotelStays);
  let currentWeather: Omit<WeatherForecastSnapshot, "id" | "retrievedAt"> | null = null;
  let hourlyWeather: Array<Omit<WeatherForecastSnapshot, "id" | "retrievedAt">> = [];
  let dailyWeather: Array<Omit<WeatherForecastSnapshot, "id" | "retrievedAt">> = [];
  let weatherError = false;
  if (weatherPlace?.lat !== undefined && weatherPlace?.lat !== null && weatherPlace?.lng !== null && weatherPlace?.lng !== undefined) {
    try {
      const weatherProvider = getWeatherProvider();
      const query = { lat: weatherPlace.lat, lng: weatherPlace.lng };
      [currentWeather, hourlyWeather, dailyWeather] = await Promise.all([
        weatherProvider.getCurrentConditions(query),
        weatherProvider.getHourlyForecast(query, { hours: 8 }),
        weatherProvider.getDailyForecast(query, { days: 5 }),
      ]);
    } catch {
      weatherError = true;
    }
  }
  const weatherAdvice = currentWeather ? getWeatherAdvice(currentWeather) : [];
  const weatherAlerts = detectWeatherAlerts(hourlyWeather);
  const rainWindows = computeRainWindows(hourlyWeather);

  // מזג אוויר ביעד הבא — המלון הבא שמתחיל אחרי היום עם קואורדינטות שונות מהמיקום הנוכחי.
  const upcomingHotel = hotelStays
    .filter((h) => h.checkInDate > today && h.lat !== null && h.lng !== null)
    .sort((a, b) => a.checkInDate.localeCompare(b.checkInDate))[0];
  const isDifferentDestination = upcomingHotel && (upcomingHotel.lat !== weatherPlace?.lat || upcomingHotel.lng !== weatherPlace?.lng);
  let nextDestinationWeather: Omit<WeatherForecastSnapshot, "id" | "retrievedAt"> | null = null;
  if (isDifferentDestination && upcomingHotel?.lat !== null && upcomingHotel?.lat !== undefined && upcomingHotel?.lng !== null && upcomingHotel?.lng !== undefined) {
    try {
      const weatherProvider = getWeatherProvider();
      const daysAhead = Math.max(
        1,
        Math.round((new Date(`${upcomingHotel.checkInDate}T00:00:00Z`).getTime() - new Date(`${today}T00:00:00Z`).getTime()) / 86_400_000),
      );
      const daily = await weatherProvider.getDailyForecast({ lat: upcomingHotel.lat, lng: upcomingHotel.lng }, { days: Math.min(daysAhead + 1, 16) });
      nextDestinationWeather = daily[daysAhead] ?? daily.at(-1) ?? null;
    } catch {
      nextDestinationWeather = null;
    }
  }

  // גשם צפוי בזמן פעילות מתוכננת — קריאה אחת לתחזית לכל מקום ייחודי.
  const placesById = new Map(allPlaces.map((p) => [p.id, p]));
  const todayActivitiesWithPlace = plannedActivities
    .filter((a) => a.plannedAt?.slice(0, 10) === today && a.placeId)
    .map((a) => ({ activity: a, place: placesById.get(a.placeId!) }))
    .filter((x): x is { activity: typeof x.activity; place: NonNullable<typeof x.place> } => x.place?.lat != null && x.place?.lng != null);
  const MAX_ACTIVITY_FORECAST_GAP_MS = 90 * 60 * 1000;
  const uniqueActivityPlaceIds = Array.from(new Set(todayActivitiesWithPlace.map((x) => x.place.id)));
  const weatherProviderForActivities = getWeatherProvider();
  const hourlyByActivityPlaceId = new Map<string, Array<Omit<WeatherForecastSnapshot, "id" | "retrievedAt">>>();
  await Promise.all(
    uniqueActivityPlaceIds.map(async (placeId) => {
      const place = placesById.get(placeId)!;
      try {
        const hourly = await weatherProviderForActivities.getHourlyForecast({ lat: place.lat!, lng: place.lng! }, { hours: 48 });
        hourlyByActivityPlaceId.set(placeId, hourly);
      } catch {
        // כשל קריאה בודדת לא מפיל את שאר הדף.
      }
    }),
  );
  const activitiesWithForecast = todayActivitiesWithPlace.map(({ activity, place }) => {
    const hourly = hourlyByActivityPlaceId.get(place.id) ?? [];
    let forecastPrecipitationProbabilityPercent: number | null = null;
    if (hourly.length > 0 && activity.plannedAt) {
      const targetMs = new Date(activity.plannedAt).getTime();
      const closest = hourly.reduce((best, hour) =>
        Math.abs(new Date(hour.forecastAt).getTime() - targetMs) < Math.abs(new Date(best.forecastAt).getTime() - targetMs) ? hour : best,
      );
      if (Math.abs(new Date(closest.forecastAt).getTime() - targetMs) <= MAX_ACTIVITY_FORECAST_GAP_MS) {
        forecastPrecipitationProbabilityPercent = closest.precipitationProbabilityPercent;
      }
    }
    return { id: activity.id, name: activity.name, plannedAt: activity.plannedAt!, forecastPrecipitationProbabilityPercent };
  });
  const rainDuringActivityAlerts = detectRainDuringActivities(activitiesWithForecast);

  // ---- מקומות קרובים (Geolocation, /now לשעבר) ----
  const nearbyCandidates: NearbyCandidate[] = tripPlaces
    .filter((tp) => tp.place.lat !== null && tp.place.lng !== null)
    .map((tp) => ({
      tripPlaceId: tp.id,
      placeId: tp.placeId,
      name: tp.place.name,
      category: tp.place.category,
      status: tp.status,
      lat: tp.place.lat as number,
      lng: tp.place.lng as number,
    }));

  // ---- התראות מתוזמנות (/now לשעבר) ----
  const flightPref = notificationPreferences.find((p) => p.eventType === "flight_approaching" && p.isEnabled);
  const taxiPref = notificationPreferences.find((p) => p.eventType === "taxi_approaching" && p.isEnabled);
  const checkoutPref = notificationPreferences.find((p) => p.eventType === "checkout_approaching" && p.isEnabled);
  const activityNotBookedPref = notificationPreferences.find((p) => p.eventType === "activity_not_booked" && p.isEnabled);
  const needToLeavePref = notificationPreferences.find((p) => p.eventType === "need_to_leave_for_airport" && p.isEnabled);
  const checkInOpenPref = notificationPreferences.find((p) => p.eventType === "flight_checkin_open" && p.isEnabled);
  const NOT_YET_BOOKED_STATUSES = new Set(["want_to_book", "planned", "need_to_book"]);
  const reminderCandidates: ReminderCandidate[] = [
    ...(flightPref
      ? flights.map((f) => ({
          id: `flight-${f.id}`,
          title: `טיסה מתקרבת: ${f.airline} ${f.flightNumber ?? ""}`.trim(),
          body: `${f.departureAirport} → ${f.arrivalAirport}`,
          eventAt: f.departureAt,
          leadTimeMinutes: flightPref.leadTimeMinutes ?? 180,
        }))
      : []),
    ...(taxiPref
      ? transportBookings.map((t) => ({
          id: `taxi-${t.id}`,
          title: "הסעה מתקרבת",
          body: `${t.pickupText ?? "?"} → ${t.dropoffText ?? "?"}`,
          eventAt: t.pickupAt,
          leadTimeMinutes: taxiPref.leadTimeMinutes ?? 30,
        }))
      : []),
    ...(checkoutPref
      ? hotelStays
          .filter((h) => h.checkOutTime)
          .map((h) => ({
            id: `checkout-${h.id}`,
            title: `צ'ק-אאוט מתקרב: ${h.hotelName}`,
            body: `עד ${h.checkOutTime}`,
            eventAt: `${h.checkOutDate}T${h.checkOutTime}:00.000Z`,
            leadTimeMinutes: checkoutPref.leadTimeMinutes ?? 60,
          }))
      : []),
    ...(activityNotBookedPref
      ? plannedActivities
          .filter((a) => a.plannedAt && NOT_YET_BOOKED_STATUSES.has(a.status))
          .map((a) => ({
            id: `activity-not-booked-${a.id}`,
            title: `עוד לא הוזמן: ${a.name}`,
            body: "התכנית מתקרבת ועדיין בסטטוס לא-מוזמן",
            eventAt: a.plannedAt!,
            leadTimeMinutes: activityNotBookedPref.leadTimeMinutes ?? 1440,
          }))
      : []),
    ...(needToLeavePref
      ? flights.flatMap((f) => {
          if (f.airportArrivalLeadMinutes === null) return [];
          const timing = computeAirportTiming({
            departureAt: f.departureAt,
            recommendedArrivalLeadMinutes: f.airportArrivalLeadMinutes,
            travelTimeToAirportMinutes: f.travelTimeToAirportMinutes ?? undefined,
          });
          if (timing.recommendedLeaveAt === null) return [];
          return [
            {
              id: `leave-for-airport-${f.id}`,
              title: `זמן לצאת לשדה: טיסת ${f.airline} ${f.flightNumber ?? ""}`.trim(),
              body: `יציאה ל${f.departureAirport} כדי להגיע בזמן`,
              eventAt: timing.recommendedLeaveAt,
              leadTimeMinutes: needToLeavePref.leadTimeMinutes ?? 30,
            },
          ];
        })
      : []),
    ...(checkInOpenPref
      ? flights
          .filter((f) => f.checkInWindowHours !== null)
          .map((f) => ({
            id: `checkin-open-${f.id}`,
            title: `צ'ק-אין נפתח: ${f.airline} ${f.flightNumber ?? ""}`.trim(),
            body: `אפשר לעשות צ'ק-אין לטיסה ל${f.arrivalAirport}`,
            eventAt: new Date(new Date(f.departureAt).getTime() - f.checkInWindowHours! * 60 * 60 * 1000).toISOString(),
            leadTimeMinutes: checkInOpenPref.leadTimeMinutes ?? 60,
          }))
      : []),
  ];

  // ---- אזהרת-תקציב (state נוכחי, /now לשעבר) ----
  let budgetRatio: number | null = null;
  if (activeTrip.totalBudgetAmount !== null) {
    const budgetCurrencyCodes = Array.from(new Set(expenses.map((e) => e.currencyCode)));
    const budgetRates = await getCurrencyRateProvider().getRatesToILS(budgetCurrencyCodes);
    const budgetRateToILSByCurrency = new Map(budgetRates.map((r) => [r.currencyCode, r.rateToILS]));
    const budgetProgress = computeBudgetProgress({
      expenses,
      categoryLimits: [],
      totalBudgetAmount: activeTrip.totalBudgetAmount,
      dailyBudgetAmount: activeTrip.dailyBudgetAmount,
      rateToILSByCurrency: budgetRateToILSByCurrency,
    });
    budgetRatio = budgetProgress.totalSpentAmount / budgetProgress.totalBudgetAmount!;
  }

  // ---- 4 התראות-מצב נוספות (/now לשעבר) ----
  const nightWithoutHotelPref = notificationPreferences.find((p) => p.eventType === "night_without_hotel" && p.isEnabled);
  const overdueNotMarkedDonePref = notificationPreferences.find((p) => p.eventType === "overdue_not_marked_done" && p.isEnabled);
  const depositDueReturnPref = notificationPreferences.find((p) => p.eventType === "deposit_due_return" && p.isEnabled);
  const insuranceEndingPref = notificationPreferences.find((p) => p.eventType === "insurance_ending" && p.isEnabled);

  const tomorrow = new Date(now.getTime() + 24 * 60 * 60 * 1000).toISOString().slice(0, 10);
  const nightsMissingHotel = nightWithoutHotelPref
    ? [today, tomorrow].filter((night) => !hotelStays.some((h) => h.checkInDate <= night && night < h.checkOutDate))
    : [];

  const TERMINAL_ACTIVITY_STATUSES = new Set(["done", "not_done", "postponed", "cancelled"]);
  const overdueActivities = overdueNotMarkedDonePref
    ? plannedActivities.filter((a) => a.plannedAt && new Date(a.plannedAt) < now && !TERMINAL_ACTIVITY_STATUSES.has(a.status))
    : [];

  const DEPOSIT_DUE_SOON_DAYS = 3;
  const depositDueSoonDate = new Date(now.getTime() + DEPOSIT_DUE_SOON_DAYS * 24 * 60 * 60 * 1000).toISOString().slice(0, 10);
  const depositsDue = depositDueReturnPref
    ? deposits.filter((d) => !d.isReturned && d.expectedReturnDate && d.expectedReturnDate <= depositDueSoonDate)
    : [];

  const INSURANCE_ENDING_SOON_DAYS = 7;
  const insuranceEndingSoonDate = new Date(now.getTime() + INSURANCE_ENDING_SOON_DAYS * 24 * 60 * 60 * 1000).toISOString().slice(0, 10);
  const insurancesEnding = insuranceEndingPref ? insurances.filter((ins) => ins.endDate <= insuranceEndingSoonDate) : [];

  const unpaidBookingPref = notificationPreferences.find((p) => p.eventType === "unpaid_booking" && p.isEnabled);
  const UNPAID_CHECK_EXCLUDED_STATUSES = new Set(["want_to_book", "cancelled"]);
  interface PricedBookingSource {
    bookingId: string;
    label: string;
    agreedPrice: number | null;
    agreedCurrencyCode: string | null;
    status: string;
  }
  const allPricedBookings: PricedBookingSource[] = [
    ...hotelStays.map((h) => ({ bookingId: h.bookingId, label: h.hotelName, agreedPrice: h.agreedPrice, agreedCurrencyCode: h.agreedCurrencyCode, status: h.status })),
    ...flights.map((f) => ({
      bookingId: f.bookingId,
      label: `${f.airline} ${f.flightNumber ?? ""}`.trim(),
      agreedPrice: f.agreedPrice,
      agreedCurrencyCode: f.agreedCurrencyCode,
      status: f.status,
    })),
    ...transportBookings.map((t) => ({
      bookingId: t.bookingId,
      label: TRANSPORT_MODE_LABELS[t.mode] ?? t.mode,
      agreedPrice: t.agreedPrice,
      agreedCurrencyCode: t.agreedCurrencyCode,
      status: t.status,
    })),
    ...insurances.map((i) => ({ bookingId: i.bookingId, label: i.company, agreedPrice: i.agreedPrice, agreedCurrencyCode: i.agreedCurrencyCode, status: i.status })),
    ...activityReservations.map((a) => ({ bookingId: a.bookingId, label: a.venueName, agreedPrice: a.agreedPrice, agreedCurrencyCode: a.agreedCurrencyCode, status: a.status })),
    ...carRentals.map((c) => ({ bookingId: c.bookingId, label: c.companyName, agreedPrice: c.agreedPrice, agreedCurrencyCode: c.agreedCurrencyCode, status: c.status })),
  ].filter((b) => b.agreedPrice !== null && b.agreedPrice > 0 && !UNPAID_CHECK_EXCLUDED_STATUSES.has(b.status));

  const unpaidBookings = unpaidBookingPref
    ? allPricedBookings
        .map((b) => {
          const paid = payments
            .filter((p) => p.bookingId === b.bookingId && p.currencyCode === b.agreedCurrencyCode)
            .reduce((sum, p) => sum + p.amount, 0);
          return { ...b, remaining: b.agreedPrice! - paid };
        })
        .filter((b) => b.remaining > 0)
    : [];

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: "1rem" }}>
      <div>
        <h1 style={{ marginTop: 0, marginBottom: "0.25rem" }}>היום שלי</h1>
        <p style={{ color: "var(--color-text-muted)" }}>
          {now.toLocaleString("he-IL")} · <Link href={`/trips/${activeTrip.id}`}>{activeTrip.name}</Link>
        </p>
      </div>

      <WorldClockCard
        destination={{
          name: weatherPlace?.city ?? weatherPlace?.name ?? null,
          country: weatherPlace?.country ?? null,
          timezone: currentWeather?.timezone ?? null,
        }}
      />

      <Card title="מזג אוויר">
        {currentWeather ? (
          <div>
            <div style={{ display: "flex", alignItems: "center", gap: "0.5rem" }}>
              <span style={{ fontSize: "1.75rem" }}>{currentWeather.conditionIcon}</span>
              <div>
                <div style={{ fontWeight: 600, fontSize: "1.25rem" }}>
                  <Temperature celsius={currentWeather.temperatureC} />
                  {currentWeather.feelsLikeC !== null && currentWeather.feelsLikeC !== currentWeather.temperatureC
                    ? (
                      <>
                        {" (מרגיש כמו "}
                        <Temperature celsius={currentWeather.feelsLikeC} />
                        {")"}
                      </>
                    )
                    : ""}
                </div>
                <div style={mutedStyle}>
                  {currentWeather.condition}
                  {weatherPlace ? ` · ${weatherPlace.name}` : ""}
                  {currentWeather.humidityPercent !== null ? ` · לחות ${currentWeather.humidityPercent}%` : ""}
                </div>
              </div>
            </div>
            {weatherAlerts.length > 0 ? (
              <ul style={{ listStyle: "none", padding: 0, marginTop: "0.5rem", display: "flex", flexDirection: "column", gap: "0.25rem" }}>
                {weatherAlerts.slice(0, 4).map((alert, index) => (
                  <li
                    key={`${alert.title}-${index}`}
                    style={{
                      fontSize: "0.8125rem",
                      padding: "0.375rem 0.5rem",
                      borderRadius: "var(--radius-md)",
                      background: alert.severity === "warning" ? "rgba(239,68,68,0.12)" : "rgba(59,130,246,0.12)",
                      color: alert.severity === "warning" ? "var(--color-danger)" : "var(--color-primary)",
                    }}
                  >
                    ⚠️ {alert.title} — {alert.detail}
                  </li>
                ))}
              </ul>
            ) : null}
            {rainDuringActivityAlerts.length > 0 ? (
              <ul style={{ listStyle: "none", padding: 0, marginTop: "0.5rem", display: "flex", flexDirection: "column", gap: "0.25rem" }}>
                {rainDuringActivityAlerts.map((alert) => (
                  <li
                    key={alert.activityId}
                    style={{
                      fontSize: "0.8125rem",
                      padding: "0.375rem 0.5rem",
                      borderRadius: "var(--radius-md)",
                      background: "rgba(239,68,68,0.12)",
                      color: "var(--color-danger)",
                    }}
                  >
                    ☔ {alert.precipitationProbabilityPercent}% סיכוי לגשם בזמן &quot;{alert.activityName}&quot; (
                    {new Date(alert.plannedAt).toLocaleTimeString("he-IL", { hour: "2-digit", minute: "2-digit" })})
                  </li>
                ))}
              </ul>
            ) : null}
            {nextDestinationWeather ? (
              <div style={{ marginTop: "0.75rem", padding: "0.5rem", borderRadius: "var(--radius-md)", background: "var(--color-surface-elevated)" }}>
                <div style={mutedStyle}>
                  מזג אוויר ביעד הבא — {upcomingHotel?.hotelName} ({upcomingHotel?.checkInDate})
                </div>
                <div>
                  {nextDestinationWeather.conditionIcon} {nextDestinationWeather.condition} ·{" "}
                  {nextDestinationWeather.maxTemperatureC !== null ? `${Math.round(nextDestinationWeather.maxTemperatureC)}°` : "—"} /{" "}
                  {nextDestinationWeather.minTemperatureC !== null ? `${Math.round(nextDestinationWeather.minTemperatureC)}°` : "—"}
                </div>
              </div>
            ) : null}
            {weatherAdvice.length > 0 ? (
              <ul style={{ listStyle: "none", padding: 0, marginTop: "0.5rem", display: "flex", flexDirection: "column", gap: "0.25rem" }}>
                {weatherAdvice.map((tip) => (
                  <li key={tip} style={{ fontSize: "0.8125rem" }}>
                    {tip}
                  </li>
                ))}
              </ul>
            ) : null}
            {rainWindows.length > 0 ? (
              <ul style={{ listStyle: "none", padding: 0, marginTop: "0.5rem", display: "flex", flexDirection: "column", gap: "0.25rem" }}>
                {rainWindows.map((window) => (
                  <li key={window.startAt} style={{ fontSize: "0.8125rem", color: "var(--color-danger)" }}>
                    ☔ צפוי גשם {formatTimeWithIsraelReference(window.startAt, currentWeather.timezone)}–
                    {new Date(window.endAt).toLocaleTimeString("he-IL", { hour: "2-digit", minute: "2-digit" })} (עד {window.maxProbabilityPercent}%)
                  </li>
                ))}
              </ul>
            ) : null}
            {hourlyWeather.length > 0 ? (
              <div style={{ marginTop: "0.75rem" }}>
                <div style={{ ...mutedStyle, marginBottom: "0.375rem" }}>תחזית שעתית</div>
                <div style={{ display: "flex", gap: "0.75rem", overflowX: "auto" }}>
                  {hourlyWeather.map((hour) => (
                    <div key={hour.forecastAt} style={{ textAlign: "center", minWidth: "3rem", flexShrink: 0 }}>
                      <div style={mutedStyle}>{new Date(hour.forecastAt).toLocaleTimeString("he-IL", { hour: "2-digit" })}</div>
                      <div style={{ fontSize: "1.25rem" }}>{hour.conditionIcon}</div>
                      <div style={{ fontSize: "0.8125rem" }}>{hour.temperatureC !== null ? `${Math.round(hour.temperatureC)}°` : "—"}</div>
                    </div>
                  ))}
                </div>
              </div>
            ) : null}
            {dailyWeather.length > 0 ? (
              <div style={{ marginTop: "0.75rem" }}>
                <div style={{ ...mutedStyle, marginBottom: "0.375rem" }}>תחזית יומית</div>
                <ul style={{ listStyle: "none", padding: 0, margin: 0, display: "flex", flexDirection: "column", gap: "0.25rem" }}>
                  {dailyWeather.map((day) => (
                    <li key={day.forecastAt} style={{ display: "flex", justifyContent: "space-between", fontSize: "0.8125rem" }}>
                      <span>{new Date(day.forecastAt).toLocaleDateString("he-IL", { weekday: "short", day: "numeric", month: "numeric" })}</span>
                      <span>
                        {day.conditionIcon} {day.condition}
                      </span>
                      <span style={mutedStyle}>
                        {day.maxTemperatureC !== null ? `${Math.round(day.maxTemperatureC)}°` : "—"} /{" "}
                        {day.minTemperatureC !== null ? `${Math.round(day.minTemperatureC)}°` : "—"}
                      </span>
                    </li>
                  ))}
                </ul>
              </div>
            ) : null}
            <p style={{ ...mutedStyle, marginTop: "0.5rem" }}>מקור: Open-Meteo (open-meteo.com)</p>
          </div>
        ) : weatherError ? (
          <p style={mutedStyle}>לא הצלחנו לטעון מזג אוויר כרגע — נסה שוב מאוחר יותר.</p>
        ) : (
          <p style={mutedStyle}>
            אין עדיין מקום עם קואורדינטות מקושר לטיול — לא ניתן להציג מזג אוויר. אפשר להוסיף קואורדינטות למקום דרך{" "}
            <Link href="/places/new">יצירת מקום חדש</Link>.
          </p>
        )}
      </Card>

      <Card title="מזג אוויר במיקום שלי עכשיו">
        <GpsWeatherCard />
      </Card>

      <Card title="איפה אני">
        {tonightHotel ? (
          <div>
            <div style={{ fontWeight: 600 }}>{tonightHotel.hotelName}</div>
            <div style={mutedStyle}>
              {checkingInToday ? "צ'ק-אין היום" : checkingOutToday ? "צ'ק-אאוט היום" : `עד ${tonightHotel.checkOutDate}`}
            </div>
          </div>
        ) : (
          <p style={mutedStyle}>אין מלון רשום להיום.</p>
        )}
      </Card>

      <Card title="האירוע הבא">
        {nextEvent ? (
          <div>
            <div style={{ fontWeight: 600 }}>{nextEvent.title}</div>
            <div style={mutedStyle}>{nextEvent.subtitle}</div>
            <div style={{ ...mutedStyle, marginTop: "0.25rem" }}>
              בעוד {formatTimeRemaining(nextEvent.at.getTime() - now.getTime())} ({formatTimeWithIsraelReference(nextEvent.at.toISOString(), nextEvent.timezone)})
            </div>
          </div>
        ) : (
          <p style={mutedStyle}>אין עוד אירועים מתוזמנים היום.</p>
        )}
      </Card>

      <Card title={`מה עוד היום (${restOfDay.length})`}>
        {restOfDay.map((e, i) => (
          <div key={i} style={{ marginBottom: "0.5rem" }}>
            <div style={{ fontWeight: 600 }}>{e.title}</div>
            <div style={mutedStyle}>
              {e.subtitle} · {formatTimeWithIsraelReference(e.at.toISOString(), e.timezone)}
            </div>
          </div>
        ))}
        {restOfDay.length === 0 ? <p style={mutedStyle}>אין עוד אירועים מתוזמנים היום.</p> : null}
      </Card>

      <Card title={`טיסות היום (${todayFlights.length})`}>
        {todayFlights.map((f) => (
          <div key={f.id} style={{ marginBottom: "0.5rem" }}>
            <div style={{ fontWeight: 600 }}>
              {f.airline} {f.flightNumber ?? ""}
            </div>
            <div style={mutedStyle}>
              {f.departureAirport} → {f.arrivalAirport} · {formatTimeWithIsraelReference(f.departureAt, f.departureTimezone)}
            </div>
          </div>
        ))}
        {todayFlights.length === 0 ? <p style={mutedStyle}>אין טיסות היום.</p> : null}
      </Card>

      <Card title={`תחבורה היום (${todayTransport.length})`}>
        {todayTransport.map((t) => (
          <div key={t.id} style={{ marginBottom: "0.5rem" }}>
            <div style={{ fontWeight: 600 }}>
              {t.pickupText ?? "?"} → {t.dropoffText ?? "?"}
            </div>
            <div style={mutedStyle}>{new Date(t.pickupAt).toLocaleTimeString("he-IL")}</div>
          </div>
        ))}
        {todayTransport.length === 0 ? <p style={mutedStyle}>אין הסעות היום.</p> : null}
      </Card>

      <Card title="הוצאות היום">
        <p style={{ fontWeight: 600, fontSize: "1.25rem", margin: 0 }}>
          {spentToday} {todayExpenses[0]?.currencyCode ?? activeTrip.baseCurrencyCode ?? ""}
        </p>
        <p style={mutedStyle}>{todayExpenses.length} הוצאות נרשמו היום</p>
      </Card>

      {budgetRatio !== null && budgetRatio >= 0.9 ? (
        <Card title="⚠️ תקציב">
          <p style={{ fontWeight: 600, margin: 0, color: budgetRatio >= 1 ? "var(--color-danger)" : "#e0a800" }}>
            {budgetRatio >= 1 ? `חרגת מהתקציב הכולל (${Math.round(budgetRatio * 100)}%)` : `מתקרב לתקציב הכולל (${Math.round(budgetRatio * 100)}%)`}
          </p>
          <p style={mutedStyle}>
            <Link href={`/trips/${activeTrip.id}#budget`}>לפרטים בעמוד הטיול</Link>
          </p>
        </Card>
      ) : null}

      {nightsMissingHotel.length > 0 ? (
        <Card title={`⚠️ ${NOTIFICATION_EVENT_TYPE_LABELS.night_without_hotel}`}>
          <p style={{ fontWeight: 600, margin: 0, color: "var(--color-danger)" }}>
            {nightsMissingHotel.length === 1 ? `אין מלון רשום ל-${nightsMissingHotel[0]}` : `אין מלון רשום ל-${nightsMissingHotel.join(", ")}`}
          </p>
          <p style={mutedStyle}>
            <Link href={`/trips/${activeTrip.id}#bookings`}>לפרטים בעמוד הטיול</Link>
          </p>
        </Card>
      ) : null}

      {overdueActivities.length > 0 ? (
        <Card title={`⚠️ ${NOTIFICATION_EVENT_TYPE_LABELS.overdue_not_marked_done}`}>
          {overdueActivities.map((a) => (
            <p key={a.id} style={{ fontWeight: 600, margin: "0 0 0.25rem", color: "#e0a800" }}>
              {a.name}
            </p>
          ))}
          <p style={mutedStyle}>
            <Link href={`/trips/${activeTrip.id}#planning`}>לפרטים בעמוד הטיול</Link>
          </p>
        </Card>
      ) : null}

      {depositsDue.length > 0 ? (
        <Card title={`⚠️ ${NOTIFICATION_EVENT_TYPE_LABELS.deposit_due_return}`}>
          {depositsDue.map((d) => (
            <p key={d.id} style={{ fontWeight: 600, margin: "0 0 0.25rem", color: "#e0a800" }}>
              {d.amount} {d.currencyCode}
              {d.paidTo ? ` · ${d.paidTo}` : ""} · {d.expectedReturnDate}
            </p>
          ))}
          <p style={mutedStyle}>
            <Link href={`/trips/${activeTrip.id}#deposits`}>לפרטים בעמוד הטיול</Link>
          </p>
        </Card>
      ) : null}

      {insurancesEnding.length > 0 ? (
        <Card title={`⚠️ ${NOTIFICATION_EVENT_TYPE_LABELS.insurance_ending}`}>
          {insurancesEnding.map((ins) => (
            <p key={ins.id} style={{ fontWeight: 600, margin: "0 0 0.25rem", color: "#e0a800" }}>
              {ins.company} · מסתיים {ins.endDate}
            </p>
          ))}
          <p style={mutedStyle}>
            <Link href={`/trips/${activeTrip.id}#insurance`}>לפרטים בעמוד הטיול</Link>
          </p>
        </Card>
      ) : null}

      {unpaidBookings.length > 0 ? (
        <Card title={`⚠️ ${NOTIFICATION_EVENT_TYPE_LABELS.unpaid_booking}`}>
          {unpaidBookings.map((b) => (
            <p key={b.bookingId} style={{ fontWeight: 600, margin: "0 0 0.25rem", color: "#e0a800" }}>
              {b.label} · נותר לשלם {Math.round(b.remaining * 100) / 100} {b.agreedCurrencyCode}
            </p>
          ))}
          <p style={mutedStyle}>
            <Link href={`/trips/${activeTrip.id}#bookings`}>לפרטים בעמוד הטיול</Link>
          </p>
        </Card>
      ) : null}

      <Card title="יתרות בארנק">
        {wallets.map((w) => (
          <div key={w.id} style={mutedStyle}>
            {w.currentBalance} {w.currencyCode}
          </div>
        ))}
        {wallets.length === 0 ? <p style={mutedStyle}>אין ארנק לטיול הזה.</p> : null}
      </Card>

      <Card title='מקומות קרובים אליי (עד 30 ק"מ)'>
        <NearbyPlaces candidates={nearbyCandidates} />
      </Card>

      <Card title="גלה מקומות חדשים בקרבתי">
        <DiscoverPlaces tripId={activeTrip.id} />
      </Card>

      <Card title="דרג את המקום שאני נמצא בו עכשיו">
        <RateHereCard tripId={activeTrip.id} />
      </Card>

      <Card title="התראות">
        <NotificationReminders candidates={reminderCandidates} />
      </Card>
    </div>
  );
}

function Card({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div
      style={{
        padding: "1rem",
        border: "1px solid var(--color-border)",
        borderRadius: "10px",
        background: "var(--color-surface)",
      }}
    >
      <h2 style={{ fontSize: "0.875rem", marginTop: 0, color: "var(--color-text-muted)" }}>{title}</h2>
      {children}
    </div>
  );
}

const mutedStyle: React.CSSProperties = { color: "var(--color-text-muted)", fontSize: "0.8125rem", margin: 0 };
