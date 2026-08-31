import type { TripCountry } from "@travel-app/shared-types";
import { GLOBAL_DEFAULT_CURRENCY_CODES } from "./currencies";
import { lookupCurrencyForCountry } from "./country-currency";

/**
 * סדר-עדיפות למטבעות בבורר (CurrencySelect): המטבע המקומי של יעד-הטיול קודם
 * (לפי סדר ההגעה אליו, orderIndex), ורק אחריו דולר/אירו/שקל (GLOBAL_DEFAULT_
 * CURRENCY_CODES) — בדיוק כמו שביקש המשתמש: "בדרך כלל האופציה הראשונה תהיה
 * המטבע המקומי של אותו יעד, ורק לאחריה דולר, אירו, שקל". מדינה שלא מזוהה
 * במיפוי (country-currency.ts) פשוט מדולגת, לא שוברת את הסדר.
 */
export function computePreferredCurrencyCodes(tripCountries: TripCountry[]): string[] {
  const countryCurrencies = [...tripCountries]
    .sort((a, b) => a.orderIndex - b.orderIndex)
    .map((country) => lookupCurrencyForCountry(country.countryName))
    .filter((code): code is string => code !== null);

  return Array.from(new Set([...countryCurrencies, ...GLOBAL_DEFAULT_CURRENCY_CODES]));
}
