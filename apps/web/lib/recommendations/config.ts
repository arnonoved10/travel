/** בשונה מ-NEXT_PUBLIC_MAPBOX_TOKEN (client-side), קריאות Google Places חייבות
 * לרוץ בצד-שרת בלבד — בלי NEXT_PUBLIC_, כדי שהמפתח לא ייחשף לדפדפן. */
export function isPlacesRecommendationsConfigured(): boolean {
  return Boolean(process.env.GOOGLE_PLACES_API_KEY);
}

export function getGooglePlacesApiKey(): string | null {
  return process.env.GOOGLE_PLACES_API_KEY ?? null;
}
