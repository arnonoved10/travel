export interface RepeatVisitPlace {
  id: string;
  name: string;
  city: string | null;
  country: string | null;
  category: string;
  personalRating: number | null;
  isFavorite: boolean;
  dontReturn: boolean;
}

export interface RepeatVisitTripPlace {
  tripId: string;
  placeId: string;
  status: string;
  place: RepeatVisitPlace;
}

export interface RepeatVisitTrip {
  id: string;
  name: string;
  startDate: string;
}

export interface RepeatVisitSuggestion {
  city: string;
  country: string | null;
  sourceTripId: string;
  sourceTripName: string;
  place: RepeatVisitPlace;
}

const RELEVANT_STATUSES = new Set(["visited", "favorite"]);

/**
 * "חזרת לעיר X? הנה מקומות שאהבת בפעם הקודמת" — משווה את הערים של הטיול
 * הנוכחי (לפי מקומות שכבר מקושרים אליו) מול מקומות שסומנו visited/favorite
 * בטיולים קודמים (startDate מוקדם יותר) לאותה עיר. מכבד Place.dontReturn
 * (סימון גלובלי) ואת TripPlaceStatus="dont_return" (לא נכלל ב-RELEVANT_STATUSES) —
 * שני האיתותים ה"לא לחזור" הקיימים במודל. לא מומצא ניחוש גיאוגרפי: עיר נלקחת
 * רק מ-Place.city המפורש, לא מקירוב מיקום.
 */
export function computeRepeatVisitSuggestions(params: {
  currentTrip: RepeatVisitTrip;
  currentTripPlaces: RepeatVisitTripPlace[];
  otherTrips: RepeatVisitTrip[];
  otherTripPlaces: RepeatVisitTripPlace[];
}): RepeatVisitSuggestion[] {
  const { currentTrip, currentTripPlaces, otherTrips, otherTripPlaces } = params;

  const currentCities = new Set(
    currentTripPlaces.map((tp) => tp.place.city).filter((city): city is string => Boolean(city)),
  );
  if (currentCities.size === 0) return [];

  const earlierTripIds = new Set(otherTrips.filter((t) => t.id !== currentTrip.id && t.startDate < currentTrip.startDate).map((t) => t.id));
  const tripNameById = new Map(otherTrips.map((t) => [t.id, t.name]));
  const alreadyLinkedPlaceIds = new Set(currentTripPlaces.map((tp) => tp.placeId));

  const suggestions: RepeatVisitSuggestion[] = [];
  const seenPlaceIds = new Set<string>();

  for (const tp of otherTripPlaces) {
    if (!earlierTripIds.has(tp.tripId)) continue;
    if (!tp.place.city || !currentCities.has(tp.place.city)) continue;
    if (alreadyLinkedPlaceIds.has(tp.placeId)) continue;
    if (tp.place.dontReturn) continue;
    if (!RELEVANT_STATUSES.has(tp.status)) continue;
    if (seenPlaceIds.has(tp.placeId)) continue;

    seenPlaceIds.add(tp.placeId);
    suggestions.push({
      city: tp.place.city,
      country: tp.place.country,
      sourceTripId: tp.tripId,
      sourceTripName: tripNameById.get(tp.tripId) ?? "",
      place: tp.place,
    });
  }

  return suggestions.sort((a, b) => {
    const ratingDiff = (b.place.personalRating ?? 0) - (a.place.personalRating ?? 0);
    if (ratingDiff !== 0) return ratingDiff;
    return Number(b.place.isFavorite) - Number(a.place.isFavorite);
  });
}
