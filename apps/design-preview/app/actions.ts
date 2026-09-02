"use server";

// עותק מקומי של ספקי מזג-האוויר/שער-המטבע (ר' lib/providers/) במקום ייבוא
// מ-@travel-app/data-layer של ה-monorepo: כך לאפליקציה המבודדת הזו אין שום
// תלות-workspace בפרויקטים אחרים בריפו — ניתנת לפריסה כתיקייה עצמאית
// לגמרי (npm install מהריפו-הזה-בלבד מספיק), בלי סיכון לגרור בטעות קוד
// הקשור ל-Prisma/DB דרך ה-barrel של data-layer.
import { openMeteoWeatherProvider } from "../lib/providers/open-meteo-provider";
import { boiFrankfurterCurrencyRateProvider } from "../lib/providers/boi-frankfurter-provider";
import { getOcrProvider } from "../lib/ocr/get-ocr-provider";

/**
 * חיבור-קריאה-בלבד למסך-ההדגמה אל שכבות-השירות שכבר קיימות ועובדות
 * במערכת האמיתית (Open-Meteo למזג-אוויר, בנק ישראל+Frankfurter לשערי-מטבע —
 * שתיהן חינמיות לגמרי, בלי מפתח API, ולא תלויות ב-DATA_SOURCE כי אין בהן
 * נתוני-משתמש שצריך לבודד). קובץ נפרד לגמרי מ-app/(app)/today/actions.ts —
 * לא נוגע בו, לא יוצר ספק חדש, רק קורא לאותן פונקציות מיוצאות בדיוק. אם
 * הקריאה נכשלת (בלי אינטרנט/הספק לא זמין), מוחזר null במקום להמציא נתון —
 * הצד הקורא (mobile-home-mock.tsx) חייב להציג זאת בבירור כשגיאה/הדגמה.
 */

const BANGKOK = { lat: 13.7563, lng: 100.5018 };

export interface DemoWeatherHour {
  time: string;
  temperatureC: number | null;
  condition: string | null;
  precipitationProbabilityPercent: number | null;
}
export interface DemoWeatherResult {
  temperatureC: number | null;
  feelsLikeC: number | null;
  minTemperatureC: number | null;
  maxTemperatureC: number | null;
  condition: string | null;
  precipitationProbabilityPercent: number | null;
  humidityPercent: number | null;
  windSpeedKph: number | null;
  sunrise: string | null;
  sunset: string | null;
  hourly: DemoWeatherHour[];
  provider: string;
}

export async function getDemoWeatherAction(): Promise<DemoWeatherResult | null> {
  try {
    const provider = openMeteoWeatherProvider;
    const [current, daily, hourly] = await Promise.all([
      provider.getCurrentConditions(BANGKOK),
      provider.getDailyForecast(BANGKOK, { days: 1 }),
      provider.getHourlyForecast(BANGKOK, { hours: 6 }),
    ]);
    return {
      temperatureC: current.temperatureC,
      feelsLikeC: current.feelsLikeC,
      minTemperatureC: daily[0]?.minTemperatureC ?? null,
      maxTemperatureC: daily[0]?.maxTemperatureC ?? null,
      condition: current.condition,
      precipitationProbabilityPercent: daily[0]?.precipitationProbabilityPercent ?? null,
      humidityPercent: current.humidityPercent,
      windSpeedKph: current.windSpeedKph,
      sunrise: daily[0]?.sunrise ?? null,
      sunset: daily[0]?.sunset ?? null,
      hourly: hourly.map((h) => ({ time: h.forecastAt, temperatureC: h.temperatureC, condition: h.condition, precipitationProbabilityPercent: h.precipitationProbabilityPercent })),
      provider: current.provider,
    };
  } catch {
    return null;
  }
}

export interface DemoOcrResult {
  ok: boolean;
  error?: string;
  providerName?: string;
  fields: { fieldName: string; extractedValue: string | null; confidenceScore: number | null }[];
}

/**
 * זיהוי-קבלה — קורא ישירות ל-getOcrProvider() (Tesseract מקומי, חינמי,
 * תמיד זמין; Claude רק אם ANTHROPIC_API_KEY כבר מוגדר) בדיוק כמו
 * ocr-actions.ts האמיתי, אבל בלי לגעת ב-DB/טיול/הרשאות אמיתיים — אין כאן
 * document/trip, רק תמונה שממתינה לאישור ידני של המשתמש בכל מקרה (בדיוק
 * כמו הזרימה האמיתית: OCR לעולם לא נכנס להוצאה בלי אישור).
 */
export async function runDemoReceiptOcrAction(imageBase64: string, mimeType: string): Promise<DemoOcrResult> {
  try {
    const provider = getOcrProvider();
    const result = await provider.extractFields({ imageBase64, mimeType });
    return { ok: result.ok, error: result.error, providerName: provider.name, fields: result.fields };
  } catch {
    return { ok: false, error: "זיהוי הקבלה נכשל", fields: [] };
  }
}

export interface DemoCurrencyResult {
  ratesToILS: Record<string, number>;
  asOf: string | null;
  source: string | null;
}

/**
 * הופך קואורדינטות (מ-navigator.geolocation אמיתי בצד-הלקוח) לקוד-מדינה
 * ISO 3166-1 alpha-2, כדי לקבוע "מטבע מקומי" לפי מיקום-מכשיר בפועל.
 * Nominatim (OpenStreetMap) — שירות חינמי, בלי מפתח, בלי הרשמה, כבר בשימוש
 * ברוח דומה בפרויקט הזה עם ספקי-OSM אחרים. נקרא משרת (לא מהדפדפן) כדי
 * להימנע מבעיות CORS ולצרף User-Agent תקין לפי מדיניות-השימוש של Nominatim.
 */
export async function reverseGeocodeCountryAction(lat: number, lng: number): Promise<{ countryCode: string; countryName: string } | null> {
  try {
    const url = `https://nominatim.openstreetmap.org/reverse?format=jsonv2&lat=${lat}&lon=${lng}&zoom=3&addressdetails=1`;
    const res = await fetch(url, { headers: { "User-Agent": "trip-master-design-preview/1.0 (demo, read-only)" } });
    if (!res.ok) return null;
    const data = await res.json();
    const code = data?.address?.country_code ? String(data.address.country_code).toUpperCase() : null;
    const name = data?.address?.country ?? null;
    if (!code) return null;
    return { countryCode: code, countryName: name ?? code };
  } catch {
    return null;
  }
}

export async function getDemoCurrencyRatesAction(): Promise<DemoCurrencyResult | null> {
  try {
    const provider = boiFrankfurterCurrencyRateProvider;
    // כל 7 המטבעות הלא-שקליים בקטלוג המובנה (ר' CURRENCY_CATALOG ב-
    // wallet-data.ts) — לא רק תת-קבוצה — אחרת המרה/דוחות ל-ILS מתעלמים
    // בשקט מהוצאה/יתרה במטבע שלא ברשימה (למשל ין יפני, מטבע-ברירת-המחדל
    // של טיול-הדמו) ומחשבים אותה כ-0.
    const snapshots = await provider.getRatesToILS(["USD", "EUR", "GBP", "THB", "JPY", "AUD", "CHF"]);
    if (snapshots.length === 0) return null;
    const ratesToILS: Record<string, number> = { ILS: 1 };
    for (const s of snapshots) ratesToILS[s.currencyCode] = s.rateToILS;
    return { ratesToILS, asOf: snapshots[0]?.asOf ?? null, source: snapshots[0]?.source ?? null };
  } catch {
    return null;
  }
}
