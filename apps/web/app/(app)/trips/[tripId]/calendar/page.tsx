import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import { getCurrentUser } from "@/lib/auth/get-current-user";
import { getBookingRepository, getPlannedActivityRepository, getTripRepository } from "@travel-app/data-layer";
import { getTripDayDates } from "@/lib/trip-days";
import { buildCalendarEvents, buildMonthGridDates, groupCalendarEventsByDate, type CalendarEventType } from "@/lib/calendar";

export const dynamic = "force-dynamic";

const EVENT_TYPE_ICONS: Record<CalendarEventType, string> = {
  hotel_checkin: "🏨→",
  hotel_checkout: "🏨←",
  flight: "✈️",
  transport: "🚕",
  planned_activity: "📌",
};

const WEEKDAY_LABELS = ["א׳", "ב׳", "ג׳", "ד׳", "ה׳", "ו׳", "ש׳"];

function monthLabel(year: number, month1to12: number): string {
  const MONTH_NAMES = [
    "ינואר", "פברואר", "מרץ", "אפריל", "מאי", "יוני", "יולי", "אוגוסט", "ספטמבר", "אוקטובר", "נובמבר", "דצמבר",
  ];
  return `${MONTH_NAMES[month1to12 - 1]} ${year}`;
}

function addMonths(year: number, month1to12: number, delta: number): { year: number; month: number } {
  const total = year * 12 + (month1to12 - 1) + delta;
  return { year: Math.floor(total / 12), month: (total % 12) + 1 };
}

export default async function TripCalendarPage({
  params,
  searchParams,
}: {
  params: Promise<{ tripId: string }>;
  searchParams: Promise<{ month?: string }>;
}) {
  const user = await getCurrentUser();
  if (!user) redirect("/login");

  const { tripId } = await params;
  const { month: monthParam } = await searchParams;

  const tripRepository = await getTripRepository();
  const trip = await tripRepository.getById({ userId: user.id, tripId });
  if (!trip) notFound();

  const [year, month] = (monthParam && /^\d{4}-\d{2}$/.test(monthParam) ? monthParam : trip.startDate.slice(0, 7))
    .split("-")
    .map(Number) as [number, number];

  const bookingRepository = await getBookingRepository();
  const plannedActivityRepository = await getPlannedActivityRepository();
  const [hotelStays, flights, transportBookings, plannedActivities] = await Promise.all([
    bookingRepository.listHotelStays({ tripId }),
    bookingRepository.listFlights({ tripId }),
    bookingRepository.listTransportBookings({ tripId }),
    plannedActivityRepository.listForTrip({ tripId }),
  ]);

  const events = buildCalendarEvents({ hotelStays, flights, transportBookings, plannedActivities });
  const eventsByDate = groupCalendarEventsByDate(events);

  const tripDayDates = new Set(getTripDayDates(trip.startDate, trip.endDate));
  const gridDates = buildMonthGridDates(year, month);
  const today = new Date().toISOString().slice(0, 10);

  const prev = addMonths(year, month, -1);
  const next = addMonths(year, month, 1);

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: "1rem" }}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", flexWrap: "wrap", gap: "0.5rem" }}>
        <h1 style={{ marginTop: 0, marginBottom: 0 }}>
          <Link href={`/trips/${tripId}`} style={{ color: "var(--color-text-muted)", fontSize: "0.875rem", display: "block" }}>
            ← {trip.name}
          </Link>
          לוח שנה
        </h1>
        <div style={{ display: "flex", gap: "0.5rem", alignItems: "center" }}>
          <Link
            href={`/trips/${tripId}/calendar?month=${String(prev.year).padStart(4, "0")}-${String(prev.month).padStart(2, "0")}`}
            style={{ padding: "0.375rem 0.75rem", borderRadius: "var(--radius-full)", border: "1px solid var(--color-border)", background: "var(--color-surface)", textDecoration: "none", fontWeight: 600 }}
          >
            ‹ קודם
          </Link>
          <span style={{ fontWeight: 600, minWidth: "8rem", textAlign: "center" }}>{monthLabel(year, month)}</span>
          <Link
            href={`/trips/${tripId}/calendar?month=${String(next.year).padStart(4, "0")}-${String(next.month).padStart(2, "0")}`}
            style={{ padding: "0.375rem 0.75rem", borderRadius: "var(--radius-full)", border: "1px solid var(--color-border)", background: "var(--color-surface)", textDecoration: "none", fontWeight: 600 }}
          >
            הבא ›
          </Link>
        </div>
      </div>

      <div style={{ display: "grid", gridTemplateColumns: "repeat(7, 1fr)", gap: "0.375rem" }}>
        {WEEKDAY_LABELS.map((label) => (
          <div key={label} style={{ textAlign: "center", fontSize: "0.75rem", color: "var(--color-text-muted)", fontWeight: 600 }}>
            {label}
          </div>
        ))}

        {gridDates.map((date) => {
          const inMonth = date.slice(0, 7) === `${String(year).padStart(4, "0")}-${String(month).padStart(2, "0")}`;
          const inTrip = tripDayDates.has(date);
          const dayEvents = eventsByDate.get(date) ?? [];
          const dayNumber = Number(date.slice(8, 10));
          const isToday = date === today;

          const cellContent = (
            <div
              style={{
                minHeight: "72px",
                padding: "0.375rem",
                borderRadius: "var(--radius-md)",
                border: isToday ? "1px solid var(--color-primary)" : "1px solid var(--color-border)",
                background: inTrip ? "var(--color-surface)" : "transparent",
                opacity: inMonth ? 1 : 0.35,
                display: "flex",
                flexDirection: "column",
                gap: "0.125rem",
              }}
            >
              <div style={{ fontSize: "0.75rem", fontWeight: isToday ? 700 : 400 }}>{dayNumber}</div>
              {dayEvents.slice(0, 3).map((event) => (
                <div key={event.id} title={event.label} style={{ fontSize: "0.6875rem", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                  {EVENT_TYPE_ICONS[event.type]} {event.label}
                </div>
              ))}
              {dayEvents.length > 3 ? (
                <div style={{ fontSize: "0.6875rem", color: "var(--color-text-muted)" }}>+{dayEvents.length - 3} נוספים</div>
              ) : null}
            </div>
          );

          return inTrip ? (
            <Link key={date} href={`/trips/${tripId}/days/${date}`} style={{ color: "inherit" }}>
              {cellContent}
            </Link>
          ) : (
            <div key={date}>{cellContent}</div>
          );
        })}
      </div>

      <p style={{ fontSize: "0.8125rem", color: "var(--color-text-muted)" }}>
        לחיצה על יום בטווח הטיול (מודגש) פותחת את סיכום היום המלא. ימים מחוץ לטיול מוצגים דהויים לצורך הקשר בלבד.
      </p>
    </div>
  );
}
