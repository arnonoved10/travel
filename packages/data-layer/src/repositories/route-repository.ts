import type { CreateRouteStopInput, RouteStop } from "@travel-app/shared-types";

/**
 * מסלול יומי — ברמת ה-API הזה, "יום" מזוהה ע"י (tripId, date) ישירות, לא
 * דרך tripDayId. בסכימת Prisma בפועל Route מקושר ל-TripDay (טבלה נפרדת עם
 * unique([tripId, calendarDate])) — ה-Prisma repository דואג ל-get-or-create
 * שקוף של שורת TripDay+Route בעת יצירת עצירה ראשונה ליום, כדי שלא נצטרך
 * ישות TripDay אמיתית בכל מקום אחר באפליקציה (היא עדיין מחושבת חי, ראה
 * lib/trip-days.ts). ראה DECISIONS.md.
 */
export interface RouteRepository {
  listForDay(params: { tripId: string; date: string }): Promise<RouteStop[]>;
  addStop(params: { input: CreateRouteStopInput }): Promise<RouteStop>;
  moveStop(params: { routeStopId: string; direction: "up" | "down" }): Promise<RouteStop[]>;
  removeStop(params: { routeStopId: string }): Promise<void>;
  /**
   * קובע מחדש את כל סדר העצירות ליום (orderIndex לפי המיקום במערך) —
   * בשונה מ-moveStop (החלפת שכנים בודדת), זה מיועד לתוצאה של אופטימיזציית
   * מסלול שלמה. distanceKm/travelTimeMinutes אופציונליים לכל עצירה —
   * "מרחק מהעצירה הקודמת בסדר החדש", אותה סמנטיקה בדיוק כמו ב-addStop.
   */
  reorderStops(params: {
    tripId: string;
    date: string;
    stops: { routeStopId: string; distanceKm?: number; travelTimeMinutes?: number }[];
  }): Promise<RouteStop[]>;
}

export class RouteStopNotFoundError extends Error {
  constructor(routeStopId: string) {
    super(`RouteStop ${routeStopId} not found`);
    this.name = "RouteStopNotFoundError";
  }
}
