import Link from "next/link";
import type { Expense, Trip } from "@travel-app/shared-types";
import { getExpenseCategoryLabel } from "@/lib/expense-labels";
import { colorForCategory, mostCommonCurrency } from "@/lib/expense-chart-helpers";
import { DonutChart } from "@/components/donut-chart";
import { DashboardCard } from "./dashboard-card";

export function ExpensesOverviewCard({ trip, expenses }: { trip: Trip; expenses: Expense[] }) {
  // trip.baseCurrencyCode יכול להיות null (לא הוגדר) — נופל חזרה למטבע הנפוץ ביותר
  // בפועל בהוצאות, ולא ממציא ברירת מחדל שרירותית.
  const primaryCurrency = trip.baseCurrencyCode ?? mostCommonCurrency(expenses);
  const primaryExpenses = primaryCurrency ? expenses.filter((e) => e.currencyCode === primaryCurrency) : [];
  const otherCurrencyTotals = new Map<string, number>();
  for (const e of expenses) {
    if (e.currencyCode === primaryCurrency) continue;
    otherCurrencyTotals.set(e.currencyCode, (otherCurrencyTotals.get(e.currencyCode) ?? 0) + e.amount);
  }

  const totalsByCategory = new Map<string, number>();
  for (const e of primaryExpenses) {
    totalsByCategory.set(e.category, (totalsByCategory.get(e.category) ?? 0) + e.amount);
  }
  const total = primaryExpenses.reduce((sum, e) => sum + e.amount, 0);

  return (
    <DashboardCard
      title="פילוח הוצאות"
      action={
        <Link href={`/trips/${trip.id}#finances`} style={{ font: "var(--text-caption)", color: "var(--color-primary)", fontWeight: 700 }}>
          פרטים ←
        </Link>
      }
    >
      {primaryExpenses.length === 0 || !primaryCurrency ? (
        <p style={{ margin: 0, color: "var(--color-text-muted)", font: "var(--text-caption)" }}>
          {primaryCurrency ? `אין עדיין הוצאות ב-${primaryCurrency} להצגה בגרף.` : "אין עדיין הוצאות להצגה בגרף."}
        </p>
      ) : (
        <DonutChart
          segments={[...totalsByCategory.entries()].map(([category, value]) => ({
            label: getExpenseCategoryLabel(category),
            value,
            color: colorForCategory(category),
          }))}
          centerLabel={total.toLocaleString("he-IL")}
          centerSubLabel={primaryCurrency}
        />
      )}
      {otherCurrencyTotals.size > 0 ? (
        <div style={{ marginTop: "0.5rem", fontSize: "0.75rem", color: "var(--color-text-muted)" }}>
          + הוצאות נוספות שלא נכללות בגרף (מטבע אחר, בלי המרה מומצאת):{" "}
          {[...otherCurrencyTotals.entries()].map(([c, v]) => `${v.toLocaleString("he-IL")} ${c}`).join(" · ")}
        </div>
      ) : null}
    </DashboardCard>
  );
}
