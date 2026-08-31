// חישוב מרחק/זמן נסיעה — ראה DECISIONS.md ל"מצב Routing": מחובר ל-OSRM
// (שרת דמו ציבורי חינמי, בלי מפתח). כמו Weather — אם אין תשובה אמיתית
// מהספק, לא ממציאים מרחק/זמן; מחזירים null.
import { z } from "zod";

export const routingQuerySchema = z.object({
  fromLat: z.number().min(-90).max(90),
  fromLng: z.number().min(-180).max(180),
  toLat: z.number().min(-90).max(90),
  toLng: z.number().min(-180).max(180),
});
export type RoutingQuery = z.infer<typeof routingQuerySchema>;

export const routingResultSchema = z.object({
  distanceKm: z.number().nonnegative(),
  travelTimeMinutes: z.number().nonnegative(),
  provider: z.string(),
});
export type RoutingResult = z.infer<typeof routingResultSchema>;

export interface RoutingWaypoint {
  lat: number;
  lng: number;
}

export interface OptimizedTripResult {
  /** אינדקסי ה-waypoints המקוריים, בסדר האופטימלי (source=first/destination=last נשארים קבועים בקצוות). */
  orderedIndices: number[];
  /** legDistancesKm[i] = מרחק בין ordered[i] ל-ordered[i+1] (אורך = orderedIndices.length - 1). */
  legDistancesKm: number[];
  legTravelTimeMinutes: number[];
}

export interface RoutingProvider {
  readonly name: string;
  /** null אם הספק לא הצליח למצוא מסלול נהיגה בין שתי הנקודות. */
  getDrivingRoute(query: RoutingQuery): Promise<RoutingResult | null>;
  /**
   * סדר-ביקור אופטימלי בין כמה נקודות, עם התחלה וסיום קבועים (waypoints[0]
   * ו-waypoints[last]) — פותר "איזה סדר הכי קצר" לא רק "כמה רחוק מא' לב'".
   * null אם הספק לא הצליח לפתור (למשל פחות משלוש נקודות, או כשל רשת).
   */
  getOptimizedTripOrder(waypoints: RoutingWaypoint[]): Promise<OptimizedTripResult | null>;
}
