"use client";

import { useEffect } from "react";

function openDetailsForCurrentHash(): boolean {
  const hash = window.location.hash.slice(1);
  if (!hash) return false;
  const element = document.getElementById(hash);
  if (element instanceof HTMLDetailsElement) {
    element.open = true;
    element.scrollIntoView({ block: "start" });
    return true;
  }
  return false;
}

/**
 * "#expenses"/"#wallet" וכו' מצביעים על <details> סגור בכוונה
 * (BookingGroup) — גלילה טבעית לעוגן לא פותחת אותו. פותח את ה-<details>
 * התואם, בלי לגעת ב-<details> אחרים. שני מקורות-hash מטופלים: טעינת-עמוד
 * עם hash כבר בכתובת (מ-quick-add-fab.tsx או מדף אחר, כמו /now), וגם
 * "hashchange" — קליק על קישור-עוגן בתוך אותו עמוד (כמו trip-section-nav.tsx)
 * לא עושה mount מחדש, אז ה-useEffect הראשוני לבדו לא מספיק.
 *
 * ניסיונות-חוזרים (0/150/400/900ms): כשמגיעים מ-navigation חוצה-עמוד (למשל
 * קישור-הארנק בסיידבר, app/(app)/layout.tsx), העמוד הזה (שמביא המון נתונים
 * במקביל, ר' ה-Promise.all הענק למעלה בקובץ) יכול עדיין להיות באמצע
 * hydration כשה-effect הראשון רץ — נסיון בודד יכול לפספס אם ה-<details>
 * המתאים עוד לא "תפוס" ל-React אז. לא היה ניתן לאמת חזותית (אין דפדפן
 * זמין בסביבת-הפיתוח כאן), זו הקשחה הגנתית ולא תיקון-שורש מאומת.
 */
export function OpenDetailsFromHash() {
  useEffect(() => {
    if (openDetailsForCurrentHash()) return;
    const timers = [150, 400, 900].map((delay) => window.setTimeout(openDetailsForCurrentHash, delay));
    return () => timers.forEach((t) => window.clearTimeout(t));
  }, []);

  useEffect(() => {
    window.addEventListener("hashchange", openDetailsForCurrentHash);
    return () => window.removeEventListener("hashchange", openDetailsForCurrentHash);
  }, []);

  return null;
}
