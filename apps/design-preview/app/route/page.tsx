"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { ScreenShell, ScreenHeader, BottomNav, Card, PrimaryButton, ChevronIcon, COLOR, SPACE } from "../design-system";
import { FlagIcon } from "../country-currency-data";
import { loadStops, type TripStop } from "../trip-content";
import { JAPAN_TRIP } from "../trips-data";

/**
 * מסך "מסלול הטיול" (8) — רשימת-תחנות אמיתית (trip-content.ts, ניתנת
 * לעריכה/שינוי-סדר במסך 9), כל תחנה מקשרת ליומן היומי של היום הראשון שלה
 * (drill-down אמיתי). הוחלף מנתוני-דמו של תאילנד לנתוני יפן לפי חבילת-
 * העיצוב המחייבת.
 */
export default function RoutePreviewScreen() {
  const router = useRouter();
  const [stops, setStops] = useState<TripStop[]>([]);

  useEffect(() => {
    setStops(loadStops());
  }, []);

  return (
    <ScreenShell>
      <ScreenHeader
        title={JAPAN_TRIP.name}
        subtitle={`${fmt(JAPAN_TRIP.startDate)} - ${fmt(JAPAN_TRIP.endDate)} · ${JAPAN_TRIP.nights} לילות`}
        action={<FlagIcon countryCode={JAPAN_TRIP.countryCode} size={26} />}
      />

      <div style={{ display: "flex", flexDirection: "column", gap: "10px" }}>
        {stops.map((stop, i) => (
          <div key={stop.id} style={{ display: "flex", flexDirection: "column", gap: "6px" }}>
            <Card onClick={() => router.push(`/trips/${JAPAN_TRIP.id}/plan?day=${stop.startDate}`)} style={{ display: "flex", alignItems: "center", gap: SPACE.md }}>
              <span
                aria-hidden
                style={{ width: "26px", height: "26px", borderRadius: "50%", background: `${COLOR.primary}22`, border: `1px solid ${COLOR.primary}55`, display: "flex", alignItems: "center", justifyContent: "center", fontSize: "11px", fontWeight: 800, color: COLOR.primaryLight, flexShrink: 0 }}
              >
                {i + 1}
              </span>
              <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{ fontWeight: 700, fontSize: "14px", color: COLOR.textPrimary }}>{stop.city}</div>
                <div style={{ fontSize: "11px", color: COLOR.textSecondary }}>
                  {fmt(stop.startDate)} - {fmt(stop.endDate)}
                </div>
              </div>
              <ChevronIcon />
            </Card>
            {stop.transportToNext ? (
              <div style={{ display: "flex", alignItems: "center", gap: SPACE.sm, paddingInlineStart: "34px", fontSize: "11px", color: COLOR.textSecondary }}>
                <span style={{ width: "1px", height: "14px", background: COLOR.border }} />
                {stop.transportToNext}
              </div>
            ) : null}
          </div>
        ))}
      </div>

      <PrimaryButton onClick={() => router.push("/route/reorder")}>עריכת מסלול</PrimaryButton>

      <BottomNav active={null} />
    </ScreenShell>
  );
}

function fmt(iso: string) {
  return new Date(iso).toLocaleDateString("he-IL", { day: "2-digit", month: "2-digit" });
}
