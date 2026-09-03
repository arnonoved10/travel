"use client";

import { useEffect, useState } from "react";
import { getImage } from "./image-store";

/** מחזירה את תוכן-התמונה (data URL) לפי מזהה, נטען אסינכרונית מ-IndexedDB —
 * null בזמן טעינה/כשאין מזהה/כשאין תמונה, כדי שכל מקום-שימוש (שכבר יודע
 * להציג אייקון-ברירת-מחדל במקרה הזה) יתנהג זהה. שומרת דגל "בוטל" כדי
 * שתוצאה איטית של מזהה קודם לא תדרוס בטעות תוצאה חדשה יותר אם המזהה
 * מתחלף לפני שהקריאה הראשונה הספיקה לחזור. */
export function useStoredImage(id: string | null | undefined): string | null {
  const [url, setUrl] = useState<string | null>(null);

  useEffect(() => {
    if (!id) {
      setUrl(null);
      return;
    }
    let cancelled = false;
    setUrl(null);
    getImage(id).then((v) => {
      if (!cancelled) setUrl(v);
    });
    return () => {
      cancelled = true;
    };
  }, [id]);

  return url;
}
