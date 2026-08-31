import { notFound } from "next/navigation";
import {
  getBookingRepository,
  getPlaceRepository,
  getRouteRepository,
  getTripRepository,
  getTripShareLinkRepository,
} from "@travel-app/data-layer";
import { getTripDayDates } from "@/lib/trip-days";
import { SharedPageLayout } from "../shared-page-layout";

export const dynamic = "force-dynamic";

const sectionStyle = {
  padding: "1rem",
  borderRadius: "10px",
  border: "1px solid var(--color-border)",
  display: "flex",
  flexDirection: "column" as const,
  gap: "0.5rem",
};

function formatDateRange(start: string, end: string): string {
  return start === end ? start : `${start} – ${end}`;
}

// עמוד ציבורי, בלי auth (מחוץ ל-(app)/, ר' app/(app)/layout.tsx) — resolveToken
// הוא נקודת-האימות היחידה כאן, במקום getCurrentUser()+getById. שולף **רק**
// שם/תאריכי טיול, מלונות (שם+תאריכים, בלי מחיר), טיסות (חברה+מסלול+שעות,
// בלי מחיר), ועצירות-מסלול לכל יום (שמות מקומות בלבד). לא קורא בכלל
// ל-Repositories של הוצאות/ארנק/מסמכים/אנשי-קשר — זה כל ה-boundary שיש,
// אין הרשאה ברמת-שדה. אל תוסיפו כאן שדה נוסף בלי לשקול מחדש את הגבול הזה.
export default async function SharedTripPage({ params }: { params: Promise<{ token: string }> }) {
  const { token } = await params;

  const tripShareLinkRepository = await getTripShareLinkRepository();
  const shareLink = await tripShareLinkRepository.resolveToken({ token });
  if (!shareLink) notFound();

  const tripRepository = await getTripRepository();
  const trip = await tripRepository.getByIdForShareView({ tripId: shareLink.tripId });
  if (!trip) notFound();

  const bookingRepository = await getBookingRepository();
  const [hotelStays, flights] = await Promise.all([
    bookingRepository.listHotelStays({ tripId: trip.id }),
    bookingRepository.listFlights({ tripId: trip.id }),
  ]);

  const dayDates = getTripDayDates(trip.startDate, trip.endDate);
  const routeRepository = await getRouteRepository();
  const stopsByDate = new Map(await Promise.all(dayDates.map(async (date) => [date, await routeRepository.listForDay({ tripId: trip.id, date })] as const)));

  const allPlaceIds = Array.from(new Set(Array.from(stopsByDate.values()).flatMap((stops) => stops.map((s) => s.placeId).filter((id): id is string => id !== null))));
  const placeRepository = await getPlaceRepository();
  const places = await placeRepository.listByIds({ placeIds: allPlaceIds });
  const placeNameById = new Map(places.map((p) => [p.id, p.name]));

  const daysWithStops = dayDates
    .map((date) => ({ date, stops: stopsByDate.get(date) ?? [] }))
    .filter((day) => day.stops.length > 0);

  return (
    <SharedPageLayout title={trip.name} subtitle={formatDateRange(trip.startDate, trip.endDate)}>
      {hotelStays.length > 0 ? (
        <section style={sectionStyle}>
          <h2 style={{ fontSize: "1.0625rem", margin: 0 }}>🏨 מלונות</h2>
          <ul style={{ listStyle: "none", margin: 0, padding: 0, display: "flex", flexDirection: "column", gap: "0.375rem" }}>
            {hotelStays.map((hotel) => (
              <li key={hotel.id} style={{ fontSize: "0.9375rem" }}>
                {hotel.hotelName}
                <span style={{ color: "var(--color-text-muted)", fontSize: "0.8125rem" }}>
                  {" — "}
                  {formatDateRange(hotel.checkInDate, hotel.checkOutDate)}
                </span>
              </li>
            ))}
          </ul>
        </section>
      ) : null}

      {flights.length > 0 ? (
        <section style={sectionStyle}>
          <h2 style={{ fontSize: "1.0625rem", margin: 0 }}>✈️ טיסות</h2>
          <ul style={{ listStyle: "none", margin: 0, padding: 0, display: "flex", flexDirection: "column", gap: "0.375rem" }}>
            {flights.map((flight) => (
              <li key={flight.id} style={{ fontSize: "0.9375rem" }}>
                {flight.airline}
                {flight.flightNumber ? ` ${flight.flightNumber}` : ""}: {flight.departureAirport} → {flight.arrivalAirport}
                <span style={{ color: "var(--color-text-muted)", fontSize: "0.8125rem" }}>
                  {" — "}
                  {flight.departureAt.slice(0, 16).replace("T", " ")}
                </span>
              </li>
            ))}
          </ul>
        </section>
      ) : null}

      {daysWithStops.length > 0 ? (
        <section style={sectionStyle}>
          <h2 style={{ fontSize: "1.0625rem", margin: 0 }}>🗺️ מסלול לפי ימים</h2>
          <div style={{ display: "flex", flexDirection: "column", gap: "0.75rem" }}>
            {daysWithStops.map((day) => (
              <div key={day.date}>
                <div style={{ fontWeight: 600, fontSize: "0.875rem", marginBottom: "0.25rem" }}>{day.date}</div>
                <ol style={{ margin: 0, paddingInlineStart: "1.25rem", display: "flex", flexDirection: "column", gap: "0.125rem" }}>
                  {day.stops.map((stop) => (
                    <li key={stop.id} style={{ fontSize: "0.875rem" }}>
                      {stop.placeId ? (placeNameById.get(stop.placeId) ?? "מקום") : "מקום"}
                    </li>
                  ))}
                </ol>
              </div>
            ))}
          </div>
        </section>
      ) : null}

      {hotelStays.length === 0 && flights.length === 0 && daysWithStops.length === 0 ? (
        <p style={{ color: "var(--color-text-muted)", fontSize: "0.875rem" }}>אין עדיין פרטי מסלול להצגה בטיול הזה.</p>
      ) : null}
    </SharedPageLayout>
  );
}
