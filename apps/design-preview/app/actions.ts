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

export async function getDemoWeatherAction(location?: { lat: number; lng: number }): Promise<DemoWeatherResult | null> {
  try {
    const provider = openMeteoWeatherProvider;
    const coords = location ?? BANGKOK;
    const [current, daily, hourly] = await Promise.all([
      provider.getCurrentConditions(coords),
      provider.getDailyForecast(coords, { days: 1 }),
      provider.getHourlyForecast(coords, { hours: 6 }),
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

/**
 * הופכת שם-מקום (עיר/אתר/כתובת חופשית) לקואורדינטות אמיתיות — משמשת את
 * מסך המסלול (מיקום תחנה) ואת הוספת-פעילות (מיקום נקודתי בתוך היום), כדי
 * שהמפה תציג נקודות/מסלול אמיתיים ולא ממציאה מיקום. אותו Nominatim
 * (OpenStreetMap) חינמי-בלי-מפתח כמו reverseGeocodeCountryAction למעלה,
 * נקרא משרת מאותה סיבה בדיוק (CORS + User-Agent תקין). countryCode
 * מצמצם את החיפוש למדינה הנכונה כשידוע (חובה כדי לא לבלבל בין ערים
 * באותו שם במדינות שונות).
 */
export async function geocodeQueryAction(query: string, countryCode?: string | null): Promise<{ lat: number; lon: number; displayName: string } | null> {
  const trimmed = query.trim();
  if (!trimmed) return null;
  try {
    const params = new URLSearchParams({ format: "jsonv2", q: trimmed, limit: "1" });
    if (countryCode) params.set("countrycodes", countryCode.toLowerCase());
    const url = `https://nominatim.openstreetmap.org/search?${params.toString()}`;
    const res = await fetch(url, { headers: { "User-Agent": "trip-master-design-preview/1.0 (demo, read-only)" } });
    if (!res.ok) return null;
    const data = await res.json();
    const hit = Array.isArray(data) ? data[0] : null;
    if (!hit || hit.lat == null || hit.lon == null) return null;
    return { lat: Number(hit.lat), lon: Number(hit.lon), displayName: String(hit.display_name ?? trimmed) };
  } catch {
    return null;
  }
}

/**
 * הופכת נקודה שנלחצה על המפה לשם-מקום קריא (עיר + מדינה) — משמשת את
 * "בחירת מיקום על המפה" (גם כשאין עדיין טיול/מסלול): המשתמש לוחץ על
 * המפה, ומקבל מיד שם-מקום אמיתי במקום קואורדינטות גולמיות. Nominatim
 * reverse, אותו עיקרון בדיוק כמו reverseGeocodeCountryAction למעלה, רק
 * ברזולוציית-עיר (zoom=12) ולא רזולוציית-מדינה בלבד.
 */
export async function reverseGeocodePlaceAction(lat: number, lon: number): Promise<{ displayName: string; city: string; countryCode: string } | null> {
  try {
    const url = `https://nominatim.openstreetmap.org/reverse?format=jsonv2&lat=${lat}&lon=${lon}&zoom=12&addressdetails=1`;
    const res = await fetch(url, { headers: { "User-Agent": "trip-master-design-preview/1.0 (demo, read-only)" } });
    if (!res.ok) return null;
    const data = await res.json();
    const addr = data?.address ?? {};
    const city: string | null = addr.city ?? addr.town ?? addr.village ?? addr.municipality ?? addr.county ?? null;
    const countryCode: string | null = addr.country_code ? String(addr.country_code).toUpperCase() : null;
    if (!city || !countryCode) return null;
    return { displayName: String(data.display_name ?? city), city, countryCode };
  } catch {
    return null;
  }
}

export interface NearbyPlace {
  id: string;
  name: string;
  category: "cafe" | "restaurant" | "bar" | "viewpoint" | "attraction";
  lat: number;
  lon: number;
}

// רדיוסים קטנים בכוונה: שאילתת "tourism=attraction" רחבה מאוד (מכסה כל
// מיני דברים בעיר צפופה) ויקרה חישובית — שאילתה משולבת עם רדיוס גדול מדי
// גרמה בפועל ל-timeout מלא בצד Overpass (עד 25+ שניות, גם עם [timeout:20]
// בשאילתה עצמה) ולרשימה ריקה בכל פעם, גם כשיש המון מקומות אמיתיים
// בקרבת-מקום. נמצא ונתפס בבדיקה בפועל.
const OVERPASS_CATEGORY_QUERY: Record<NearbyPlace["category"], string> = {
  cafe: `node["amenity"="cafe"]["name"](around:1200,{lat},{lon});`,
  restaurant: `node["amenity"="restaurant"]["name"](around:1200,{lat},{lon});`,
  bar: `node["amenity"~"^(bar|pub)$"]["name"](around:1200,{lat},{lon});`,
  viewpoint: `node["tourism"="viewpoint"]["name"](around:2000,{lat},{lon});`,
  attraction: `node["tourism"="attraction"]["name"](around:1200,{lat},{lon});`,
};

/**
 * שולפת מקומות אמיתיים סביב נקודה (בתי קפה/מסעדות/ברים/תצפיות/אטרקציות)
 * דרך Overpass API — שאילתת-מפה חופשית-לגמרי, בלי מפתח, על נתוני
 * OpenStreetMap (אותו מקור-אמת בדיוק כמו אריחי המפה וה-geocoding כאן) —
 * לפי בקשה מפורשת: "שברגע שאני כותב יעד תוכל להמליץ לי על מקומות". לא
 * ממציאה מקומות — אם Overpass לא זמין/עמוס, מוחזרת רשימה ריקה במקום
 * נתון מזויף, בדיוק כמו כל שאר הפעולות-החיצוניות באפליקציה הזו.
 */
export async function nearbyPlacesAction(lat: number, lon: number): Promise<NearbyPlace[]> {
  try {
    const query = `[out:json][timeout:10];(${Object.values(OVERPASS_CATEGORY_QUERY)
      .map((q) => q.replace(/{lat}/g, String(lat)).replace(/{lon}/g, String(lon)))
      .join("")});out center 60;`;
    // AbortController נדיב אך סופי: Overpass החינמי-משותף לפעמים לא עומד אפילו
    // ב-[timeout:10] הפנימי שלו (עמוס/מוגבל-קצב), ואז פשוט לא עונה בכלל —
    // בלי זה הקריאה הייתה יכולה להיתקע דקות, במקום להיכשל בשקט לרשימה ריקה.
    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), 12000);
    let res: Response;
    try {
      res = await fetch("https://overpass-api.de/api/interpreter", {
        method: "POST",
        headers: { "Content-Type": "text/plain", "User-Agent": "trip-master-design-preview/1.0 (demo, read-only)" },
        body: query,
        signal: controller.signal,
      });
    } finally {
      clearTimeout(timer);
    }
    if (!res.ok) return [];
    const data = await res.json();
    const elements: { id: number; lat: number; lon: number; tags?: Record<string, string> }[] = Array.isArray(data?.elements) ? data.elements : [];
    const results: NearbyPlace[] = [];
    for (const el of elements) {
      const tags = el.tags ?? {};
      const name = tags.name;
      if (!name || el.lat == null || el.lon == null) continue;
      let category: NearbyPlace["category"] | null = null;
      if (tags.amenity === "cafe") category = "cafe";
      else if (tags.amenity === "restaurant") category = "restaurant";
      else if (tags.amenity === "bar" || tags.amenity === "pub") category = "bar";
      else if (tags.tourism === "viewpoint") category = "viewpoint";
      else if (tags.tourism === "attraction") category = "attraction";
      if (!category) continue;
      results.push({ id: String(el.id), name, category, lat: el.lat, lon: el.lon });
    }
    // עד 10 לכל קטגוריה, כדי שקטגוריה עתירת-תוצאות (למשל מסעדות בעיר גדולה)
    // לא תציף/תדחוק החוצה קטגוריות דלילות יותר (למשל תצפיות).
    const perCategory = new Map<string, number>();
    return results.filter((p) => {
      const n = perCategory.get(p.category) ?? 0;
      if (n >= 10) return false;
      perCategory.set(p.category, n + 1);
      return true;
    });
  } catch {
    return [];
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
