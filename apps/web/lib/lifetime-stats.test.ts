import { describe, expect, it } from "vitest";
import { computeLifetimeStats } from "./lifetime-stats";

describe("computeLifetimeStats", () => {
  it("sums days traveled and dedupes visited places/countries/cities across trips", () => {
    const result = computeLifetimeStats({
      trips: [
        { id: "t1", name: "תאילנד", startDate: "2026-06-01", endDate: "2026-06-05" },
        { id: "t2", name: "יוון", startDate: "2026-07-01", endDate: "2026-07-03" },
      ],
      visitedPlaceIdsByTrip: new Map([
        ["t1", ["p1", "p2"]],
        ["t2", ["p2", "p3"]],
      ]),
      countryNamesByTrip: new Map([
        ["t1", ["תאילנד"]],
        ["t2", ["יוון", " תאילנד "]],
      ]),
      cityNamesByTrip: new Map([
        ["t1", ["בנגקוק"]],
        ["t2", ["אתונה"]],
      ]),
      expensesByTrip: new Map(),
    });

    expect(result.tripsCount).toBe(2);
    expect(result.daysTraveledCount).toBe(5 + 3);
    expect(result.uniquePlacesVisitedCount).toBe(3); // p1,p2,p3
    expect(result.uniqueCountriesCount).toBe(2); // תאילנד (גם עם רווחים), יוון
    expect(result.uniqueCitiesCount).toBe(2);
  });

  it("sums expenses per currency without converting between currencies", () => {
    const result = computeLifetimeStats({
      trips: [{ id: "t1", name: "טיול", startDate: "2026-06-01", endDate: "2026-06-01" }],
      visitedPlaceIdsByTrip: new Map(),
      countryNamesByTrip: new Map(),
      cityNamesByTrip: new Map(),
      expensesByTrip: new Map([
        [
          "t1",
          [
            { amount: 100, currencyCode: "THB" },
            { amount: 50, currencyCode: "THB" },
            { amount: 20, currencyCode: "USD" },
          ],
        ],
      ]),
    });

    expect(result.totalSpentByCurrency.get("THB")).toBe(150);
    expect(result.totalSpentByCurrency.get("USD")).toBe(20);
  });

  it("picks the longest trip by day count", () => {
    const result = computeLifetimeStats({
      trips: [
        { id: "short", name: "קצר", startDate: "2026-06-01", endDate: "2026-06-02" },
        { id: "long", name: "ארוך", startDate: "2026-07-01", endDate: "2026-07-10" },
      ],
      visitedPlaceIdsByTrip: new Map(),
      countryNamesByTrip: new Map(),
      cityNamesByTrip: new Map(),
      expensesByTrip: new Map(),
    });

    expect(result.longestTrip).toEqual({ tripId: "long", name: "ארוך", dayCount: 10 });
  });

  it("returns zeroed-out stats and a null longest trip for no trips at all", () => {
    const result = computeLifetimeStats({
      trips: [],
      visitedPlaceIdsByTrip: new Map(),
      countryNamesByTrip: new Map(),
      cityNamesByTrip: new Map(),
      expensesByTrip: new Map(),
    });

    expect(result.tripsCount).toBe(0);
    expect(result.daysTraveledCount).toBe(0);
    expect(result.longestTrip).toBeNull();
    expect(result.totalSpentByCurrency.size).toBe(0);
  });
});
