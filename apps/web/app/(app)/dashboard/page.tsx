import Link from "next/link";
import { redirect } from "next/navigation";
import { Wallet, Receipt, CalendarBlank, Gift } from "@phosphor-icons/react/ssr";
import { getCurrentUser } from "@/lib/auth/get-current-user";
import {
  getBookingRepository,
  getContactRepository,
  getDocumentRepository,
  getFinanceRepository,
  getPlaceRepository,
  getPlannedActivityRepository,
  getTripGeographyRepository,
  getTripPlaceRepository,
  getTripRepository,
  getUserRepository,
  getWeatherProvider,
} from "@travel-app/data-layer";
import type { Trip, WeatherForecastSnapshot } from "@travel-app/shared-types";
import { getTripDayDates } from "@/lib/trip-days";
import { safeTimeZone } from "@/lib/dates";
import { detectGaps } from "@/lib/gap-detection";
import { searchAllEntities, type SearchResultCategory } from "@/lib/global-search";
import { StatCard } from "@/components/ui/StatCard";
import { TopBar } from "@/components/ui/TopBar";
import { WorldClockCard } from "@/components/world-clock-card";
import { ExchangeRatesCard } from "@/components/exchange-rates-card";
import { computePreferredCurrencyCodes } from "@/lib/preferred-currencies";
import { TripHeroCard } from "./trip-hero-card";
import { WeatherCard } from "./weather-card";
import { WalletSummaryCard } from "./wallet-summary-card";
import { ExpensesOverviewCard } from "./expenses-overview-card";
import { TodayTimelineCard } from "./today-timeline-card";
import { UpcomingPlansCard } from "./upcoming-plans-card";
import { GapAlertsCard } from "./gap-alerts-card";
import { QuickActionsRow } from "./quick-actions-row";
import { TripInsightsCard } from "./trip-insights-card";
import { MapWidgetCard } from "./map-widget-card";
import { DashboardCard } from "./dashboard-card";
import { TripSwitcher } from "./trip-switcher";
import { TripRouteCard } from "./trip-route-card";
import { DashboardWalletsRow } from "./dashboard-wallets-row";
import { AiAssistantCard } from "./ai-assistant-card";
import { NoHotelNightsList } from "@/components/no-hotel-nights";
import { CalendarX } from "@phosphor-icons/react/ssr";
import { getActiveTrip } from "@/lib/active-trip";
import { resolveWeatherReferencePlace } from "@/lib/weather-reference-place";
import { MobileDashboardView } from "./mobile-dashboard-view";
import styles from "./dashboard-premium.module.css";

export const dynamic = "force-dynamic";

const SEARCH_CATEGORY_LABELS: Record<SearchResultCategory, string> = {
  trip: "טיולים",
  place: "מקומות",
  contact: "אנשי קשר",
  hotel_stay: "מלונות",
  flight: "טיסות",
  transport_booking: "תחבורה",
  expense: "הוצאות",
  document: "מסמכים",
};

function getTodayIsoDate(): string {
  return new Date().toISOString().slice(0, 10);
}

const HOME_TIMEZONE = "Asia/Jerusalem";

/** לפי שעה מקומית ביעד-הטיול (אם ידוע — currentWeather.timezone) אחרת ישראל.
 * לא new Date().getHours() גולמי: זה שעון-השרת (UTC ב-Vercel), לא ישראל
 * ובוודאי לא היעד — ר' תלונת-משתמש "בוקר טוב לפי השעה המקומית בו אני נמצא". */
function getGreeting(timezone?: string | null): string {
  const hour = Number(new Intl.DateTimeFormat("en-US", { hour: "numeric", hour12: false, timeZone: safeTimeZone(timezone ?? HOME_TIMEZONE) }).format(new Date()));
  if (hour < 5) return "לילה טוב";
  if (hour < 12) return "בוקר טוב";
  if (hour < 18) return "צהריים טובים";
  return "ערב טוב";
}

/** תובנות חוצות-טיולים אמיתיות: מקומות שביקרת בהם ("visited" ב-TripPlace) וימי טיול
 * נספרים בפועל על כל טיול; הוצאות מוצגות לפי מטבע בנפרד — בלי המרה מומצאת
 * (אותו עיקרון כמו trips/compare ודוח הטיול הבודד). */
async function computeTripInsights(userId: string, trips: Trip[]) {
  const tripPlaceRepository = await getTripPlaceRepository();
  const financeRepository = await getFinanceRepository();
  const tripIds = trips.map((trip) => trip.id);

  // שאילתה מקובצת אחת לכל אוסף במקום N (אחת לכל טיול) — ר' listForTrips/listExpensesForTrips.
  const [allTripPlaces, allExpenses] = await Promise.all([
    tripPlaceRepository.listForTrips({ userId, tripIds }),
    financeRepository.listExpensesForTrips({ tripIds }),
  ]);

  const visitedPlaceIds = new Set(allTripPlaces.filter((tp) => tp.status === "visited").map((tp) => tp.placeId));
  const daysTraveledCount = trips.reduce((sum, trip) => sum + getTripDayDates(trip.startDate, trip.endDate).length, 0);
  const totalSpentByCurrency = new Map<string, number>();
  for (const e of allExpenses) {
    totalSpentByCurrency.set(e.currencyCode, (totalSpentByCurrency.get(e.currencyCode) ?? 0) + e.amount);
  }

  return { placesVisitedCount: visitedPlaceIds.size, daysTraveledCount, totalSpentByCurrency };
}

export default async function DashboardPage({
  searchParams,
}: {
  searchParams: Promise<{ q?: string; tripId?: string }>;
}) {
  const user = await getCurrentUser();
  if (!user) redirect("/login");

  const displayName = await (await getUserRepository()).getDisplayName({ userId: user.id });
  const { q, tripId: requestedTripId } = await searchParams;
  const today = getTodayIsoDate();
  const tripRepository = await getTripRepository();
  const trips = await tripRepository.list({ userId: user.id });

  if (q && q.trim()) {
    const [placeRepository, contactRepository, bookingRepository, financeRepository, documentRepository] = await Promise.all([
      getPlaceRepository(),
      getContactRepository(),
      getBookingRepository(),
      getFinanceRepository(),
      getDocumentRepository(),
    ]);
    const [places, contacts, perTrip] = await Promise.all([
      placeRepository.list({ userId: user.id }),
      contactRepository.list({ userId: user.id }),
      Promise.all(
        trips.map(async (t) => ({
          hotelStays: await bookingRepository.listHotelStays({ tripId: t.id }),
          flights: await bookingRepository.listFlights({ tripId: t.id }),
          transportBookings: await bookingRepository.listTransportBookings({ tripId: t.id }),
          expenses: await financeRepository.listExpenses({ tripId: t.id }),
          documents: await documentRepository.listForTrip({ tripId: t.id }),
        })),
      ),
    ]);

    const results = searchAllEntities(q, {
      trips,
      places,
      contacts,
      hotelStays: perTrip.flatMap((p) => p.hotelStays),
      flights: perTrip.flatMap((p) => p.flights),
      transportBookings: perTrip.flatMap((p) => p.transportBookings),
      expenses: perTrip.flatMap((p) => p.expenses),
      documents: perTrip.flatMap((p) => p.documents),
    });

    const resultsByCategory = new Map<SearchResultCategory, typeof results>();
    for (const result of results) {
      const list = resultsByCategory.get(result.category) ?? [];
      list.push(result);
      resultsByCategory.set(result.category, list);
    }

    return (
      <div style={{ display: "flex", flexDirection: "column", gap: "var(--space-5)" }}>
        <TopBar titleSlot={<h1 style={{ font: "var(--text-h1)" }}>{getGreeting()} 👋</h1>} searchAction="/dashboard" searchPlaceholder="חפש טיול, מקום, הוצאה..." userLabel={user.email} displayName={displayName} />
        <DashboardCard title={`תוצאות חיפוש עבור "${q}" (${results.length})`}>
          {results.length === 0 ? (
            <p style={{ margin: 0, color: "var(--color-text-muted)", font: "var(--text-caption)" }}>לא נמצאו תוצאות תואמות.</p>
          ) : (
            <div style={{ display: "flex", flexDirection: "column", gap: "var(--space-4)" }}>
              {Array.from(resultsByCategory.entries()).map(([category, items]) => (
                <div key={category}>
                  <div style={{ font: "var(--text-caption)", color: "var(--color-text-muted)", fontWeight: 700, marginBottom: "var(--space-1)" }}>
                    {SEARCH_CATEGORY_LABELS[category]} ({items.length})
                  </div>
                  <ul style={{ listStyle: "none", margin: 0, padding: 0, display: "flex", flexDirection: "column", gap: "var(--space-2)" }}>
                    {items.map((result) => (
                      <li key={`${result.category}-${result.id}`}>
                        <Link href={result.href} style={{ color: "var(--color-primary)", fontWeight: 600 }}>
                          {result.title}
                        </Link>
                        {result.detail ? (
                          <span style={{ color: "var(--color-text-muted)", font: "var(--text-caption)" }}> · {result.detail}</span>
                        ) : null}
                      </li>
                    ))}
                  </ul>
                </div>
              ))}
            </div>
          )}
        </DashboardCard>
        <Link href="/dashboard" style={{ font: "var(--text-caption)", color: "var(--color-primary)", fontWeight: 700 }}>
          ← חזרה לדשבורד
        </Link>
      </div>
    );
  }

  // מתג-טיולים (?tripId=) גובר על הזיהוי האוטומטי — בחירה מפורשת של המשתמש.
  // אחרת: טיול-בעיצומו, ובלעדיו הטיול-הקרוב-ביותר (ר' lib/active-trip.ts —
  // בלי זה, טיול שעוד לא התחיל אף פעם לא נחשב "פעיל" ורוב הדשבורד לא מוצג).
  const requestedTrip = requestedTripId ? trips.find((t) => t.id === requestedTripId) : undefined;
  const resolvedActiveTrip = getActiveTrip(trips, today);
  const activeTrip = requestedTrip ?? resolvedActiveTrip?.trip;
  const isUpcoming = !requestedTrip && (resolvedActiveTrip?.isUpcoming ?? false);
  const insights = await computeTripInsights(user.id, trips);
  const userEmail = user.email;
  const greetingName = displayName ?? userEmail.split("@")[0];
  // timezone אופציונלי: כשקיים (יעד-הטיול, ר' currentWeather.timezone למטה)
  // הברכה "בוקר טוב"/"ערב טוב" לפי השעה המקומית שם, לא לפי ברירת-המחדל.
  function renderTopBar(timezone?: string | null) {
    return (
      <TopBar
        titleSlot={
          <div>
            <h1 style={{ font: "var(--text-h1)" }}>{getGreeting(timezone)}, {greetingName} 👋</h1>
            <p style={{ color: "var(--color-text-muted)", font: "var(--text-caption)" }}>
              {isUpcoming && activeTrip ? `${activeTrip.name} מתחיל ב-${activeTrip.startDate}` : "יש לך מסע מדהים לפניך"}
            </p>
          </div>
        }
        searchAction="/dashboard"
        searchPlaceholder="חפש טיול, מקום, הוצאה..."
        userLabel={userEmail}
        displayName={displayName}
      />
    );
  }

  if (!activeTrip) {
    const upcoming = trips
      .filter((t) => t.startDate > today)
      .sort((a, b) => a.startDate.localeCompare(b.startDate));

    return (
      <div style={{ display: "flex", flexDirection: "column", gap: "var(--space-5)" }}>
        {renderTopBar()}
        <TripSwitcher trips={trips} selectedTripId={undefined} />
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(160px, 1fr))", gap: "var(--space-4)" }}>
          <StatCard label="סה״כ טיולים" value={trips.length} icon={CalendarBlank} />
          <StatCard label="טיולים קרובים" value={upcoming.length} icon={Gift} />
        </div>

        <DashboardCard title="אין טיול פעיל היום">
          {upcoming.length > 0 ? (
            <p style={{ margin: 0, font: "var(--text-body)" }}>
              הטיול הבא שלך: <Link href={`/trips/${upcoming[0]!.id}`} style={{ color: "var(--color-primary)", fontWeight: 600 }}>{upcoming[0]!.name}</Link> — מתחיל
              ב-{upcoming[0]!.startDate}
            </p>
          ) : (
            <p style={{ margin: 0, color: "var(--color-text-muted)", font: "var(--text-body)" }}>
              אין טיולים מתוכננים כרגע. <Link href="/trips/new" style={{ color: "var(--color-primary)" }}>תכנן טיול חדש</Link>.
            </p>
          )}
        </DashboardCard>

        <TripInsightsCard
          tripsCount={trips.length}
          placesVisitedCount={insights.placesVisitedCount}
          daysTraveledCount={insights.daysTraveledCount}
          totalSpentByCurrency={insights.totalSpentByCurrency}
        />

        <QuickActionsRow activeTripId={null} />
      </div>
    );
  }

  const dayDates = getTripDayDates(activeTrip.startDate, activeTrip.endDate);
  const bookingRepository = await getBookingRepository();
  const financeRepository = await getFinanceRepository();
  const plannedActivityRepository = await getPlannedActivityRepository();
  const tripGeographyRepository = await getTripGeographyRepository();
  const tripPlaceRepository = await getTripPlaceRepository();

  // כל השאילתות האלה עצמאיות זו-מזו — Promise.all אחד, לא כמה קבוצות-רצף
  // (כל קבוצה נפרדת היתה מוסיפה round-trip נוסף לשרת-ה-DB המרוחק בלי סיבה).
  const [hotelStays, flights, transportBookings, insurances, carRentals, wallets, expenses, plannedActivities, tripCountries, tripPlaces] =
    await Promise.all([
      bookingRepository.listHotelStays({ tripId: activeTrip.id }),
      bookingRepository.listFlights({ tripId: activeTrip.id }),
      bookingRepository.listTransportBookings({ tripId: activeTrip.id }),
      bookingRepository.listInsurances({ tripId: activeTrip.id }),
      bookingRepository.listCarRentals({ tripId: activeTrip.id }),
      financeRepository.listWallets({ tripId: activeTrip.id }),
      financeRepository.listExpenses({ tripId: activeTrip.id }),
      plannedActivityRepository.listForTrip({ tripId: activeTrip.id }),
      tripGeographyRepository.listCountries({ tripId: activeTrip.id }),
      tripPlaceRepository.listForTrip({ userId: user.id, tripId: activeTrip.id }),
    ]);
  const bookingsCount = hotelStays.length + flights.length + transportBookings.length + insurances.length + carRentals.length;
  const primaryWallet = wallets[0] ?? null;
  const primaryCurrencyExpenseTotal = primaryWallet
    ? expenses.filter((e) => e.currencyCode === primaryWallet.currencyCode).reduce((sum, e) => sum + e.amount, 0)
    : null;

  const gaps = detectGaps({
    now: new Date(),
    dayDates,
    hotelStays,
    flights,
    transportBookings,
    insurances,
    plannedActivities,
    carRentals,
    countryNames: tripCountries.map((c) => c.countryName),
    trip: {
      endDate: activeTrip.endDate,
      passportExpiryDate: activeTrip.passportExpiryDate,
      internationalDrivingPermitExpiryDate: activeTrip.internationalDrivingPermitExpiryDate,
      israeliDrivingLicenseExpiryDate: activeTrip.israeliDrivingLicenseExpiryDate,
      visaRequirementsChecked: activeTrip.visaRequirementsChecked,
    },
  });

  const tonightHotel = hotelStays.find((h) => h.checkInDate <= today && today < h.checkOutDate) ?? null;
  const todayFlights = flights.filter((f) => f.departureAt.slice(0, 10) === today);
  const todayTransport = transportBookings.filter((t) => t.pickupAt.slice(0, 10) === today);

  // מזג אוויר/שעון-עולם/דגל — מקום מקושר לטיול, ובלעדיו נופל למלון-הראשון-
  // בטיול עם קואורדינטות (ר' lib/weather-reference-place.ts) — כדי שהזנת מלון
  // לבד כבר מפעילה את שעון-היעד, בלי לחייב גם קישור-מקום נפרד. אותו עיקרון בדיוק כמו /today.
  const weatherPlace = resolveWeatherReferencePlace(tripPlaces, hotelStays);

  let currentWeather: Omit<WeatherForecastSnapshot, "id" | "retrievedAt"> | null = null;
  let weatherError = false;
  // תחזית ל-5 הימים הבאים (אמיתית, אותו provider) — לרצועת-התחזית הקומפקטית
  // בכרטיס מזג-האוויר, לפי המוקאפ. כשל בשליפתה לא מפיל את הכרטיס כולו —
  // מזג-האוויר-הנוכחי כבר נטען לבד למעלה, זו רק תוספת.
  let dailyForecast: { date: string; minC: number | null; maxC: number | null; icon: string | null }[] = [];
  if (weatherPlace?.lat != null && weatherPlace?.lng != null) {
    try {
      const weatherProvider = getWeatherProvider();
      currentWeather = await weatherProvider.getCurrentConditions({ lat: weatherPlace.lat, lng: weatherPlace.lng });
    } catch {
      weatherError = true;
    }
    try {
      const weatherProvider = getWeatherProvider();
      const daily = await weatherProvider.getDailyForecast({ lat: weatherPlace.lat, lng: weatherPlace.lng }, { days: 5 });
      dailyForecast = daily.map((d) => ({ date: d.forecastAt.slice(0, 10), minC: d.minTemperatureC, maxC: d.maxTemperatureC, icon: d.conditionIcon }));
    } catch {
      // לא קריטי — בלי תחזית ל-5 ימים, הכרטיס פשוט לא מציג את הרצועה (ר' WeatherCard).
    }
  }

  // מזג-אוויר ביעד-הבא — מהמלון-הבא-בתור (checkInDate > היום), אם יש לו
  // קואורדינטות. בלי מלון-עתידי-עם-קואורדינטות פשוט אין מזג-אוויר-ליעד-הבא
  // (לא ממציאים יעד). אותו provider בדיוק כמו מזג-האוויר-הנוכחי, בלי כפילות-קוד.
  const nextHotel = [...hotelStays].filter((h) => h.checkInDate > today).sort((a, b) => a.checkInDate.localeCompare(b.checkInDate))[0] ?? null;
  let nextWeather: Omit<WeatherForecastSnapshot, "id" | "retrievedAt"> | null = null;
  if (nextHotel?.lat != null && nextHotel?.lng != null) {
    try {
      const weatherProvider = getWeatherProvider();
      nextWeather = await weatherProvider.getCurrentConditions({ lat: nextHotel.lat, lng: nextHotel.lng });
    } catch {
      // לא קריטי — אין nextWeather פשוט לא מוצג, כמו weatherError למעלה אבל בלי
      // הודעת-שגיאה נפרדת (זה תוכן "בונוס", לא הכרטיס הראשי).
    }
  }

  // "ימים בלי תוכנית" — יום בלי אף אחד מ: מלון-חופף / טיסה / הסעה / פעילות-
  // מתוכננת. חישוב אמיתי מנתונים שכבר נשלפו למעלה, לא ניחוש. נבדק על כל ימי-
  // הטיול (לא רק העתידיים) — עקבי עם detectGaps שכבר בודק גם ימים שחלפו.
  const daysWithoutPlan = dayDates.filter((d) => {
    const hasHotel = hotelStays.some((h) => h.checkInDate <= d && d < h.checkOutDate);
    const hasFlight = flights.some((f) => f.departureAt.slice(0, 10) === d);
    const hasTransport = transportBookings.some((t) => t.pickupAt.slice(0, 10) === d);
    const hasActivity = plannedActivities.some((a) => a.plannedAt?.slice(0, 10) === d);
    return !hasHotel && !hasFlight && !hasTransport && !hasActivity;
  });

  // במובייל "לילות בלי מלון" ו"ימים בלי תוכנית" מוצגים כרשימה מאוחדת אחת
  // (בקשת משתמש: "ימים ללא מלון או תוכנית") — במחשב הם נשארים נפרדים
  // (GapAlertsCard מול הרשימה העצמאית למטה), כאן רק איחוד+דה-דופ לתאריכים.
  const noHotelNightDates = gaps.filter((g) => g.id.startsWith("no-hotel-")).map((g) => g.date!);
  const combinedPlanGapDates = [...new Set([...noHotelNightDates, ...daysWithoutPlan])].sort();
  const preferredCurrencyCodes = computePreferredCurrencyCodes(tripCountries);

  return (
    <div className={styles.dashboard}>
      <div className={styles.mobileOnly}>
        <MobileDashboardView
          activeTrip={activeTrip}
          greetingName={greetingName}
          greetingText={getGreeting(currentWeather?.timezone)}
          userEmail={userEmail}
          destination={{ name: weatherPlace?.city ?? weatherPlace?.name ?? null, country: weatherPlace?.country ?? null, timezone: currentWeather?.timezone ?? null }}
          today={today}
          dayDates={dayDates}
          hotelStays={hotelStays}
          wallets={wallets}
          preferredCurrencyCodes={preferredCurrencyCodes}
          tonightHotel={tonightHotel}
          todayFlights={todayFlights}
          todayTransport={todayTransport}
          currentWeather={currentWeather}
          weatherError={weatherError}
          dailyForecast={dailyForecast}
          currencyCodes={preferredCurrencyCodes}
          expenses={expenses}
          combinedPlanGapDates={combinedPlanGapDates}
        />
      </div>

      <div className={styles.desktopOnly}>
      {renderTopBar(currentWeather?.timezone)}

      {/* שורת-פתיחה קומפקטית: שני-שעונים (מקומי+ישראל, עם דגלים) + מתג-טיולים —
          לא כרטיסים גדולים, רק סרגל-מידע, כדי שציר-המסלול מיד אחריו יהיה
          הדבר הראשון הגדול והדומיננטי בעמוד (בקשת משתמש: "מפת ציר הטיול אינה
          האזור הגדול והמרכזי" — עכשיו היא). */}
      <div className={styles.introGrid}>
        <WorldClockCard
          destination={{ name: weatherPlace?.city ?? weatherPlace?.name ?? null, country: weatherPlace?.country ?? null, timezone: currentWeather?.timezone ?? null }}
        />
        <TripSwitcher trips={trips} selectedTripId={activeTrip.id} />
      </div>

      {/* ציר-המסלול — הכרטיס הגדול והדומיננטי של העמוד, לפי המוקאפ. היום
          הנוכחי מתוך הטיול, ימים שעברו/נותרו, אחוז-התקדמות, ותחנות-המסלול
          (נגזרות ממלונות אמיתיים, ר' trip-route-card.tsx). */}
      <TripRouteCard trip={activeTrip} hotelStays={hotelStays} today={today} dayDates={dayDates} />

      {/* ארנקים לפי מטבע — מטבע-היעד-המקומי קודם, ואז דולר/אירו/שקל ומטבעות
          נוספים (dashboard-wallets-row.tsx). */}
      <section className={styles.walletSection}>
        <div className={styles.sectionHeading}>
          <div>
            <span className={styles.eyebrow}>הכסף שלי בטיול</span>
            <h2>💰 הארנקים שלי</h2>
          </div>
          <Link href={`/trips/${activeTrip.id}#wallet`} className={styles.sectionLink}>ניהול והמרת מטבעות</Link>
        </div>
        <DashboardWalletsRow trip={activeTrip} wallets={wallets} preferredCurrencyCodes={preferredCurrencyCodes} />
      </section>

      {/* שערי-מטבע · מזג-אוויר-נוכחי · עוזר-AI — שלישיית-האזור השנייה
          בבולטות, לפי המוקאפ (בקשת משתמש: "אזור העוזר החכם אינו תואם" —
          עכשיו יש לו כרטיס אמיתי, לא רק הכפתור הצף). */}
      <div className={`${styles.featureGrid} dashboard-row-3`}>
        <DashboardCard title="שערי מטבע" href={`/trips/${activeTrip.id}#finances`}>
          <ExchangeRatesCard currencyCodes={preferredCurrencyCodes} />
        </DashboardCard>
        <WeatherCard current={currentWeather} placeName={weatherPlace?.name ?? null} error={weatherError} dailyForecast={dailyForecast} />
        <AiAssistantCard />
      </div>

      <QuickActionsRow
        activeTripId={activeTrip.id}
        activeTripName={activeTrip.name}
        navigateTarget={weatherPlace ? { lat: weatherPlace.lat, lng: weatherPlace.lng, address: weatherPlace.address } : undefined}
      />

      {/* Hero + Map: פונקציונליות אמיתית שהייתה בעבר הזוג-הבולט-ביותר —
          נשארת מחוברת ועובדת במלואה, רק ממוקמת אחרי ציר-המסלול/הארנקים/
          העוזר עכשיו (הם הבולטים לפי המוקאפ, לא זה). */}
      <div style={{ display: "grid", gridTemplateColumns: "1fr 2fr", gap: "var(--space-5)" }} className="dashboard-hero-row">
        <TripHeroCard trip={activeTrip} weatherPlace={weatherPlace} currentWeather={currentWeather} />
        <MapWidgetCard trip={activeTrip} tripPlaces={tripPlaces} />
      </div>

      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(160px, 1fr))", gap: "var(--space-4)" }}>
        <StatCard
          label="יתרת ארנק"
          value={primaryWallet ? primaryWallet.currentBalance.toLocaleString("he-IL") : "—"}
          hint={primaryWallet?.currencyCode}
          icon={Wallet}
          tint="blue"
          href={`/trips/${activeTrip.id}#wallet`}
        />
        <StatCard
          label="הוצאות הטיול"
          value={primaryCurrencyExpenseTotal !== null ? primaryCurrencyExpenseTotal.toLocaleString("he-IL") : "—"}
          hint={primaryWallet?.currencyCode}
          icon={Receipt}
          tint="pink"
          // אחוז אמיתי מתוך מה שנטען לארנק (initialAmount) — לא "% מתקציב" מומצא (אין
          // שדה תקציב על Trip). קירוב סביר: לא כל הוצאה בהכרח שולמה דרך הארנק הזה.
          ringPercent={
            primaryWallet && primaryWallet.initialAmount > 0 && primaryCurrencyExpenseTotal !== null
              ? (primaryCurrencyExpenseTotal / primaryWallet.initialAmount) * 100
              : undefined
          }
          href={`/trips/${activeTrip.id}#expenses`}
        />
        <StatCard
          label="ימים בטיול"
          value={`${Math.min(dayDates.filter((d) => d <= today).length, dayDates.length)} מתוך ${dayDates.length}`}
          hint={dayDates.length > 0 ? `${Math.round((Math.min(dayDates.filter((d) => d <= today).length, dayDates.length) / dayDates.length) * 100)}% הושלם` : undefined}
          icon={CalendarBlank}
          tint="purple"
          href={`/trips/${activeTrip.id}#days`}
        />
        <StatCard
          label="הזמנות"
          value={bookingsCount}
          hint={bookingsCount > 0 ? [hotelStays.length && `${hotelStays.length} מלונות`, flights.length && `${flights.length} טיסות`].filter(Boolean).join(" · ") || undefined : undefined}
          icon={Gift}
          tint="success"
          href={`/trips/${activeTrip.id}#bookings`}
        />
      </div>

      <GapAlertsCard trip={activeTrip} gaps={gaps} />

      {/* "ימים בלי תוכנית" — אותו רכיב-צ'יפים כמו "לילות בלי מלון" (ר' GapAlertsCard),
          אבל מחושב ישירות כאן (לא בתוך detectGaps) כי זה בדיקה שונה במהות:
          יום שלם בלי שום דבר רשום, לא סוג-חוסר ספציפי. */}
      {daysWithoutPlan.length > 0 ? (
        <NoHotelNightsList tripId={activeTrip.id} nights={daysWithoutPlan} icon={CalendarX} label="ימים בלי תוכנית" />
      ) : null}

      {/* שורה 3: תמיד ב-2 או 3 עמודות שוות (ראה .dashboard-row-3 ב-globals.css) —
          לעולם לא דחוס ל-4/5 ברוחב-ביניים. עד רוחב-מסך צר נופל בחזרה לעמודה אחת. */}
      <div className="dashboard-row-3" style={{ display: "grid", gap: "var(--space-5)", alignItems: "stretch" }}>
        <TodayTimelineCard
          trip={activeTrip}
          today={today}
          tonightHotel={tonightHotel}
          todayFlights={todayFlights}
          todayTransport={todayTransport}
        />
        <UpcomingPlansCard trip={activeTrip} activities={plannedActivities} />
        <ExpensesOverviewCard trip={activeTrip} expenses={expenses} />
        <WeatherCard
          title="🧭 מזג אוויר ביעד הבא"
          current={nextWeather}
          placeName={nextHotel?.hotelName ?? null}
          error={false}
          emptyMessage={
            <p style={{ color: "var(--color-text-muted)", font: "var(--text-caption)", margin: 0 }}>
              עדיין אין יעד-הבא ידוע (מלון עתידי עם מיקום) — יופיע כאן ברגע שתוסיף.
            </p>
          }
        />
      </div>

      {/* QuickActionsRow (פעולות מהירות) עבר למעלה, ליד TripSwitcher — ר' ההערה
          שם. TripInsightsCard נשאר לבד כאן, בלי עטיפת-grid מיותרת לילד יחיד. */}
      <TripInsightsCard
        tripsCount={trips.length}
        placesVisitedCount={insights.placesVisitedCount}
        daysTraveledCount={insights.daysTraveledCount}
        totalSpentByCurrency={insights.totalSpentByCurrency}
      />

      {/* כרטיס זה (ארנק-מפורט, יתרה לפי מטבע ולפי ארנק) אין לו מקבילה במוקאפ המקורי —
          פונקציונליות אמיתית שלא נמחקת, רק ממוקמת אחרי הסקשנים שכן תואמים 1:1.
          (ExpensesSummaryCard המקביל-לו הוסר — תת-קבוצה מלאה של מה ש-ExpensesOverviewCard
          כבר מציג למעלה, כולל פילוח-קטגוריות שלא היה כאן.) */}
      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(260px, 1fr))", gap: "var(--space-5)" }}>
        <WalletSummaryCard trip={activeTrip} wallets={wallets} />
      </div>
      </div>
    </div>
  );
}
