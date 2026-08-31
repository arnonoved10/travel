export interface AirportTimingInput {
  /** שעת המראה בפועל, ISO instant. */
  departureAt: string;
  /** כמה זמן מומלץ להיות בשדה התעופה לפני ההמראה (דקות) — קלט מפורש מהמשתמש, לא ניחוש. */
  recommendedArrivalLeadMinutes: number;
  /** זמן נסיעה עד שדה התעופה (דקות) — אופציונלי; בלי זה לא מחשבים "שעת יציאה מומלצת" (לא ממציאים). */
  travelTimeToAirportMinutes?: number;
}

export interface AirportTimingResult {
  /** שעת ההגעה המומלצת לשדה התעופה, ISO instant. */
  recommendedAirportArrivalAt: string;
  /** שעת היציאה המומלצת מהבית/מהמלון, ISO instant — null אם לא הוזן זמן נסיעה. */
  recommendedLeaveAt: string | null;
}

/**
 * מחשב "שעת הגעה מומלצת לשדה" ו"שעת יציאה מומלצת" מנתונים שהמשתמש הזין
 * במפורש (לא ברירת מחדל מומצאת כמו "תמיד 3 שעות") — פונקציה טהורה, נבדקת
 * ב-airport-timing.test.ts.
 */
export function computeAirportTiming(input: AirportTimingInput): AirportTimingResult {
  const departureMs = new Date(input.departureAt).getTime();
  const recommendedAirportArrivalAt = new Date(departureMs - input.recommendedArrivalLeadMinutes * 60_000).toISOString();

  const recommendedLeaveAt =
    input.travelTimeToAirportMinutes != null
      ? new Date(departureMs - (input.recommendedArrivalLeadMinutes + input.travelTimeToAirportMinutes) * 60_000).toISOString()
      : null;

  return { recommendedAirportArrivalAt, recommendedLeaveAt };
}
