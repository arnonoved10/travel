import type { FlightStatusProvider, FlightStatusResult } from "./types";

/** מוחזר כש-AVIATIONSTACK_API_KEY לא מוגדר — לעולם לא ממציא סטטוס. ה-UI אמור
 * לבדוק isFlightStatusConfigured() ולהסתיר את כפתור-הבדיקה במקום לקרוא לכאן
 * (כמו NullRecommendationsProvider/UnconfiguredMapProvider). */
export class NullFlightStatusProvider implements FlightStatusProvider {
  readonly name = "unconfigured";

  async checkFlightStatus(): Promise<FlightStatusResult> {
    throw new Error("בדיקת סטטוס-טיסה חיה לא מחוברת (AVIATIONSTACK_API_KEY חסר)");
  }
}

export const nullFlightStatusProvider = new NullFlightStatusProvider();
