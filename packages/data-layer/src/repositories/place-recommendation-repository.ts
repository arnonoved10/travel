import type { PlaceRecommendation, PlaceRecommendationItemInput } from "@travel-app/shared-types";

// tripId בלבד (בלי userId) — אותו דפוס כמו TripGeographyRepository/CompanionPollRepository.
// זה Cache חיצוני (Google Places), לא ישות שהמשתמש עורך שדה-שדה — "עדכון" הוא
// תמיד replaceForTrip (מחיקה+יצירה-מחדש לפי scopeLabel), לא upsert per-item.
export interface PlaceRecommendationRepository {
  listForTrip(params: { tripId: string }): Promise<PlaceRecommendation[]>;
  replaceForTrip(params: { tripId: string; scopeLabel: string; items: PlaceRecommendationItemInput[] }): Promise<PlaceRecommendation[]>;
  clearForTrip(params: { tripId: string }): Promise<void>;
}
