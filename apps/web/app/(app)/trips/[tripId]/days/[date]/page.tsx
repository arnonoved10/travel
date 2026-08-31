import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import { getCurrentUser } from "@/lib/auth/get-current-user";
import {
  getBookingRepository,
  getDocumentRepository,
  getFinanceRepository,
  getPlaceRepository,
  getPlannedActivityRepository,
  getRouteRepository,
  getTripDayRepository,
  getTripPlaceRepository,
  getTripRepository,
  getWeatherProvider,
} from "@travel-app/data-layer";
import { getTripDayDates } from "@/lib/trip-days";
import { getExpenseCategoryLabel } from "@/lib/expense-labels";
import { NavigateButtons } from "@/components/navigate-buttons";
import { formatMoney } from "@/lib/currency-format";
import { Temperature } from "@/components/temperature";
import { Distance } from "@/components/distance";
import { Time } from "@/components/time";
import { RouteStopCreateForm } from "../route-stop-create-form";
import { RouteStopControls } from "../route-stop-controls";
import { OptimizeRouteButton } from "../optimize-route-button";
import { TripDayNotesForm } from "../trip-day-notes-form";
import { EntityPhotoGallery } from "../../documents/entity-photo-gallery";
import { EntityDocumentSection } from "../../documents/entity-document-section";
import { QuickAddPanelContent } from "@/components/quick-add-panel-content";
import { resolveDayHotelContext } from "@/lib/day-hotel-context";
import { haversineDistanceKm } from "@/lib/haversine-distance";
import { computeRainWindows } from "@/lib/rain-window";
import { PLACE_CATEGORY_LABELS } from "@/lib/place-labels";
import { AddSuggestedStopButton } from "../add-suggested-stop-button";
import { DayRouteMap } from "../day-route-map";
import type { NumberedStop } from "../day-route-map-leaflet";
import { detectGaps } from "@/lib/gap-detection";
import { GlassCard } from "@/components/ui/GlassCard";
import { ICON_SIZE, ICON_STROKE_WIDTH } from "@/components/ui/tokens";
import { TriangleAlert } from "lucide-react";
import { Timeline, type TimelineItem } from "@/components/ui/Timeline";
import { formatTimeInZone } from "@/lib/dates";
import { DeleteHotelStayButton, DeleteFlightButton, DeleteTransportBookingButton } from "../../bookings/delete-booking-buttons";
import { DeleteExpenseButton } from "../../finances/delete-expense-button";

export const dynamic = "force-dynamic";

const TRAVEL_MODE_LABELS: Record<string, string> = {
  walk: "הליכה",
  taxi: "מונית",
  public_transport: "תחבורה ציבורית",
  rental_car: "רכב שכור",
  other: "אחר",
};

export default async function TripDayPage({ params }: { params: Promise<{ tripId: string; date: string }> }) {
  const user = await getCurrentUser();
  if (!user) redirect("/login");

  const { tripId, date } = await params;
  const tripRepository = await getTripRepository();
  const trip = await tripRepository.getById({ userId: user.id, tripId });
  if (!trip) notFound();

  const dayDates = getTripDayDates(trip.startDate, trip.endDate);
  const dayIndex = dayDates.indexOf(date);
  if (dayIndex === -1) notFound();

  const [routeRepository, placeRepository, tripPlaceRepository, tripDayRepository] = await Promise.all([
    getRouteRepository(),
    getPlaceRepository(),
    getTripPlaceRepository(),
    getTripDayRepository(),
  ]);
  const [stops, allPlaces, tripPlaces, tripDay] = await Promise.all([
    routeRepository.listForDay({ tripId, date }),
    placeRepository.list({ userId: user.id }),
    tripPlaceRepository.listForTrip({ userId: user.id, tripId }),
    tripDayRepository.getOrCreate({ tripId, date }),
  ]);
  const documentRepository = await getDocumentRepository();
  const tripDayPhotos = await documentRepository.listForEntity({ tripId, entityType: "trip_day", entityId: tripDay.id });

  const placesById = new Map(allPlaces.map((p) => [p.id, p]));
  const linkedPlaces = tripPlaces.map((tp) => tp.place);

  // מספור לפי סדר הביקור בפועל (orderIndex) — אותם מספרים בדיוק כמו ברשימה
  // למטה ("1. מקום א'"), רק על מפה. עצירה בלי place/קואורדינטות פשוט לא
  // מוצגת על המפה (עדיין מופיעה ברשימה הרגילה).
  const numberedStops: NumberedStop[] = stops
    .map((stop, index) => {
      const place = stop.placeId ? placesById.get(stop.placeId) : undefined;
      if (!place || place.lat === null || place.lng === null) return null;
      return { id: stop.id, order: index + 1, name: place.name, lat: place.lat, lng: place.lng };
    })
    .filter((entry): entry is NumberedStop => entry !== null);

  const lastStop = stops.at(-1);
  const lastStopPlace = lastStop?.placeId ? placesById.get(lastStop.placeId) : undefined;
  const previousStopCoords =
    lastStopPlace?.lat !== undefined && lastStopPlace?.lat !== null && lastStopPlace?.lng !== undefined && lastStopPlace?.lng !== null
      ? { lat: lastStopPlace.lat, lng: lastStopPlace.lng }
      : null;

  // Weather Timeline — תחזית שעתית אמיתית ליד כל עצירה עם מקום+שעת הגעה
  // מתוכננת (לא לכל העצירות — רק מי שיש לה גם קואורדינטות וגם שעה). קריאה
  // אחת לכל מקום ייחודי (לא לכל עצירה), נבחרת השעה הקרובה ביותר בפועל.
  const uniquePlaceIds = Array.from(
    new Set(stops.filter((s) => s.placeId && s.plannedArrivalAt).map((s) => s.placeId!)),
  ).filter((id) => {
    const place = placesById.get(id);
    return place?.lat !== undefined && place?.lat !== null && place?.lng !== undefined && place?.lng !== null;
  });
  const weatherProvider = getWeatherProvider();
  const hourlyByPlaceId = new Map<string, Awaited<ReturnType<typeof weatherProvider.getHourlyForecast>>>();
  await Promise.all(
    uniquePlaceIds.map(async (placeId) => {
      const place = placesById.get(placeId)!;
      try {
        // 384 שעות = 16 יום — המקסימום הנתמך ב-Open-Meteo החינמי (ר' open-meteo-provider.ts).
        // מאפשר תחזית אמיתית לעצירות במסלול גם ביום 5-10 של טיול ארוך, לא רק ב-48 השעות הראשונות.
        const hourly = await weatherProvider.getHourlyForecast({ lat: place.lat!, lng: place.lng! }, { hours: 384 });
        hourlyByPlaceId.set(placeId, hourly);
      } catch {
        // כשל קריאה בודדת לא מפיל את שאר העמוד — פשוט לא מוצג Weather Timeline לעצירה הזו.
      }
    }),
  );
  const MAX_FORECAST_MATCH_GAP_MS = 90 * 60 * 1000; // 90 דקות — מעבר לזה השעה הקרובה ביותר שקיבלנו כבר לא באמת מייצגת את השעה המתוכננת (למשל יום עתידי מחוץ לטווח התחזית האמין), אז לא מציגים כלום במקום להטעות.
  function forecastForStop(stopPlaceId: string | null, plannedArrivalAt: string | null) {
    if (!stopPlaceId || !plannedArrivalAt) return null;
    const hourly = hourlyByPlaceId.get(stopPlaceId);
    if (!hourly || hourly.length === 0) return null;
    const targetMs = new Date(plannedArrivalAt).getTime();
    const closest = hourly.reduce((best, hour) =>
      Math.abs(new Date(hour.forecastAt).getTime() - targetMs) < Math.abs(new Date(best.forecastAt).getTime() - targetMs) ? hour : best,
    );
    if (Math.abs(new Date(closest.forecastAt).getTime() - targetMs) > MAX_FORECAST_MATCH_GAP_MS) return null;
    return closest;
  }

  const prevDate = dayIndex > 0 ? dayDates[dayIndex - 1] : null;
  const nextDate = dayIndex < dayDates.length - 1 ? dayDates[dayIndex + 1] : null;

  // סיכום היום — מרכז נתונים שכבר קיימים בריפוזיטוריים אחרים (לא ישות שמורה
  // נפרדת), כדי לענות על "מה קרה ביום הזה" במקום אחד: לילה איפה, טיסות/
  // הסעות, הוצאות, תכנון. ראה IMPLEMENTATION_GAPS.md #1 (Day Summary).
  const [bookingRepository, financeRepository, plannedActivityRepository] = await Promise.all([
    getBookingRepository(),
    getFinanceRepository(),
    getPlannedActivityRepository(),
  ]);
  const [hotelStays, flights, transportBookings, insurances, expenses, plannedActivities, dayPayments] = await Promise.all([
    bookingRepository.listHotelStays({ tripId }),
    bookingRepository.listFlights({ tripId }),
    bookingRepository.listTransportBookings({ tripId }),
    bookingRepository.listInsurances({ tripId }),
    financeRepository.listExpenses({ tripId }),
    plannedActivityRepository.listForTrip({ tripId }),
    financeRepository.listPaymentsByTrip({ tripId }),
  ]);

  const tonightHotel = hotelStays.find((h) => h.checkInDate <= date && date < h.checkOutDate);
  const dayFlightsForDocs = flights.filter((f) => f.departureAt.slice(0, 10) === date);
  const dayTransportForDocs = transportBookings.filter((t) => t.pickupAt.slice(0, 10) === date);
  const dayExpensesForDocs = expenses.filter((e) => e.expenseAt.slice(0, 10) === date);

  // מסמכים/תמונות למלון+טיסות+הסעות+הוצאות של היום הזה בלבד — כדי שהעלאת-
  // קבלה/כרטיס-טיסה/אישור-הסעה תהיה אפשרית ישירות מהיום, בלי לצאת לעמוד-הטיול
  // הראשי (בקשת משתמש: "אם יש לי קבלה או צורך במסמך... יהיה אפשר להעלות").
  const [tonightHotelDocs, dayFlightDocsById, dayTransportDocsById, dayExpenseDocsById] = await Promise.all([
    tonightHotel ? documentRepository.listForEntity({ tripId, entityType: "hotel_stay", entityId: tonightHotel.id }) : Promise.resolve([]),
    Promise.all(
      dayFlightsForDocs.map(async (f) => [f.id, await documentRepository.listForEntity({ tripId, entityType: "flight", entityId: f.id })] as const),
    ),
    Promise.all(
      dayTransportForDocs.map(async (t) => [t.id, await documentRepository.listForEntity({ tripId, entityType: "transport_booking", entityId: t.id })] as const),
    ),
    Promise.all(
      dayExpensesForDocs.map(async (e) => [e.id, await documentRepository.listForEntity({ tripId, entityType: "expense", entityId: e.id })] as const),
    ),
  ]);
  const dayFlightDocsMap = new Map(dayFlightDocsById);
  const dayTransportDocsMap = new Map(dayTransportDocsById);
  const dayExpenseDocsMap = new Map(dayExpenseDocsById);

  // דגלי-חוסרים ליום הזה בלבד — אותו detectGaps חוצה-הטיול הקיים (dashboard/עמוד-טיול),
  // מסונן ל-Gap-ים שסומנו עם date === היום הנוכחי (ר' gap-detection.ts).
  const dayGaps = detectGaps({
    now: new Date(),
    dayDates,
    hotelStays,
    flights,
    transportBookings,
    insurances,
    plannedActivities,
    trip: {
      endDate: trip.endDate,
      passportExpiryDate: trip.passportExpiryDate,
      internationalDrivingPermitExpiryDate: trip.internationalDrivingPermitExpiryDate,
      israeliDrivingLicenseExpiryDate: trip.israeliDrivingLicenseExpiryDate,
      visaRequirementsChecked: trip.visaRequirementsChecked,
    },
  }).filter(
    (gap) => gap.date === date,
  );

  // "מה שווה לעשות היום" — מציע יעדים מרשימת "מעוניין בהם" (want_to_go)
  // שקרובים למלון של היום הזה (בוקר/לילה — מה שיש קואורדינטות לו) ועדיין
  // לא נמצאים במסלול היום. בלי מלון עם קואורדינטות — פשוט אין הצעות
  // (לא ממציאים נקודת ייחוס).
  const { morningHotel: dayMorningHotel, nightHotel: dayNightHotel } = resolveDayHotelContext(hotelStays, date);
  const dayReferenceHotel = [dayMorningHotel, dayNightHotel].find((h) => h !== null && h.lat !== null && h.lng !== null) ?? null;
  const stopPlaceIds = new Set(stops.map((s) => s.placeId).filter((id): id is string => id !== null));
  const daySuggestions = dayReferenceHotel
    ? tripPlaces
        .filter((tp) => tp.status === "want_to_go" && tp.place.lat !== null && tp.place.lng !== null && !stopPlaceIds.has(tp.placeId))
        .map((tp) => ({
          place: tp.place,
          distanceKm: haversineDistanceKm(dayReferenceHotel.lat!, dayReferenceHotel.lng!, tp.place.lat!, tp.place.lng!),
        }))
        .sort((a, b) => a.distanceKm - b.distanceKm)
        .slice(0, 5)
    : [];

  // אם צפוי גשם ביום הזה (לפי אותה נקודת-ייחוס של ההצעות עצמן) — מעדיפים
  // הצעות "פנים" לפני "חוץ", בלי לזרוק אף הצעה. computeRainWindows הקיים
  // (lib/rain-window.ts), לא משוכפל.
  const INDOOR_SUGGESTION_CATEGORIES = new Set(["restaurant", "mall", "market", "attraction", "cafe", "bar", "entertainment"]);
  const OUTDOOR_SUGGESTION_CATEGORIES = new Set(["viewpoint", "beach", "nature", "river", "waterfall"]);
  let dayRainWindows: ReturnType<typeof computeRainWindows> = [];
  if (dayReferenceHotel) {
    try {
      const hotelHourly = await weatherProvider.getHourlyForecast({ lat: dayReferenceHotel.lat!, lng: dayReferenceHotel.lng! }, { hours: 384 });
      dayRainWindows = computeRainWindows(hotelHourly.filter((h) => h.forecastAt.slice(0, 10) === date));
    } catch {
      // כשל בדיקת-גשם לא מפיל את שאר העמוד — ההצעות פשוט לא מוטות לפי מזג-אוויר.
    }
  }
  const isRainyDay = dayRainWindows.length > 0;
  const sortedDaySuggestions = isRainyDay
    ? [...daySuggestions].sort((a, b) => {
        const aIndoorRank = INDOOR_SUGGESTION_CATEGORIES.has(a.place.category) ? 0 : 1;
        const bIndoorRank = INDOOR_SUGGESTION_CATEGORIES.has(b.place.category) ? 0 : 1;
        return aIndoorRank !== bIndoorRank ? aIndoorRank - bIndoorRank : a.distanceKm - b.distanceKm;
      })
    : daySuggestions;

  const dayFlights = flights.filter((f) => f.departureAt.slice(0, 10) === date);
  const dayTransport = transportBookings.filter((t) => t.pickupAt.slice(0, 10) === date);
  const dayExpenses = expenses.filter((e) => e.expenseAt.slice(0, 10) === date);
  const dayPlannedActivities = plannedActivities.filter((a) => a.plannedAt?.slice(0, 10) === date);
  const dayExpensesByCurrency = new Map<string, number>();
  for (const e of dayExpenses) {
    dayExpensesByCurrency.set(e.currencyCode, (dayExpensesByCurrency.get(e.currencyCode) ?? 0) + e.amount);
  }

  // פילוח מזומן/כרטיס — לפי תאריך התשלום בפועל (לא תאריך ההוצאה, שיכול
  // להיות שונה אם שולם מאוחר יותר), מקובץ למטבע כי לא תמיד אותו מטבע.
  // "כרטיס" כולל גם אשראי וגם חיוב — שניהם "לא מזומן" מבחינת תזרים בפועל.
  const dayPaymentsForDate = dayPayments.filter((p) => p.paymentAt.slice(0, 10) === date);
  const cashByCurrency = new Map<string, number>();
  const cardByCurrency = new Map<string, number>();
  const otherPaymentByCurrency = new Map<string, number>();
  for (const p of dayPaymentsForDate) {
    const isCard = p.paymentMethod === "credit_card" || p.paymentMethod === "debit_card";
    const target = p.paymentMethod === "cash" ? cashByCurrency : isCard ? cardByCurrency : otherPaymentByCurrency;
    target.set(p.currencyCode, (target.get(p.currencyCode) ?? 0) + p.amount);
  }

  const dayMassages = dayExpenses.filter((e) => e.category === "massage");
  const dayTips = dayExpenses.filter((e) => e.category === "tip");
  const dayTipsTotalByCurrency = new Map<string, number>();
  for (const e of dayTips) {
    dayTipsTotalByCurrency.set(e.currencyCode, (dayTipsTotalByCurrency.get(e.currencyCode) ?? 0) + e.amount);
  }

  // ציר-הזמן של היום — כל מה שקיים ליום הזה במקום אחד, לפי סדר-כרונולוגי,
  // עם מחיקה ישירה לכל פריט (בקשת משתמש: "ציר זמן... ללחוץ ולראות מה קיים
  // באותו תאריך... ולמחוק דברים", בהשראת "Today's Plan" בעיצוב המקורי).
  // "הוספה" לא מופיעה כאן — כבר קיימת למטה ב-QuickAddPanelContent, אין צורך
  // לשכפל אותה. "עריכה" מוצמדת דרך אותם טפסים הקיימים בעמוד-הטיול הראשי
  // (אין כאן טפסי-עריכה נפרדים למלון/טיסה — רק להסעה, שכבר יש לה EditTransportBookingForm).
  const dayTimelineItems: TimelineItem[] = [];
  if (tonightHotel) {
    dayTimelineItems.push({
      id: `hotel-${tonightHotel.id}`,
      time: "לילה",
      title: tonightHotel.hotelName,
      detail: `עד ${tonightHotel.checkOutDate}`,
      dotColor: "var(--color-accent-purple)",
      action: <DeleteHotelStayButton tripId={tripId} hotelStayId={tonightHotel.id} />,
    });
  }
  for (const f of dayFlights) {
    dayTimelineItems.push({
      id: `flight-${f.id}`,
      time: formatTimeInZone(f.departureAt, f.departureTimezone),
      title: `${f.airline} ${f.flightNumber ?? ""}`.trim(),
      detail: `${f.departureAirport} → ${f.arrivalAirport}`,
      dotColor: "var(--color-accent-blue)",
      action: <DeleteFlightButton tripId={tripId} flightId={f.id} />,
    });
  }
  for (const t of dayTransport) {
    dayTimelineItems.push({
      id: `transport-${t.id}`,
      time: formatTimeInZone(t.pickupAt, t.pickupTimezone),
      title: t.pickupText ?? "הסעה",
      detail: t.dropoffText ?? undefined,
      dotColor: "var(--color-warning)",
      action: <DeleteTransportBookingButton tripId={tripId} transportBookingId={t.id} />,
    });
  }
  for (const e of dayExpenses) {
    dayTimelineItems.push({
      id: `expense-${e.id}`,
      time: new Date(e.expenseAt).toLocaleTimeString("he-IL", { hour: "2-digit", minute: "2-digit" }),
      title: getExpenseCategoryLabel(e.category),
      detail: `${formatMoney(e.amount, e.currencyCode)}${e.description ? ` · ${e.description}` : ""}`,
      dotColor: "var(--color-success)",
      action: <DeleteExpenseButton tripId={tripId} expenseId={e.id} />,
    });
  }
  dayTimelineItems.sort((a, b) => (a.time === "לילה" ? -1 : b.time === "לילה" ? 1 : a.time.localeCompare(b.time)));

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: "1rem" }}>
      <div>
        <p style={{ color: "var(--color-text-muted)", marginBottom: "0.25rem" }}>
          <Link href={`/trips/${tripId}`}>{trip.name}</Link>
        </p>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
          <h1 style={{ margin: 0 }}>
            יום {dayIndex + 1} — {date}
          </h1>
          <div style={{ display: "flex", gap: "0.5rem" }}>
            {prevDate ? <Link href={`/trips/${tripId}/days/${prevDate}`}>← יום קודם</Link> : null}
            {nextDate ? <Link href={`/trips/${tripId}/days/${nextDate}`}>יום הבא →</Link> : null}
          </div>
        </div>
      </div>

      <section>
        <h2 style={{ fontSize: "1rem" }}>הערות ליום</h2>
        <TripDayNotesForm tripId={tripId} date={date} notes={tripDay.notes} />
      </section>

      <section>
        <h2 style={{ fontSize: "1rem" }}>תמונות מהיום ({tripDayPhotos.length})</h2>
        <EntityPhotoGallery
          tripId={tripId}
          entityType="trip_day"
          entityId={tripDay.id}
          documents={tripDayPhotos}
          emptyLabel="עוד לא הועלו תמונות ליום הזה."
        />
      </section>

      {dayGaps.length > 0 ? (
        <GlassCard
          variant="secondary"
          style={{
            borderColor: "color-mix(in srgb, var(--color-warning) 35%, var(--color-border))",
            background: "color-mix(in srgb, var(--color-warning) 8%, var(--color-surface))",
          }}
        >
          <h2 style={{ font: "var(--text-card-title)", margin: 0, color: "var(--color-warning)", display: "flex", alignItems: "center", gap: "0.5rem" }}>
            <TriangleAlert size={ICON_SIZE.md} strokeWidth={ICON_STROKE_WIDTH} aria-hidden />
            דורש תשומת לב היום ({dayGaps.length})
          </h2>
          <ul style={{ listStyle: "none", padding: 0, marginTop: "var(--space-2)", marginBottom: 0, display: "flex", flexDirection: "column", gap: "0.375rem" }}>
            {dayGaps.map((gap) => (
              <li key={gap.id} style={{ font: "var(--text-caption)" }}>
                <span style={{ fontWeight: 600, color: "var(--color-text-secondary)" }}>{gap.title}</span>
                {" — "}
                {gap.detail}
              </li>
            ))}
          </ul>
        </GlassCard>
      ) : null}

      <section>
        <h2 style={{ fontSize: "1rem" }}>ציר הזמן של היום</h2>
        {dayTimelineItems.length === 0 ? (
          <p style={{ color: "var(--color-text-muted)", fontSize: "0.875rem", margin: 0 }}>עוד אין כלום רשום ליום הזה — תוכל להוסיף למטה.</p>
        ) : (
          <Timeline items={dayTimelineItems} />
        )}
      </section>

      <section>
        <h2 style={{ fontSize: "1rem" }}>סיכום היום</h2>
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(200px, 1fr))", gap: "0.75rem" }}>
          <div style={{ padding: "0.75rem", border: "1px solid var(--color-border)", borderRadius: "10px", background: "var(--color-surface)" }}>
            <div style={{ fontSize: "0.75rem", color: "var(--color-text-muted)" }}>הוצאות היום ({dayExpenses.length})</div>
            <div style={{ fontWeight: 600 }}>
              {dayExpensesByCurrency.size === 0
                ? "אין"
                : Array.from(dayExpensesByCurrency.entries())
                    .map(([code, amount]) => formatMoney(amount, code))
                    .join(" · ")}
            </div>
          </div>
          <div style={{ padding: "0.75rem", border: "1px solid var(--color-border)", borderRadius: "10px", background: "var(--color-surface)" }}>
            <div style={{ fontSize: "0.75rem", color: "var(--color-text-muted)" }}>תכנון ליום הזה ({dayPlannedActivities.length})</div>
            <div style={{ fontWeight: 600 }}>
              {dayPlannedActivities.length === 0 ? "אין" : dayPlannedActivities.map((a) => a.name).join(", ")}
            </div>
          </div>
          <div style={{ padding: "0.75rem", border: "1px solid var(--color-border)", borderRadius: "10px", background: "var(--color-surface)" }}>
            <div style={{ fontSize: "0.75rem", color: "var(--color-text-muted)" }}>מזומן / כרטיס היום</div>
            <div style={{ fontWeight: 600, fontSize: "0.875rem" }}>
              {cashByCurrency.size === 0 && cardByCurrency.size === 0 && otherPaymentByCurrency.size === 0 ? (
                "אין תשלומים"
              ) : (
                <>
                  <div>מזומן: {cashByCurrency.size === 0 ? "—" : Array.from(cashByCurrency.entries()).map(([c, a]) => formatMoney(a, c)).join(" · ")}</div>
                  <div>כרטיס: {cardByCurrency.size === 0 ? "—" : Array.from(cardByCurrency.entries()).map(([c, a]) => formatMoney(a, c)).join(" · ")}</div>
                  {otherPaymentByCurrency.size > 0 ? (
                    <div>אחר: {Array.from(otherPaymentByCurrency.entries()).map(([c, a]) => formatMoney(a, c)).join(" · ")}</div>
                  ) : null}
                </>
              )}
            </div>
          </div>
          <div style={{ padding: "0.75rem", border: "1px solid var(--color-border)", borderRadius: "10px", background: "var(--color-surface)" }}>
            <div style={{ fontSize: "0.75rem", color: "var(--color-text-muted)" }}>עיסויים וטיפים היום</div>
            <div style={{ fontWeight: 600, fontSize: "0.875rem" }}>
              <div>עיסויים: {dayMassages.length}</div>
              <div>
                טיפים: {dayTips.length}
                {dayTipsTotalByCurrency.size > 0
                  ? ` (${Array.from(dayTipsTotalByCurrency.entries()).map(([c, a]) => formatMoney(a, c)).join(" · ")})`
                  : ""}
              </div>
            </div>
          </div>
        </div>
      </section>

      {tonightHotel || dayFlightsForDocs.length > 0 || dayTransportForDocs.length > 0 || dayExpensesForDocs.length > 0 ? (
        <section>
          <h2 style={{ fontSize: "1rem" }}>מסמכים וקבלות של היום</h2>
          <div style={{ display: "flex", flexDirection: "column", gap: "0.75rem" }}>
            {tonightHotel ? (
              <div style={{ padding: "0.75rem", border: "1px solid var(--color-border)", borderRadius: "10px", background: "var(--color-surface)" }}>
                <div style={{ fontWeight: 600, marginBottom: "0.375rem" }}>🏨 {tonightHotel.hotelName}</div>
                <EntityDocumentSection tripId={tripId} entityType="hotel_stay" entityId={tonightHotel.id} documents={tonightHotelDocs} />
              </div>
            ) : null}
            {dayFlightsForDocs.map((f) => (
              <div key={f.id} style={{ padding: "0.75rem", border: "1px solid var(--color-border)", borderRadius: "10px", background: "var(--color-surface)" }}>
                <div style={{ fontWeight: 600, marginBottom: "0.375rem" }}>
                  ✈️ {f.airline} {f.departureAirport}→{f.arrivalAirport}
                </div>
                <EntityDocumentSection tripId={tripId} entityType="flight" entityId={f.id} documents={dayFlightDocsMap.get(f.id) ?? []} />
              </div>
            ))}
            {dayTransportForDocs.map((t) => (
              <div key={t.id} style={{ padding: "0.75rem", border: "1px solid var(--color-border)", borderRadius: "10px", background: "var(--color-surface)" }}>
                <div style={{ fontWeight: 600, marginBottom: "0.375rem" }}>
                  🚕 {t.pickupText ?? "?"} → {t.dropoffText ?? "?"}
                </div>
                <EntityDocumentSection tripId={tripId} entityType="transport_booking" entityId={t.id} documents={dayTransportDocsMap.get(t.id) ?? []} />
              </div>
            ))}
            {dayExpensesForDocs.map((e) => (
              <div key={e.id} style={{ padding: "0.75rem", border: "1px solid var(--color-border)", borderRadius: "10px", background: "var(--color-surface)" }}>
                <div style={{ fontWeight: 600, marginBottom: "0.375rem" }}>
                  🧾 {getExpenseCategoryLabel(e.category)} — {formatMoney(e.amount, e.currencyCode)}
                  {e.description ? ` (${e.description})` : ""}
                </div>
                <EntityDocumentSection tripId={tripId} entityType="expense" entityId={e.id} documents={dayExpenseDocsMap.get(e.id) ?? []} />
              </div>
            ))}
          </div>
        </section>
      ) : null}

      <section>
        <h2 style={{ fontSize: "1rem" }}>➕ הוסף משהו ליום הזה</h2>
        <p style={{ color: "var(--color-text-muted)", fontSize: "0.8125rem", marginTop: "-0.5rem" }}>
          מלון, טיסה, הסעה, הוצאה (מסעדה/עיסוי/טיפ) או מקום — אותו טופס-הוספה-מהירה שיש גם בדשבורד, כבר מוגדר ליום הזה.
        </p>
        <QuickAddPanelContent activeTripId={tripId} initialDate={date} />
      </section>

      {sortedDaySuggestions.length > 0 ? (
        <section>
          <h2 style={{ fontSize: "1rem" }}>💡 מה שווה לעשות היום</h2>
          <p style={{ color: "var(--color-text-muted)", fontSize: "0.8125rem", marginTop: "-0.5rem" }}>
            מהרשימה שלך של מקומות שמעניינים אותך, קרובים ל{dayReferenceHotel?.hotelName ?? "המלון של היום"}
            {isRainyDay ? " · ☔ צפוי גשם היום — הצעות פנים מקדימות" : ""}
          </p>
          <ul style={{ listStyle: "none", padding: 0, display: "flex", flexDirection: "column", gap: "0.5rem" }}>
            {sortedDaySuggestions.map(({ place, distanceKm }) => (
              <li
                key={place.id}
                style={{
                  display: "flex",
                  justifyContent: "space-between",
                  alignItems: "center",
                  gap: "0.5rem",
                  padding: "0.625rem 0.75rem",
                  border: "1px solid var(--color-border)",
                  borderRadius: "10px",
                  background: "var(--color-surface)",
                }}
              >
                <div>
                  <div style={{ fontWeight: 600 }}>{place.name}</div>
                  <div style={{ color: "var(--color-text-muted)", fontSize: "0.8125rem" }}>
                    {PLACE_CATEGORY_LABELS[place.category]} · <Distance km={distanceKm} />
                    {isRainyDay && OUTDOOR_SUGGESTION_CATEGORIES.has(place.category) ? " · ☔" : ""}
                  </div>
                </div>
                <AddSuggestedStopButton tripId={tripId} date={date} placeId={place.id} />
              </li>
            ))}
          </ul>
        </section>
      ) : null}

      <section>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", flexWrap: "wrap", gap: "0.5rem", marginBottom: "0.5rem" }}>
          <h2 style={{ fontSize: "1rem", margin: 0 }}>מסלול היום ({stops.length})</h2>
          {stops.length >= 2 ? <OptimizeRouteButton tripId={tripId} date={date} /> : null}
        </div>
        <div style={{ marginBottom: "0.75rem" }}>
          <DayRouteMap stops={numberedStops} />
        </div>
        <ul style={{ listStyle: "none", padding: 0, display: "flex", flexDirection: "column", gap: "0.5rem" }}>
          {stops.map((stop, index) => {
            const place = stop.placeId ? placesById.get(stop.placeId) : undefined;
            const stopForecast = forecastForStop(stop.placeId, stop.plannedArrivalAt);
            return (
              <li
                key={stop.id}
                style={{
                  display: "flex",
                  justifyContent: "space-between",
                  alignItems: "center",
                  flexWrap: "wrap",
                  gap: "0.5rem",
                  padding: "0.75rem",
                  border: "1px solid var(--color-border)",
                  borderRadius: "10px",
                  background: "var(--color-surface)",
                }}
              >
                <div>
                  <div style={{ fontWeight: 600 }}>
                    {index + 1}. {place?.name ?? "מקום לא ידוע"}
                  </div>
                  <div style={{ color: "var(--color-text-muted)", fontSize: "0.8125rem" }}>
                    {stop.plannedArrivalAt ? (
                      <>
                        הגעה <Time iso={stop.plannedArrivalAt} />
                      </>
                    ) : null}
                    {stop.plannedDepartureAt ? (
                      <>
                        {" · יציאה "}
                        <Time iso={stop.plannedDepartureAt} />
                      </>
                    ) : null}
                    {stop.travelMode ? ` · ${TRAVEL_MODE_LABELS[stop.travelMode] ?? stop.travelMode}` : ""}
                    {stop.distanceKm ? (
                      <>
                        {" · "}
                        <Distance km={stop.distanceKm} />
                      </>
                    ) : null}
                    {stop.travelTimeMinutes ? ` · ${stop.travelTimeMinutes} דק' נסיעה` : ""}
                  </div>
                </div>
                <div style={{ display: "flex", gap: "0.5rem", alignItems: "center" }}>
                  {stopForecast ? (
                    <span style={{ fontSize: "0.8125rem", color: "var(--color-text-muted)", whiteSpace: "nowrap" }} title="תחזית לשעת ההגעה המתוכננת">
                      {stopForecast.conditionIcon}{" "}
                      {stopForecast.temperatureC !== null ? <Temperature celsius={stopForecast.temperatureC} /> : ""}
                      {stopForecast.precipitationProbabilityPercent !== null && stopForecast.precipitationProbabilityPercent >= 30
                        ? ` · ☔${stopForecast.precipitationProbabilityPercent}%`
                        : ""}
                    </span>
                  ) : null}
                  {place ? <NavigateButtons lat={place.lat} lng={place.lng} address={place.address} /> : null}
                  <RouteStopControls
                    tripId={tripId}
                    date={date}
                    routeStopId={stop.id}
                    isFirst={index === 0}
                    isLast={index === stops.length - 1}
                  />
                </div>
              </li>
            );
          })}
          {stops.length === 0 ? <p style={{ color: "var(--color-text-muted)" }}>עוד לא נבנה מסלול ליום הזה.</p> : null}
        </ul>

        {linkedPlaces.length > 0 ? (
          <RouteStopCreateForm tripId={tripId} date={date} places={linkedPlaces} previousStopCoords={previousStopCoords} />
        ) : (
          <p style={{ color: "var(--color-text-muted)", fontSize: "0.875rem" }}>
            כדי להוסיף עצירה למסלול, יש קודם לקשר מקומות לטיול (במסך הטיול, סעיף &quot;מקומות בטיול&quot;).
          </p>
        )}
      </section>
    </div>
  );
}
