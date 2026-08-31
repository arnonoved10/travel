import { describe, expect, it } from "vitest";
import { suggestPackingItemsForWeather } from "./packing-weather-suggestions";

function day(overrides: Partial<Parameters<typeof suggestPackingItemsForWeather>[0][number]> = {}) {
  return {
    minTemperatureC: 18,
    maxTemperatureC: 24,
    precipitationProbabilityPercent: 10,
    uvIndex: 3,
    ...overrides,
  };
}

describe("suggestPackingItemsForWeather", () => {
  it("suggests an umbrella and raincoat when any day has a high rain chance", () => {
    const result = suggestPackingItemsForWeather([day(), day({ precipitationProbabilityPercent: 70 })]);

    expect(result.map((s) => s.name)).toContain("מטריה");
    expect(result.map((s) => s.name)).toContain("מעיל גשם / ג'קט אטום למים");
  });

  it("suggests sun protection when a day is hot", () => {
    const result = suggestPackingItemsForWeather([day({ maxTemperatureC: 34 })]);

    expect(result.map((s) => s.name)).toContain("כובע ומשקפי שמש");
    expect(result.map((s) => s.name)).toContain("בקבוק מים רב-פעמי");
  });

  it("suggests sunscreen when UV index is high, independent of temperature", () => {
    const result = suggestPackingItemsForWeather([day({ uvIndex: 8, maxTemperatureC: 20 })]);

    expect(result.map((s) => s.name)).toContain("קרם הגנה");
  });

  it("suggests warm layers when a day is cold, and a winter coat when it's very cold", () => {
    const mild = suggestPackingItemsForWeather([day({ minTemperatureC: 10 })]);
    expect(mild.map((s) => s.name)).toContain("שכבות חמות / סוודר");
    expect(mild.map((s) => s.name)).not.toContain("מעיל חורף וכפפות");

    const cold = suggestPackingItemsForWeather([day({ minTemperatureC: 2 })]);
    expect(cold.map((s) => s.name)).toContain("מעיל חורף וכפפות");
  });

  it("suggests nothing for mild, dry, low-UV weather", () => {
    const result = suggestPackingItemsForWeather([day(), day()]);

    expect(result).toEqual([]);
  });

  it("ignores days with missing data instead of crashing or defaulting", () => {
    const result = suggestPackingItemsForWeather([
      { minTemperatureC: null, maxTemperatureC: null, precipitationProbabilityPercent: null, uvIndex: null },
    ]);

    expect(result).toEqual([]);
  });

  it("returns an empty list for an empty forecast", () => {
    expect(suggestPackingItemsForWeather([])).toEqual([]);
  });
});
