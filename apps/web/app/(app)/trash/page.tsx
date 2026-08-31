import { redirect } from "next/navigation";
import { getCurrentUser } from "@/lib/auth/get-current-user";
import {
  getBookingRepository,
  getContactRepository,
  getDocumentRepository,
  getFinanceRepository,
  getIntegrationAccountRepository,
  getLoyaltyProgramRepository,
  getPlaceRepository,
  getPlannedActivityRepository,
  getTripRepository,
} from "@travel-app/data-layer";
import { getExpenseCategoryLabel } from "@/lib/expense-labels";
import { RENTAL_VEHICLE_TYPE_LABELS } from "@/lib/rental-vehicle-type-labels";
import { DOCUMENT_TYPE_LABELS, DOCUMENT_ENTITY_TYPE_LABELS } from "@/lib/document-labels";
import { INTEGRATION_SERVICE_LABELS } from "@/lib/integration-account-labels";
import {
  restoreActivityReservationAction,
  restoreCarRentalAction,
  restoreContactAction,
  restoreDocumentAction,
  restoreExpenseAction,
  restoreFlightAction,
  restoreHotelStayAction,
  restoreInsuranceAction,
  restoreIntegrationAccountFromTrashAction,
  restoreLoyaltyProgramFromTrashAction,
  restorePaymentAction,
  restorePlaceAction,
  restorePlannedActivityAction,
  restoreTransportBookingAction,
} from "./actions";
import { PAYMENT_METHOD_LABELS } from "@/lib/payment-method-labels";

export const dynamic = "force-dynamic";

function RestoreButton({ action }: { action: () => Promise<void> }) {
  return (
    <form action={action}>
      <button
        type="submit"
        style={{
          padding: "0.25rem 0.75rem",
          borderRadius: "var(--radius-full)",
          border: "1px solid color-mix(in srgb, var(--color-primary) 30%, transparent)",
          background: "color-mix(in srgb, var(--color-primary) 14%, transparent)",
          color: "var(--color-primary)",
          fontWeight: 600,
          cursor: "pointer",
          fontSize: "0.8125rem",
        }}
      >
        שחזר
      </button>
    </form>
  );
}

function TrashSection({ title, items }: { title: string; items: { key: string; label: string; detail: string; action: () => Promise<void> }[] }) {
  if (items.length === 0) return null;
  return (
    <section>
      <h2 style={{ fontSize: "1rem" }}>
        {title} ({items.length})
      </h2>
      <ul style={{ listStyle: "none", padding: 0, display: "flex", flexDirection: "column", gap: "0.375rem" }}>
        {items.map((item) => (
          <li
            key={item.key}
            style={{
              display: "flex",
              justifyContent: "space-between",
              alignItems: "center",
              padding: "0.625rem 0.75rem",
              borderRadius: "var(--radius-md)",
              background: "var(--color-surface)",
              border: "1px solid var(--color-border)",
            }}
          >
            <div>
              <div style={{ fontWeight: 600 }}>{item.label}</div>
              <div style={{ color: "var(--color-text-muted)", fontSize: "0.8125rem" }}>{item.detail}</div>
            </div>
            <RestoreButton action={item.action} />
          </li>
        ))}
      </ul>
    </section>
  );
}

export default async function TrashPage() {
  const user = await getCurrentUser();
  if (!user) redirect("/login");

  const [
    tripRepository,
    bookingRepository,
    financeRepository,
    placeRepository,
    plannedActivityRepository,
    documentRepository,
    contactRepository,
    loyaltyProgramRepository,
    integrationAccountRepository,
  ] = await Promise.all([
    getTripRepository(),
    getBookingRepository(),
    getFinanceRepository(),
    getPlaceRepository(),
    getPlannedActivityRepository(),
    getDocumentRepository(),
    getContactRepository(),
    getLoyaltyProgramRepository(),
    getIntegrationAccountRepository(),
  ]);

  const trips = await tripRepository.list({ userId: user.id });
  const tripNameById = new Map(trips.map((t) => [t.id, t.name]));

  const perTrip = await Promise.all(
    trips.map(async (trip) => ({
      tripId: trip.id,
      hotelStays: await bookingRepository.listHotelStays({ tripId: trip.id, includeDeleted: true }),
      flights: await bookingRepository.listFlights({ tripId: trip.id, includeDeleted: true }),
      transportBookings: await bookingRepository.listTransportBookings({ tripId: trip.id, includeDeleted: true }),
      insurances: await bookingRepository.listInsurances({ tripId: trip.id, includeDeleted: true }),
      activityReservations: await bookingRepository.listActivityReservations({ tripId: trip.id, includeDeleted: true }),
      carRentals: await bookingRepository.listCarRentals({ tripId: trip.id, includeDeleted: true }),
      expenses: await financeRepository.listExpenses({ tripId: trip.id, includeDeleted: true }),
      payments: await financeRepository.listPaymentsByTrip({ tripId: trip.id, includeDeleted: true }),
      plannedActivities: await plannedActivityRepository.listForTrip({ tripId: trip.id, includeDeleted: true }),
      documents: await documentRepository.listForTrip({ tripId: trip.id, includeDeleted: true }),
    })),
  );

  const allPlaces = await placeRepository.list({ userId: user.id, includeDeleted: true });
  const allContacts = await contactRepository.list({ userId: user.id, includeDeleted: true });
  const allLoyaltyPrograms = await loyaltyProgramRepository.list({ userId: user.id, includeDeleted: true });
  const allIntegrationAccounts = await integrationAccountRepository.list({ userId: user.id, includeDeleted: true });

  const deletedPlaces = allPlaces
    .filter((p) => p.deletedAt !== null)
    .map((p) => ({ key: p.id, label: p.name, detail: `נמחק ב-${new Date(p.deletedAt!).toLocaleDateString("he-IL")}`, action: restorePlaceAction.bind(null, p.id) }));

  const deletedLoyaltyPrograms = allLoyaltyPrograms
    .filter((p) => p.deletedAt !== null)
    .map((p) => ({
      key: p.id,
      label: p.programName,
      detail: `נמחק ב-${new Date(p.deletedAt!).toLocaleDateString("he-IL")}`,
      action: restoreLoyaltyProgramFromTrashAction.bind(null, p.id),
    }));

  const deletedIntegrationAccounts = allIntegrationAccounts
    .filter((a) => a.deletedAt !== null)
    .map((a) => ({
      key: a.id,
      label: INTEGRATION_SERVICE_LABELS[a.serviceName],
      detail: a.emailOrUsername ?? `נמחק ב-${new Date(a.deletedAt!).toLocaleDateString("he-IL")}`,
      action: restoreIntegrationAccountFromTrashAction.bind(null, a.id),
    }));

  const deletedContacts = allContacts
    .filter((c) => c.deletedAt !== null)
    .map((c) => ({
      key: c.id,
      label: c.name,
      detail: [c.company, c.role].filter(Boolean).join(" · ") || `נמחק ב-${new Date(c.deletedAt!).toLocaleDateString("he-IL")}`,
      action: restoreContactAction.bind(null, c.id),
    }));

  const deletedDocuments = perTrip.flatMap((t) =>
    t.documents
      .filter((d) => d.deletedAt !== null)
      .map((d) => ({
        key: d.id,
        label: d.fileName ?? DOCUMENT_TYPE_LABELS[d.documentType] ?? d.documentType,
        detail: `${tripNameById.get(t.tripId) ?? ""} · ${DOCUMENT_TYPE_LABELS[d.documentType] ?? d.documentType} · ${DOCUMENT_ENTITY_TYPE_LABELS[d.entityType] ?? d.entityType}`,
        action: restoreDocumentAction.bind(null, d.id),
      })),
  );

  const deletedHotelStays = perTrip.flatMap((t) =>
    t.hotelStays
      .filter((h) => h.deletedAt !== null)
      .map((h) => ({
        key: h.id,
        label: h.hotelName,
        detail: `${tripNameById.get(t.tripId) ?? ""} · ${h.checkInDate}–${h.checkOutDate}`,
        action: restoreHotelStayAction.bind(null, h.id),
      })),
  );

  const deletedFlights = perTrip.flatMap((t) =>
    t.flights
      .filter((f) => f.deletedAt !== null)
      .map((f) => ({
        key: f.id,
        label: `${f.airline}${f.flightNumber ? ` ${f.flightNumber}` : ""}`,
        detail: `${tripNameById.get(t.tripId) ?? ""} · ${f.departureAirport}→${f.arrivalAirport}`,
        action: restoreFlightAction.bind(null, f.id),
      })),
  );

  const deletedTransportBookings = perTrip.flatMap((t) =>
    t.transportBookings
      .filter((tb) => tb.deletedAt !== null)
      .map((tb) => ({
        key: tb.id,
        label: [tb.pickupText, tb.dropoffText].filter(Boolean).join(" ← ") || tb.mode,
        detail: `${tripNameById.get(t.tripId) ?? ""} · ${tb.mode}`,
        action: restoreTransportBookingAction.bind(null, tb.id),
      })),
  );

  const deletedInsurances = perTrip.flatMap((t) =>
    t.insurances
      .filter((i) => i.deletedAt !== null)
      .map((i) => ({
        key: i.id,
        label: i.company,
        detail: `${tripNameById.get(t.tripId) ?? ""} · ${i.startDate}–${i.endDate}`,
        action: restoreInsuranceAction.bind(null, i.id),
      })),
  );

  const deletedActivityReservations = perTrip.flatMap((t) =>
    t.activityReservations
      .filter((a) => a.deletedAt !== null)
      .map((a) => ({
        key: a.id,
        label: a.venueName,
        detail: `${tripNameById.get(t.tripId) ?? ""} · ${a.activityDate}`,
        action: restoreActivityReservationAction.bind(null, a.id),
      })),
  );

  const deletedCarRentals = perTrip.flatMap((t) =>
    t.carRentals
      .filter((c) => c.deletedAt !== null)
      .map((c) => ({
        key: c.id,
        label: `${RENTAL_VEHICLE_TYPE_LABELS[c.vehicleType]} · ${c.companyName}`,
        detail: `${tripNameById.get(t.tripId) ?? ""} · איסוף ${new Date(c.pickupAt).toLocaleDateString("he-IL")}`,
        action: restoreCarRentalAction.bind(null, c.id),
      })),
  );

  const deletedExpenses = perTrip.flatMap((t) =>
    t.expenses
      .filter((e) => e.deletedAt !== null)
      .map((e) => ({
        key: e.id,
        label: e.description ?? getExpenseCategoryLabel(e.category),
        detail: `${tripNameById.get(t.tripId) ?? ""} · ${e.amount} ${e.currencyCode}`,
        action: restoreExpenseAction.bind(null, e.id),
      })),
  );

  const deletedPayments = perTrip.flatMap((t) =>
    t.payments
      .filter((p) => p.deletedAt !== null)
      .map((p) => ({
        key: p.id,
        label: `${p.amount} ${p.currencyCode} · ${PAYMENT_METHOD_LABELS[p.paymentMethod] ?? p.paymentMethod}`,
        detail: `${tripNameById.get(t.tripId) ?? ""} · ${new Date(p.paymentAt).toLocaleDateString("he-IL")}`,
        action: restorePaymentAction.bind(null, p.id),
      })),
  );

  const deletedPlannedActivities = perTrip.flatMap((t) =>
    t.plannedActivities
      .filter((a) => a.deletedAt !== null)
      .map((a) => ({
        key: a.id,
        label: a.name,
        detail: tripNameById.get(t.tripId) ?? "",
        action: restorePlannedActivityAction.bind(null, a.id),
      })),
  );

  const totalCount =
    deletedPlaces.length +
    deletedContacts.length +
    deletedLoyaltyPrograms.length +
    deletedIntegrationAccounts.length +
    deletedHotelStays.length +
    deletedFlights.length +
    deletedTransportBookings.length +
    deletedInsurances.length +
    deletedActivityReservations.length +
    deletedCarRentals.length +
    deletedExpenses.length +
    deletedPayments.length +
    deletedPlannedActivities.length +
    deletedDocuments.length;

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: "1.5rem" }}>
      <div>
        <h1 style={{ marginTop: 0, marginBottom: "0.25rem" }}>פח</h1>
        <p style={{ color: "var(--color-text-muted)" }}>
          כל הפריטים שנמחקו (Soft Delete) בטיולים הפעילים שלך + מקומות/אנשי קשר גלובליים — ניתן לשחזר בכל עת. מכסה: מקומות, אנשי קשר, מלונות,
          טיסות, הסעות, ביטוחים, השכרות רכב, הוצאות, תשלומים, תכנון עתידי, מסמכים. הוצאות/הזמנות בטיול שנמחק לגמרי לא מוצגות כאן — שחזר קודם את
          הטיול עצמו.
        </p>
      </div>

      {totalCount === 0 ? (
        <p style={{ color: "var(--color-text-muted)" }}>הפח ריק — אין פריטים מחוקים כרגע.</p>
      ) : (
        <>
          <TrashSection title="מקומות" items={deletedPlaces} />
          <TrashSection title="אנשי קשר" items={deletedContacts} />
          <TrashSection title="נקודות/מיילים" items={deletedLoyaltyPrograms} />
          <TrashSection title="חשבונות חיצוניים" items={deletedIntegrationAccounts} />
          <TrashSection title="מלונות" items={deletedHotelStays} />
          <TrashSection title="טיסות" items={deletedFlights} />
          <TrashSection title="הסעות" items={deletedTransportBookings} />
          <TrashSection title="ביטוחים" items={deletedInsurances} />
          <TrashSection title="אטרקציות וכרטיסים" items={deletedActivityReservations} />
          <TrashSection title="השכרות רכב" items={deletedCarRentals} />
          <TrashSection title="הוצאות" items={deletedExpenses} />
          <TrashSection title="תשלומים" items={deletedPayments} />
          <TrashSection title="תכנון עתידי" items={deletedPlannedActivities} />
          <TrashSection title="מסמכים" items={deletedDocuments} />
        </>
      )}
    </div>
  );
}
