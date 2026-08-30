"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { ScreenShell, BottomNav, PageTitle, Card, Badge, PillTabs, COLOR, SPACE } from "../design-system";
import { FlagIcon } from "../country-currency-data";
import { allTrips, type DemoTrip, type TripStatus } from "../trips-data";

const TABS: { key: TripStatus; label: string }[] = [
  { key: "upcoming", label: "הבאים" },
  { key: "active", label: "פעילים" },
  { key: "completed", label: "הסתיימו" },
];

export default function TripsListScreen() {
  const router = useRouter();
  const [tab, setTab] = useState<TripStatus>("upcoming");
  const [trips, setTrips] = useState<DemoTrip[]>([]);

  useEffect(() => {
    setTrips(allTrips());
  }, []);

  const shown = trips.filter((t) => t.status === tab);

  return (
    <ScreenShell>
      <PageTitle title="הטיולים שלי" />
      <PillTabs options={TABS} value={tab} onChange={setTab} />
      <div style={{ display: "flex", flexDirection: "column", gap: SPACE.sm }}>
        {shown.length === 0 ? (
          <Card style={{ textAlign: "center", color: COLOR.textSecondary, fontSize: "13px" }}>אין טיולים בקטגוריה הזו</Card>
        ) : (
          shown.map((trip) => (
            <Card key={trip.id} onClick={() => router.push(`/trips/${trip.id}`)} style={{ display: "flex", alignItems: "center", gap: SPACE.md }}>
              <FlagIcon countryCode={trip.countryCode} size={30} />
              <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{ fontSize: "14.5px", fontWeight: 700, color: COLOR.textPrimary }}>{trip.name}</div>
                <div style={{ fontSize: "11.5px", color: COLOR.textSecondary, marginTop: "2px" }}>
                  {fmt(trip.startDate)} - {fmt(trip.endDate)}
                </div>
              </div>
              <Badge tone="primary">{trip.nights} לילות</Badge>
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
