import { describe, expect, it } from "vitest";
import { computePlaceStats } from "./place-stats";

describe("computePlaceStats", () => {
  it("counts a visited trip-place once", () => {
    const stats = computePlaceStats({
      tripPlaces: [{ placeId: "p1", status: "visited" }],
      expenses: [],
    });
    expect(stats.get("p1")?.visitCount).toBe(1);
  });

  it("does not count a want_to_go trip-place as a visit", () => {
    const stats = computePlaceStats({
      tripPlaces: [{ placeId: "p1", status: "want_to_go" }],
      expenses: [],
    });
    expect(stats.get("p1")).toBeUndefined();
  });

  it("sums visits across multiple trips for the same place", () => {
    const stats = computePlaceStats({
      tripPlaces: [
        { placeId: "p1", status: "visited" },
        { placeId: "p1", status: "visited" },
      ],
      expenses: [],
    });
    expect(stats.get("p1")?.visitCount).toBe(2);
  });

  it("sums spent amount per currency for a place", () => {
    const stats = computePlaceStats({
      tripPlaces: [],
      expenses: [
        { placeId: "p1", amount: 100, currencyCode: "THB" },
        { placeId: "p1", amount: 50, currencyCode: "THB" },
        { placeId: "p1", amount: 10, currencyCode: "USD" },
      ],
    });
    expect(stats.get("p1")?.spentByCurrency.get("THB")).toBe(150);
    expect(stats.get("p1")?.spentByCurrency.get("USD")).toBe(10);
  });

  it("ignores an expense with no placeId", () => {
    const stats = computePlaceStats({
      tripPlaces: [],
      expenses: [{ placeId: null, amount: 100, currencyCode: "THB" }],
    });
    expect(stats.size).toBe(0);
  });

  it("keeps visits and spend separate per place", () => {
    const stats = computePlaceStats({
      tripPlaces: [{ placeId: "p1", status: "visited" }],
      expenses: [{ placeId: "p2", amount: 100, currencyCode: "THB" }],
    });
    expect(stats.get("p1")?.spentByCurrency.size).toBe(0);
    expect(stats.get("p2")?.visitCount).toBe(0);
  });
});
