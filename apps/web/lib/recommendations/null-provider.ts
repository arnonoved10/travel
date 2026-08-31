import type { PlaceRecommendation, RecommendationsProvider } from "./types";

/** מוחזר כש-GOOGLE_PLACES_API_KEY לא מוגדר — לעולם לא ממציא תוצאות, פשוט לא
 * נקרא בכלל. ה-UI אמור לבדוק isPlacesRecommendationsConfigured() ולהציג מסך
 * "לא מחובר" במקום לקרוא ל-searchRecommendations בכלל (כמו UnconfiguredMapProvider). */
export class NullRecommendationsProvider implements RecommendationsProvider {
  readonly name = "unconfigured";

  async searchRecommendations(): Promise<PlaceRecommendation[]> {
    return [];
  }
}

export const nullRecommendationsProvider = new NullRecommendationsProvider();
