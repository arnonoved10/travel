import type { FlightLiveStatus } from "@travel-app/shared-types";

export interface FlightStatusResult {
  liveStatus: FlightLiveStatus;
  /** דקות עיכוב אמיתיות מה-API; null = אין מידע-עיכוב (לאו דווקא "בזמן"). */
  liveDelayMinutes: number | null;
}

/** ספק-סטטוס-טיסה — מומש היום ע"י Aviationstack בלבד (aviationstack-provider.ts),
 * שמור מאחורי ממשק כמו RecommendationsProvider/WeatherProvider בפרויקט הזה. אף
 * מימוש לא רשאי להמציא סטטוס — שגיאת-API מוחזרת כשגיאה, לא ניחוש. */
export interface FlightStatusProvider {
  checkFlightStatus(params: { flightNumber: string; flightDate: string }): Promise<FlightStatusResult>;
}
