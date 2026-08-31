import { DEFAULT_EXPENSE_CATEGORIES } from "@travel-app/shared-types";

// ברירות מחדל מוצעות בלבד — קטגוריה היא טקסט חופשי (ראה DECISIONS.md, 2026-08-15).
// כל ערך שלא ברשימה כאן מוצג כמו שהוא (ראה getExpenseCategoryLabel).
export const EXPENSE_CATEGORY_LABELS: Record<string, string> = {
  hotel: "מלון",
  flight: "טיסה",
  transport: "תחבורה",
  car_rental: "השכרת רכב",
  food: "אוכל",
  cafe: "בית קפה",
  bar: "בר",
  massage: "מסאז׳",
  shopping: "קניות",
  fruit: "פירות",
  attraction: "אטרקציה",
  insurance: "ביטוח",
  tip: "טיפ",
  tourist_tax: "מס תיירות / דמי עירייה",
  other: "אחר",
};

export function getExpenseCategoryLabel(category: string): string {
  return EXPENSE_CATEGORY_LABELS[category] ?? category;
}

export { DEFAULT_EXPENSE_CATEGORIES };
