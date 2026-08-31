import type { CurrencyRateProvider, CurrencyRateSnapshot } from "@travel-app/shared-types";

// שני מקורות חינמיים בלי מפתח API — ראה DECISIONS.md ("CurrencyRateProvider").
// בנק ישראל מפרסם "שער יציג" רשמי, אבל רק לכ-14 מטבעות (לא כולל THB) — לכל
// מטבע שהוא לא מכסה נופלים ל-Frankfurter (מבוסס ECB). אם שני המקורות נכשלים
// למטבע מסוים, הוא פשוט לא מופיע בתוצאה — לעולם לא שער מומצא/קבוע.
const BOI_URL = "https://boi.org.il/PublicApi/GetExchangeRates";
const FRANKFURTER_URL = "https://api.frankfurter.dev/v1/latest";

// חבילת data-layer לא רואה את הרחבת-הטיפוסים של Next.js ל-RequestInit (זו
// מגיעה מ-next-env.d.ts, שנטען רק ב-apps/web) — אבל ה-fetch monkey-patch של
// Next.js תומך ב-next.revalidate בזמן-ריצה בכל מקום שרץ בתוך בקשת-שרת שלו,
// כולל כאן. עוטפים ב-helper עם טיפוס מקומי במקום any/הכפלת ה-cast בכל קריאה.
type CacheableRequestInit = RequestInit & { next?: { revalidate?: number } };

function cachedFetch(input: string | URL, revalidateSeconds: number): Promise<Response> {
  const init: CacheableRequestInit = { next: { revalidate: revalidateSeconds } };
  return fetch(input, init);
}

interface BoiRateEntry {
  key: string;
  currentExchangeRate: number;
  unit: number;
  lastUpdate: string;
}

interface BoiResponse {
  exchangeRates: BoiRateEntry[];
}

interface FrankfurterResponse {
  date: string;
  rates: Record<string, number>;
}

async function fetchBoiRates(): Promise<Map<string, { rateToILS: number; asOf: string }>> {
  const result = new Map<string, { rateToILS: number; asOf: string }>();
  try {
    // שער-חליפין לא מתעדכן יותר מפעם ביום אצל אף אחד מהמקורות — cache של שעה
    // מונע פגיעה חוזרת ב-API החיצוני בכל טעינת עמוד (היה חוסם את ה-render).
    const response = await cachedFetch(BOI_URL, 3600);
    if (!response.ok) return result;
    const data = (await response.json()) as BoiResponse;
    for (const row of data.exchangeRates ?? []) {
      const unit = row.unit > 0 ? row.unit : 1;
      result.set(row.key.toUpperCase(), {
        rateToILS: row.currentExchangeRate / unit,
        asOf: row.lastUpdate,
      });
    }
  } catch {
    // בנק ישראל לא זמין — לא זורקים, פשוט ממשיכים ל-Frankfurter לכל המטבעות.
  }
  return result;
}

async function fetchFrankfurterRate(currencyCode: string): Promise<{ rateToILS: number; asOf: string } | null> {
  try {
    const url = new URL(FRANKFURTER_URL);
    url.searchParams.set("base", currencyCode);
    url.searchParams.set("symbols", "ILS");
    const response = await cachedFetch(url, 3600);
    if (!response.ok) return null;
    const data = (await response.json()) as FrankfurterResponse;
    const rate = data.rates?.ILS;
    if (typeof rate !== "number" || !Number.isFinite(rate) || rate <= 0) return null;
    return { rateToILS: rate, asOf: data.date };
  } catch {
    return null;
  }
}

export class BoiFrankfurterCurrencyRateProvider implements CurrencyRateProvider {
  readonly name = "boi-frankfurter";

  async getRatesToILS(currencyCodes: string[]): Promise<CurrencyRateSnapshot[]> {
    const uniqueCodes = Array.from(new Set(currencyCodes.map((code) => code.toUpperCase())));
    const snapshots: CurrencyRateSnapshot[] = [];

    const remaining = uniqueCodes.filter((code) => code !== "ILS");
    if (uniqueCodes.includes("ILS")) {
      snapshots.push({ currencyCode: "ILS", rateToILS: 1, asOf: new Date().toISOString().slice(0, 10), source: "boi" });
    }
    if (remaining.length === 0) return snapshots;

    const boiRates = await fetchBoiRates();
    const stillMissing: string[] = [];
    for (const code of remaining) {
      const boiRate = boiRates.get(code);
      if (boiRate) {
        snapshots.push({ currencyCode: code, rateToILS: boiRate.rateToILS, asOf: boiRate.asOf, source: "boi" });
      } else {
        stillMissing.push(code);
      }
    }

    const fallbackResults = await Promise.allSettled(stillMissing.map((code) => fetchFrankfurterRate(code)));
    fallbackResults.forEach((outcome, index) => {
      if (outcome.status === "fulfilled" && outcome.value) {
        snapshots.push({
          currencyCode: stillMissing[index]!,
          rateToILS: outcome.value.rateToILS,
          asOf: outcome.value.asOf,
          source: "frankfurter",
        });
      }
    });

    return snapshots;
  }
}

export const boiFrankfurterCurrencyRateProvider = new BoiFrankfurterCurrencyRateProvider();
