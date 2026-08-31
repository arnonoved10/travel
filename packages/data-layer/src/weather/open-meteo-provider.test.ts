import { afterEach, describe, expect, it, vi } from "vitest";
import { OpenMeteoWeatherProvider } from "./open-meteo-provider";

const query = { lat: 13.7563, lng: 100.5018, timezone: "Asia/Bangkok" };

const sampleResponse = {
  timezone: "Asia/Bangkok",
  current: {
    time: "2026-08-16T09:00",
    temperature_2m: 30.5,
    apparent_temperature: 35.1,
    relative_humidity_2m: 78,
    weather_code: 61,
    wind_speed_10m: 10.2,
    wind_direction_10m: 180,
  },
  hourly: {
    time: ["2026-08-16T09:00", "2026-08-16T10:00", "2026-08-16T11:00"],
    temperature_2m: [30.5, 31.2, 32.0],
    precipitation_probability: [80, 60, 20],
    weather_code: [61, 3, 1],
  },
  daily: {
    time: ["2026-08-16", "2026-08-17"],
    temperature_2m_max: [33.5, 34.0],
    temperature_2m_min: [26.0, 25.5],
    weather_code: [95, 3],
    precipitation_probability_max: [90, 30],
    uv_index_max: [9, 8],
    sunrise: ["2026-08-16T06:05", "2026-08-17T06:05"],
    sunset: ["2026-08-16T18:39", "2026-08-17T18:39"],
  },
};

function stubFetchWith(body: unknown, ok = true): void {
  vi.stubGlobal(
    "fetch",
    vi.fn(async () => ({ ok, status: ok ? 200 : 500, json: async () => body }) as Response),
  );
}

describe("OpenMeteoWeatherProvider", () => {
  afterEach(() => {
    vi.unstubAllGlobals();
  });

  it("maps current conditions from a real-shaped Open-Meteo response", async () => {
    stubFetchWith(sampleResponse);
    const provider = new OpenMeteoWeatherProvider();

    const current = await provider.getCurrentConditions(query);

    expect(current.provider).toBe("open-meteo");
    expect(current.isCurrentConditions).toBe(true);
    expect(current.temperatureC).toBe(30.5);
    expect(current.feelsLikeC).toBe(35.1);
    expect(current.condition).toBe("גשם קל");
    expect(current.humidityPercent).toBe(78);
  });

  it("maps the requested number of hourly entries in order", async () => {
    stubFetchWith(sampleResponse);
    const provider = new OpenMeteoWeatherProvider();

    const hourly = await provider.getHourlyForecast(query, { hours: 2 });

    expect(hourly).toHaveLength(2);
    expect(hourly[0]?.temperatureC).toBe(30.5);
    expect(hourly[0]?.precipitationProbabilityPercent).toBe(80);
    expect(hourly[1]?.temperatureC).toBe(31.2);
  });

  it("maps daily forecast including min/max and sunrise/sunset", async () => {
    stubFetchWith(sampleResponse);
    const provider = new OpenMeteoWeatherProvider();

    const daily = await provider.getDailyForecast(query, { days: 2 });

    expect(daily).toHaveLength(2);
    expect(daily[0]?.minTemperatureC).toBe(26.0);
    expect(daily[0]?.maxTemperatureC).toBe(33.5);
    expect(daily[0]?.condition).toBe("סופת רעמים");
    expect(daily[0]?.sunrise).toContain("2026-08-16T06:05");
  });

  it("returns an empty array for alerts rather than inventing one", async () => {
    stubFetchWith(sampleResponse);
    const provider = new OpenMeteoWeatherProvider();

    const alerts = await provider.getAlerts(query);

    expect(alerts).toEqual([]);
  });

  it("throws instead of returning fabricated data when the request fails", async () => {
    stubFetchWith({}, false);
    const provider = new OpenMeteoWeatherProvider();

    await expect(provider.getCurrentConditions(query)).rejects.toThrow();
  });

  it("reuses one HTTP request for current+hourly+daily at the same location (cache)", async () => {
    const fetchSpy = vi.fn(async () => ({ ok: true, status: 200, json: async () => sampleResponse }) as Response);
    vi.stubGlobal("fetch", fetchSpy);
    const provider = new OpenMeteoWeatherProvider();

    await Promise.all([
      provider.getCurrentConditions(query),
      provider.getHourlyForecast(query, { hours: 2 }),
      provider.getDailyForecast(query, { days: 2 }),
    ]);

    expect(fetchSpy).toHaveBeenCalledTimes(1);
  });

  it("fetches again for a different location instead of reusing another location's cache", async () => {
    const fetchSpy = vi.fn(async () => ({ ok: true, status: 200, json: async () => sampleResponse }) as Response);
    vi.stubGlobal("fetch", fetchSpy);
    const provider = new OpenMeteoWeatherProvider();

    await provider.getCurrentConditions(query);
    await provider.getCurrentConditions({ lat: 40.7128, lng: -74.006, timezone: "America/New_York" });

    expect(fetchSpy).toHaveBeenCalledTimes(2);
  });

  it("does not cache a failed request — a retry performs a real HTTP call", async () => {
    const fetchSpy = vi.fn(async () => ({ ok: false, status: 500, json: async () => ({}) }) as Response);
    vi.stubGlobal("fetch", fetchSpy);
    const provider = new OpenMeteoWeatherProvider();

    await expect(provider.getCurrentConditions(query)).rejects.toThrow();
    await expect(provider.getCurrentConditions(query)).rejects.toThrow();

    expect(fetchSpy).toHaveBeenCalledTimes(2);
  });

  it("does not share a cache between two separate provider instances", async () => {
    const fetchSpy = vi.fn(async () => ({ ok: true, status: 200, json: async () => sampleResponse }) as Response);
    vi.stubGlobal("fetch", fetchSpy);

    await new OpenMeteoWeatherProvider().getCurrentConditions(query);
    await new OpenMeteoWeatherProvider().getCurrentConditions(query);

    expect(fetchSpy).toHaveBeenCalledTimes(2);
  });
});
