import type { Place, TripPlace, TripPlaceStatus } from "@travel-app/shared-types";

export interface TripPlaceWithPlace extends TripPlace {
  place: Place;
}

/** קשר Trip↔Place (ספריית מקומות גלובלית, סטטוס פר-טיול) — ראה 01_architecture_v2.md. */
export interface TripPlaceRepository {
  listForTrip(params: { userId: string; tripId: string }): Promise<TripPlaceWithPlace[]>;
  /** גרסה מקובצת של listForTrip — שאילתה אחת ל-N טיולים במקום N שאילתות. */
  listForTrips(params: { userId: string; tripIds: string[] }): Promise<TripPlaceWithPlace[]>;
  linkPlaceToTrip(params: {
    userId: string;
    tripId: string;
    placeId: string;
    status: TripPlaceStatus;
  }): Promise<TripPlace>;
}
