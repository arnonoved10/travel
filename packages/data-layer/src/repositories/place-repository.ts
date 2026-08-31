import type { CreatePlaceInput, Place } from "@travel-app/shared-types";

/** אותו עיקרון כמו TripRepository — ראה trip-repository.ts. */
export interface PlaceRepository {
  list(params: { userId: string; includeDeleted?: boolean }): Promise<Place[]>;
  getById(params: { userId: string; placeId: string }): Promise<Place | null>;
  /**
   * בלי userId ובלי בדיקת-בעלות בכוונה — לשימוש רק כשה-placeIds כבר נאספו
   * דרך נתיב שאומת בעלות בעצמו (למשל RouteStop.placeId אחרי resolveToken
   * על TripShareLink) ולכן אין צורך/דרך לבדוק בעלות שוב כאן. לא לקרוא
   * ל-method הזה עם placeIds ממקור לא-מאומת.
   */
  listByIds(params: { placeIds: string[] }): Promise<Place[]>;
  create(params: { userId: string; input: CreatePlaceInput }): Promise<Place>;
  softDelete(params: { userId: string; placeId: string }): Promise<Place>;
  restore(params: { userId: string; placeId: string }): Promise<Place>;
  toggleFavorite(params: { userId: string; placeId: string }): Promise<Place>;
  toggleDontReturn(params: { userId: string; placeId: string }): Promise<Place>;
  setPersonalRating(params: { userId: string; placeId: string; personalRating: number | null }): Promise<Place>;
}

export class PlaceNotFoundError extends Error {
  constructor(placeId: string) {
    super(`Place ${placeId} not found`);
    this.name = "PlaceNotFoundError";
  }
}
