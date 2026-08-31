"use client";

import { useState, useTransition } from "react";
import { Select } from "@/components/ui/Select";

/** UI אופטימי: ה-state המקומי מתעדכן מיד בלחיצה, לא מחכה לסבב-שרת מלא —
 * בלי זה כל לחיצת-דירוג הרגישה "תקועה" עד ש-revalidatePath מרענן את כל דף
 * הטיול (48+ שאילתות). חוזרים לערך הקודם רק אם onRate נכשל בפועל. */
export function PersonalRatingSelect({
  value,
  onRate,
  label = "דירוג אישי",
}: {
  value: number | null;
  onRate: (personalRating: number | null) => Promise<unknown>;
  label?: string;
}) {
  const [optimisticValue, setOptimisticValue] = useState(value);
  const [isPending, startTransition] = useTransition();

  return (
    <Select
      value={optimisticValue === null ? "" : String(optimisticValue)}
      disabled={isPending}
      placeholder={label}
      onChange={(raw) => {
        const personalRating = raw === "" ? null : Number(raw);
        const previous = optimisticValue;
        setOptimisticValue(personalRating);
        startTransition(async () => {
          try {
            await onRate(personalRating);
          } catch {
            setOptimisticValue(previous);
          }
        });
      }}
      options={[
        { value: "", label },
        ...[1, 2, 3, 4, 5].map((n) => ({ value: String(n), label: "★".repeat(n) })),
      ]}
      style={{ fontSize: "0.8125rem", width: "auto", minWidth: "9rem" }}
    />
  );
}
