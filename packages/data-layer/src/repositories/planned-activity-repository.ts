import type {
  CreatePlannedActivityInput,
  PlannedActivity,
  UpdatePlannedActivityPersonalRatingInput,
  UpdatePlannedActivityStatusInput,
} from "@travel-app/shared-types";

/** אותו עיקרון כמו TripRepository — ראה trip-repository.ts. */
export interface PlannedActivityRepository {
  listForTrip(params: { tripId: string; includeDeleted?: boolean }): Promise<PlannedActivity[]>;
  getById(params: { plannedActivityId: string }): Promise<PlannedActivity | null>;
  create(params: { input: CreatePlannedActivityInput }): Promise<PlannedActivity>;
  updateStatus(params: { input: UpdatePlannedActivityStatusInput }): Promise<PlannedActivity>;
  updatePersonalRating(params: { input: UpdatePlannedActivityPersonalRatingInput }): Promise<PlannedActivity>;
  /** "מבגרת" תכנון עתידי להזמנה אמיתית — מקשרת ל-Booking.id (לא לשורת תת-הטבלה) ומעדכנת סטטוס ל-booked. */
  linkToBooking(params: { plannedActivityId: string; bookingId: string }): Promise<PlannedActivity>;
  softDelete(params: { plannedActivityId: string }): Promise<PlannedActivity>;
  restore(params: { plannedActivityId: string }): Promise<PlannedActivity>;
}

export class PlannedActivityNotFoundError extends Error {
  constructor(plannedActivityId: string) {
    super(`PlannedActivity ${plannedActivityId} not found`);
    this.name = "PlannedActivityNotFoundError";
  }
}
