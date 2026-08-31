"use client";

import { useEffect, useState } from "react";

export interface AnchoredPosition {
  top: number;
  left?: number;
  right?: number;
  width: number;
}

/** מחשב מיקום-fixed מוצמד לרכיב-עוגן (start-אלינד, RTL-מודע) — לתפריט-נפתח
 * שמרונדר דרך portal ישירות ל-document.body, כדי שלא ייחתך על-ידי
 * overflow:hidden של אב כלשהו (למשל GlassCard, ר' components/ui/GlassCard.tsx —
 * גם DatePicker וגם LocationPickerMap נפתחים לפעמים בתוך כרטיס כזה, למשל כרטיס
 * "פעולות מהירות" בדשבורד). משותף בין DatePicker/DateTimePicker
 * (components/ui/DatePicker.tsx) ובין LocationPickerMap
 * (components/location-picker-map.tsx) — אותה בעיה בדיוק בשני מקומות.
 * מחושב-מחדש בכל פתיחה, לא עוקב אחרי גלילה — תפריט קצר-חיים, נסגר
 * ב-outside-click ממילא. */
export function useAnchoredPosition(open: boolean, anchorRef: React.RefObject<HTMLElement | null>): AnchoredPosition | null {
  const [position, setPosition] = useState<AnchoredPosition | null>(null);

  useEffect(() => {
    if (!open || !anchorRef.current) {
      setPosition(null);
      return;
    }
    const rect = anchorRef.current.getBoundingClientRect();
    const isRtl = getComputedStyle(document.documentElement).direction === "rtl";
    setPosition(
      isRtl
        ? { top: rect.bottom + 6, right: window.innerWidth - rect.right, width: rect.width }
        : { top: rect.bottom + 6, left: rect.left, width: rect.width },
    );
  }, [open, anchorRef]);

  return position;
}
