import { describe, expect, it } from "vitest";
import { suggestPackingItemsForTripType } from "./packing-trip-type-suggestions";

describe("suggestPackingItemsForTripType", () => {
  it("returns an empty list when no trip type is set", () => {
    expect(suggestPackingItemsForTripType(null)).toEqual([]);
  });

  it("suggests beach-specific items for a beach trip", () => {
    const result = suggestPackingItemsForTripType("beach");
    expect(result.map((s) => s.name)).toContain("בגד ים");
    expect(result.map((s) => s.name)).toContain("קרם הגנה");
  });

  it("suggests ski-specific items for a ski trip", () => {
    const result = suggestPackingItemsForTripType("ski");
    expect(result.map((s) => s.name)).toContain("כפפות");
  });

  it("returns an empty list for 'other' rather than guessing", () => {
    expect(suggestPackingItemsForTripType("other")).toEqual([]);
  });

  it("has a suggestion list defined for every trip type", () => {
    const tripTypes: Array<Parameters<typeof suggestPackingItemsForTripType>[0]> = [
      "beach",
      "ski",
      "city",
      "nature",
      "business",
      "road_trip",
      "other",
    ];
    for (const tripType of tripTypes) {
      expect(() => suggestPackingItemsForTripType(tripType)).not.toThrow();
    }
  });
});
