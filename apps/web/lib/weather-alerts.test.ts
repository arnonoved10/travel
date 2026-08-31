import { describe, expect, it } from "vitest";
import { detectWeatherAlerts, detectRainDuringActivities } from "./weather-alerts";

function hour(overrides: Partial<Parameters<typeof detectWeatherAlerts>[0][number]> = {}) {
  return {
    latRounded: 13.75,
    lngRounded: 100.5,
    timezone: "Asia/Bangkok",
    forecastAt: "2026-12-01T14:00:00.000Z",
    provider: "open-meteo",
    isCurrentConditions: false,
    temperatureC: 28,
    feelsLikeC: 30,
    minTemperatureC: null,
    maxTemperatureC: null,
    condition: "בהיר",
    conditionIcon: "☀️",
    precipitationProbabilityPercent: 10,
    precipitationAmountMm: 0,
    humidityPercent: 60,
    windSpeedKph: 10,
    windDirectionDeg: 90,
    uvIndex: 4,
    visibilityKm: 10,
    sunrise: null,
    sunset: null,
    ...overrides,
  };
}

describe("detectWeatherAlerts", () => {
  it("returns no alerts for mild weather", () => {
    expect(detectWeatherAlerts([hour()])).toEqual([]);
  });

  it("flags high rain probability", () => {
    const alerts = detectWeatherAlerts([hour({ precipitationProbabilityPercent: 75 })]);
    expect(alerts).toHaveLength(1);
    expect(alerts[0]?.title).toBe("סיכוי גבוה לגשם");
  });

  it("flags strong wind", () => {
    const alerts = detectWeatherAlerts([hour({ windSpeedKph: 55 })]);
    expect(alerts.some((a) => a.title === "רוח חזקה")).toBe(true);
  });

  it("flags extreme heat", () => {
    const alerts = detectWeatherAlerts([hour({ temperatureC: 38 })]);
    expect(alerts.some((a) => a.title === "חום קיצוני")).toBe(true);
  });

  it("flags high UV as info severity, not warning", () => {
    const alerts = detectWeatherAlerts([hour({ uvIndex: 9 })]);
    expect(alerts[0]?.severity).toBe("info");
  });

  it("never fabricates an alert from a null field", () => {
    const alerts = detectWeatherAlerts([hour({ precipitationProbabilityPercent: null, windSpeedKph: null, temperatureC: null, uvIndex: null })]);
    expect(alerts).toEqual([]);
  });

  it("can produce multiple alerts from one hour if several thresholds are crossed", () => {
    const alerts = detectWeatherAlerts([hour({ precipitationProbabilityPercent: 90, windSpeedKph: 60 })]);
    expect(alerts).toHaveLength(2);
  });
});

describe("detectRainDuringActivities", () => {
  it("flags an activity whose matched forecast crosses the rain threshold", () => {
    const alerts = detectRainDuringActivities([
      { id: "a1", name: "טיול לאי", plannedAt: "2026-12-01T10:00:00.000Z", forecastPrecipitationProbabilityPercent: 75 },
    ]);
    expect(alerts).toHaveLength(1);
    expect(alerts[0]?.activityId).toBe("a1");
  });

  it("does not flag an activity under the threshold", () => {
    const alerts = detectRainDuringActivities([
      { id: "a1", name: "טיול לאי", plannedAt: "2026-12-01T10:00:00.000Z", forecastPrecipitationProbabilityPercent: 20 },
    ]);
    expect(alerts).toHaveLength(0);
  });

  it("does not flag an activity with no matched forecast (null)", () => {
    const alerts = detectRainDuringActivities([
      { id: "a1", name: "טיול לאי", plannedAt: "2026-12-01T10:00:00.000Z", forecastPrecipitationProbabilityPercent: null },
    ]);
    expect(alerts).toHaveLength(0);
  });
});
