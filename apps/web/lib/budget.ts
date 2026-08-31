export interface BudgetExpenseInput {
  amount: number;
  currencyCode: string;
  category: string;
}

export interface BudgetCategoryLimitInput {
  category: string;
  limitAmount: number;
}

export interface BudgetCategoryProgress {
  category: string;
  limitAmount: number;
  spentAmount: number;
}

export interface BudgetProgress {
  totalBudgetAmount: number | null;
  dailyBudgetAmount: number | null;
  totalSpentAmount: number;
  categories: BudgetCategoryProgress[];
  /** מטבעות שהופיעו בהוצאות אך לא היה עבורם שער חליפין זמין — לא נכללו בסכומים למעלה. */
  unconvertedCurrencyCodes: string[];
}

/**
 * מחשב "כמה הוצא בפועל" (סה"כ + לפי קטגוריה) ב-₪, ממיר כל הוצאה דרך שער
 * חליפין חי (CurrencyRateProvider — ר' DECISIONS.md). הוצאה במטבע שאין לו
 * שער זמין לא נכללת בסכום — לא מומצא ערך, רק מדווחת כ"לא הומרה".
 */
export function computeBudgetProgress(params: {
  expenses: BudgetExpenseInput[];
  categoryLimits: BudgetCategoryLimitInput[];
  totalBudgetAmount: number | null;
  dailyBudgetAmount: number | null;
  rateToILSByCurrency: Map<string, number>;
}): BudgetProgress {
  const { expenses, categoryLimits, totalBudgetAmount, dailyBudgetAmount, rateToILSByCurrency } = params;

  let totalSpentAmount = 0;
  const spentByCategory = new Map<string, number>();
  const unconverted = new Set<string>();

  for (const expense of expenses) {
    const rate = rateToILSByCurrency.get(expense.currencyCode);
    if (rate === undefined) {
      unconverted.add(expense.currencyCode);
      continue;
    }
    const amountILS = expense.amount * rate;
    totalSpentAmount += amountILS;
    spentByCategory.set(expense.category, (spentByCategory.get(expense.category) ?? 0) + amountILS);
  }

  const categories: BudgetCategoryProgress[] = categoryLimits.map((limit) => ({
    category: limit.category,
    limitAmount: limit.limitAmount,
    spentAmount: spentByCategory.get(limit.category) ?? 0,
  }));

  return {
    totalBudgetAmount,
    dailyBudgetAmount,
    totalSpentAmount,
    categories,
    unconvertedCurrencyCodes: Array.from(unconverted).sort(),
  };
}

export interface SpendingPace {
  daysElapsed: number;
  daysTotal: number;
  dailyAverageAmount: number;
  projectedTotalAmount: number;
}

/**
 * "בקצב הנוכחי תסיים בסביבות X" — קצב יומי ממוצע (סה"כ שהוצא / ימים שעברו
 * עד היום) מוכפל במספר הימים הכולל של הטיול. `totalSpentAmount` כבר
 * ב-₪ (תוצר של computeBudgetProgress) — לא ממיר בעצמו. מחזיר null כשאין
 * ימי-טיול בכלל (טיול בלי startDate/endDate תקינים).
 */
export function computeSpendingPace(params: { dayDates: string[]; today: string; totalSpentAmount: number }): SpendingPace | null {
  const { dayDates, today, totalSpentAmount } = params;
  if (dayDates.length === 0) return null;

  const daysTotal = dayDates.length;
  const daysElapsed = Math.min(daysTotal, Math.max(1, dayDates.filter((d) => d <= today).length));
  const dailyAverageAmount = totalSpentAmount / daysElapsed;

  return { daysElapsed, daysTotal, dailyAverageAmount, projectedTotalAmount: dailyAverageAmount * daysTotal };
}
