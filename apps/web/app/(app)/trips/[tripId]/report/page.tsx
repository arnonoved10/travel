import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import { getCurrentUser } from "@/lib/auth/get-current-user";
import {
  getBookingRepository,
  getDocumentRepository,
  getFinanceRepository,
  getPlannedActivityRepository,
  getStatusHistoryRepository,
  getTripGeographyRepository,
  getTripPlaceRepository,
  getTripRepository,
} from "@travel-app/data-layer";
import { getTripDayDates } from "@/lib/trip-days";
import { getExpenseCategoryLabel } from "@/lib/expense-labels";
import { PAYMENT_METHOD_LABELS } from "@/lib/payment-method-labels";
import { TRIP_PLACE_STATUS_LABELS } from "@/lib/trip-place-labels";
import { LIFECYCLE_STATUS_LABELS } from "@/lib/lifecycle-status-labels";
import { buildCalendarEvents } from "@/lib/calendar";
import { buildTripShareText } from "@/lib/trip-share-text";
import { ShareButton } from "@/components/share-button";
import { WhatsAppShareLink } from "@/components/whatsapp-share-link";
import { ExportCsvButton } from "@/components/export-csv-button";
import { ExportXlsxButton } from "@/components/export-xlsx-button";
import { ExportPdfButton } from "@/components/export-pdf-button";
import type { XlsxSheetData } from "@/lib/xlsx-export";
import { buildCsv } from "@/lib/csv-export";
import { BarChart } from "@/components/bar-chart";
import { LineChart } from "@/components/line-chart";
import { Select } from "@/components/ui/Select";
import { DatePicker } from "@/components/ui/DatePicker";
import { TripPicker } from "./trip-picker";

const CALENDAR_EVENT_ICONS: Record<string, string> = {
  hotel_checkin: "🏨→",
  hotel_checkout: "🏨←",
  flight: "✈️",
  transport: "🚕",
  planned_activity: "📌",
};

// "בונה דוחות" — בחירת Sections/Trip/מטבעות מעל הדוח הקבוע הקיים (#89).
// לא נבנה מסך נפרד; אותו /report הופך להיות מוגדר-אישית דרך query params,
// באותו דפוס GET-form כמו סינון from/to/city/country הקיים.
const REPORT_SECTIONS = [
  { key: "cost", label: "עלות כוללת" },
  { key: "avgPerDay", label: "עלות ממוצעת ליום" },
  { key: "category", label: "פילוח לפי קטגוריה" },
  { key: "daily", label: "הוצאות לפי יום" },
  { key: "trend", label: "מגמת הוצאות מצטברת" },
  { key: "paymentMethod", label: "מזומן מול אמצעי תשלום" },
  { key: "tips", label: "טיפים" },
  { key: "massages", label: "עיסויים" },
  { key: "fruits", label: "פירות" },
  { key: "hotels", label: "מלונות" },
  { key: "flights", label: "טיסות" },
  { key: "timeline", label: "ציר זמן" },
  { key: "wallets", label: "יתרות ארנק" },
  { key: "places", label: "מקומות" },
  { key: "plannedVsActual", label: "תכנון מול ביצוע" },
  { key: "photos", label: "תמונות" },
] as const;
type ReportSectionKey = (typeof REPORT_SECTIONS)[number]["key"];

export const dynamic = "force-dynamic";

function addToCurrencyMap(map: Map<string, number>, currencyCode: string, amount: number): void {
  map.set(currencyCode, (map.get(currencyCode) ?? 0) + amount);
}

function formatCurrencyMap(map: Map<string, number>): string {
  if (map.size === 0) return "—";
  return Array.from(map.entries())
    .map(([currency, amount]) => `${Math.round(amount * 100) / 100} ${currency}`)
    .join(" · ");
}

export default async function TripReportPage({
  params,
  searchParams,
}: {
  params: Promise<{ tripId: string }>;
  searchParams: Promise<{ from?: string; to?: string; city?: string; country?: string; currency?: string; sections?: string | string[] }>;
}) {
  const user = await getCurrentUser();
  if (!user) redirect("/login");
  const { tripId } = await params;
  const { from, to, city, country, currency: currencyFilter, sections: sectionsParam } = await searchParams;

  const visibleSections: Set<ReportSectionKey> =
    sectionsParam === undefined
      ? new Set(REPORT_SECTIONS.map((s) => s.key))
      : new Set((Array.isArray(sectionsParam) ? sectionsParam : [sectionsParam]) as ReportSectionKey[]);

  const tripRepository = await getTripRepository();
  const [trip, trips] = await Promise.all([
    tripRepository.getById({ userId: user.id, tripId }),
    tripRepository.list({ userId: user.id }),
  ]);
  if (!trip) notFound();

  const financeRepository = await getFinanceRepository();
  const tripPlaceRepository = await getTripPlaceRepository();
  const documentRepository = await getDocumentRepository();
  const [allExpenses, wallets, tripPlaces, tripDocuments] = await Promise.all([
    financeRepository.listExpenses({ tripId }),
    financeRepository.listWallets({ tripId }),
    tripPlaceRepository.listForTrip({ userId: user.id, tripId }),
    documentRepository.listForTrip({ tripId }),
  ]);
  // תמונות מכל הישויות של הטיול (זכרונות/מלונות/השכרות) — לא רק Trip Memories —
  // כי "סיכום סוף טיול" הוא רטרוספקטיבה מלאה, לא רק אלבום נפרד.
  const tripPhotos = tripDocuments.filter((doc) => doc.documentType === "image");

  const placesById = new Map(tripPlaces.map((tp) => [tp.place.id, tp.place]));
  const availableCities = Array.from(new Set(tripPlaces.map((tp) => tp.place.city).filter((c): c is string => c !== null))).sort();
  const availableCountries = Array.from(
    new Set(tripPlaces.map((tp) => tp.place.country).filter((c): c is string => c !== null)),
  ).sort();
  const availableCurrencies = Array.from(new Set(allExpenses.map((e) => e.currencyCode))).sort();

  const expenses = allExpenses.filter((e) => {
    const date = e.expenseAt.slice(0, 10);
    if (from && date < from) return false;
    if (to && date > to) return false;
    const place = e.placeId ? placesById.get(e.placeId) : undefined;
    if (city && place?.city !== city) return false;
    if (country && place?.country !== country) return false;
    if (currencyFilter && e.currencyCode !== currencyFilter) return false;
    return true;
  });

  const expensesWithPayments = await Promise.all(
    expenses.map(async (expense) => ({
      expense,
      payments: await financeRepository.listPayments({ expenseId: expense.id }),
    })),
  );

  const tripDayDates = getTripDayDates(trip.startDate, trip.endDate);
  const dayCount = tripDayDates.length;

  const totalByCurrency = new Map<string, number>();
  const avgPerDayByCurrency = new Map<string, number>();
  for (const e of expenses) addToCurrencyMap(totalByCurrency, e.currencyCode, e.amount);
  if (dayCount > 0) {
    for (const [currency, total] of totalByCurrency) avgPerDayByCurrency.set(currency, total / dayCount);
  }

  const byCategory = new Map<string, Map<string, number>>();
  for (const e of expenses) {
    const catMap = byCategory.get(e.category) ?? new Map<string, number>();
    addToCurrencyMap(catMap, e.currencyCode, e.amount);
    byCategory.set(e.category, catMap);
  }

  // מותנה בכוונה — גרף מציג רק מטבע אחד בכל פעם, אין המרה/ניחוש שער חליפין.
  const categoryChartByCurrency = new Map<string, Array<{ label: string; value: number }>>();
  for (const [category, amounts] of byCategory) {
    for (const [currency, amount] of amounts) {
      const list = categoryChartByCurrency.get(currency) ?? [];
      list.push({ label: getExpenseCategoryLabel(category), value: amount });
      categoryChartByCurrency.set(currency, list);
    }
  }
  for (const list of categoryChartByCurrency.values()) list.sort((a, b) => b.value - a.value);

  const reportRows: Array<[string, string, number]> = [
    ...Array.from(categoryChartByCurrency.entries()).flatMap(([currency, rows]) => rows.map((r): [string, string, number] => [currency, r.label, r.value])),
    ...Array.from(totalByCurrency.entries()).map((entry): [string, string, number] => [entry[0], "סה״כ", entry[1]]),
  ];
  const reportCsv = buildCsv(["מטבע", "קטגוריה", "סכום"], reportRows);
  const reportXlsxSheets: XlsxSheetData[] =
    reportRows.length > 0 ? [{ name: "פילוח לפי קטגוריה", headers: ["מטבע", "קטגוריה", "סכום"], rows: reportRows }] : [];

  const byDayByCurrency = new Map<string, Map<string, number>>();
  for (const e of expenses) {
    const date = e.expenseAt.slice(0, 10);
    const dayMap = byDayByCurrency.get(e.currencyCode) ?? new Map<string, number>();
    dayMap.set(date, (dayMap.get(date) ?? 0) + e.amount);
    byDayByCurrency.set(e.currencyCode, dayMap);
  }
  const dailyChartByCurrency = new Map<string, Array<{ label: string; value: number }>>();
  for (const [currency, dayMap] of byDayByCurrency) {
    dailyChartByCurrency.set(
      currency,
      Array.from(dayMap.entries())
        .sort(([a], [b]) => a.localeCompare(b))
        .map(([date, value]) => ({ label: date, value })),
    );
  }

  // מגמה מצטברת — לכל ימי הטיול (כולל ימים בלי הוצאה, בערך 0), לא רק ימים עם רישום.
  const cumulativeChartByCurrency = new Map<string, Array<{ label: string; value: number }>>();
  for (const [currency, dayMap] of byDayByCurrency) {
    let running = 0;
    cumulativeChartByCurrency.set(
      currency,
      tripDayDates.map((date) => {
        running += dayMap.get(date) ?? 0;
        return { label: date, value: running };
      }),
    );
  }

  const byPaymentMethod = new Map<string, Map<string, number>>();
  for (const { payments } of expensesWithPayments) {
    for (const p of payments) {
      const methodMap = byPaymentMethod.get(p.paymentMethod) ?? new Map<string, number>();
      addToCurrencyMap(methodMap, p.currencyCode, p.amount);
      byPaymentMethod.set(p.paymentMethod, methodMap);
    }
  }

  const tips = expenses.filter((e) => e.category === "tip");
  const tipsByCurrency = new Map<string, number>();
  for (const t of tips) addToCurrencyMap(tipsByCurrency, t.currencyCode, t.amount);

  const massages = expenses.filter((e) => e.category === "massage");
  const massagesByCurrency = new Map<string, number>();
  for (const m of massages) addToCurrencyMap(massagesByCurrency, m.currencyCode, m.amount);
  // ממוצע לעיסוי — רק כשכל העיסויים באותו מטבע (אחרת "ממוצע" בין מטבעות שונים מטעה).
  const massageAverage = massagesByCurrency.size === 1 ? Math.round((massagesByCurrency.values().next().value ?? 0) / massages.length) : null;

  const fruits = expenses.filter((e) => e.category === "fruit");
  const fruitsByCurrency = new Map<string, number>();
  for (const f of fruits) addToCurrencyMap(fruitsByCurrency, f.currencyCode, f.amount);
  const fruitTotalQuantity = fruits.reduce((sum, f) => sum + (f.quantity ?? 0), 0);

  const placesByStatus = new Map<string, number>();
  for (const tp of tripPlaces) placesByStatus.set(tp.status, (placesByStatus.get(tp.status) ?? 0) + 1);

  const [bookingRepository, tripGeographyRepository] = await Promise.all([getBookingRepository(), getTripGeographyRepository()]);
  const [hotelStays, flights, transportBookings, tripCountries, tripCities] = await Promise.all([
    bookingRepository.listHotelStays({ tripId }),
    bookingRepository.listFlights({ tripId }),
    bookingRepository.listTransportBookings({ tripId }),
    tripGeographyRepository.listCountries({ tripId }),
    tripGeographyRepository.listCities({ tripId }),
  ]);

  const timelineEvents = buildCalendarEvents({
    hotelStays,
    flights,
    transportBookings,
    plannedActivities: [],
  }).sort((a, b) => a.date.localeCompare(b.date));

  const plannedActivityRepository = await getPlannedActivityRepository();
  const statusHistoryRepository = await getStatusHistoryRepository();
  const plannedActivities = await plannedActivityRepository.listForTrip({ tripId });
  const statusHistoryByActivity = new Map<string, Awaited<ReturnType<typeof statusHistoryRepository.listForEntities>>>();
  if (plannedActivities.length > 0) {
    const entries = await statusHistoryRepository.listForEntities({
      refs: plannedActivities.map((a) => ({ entityType: "planned_activity", entityId: a.id })),
    });
    for (const entry of entries) {
      const list = statusHistoryByActivity.get(entry.entityId) ?? [];
      list.push(entry);
      statusHistoryByActivity.set(entry.entityId, list);
    }
  }

  const shareText = buildTripShareText({
    trip,
    hotelStays,
    flights,
    transportBookings,
    countryNames: tripCountries.map((c) => c.countryName),
    cityNames: tripCities.map((c) => c.cityName),
  });

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: "1rem" }}>
      <div>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", flexWrap: "wrap", gap: "0.5rem" }}>
          <div>
            <h1 style={{ marginTop: 0, marginBottom: "0.25rem" }}>דוח טיול</h1>
            <p style={{ color: "var(--color-text-muted)" }}>
              <Link href={`/trips/${tripId}`}>{trip.name}</Link> · {trip.startDate} — {trip.endDate} ({dayCount} ימים)
            </p>
            {tripCountries.length > 0 || tripCities.length > 0 ? (
              <p style={{ color: "var(--color-text-muted)", fontSize: "0.875rem" }}>
                {tripCountries.map((c) => c.countryName).join(", ")}
                {tripCountries.length > 0 && tripCities.length > 0 ? " · " : ""}
                {tripCities.map((c) => c.cityName).join(", ")}
              </p>
            ) : null}
          </div>
          <div style={{ display: "flex", gap: "0.5rem", flexWrap: "wrap", alignItems: "flex-end" }}>
            <TripPicker tripId={tripId} trips={trips} />
            <ShareButton title={`טיול: ${trip.name}`} text={shareText} />
            <WhatsAppShareLink text={shareText} />
            <ExportCsvButton csv={reportCsv} fileName={`דוח-טיול-${trip.name}.csv`} label="⬇️ ייצוא דוח מלא (CSV)" />
            {reportXlsxSheets.length > 0 ? (
              <>
                <ExportXlsxButton sheets={reportXlsxSheets} fileName={`דוח-טיול-${trip.name}.xlsx`} label="📗 ייצוא Excel" />
                <ExportPdfButton sheets={reportXlsxSheets} title={`דוח טיול — ${trip.name}`} fileName={`דוח-טיול-${trip.name}.pdf`} label="📄 ייצוא PDF" />
              </>
            ) : null}
          </div>
        </div>
      </div>

      <form method="get" style={{ display: "flex", flexDirection: "column", gap: "0.75rem" }}>
        <div style={{ display: "flex", gap: "0.5rem", alignItems: "flex-end", flexWrap: "wrap" }}>
          <label style={{ display: "flex", flexDirection: "column", gap: "0.25rem", fontSize: "0.8125rem" }}>
            מתאריך
            <DatePicker name="from" defaultValue={from} />
          </label>
          <label style={{ display: "flex", flexDirection: "column", gap: "0.25rem", fontSize: "0.8125rem" }}>
            עד תאריך
            <DatePicker name="to" defaultValue={to} />
          </label>
          {availableCities.length > 0 ? (
            <label style={{ display: "flex", flexDirection: "column", gap: "0.25rem", fontSize: "0.8125rem" }}>
              עיר
              <Select
                name="city"
                defaultValue={city ?? ""}
                style={dateInputStyle}
                placeholder="הכול"
                options={availableCities.map((c) => ({ value: c, label: c }))}
              />
            </label>
          ) : null}
          {availableCountries.length > 0 ? (
            <label style={{ display: "flex", flexDirection: "column", gap: "0.25rem", fontSize: "0.8125rem" }}>
              מדינה
              <Select
                name="country"
                defaultValue={country ?? ""}
                style={dateInputStyle}
                placeholder="הכול"
                options={availableCountries.map((c) => ({ value: c, label: c }))}
              />
            </label>
          ) : null}
          {availableCurrencies.length > 1 ? (
            <label style={{ display: "flex", flexDirection: "column", gap: "0.25rem", fontSize: "0.8125rem" }}>
              מטבע (לסקשנים הכספיים)
              <Select
                name="currency"
                defaultValue={currencyFilter ?? ""}
                style={dateInputStyle}
                placeholder="הכול"
                options={availableCurrencies.map((c) => ({ value: c, label: c }))}
              />
            </label>
          ) : null}
          <button type="submit" style={filterButtonStyle}>
            סנן
          </button>
          {from || to || city || country || currencyFilter || sectionsParam !== undefined ? (
            <Link href={`/trips/${tripId}/report`} style={{ fontSize: "0.8125rem", color: "var(--color-text-muted)" }}>
              נקה סינון
            </Link>
          ) : null}
        </div>

        <details>
          <summary style={{ fontSize: "0.8125rem", color: "var(--color-text-muted)", cursor: "pointer" }}>
            בונה דוח — בחירת סקשנים ({visibleSections.size}/{REPORT_SECTIONS.length})
          </summary>
          <div style={{ display: "flex", flexWrap: "wrap", gap: "0.5rem 1rem", marginTop: "0.5rem" }}>
            {REPORT_SECTIONS.map((section) => (
              <label key={section.key} style={{ display: "flex", alignItems: "center", gap: "0.375rem", fontSize: "0.8125rem" }}>
                <input type="checkbox" name="sections" value={section.key} defaultChecked={visibleSections.has(section.key)} />
                {section.label}
              </label>
            ))}
          </div>
        </details>
      </form>
      {(availableCities.length > 0 || availableCountries.length > 0) && expenses.length < allExpenses.length ? (
        <p style={{ ...mutedStyle, marginTop: "-0.5rem" }}>
          סינון עיר/מדינה מבוסס על מקומות מקושרים לטיול בהוצאה (מסאז&apos;/אוכל/קניות/אטרקציות) — הוצאות בלי מקום מקושר לא ייכללו כשהסינון פעיל.
        </p>
      ) : null}

      {visibleSections.has("cost") ? (
        <Card title="עלות כוללת">
          <p style={{ fontWeight: 600, fontSize: "1.25rem", margin: 0 }}>{formatCurrencyMap(totalByCurrency)}</p>
          <p style={mutedStyle}>
            {expenses.length} הוצאות רשומות{from || to ? ` (מתוך ${allExpenses.length} בסך הכול)` : ""}
          </p>
        </Card>
      ) : null}

      {visibleSections.has("avgPerDay") ? (
        <Card title="עלות ממוצעת ליום">
          <p style={{ fontWeight: 600, fontSize: "1.125rem", margin: 0 }}>{formatCurrencyMap(avgPerDayByCurrency)}</p>
        </Card>
      ) : null}

      {visibleSections.has("category") ? (
        <Card title="פילוח לפי קטגוריה">
          {byCategory.size === 0 ? (
            <p style={mutedStyle}>אין הוצאות עדיין.</p>
          ) : (
            <>
              <ul style={listStyle}>
                {Array.from(byCategory.entries()).map(([category, amounts]) => (
                  <li key={category} style={itemStyle}>
                    {getExpenseCategoryLabel(category)}: {formatCurrencyMap(amounts)}
                  </li>
                ))}
              </ul>
              {Array.from(categoryChartByCurrency.entries()).map(([currency, data]) => (
                <div key={currency} style={{ marginTop: "1rem" }}>
                  {categoryChartByCurrency.size > 1 ? <p style={{ ...mutedStyle, marginBottom: "0.5rem" }}>{currency}</p> : null}
                  <BarChart data={data} unit={currency} />
                </div>
              ))}
            </>
          )}
        </Card>
      ) : null}

      {visibleSections.has("daily") ? (
        <Card title="הוצאות לפי יום">
          {dailyChartByCurrency.size === 0 ? (
            <p style={mutedStyle}>אין הוצאות עדיין.</p>
          ) : (
            Array.from(dailyChartByCurrency.entries()).map(([currency, data]) => (
              <div key={currency} style={{ marginBottom: "1rem" }}>
                {dailyChartByCurrency.size > 1 ? <p style={{ ...mutedStyle, marginBottom: "0.5rem" }}>{currency}</p> : null}
                <BarChart data={data} unit={currency} />
              </div>
            ))
          )}
        </Card>
      ) : null}

      {visibleSections.has("trend") ? (
        <Card title="מגמת הוצאות מצטברת">
          {cumulativeChartByCurrency.size === 0 ? (
            <p style={mutedStyle}>אין הוצאות עדיין.</p>
          ) : (
            Array.from(cumulativeChartByCurrency.entries()).map(([currency, data]) => (
              <div key={currency} style={{ marginBottom: "1rem" }}>
                {cumulativeChartByCurrency.size > 1 ? <p style={{ ...mutedStyle, marginBottom: "0.5rem" }}>{currency}</p> : null}
                <LineChart points={data} unit={currency} />
              </div>
            ))
          )}
        </Card>
      ) : null}

      {visibleSections.has("paymentMethod") ? (
        <Card title="מזומן מול אמצעי תשלום אחרים">
          {byPaymentMethod.size === 0 ? (
            <p style={mutedStyle}>אין תשלומים רשומים עדיין.</p>
          ) : (
            <ul style={listStyle}>
              {Array.from(byPaymentMethod.entries()).map(([method, amounts]) => (
                <li key={method} style={itemStyle}>
                  {PAYMENT_METHOD_LABELS[method as keyof typeof PAYMENT_METHOD_LABELS] ?? method}: {formatCurrencyMap(amounts)}
                </li>
              ))}
            </ul>
          )}
        </Card>
      ) : null}

      {visibleSections.has("tips") ? (
        <Card title={`טיפים (${tips.length})`}>
          <p style={{ fontWeight: 600, margin: 0 }}>{formatCurrencyMap(tipsByCurrency)}</p>
        </Card>
      ) : null}

      {visibleSections.has("massages") ? (
        <Card title={`עיסויים (${massages.length})`}>
          <p style={{ fontWeight: 600, margin: 0 }}>{formatCurrencyMap(massagesByCurrency)}</p>
          {massageAverage !== null ? (
            <p style={{ ...mutedStyle, marginTop: "0.25rem" }}>
              ממוצע לעיסוי: {massageAverage} {Array.from(massagesByCurrency.keys())[0]}
            </p>
          ) : null}
        </Card>
      ) : null}

      {visibleSections.has("fruits") ? (
        <Card title={`פירות (${fruits.length})`}>
          <p style={{ fontWeight: 600, margin: 0 }}>{formatCurrencyMap(fruitsByCurrency)}</p>
          {fruitTotalQuantity > 0 ? <p style={{ ...mutedStyle, marginTop: "0.25rem" }}>סה&quot;כ כמות: {fruitTotalQuantity}</p> : null}
        </Card>
      ) : null}

      {visibleSections.has("hotels") ? (
        <Card title={`מלונות (${hotelStays.length})`}>
          {hotelStays.length === 0 ? (
            <p style={mutedStyle}>אין מלונות רשומים.</p>
          ) : (
            <ul style={listStyle}>
              {hotelStays.map((h) => (
                <li key={h.id} style={itemStyle}>
                  {h.hotelName} · {h.checkInDate} — {h.checkOutDate}
                </li>
              ))}
            </ul>
          )}
        </Card>
      ) : null}

      {visibleSections.has("flights") ? (
        <Card title={`טיסות (${flights.length})`}>
          {flights.length === 0 ? (
            <p style={mutedStyle}>אין טיסות רשומות.</p>
          ) : (
            <ul style={listStyle}>
              {flights.map((f) => (
                <li key={f.id} style={itemStyle}>
                  {f.airline} {f.flightNumber ?? ""} · {f.departureAirport}→{f.arrivalAirport} · {f.departureAt.slice(0, 10)}
                </li>
              ))}
            </ul>
          )}
        </Card>
      ) : null}

      {visibleSections.has("timeline") ? (
        <Card title="ציר זמן הטיול">
          {timelineEvents.length === 0 ? (
            <p style={mutedStyle}>אין עדיין אירועים רשומים.</p>
          ) : (
            <ul style={listStyle}>
              {timelineEvents.map((event) => (
                <li key={event.id} style={{ ...itemStyle, display: "flex", gap: "0.5rem" }}>
                  <span style={{ color: "var(--color-text-muted)", fontSize: "0.8125rem", minWidth: "5.5rem" }}>{event.date}</span>
                  <span>
                    {CALENDAR_EVENT_ICONS[event.type] ?? ""} {event.label}
                  </span>
                </li>
              ))}
            </ul>
          )}
        </Card>
      ) : null}

      {visibleSections.has("wallets") ? (
        <Card title="יתרות ארנק שנשארו">
          {wallets.length === 0 ? (
            <p style={mutedStyle}>אין ארנק לטיול הזה.</p>
          ) : (
            <ul style={listStyle}>
              {wallets.map((w) => (
                <li key={w.id} style={itemStyle}>
                  {w.currentBalance} {w.currencyCode}
                </li>
              ))}
            </ul>
          )}
        </Card>
      ) : null}

      {visibleSections.has("places") ? (
        <Card title={`מקומות (${tripPlaces.length})`}>
          {placesByStatus.size === 0 ? (
            <p style={mutedStyle}>לא נוספו מקומות לטיול הזה.</p>
          ) : (
            <ul style={listStyle}>
              {Array.from(placesByStatus.entries()).map(([status, count]) => (
                <li key={status} style={itemStyle}>
                  {TRIP_PLACE_STATUS_LABELS[status as keyof typeof TRIP_PLACE_STATUS_LABELS] ?? status}: {count}
                </li>
              ))}
            </ul>
          )}
        </Card>
      ) : null}

      {visibleSections.has("plannedVsActual") ? (
        <Card title={`תכנון מול ביצוע (${plannedActivities.length})`}>
          <p style={mutedStyle}>שרשרת מעברי הסטטוס בפועל לכל פריט תכנון עתידי, לעומת הסטטוס שבו הוא נמצא כרגע.</p>
          {plannedActivities.length === 0 ? (
            <p style={mutedStyle}>אין עדיין פריטי תכנון עתידי.</p>
          ) : (
            <ul style={listStyle}>
              {plannedActivities.map((activity) => {
                const history = statusHistoryByActivity.get(activity.id) ?? [];
                return (
                  <li key={activity.id} style={itemStyle}>
                    <div style={{ fontWeight: 600 }}>{activity.name}</div>
                    <div style={mutedStyle}>
                      סטטוס נוכחי: {LIFECYCLE_STATUS_LABELS[activity.status] ?? activity.status}
                    </div>
                    {history.length === 0 ? (
                      <p style={{ ...mutedStyle, marginTop: "0.375rem" }}>לא נרשמו עדיין מעברי סטטוס.</p>
                    ) : (
                      <div style={{ marginTop: "0.375rem", fontSize: "0.8125rem", color: "var(--color-text-muted)" }}>
                        {history
                          .map(
                            (entry) =>
                              `${LIFECYCLE_STATUS_LABELS[entry.newStatus as keyof typeof LIFECYCLE_STATUS_LABELS] ?? entry.newStatus} (${new Date(entry.changedAt).toLocaleString("he-IL")})`,
                          )
                          .join(" ← ")}
                      </div>
                    )}
                  </li>
                );
              })}
            </ul>
          )}
        </Card>
      ) : null}

      {visibleSections.has("photos") ? (
        <Card title={`תמונות מהטיול (${tripPhotos.length})`}>
          {tripPhotos.length === 0 ? (
            <p style={mutedStyle}>עוד לא הועלו תמונות לטיול הזה — אפשר להעלות בעמוד הטיול, בזכרונות או בכל הזמנה.</p>
          ) : (
            <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(110px, 1fr))", gap: "0.5rem" }}>
              {tripPhotos.map((doc) => (
                <a key={doc.id} href={doc.fileUrl} target="_blank" rel="noopener noreferrer">
                  <img
                    src={doc.fileUrl}
                    alt={doc.fileName ?? "תמונה מהטיול"}
                    style={{
                      width: "100%",
                      aspectRatio: "1 / 1",
                      objectFit: "cover",
                      borderRadius: "var(--radius-md)",
                      border: "1px solid var(--color-border)",
                      display: "block",
                    }}
                  />
                </a>
              ))}
            </div>
          )}
        </Card>
      ) : null}
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
const listStyle: React.CSSProperties = { listStyle: "none", padding: 0, display: "flex", flexDirection: "column", gap: "0.375rem", margin: 0 };
const itemStyle: React.CSSProperties = { padding: "0.5rem", borderRadius: "var(--radius-md)", background: "var(--color-surface-elevated)" };
const dateInputStyle: React.CSSProperties = {
  padding: "0.5rem",
  borderRadius: "var(--radius-md)",
  border: "1px solid var(--color-border)",
  background: "var(--color-surface-elevated)",
  color: "var(--color-text-primary)",
};
const filterButtonStyle: React.CSSProperties = {
  padding: "0.5rem 1rem",
  borderRadius: "var(--radius-full)",
  border: "1px solid var(--color-border)",
  background: "var(--color-surface)",
  color: "var(--color-text-primary)",
  fontWeight: 600,
  cursor: "pointer",
};
