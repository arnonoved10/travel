import { describe, expect, it } from "vitest";
import { haversineDistanceKm } from "./haversine-distance";

describe("haversineDistanceKm", () => {
  it("returns 0 for the same point", () => {
    expect(haversineDistanceKm(13.7563, 100.5018, 13.7563, 100.5018)).toBe(0);
  });

  it("computes ~111.2km for one degree of latitude at the equator", () => {
    expect(haversineDistanceKm(0, 0, 1, 0)).toBeCloseTo(111.19, 1);
  });

  it("computes ~111.2km for one degree of longitude at the equator", () => {
    expect(haversineDistanceKm(0, 0, 0, 1)).toBeCloseTo(111.19, 1);
  });

  it("matches the known real-world distance between Tel Aviv and Jerusalem (~54km straight-line)", () => {
    const distance = haversineDistanceKm(32.0853, 34.7818, 31.7683, 35.2137);
    expect(distance).toBeGreaterThan(50);
    expect(distance).toBeLessThan(58);
  });

  it("is symmetric regardless of point order", () => {
    const a = haversineDistanceKm(13.7563, 100.5018, 12.9236, 100.8825);
    const b = haversineDistanceKm(12.9236, 100.8825, 13.7563, 100.5018);
    expect(a).toBeCloseTo(b, 10);
  });
});
