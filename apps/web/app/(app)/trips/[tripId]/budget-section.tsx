import type { BudgetCategoryLimit, Trip } from "@travel-app/shared-types";
import type { BudgetProgress, SpendingPace } from "@/lib/budget";
import { getExpenseCategoryLabel } from "@/lib/expense-labels";
import { BudgetSettingsForm } from "./budget-settings-form";
import { BudgetCategoryLimitForm } from "./finances/budget-category-limit-form";
import { DeleteBudgetCategoryLimitButton } from "./finances/delete-budget-category-limit-button";

function formatILS(amount: number): string {
  return `₪${Math.round(amount).toLocaleString("he-IL")}`;
}

function ProgressBar({ ratio }: { ratio: number }) {
  const percent = Math.min(100, Math.max(0, Math.round(ratio * 100)));
  const color = ratio >= 1 ? "var(--color-danger)" : ratio >= 0.9 ? "#e0a800" : "var(--color-primary)";
  return (
    <div style={{ height: "6px", borderRadius: "3px", background: "var(--color-bg-elevated)", overflow: "hidden" }}>
      <div style={{ width: `${percent}%`, height: "100%", background: color }} />
    </div>
  );
}

export function BudgetSection({
  trip,
  progress,
  categoryLimits,
  spendingPace,
}: {
  trip: Trip;
  progress: BudgetProgress;
  categoryLimits: BudgetCategoryLimit[];
  spendingPace: SpendingPace | null;
}) {
  return (
    <section
      id="budget"
      style={{
        padding: "1rem",
        borderRadius: "10px",
        border: "1px solid var(--color-border)",
        display: "flex",
        flexDirection: "column",
        gap: "0.75rem",
      }}
    >
      <h2 style={{ fontSize: "1.125rem", margin: 0 }}>תקציב</h2>

      <BudgetSettingsForm trip={trip} />

      {progress.totalBudgetAmount !== null ? (
        <div>
          <div style={{ fontSize: "0.875rem", marginBottom: "0.25rem" }}>
            {formatILS(progress.totalSpentAmount)} מתוך {formatILS(progress.totalBudgetAmount)} תקציב כולל
          </div>
          <ProgressBar ratio={progress.totalSpentAmount / progress.totalBudgetAmount} />
        </div>
      ) : (
        <p style={{ color: "var(--color-text-muted)", fontSize: "0.875rem", margin: 0 }}>לא הוגדר תקציב כולל לטיול.</p>
      )}

      {spendingPace && progress.totalSpentAmount > 0 ? (
        <p style={{ fontSize: "0.8125rem", color: "var(--color-text-muted)", margin: 0 }}>
          📈 קצב נוכחי: {formatILS(spendingPace.dailyAverageAmount)}/יום ({spendingPace.daysElapsed} מתוך {spendingPace.daysTotal} ימים) —
          בקצב הזה תסיים את הטיול בסביבות {formatILS(spendingPace.projectedTotalAmount)}
          {progress.totalBudgetAmount !== null && spendingPace.projectedTotalAmount > progress.totalBudgetAmount ? " ⚠️ מעל התקציב הכולל" : ""}
        </p>
      ) : null}

      {progress.dailyBudgetAmount !== null ? (
        <div style={{ fontSize: "0.8125rem", color: "var(--color-text-muted)" }}>תקציב יומי מוגדר: {formatILS(progress.dailyBudgetAmount)}</div>
      ) : null}

      {progress.unconvertedCurrencyCodes.length > 0 ? (
        <p style={{ fontSize: "0.75rem", color: "var(--color-text-muted)", margin: 0 }}>
          לא נכלל בסכומים: הוצאות במטבע {progress.unconvertedCurrencyCodes.join(", ")} — לא נמצא עבורן שער חליפין זמין כרגע.
        </p>
      ) : null}

      {categoryLimits.length > 0 ? (
        <div style={{ display: "flex", flexDirection: "column", gap: "0.5rem" }}>
          <h3 style={{ fontSize: "0.9375rem", margin: 0 }}>תקציב לפי קטגוריה</h3>
          {progress.categories.map((categoryProgress) => {
            const limit = categoryLimits.find((l) => l.category === categoryProgress.category);
            if (!limit) return null;
            return (
              <div key={limit.id}>
                <div style={{ fontSize: "0.8125rem", marginBottom: "0.25rem", display: "flex", alignItems: "center" }}>
                  <span>
                    {getExpenseCategoryLabel(categoryProgress.category)}: {formatILS(categoryProgress.spentAmount)} מתוך{" "}
                    {formatILS(categoryProgress.limitAmount)}
                  </span>
                  <DeleteBudgetCategoryLimitButton tripId={trip.id} limitId={limit.id} />
                </div>
                <ProgressBar ratio={categoryProgress.spentAmount / categoryProgress.limitAmount} />
              </div>
            );
          })}
        </div>
      ) : null}

      <BudgetCategoryLimitForm tripId={trip.id} />
    </section>
  );
}
