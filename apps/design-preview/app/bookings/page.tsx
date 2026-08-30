"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { ScreenShell, ScreenHeader, PillTabs, Card, Badge, ChevronIcon, DocumentIcon, COLOR, SPACE } from "../design-system";
import { bookingsByCategory, CATEGORY_LABEL, type BookingCategory } from "../bookings-data";

const TABS: { key: "all" | "upcoming" | "history"; label: string }[] = [
  { key: "upcoming", label: "קרובות" },
  { key: "all", label: "הכל" },
  { key: "history", label: "היסטוריה" },
];

export default function BookingsListScreen() {
  const router = useRouter();
  const [tab, setTab] = useState<"all" | "upcoming" | "history">("all");
  const [grouped, setGrouped] = useState<Record<BookingCategory, ReturnType<typeof bookingsByCategory>["hotel"]>>({ hotel: [], flight: [], transport: [], car: [], attraction: [] });

  useEffect(() => {
    setGrouped(bookingsByCategory());
  }, []);

  return (
    <ScreenShell>
      <ScreenHeader title="ההזמנות שלי" />
      <PillTabs options={TABS} value={tab} onChange={setTab} />
      <div style={{ display: "flex", flexDirection: "column", gap: SPACE.sm }}>
        {(Object.keys(grouped) as BookingCategory[])
          .filter((cat) => grouped[cat].length > 0)
          .map((cat) => (
            <Card key={cat} onClick={() => router.push(`/bookings/${grouped[cat][0]!.id}`)} style={{ display: "flex", alignItems: "center", gap: SPACE.md }}>
              <DocumentIcon color={COLOR.primaryLight} />
              <div style={{ flex: 1 }}>
                <div style={{ fontSize: "14px", fontWeight: 700, color: COLOR.textPrimary }}>{CATEGORY_LABEL[cat]}</div>
                <div style={{ fontSize: "11px", color: COLOR.textSecondary }}>{fmt(grouped[cat][0]!.checkIn)}</div>
              </div>
              <Badge tone="primary">הזמנה {grouped[cat].length}</Badge>
              <ChevronIcon />
            </Card>
          ))}
      </div>
    </ScreenShell>
  );
}

function fmt(iso: string) {
  return new Date(iso).toLocaleDateString("he-IL", { day: "2-digit", month: "2-digit", year: "numeric" });
}
