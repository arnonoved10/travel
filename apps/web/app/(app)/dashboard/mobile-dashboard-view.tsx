import type { Trip, HotelStay, Flight, TransportBooking, Wallet, Expense, WeatherForecastSnapshot } from "@travel-app/shared-types";
import { CalendarX } from "@phosphor-icons/react/ssr";
import { Avatar } from "@/components/ui/Avatar";
import { NotificationButton } from "@/components/ui/NotificationButton";
import { countryFlagEmoji } from "@/lib/country-flags";
import { formatDateTimeInZone } from "@/lib/dates";
import { NoHotelNightsList } from "@/components/no-hotel-nights";
import { ExchangeRatesCard } from "@/components/exchange-rates-card";
import { MobileTripHeroCard } from "./mobile-trip-hero-card";
import { MobileWalletList } from "./mobile-wallet-list";
import { TodayTimelineCard } from "./today-timeline-card";
import { WeatherCard } from "./weather-card";
import { TripRouteCard } from "./trip-route-card";
import { ExpensesOverviewCard } from "./expenses-overview-card";
import { AiAssistantCard } from "./ai-assistant-card";
import { DashboardCard } from "./dashboard-card";

type Snapshot = Omit<WeatherForecastSnapshot, "id" | "retrievedAt">;

/** דשבורד ייעודי למובייל — לא כיווץ-CSS של גרסת-המחשב, הרכב שונה לגמרי
 * (בקשת משתמש: "נראה כמו גרסת המחשב שכווצה... לא תואם לתמונת mobile
 * screens"). אותם קומפוננטות/נתונים אמיתיים בהם משתמש הדשבורד הרגיל — כאן רק
 * סדר, צפיפות וברירת-מחדל שונים (לדוגמה: TripRouteCard עם hideProgressBar,
 * כי מספר-היום/האחוז כבר בכרטיס-הטיול המרכזי למעלה). סדר הסקשנים לפי בקשת
 * המשתמש המפורשת: כותרת → כרטיס-טיול → ארנק → תוכנית-היום → מזג-אוויר →
 * ציר-מסלול → שערי-מטבע → הוצאות → ימים-בלי-מלון/תוכנית → עוזר-AI. */
export function MobileDashboardView({
  activeTrip,
  greetingName,
  greetingText,
  userEmail,
  destination,
  today,
  dayDates,
  hotelStays,
  wallets,
  preferredCurrencyCodes,
  tonightHotel,
  todayFlights,
  todayTransport,
  currentWeather,
  weatherError,
  dailyForecast,
  currencyCodes,
  expenses,
  combinedPlanGapDates,
}: {
  activeTrip: Trip;
  greetingName: string;
  greetingText: string;
  userEmail: string;
  destination: { name: string | null; country: string | null; timezone: string | null };
  today: string;
  dayDates: string[];
  hotelStays: HotelStay[];
  wallets: Wallet[];
  preferredCurrencyCodes: string[];
  tonightHotel: HotelStay | null;
  todayFlights: Flight[];
  todayTransport: TransportBooking[];
  currentWeather: Snapshot | null;
  weatherError: boolean;
  dailyForecast: { date: string; minC: number | null; maxC: number | null; icon: string | null }[];
  currencyCodes: string[];
  expenses: Expense[];
  combinedPlanGapDates: string[];
}) {
  const destinationFlag = countryFlagEmoji(destination.country);
  const nowIso = new Date().toISOString();
  const localTimeLabel = destination.timezone ? formatDateTimeInZone(nowIso, destination.timezone) : null;

  return (
    <>
      {/* כותרת: ברכה קצרה + תמונת-פרופיל + התראות, ואז שורה שנייה קומפקטית
          עם דגל-המדינה/שעון-מקומי/תאריך (בקשת משתמש המפורשת). תמונת-הפרופיל
          היא Avatar עם ראשי-תיבות בכוונה, לא תצלום מומצא — ר' Avatar.tsx. */}
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: "0.75rem" }}>
        <div style={{ display: "flex", alignItems: "center", gap: "0.625rem", minWidth: 0 }}>
          <Avatar label={userEmail} size={40} href="/settings" />
          <h1 style={{ font: "var(--text-h3)", margin: 0, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
            {greetingText}, {greetingName} 👋
          </h1>
        </div>
        <NotificationButton />
      </div>

      {localTimeLabel ? (
        <div
          style={{
            display: "flex",
            alignItems: "center",
            gap: "0.5rem",
            padding: "0.5rem 0.75rem",
            borderRadius: "var(--radius-md)",
            background: "var(--color-surface)",
            border: "1px solid var(--color-border)",
            font: "var(--text-caption)",
            color: "var(--color-text-secondary)",
          }}
        >
          <span aria-hidden style={{ fontSize: "1.125rem" }}>{destinationFlag ?? "🌍"}</span>
          <span style={{ fontVariantNumeric: "tabular-nums" }}>{localTimeLabel}</span>
          {destination.name ? <span style={{ color: "var(--color-text-muted)" }}> · {destination.name}</span> : null}
        </div>
      ) : null}

      <MobileTripHeroCard trip={activeTrip} today={today} dayDates={dayDates} />

      <MobileWalletList trip={activeTrip} wallets={wallets} preferredCurrencyCodes={preferredCurrencyCodes} />

      <TodayTimelineCard trip={activeTrip} today={today} tonightHotel={tonightHotel} todayFlights={todayFlights} todayTransport={todayTransport} />

      <WeatherCard current={currentWeather} placeName={destination.name} error={weatherError} dailyForecast={dailyForecast} />

      <TripRouteCard trip={activeTrip} hotelStays={hotelStays} today={today} dayDates={dayDates} hideProgressBar />

      <DashboardCard title="שערי מטבע" href={`/trips/${activeTrip.id}#finances`}>
        <ExchangeRatesCard currencyCodes={currencyCodes} />
      </DashboardCard>

      <ExpensesOverviewCard trip={activeTrip} expenses={expenses} />

      {combinedPlanGapDates.length > 0 ? (
        <NoHotelNightsList tripId={activeTrip.id} nights={combinedPlanGapDates} icon={CalendarX} label="ימים בלי מלון או תוכנית" />
      ) : null}

      <AiAssistantCard />
    </>
  );
}
