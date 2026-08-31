import { describe, expect, it } from "vitest";
import { placeCategorySchema, tripPlaceStatusSchema } from "@travel-app/shared-types";
import { CATEGORY_GRADIENTS } from "./marker-style";
import { PLACE_CATEGORY_ICONS } from "../place-labels";
import { TRIP_PLACE_STATUS_ICONS } from "../trip-place-labels";

describe("marker-style category coverage", () => {
  it("defines a gradient for every PlaceCategory value", () => {
    for (const category of placeCategorySchema.options) {
      expect(CATEGORY_GRADIENTS[category], `missing gradient for category "${category}"`).toBeDefined();
      expect(CATEGORY_GRADIENTS[category]).toHaveLength(2);
    }
  });

  it("defines an icon for every PlaceCategory value", () => {
    for (const category of placeCategorySchema.options) {
      expect(PLACE_CATEGORY_ICONS[category], `missing icon for category "${category}"`).toBeDefined();
    }
  });

  it("defines an icon for every TripPlaceStatus value", () => {
    for (const status of tripPlaceStatusSchema.options) {
      expect(TRIP_PLACE_STATUS_ICONS[status], `missing icon for status "${status}"`).toBeDefined();
    }
  });
});
