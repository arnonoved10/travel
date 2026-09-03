"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { ScreenShell, ScreenHeader, PillTabs, Card, Badge, ChevronIcon, DocumentIcon, PrimaryButton, COLOR, SPACE } from "../design-system";
import { bookingsByCategory, CATEGORY_LABEL, type Booking, type BookingCategory } from "../bookings-data";
import { today } from "../wallet-data";
import { TripSwitcherPill } from "../trip-switcher";

const TABS: { key: "all" | "upcoming" | "history"; label: string }[] = [
  { key: "upcoming", label: "קרובות" },
  { key: "all", label: "הכל" },
  { key: "history", label: "היסטוריה" },
];

const STATUS_BADGE: Record<Booking["status"], { tone: "success" | "warning" | "danger"; label: string }> = {
  confirmed: { tone: "success", label: "מאושר" },
  pending: { tone: "warning", label: "ממתין" },
  cancelled: { tone: "danger", label: "בוטל" },
};

function isUpcoming(b: Booking) {
  return b.status !== "cancelled" && b.checkIn.slice(0, 10) >= today();
}

export default function BookingsListScreen() {
  const router = useRouter();
  const [tab, setTab] = useState<"all" | "upcoming" | "history">("all");
  const [grouped, setGrouped] = useState<Record<BookingCategory, Booking[]>>({ hotel: [], flight: [], transport: [], car: [], attraction: [] });

  useEffect(() => {
    setGrouped(bookingsByCategory());
  }, []);

  const categories = (Object.keys(grouped) as BookingCategory[])
    .map((cat) => ({ cat, bookings: grouped[cat].filter((b) => (tab === "upcoming" ? isUpcoming(b) : tab === "history" ? !isUpcoming(b) : true)) }))
    .filter((g) => g.bookings.length > 0);

  const totalCount = (Object.keys(grouped) as BookingCategory[]).reduce((s, cat) => s + grouped[cat].length, 0);

  return (
    <ScreenShell>
      <ScreenHeader title="ההזמנות שלי" action={<TripSwitcherPill background={COLOR.card} border={COLOR.border} color={COLOR.textPrimary} />} />
      <PrimaryButton onClick={() => router.push("/bookings/new")}>+ הוספת הזמנה</PrimaryButton>
      <PillTabs options={TABS} value={tab} onChange={setTab} />

      {totalCount === 0 ? (
        <Card style={{ textAlign: "center", color: COLOR.textSecondary, fontSize: "12.5px" }}>אין עדיין הזמנות · לחצו על "הוספת הזמנה" כדי להתחיל</Card>
      ) : categories.length === 0 ? (
        <Card style={{ textAlign: "center", color: COLOR.textSecondary, fontSize: "12.5px" }}>אין הזמנות בקטגוריה הזו</Card>
      ) : (
        <div style={{ display: "flex", flexDirection: "column", gap: SPACE.md }}>
          {categories.map(({ cat, bookings }) => (
            <div key={cat}>
              <div style={{ fontSize: "12.5px", fontWeight: 800, color: COLOR.textSecondary, marginBottom: SPACE.xs }}>
                {CATEGORY_LABEL[cat]} ({bookings.length})
              </div>
              <div style={{ display: "flex", flexDirection: "column", gap: SPACE.sm }}>
                {bookings.map((b) => (
                  <Card key={b.id} onClick={() => router.push(`/bookings/${b.id}`)} style={{ display: "flex", alignItems: "center", gap: SPACE.md, cursor: "pointer" }}>
                    <DocumentIcon color={COLOR.primaryLight} />
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <div style={{ fontSize: "14px", fontWeight: 700, color: COLOR.textPrimary }}>{b.title}</div>
                      <div style={{ fontSize: "11px", color: COLOR.textSecondary }}>{fmt(b.checkIn)}</div>
                    </div>
                    <Badge tone={STATUS_BADGE[b.status].tone}>{STATUS_BADGE[b.status].label}</Badge>
                    <ChevronIcon />
                  </Card>
                ))}
              </div>
            </div>
          ))}
        </div>
      )}
    </ScreenShell>
  );
}

function fmt(iso: string) {
  return new Date(iso).toLocaleDateString("he-IL", { day: "2-digit", month: "2-digit", year: "numeric" });
}
