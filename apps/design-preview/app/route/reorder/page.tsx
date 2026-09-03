"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { ScreenShell, ScreenHeader, Card, PrimaryButton, SecondaryButton, COLOR, SPACE } from "../../design-system";
import { FlagIcon } from "../../country-currency-data";
import { loadStops, saveStops, DEFAULT_STOPS, type TripStop } from "../../trip-content";
import { currentScopeTripId } from "../../trips-data";

/**
 * מסך "שינוי סדר היעדים" (9) — גרירה אמיתית באמצעות HTML5 Drag&Drop (לא
 * ויזואלי-בלבד); השינוי נשמר ל-localStorage דרך trip-content.ts, כך
 * שמסך "מסלול הטיול" ומסכי-היומן משקפים את הסדר-החדש בפועל.
 */
export default function ReorderStopsScreen() {
  const router = useRouter();
  const [stops, setStops] = useState<TripStop[]>([]);
  const [dragIndex, setDragIndex] = useState<number | null>(null);
  const [tripId] = useState(() => currentScopeTripId());

  useEffect(() => {
    setStops(loadStops(tripId));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  function move(from: number, to: number) {
    setStops((prev) => {
      const arr = [...prev];
      const [item] = arr.splice(from, 1);
      arr.splice(to, 0, item!);
      return arr;
    });
  }

  function handleSave() {
    saveStops(tripId, stops);
    router.push("/route");
  }

  return (
    <ScreenShell>
      <ScreenHeader title="שינוי סדר היעדים" subtitle="גרור כדי לשנות את הסדר" />

      <div style={{ display: "flex", flexDirection: "column", gap: SPACE.sm }}>
        {stops.map((stop, i) => (
          <Card
            key={stop.id}
            style={{ display: "flex", alignItems: "center", gap: SPACE.md, opacity: dragIndex === i ? 0.5 : 1, cursor: "grab" }}
            onClick={undefined}
          >
            <div
              draggable
              onDragStart={() => setDragIndex(i)}
              onDragOver={(e) => e.preventDefault()}
              onDrop={() => {
                if (dragIndex !== null && dragIndex !== i) move(dragIndex, i);
                setDragIndex(null);
              }}
              style={{ display: "flex", alignItems: "center", gap: SPACE.md, width: "100%" }}
            >
              <DragHandle />
              <span style={{ width: "24px", height: "24px", borderRadius: "50%", background: `${COLOR.primary}22`, display: "flex", alignItems: "center", justifyContent: "center", fontSize: "11px", fontWeight: 800, color: COLOR.primaryLight, flexShrink: 0 }}>{i + 1}</span>
              <FlagIcon countryCode={stop.countryCode} size={22} />
              <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{ fontSize: "13.5px", fontWeight: 700, color: COLOR.textPrimary }}>{stop.city}</div>
                <div style={{ fontSize: "11px", color: COLOR.textSecondary }}>
                  {fmt(stop.startDate)} - {fmt(stop.endDate)}
                </div>
              </div>
            </div>
          </Card>
        ))}
      </div>

      <div style={{ display: "flex", flexDirection: "column", gap: SPACE.sm }}>
        <PrimaryButton onClick={handleSave}>שמור סדר חדש</PrimaryButton>
        <SecondaryButton onClick={() => setStops(DEFAULT_STOPS)}>איפוס לסדר המקורי</SecondaryButton>
      </div>
    </ScreenShell>
  );
}

function fmt(iso: string) {
  return new Date(iso).toLocaleDateString("he-IL", { day: "2-digit", month: "2-digit" });
}

function DragHandle() {
  return (
    <svg width="16" height="16" viewBox="0 0 24 24" fill={COLOR.textSecondary}>
      <circle cx="8" cy="6" r="1.6" />
      <circle cx="8" cy="12" r="1.6" />
      <circle cx="8" cy="18" r="1.6" />
      <circle cx="16" cy="6" r="1.6" />
      <circle cx="16" cy="12" r="1.6" />
      <circle cx="16" cy="18" r="1.6" />
    </svg>
  );
}
