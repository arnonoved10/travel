import type { Trip } from "@travel-app/shared-types";

export interface ActiveTripResult {
  trip: Trip;
  /** true כשהטיול עוד לא התחיל (נבחר כי אין טיול-בעיצומו) — כדי שקוראים
   * שרוצים להבחין ("מתחיל בעוד יומיים") יוכלו, בלי לאבד את המידע הזה. */
  isUpcoming: boolean;
}

/**
 * "טיול פעיל" עם נפילה-חכמה: מעדיף טיול-בעיצומו (startDate<=today<=endDate,
 * ההגדרה שהייתה בכל 4 המקומות בנפרד), ובלעדיו — הטיול הקרוב-ביותר שעוד לא
 * התחיל. בלי הנפילה הזו, טיול שנוצר יומיים לפני היציאה (המקרה השכיח ביותר —
 * מתכננים ממש לפני שיוצאים) לא נחשב "פעיל" בשום מסך, והמשתמש רואה גרסה
 * ריקה-כמעט של הדשבורד/היום-שלי/חירום עד יום היציאה בפועל.
 */
export function getActiveTrip(trips: Trip[], today: string): ActiveTripResult | null {
  const current = trips.find((t) => t.startDate <= today && today <= t.endDate);
  if (current) return { trip: current, isUpcoming: false };

  const upcoming = trips.filter((t) => t.startDate > today).sort((a, b) => a.startDate.localeCompare(b.startDate))[0];
  return upcoming ? { trip: upcoming, isUpcoming: true } : null;
}
