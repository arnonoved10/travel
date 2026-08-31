import type { Expense } from "@travel-app/shared-types";

// פלטה קבועה, מוקצית לפי hash של שם הקטגוריה — קטגוריה היא טקסט חופשי (ראה
// DECISIONS.md, 2026-08-15), כך שאין רשימה סגורה של קטגוריות שאפשר למפות מראש.
const PALETTE = ["#7c5cff", "#3b82f6", "#06b6d4", "#22c55e", "#f97316", "#d4a017", "#ec4899", "#64748b"];

export function colorForCategory(category: string): string {
  let hash = 0;
  for (let i = 0; i < category.length; i++) hash = (hash * 31 + category.charCodeAt(i)) >>> 0;
  return PALETTE[hash % PALETTE.length]!;
}

export function mostCommonCurrency(expenses: Expense[]): string | null {
  const counts = new Map<string, number>();
  for (const e of expenses) counts.set(e.currencyCode, (counts.get(e.currencyCode) ?? 0) + 1);
  let best: string | null = null;
  let bestCount = 0;
  for (const [currency, count] of counts) {
    if (count > bestCount) {
      best = currency;
      bestCount = count;
    }
  }
  return best;
}
