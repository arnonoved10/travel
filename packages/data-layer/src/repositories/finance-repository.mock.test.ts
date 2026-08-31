import { beforeEach, describe, expect, it } from "vitest";
import { MockFinanceRepository } from "./finance-repository.mock";
import { DepositNotFoundError, ExpenseNotFoundError, WalletNotFoundError } from "./finance-repository";

const tripId = "44444444-4444-4444-8444-444444444444";

describe("MockFinanceRepository", () => {
  let repo: MockFinanceRepository;

  beforeEach(() => {
    repo = new MockFinanceRepository();
  });

  it("creates a wallet with initialAmount as both initial and current balance", async () => {
    const wallet = await repo.topUpWallet({ input: { tripId, currencyCode: "THB", initialAmount: 5000 } });
    expect(wallet.initialAmount).toBe(5000);
    expect(wallet.currentBalance).toBe(5000);
  });

  it("adds to an existing wallet's balance on a second top-up for the same currency", async () => {
    await repo.topUpWallet({ input: { tripId, currencyCode: "THB", initialAmount: 5000 } });
    const wallet = await repo.topUpWallet({ input: { tripId, currencyCode: "THB", initialAmount: 1000 } });

    expect(wallet.currentBalance).toBe(6000);
    const wallets = await repo.listWallets({ tripId });
    expect(wallets.filter((w) => w.currencyCode === "THB")).toHaveLength(1);
  });

  it("keeps openingBalance frozen at the first top-up, while initialAmount keeps growing", async () => {
    await repo.topUpWallet({ input: { tripId, currencyCode: "THB", initialAmount: 5000 } });
    const wallet = await repo.topUpWallet({ input: { tripId, currencyCode: "THB", initialAmount: 1000 } });

    expect(wallet.openingBalance).toBe(5000);
    expect(wallet.initialAmount).toBe(6000);
  });

  it("reduces the matching wallet balance automatically on a cash payment", async () => {
    await repo.topUpWallet({ input: { tripId, currencyCode: "THB", initialAmount: 5000 } });
    const expense = await repo.createExpense({
      input: { tripId, category: "food", amount: 300, currencyCode: "THB", expenseAt: new Date().toISOString() },
    });

    await repo.createPayment({
      input: {
        expenseId: expense.id,
        amount: 300,
        currencyCode: "THB",
        paymentAt: new Date().toISOString(),
        paymentMethod: "cash",
      },
    });

    const [wallet] = await repo.listWallets({ tripId });
    expect(wallet?.currentBalance).toBe(4700);
  });

  it("does not touch wallet balance for a credit card payment", async () => {
    await repo.topUpWallet({ input: { tripId, currencyCode: "THB", initialAmount: 5000 } });
    const expense = await repo.createExpense({
      input: { tripId, category: "shopping", amount: 300, currencyCode: "THB", expenseAt: new Date().toISOString() },
    });

    await repo.createPayment({
      input: {
        expenseId: expense.id,
        amount: 300,
        currencyCode: "THB",
        paymentAt: new Date().toISOString(),
        paymentMethod: "credit_card",
      },
    });

    const [wallet] = await repo.listWallets({ tripId });
    expect(wallet?.currentBalance).toBe(5000);
  });

  it("lists payments for an expense in chronological order", async () => {
    const expense = await repo.createExpense({
      input: { tripId, category: "hotel", amount: 1000, currencyCode: "THB", expenseAt: new Date().toISOString() },
    });

    await repo.createPayment({
      input: {
        expenseId: expense.id,
        amount: 400,
        currencyCode: "THB",
        paymentAt: "2026-01-01T10:00:00.000Z",
        paymentMethod: "cash",
      },
    });
    await repo.createPayment({
      input: {
        expenseId: expense.id,
        amount: 600,
        currencyCode: "THB",
        paymentAt: "2026-01-02T10:00:00.000Z",
        paymentMethod: "credit_card",
      },
    });

    const payments = await repo.listPayments({ expenseId: expense.id });
    expect(payments).toHaveLength(2);
    expect(payments[0]?.amount).toBe(400);
    expect(payments[1]?.amount).toBe(600);
  });

  it("moves money between two currency wallets on exchange, without creating an expense", async () => {
    await repo.topUpWallet({ input: { tripId, currencyCode: "USD", initialAmount: 500 } });

    await repo.createCurrencyExchange({
      input: {
        tripId,
        givenAmount: 100,
        givenCurrencyCode: "USD",
        receivedAmount: 3200,
        receivedCurrencyCode: "THB",
        actualRate: 32,
        exchangeAt: new Date().toISOString(),
      },
    });

    const wallets = await repo.listWallets({ tripId });
    const usd = wallets.find((w) => w.currencyCode === "USD");
    const thb = wallets.find((w) => w.currencyCode === "THB");
    expect(usd?.currentBalance).toBe(400);
    expect(thb?.currentBalance).toBe(3200);

    const expenses = await repo.listExpenses({ tripId });
    expect(expenses).toHaveLength(0);
  });

  it("creates the received-currency wallet automatically if it did not exist yet", async () => {
    await repo.topUpWallet({ input: { tripId, currencyCode: "USD", initialAmount: 500 } });

    await repo.createCurrencyExchange({
      input: {
        tripId,
        givenAmount: 100,
        givenCurrencyCode: "USD",
        receivedAmount: 3200,
        receivedCurrencyCode: "THB",
        actualRate: 32,
        exchangeAt: new Date().toISOString(),
      },
    });

    const wallets = await repo.listWallets({ tripId });
    expect(wallets.some((w) => w.currencyCode === "THB")).toBe(true);
  });

  it("corrects a currency exchange's amounts and re-adjusts both wallets by the delta", async () => {
    await repo.topUpWallet({ input: { tripId, currencyCode: "USD", initialAmount: 500 } });
    const exchange = await repo.createCurrencyExchange({
      input: {
        tripId,
        givenAmount: 100,
        givenCurrencyCode: "USD",
        receivedAmount: 3200,
        receivedCurrencyCode: "THB",
        actualRate: 32,
        exchangeAt: new Date().toISOString(),
      },
    });

    // Typo caught after the fact: really gave 110 USD and received 3300 THB, not 100/3200.
    const corrected = await repo.correctCurrencyExchange({
      input: { exchangeId: exchange.id, correctedGivenAmount: 110, correctedReceivedAmount: 3300, reason: "תיקון הקלדה" },
    });

    expect(corrected.givenAmount).toBe(110);
    expect(corrected.receivedAmount).toBe(3300);
    expect(corrected.actualRate).toBeCloseTo(30);

    const wallets = await repo.listWallets({ tripId });
    const usd = wallets.find((w) => w.currencyCode === "USD");
    const thb = wallets.find((w) => w.currencyCode === "THB");
    // 500 - 110 (not 500 - 100 - extra 10) — the correction re-adjusts by the delta on top of the original effect.
    expect(usd?.currentBalance).toBe(390);
    expect(thb?.currentBalance).toBe(3300);
  });

  it("does not create a wallet-transaction adjustment when a corrected amount is unchanged", async () => {
    await repo.topUpWallet({ input: { tripId, currencyCode: "USD", initialAmount: 500 } });
    const exchange = await repo.createCurrencyExchange({
      input: {
        tripId,
        givenAmount: 100,
        givenCurrencyCode: "USD",
        receivedAmount: 3200,
        receivedCurrencyCode: "THB",
        actualRate: 32,
        exchangeAt: new Date().toISOString(),
      },
    });
    const txCountBefore = (await repo.listWalletTransactions({ tripId })).length;

    // Only the received amount changes — the given (USD) leg should get no new adjustment transaction.
    await repo.correctCurrencyExchange({
      input: { exchangeId: exchange.id, correctedGivenAmount: 100, correctedReceivedAmount: 3300 },
    });

    const txAfter = await repo.listWalletTransactions({ tripId });
    expect(txAfter).toHaveLength(txCountBefore + 1);
    expect(txAfter.filter((tx) => tx.type === "adjustment")).toHaveLength(1);
  });

  it("stores tip recipient and tip category on a tip expense", async () => {
    const tip = await repo.createExpense({
      input: {
        tripId,
        category: "tip",
        amount: 100,
        currencyCode: "THB",
        expenseAt: new Date().toISOString(),
        tipRecipient: "המלצר בבית הקפה",
        tipCategory: "waiter",
      },
    });

    expect(tip.tipRecipient).toBe("המלצר בבית הקפה");
    expect(tip.tipCategory).toBe("waiter");
  });

  it("leaves tip fields null for a non-tip expense", async () => {
    const expense = await repo.createExpense({
      input: { tripId, category: "food", amount: 100, currencyCode: "THB", expenseAt: new Date().toISOString() },
    });

    expect(expense.tipRecipient).toBeNull();
    expect(expense.tipCategory).toBeNull();
  });

  it("accepts a brand-new category that isn't one of the default suggestions", async () => {
    const expense = await repo.createExpense({
      input: { tripId, category: "צלילה", amount: 300, currencyCode: "THB", expenseAt: new Date().toISOString() },
    });

    expect(expense.category).toBe("צלילה");
    const list = await repo.listExpenses({ tripId });
    expect(list.map((e) => e.id)).toContain(expense.id);
  });

  it("stores place, rating, and item name/quantity for a dedicated-category expense", async () => {
    const expense = await repo.createExpense({
      input: {
        tripId,
        category: "shopping",
        amount: 250,
        currencyCode: "THB",
        expenseAt: new Date().toISOString(),
        placeId: "33333333-3333-4333-8333-333333333333",
        personalRating: 4,
        itemName: "מזכרת",
        quantity: 2,
      },
    });

    expect(expense.placeId).toBe("33333333-3333-4333-8333-333333333333");
    expect(expense.personalRating).toBe(4);
    expect(expense.itemName).toBe("מזכרת");
    expect(expense.quantity).toBe(2);
  });

  it("leaves place/rating/item fields null when not provided", async () => {
    const expense = await repo.createExpense({
      input: { tripId, category: "transport", amount: 100, currencyCode: "THB", expenseAt: new Date().toISOString() },
    });

    expect(expense.placeId).toBeNull();
    expect(expense.personalRating).toBeNull();
    expect(expense.itemName).toBeNull();
    expect(expense.quantity).toBeNull();
  });

  it("rejects an empty category", async () => {
    await expect(
      repo.createExpense({
        input: { tripId, category: "", amount: 100, currencyCode: "THB", expenseAt: new Date().toISOString() },
      }),
    ).rejects.toThrow();
  });

  it("rejects an exchange with a non-positive rate", async () => {
    await expect(
      repo.createCurrencyExchange({
        input: {
          tripId,
          givenAmount: 100,
          givenCurrencyCode: "USD",
          receivedAmount: 3200,
          receivedCurrencyCode: "THB",
          actualRate: 0,
          exchangeAt: new Date().toISOString(),
        },
      }),
    ).rejects.toThrow();
  });

  it("credits the matching wallet automatically when a refund is recorded", async () => {
    await repo.topUpWallet({ input: { tripId, currencyCode: "THB", initialAmount: 5000 } });
    const expense = await repo.createExpense({
      input: { tripId, category: "shopping", amount: 1000, currencyCode: "THB", expenseAt: new Date().toISOString() },
    });

    const refund = await repo.createRefund({
      input: {
        tripId,
        sourceExpenseId: expense.id,
        amount: 150,
        currencyCode: "THB",
        reason: "החזר מס",
        refundAt: new Date().toISOString(),
      },
    });

    expect(refund.amount).toBe(150);
    const [wallet] = await repo.listWallets({ tripId });
    expect(wallet?.currentBalance).toBe(5150);

    const refunds = await repo.listRefunds({ tripId });
    expect(refunds.map((r) => r.id)).toContain(refund.id);
  });

  it("does not credit the wallet yet when a refund is recorded as pending", async () => {
    await repo.topUpWallet({ input: { tripId, currencyCode: "THB", initialAmount: 5000 } });
    const expense = await repo.createExpense({
      input: { tripId, category: "shopping", amount: 1000, currencyCode: "THB", expenseAt: new Date().toISOString() },
    });

    const refund = await repo.createRefund({
      input: {
        tripId,
        sourceExpenseId: expense.id,
        amount: 150,
        currencyCode: "THB",
        refundAt: "2026-05-01T00:00:00.000Z",
        isReceived: false,
      },
    });

    expect(refund.isReceived).toBe(false);
    const [wallet] = await repo.listWallets({ tripId });
    expect(wallet?.currentBalance).toBe(5000);
  });

  it("credits the wallet and flips isReceived when a pending refund is marked received", async () => {
    await repo.topUpWallet({ input: { tripId, currencyCode: "THB", initialAmount: 5000 } });
    const expense = await repo.createExpense({
      input: { tripId, category: "shopping", amount: 1000, currencyCode: "THB", expenseAt: new Date().toISOString() },
    });
    const refund = await repo.createRefund({
      input: {
        tripId,
        sourceExpenseId: expense.id,
        amount: 150,
        currencyCode: "THB",
        refundAt: "2026-05-01T00:00:00.000Z",
        isReceived: false,
      },
    });

    const updated = await repo.markRefundReceived({ input: { refundId: refund.id, receivedDate: "2026-06-01" } });

    expect(updated.isReceived).toBe(true);
    expect(updated.refundAt.slice(0, 10)).toBe("2026-06-01");
    const [wallet] = await repo.listWallets({ tripId });
    expect(wallet?.currentBalance).toBe(5150);
  });

  it("records a wallet transaction for a top-up", async () => {
    const wallet = await repo.topUpWallet({ input: { tripId, currencyCode: "THB", initialAmount: 5000 } });

    const txs = await repo.listWalletTransactions({ tripId });
    expect(txs).toHaveLength(1);
    expect(txs[0]?.walletId).toBe(wallet.id);
    expect(txs[0]?.type).toBe("top_up");
    expect(txs[0]?.amount).toBe(5000);
  });

  it("records wallet transactions for a cash payment, exchange, and refund, newest first", async () => {
    const wait = () => new Promise((resolve) => setTimeout(resolve, 2));

    await repo.topUpWallet({ input: { tripId, currencyCode: "THB", initialAmount: 5000 } });
    const expense = await repo.createExpense({
      input: { tripId, category: "food", amount: 300, currencyCode: "THB", expenseAt: new Date().toISOString() },
    });
    await wait();
    await repo.createPayment({
      input: { expenseId: expense.id, amount: 300, currencyCode: "THB", paymentAt: new Date().toISOString(), paymentMethod: "cash" },
    });
    await wait();
    await repo.createCurrencyExchange({
      input: {
        tripId,
        givenAmount: 100,
        givenCurrencyCode: "USD",
        receivedAmount: 3200,
        receivedCurrencyCode: "THB",
        actualRate: 32,
        exchangeAt: new Date().toISOString(),
      },
    });
    await wait();
    await repo.createRefund({
      input: { tripId, sourceExpenseId: expense.id, amount: 50, currencyCode: "THB", refundAt: new Date().toISOString() },
    });

    const txs = await repo.listWalletTransactions({ tripId });
    const types = txs.map((t) => t.type);
    expect(types).toContain("top_up");
    expect(types).toContain("cash_payment_out");
    expect(types).toContain("exchange_out");
    expect(types).toContain("exchange_in");
    expect(types).toContain("refund_in");
    // ממוין מהחדש לישן — refund_in (האחרון שנוצר) צריך להיות ראשון
    expect(txs[0]?.type).toBe("refund_in");
  });

  it("creates a deposit and reduces the matching wallet balance", async () => {
    await repo.topUpWallet({ input: { tripId, currencyCode: "THB", initialAmount: 5000 } });
    const deposit = await repo.createDeposit({
      input: { tripId, amount: 2000, currencyCode: "THB", paidTo: "בעל הדירה", reason: "פיקדון דירה" },
    });

    expect(deposit.isReturned).toBe(false);
    const [wallet] = await repo.listWallets({ tripId });
    expect(wallet?.currentBalance).toBe(3000);

    const txs = await repo.listWalletTransactions({ tripId });
    expect(txs.some((t) => t.type === "deposit_out" && t.amount === -2000)).toBe(true);
  });

  it("marks a deposit as returned and credits the wallet with the returned amount", async () => {
    const deposit = await repo.createDeposit({ input: { tripId, amount: 2000, currencyCode: "THB" } });
    const returned = await repo.markDepositReturned({
      input: { depositId: deposit.id, returnedAmount: 1800, returnedDate: "2026-08-20" },
    });

    expect(returned.isReturned).toBe(true);
    expect(returned.returnedAmount).toBe(1800);
    const [wallet] = await repo.listWallets({ tripId });
    // -2000 מהפיקדון + 1800 מההחזר = -200 (הארנק נוצר עם -2000 כי לא היה קיים לפני)
    expect(wallet?.currentBalance).toBe(-200);
  });

  it("reconciles a wallet to a counted amount and records the difference as an adjustment", async () => {
    const wallet = await repo.topUpWallet({ input: { tripId, currencyCode: "THB", initialAmount: 5000 } });

    const reconciled = await repo.reconcileWallet({ input: { walletId: wallet.id, actualBalance: 4700, reason: "ספירה בפועל" } });

    expect(reconciled.currentBalance).toBe(4700);
    const txs = await repo.listWalletTransactions({ tripId });
    const adjustment = txs.find((t) => t.type === "adjustment");
    expect(adjustment?.amount).toBe(-300);
    expect(adjustment?.notes).toBe("ספירה בפועל");
  });

  it("records a positive adjustment when the actual amount is higher than expected", async () => {
    const wallet = await repo.topUpWallet({ input: { tripId, currencyCode: "THB", initialAmount: 1000 } });

    await repo.reconcileWallet({ input: { walletId: wallet.id, actualBalance: 1200 } });

    const txs = await repo.listWalletTransactions({ tripId });
    const adjustment = txs.find((t) => t.type === "adjustment");
    expect(adjustment?.amount).toBe(200);
  });

  it("throws when reconciling a non-existent wallet", async () => {
    await expect(
      repo.reconcileWallet({ input: { walletId: "00000000-0000-4000-8000-000000009999", actualBalance: 100 } }),
    ).rejects.toThrow(WalletNotFoundError);
  });

  it("throws when marking a non-existent deposit as returned", async () => {
    await expect(
      repo.markDepositReturned({ input: { depositId: "00000000-0000-4000-8000-000000009999", returnedAmount: 100, returnedDate: "2026-08-20" } }),
    ).rejects.toThrow(DepositNotFoundError);
  });

  it("soft-deletes an expense: hidden from the list afterwards", async () => {
    const expense = await repo.createExpense({
      input: { tripId, category: "shopping", amount: 100, currencyCode: "THB", expenseAt: new Date().toISOString() },
    });
    const deleted = await repo.softDeleteExpense({ expenseId: expense.id });

    expect(deleted.deletedAt).not.toBeNull();
    const list = await repo.listExpenses({ tripId });
    expect(list.map((e) => e.id)).not.toContain(expense.id);
  });

  it("throws when soft-deleting a non-existent expense", async () => {
    await expect(repo.softDeleteExpense({ expenseId: "00000000-0000-4000-8000-000000009999" })).rejects.toThrow(ExpenseNotFoundError);
  });

  it("restores a soft-deleted expense — visible again in the default list, and via includeDeleted before that", async () => {
    const expense = await repo.createExpense({
      input: { tripId, category: "shopping", amount: 100, currencyCode: "THB", expenseAt: new Date().toISOString() },
    });
    await repo.softDeleteExpense({ expenseId: expense.id });

    const withDeleted = await repo.listExpenses({ tripId, includeDeleted: true });
    expect(withDeleted.map((e) => e.id)).toContain(expense.id);

    const restored = await repo.restoreExpense({ expenseId: expense.id });
    expect(restored.deletedAt).toBeNull();

    const list = await repo.listExpenses({ tripId });
    expect(list.map((e) => e.id)).toContain(expense.id);
  });

  it("lists trip-wide payments across multiple expenses, newest first", async () => {
    const expenseA = await repo.createExpense({
      input: { tripId, category: "food", amount: 300, currencyCode: "THB", expenseAt: new Date().toISOString() },
    });
    const expenseB = await repo.createExpense({
      input: { tripId, category: "shopping", amount: 500, currencyCode: "THB", expenseAt: new Date().toISOString() },
    });
    await repo.createPayment({
      input: { expenseId: expenseA.id, amount: 300, currencyCode: "THB", paymentAt: "2026-01-01T10:00:00.000Z", paymentMethod: "cash" },
    });
    await repo.createPayment({
      input: { expenseId: expenseB.id, amount: 500, currencyCode: "THB", paymentAt: "2026-01-02T10:00:00.000Z", paymentMethod: "credit_card" },
    });

    const payments = await repo.listPaymentsByTrip({ tripId });
    expect(payments).toHaveLength(2);
    expect(payments[0]?.amount).toBe(500);
  });

  it("excludes another trip's payments from listPaymentsByTrip", async () => {
    const otherTripId = "55555555-5555-4555-8555-555555555555";
    const expense = await repo.createExpense({
      input: { tripId: otherTripId, category: "food", amount: 300, currencyCode: "THB", expenseAt: new Date().toISOString() },
    });
    await repo.createPayment({
      input: { expenseId: expense.id, amount: 300, currencyCode: "THB", paymentAt: new Date().toISOString(), paymentMethod: "cash" },
    });

    const payments = await repo.listPaymentsByTrip({ tripId });
    expect(payments).toHaveLength(0);
  });

  it("creates a new budget category limit and lists it sorted by category", async () => {
    await repo.upsertBudgetCategoryLimit({ input: { tripId, category: "shopping", limitAmount: 1000 } });
    await repo.upsertBudgetCategoryLimit({ input: { tripId, category: "food", limitAmount: 2000 } });

    const limits = await repo.listBudgetCategoryLimits({ tripId });
    expect(limits.map((l) => l.category)).toEqual(["food", "shopping"]);
  });

  it("upserts a budget category limit — same trip+category updates instead of duplicating", async () => {
    const first = await repo.upsertBudgetCategoryLimit({ input: { tripId, category: "food", limitAmount: 2000 } });
    const second = await repo.upsertBudgetCategoryLimit({ input: { tripId, category: "food", limitAmount: 2500 } });

    expect(second.id).toBe(first.id);
    expect(second.limitAmount).toBe(2500);
    const limits = await repo.listBudgetCategoryLimits({ tripId });
    expect(limits.filter((l) => l.category === "food")).toHaveLength(1);
  });

  it("deletes a budget category limit", async () => {
    const created = await repo.upsertBudgetCategoryLimit({ input: { tripId, category: "food", limitAmount: 2000 } });
    await repo.deleteBudgetCategoryLimit({ id: created.id });

    const limits = await repo.listBudgetCategoryLimits({ tripId });
    expect(limits.map((l) => l.id)).not.toContain(created.id);
  });

  it("creates a wallet automatically for a refund currency with no existing wallet", async () => {
    const expense = await repo.createExpense({
      input: { tripId, category: "shopping", amount: 1000, currencyCode: "EUR", expenseAt: new Date().toISOString() },
    });

    await repo.createRefund({
      input: { tripId, sourceExpenseId: expense.id, amount: 50, currencyCode: "EUR", refundAt: new Date().toISOString() },
    });

    const wallets = await repo.listWallets({ tripId });
    const eurWallet = wallets.find((w) => w.currencyCode === "EUR");
    expect(eurWallet?.currentBalance).toBe(50);
  });
});
