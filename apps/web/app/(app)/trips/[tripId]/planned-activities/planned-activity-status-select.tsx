"use client";

import { useState, useTransition } from "react";
import type { LifecycleStatus } from "@travel-app/shared-types";
import { LIFECYCLE_STATUS_LABELS, LIFECYCLE_STATUS_ORDER } from "@/lib/lifecycle-status-labels";
import { Select } from "@/components/ui/Select";
import { updatePlannedActivityStatusAction } from "./actions";

/** UI אופטימי: ה-state המקומי מתעדכן מיד בבחירה, לא מחכה לסבב-שרת מלא —
 * בלי זה כל שינוי-סטטוס הרגיש "תקוע" עד ש-revalidatePath מרענן את כל דף
 * הטיול (48+ שאילתות). חוזרים לסטטוס הקודם רק אם הפעולה נכשלת בפועל. */
export function PlannedActivityStatusSelect({
  tripId,
  plannedActivityId,
  status,
}: {
  tripId: string;
  plannedActivityId: string;
  status: LifecycleStatus;
}) {
  const [optimisticStatus, setOptimisticStatus] = useState(status);
  const [isPending, startTransition] = useTransition();

  return (
    <Select
      value={optimisticStatus}
      disabled={isPending}
      onChange={(newStatus) => {
        const previous = optimisticStatus;
        setOptimisticStatus(newStatus as LifecycleStatus);
        startTransition(async () => {
          try {
            await updatePlannedActivityStatusAction(tripId, plannedActivityId, newStatus as LifecycleStatus);
          } catch {
            setOptimisticStatus(previous);
          }
        });
      }}
      options={LIFECYCLE_STATUS_ORDER.map((s) => ({ value: s, label: LIFECYCLE_STATUS_LABELS[s] }))}
      style={{ fontSize: "0.8125rem", width: "auto", minWidth: "9rem" }}
    />
  );
}
