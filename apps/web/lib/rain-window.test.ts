import { describe, expect, it } from "vitest";
import { computeRainWindows } from "./rain-window";

function hour(hh: number, probability: number | null) {
  return { forecastAt: `2026-08-17T${String(hh).padStart(2, "0")}:00:00.000Z`, precipitationProbabilityPercent: probability };
}

describe("computeRainWindows", () => {
  it("returns no windows when nothing crosses the threshold", () => {
    expect(computeRainWindows([hour(10, 10), hour(11, 20), hour(12, 30)])).toEqual([]);
  });

  it("groups consecutive high-probability hours into one window", () => {
    const windows = computeRainWindows([hour(10, 20), hour(11, 60), hour(12, 80), hour(13, 70), hour(14, 10)]);
    expect(windows).toEqual([{ startAt: hour(11, 0).forecastAt, endAt: hour(13, 0).forecastAt, maxProbabilityPercent: 80 }]);
  });

  it("splits into separate windows when there's a gap below threshold", () => {
    const windows = computeRainWindows([hour(9, 60), hour(10, 10), hour(15, 70)]);
    expect(windows).toHaveLength(2);
    expect(windows[0]!.startAt).toBe(hour(9, 0).forecastAt);
    expect(windows[1]!.startAt).toBe(hour(15, 0).forecastAt);
  });

  it("treats null probability as below threshold and ignores it, not fabricating a value", () => {
    const windows = computeRainWindows([hour(9, 60), hour(10, null), hour(11, 65)]);
    expect(windows).toHaveLength(2);
  });

  it("respects a custom threshold", () => {
    expect(computeRainWindows([hour(9, 40)], 30)).toHaveLength(1);
    expect(computeRainWindows([hour(9, 40)], 50)).toHaveLength(0);
  });
});
