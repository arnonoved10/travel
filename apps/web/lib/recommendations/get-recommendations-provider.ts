import type { RecommendationsProvider } from "./types";
import { isPlacesRecommendationsConfigured } from "./config";
import { googlePlacesRecommendationsProvider } from "./google-places-provider";
import { nullRecommendationsProvider } from "./null-provider";

/** שרת-בלבד (בשונה מ-getMapProvider ב-lib/map, שרץ בצד-לקוח וצריך useEffect) —
 * קריאות Google Places קורות תמיד ב-Server Action/Server Component. */
export function getRecommendationsProvider(): RecommendationsProvider {
  return isPlacesRecommendationsConfigured() ? googlePlacesRecommendationsProvider : nullRecommendationsProvider;
}
