import Link from "next/link";
import { redirect } from "next/navigation";
import { getCurrentUser } from "@/lib/auth/get-current-user";
import { getTripRepository } from "@travel-app/data-layer";
import { DatePicker } from "@/components/ui/DatePicker";
import { RestoreTripButton } from "./restore-trip-button";

export const dynamic = "force-dynamic";

export default async function TripsPage({ searchParams }: { searchParams: Promise<{ from?: string; to?: string }> }) {
  const user = await getCurrentUser();
  if (!user) redirect("/login");

  const { from, to } = await searchParams;
  const tripRepository = await getTripRepository();
  const allTrips = await tripRepository.list({ userId: user.id, includeDeleted: true });
  const activeTripsUnfiltered = allTrips.filter((t) => t.deletedAt === null);
  const deletedTrips = allTrips.filter((t) => t.deletedAt !== null);

  const activeTrips = activeTripsUnfiltered.filter((t) => {
    if (from && t.endDate < from) return false;
    if (to && t.startDate > to) return false;
    return true;
  });

  return (
    <div>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", flexWrap: "wrap", gap: "0.5rem" }}>
        <h1 style={{ marginTop: 0 }}>הטיולים שלי</h1>
        <div style={{ display: "flex", gap: "0.5rem" }}>
          <Link href="/trips/compare" style={{ padding: "0.5rem 1rem", color: "var(--color-text)", fontSize: "0.875rem" }}>
            📊 השווה טיולים
          </Link>
          <Link
            href="/trips/new"
            style={{
              padding: "0.5rem 1rem",
              borderRadius: "var(--radius-full)",
              background: "var(--gradient-brand)",
              boxShadow: "var(--glow-brand)",
              color: "#fff",
              textDecoration: "none",
              fontWeight: 700,
            }}
          >
            + טיול חדש
          </Link>
        </div>
      </div>

      <form
        method="get"
        style={{ display: "flex", gap: "0.5rem", alignItems: "flex-end", flexWrap: "wrap", margin: "0.75rem 0" }}
      >
        <label style={{ display: "flex", flexDirection: "column", gap: "0.25rem", fontSize: "0.8125rem" }}>
          מתאריך
          <DatePicker name="from" defaultValue={from} style={{ width: "10rem" }} />
        </label>
        <label style={{ display: "flex", flexDirection: "column", gap: "0.25rem", fontSize: "0.8125rem" }}>
          עד תאריך
          <DatePicker name="to" defaultValue={to} style={{ width: "10rem" }} />
        </label>
        <button type="submit" style={filterButtonStyle}>
          סנן
        </button>
        {from || to ? (
          <Link href="/trips" style={{ fontSize: "0.8125rem", color: "var(--color-text-muted)" }}>
            נקה סינון
          </Link>
        ) : null}
      </form>

      <p style={{ color: "var(--color-text-muted)" }}>
        {activeTrips.length} טיולים{from || to ? ` (מתוך ${activeTripsUnfiltered.length})` : ""}
      </p>

      <ul style={{ listStyle: "none", padding: 0, display: "flex", flexDirection: "column", gap: "0.75rem" }}>
        {activeTrips.map((trip) => (
          <li key={trip.id}>
            <Link
              href={`/trips/${trip.id}`}
              style={{
                display: "block",
                padding: "1rem",
                border: "1px solid var(--color-border)",
                borderRadius: "10px",
                background: "var(--color-surface)",
                color: "inherit",
                textDecoration: "none",
              }}
            >
              <div style={{ fontWeight: 600 }}>{trip.name}</div>
              <div style={{ color: "var(--color-text-muted)", fontSize: "0.875rem" }}>
                {trip.startDate} — {trip.endDate}
              </div>
            </Link>
          </li>
        ))}
        {activeTrips.length === 0 && (from || to) ? (
          <p style={{ color: "var(--color-text-muted)" }}>אין טיולים בטווח התאריכים שנבחר.</p>
        ) : null}
      </ul>

      {deletedTrips.length > 0 ? (
        <details style={{ marginTop: "2rem" }}>
          <summary style={{ cursor: "pointer", color: "var(--color-text-muted)" }}>
            טיולים שנמחקו ({deletedTrips.length})
          </summary>
          <ul style={{ listStyle: "none", padding: 0, display: "flex", flexDirection: "column", gap: "0.5rem", marginTop: "0.75rem" }}>
            {deletedTrips.map((trip) => (
              <li
                key={trip.id}
                style={{
                  display: "flex",
                  justifyContent: "space-between",
                  alignItems: "center",
                  padding: "0.75rem",
                  border: "1px solid var(--color-border)",
                  borderRadius: "var(--radius-md)",
                }}
              >
                <span style={{ color: "var(--color-text-muted)" }}>{trip.name}</span>
                <RestoreTripButton tripId={trip.id} />
              </li>
            ))}
          </ul>
        </details>
      ) : null}
    </div>
  );
}

const filterButtonStyle: React.CSSProperties = {
  padding: "0.5rem 1rem",
  borderRadius: "var(--radius-full)",
  border: "1px solid var(--color-border)",
  background: "var(--color-surface)",
  color: "var(--color-text-primary)",
  fontWeight: 600,
  cursor: "pointer",
};
