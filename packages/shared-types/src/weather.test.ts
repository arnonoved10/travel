import { describe, expect, it } from "vitest";
import { weatherForecastSnapshotSchema, weatherAlertSchema } from "./weather";
import { tripDateChangeImpactReportSchema } from "./trip";

describe("weatherForecastSnapshotSchema", () => {
  it("accepts a realistic snapshot", () => {
    const result = weatherForecastSnapshotSchema.safeParse({
      id: "550e8400-e29b-41d4-a716-446655440000",
      latRounded: 12.93,
      lngRounded: 100.88,
      timezone: "Asia/Bangkok",
      forecastAt: "2026-09-01T09:00:00Z",
      retrievedAt: "2026-09-01T08:00:00Z",
      provider: "test-provider",
      isCurrentConditions: false,
      temperatureC: 33,
      feelsLikeC: 37,
      minTemperatureC: 27,
      maxTemperatureC: 34,
      condition: "rain",
      conditionIcon: null,
      precipitationProbabilityPercent: 70,
      precipitationAmountMm: 5.2,
      humidityPercent: 80,
      windSpeedKph: 12,
      windDirectionDeg: 180,
      uvIndex: 9,
      visibilityKm: 8,
      sunrise: "2026-09-01T05:50:00Z",
      sunset: "2026-09-01T18:10:00Z",
    });

    expect(result.success).toBe(true);
  });

  it("rejects a humidity value above 100", () => {
    const result = weatherForecastSnapshotSchema.safeParse({
      id: "550e8400-e29b-41d4-a716-446655440000",
      latRounded: 12.93,
      lngRounded: 100.88,
      timezone: "Asia/Bangkok",
      forecastAt: "2026-09-01T09:00:00Z",
      retrievedAt: "2026-09-01T08:00:00Z",
      provider: "test-provider",
      isCurrentConditions: false,
      temperatureC: null,
      feelsLikeC: null,
      minTemperatureC: null,
      maxTemperatureC: null,
      condition: null,
      conditionIcon: null,
      precipitationProbabilityPercent: null,
      precipitationAmountMm: null,
      humidityPercent: 150,
      windSpeedKph: null,
      windDirectionDeg: null,
      uvIndex: null,
      visibilityKm: null,
      sunrise: null,
      sunset: null,
    });

    expect(result.success).toBe(false);
  });
});

describe("weatherAlertSchema", () => {
  it("accepts an alert without an end time", () => {
    const result = weatherAlertSchema.safeParse({
      id: "550e8400-e29b-41d4-a716-446655440001",
      latRounded: 12.93,
      lngRounded: 100.88,
      provider: "test-provider",
      severity: "moderate",
      title: "גשם כבד צפוי",
      description: null,
      startsAt: "2026-09-01T12:00:00Z",
      endsAt: null,
    });

    expect(result.success).toBe(true);
  });
});

describe("tripDateChangeImpactReportSchema", () => {
  it("accepts a report with overlapping hotel booking pairs", () => {
    const result = tripDateChangeImpactReportSchema.safeParse({
      nightsWithoutHotel: ["2026-09-05"],
      hotelsOutsideNewRange: [],
      overlappingHotelBookingIds: [
        ["550e8400-e29b-41d4-a716-446655440002", "550e8400-e29b-41d4-a716-446655440003"],
      ],
      activitiesOutsideNewRange: [],
      flightsOutsideNewRange: [],
      transportNeedingReview: [],
      newDaysWithoutPlanning: ["2026-09-06"],
    });

    expect(result.success).toBe(true);
  });
});
