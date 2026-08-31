import type { CreateTripCompanionInput, TripCompanion } from "@travel-app/shared-types";

// tripId בלבד (בלי userId) — אותו דפוס כמו TripGeographyRepository/
// BookingRepository: TripRepository.getById הוא נקודת-האימות היחידה,
// כאן סומכים על tripId שכבר אומת מול Trip.userId בשכבת ה-UI.
export interface TripCompanionRepository {
  listForTrip(params: { tripId: string; includeDeleted?: boolean }): Promise<TripCompanion[]>;
  create(params: { input: CreateTripCompanionInput }): Promise<TripCompanion>;
  softDelete(params: { companionId: string }): Promise<TripCompanion>;
}

export class TripCompanionNotFoundError extends Error {
  constructor(companionId: string) {
    super(`TripCompanion ${companionId} not found`);
    this.name = "TripCompanionNotFoundError";
  }
}
