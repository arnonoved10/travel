// שער יציג — ראה DECISIONS.md ("CurrencyRateProvider: בנק ישראל + Frankfurter")
// לבחירת המקורות. חשוב: אין כאן שום נתון מומצא — אם אף מקור לא הצליח לפתור
// מטבע מסוים, הוא פשוט לא מופיע בתוצאה (לא 0, לא ערך קבוע). אותו עיקרון
// כמו WeatherProvider/RoutingProvider.
import { z } from "zod";

export const currencyRateSnapshotSchema = z.object({
  currencyCode: z.string().length(3),
  rateToILS: z.number().positive(),
  asOf: z.string(),
  source: z.enum(["boi", "frankfurter"]),
});
export type CurrencyRateSnapshot = z.infer<typeof currencyRateSnapshotSchema>;

/**
 * חוזה אחיד לספק שערי חליפין — מראה את התבנית של WeatherProvider/RoutingProvider.
 * מימוש קונקרטי יחיד כרגע: BoiFrankfurterCurrencyRateProvider.
 */
export interface CurrencyRateProvider {
  readonly name: string;

  /** מחזיר רק את המטבעות שהצליח לפתור — לא מרפד את מה שנכשל בערך מומצא. */
  getRatesToILS(currencyCodes: string[]): Promise<CurrencyRateSnapshot[]>;
}
