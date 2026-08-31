import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import { getCurrentUser } from "@/lib/auth/get-current-user";
import { getPlannedActivityRepository, getTripRepository } from "@travel-app/data-layer";
import type { BookingType } from "@travel-app/shared-types";
import { HotelStayForm } from "../../../bookings/hotel-stay-form";
import { FlightForm } from "../../../bookings/flight-form";
import { TransportBookingForm } from "../../../bookings/transport-booking-form";
import { InsuranceForm } from "../../../bookings/insurance-form";
import { ActivityReservationForm } from "../../../bookings/activity-reservation-form";
import { CarRentalForm } from "../../../bookings/car-rental-form";

export const dynamic = "force-dynamic";

const BOOKING_TYPE_OPTIONS: Array<{ type: BookingType; label: string; icon: string }> = [
  { type: "hotel_stay", label: "מלון", icon: "🏨" },
  { type: "flight", label: "טיסה", icon: "✈️" },
  { type: "transport", label: "תחבורה", icon: "🚕" },
  { type: "insurance", label: "ביטוח", icon: "🛡️" },
  { type: "activity_reservation", label: "אטרקציה/כרטיס", icon: "🎟️" },
  { type: "car_rental", label: "השכרת רכב/אופנוע", icon: "🏍️" },
];

// datetime-local דורש "YYYY-MM-DDTHH:mm" בלי שניות/אזור זמן.
function toDatetimeLocalValue(iso: string | null): string | undefined {
  if (!iso) return undefined;
  return iso.slice(0, 16);
}

export default async function ConvertPlannedActivityPage({
  params,
  searchParams,
}: {
  params: Promise<{ tripId: string; plannedActivityId: string }>;
  searchParams: Promise<{ type?: string }>;
}) {
  const user = await getCurrentUser();
  if (!user) redirect("/login");

  const { tripId, plannedActivityId } = await params;
  const { type } = await searchParams;

  const tripRepository = await getTripRepository();
  const trip = await tripRepository.getById({ userId: user.id, tripId });
  if (!trip) notFound();

  const plannedActivityRepository = await getPlannedActivityRepository();
  const activity = await plannedActivityRepository.getById({ plannedActivityId });
  if (!activity || activity.tripId !== tripId) notFound();

  if (activity.bookingId) {
    return (
      <div>
        <h1 style={{ marginTop: 0 }}>המרה להזמנה</h1>
        <p>הפעילות &ldquo;{activity.name}&rdquo; כבר הומרה להזמנה אמיתית.</p>
        <Link href={`/trips/${tripId}`} style={{ color: "var(--color-primary)" }}>
          חזרה לטיול
        </Link>
      </div>
    );
  }

  const selectedType = BOOKING_TYPE_OPTIONS.find((o) => o.type === type);

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: "1rem" }}>
      <div>
        <h1 style={{ marginTop: 0, marginBottom: "0.25rem" }}>המרת &ldquo;{activity.name}&rdquo; להזמנה</h1>
        <p style={{ color: "var(--color-text-muted)" }}>
          <Link href={`/trips/${tripId}`}>{trip.name}</Link> — הפרטים מהתכנון (שם/תאריך/מחיר) ימולאו מראש בטופס; אפשר לערוך לפני
          השמירה. התכנון עצמו נשאר במקומו, רק מקבל קישור להזמנה החדשה.
        </p>
      </div>

      {!selectedType ? (
        <div style={{ display: "flex", gap: "0.5rem", flexWrap: "wrap" }}>
          {BOOKING_TYPE_OPTIONS.map((option) => (
            <Link
              key={option.type}
              href={`/trips/${tripId}/planned-activities/${plannedActivityId}/convert?type=${option.type}`}
              style={{
                padding: "0.75rem 1rem",
                borderRadius: "10px",
                border: "1px solid var(--color-border)",
                background: "var(--color-surface)",
                color: "var(--color-text)",
                textDecoration: "none",
                fontWeight: 600,
              }}
            >
              {option.icon} {option.label}
            </Link>
          ))}
        </div>
      ) : (
        <div style={{ padding: "1rem", border: "1px solid var(--color-border)", borderRadius: "10px", background: "var(--color-surface)" }}>
          <div style={{ marginBottom: "0.75rem" }}>
            <Link
              href={`/trips/${tripId}/planned-activities/${plannedActivityId}/convert`}
              style={{ fontSize: "0.8125rem", color: "var(--color-text-muted)" }}
            >
              ← בחר סוג הזמנה אחר
            </Link>
          </div>

          {selectedType.type === "hotel_stay" ? (
            <HotelStayForm
              tripId={tripId}
              plannedActivityId={plannedActivityId}
              defaultValues={{
                hotelName: activity.name,
                agreedPrice: activity.estimatedPrice ?? undefined,
                agreedCurrencyCode: activity.estimatedCurrencyCode ?? undefined,
              }}
            />
          ) : null}
          {selectedType.type === "flight" ? (
            <FlightForm
              tripId={tripId}
              plannedActivityId={plannedActivityId}
              defaultValues={{ airline: activity.name, departureAt: toDatetimeLocalValue(activity.plannedAt) }}
            />
          ) : null}
          {selectedType.type === "transport" ? (
            <TransportBookingForm
              tripId={tripId}
              plannedActivityId={plannedActivityId}
              defaultValues={{ pickupAt: toDatetimeLocalValue(activity.plannedAt), companyName: activity.name }}
            />
          ) : null}
          {selectedType.type === "insurance" ? (
            <InsuranceForm tripId={tripId} plannedActivityId={plannedActivityId} defaultValues={{ company: activity.name }} />
          ) : null}
          {selectedType.type === "activity_reservation" ? (
            <ActivityReservationForm
              tripId={tripId}
              plannedActivityId={plannedActivityId}
              defaultValues={{ venueName: activity.name }}
            />
          ) : null}
          {selectedType.type === "car_rental" ? (
            <CarRentalForm
              tripId={tripId}
              plannedActivityId={plannedActivityId}
              defaultValues={{ companyName: activity.name, pickupAt: toDatetimeLocalValue(activity.plannedAt) }}
            />
          ) : null}
        </div>
      )}
    </div>
  );
}
