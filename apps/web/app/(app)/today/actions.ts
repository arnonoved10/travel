"use server";

import { getWeatherProvider } from "@travel-app/data-layer";
import type { WeatherForecastSnapshot } from "@travel-app/shared-types";

export interface GpsWeatherResult {
  current: Omit<WeatherForecastSnapshot, "id" | "retrievedAt">;
  hourly: Array<Omit<WeatherForecastSnapshot, "id" | "retrievedAt">>;
}

/**
 * מזג אוויר לפי מיקום GPS אמיתי של המשתמש (לא מיקום Place מקושר לטיול) —
 * הקואורדינטות מגיעות מה-Geolocation API של הדפדפן בצד client. אותו ספק
 * אמיתי (Open-Meteo) בדיוק כמו שאר האפליקציה — לא נתון מומצא.
 */
export async function getGpsWeatherAction(lat: number, lng: number): Promise<GpsWeatherResult | null> {
  if (!Number.isFinite(lat) || !Number.isFinite(lng) || lat < -90 || lat > 90 || lng < -180 || lng > 180) {
    return null;
  }
  try {
    const weatherProvider = getWeatherProvider();
    const query = { lat, lng };
    const [current, hourly] = await Promise.all([
      weatherProvider.getCurrentConditions(query),
      weatherProvider.getHourlyForecast(query, { hours: 6 }),
    ]);
    return { current, hourly };
  } catch {
    return null;
  }
}
