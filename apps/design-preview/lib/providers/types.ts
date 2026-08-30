// טיפוסים מקומיים מינימליים — עותק-קונטרקט של @travel-app/shared-types
// (רק השדות שבשימוש בפועל כאן), כדי ש-open-meteo-provider.ts ו-
// boi-frankfurter-provider.ts יהיו עצמאיים לגמרי מה-monorepo (בלי workspace
// dependency), וכך ה-app הזה ניתן לפריסה כתיקייה מבודדת בלי שום תלות חיצונית
// מלבד npm registry. הלוגיקה עצמה (הקריאות ל-Open-Meteo/BOI/Frankfurter)
// זהה ב-100% למקור ב-packages/data-layer.

export interface WeatherQuery {
  lat: number;
  lng: number;
  timezone?: string;
}

export interface WeatherForecastSnapshot {
  id: string;
  retrievedAt: string;
  latRounded: number;
  lngRounded: number;
  timezone: string;
  forecastAt: string;
  provider: string;
  isCurrentConditions: boolean;
  temperatureC: number | null;
  feelsLikeC: number | null;
  minTemperatureC: number | null;
  maxTemperatureC: number | null;
  condition: string;
  conditionIcon: string;
  precipitationProbabilityPercent: number | null;
  precipitationAmountMm: number | null;
  humidityPercent: number | null;
  windSpeedKph: number | null;
  windDirectionDeg: number | null;
  uvIndex: number | null;
  visibilityKm: number | null;
  sunrise: string | null;
  sunset: string | null;
}

export interface WeatherAlert {
  id: string;
  retrievedAt: string;
}

export interface WeatherProvider {
  readonly name: string;
  getCurrentConditions(query: WeatherQuery): Promise<Omit<WeatherForecastSnapshot, "id" | "retrievedAt">>;
  getHourlyForecast(query: WeatherQuery, options: { hours: number }): Promise<Array<Omit<WeatherForecastSnapshot, "id" | "retrievedAt">>>;
  getDailyForecast(query: WeatherQuery, options: { days: number }): Promise<Array<Omit<WeatherForecastSnapshot, "id" | "retrievedAt">>>;
  getAlerts(query: WeatherQuery): Promise<Array<Omit<WeatherAlert, "id" | "retrievedAt">>>;
}

export interface CurrencyRateSnapshot {
  currencyCode: string;
  rateToILS: number;
  asOf: string;
  source: string;
}

export interface CurrencyRateProvider {
  readonly name: string;
  getRatesToILS(currencyCodes: string[]): Promise<CurrencyRateSnapshot[]>;
}
