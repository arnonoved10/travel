import { getGooglePlacesApiKey } from "@/lib/recommendations/config";
import type { PlaceCategory, OpeningHours } from "@travel-app/shared-types";

// Places API (New) — Text Search, אותו endpoint כמו lib/recommendations/google-places-provider.ts
// (שירות המלצות) — אבל כאן צריך גם location (lat/lng), לא רק תיאור-תוצאה, כי
// המטרה היא לבחור נקודה על מפה, לא רק להציג כרטיס-המלצה. תמיד קריאה בצד-שרת
// בלבד — המפתח לעולם לא נחשף ללקוח (בשונה מ-NEXT_PUBLIC_MAPBOX_TOKEN).
// שדות עסק (טלפון/אתר/שעות/סוג) נוספו בכוונה (בקשת משתמש: "המערכת צריכה
// להתחבר לאינטרנט ולתת את כל הפרטים אוטומטית, לא לבקש ממני להקליד") — כדי
// שטופס-הוספת-מקום ימלא את עצמו מתוצאת-חיפוש, לא רק lat/lng.
const SEARCH_URL = "https://places.googleapis.com/v1/places:searchText";
const FIELD_MASK = [
  "places.id",
  "places.displayName",
  "places.formattedAddress",
  "places.location",
  "places.addressComponents",
  "places.nationalPhoneNumber",
  "places.websiteUri",
  "places.regularOpeningHours",
  "places.primaryType",
].join(",");

export interface PlaceSearchResult {
  id: string;
  placeName: string;
  lat: number;
  lng: number;
  /** מחולץ מ-addressComponents (types "country"/"locality") — לשימוש-אופציונלי
   * כמו מילוי-מראש מדינה/עיר (ר' geography-section.tsx). undefined אם גוגל לא
   * החזיר את הרכיב הזה, לא ניחוש. */
  country?: string;
  city?: string;
  /** כל השדות הבאים undefined אם גוגל לא סיפק אותם — לעולם לא ניחוש/ברירת-מחדל. */
  phone?: string;
  website?: string;
  openingHours?: OpeningHours;
  /** נגזר מ-primaryType של גוגל (ר' GOOGLE_PRIMARY_TYPE_TO_CATEGORY) — undefined
   * אם אין מיפוי מוכר, לא "other" בכוונה, כדי שהקורא יחליט מה ברירת-המחדל. */
  category?: PlaceCategory;
}

interface GoogleAddressComponent {
  longText?: string;
  types?: string[];
}

interface GoogleTimePoint {
  day?: number;
  hour?: number;
  minute?: number;
}

interface GoogleOpeningHours {
  periods?: { open?: GoogleTimePoint; close?: GoogleTimePoint }[];
}

interface GooglePlace {
  id?: string;
  displayName?: { text?: string };
  formattedAddress?: string;
  location?: { latitude?: number; longitude?: number };
  addressComponents?: GoogleAddressComponent[];
  nationalPhoneNumber?: string;
  websiteUri?: string;
  regularOpeningHours?: GoogleOpeningHours;
  primaryType?: string;
}

function extractComponent(components: GoogleAddressComponent[] | undefined, types: string[]): string | undefined {
  for (const type of types) {
    const match = components?.find((c) => c.types?.includes(type));
    if (match?.longText) return match.longText;
  }
  return undefined;
}

const DAY_KEYS = ["sun", "mon", "tue", "wed", "thu", "fri", "sat"] as const;

/** periods[].open/close.day הוא 0=ראשון...6=שבת — אותו סדר בדיוק כמו DAY_KEYS
 * באפליקציה (ר' lib/opening-hours.ts), אין המרה נדרשת. הסכימה של האפליקציה
 * תומכת רק בטווח-אחד-ליום — אם גוגל מחזירה כמה טווחים לאותו יום (הפסקת-צהריים
 * למשל), לוקחים את הראשון בלבד, לא ממזגים (אין לזה תמיכה קיימת בשום מקום אחר).*/
function mapGoogleOpeningHours(hours: GoogleOpeningHours | undefined): OpeningHours | undefined {
  if (!hours?.periods || hours.periods.length === 0) return undefined;
  const result: OpeningHours = { sun: null, mon: null, tue: null, wed: null, thu: null, fri: null, sat: null };
  for (const period of hours.periods) {
    const dayIndex = period.open?.day;
    if (dayIndex === undefined || dayIndex < 0 || dayIndex > 6) continue;
    const dayKey = DAY_KEYS[dayIndex]!;
    if (result[dayKey] !== null) continue; // כבר יש טווח ליום הזה — הראשון מנצח
    if (period.open?.hour === undefined || period.open?.minute === undefined || period.close?.hour === undefined || period.close?.minute === undefined) continue;
    result[dayKey] = {
      open: `${String(period.open.hour).padStart(2, "0")}:${String(period.open.minute).padStart(2, "0")}`,
      close: `${String(period.close.hour).padStart(2, "0")}:${String(period.close.minute).padStart(2, "0")}`,
    };
  }
  return result;
}

/** primaryType של גוגל (מחרוזת יציבה, לא תווית-מתורגמת) → קטגוריית-מקום של
 * האפליקציה. best-effort בכוונה — סוג לא-מוכר משאיר category undefined, לא "other". */
const GOOGLE_PRIMARY_TYPE_TO_CATEGORY: Record<string, PlaceCategory> = {
  lodging: "hotel",
  hotel: "hotel",
  resort_hotel: "hotel",
  restaurant: "restaurant",
  meal_takeaway: "restaurant",
  meal_delivery: "restaurant",
  cafe: "cafe",
  coffee_shop: "cafe",
  bakery: "cafe",
  bar: "bar",
  pub: "bar",
  night_club: "bar",
  shopping_mall: "mall",
  store: "shop",
  supermarket: "shop",
  clothing_store: "shop",
  gift_shop: "shop",
  jewelry_store: "shop",
  shoe_store: "shop",
  book_store: "shop",
  electronics_store: "shop",
  home_goods_store: "shop",
  department_store: "shop",
  spa: "massage",
  massage: "massage",
  tourist_attraction: "attraction",
  museum: "attraction",
  art_gallery: "attraction",
  monument: "attraction",
  amusement_park: "entertainment",
  zoo: "entertainment",
  aquarium: "entertainment",
  movie_theater: "entertainment",
  casino: "entertainment",
  bowling_alley: "entertainment",
  stadium: "entertainment",
  beach: "beach",
  park: "nature",
  national_park: "nature",
  hiking_area: "nature",
  market: "market",
  flea_market: "market",
  airport: "airport",
  train_station: "train_station",
  subway_station: "train_station",
  transit_station: "train_station",
  light_rail_station: "train_station",
  hospital: "hospital",
  doctor: "hospital",
  dentist: "hospital",
  pharmacy: "pharmacy",
  drugstore: "pharmacy",
  car_rental: "car_rental_company",
};

interface SearchTextResponse {
  places?: GooglePlace[];
}

export type PlaceSearchOutcome = { ok: true; results: PlaceSearchResult[] } | { ok: false; error: string };

interface CacheEntry {
  outcome: PlaceSearchOutcome;
  expiresAt: number;
}

// שרד-חוצה-בקשות (לא רק ה-cache-per-page-load שכבר יש ב-use-place-search.ts) —
// אותו תהליך-Node חם (Vercel serverless) יכול לשרת כמה משתמשים/עמודים ברצף,
// ואותה שאילתה (למשל שם-מלון פופולרי) חוזרת הרבה. חשוב במיוחד כי אותו מפתח-API
// משותף גם עם lib/recommendations/google-places-provider.ts ו-/api/places-photo —
// כל cache-hit כאן הוא קריאת-API אחת פחות שיכולה לתרום למכסה (429). הצלחות
// נשמרות שעה (מקומות כמעט לא זזים); 429 עצמו נשמר קצר (מונע ניסיונות-חוזרים
// מיידיים באותו חלון-דלדול-מכסה, אבל עדיין מאפשר ניסיון חדש אחרי כמה שניות).
const searchCache = new Map<string, CacheEntry>();
const SUCCESS_TTL_MS = 60 * 60 * 1000;
const RATE_LIMIT_TTL_MS = 20 * 1000;

/** חיפוש-מקום-אמיתי (שם עסק/מלון/כתובת) דרך Google Places — כיסוי עסקים/מלונות
 * גלובלי משמעותית עשיר יותר מ-Mapbox Geocoding, ר' ההערה ב-location-picker-map.tsx
 * (תלונת משתמש: שם מלון אמיתי לא נמצא בחיפוש הקודם). מחזיר מצב-שגיאה מפורש
 * (לא רק מערך ריק) כדי שהלקוח יוכל להבחין "0 תוצאות אמיתיות" מ-"החיפוש נכשל". */
export async function searchPlacesByText(query: string): Promise<PlaceSearchOutcome> {
  const cacheKey = query.trim().toLowerCase();
  const cached = searchCache.get(cacheKey);
  if (cached && cached.expiresAt > Date.now()) return cached.outcome;

  const outcome = await searchPlacesByTextUncached(query);
  const ttl = outcome.ok ? SUCCESS_TTL_MS : RATE_LIMIT_TTL_MS;
  searchCache.set(cacheKey, { outcome, expiresAt: Date.now() + ttl });
  return outcome;
}

async function searchPlacesByTextUncached(query: string): Promise<PlaceSearchOutcome> {
  const apiKey = getGooglePlacesApiKey();
  if (!apiKey) return { ok: false, error: "חיפוש מקומות לא מוגדר כרגע." };

  try {
    const response = await fetch(SEARCH_URL, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "X-Goog-Api-Key": apiKey,
        "X-Goog-FieldMask": FIELD_MASK,
      },
      body: JSON.stringify({ textQuery: query, languageCode: "he" }),
    });

    if (response.status === 429) {
      return { ok: false, error: "יותר מדי חיפושים בזמן קצר — נסה שוב בעוד כמה שניות." };
    }
    if (!response.ok) {
      return { ok: false, error: `חיפוש נכשל (${response.status}) — נסה שוב.` };
    }

    const data = (await response.json()) as SearchTextResponse;
    const results = (data.places ?? [])
      .filter((p): p is GooglePlace & { location: { latitude: number; longitude: number } } => p.location?.latitude != null && p.location?.longitude != null)
      .map((p) => ({
        id: p.id ?? `${p.location.latitude},${p.location.longitude}`,
        placeName: [p.displayName?.text, p.formattedAddress].filter(Boolean).join(", ") || (p.displayName?.text ?? query),
        lat: p.location.latitude,
        lng: p.location.longitude,
        country: extractComponent(p.addressComponents, ["country"]),
        city: extractComponent(p.addressComponents, ["locality", "administrative_area_level_2", "administrative_area_level_1"]),
        phone: p.nationalPhoneNumber,
        website: p.websiteUri,
        openingHours: mapGoogleOpeningHours(p.regularOpeningHours),
        category: p.primaryType ? GOOGLE_PRIMARY_TYPE_TO_CATEGORY[p.primaryType] : undefined,
      }));
    return { ok: true, results };
  } catch {
    return { ok: false, error: "שגיאת רשת בחיפוש — נסה שוב." };
  }
}
