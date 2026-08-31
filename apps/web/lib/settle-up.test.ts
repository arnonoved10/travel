import { describe, expect, it } from "vitest";
import { computeSettleUp } from "./settle-up";

const dana = { id: "dana", displayName: "דנה" };
const yoav = { id: "yoav", displayName: "יואב" };

describe("computeSettleUp", () => {
  it("owes the account holder their share when the account holder paid (no attributed payer)", () => {
    const result = computeSettleUp({
      expenses: [{ id: "e1", amount: 300, currencyCode: "ILS" }],
      expenseParticipantsByExpenseId: new Map([["e1", [dana.id]]]),
      payments: [],
      companions: [dana],
      rateToILSByCurrency: new Map([["ILS", 1]]),
    });

    // קבוצה של 2 (בעל החשבון + דנה), 300 ש"ח, כל אחד חייב 150 — דנה לא שילמה כלום, אז חייבת 150-
    expect(result.balances).toEqual([{ companionId: "dana", displayName: "דנה", netAmount: -150 }]);
  });

  it("credits the companion who actually paid, minus their own share", () => {
    const result = computeSettleUp({
      expenses: [{ id: "e1", amount: 300, currencyCode: "ILS" }],
      expenseParticipantsByExpenseId: new Map([["e1", [dana.id]]]),
      payments: [{ expenseId: "e1", paidByCompanionId: dana.id }],
      companions: [dana],
      rateToILSByCurrency: new Map([["ILS", 1]]),
    });

    // דנה שילמה 300, חלקה 150 — נטו מגיע לה 150
    expect(result.balances).toEqual([{ companionId: "dana", displayName: "דנה", netAmount: 150 }]);
  });

  it("splits three ways (account holder + 2 companions) and nets to zero including the implicit account holder", () => {
    const result = computeSettleUp({
      expenses: [{ id: "e1", amount: 300, currencyCode: "ILS" }],
      expenseParticipantsByExpenseId: new Map([["e1", [dana.id, yoav.id]]]),
      payments: [{ expenseId: "e1", paidByCompanionId: yoav.id }],
      companions: [dana, yoav],
      rateToILSByCurrency: new Map([["ILS", 1]]),
    });

    const byId = new Map(result.balances.map((b) => [b.companionId, b.netAmount]));
    expect(byId.get("dana")).toBeCloseTo(-100);
    expect(byId.get("yoav")).toBeCloseTo(200); // שילם 300, חלקו 100
    // + בעל החשבון (לא מיוצג): חייב 100- ; הסכום הכולל כולל בעל החשבון = 0
    expect((byId.get("dana") ?? 0) + (byId.get("yoav") ?? 0) - 100).toBeCloseTo(0);
  });

  it("converts each currency to ILS before splitting", () => {
    const result = computeSettleUp({
      expenses: [{ id: "e1", amount: 100, currencyCode: "THB" }],
      expenseParticipantsByExpenseId: new Map([["e1", [dana.id]]]),
      payments: [{ expenseId: "e1", paidByCompanionId: dana.id }],
      companions: [dana],
      rateToILSByCurrency: new Map([["THB", 0.1]]),
    });

    // 100 THB * 0.1 = 10 ש"ח, חלק דנה = 5, שילמה 10 -> נטו +5
    expect(result.balances[0]?.netAmount).toBeCloseTo(5);
  });

  it("ignores expenses without any explicitly-selected participants", () => {
    const result = computeSettleUp({
      expenses: [{ id: "e1", amount: 300, currencyCode: "ILS" }],
      expenseParticipantsByExpenseId: new Map(),
      payments: [],
      companions: [dana],
      rateToILSByCurrency: new Map([["ILS", 1]]),
    });

    expect(result.balances).toEqual([{ companionId: "dana", displayName: "דנה", netAmount: 0 }]);
  });

  it("reports an unconvertible currency instead of guessing a rate, and skips it", () => {
    const result = computeSettleUp({
      expenses: [{ id: "e1", amount: 100, currencyCode: "XYZ" }],
      expenseParticipantsByExpenseId: new Map([["e1", [dana.id]]]),
      payments: [],
      companions: [dana],
      rateToILSByCurrency: new Map(),
    });

    expect(result.balances[0]?.netAmount).toBe(0);
    expect(result.unconvertedCurrencyCodes).toEqual(["XYZ"]);
  });

  it("ignores a participant reference to a companion that no longer exists", () => {
    const result = computeSettleUp({
      expenses: [{ id: "e1", amount: 200, currencyCode: "ILS" }],
      expenseParticipantsByExpenseId: new Map([["e1", ["deleted-companion", dana.id]]]),
      payments: [],
      companions: [dana],
      rateToILSByCurrency: new Map([["ILS", 1]]),
    });

    // קבוצה עדיין 3 (בעל חשבון + 2 משתתפים שנרשמו), אבל רק דנה מיוצגת בפלט
    expect(result.balances).toEqual([{ companionId: "dana", displayName: "דנה", netAmount: -200 / 3 }]);
  });
});
