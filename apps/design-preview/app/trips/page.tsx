"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { ScreenShell, BottomNav, PageTitle, Card, Badge, PillTabs, COLOR, SPACE } from "../design-system";
import { FlagIcon } from "../country-currency-data";
import { allTrips, setActiveTrip, disambiguatedTripName, tripColor, type DemoTrip, type TripStatus } from "../trips-data";

const TABS: { key: TripStatus; label: string }[] = [
  { key: "active", label: "בהווה" },
  { key: "upcoming", label: "עתידיים" },
  { key: "completed", label: "היסטוריה" },
];

export default function TripsListScreen() {
  const router = useRouter();
  // נפתח כברירת מחדל על "בהווה" — הטיול שמשתמשים בו עכשיו, לא על הבאים.
  const [tab, setTab] = useState<TripStatus>("active");
  const [trips, setTrips] = useState<DemoTrip[]>([]);

  useEffect(() => {
    setTrips(allTrips());
  }, []);

  function handleSetActive(id: string) {
    setActiveTrip(id);
    setTrips(allTrips());
    setTab("active");
  }

  const shown = trips.filter((t) => t.status === tab);

  return (
    <ScreenShell>
      <PageTitle
        title="הטיולים שלי"
        right={
          <button
            type="button"
            onClick={() => router.push("/trips/new")}
            aria-label="טיול חדש"
            style={{ width: "36px", height: "36px", borderRadius: "50%", background: COLOR.primary, border: "none", color: "#fff", fontSize: "20px", fontWeight: 700, cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center" }}
          >
            +
          </button>
        }
      />
      <PillTabs options={TABS} value={tab} onChange={setTab} />
      <div style={{ display: "flex", flexDirection: "column", gap: SPACE.sm }}>
        {shown.length === 0 ? (
          <Card style={{ textAlign: "center", color: COLOR.textSecondary, fontSize: "13px" }}>אין טיולים בקטגוריה הזו</Card>
        ) : (
          shown.map((trip) => (
            <Card key={trip.id} style={{ display: "flex", alignItems: "center", gap: SPACE.md }}>
              <div onClick={() => router.push(`/trips/${trip.id}`)} style={{ display: "flex", alignItems: "center", gap: SPACE.md, flex: 1, minWidth: 0, cursor: "pointer" }}>
                <div style={{ position: "relative", flexShrink: 0 }}>
                  <FlagIcon countryCode={trip.countryCode} size={30} />
                  {trips.filter((t) => t.name === trip.name).length > 1 ? (
                    <span aria-hidden style={{ position: "absolute", bottom: -2, insetInlineEnd: -2, width: "9px", height: "9px", borderRadius: "50%", background: tripColor(trip.id), border: "1.5px solid #0a1024" }} />
                  ) : null}
                </div>
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ fontSize: "14.5px", fontWeight: 700, color: COLOR.textPrimary }}>{disambiguatedTripName(trip, trips)}</div>
                  <div style={{ fontSize: "11.5px", color: COLOR.textSecondary, marginTop: "2px" }}>
                    {fmt(trip.startDate)} - {fmt(trip.endDate)} · {trip.nights} לילות
                  </div>
                </div>
              </div>
              {trip.status === "active" ? (
                <Badge tone="success">✓ פעיל</Badge>
              ) : (
                <button
                  type="button"
                  onClick={() => handleSetActive(trip.id)}
                  style={{ padding: "6px 11px", borderRadius: "999px", background: `${COLOR.primary}22`, border: `1px solid ${COLOR.primary}55`, color: COLOR.primaryLight, fontSize: "11px", fontWeight: 700, cursor: "pointer", flexShrink: 0, whiteSpace: "nowrap" }}
                >
                  הפוך לפעיל
                </button>
              )}
            </Card>
          ))
        )}
      </div>
      <BottomNav active="trips" />
    </ScreenShell>
  );
}

function fmt(iso: string) {
  return new Date(iso).toLocaleDateString("he-IL", { day: "2-digit", month: "2-digit", year: "numeric" });
}
