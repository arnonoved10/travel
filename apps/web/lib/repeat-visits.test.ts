import { describe, expect, it } from "vitest";
import { computeRepeatVisitSuggestions, type RepeatVisitPlace } from "./repeat-visits";

function makePlace(overrides: Partial<RepeatVisitPlace> = {}): RepeatVisitPlace {
  return {
    id: "place-1",
    name: "מסעדה בבנגקוק",
    city: "בנגקוק",
    country: "תאילנד",
    category: "restaurant",
    personalRating: null,
    isFavorite: false,
    dontReturn: false,
    ...overrides,
  };
}

describe("computeRepeatVisitSuggestions", () => {
  it("suggests a place visited in an earlier trip to the same city", () => {
    const place = makePlace();
    const suggestions = computeRepeatVisitSuggestions({
      currentTrip: { id: "trip-2", name: "טיול שני", startDate: "2026-06-01" },
      currentTripPlaces: [
        { tripId: "trip-2", placeId: "other-place", status: "want_to_go", place: makePlace({ id: "other-place", city: "בנגקוק" }) },
      ],
      otherTrips: [{ id: "trip-1", name: "טיול ראשון", startDate: "2025-01-01" }],
      otherTripPlaces: [{ tripId: "trip-1", placeId: place.id, status: "visited", place }],
    });

    expect(suggestions).toHaveLength(1);
    expect(suggestions[0]?.place.id).toBe(place.id);
    expect(suggestions[0]?.sourceTripName).toBe("טיול ראשון");
  });

  it("does not suggest a place already linked to the current trip", () => {
    const place = makePlace();
    const suggestions = computeRepeatVisitSuggestions({
      currentTrip: { id: "trip-2", name: "טיול שני", startDate: "2026-06-01" },
      currentTripPlaces: [{ tripId: "trip-2", placeId: place.id, status: "want_to_go", place }],
      otherTrips: [{ id: "trip-1", name: "טיול ראשון", startDate: "2025-01-01" }],
      otherTripPlaces: [{ tripId: "trip-1", placeId: place.id, status: "visited", place }],
    });

    expect(suggestions).toHaveLength(0);
  });

  it("respects Place.dontReturn even when the trip-place status is visited", () => {
    const place = makePlace({ dontReturn: true });
    const suggestions = computeRepeatVisitSuggestions({
      currentTrip: { id: "trip-2", name: "טיול שני", startDate: "2026-06-01" },
      currentTripPlaces: [
        { tripId: "trip-2", placeId: "other-place", status: "want_to_go", place: makePlace({ id: "other-place", city: "בנגקוק" }) },
      ],
      otherTrips: [{ id: "trip-1", name: "טיול ראשון", startDate: "2025-01-01" }],
      otherTripPlaces: [{ tripId: "trip-1", placeId: place.id, status: "visited", place }],
    });

    expect(suggestions).toHaveLength(0);
  });

  it("ignores a trip-place status of dont_return", () => {
    const place = makePlace();
    const suggestions = computeRepeatVisitSuggestions({
      currentTrip: { id: "trip-2", name: "טיול שני", startDate: "2026-06-01" },
      currentTripPlaces: [
        { tripId: "trip-2", placeId: "other-place", status: "want_to_go", place: makePlace({ id: "other-place", city: "בנגקוק" }) },
      ],
      otherTrips: [{ id: "trip-1", name: "טיול ראשון", startDate: "2025-01-01" }],
      otherTripPlaces: [{ tripId: "trip-1", placeId: place.id, status: "dont_return", place }],
    });

    expect(suggestions).toHaveLength(0);
  });

  it("ignores a trip that starts after the current trip (not 'earlier')", () => {
    const place = makePlace();
    const suggestions = computeRepeatVisitSuggestions({
      currentTrip: { id: "trip-1", name: "טיול מוקדם", startDate: "2025-01-01" },
      currentTripPlaces: [
        { tripId: "trip-1", placeId: "other-place", status: "want_to_go", place: makePlace({ id: "other-place", city: "בנגקוק" }) },
      ],
      otherTrips: [{ id: "trip-2", name: "טיול מאוחר יותר", startDate: "2026-06-01" }],
      otherTripPlaces: [{ tripId: "trip-2", placeId: place.id, status: "visited", place }],
    });

    expect(suggestions).toHaveLength(0);
  });

  it("does not suggest anything when the current trip has no linked places (no known cities)", () => {
    const place = makePlace();
    const suggestions = computeRepeatVisitSuggestions({
      currentTrip: { id: "trip-2", name: "טיול שני", startDate: "2026-06-01" },
      currentTripPlaces: [],
      otherTrips: [{ id: "trip-1", name: "טיול ראשון", startDate: "2025-01-01" }],
      otherTripPlaces: [{ tripId: "trip-1", placeId: place.id, status: "visited", place }],
    });

    expect(suggestions).toHaveLength(0);
  });

  it("sorts higher-rated and favorited places first", () => {
    const lowRated = makePlace({ id: "low", personalRating: 2 });
    const highRated = makePlace({ id: "high", personalRating: 5 });
    const favoriteNoRating = makePlace({ id: "fav", personalRating: null, isFavorite: true });
    const suggestions = computeRepeatVisitSuggestions({
      currentTrip: { id: "trip-2", name: "טיול שני", startDate: "2026-06-01" },
      currentTripPlaces: [
        { tripId: "trip-2", placeId: "other-place", status: "want_to_go", place: makePlace({ id: "other-place", city: "בנגקוק" }) },
      ],
      otherTrips: [{ id: "trip-1", name: "טיול ראשון", startDate: "2025-01-01" }],
      otherTripPlaces: [
        { tripId: "trip-1", placeId: lowRated.id, status: "visited", place: lowRated },
        { tripId: "trip-1", placeId: highRated.id, status: "visited", place: highRated },
        { tripId: "trip-1", placeId: favoriteNoRating.id, status: "favorite", place: favoriteNoRating },
      ],
    });

    expect(suggestions.map((s) => s.place.id)).toEqual(["high", "low", "fav"]);
  });
});
