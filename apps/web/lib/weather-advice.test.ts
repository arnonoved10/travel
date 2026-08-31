import { describe, expect, it } from "vitest";
import { getWeatherAdvice } from "./weather-advice";
import type { WeatherForecastSnapshot } from "@travel-app/shared-types";

function makeSnapshot(overrides: Partial<WeatherForecastSnapshot> = {}): WeatherForecastSnapshot {
  return {
    id: "550e8400-e29b-41d4-a716-446655440000",
    latRounded: 13.75,
    lngRounded: 100.5,
    timezone: "Asia/Bangkok",
    forecastAt: "2026-08-16T09:00:00",
    retrievedAt: "2026-08-16T09:00:00Z",
    provider: "open-meteo",
    isCurrentConditions: true,
    temperatureC: 28,
    feelsLikeC: 28,
    minTemperatureC: null,
    maxTemperatureC: null,
    condition: "בהיר",
    conditionIcon: "☀️",
    precipitationProbabilityPercent: 10,
    precipitationAmountMm: null,
    humidityPercent: 60,
    windSpeedKph: 10,
    windDirectionDeg: null,
    uvIndex: 5,
    visibilityKm: null,
    sunrise: null,
    sunset: null,
    ...overrides,
  };
}

describe("getWeatherAdvice", () => {
  it("recommends an umbrella and flags motorbike rain risk when precipitation probability is high", () => {
    const advice = getWeatherAdvice(makeSnapshot({ precipitationProbabilityPercent: 80 }));
    expect(advice.some((a) => a.includes("מטריה"))).toBe(true);
    expect(advice.some((a) => a.includes("אופנוע"))).toBe(true);
  });

  it("does not mention rain when precipitation probability is low", () => {
    const advice = getWeatherAdvice(makeSnapshot({ precipitationProbabilityPercent: 10 }));
    expect(advice.some((a) => a.includes("מטריה"))).toBe(false);
  });

  it("recommends light clothing when it feels very hot", () => {
    const advice = getWeatherAdvice(makeSnapshot({ feelsLikeC: 35 }));
    expect(advice.some((a) => a.includes("בגדים קלים"))).toBe(true);
  });

  it("recommends a warm layer when it feels cold", () => {
    const advice = getWeatherAdvice(makeSnapshot({ feelsLikeC: 10 }));
    expect(advice.some((a) => a.includes("שכבה חמה"))).toBe(true);
  });

  it("flags high UV index", () => {
    const advice = getWeatherAdvice(makeSnapshot({ uvIndex: 9 }));
    expect(advice.some((a) => a.includes("UV"))).toBe(true);
  });

  it("returns an empty list for mild, unremarkable weather", () => {
    const advice = getWeatherAdvice(makeSnapshot({ precipitationProbabilityPercent: 5, feelsLikeC: 22, uvIndex: 3, windSpeedKph: 5 }));
    expect(advice).toEqual([]);
  });

  it("falls back to temperatureC when feelsLikeC is null", () => {
    const advice = getWeatherAdvice(makeSnapshot({ feelsLikeC: null, temperatureC: 33 }));
    expect(advice.some((a) => a.includes("בגדים קלים"))).toBe(true);
  });
});
