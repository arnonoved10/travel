import { describe, expect, it } from "vitest";
import { computeBudgetProgress, computeSpendingPace } from "./budget";

describe("computeBudgetProgress", () => {
  it("converts each expense to ILS and sums the total", () => {
    const result = computeBudgetProgress({
      expenses: [
        { amount: 100, currencyCode: "THB", category: "food" },
        { amount: 50, currencyCode: "USD", category: "shopping" },
      ],
      categoryLimits: [],
      totalBudgetAmount: null,
      dailyBudgetAmount: null,
      rateToILSByCurrency: new Map([
        ["THB", 0.1],
        ["USD", 3.7],
      ]),
    });

    expect(result.totalSpentAmount).toBeCloseTo(100 * 0.1 + 50 * 3.7);
    expect(result.unconvertedCurrencyCodes).toEqual([]);
  });

  it("sums spent amount per category limit", () => {
    const result = computeBudgetProgress({
      expenses: [
        { amount: 100, currencyCode: "ILS", category: "food" },
        { amount: 50, currencyCode: "ILS", category: "food" },
        { amount: 30, currencyCode: "ILS", category: "shopping" },
      ],
      categoryLimits: [
        { category: "food", limitAmount: 200 },
        { category: "shopping", limitAmount: 100 },
      ],
      totalBudgetAmount: null,
      dailyBudgetAmount: null,
      rateToILSByCurrency: new Map([["ILS", 1]]),
    });

    const food = result.categories.find((c) => c.category === "food");
    const shopping = result.categories.find((c) => c.category === "shopping");
    expect(food?.spentAmount).toBe(150);
    expect(shopping?.spentAmount).toBe(30);
  });

  it("reports zero spent for a category limit with no matching expenses", () => {
    const result = computeBudgetProgress({
      expenses: [],
      categoryLimits: [{ category: "food", limitAmount: 200 }],
      totalBudgetAmount: null,
      dailyBudgetAmount: null,
      rateToILSByCurrency: new Map(),
    });

    expect(result.categories[0]?.spentAmount).toBe(0);
  });

  it("excludes an expense whose currency has no available rate, and reports it as unconverted", () => {
    const result = computeBudgetProgress({
      expenses: [
        { amount: 100, currencyCode: "ILS", category: "food" },
        { amount: 20, currencyCode: "XYZ", category: "food" },
      ],
      categoryLimits: [],
      totalBudgetAmount: null,
      dailyBudgetAmount: null,
      rateToILSByCurrency: new Map([["ILS", 1]]),
    });

    expect(result.totalSpentAmount).toBe(100);
    expect(result.unconvertedCurrencyCodes).toEqual(["XYZ"]);
  });

  it("passes total and daily budget amounts through unchanged", () => {
    const result = computeBudgetProgress({
      expenses: [],
      categoryLimits: [],
      totalBudgetAmount: 10000,
      dailyBudgetAmount: 700,
      rateToILSByCurrency: new Map(),
    });

    expect(result.totalBudgetAmount).toBe(10000);
    expect(result.dailyBudgetAmount).toBe(700);
  });
});

describe("computeSpendingPace", () => {
  const dayDates = ["2026-06-01", "2026-06-02", "2026-06-03", "2026-06-04", "2026-06-05"];

  it("projects total spend across the whole trip from the average so far", () => {
    const result = computeSpendingPace({ dayDates, today: "2026-06-02", totalSpentAmount: 200 });

    expect(result?.daysElapsed).toBe(2);
    expect(result?.daysTotal).toBe(5);
    expect(result?.dailyAverageAmount).toBe(100);
    expect(result?.projectedTotalAmount).toBe(500);
  });

  it("clamps daysElapsed to the trip length once the trip has ended", () => {
    const result = computeSpendingPace({ dayDates, today: "2026-06-20", totalSpentAmount: 500 });

    expect(result?.daysElapsed).toBe(5);
    expect(result?.projectedTotalAmount).toBe(500);
  });

  it("clamps daysElapsed to at least 1 before the trip starts, avoiding division by zero", () => {
    const result = computeSpendingPace({ dayDates, today: "2026-05-01", totalSpentAmount: 0 });

    expect(result?.daysElapsed).toBe(1);
    expect(result?.dailyAverageAmount).toBe(0);
  });

  it("returns null when the trip has no day dates at all", () => {
    const result = computeSpendingPace({ dayDates: [], today: "2026-06-02", totalSpentAmount: 100 });

    expect(result).toBeNull();
  });
});
