import { redirect } from "next/navigation";
import { getCurrentUser } from "@/lib/auth/get-current-user";
import { getFinanceRepository, getTripGeographyRepository, getTripPlaceRepository, getTripRepository } from "@travel-app/data-layer";
import { computeLifetimeStats } from "@/lib/lifetime-stats";
import { getTripDayDates } from "@/lib/trip-days";
import { getExpenseCategoryLabel } from "@/lib/expense-labels";
import { colorForCategory, mostCommonCurrency } from "@/lib/expense-chart-helpers";
import { StatCard } from "@/components/ui/StatCard";
import { BarChart } from "@/components/bar-chart";
import { DonutChart } from "@/components/donut-chart";
import { SuitcaseRolling, CalendarBlank, MapPin, Globe, Buildings, Trophy } from "@phosphor-icons/react/ssr";

export const dynamic = "force-dynamic";

export default async function StatsPage() {
  const user = await getCurrentUser();
  if (!user) redirect("/login");

  const [tripRepository, tripPlaceRepository, tripGeographyRepository, financeRepository] = await Promise.all([
    getTripRepository(),
    getTripPlaceRepository(),
    getTripGeographyRepository(),
    getFinanceRepository(),
  ]);
  const trips = await tripRepository.list({ userId: user.id });

  const perTrip = await Promise.all(
    trips.map(async (trip) => {
      const [tripPlaces, countries, cities, expenses] = await Promise.all([
        tripPlaceRepository.listForTrip({ userId: user.id, tripId: trip.id }),
        tripGeographyRepository.listCountries({ tripId: trip.id }),
        tripGeographyRepository.listCities({ tripId: trip.id }),
        financeRepository.listExpenses({ tripId: trip.id }),
      ]);
      return { tripId: trip.id, tripPlaces, countries, cities, expenses };
    }),
  );

  const stats = computeLifetimeStats({
    trips,
    visitedPlaceIdsByTrip: new Map(
      perTrip.map((t) => [t.tripId, t.tripPlaces.filter((tp) => tp.status === "visited").map((tp) => tp.placeId)]),
    ),
    countryNamesByTrip: new Map(perTrip.map((t) => [t.tripId, t.countries.map((c) => c.countryName)])),
    cityNamesByTrip: new Map(perTrip.map((t) => [t.tripId, t.cities.map((c) => c.cityName)])),
    expensesByTrip: new Map(perTrip.map((t) => [t.tripId, t.expenses])),
  });

  const spentEntries = Array.from(stats.totalSpentByCurrency.entries()).filter(([, amount]) => amount > 0);

  // הוצאה-לפי-קטגוריה לכל החיים — אותו דפוס בדיוק כמו expenses-overview-card.tsx
  // (הדשבורד, לטיול בודד): מטבע-הבסיס הוא הנפוץ-ביותר בפועל, בלי המרה מומצאת
  // בין מטבעות. מטבעות אחרים מדווחים בנפרד, לא נעלמים.
  const allExpenses = perTrip.flatMap((t) => t.expenses);
  const primaryCurrency = mostCommonCurrency(allExpenses);
  const primaryExpenses = primaryCurrency ? allExpenses.filter((e) => e.currencyCode === primaryCurrency) : [];
  const categoryTotals = new Map<string, number>();
  for (const e of primaryExpenses) {
    categoryTotals.set(e.category, (categoryTotals.get(e.category) ?? 0) + e.amount);
  }
  const categoryTotal = primaryExpenses.reduce((sum, e) => sum + e.amount, 0);

  // ימי-נסיעה לפי שנה — מדד חד-יחידה (ימים, לא כסף) כדי להימנע מבעיית ריבוי-מטבעות בין טיולים.
  const daysByYear = new Map<string, number>();
  for (const trip of trips) {
    const year = trip.startDate.slice(0, 4);
    daysByYear.set(year, (daysByYear.get(year) ?? 0) + getTripDayDates(trip.startDate, trip.endDate).length);
  }
  const daysByYearChart = Array.from(daysByYear.entries())
    .sort(([a], [b]) => a.localeCompare(b))
    .map(([year, days]) => ({ label: year, value: days }));

  return (
    <div>
      <h1 style={{ marginTop: 0 }}>סטטיסטיקות חיים</h1>
      <p style={{ color: "var(--color-text-muted)", marginTop: "-0.5rem" }}>סיכום על פני כל הטיולים שלך, לא רק הטיול הפעיל.</p>

      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(160px, 1fr))", gap: "var(--space-4)", marginTop: "1.5rem" }}>
        <StatCard label="סה״כ טיולים" value={stats.tripsCount} icon={SuitcaseRolling} />
        <StatCard label="ימי נסיעה" value={stats.daysTraveledCount} icon={CalendarBlank} />
        <StatCard label="מקומות שביקרת בהם" value={stats.uniquePlacesVisitedCount} icon={MapPin} />
        <StatCard label="מדינות" value={stats.uniqueCountriesCount} icon={Globe} />
        <StatCard label="ערים" value={stats.uniqueCitiesCount} icon={Buildings} />
        {stats.longestTrip ? (
          <StatCard label="הטיול הארוך ביותר" value={`${stats.longestTrip.dayCount} ימים`} hint={stats.longestTrip.name} icon={Trophy} />
        ) : null}
      </div>

      {daysByYearChart.length > 0 ? (
        <div
          style={{
            marginTop: "1.5rem",
            padding: "1rem",
            borderRadius: "var(--radius-lg)",
            border: "1px solid var(--color-border)",
          }}
        >
          <h2 style={{ fontSize: "1.125rem", marginTop: 0 }}>ימי נסיעה לפי שנה</h2>
          <BarChart data={daysByYearChart} unit="ימים" />
        </div>
      ) : null}

      <div
        style={{
          marginTop: "1.5rem",
          padding: "1rem",
          borderRadius: "10px",
          border: "1px solid var(--color-border)",
        }}
      >
        <h2 style={{ fontSize: "1.125rem", marginTop: 0 }}>סה״כ הוצאות</h2>
        {spentEntries.length > 0 ? (
          <p style={{ margin: 0 }}>
            {spentEntries.map(([currency, amount]) => `${amount.toLocaleString("he-IL")} ${currency}`).join(" · ")}
          </p>
        ) : (
          <p style={{ margin: 0, color: "var(--color-text-muted)" }}>אין עדיין הוצאות רשומות באף טיול.</p>
        )}
        <p style={{ fontSize: "0.75rem", color: "var(--color-text-muted)", marginBottom: 0 }}>
          מוצג לפי מטבע בנפרד — בלי המרה מומצאת בין מטבעות (אין שער חליפין אמיתי לכל הצירופים).
        </p>
        {categoryTotal > 0 && primaryCurrency ? (
          <div style={{ marginTop: "1rem" }}>
            <DonutChart
              segments={[...categoryTotals.entries()].map(([category, value]) => ({
                label: getExpenseCategoryLabel(category),
                value,
                color: colorForCategory(category),
              }))}
              centerLabel={categoryTotal.toLocaleString("he-IL")}
              centerSubLabel={primaryCurrency}
            />
          </div>
        ) : null}
      </div>
    </div>
  );
}
