"use client";

import { useRouter } from "next/navigation";
import type { Trip } from "@travel-app/shared-types";
import { Select } from "@/components/ui/Select";

/** בחירת-טיול-לצפייה בדשבורד (בקשת משתמש: "שאוכל לבחור את מי שאני רוצה
 * לראות ולטפל") — משנה `?tripId=` בניווט, אותו דפוס בדיוק כמו /map?tripId=. */
export function TripSwitcher({ trips, selectedTripId }: { trips: Trip[]; selectedTripId: string | undefined }) {
  const router = useRouter();
  if (trips.length === 0) return null;

  return (
    <div style={{ maxWidth: "18rem" }}>
      <Select
        value={selectedTripId ?? ""}
        onChange={(tripId) => router.push(tripId ? `/dashboard?tripId=${tripId}` : "/dashboard")}
        placeholder="בחר טיול לצפייה"
        options={[...trips]
          .sort((a, b) => b.startDate.localeCompare(a.startDate))
          .map((t) => ({ value: t.id, label: `${t.name} (${t.startDate})` }))}
      />
    </div>
  );
}
