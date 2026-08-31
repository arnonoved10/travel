import type { CompanionPollOption, CompanionPoll, CreateCompanionPollInput } from "@travel-app/shared-types";

// תצוגה מורכבת ל-UI: כל אפשרות עם רשימת המלווים שבחרו בה — אותו עיקרון
// embedding כמו TripPlaceWithPlace (trip-place-repository.ts).
export interface CompanionPollOptionWithVotes extends CompanionPollOption {
  voterCompanionIds: string[];
}
export interface CompanionPollWithOptions extends CompanionPoll {
  options: CompanionPollOptionWithVotes[];
}

// tripId בלבד (בלי userId) — אותו דפוס כמו TripCompanionRepository.
export interface CompanionPollRepository {
  listForTrip(params: { tripId: string }): Promise<CompanionPollWithOptions[]>;
  create(params: { input: CreateCompanionPollInput }): Promise<CompanionPollWithOptions>;
  /** upsert לפי unique(pollId, companionId) — הצבעה חוזרת של אותו מלווה מחליפה את הקודמת, לא כפילות. */
  recordVote(params: { pollId: string; companionId: string; optionId: string }): Promise<void>;
  /** "לא הצביע/ה" — מסיר את ההצבעה הקיימת של המלווה בסקר הזה, אם יש. */
  removeVote(params: { pollId: string; companionId: string }): Promise<void>;
  /** מחיקה קשיחה — כמו TripCountry/TripCity, לא ישות עסקית שדורשת audit trail. */
  deletePoll(params: { pollId: string }): Promise<void>;
}
