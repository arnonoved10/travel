import type { TripType } from "@travel-app/shared-types";

export interface PackingTripTypeSuggestion {
  name: string;
  reason: string;
}

const SUGGESTIONS_BY_TRIP_TYPE: Record<TripType, PackingTripTypeSuggestion[]> = {
  beach: [
    { name: "בגד ים", reason: "טיול חוף/ים" },
    { name: "קרם הגנה", reason: "טיול חוף/ים" },
    { name: "מגבת חוף", reason: "טיול חוף/ים" },
    { name: "כפכפים", reason: "טיול חוף/ים" },
  ],
  ski: [
    { name: "כפפות", reason: "טיול סקי/הרים" },
    { name: "משקפי שמש/שלג", reason: "טיול סקי/הרים" },
    { name: "שכבות תרמיות", reason: "טיול סקי/הרים" },
    { name: "קרם הגנה", reason: "החזרי UV מהשלג — טיול סקי/הרים" },
  ],
  city: [
    { name: "נעליים נוחות להליכה", reason: "טיול עיר" },
    { name: "תיק גב קטן", reason: "טיול עיר" },
  ],
  nature: [
    { name: "נעלי הליכה/טיולים", reason: "טיול טבע" },
    { name: "בקבוק מים רב-פעמי", reason: "טיול טבע" },
    { name: "תרמיל גב", reason: "טיול טבע" },
    { name: "דוחה יתושים", reason: "טיול טבע" },
  ],
  business: [
    { name: "ביגוד רשמי", reason: "טיול עסקים" },
    { name: "מטען נייד/כבלים", reason: "טיול עסקים" },
    { name: "כרטיסי ביקור", reason: "טיול עסקים" },
  ],
  road_trip: [
    { name: "מטען לרכב", reason: "רואד-טריפ" },
    { name: "כרית נסיעה", reason: "רואד-טריפ" },
    { name: "חטיפים לדרך", reason: "רואד-טריפ" },
  ],
  other: [],
};

/** הצעה בלבד — לא מוסיף אוטומטית, אותו UX כמו suggestPackingItemsForWeather. */
export function suggestPackingItemsForTripType(tripType: TripType | null): PackingTripTypeSuggestion[] {
  if (tripType === null) return [];
  return SUGGESTIONS_BY_TRIP_TYPE[tripType];
}
