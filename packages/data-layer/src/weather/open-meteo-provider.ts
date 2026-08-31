import type { WeatherAlert, WeatherForecastSnapshot, WeatherProvider, WeatherQuery } from "@travel-app/shared-types";
import { wmoCodeToCondition } from "./wmo-codes";

type OmSnapshot = Omit<WeatherForecastSnapshot, "id" | "retrievedAt">;

interface OpenMeteoResponse {
  timezone: string;
  current?: {
    time: string;
    temperature_2m: number;
    apparent_temperature: number;
    relative_humidity_2m: number;
    weather_code: number;
    wind_speed_10m: number;
    wind_direction_10m: number;
  };
  hourly?: {
    time: string[];
    temperature_2m: number[];
    precipitation_probability: number[];
    weather_code: number[];
  };
  daily?: {
    time: string[];
    temperature_2m_max: number[];
    temperature_2m_min: number[];
    weather_code: number[];
    precipitation_probability_max: number[];
    uv_index_max: number[];
    sunrise: string[];
    sunset: string[];
  };
}

function toIsoWithTimezoneOffset(localTime: string): string {
  // Open-Meteo מחזיר זמן מקומי בלי offset ("2026-08-16T09:00") — לא נוגעים בו,
  // רק מוסיפים שניות כדי ש-z.iso.datetime() יקבל את הפורמט. זה "זמן מקומי
  // באזור הזמן שביקשנו", לא UTC — תואם למגבלת ה-datetime-local הידועה בשאר
  // האפליקציה (ראה bookings/actions.ts).
  return localTime.length === 16 ? `${localTime}:00` : localTime;
}

const CACHE_TTL_MS = 10 * 60 * 1000; // 10 דקות — תחזית לא משתנה כל שנייה; מצמצם עומס על ה-API החינמי וקריאות כפולות (current+hourly+daily לאותו מיקום בפועל מגיעים באותה תגובה).

function weatherCacheKey(query: WeatherQuery): string {
  // מעוגל ל-2 ספרות (~1.1 ק"מ) — מספיק לתחזית, מגדיל משמעותית את שיעור ה-cache hit.
  return `${query.lat.toFixed(2)},${query.lng.toFixed(2)},${query.timezone ?? "auto"}`;
}

/**
 * מימוש WeatherProvider אמיתי מול Open-Meteo (open-meteo.com) — חינמי
 * לגמרי, בלי צורך במפתח API, באותו רוח כמו ההחלטה על Leaflet+OSM במקום
 * Google Maps. הנתונים כאן תמיד אמיתיים מהספק — אף פעם לא ממציאים ערך.
 */
export class OpenMeteoWeatherProvider implements WeatherProvider {
  readonly name = "open-meteo";

  // מפתח → הבטחה בעיבוד (לא רק תוצאה) — כדי שקריאות מקבילות לאותו מיקום
  // (current+hourly+daily יחד, כמו ב-today/page.tsx) ישתפו קריאת HTTP אחת
  // בפועל, לא רק קריאות עוקבות. cache-per-instance בכוונה (לא module-level)
  // כדי שבדיקות עם providers נפרדים יישארו מבודדות זו מזו.
  private cache = new Map<string, { promise: Promise<OpenMeteoResponse>; cachedAt: number }>();

  private fetchOpenMeteo(query: WeatherQuery): Promise<OpenMeteoResponse> {
    const key = weatherCacheKey(query);
    const cached = this.cache.get(key);
    if (cached && Date.now() - cached.cachedAt < CACHE_TTL_MS) {
      return cached.promise;
    }

    const promise = (async () => {
      const url = new URL("https://api.open-meteo.com/v1/forecast");
      url.searchParams.set("latitude", String(query.lat));
      url.searchParams.set("longitude", String(query.lng));
      url.searchParams.set("current", "temperature_2m,apparent_temperature,relative_humidity_2m,weather_code,wind_speed_10m,wind_direction_10m");
      url.searchParams.set("hourly", "temperature_2m,precipitation_probability,weather_code");
      url.searchParams.set("daily", "temperature_2m_max,temperature_2m_min,weather_code,precipitation_probability_max,uv_index_max,sunrise,sunset");
      url.searchParams.set("timezone", query.timezone ?? "auto");
      // 16 = המקסימום הנתמך בטייר החינמי של Open-Meteo (גם ל-hourly וגם ל-daily) —
      // מאפשר תחזית אמיתית (לא מומצאת) למסלול/יעד-הבא גם בטיולים ארוכים יותר
      // מ-7 ימים, לא רק ליום-יומיים הקרובים.
      url.searchParams.set("forecast_days", "16");

      const response = await fetch(url);
      if (!response.ok) {
        this.cache.delete(key); // לא שומרים כשל בקאש — נסיון הבא יבצע קריאה אמיתית מחדש
        throw new Error(`Open-Meteo request failed: ${response.status}`);
      }
      return response.json() as Promise<OpenMeteoResponse>;
    })();

    this.cache.set(key, { promise, cachedAt: Date.now() });
    return promise;
  }

  async getCurrentConditions(query: WeatherQuery): Promise<OmSnapshot> {
    const data = await this.fetchOpenMeteo(query);
    if (!data.current) {
      throw new Error("Open-Meteo response missing current conditions");
    }
    const { condition, icon } = wmoCodeToCondition(data.current.weather_code);
    return {
      latRounded: query.lat,
      lngRounded: query.lng,
      timezone: data.timezone,
      forecastAt: toIsoWithTimezoneOffset(data.current.time),
      provider: this.name,
      isCurrentConditions: true,
      temperatureC: data.current.temperature_2m,
      feelsLikeC: data.current.apparent_temperature,
      minTemperatureC: null,
      maxTemperatureC: null,
      condition,
      conditionIcon: icon,
      precipitationProbabilityPercent: null,
      precipitationAmountMm: null,
      humidityPercent: data.current.relative_humidity_2m,
      windSpeedKph: data.current.wind_speed_10m,
      windDirectionDeg: data.current.wind_direction_10m,
      uvIndex: null,
      visibilityKm: null,
      sunrise: null,
      sunset: null,
    };
  }

  async getHourlyForecast(query: WeatherQuery, options: { hours: number }): Promise<OmSnapshot[]> {
    const data = await this.fetchOpenMeteo(query);
    if (!data.hourly) return [];

    return data.hourly.time.slice(0, options.hours).map((time, index) => {
      const { condition, icon } = wmoCodeToCondition(data.hourly!.weather_code[index]!);
      return {
        latRounded: query.lat,
        lngRounded: query.lng,
        timezone: data.timezone,
        forecastAt: toIsoWithTimezoneOffset(time),
        provider: this.name,
        isCurrentConditions: false,
        temperatureC: data.hourly!.temperature_2m[index] ?? null,
        feelsLikeC: null,
        minTemperatureC: null,
        maxTemperatureC: null,
        condition,
        conditionIcon: icon,
        precipitationProbabilityPercent: data.hourly!.precipitation_probability[index] ?? null,
        precipitationAmountMm: null,
        humidityPercent: null,
        windSpeedKph: null,
        windDirectionDeg: null,
        uvIndex: null,
        visibilityKm: null,
        sunrise: null,
        sunset: null,
      };
    });
  }

  async getDailyForecast(query: WeatherQuery, options: { days: number }): Promise<OmSnapshot[]> {
    const data = await this.fetchOpenMeteo(query);
    if (!data.daily) return [];

    return data.daily.time.slice(0, options.days).map((time, index) => {
      const { condition, icon } = wmoCodeToCondition(data.daily!.weather_code[index]!);
      return {
        latRounded: query.lat,
        lngRounded: query.lng,
        timezone: data.timezone,
        forecastAt: toIsoWithTimezoneOffset(`${time}T12:00`),
        provider: this.name,
        isCurrentConditions: false,
        temperatureC: null,
        feelsLikeC: null,
        minTemperatureC: data.daily!.temperature_2m_min[index] ?? null,
        maxTemperatureC: data.daily!.temperature_2m_max[index] ?? null,
        condition,
        conditionIcon: icon,
        precipitationProbabilityPercent: data.daily!.precipitation_probability_max[index] ?? null,
        precipitationAmountMm: null,
        humidityPercent: null,
        windSpeedKph: null,
        windDirectionDeg: null,
        uvIndex: data.daily!.uv_index_max[index] ?? null,
        visibilityKm: null,
        sunrise: toIsoWithTimezoneOffset(data.daily!.sunrise[index]!),
        sunset: toIsoWithTimezoneOffset(data.daily!.sunset[index]!),
      };
    });
  }

  async getAlerts(_query: WeatherQuery): Promise<Array<Omit<WeatherAlert, "id" | "retrievedAt">>> {
    // Open-Meteo (הספק החינמי שנבחר) לא חושף API אזהרות גלובלי אמין —
    // מחזירים [] בכנות במקום להמציא/לנחש התראה. ראה הערת הכלל בראש
    // packages/shared-types/src/weather.ts.
    return [];
  }
}

export const openMeteoWeatherProvider = new OpenMeteoWeatherProvider();
