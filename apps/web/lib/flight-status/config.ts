/** כמו GOOGLE_PLACES_API_KEY — קריאות Aviationstack חייבות לרוץ בצד-שרת בלבד,
 * בלי NEXT_PUBLIC_, כדי שהמפתח לא ייחשף לדפדפן. */
export function isFlightStatusConfigured(): boolean {
  return Boolean(process.env.AVIATIONSTACK_API_KEY);
}

export function getAviationstackApiKey(): string | null {
  return process.env.AVIATIONSTACK_API_KEY ?? null;
}
