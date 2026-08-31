import type { OptimizedTripResult, RoutingProvider, RoutingQuery, RoutingResult, RoutingWaypoint } from "@travel-app/shared-types";

// שרת דמו ציבורי חינמי של OSRM — בלי מפתח, בלי הרשמה. מיועד להערכה/פיתוח,
// לא SLA לפרודקשן (ראה DECISIONS.md "מצב Routing"). אם ה-API לא מחזיר
// מסלול — מחזירים null, לא ממציאים מרחק/זמן.
const OSRM_BASE_URL = "https://router.project-osrm.org";

interface OsrmResponse {
  code: string;
  routes?: Array<{ distance: number; duration: number }>;
}

interface OsrmTripResponse {
  code: string;
  trips?: Array<{ legs: Array<{ distance: number; duration: number }> }>;
  waypoints?: Array<{ waypoint_index: number }>;
}

export class OsrmRoutingProvider implements RoutingProvider {
  readonly name = "osrm";

  async getDrivingRoute(query: RoutingQuery): Promise<RoutingResult | null> {
    const url = `${OSRM_BASE_URL}/route/v1/driving/${query.fromLng},${query.fromLat};${query.toLng},${query.toLat}?overview=false`;
    const response = await fetch(url);
    if (!response.ok) {
      throw new Error(`OSRM request failed with status ${response.status}`);
    }

    const data = (await response.json()) as OsrmResponse;
    if (data.code !== "Ok" || !data.routes || data.routes.length === 0) {
      return null;
    }

    const [route] = data.routes;
    return {
      distanceKm: Math.round((route!.distance / 1000) * 10) / 10,
      travelTimeMinutes: Math.round(route!.duration / 60),
      provider: this.name,
    };
  }

  async getOptimizedTripOrder(waypoints: RoutingWaypoint[]): Promise<OptimizedTripResult | null> {
    if (waypoints.length < 2) return null;

    const coords = waypoints.map((w) => `${w.lng},${w.lat}`).join(";");
    // source=first/destination=last מקבעים את נקודת ההתחלה/סיום — פותרים
    // "מסלול פתוח" (לא round-trip) עם קצוות קבועים, לא TSP סגור.
    const url = `${OSRM_BASE_URL}/trip/v1/driving/${coords}?source=first&destination=last&roundtrip=false&overview=false`;
    const response = await fetch(url);
    if (!response.ok) {
      throw new Error(`OSRM trip request failed with status ${response.status}`);
    }

    const data = (await response.json()) as OsrmTripResponse;
    if (data.code !== "Ok" || !data.trips || data.trips.length === 0 || !data.waypoints) {
      return null;
    }

    const orderedIndices = data.waypoints
      .map((wp, originalIndex) => ({ originalIndex, order: wp.waypoint_index }))
      .sort((a, b) => a.order - b.order)
      .map((entry) => entry.originalIndex);

    const legs = data.trips[0]!.legs;
    return {
      orderedIndices,
      legDistancesKm: legs.map((leg) => Math.round((leg.distance / 1000) * 10) / 10),
      legTravelTimeMinutes: legs.map((leg) => Math.round(leg.duration / 60)),
    };
  }
}

export const osrmRoutingProvider = new OsrmRoutingProvider();
