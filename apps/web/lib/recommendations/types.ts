export interface PlaceRecommendation {
  name: string;
  category: string | null;
  address: string | null;
  rating: number | null;
  userRatingsTotal: number | null;
  mapsUrl: string;
  photoUrl: string | null;
}

/** ספק-חיפוש מקומות — מומש היום ע"י Google Places בלבד (google-places-provider.ts),
 * אבל שמור מאחורי ממשק כמו CurrencyRateProvider/WeatherProvider בפרויקט הזה, למקרה
 * שיוחלף בעתיד. אף מימוש לא רשאי להמציא תוצאות — שגיאת-API מוחזרת כשגיאה. */
export interface RecommendationsProvider {
  searchRecommendations(params: { query: string }): Promise<PlaceRecommendation[]>;
}
