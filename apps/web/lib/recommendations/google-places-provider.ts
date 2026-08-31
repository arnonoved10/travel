import type { PlaceRecommendation, RecommendationsProvider } from "./types";
import { getGooglePlacesApiKey } from "./config";

// Places API (New) — Text Search. תמיד קריאה אמיתית בצד-שרת בלבד (המפתח
// לעולם לא נחשף ללקוח). תמונה מוחזרת כנתיב-פרוקסי פנימי (/api/places-photo),
// לא כ-URL עם המפתח בתוכו — כדי שהמפתח לא ידלוף דרך תגית <img> בדפדפן.
const SEARCH_URL = "https://places.googleapis.com/v1/places:searchText";
const FIELD_MASK = [
  "places.displayName",
  "places.primaryTypeDisplayName",
  "places.formattedAddress",
  "places.rating",
  "places.userRatingCount",
  "places.googleMapsUri",
  "places.photos",
].join(",");

interface GooglePlace {
  displayName?: { text?: string };
  primaryTypeDisplayName?: { text?: string };
  formattedAddress?: string;
  rating?: number;
  userRatingCount?: number;
  googleMapsUri?: string;
  photos?: Array<{ name?: string }>;
}

interface SearchTextResponse {
  places?: GooglePlace[];
}

export class GooglePlacesRecommendationsProvider implements RecommendationsProvider {
  readonly name = "google-places";

  async searchRecommendations({ query }: { query: string }): Promise<PlaceRecommendation[]> {
    const apiKey = getGooglePlacesApiKey();
    if (!apiKey) throw new Error("GOOGLE_PLACES_API_KEY אינו מוגדר");

    const response = await fetch(SEARCH_URL, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "X-Goog-Api-Key": apiKey,
        "X-Goog-FieldMask": FIELD_MASK,
      },
      body: JSON.stringify({ textQuery: query, languageCode: "he" }),
    });

    if (!response.ok) {
      const body = await response.text().catch(() => "");
      throw new Error(`Google Places API החזיר שגיאה (${response.status}): ${body.slice(0, 300)}`);
    }

    const data = (await response.json()) as SearchTextResponse;
    return (data.places ?? []).map((place) => ({
      name: place.displayName?.text ?? "ללא שם",
      category: place.primaryTypeDisplayName?.text ?? null,
      address: place.formattedAddress ?? null,
      rating: typeof place.rating === "number" ? place.rating : null,
      userRatingsTotal: typeof place.userRatingCount === "number" ? place.userRatingCount : null,
      mapsUrl: place.googleMapsUri ?? `https://www.google.com/maps/search/${encodeURIComponent(place.displayName?.text ?? query)}`,
      photoUrl: place.photos?.[0]?.name ? `/api/places-photo?name=${encodeURIComponent(place.photos[0].name)}` : null,
    }));
  }
}

export const googlePlacesRecommendationsProvider = new GooglePlacesRecommendationsProvider();
