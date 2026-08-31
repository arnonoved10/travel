import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import { getCurrentUser } from "@/lib/auth/get-current-user";
import { getBookingRepository, getSharedInboxRepository, getTripRepository } from "@travel-app/data-layer";
import { DOCUMENT_ENTITY_TYPE_LABELS } from "@/lib/document-labels";
import { TRANSPORT_MODE_LABELS } from "@/lib/transport-mode-labels";
import { DiscardSharedItemButton } from "../discard-shared-item-button";
import { AssignSharedItemForm, type TripOption } from "./assign-shared-item-form";

export const dynamic = "force-dynamic";

function formatDate(iso: string): string {
  return new Date(iso).toLocaleDateString("he-IL");
}

export default async function ShareInboxItemPage({ params }: { params: Promise<{ itemId: string }> }) {
  const { itemId } = await params;
  const user = await getCurrentUser();
  if (!user) redirect("/login");

  const sharedInboxRepository = await getSharedInboxRepository();
  const item = await sharedInboxRepository.getById({ userId: user.id, itemId });
  if (!item) notFound();

  const tripRepository = await getTripRepository();
  const bookingRepository = await getBookingRepository();
  const trips = await tripRepository.list({ userId: user.id });

  const tripOptions: TripOption[] = await Promise.all(
    trips.map(async (trip) => {
      const [hotelStays, flights, transportBookings, insurances, activityReservations, carRentals] = await Promise.all([
        bookingRepository.listHotelStays({ tripId: trip.id }),
        bookingRepository.listFlights({ tripId: trip.id }),
        bookingRepository.listTransportBookings({ tripId: trip.id }),
        bookingRepository.listInsurances({ tripId: trip.id }),
        bookingRepository.listActivityReservations({ tripId: trip.id }),
        bookingRepository.listCarRentals({ tripId: trip.id }),
      ]);

      const allGroups: TripOption["entityGroups"] = [
        { entityType: "trip", label: DOCUMENT_ENTITY_TYPE_LABELS.trip, entities: [{ id: trip.id, label: trip.name }] },
        {
          entityType: "hotel_stay",
          label: DOCUMENT_ENTITY_TYPE_LABELS.hotel_stay,
          entities: hotelStays.map((h) => ({ id: h.id, label: `${h.hotelName} · ${formatDate(h.checkInDate)}` })),
        },
        {
          entityType: "flight",
          label: DOCUMENT_ENTITY_TYPE_LABELS.flight,
          entities: flights.map((f) => ({
            id: f.id,
            label: `${f.airline}${f.flightNumber ? " " + f.flightNumber : ""} · ${f.departureAirport}→${f.arrivalAirport}`,
          })),
        },
        {
          entityType: "transport_booking",
          label: DOCUMENT_ENTITY_TYPE_LABELS.transport_booking,
          entities: transportBookings.map((t) => ({
            id: t.id,
            label: `${TRANSPORT_MODE_LABELS[t.mode] ?? t.mode}${t.companyName ? " · " + t.companyName : ""} · ${formatDate(t.pickupAt)}`,
          })),
        },
        {
          entityType: "insurance",
          label: DOCUMENT_ENTITY_TYPE_LABELS.insurance,
          entities: insurances.map((i) => ({ id: i.id, label: `${i.company}${i.policyType ? " · " + i.policyType : ""}` })),
        },
        {
          entityType: "activity_reservation",
          label: DOCUMENT_ENTITY_TYPE_LABELS.activity_reservation,
          entities: activityReservations.map((a) => ({ id: a.id, label: `${a.venueName} · ${formatDate(a.activityDate)}` })),
        },
        {
          entityType: "car_rental",
          label: DOCUMENT_ENTITY_TYPE_LABELS.car_rental,
          entities: carRentals.map((c) => ({ id: c.id, label: `${c.companyName}${c.model ? " " + c.model : ""}` })),
        },
      ];
      const entityGroups = allGroups.filter((group) => group.entities.length > 0);

      return { tripId: trip.id, tripName: trip.name, entityGroups };
    }),
  );

  const defaultNotes = [item.sharedTitle, item.sharedText, item.sharedUrl].filter(Boolean).join("\n");

  return (
    <div>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
        <h1 style={{ marginTop: 0 }}>שיוך פריט משותף</h1>
        <DiscardSharedItemButton itemId={item.id} />
      </div>

      <div
        style={{
          display: "flex",
          gap: "1rem",
          alignItems: "flex-start",
          padding: "1rem",
          border: "1px solid var(--color-border)",
          borderRadius: "10px",
          background: "var(--color-surface)",
          marginBottom: "1.25rem",
        }}
      >
        {item.fileUrl && item.mimeType?.startsWith("image/") ? (
          // eslint-disable-next-line @next/next/no-img-element -- data: URI ב-Mock, לא ניתן ל-next/image לאופטימיזציה
          <img src={item.fileUrl} alt="תצוגה מקדימה" style={{ width: "120px", height: "120px", objectFit: "cover", borderRadius: "8px" }} />
        ) : item.fileUrl ? (
          <a href={item.fileUrl} target="_blank" rel="noopener noreferrer" style={{ fontSize: "0.875rem" }}>
            📎 {item.fileName ?? "קובץ מצורף"}
          </a>
        ) : (
          <span style={{ fontSize: "1.5rem" }}>🔗</span>
        )}
        <div style={{ fontSize: "0.875rem", color: "var(--color-text-muted)" }}>
          {item.sharedTitle ? <div style={{ fontWeight: 600, color: "var(--color-text-primary)" }}>{item.sharedTitle}</div> : null}
          {item.sharedText ? <div>{item.sharedText}</div> : null}
          {item.sharedUrl ? (
            <a href={item.sharedUrl} target="_blank" rel="noopener noreferrer" style={{ color: "var(--color-primary)" }}>
              {item.sharedUrl}
            </a>
          ) : null}
          {!item.fileUrl ? (
            <p style={{ color: "var(--color-danger)", marginTop: "0.5rem" }}>
              אין כאן קובץ (רק טקסט/קישור) — אי אפשר לשייך את זה כמסמך. שתפו צילום-מסך או קובץ במקום.
            </p>
          ) : null}
        </div>
      </div>

      {item.fileUrl ? <AssignSharedItemForm itemId={item.id} trips={tripOptions} defaultNotes={defaultNotes} /> : null}

      {item.fileUrl ? (
        <div style={{ marginTop: "1.5rem", paddingTop: "1.25rem", borderTop: "1px solid var(--color-border)" }}>
          <p style={{ color: "var(--color-text-muted)", fontSize: "0.8125rem", marginBottom: "0.5rem" }}>
            או: זו הזמנה חדשה שעדיין לא קיימת במערכת — צור אותה ישירות מהתמונה (השדות שה-OCR זיהה ימולאו-מראש):
          </p>
          <div style={{ display: "flex", gap: "0.5rem" }}>
            <Link href={`/share-inbox/${item.id}/create-hotel`} style={linkButtonStyle}>
              🏨 צור הזמנת מלון חדשה
            </Link>
            <Link href={`/share-inbox/${item.id}/create-flight`} style={linkButtonStyle}>
              ✈️ צור הזמנת טיסה חדשה
            </Link>
          </div>
        </div>
      ) : null}
    </div>
  );
}

const linkButtonStyle: React.CSSProperties = {
  padding: "0.5rem 0.875rem",
  borderRadius: "var(--radius-full)",
  border: "1px solid var(--color-border)",
  background: "var(--color-surface)",
  color: "var(--color-text-primary)",
  textDecoration: "none",
  fontSize: "0.8125rem",
  fontWeight: 600,
};
