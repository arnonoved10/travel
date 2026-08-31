import { describe, expect, it } from "vitest";
import { formatDistance, kmToMiles } from "./distance-format";

describe("kmToMiles", () => {
  it("converts kilometers to miles", () => {
    expect(kmToMiles(1)).toBeCloseTo(0.621371, 5);
  });
});

describe("formatDistance", () => {
  it("formats under 1km in meters (km unit)", () => {
    expect(formatDistance(0.35, "km")).toBe("350 מ'");
  });

  it("formats 1km and above with one decimal (km unit)", () => {
    expect(formatDistance(2.456, "km")).toBe(`2.5 ק"מ`);
  });

  it("formats a larger distance in miles", () => {
    expect(formatDistance(10, "miles")).toBe("6.2 mi");
  });

  it("formats a short distance in feet when using miles", () => {
    expect(formatDistance(0.1, "miles")).toBe("328 ft");
  });
});
