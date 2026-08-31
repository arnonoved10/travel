// טיפוסי מזג אוויר — ארכיטקטורה מוכנה מראש, ללא ספק אמיתי מחובר עדיין.
// ראה 01_architecture_v2.md, סעיף "Weather" להחלטת השלב שבו זה יחובר בפועל.
// חשוב: אין כאן שום נתון מומצא/דמה — רק הצורה (shape) של נתון אמיתי שיגיע מספק
// אמיתי בעתיד. UI שמציג מזג אוויר לפני שיש ספק מחובר חייב לומר זאת במפורש,
// לא להציג ערכים ריקים/מומצאים כאילו הם תחזית.
import { z } from "zod";

export const weatherQuerySchema = z.object({
  lat: z.number().min(-90).max(90),
  lng: z.number().min(-180).max(180),
  timezone: z.string().optional(), // IANA, אם ידוע מראש (למשל מ-Place/Trip)
});
export type WeatherQuery = z.infer<typeof weatherQuerySchema>;

export const weatherForecastSnapshotSchema = z.object({
  id: z.uuid(),
  latRounded: z.number().min(-90).max(90),
  lngRounded: z.number().min(-180).max(180),
  timezone: z.string(),
  forecastAt: z.iso.datetime(),
  retrievedAt: z.iso.datetime(),
  provider: z.string(),
  isCurrentConditions: z.boolean(),
  temperatureC: z.number().nullable(),
  feelsLikeC: z.number().nullable(),
  minTemperatureC: z.number().nullable(),
  maxTemperatureC: z.number().nullable(),
  condition: z.string().nullable(),
  conditionIcon: z.string().nullable(),
  precipitationProbabilityPercent: z.number().min(0).max(100).nullable(),
  precipitationAmountMm: z.number().nonnegative().nullable(),
  humidityPercent: z.number().min(0).max(100).nullable(),
  windSpeedKph: z.number().nonnegative().nullable(),
  windDirectionDeg: z.number().min(0).max(360).nullable(),
  uvIndex: z.number().nonnegative().nullable(),
  visibilityKm: z.number().nonnegative().nullable(),
  sunrise: z.iso.datetime().nullable(),
  sunset: z.iso.datetime().nullable(),
});
export type WeatherForecastSnapshot = z.infer<typeof weatherForecastSnapshotSchema>;

export const weatherAlertSchema = z.object({
  id: z.uuid(),
  latRounded: z.number().min(-90).max(90),
  lngRounded: z.number().min(-180).max(180),
  provider: z.string(),
  severity: z.string().nullable(),
  title: z.string(),
  description: z.string().nullable(),
  startsAt: z.iso.datetime(),
  endsAt: z.iso.datetime().nullable(),
});
export type WeatherAlert = z.infer<typeof weatherAlertSchema>;

/**
 * חוזה אחיד לכל ספק מזג אוויר — כדי שאפשר יהיה להחליף/להוסיף ספק בלי לשנות
 * את שאר המערכת (אותו עיקרון כמו IntegrationProvider ל-Booking.com וכו').
 * מימוש קונקרטי (מול API אמיתי) ייבנה בשלב שבו Weather מחובר בפועל — לא כעת.
 */
export interface WeatherProvider {
  readonly name: string;

  getCurrentConditions(query: WeatherQuery): Promise<Omit<WeatherForecastSnapshot, "id" | "retrievedAt">>;

  getHourlyForecast(
    query: WeatherQuery,
    options: { hours: number },
  ): Promise<Array<Omit<WeatherForecastSnapshot, "id" | "retrievedAt">>>;

  getDailyForecast(
    query: WeatherQuery,
    options: { days: number },
  ): Promise<Array<Omit<WeatherForecastSnapshot, "id" | "retrievedAt">>>;

  /** אם התאריך המבוקש מחוץ לטווח האמין של הספק — יש להחזיר [], לא להמציא נתון. */
  getAlerts(query: WeatherQuery): Promise<Array<Omit<WeatherAlert, "id" | "retrievedAt">>>;
}
