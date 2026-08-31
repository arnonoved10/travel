import Link from "next/link";
import { Plus } from "@phosphor-icons/react/ssr";
import type { Flight, HotelStay, Trip, TransportBooking } from "@travel-app/shared-types";
import { DashboardCard } from "./dashboard-card";
import { Timeline, type TimelineItem } from "@/components/ui/Timeline";
import { ICON_SIZE } from "@/components/ui/tokens";
import { LiveTimer } from "@/components/live-timer";

export function TodayTimelineCard({
  trip,
  today,
  tonightHotel,
  todayFlights,
  todayTransport,
}: {
  trip: Trip;
  today: string;
  tonightHotel: HotelStay | null;
  todayFlights: Flight[];
  todayTransport: TransportBooking[];
}) {
  const now = new Date();
  const nextFlight = todayFlights
    .filter((f) => new Date(f.departureAt).getTime() > now.getTime())
    .sort((a, b) => a.departureAt.localeCompare(b.departureAt))[0];
  const nextTransport = todayTransport
    .filter((t) => new Date(t.pickupAt).getTime() > now.getTime())
    .sort((a, b) => a.pickupAt.localeCompare(b.pickupAt))[0];
  const nextUp =
    nextFlight && (!nextTransport || nextFlight.departureAt <= nextTransport.pickupAt)
      ? {
          icon: "🛫",
          at: nextFlight.departureAt,
          timezone: nextFlight.departureTimezone,
          label: `${nextFlight.airline} ${nextFlight.flightNumber ?? ""}`.trim(),
        }
      : nextTransport
        ? { icon: "🚕", at: nextTransport.pickupAt, timezone: nextTransport.pickupTimezone, label: nextTransport.pickupText ?? "הסעה" }
        : null;

  const items: TimelineItem[] = [];

  if (tonightHotel) {
    items.push({ id: `hotel-${tonightHotel.id}`, time: "הלילה", title: tonightHotel.hotelName, detail: `עד ${tonightHotel.checkOutDate}`, dotColor: "var(--color-accent-purple)" });
  }
  for (const f of todayFlights) {
    items.push({
      id: `flight-${f.id}`,
      time: new Date(f.departureAt).toLocaleTimeString("he-IL", { hour: "2-digit", minute: "2-digit" }),
      title: `${f.airline} ${f.flightNumber ?? ""}`.trim(),
      detail: `${f.departureAirport} → ${f.arrivalAirport}`,
      dotColor: "var(--color-accent-blue)",
    });
  }
  for (const t of todayTransport) {
    items.push({
      id: `transport-${t.id}`,
      time: new Date(t.pickupAt).toLocaleTimeString("he-IL", { hour: "2-digit", minute: "2-digit" }),
      title: t.pickupText ?? "הסעה",
      detail: t.dropoffText ?? undefined,
      dotColor: "var(--color-warning)",
    });
  }

  return (
    <DashboardCard
      title={`התוכנית של היום — ${today}`}
      action={
        <Link href="/today" style={{ font: "var(--text-caption)", color: "var(--color-primary)", fontWeight: 700 }}>
          המסך המלא ←
        </Link>
      }
    >
      {nextUp ? (
        <div style={{ marginBottom: "var(--space-3)" }}>
          <LiveTimer label={`${nextUp.icon} הבא: ${nextUp.label}`} eventAt={nextUp.at} timezone={nextUp.timezone} />
        </div>
      ) : null}
      {items.length === 0 ? (
        <p style={{ color: "var(--color-text-muted)", font: "var(--text-caption)", margin: 0 }}>
          אין אירועים רשומים להיום ב-{trip.name}.
        </p>
      ) : (
        <Timeline items={items} />
      )}
      <Link
        href={`/trips/${trip.id}#planning`}
        style={{
          display: "flex",
          alignItems: "center",
          gap: "0.375rem",
          marginTop: "var(--space-3)",
          color: "var(--color-primary)",
          font: "var(--text-caption)",
          fontWeight: 700,
          textDecoration: "none",
        }}
      >
        <Plus size={ICON_SIZE.sm} weight="fill" aria-hidden />
        הוסף פעילות
      </Link>
    </DashboardCard>
  );
}
