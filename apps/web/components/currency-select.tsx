import type { CSSProperties } from "react";
import { ALL_CURRENCY_CODES, CURRENCY_NAMES, GLOBAL_DEFAULT_CURRENCY_CODES } from "@/lib/currencies";
import { Select } from "@/components/ui/Select";

/**
 * בורר-מטבע לבחירה במקום הקלדת קוד בן 3 אותיות (בקשת משתמש: "צריך שיהיה
 * מטבעות לבחירה ולא שאני אצטרך לרשום"). preferredCurrencyCodes (מחושב
 * ב-computePreferredCurrencyCodes, lib/preferred-currencies.ts) קובע מה
 * למעלה — שקל/דולר/אירו ואז מטבעות-המדינות-בטיול, בסדר ההגעה. בלי prop
 * הזה נופל לברירת המחדל הגלובלית (שקל/דולר/אירו בלבד למעלה).
 */
export function CurrencySelect({
  name,
  defaultValue,
  preferredCurrencyCodes = GLOBAL_DEFAULT_CURRENCY_CODES,
  required,
  style,
}: {
  name: string;
  defaultValue?: string;
  preferredCurrencyCodes?: string[];
  required?: boolean;
  style?: CSSProperties;
}) {
  const preferredSet = new Set(preferredCurrencyCodes);
  const rest = ALL_CURRENCY_CODES.filter((code) => !preferredSet.has(code)).sort((a, b) =>
    (CURRENCY_NAMES[a] ?? a).localeCompare(CURRENCY_NAMES[b] ?? b, "he"),
  );

  return (
    <Select
      name={name}
      defaultValue={defaultValue ?? ""}
      required={required}
      style={style}
      placeholder="בחר מטבע"
      groups={[
        { label: "הכי שימושיים", options: preferredCurrencyCodes.map((code) => ({ value: code, label: `${CURRENCY_NAMES[code] ?? code} (${code})` })) },
        { label: "עוד מטבעות", options: rest.map((code) => ({ value: code, label: `${CURRENCY_NAMES[code] ?? code} (${code})` })) },
      ]}
    />
  );
}
