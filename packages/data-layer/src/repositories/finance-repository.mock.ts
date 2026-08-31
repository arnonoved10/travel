import { randomUUID } from "node:crypto";
import type {
  BudgetCategoryLimit,
  CorrectCurrencyExchangeInput,
  CorrectWalletTopUpInput,
  CreateCurrencyExchangeInput,
  CreateDepositInput,
  CreateExpenseInput,
  CreatePaymentInput,
  CreateRefundInput,
  CreateWalletInput,
  CurrencyExchange,
  Deposit,
  Expense,
  ExpenseParticipant,
  MarkDepositReturnedInput,
  MarkRefundReceivedInput,
  Payment,
  ReconcileWalletInput,
  Refund,
  UpdateExpenseInput,
  UpsertBudgetCategoryLimitInput,
  Wallet,
  WalletTransaction,
} from "@travel-app/shared-types";
import {
  correctCurrencyExchangeInputSchema,
  correctWalletTopUpInputSchema,
  createCurrencyExchangeInputSchema,
  createDepositInputSchema,
  createExpenseInputSchema,
  createPaymentInputSchema,
  createRefundInputSchema,
  createWalletInputSchema,
  markDepositReturnedInputSchema,
  markRefundReceivedInputSchema,
  reconcileWalletInputSchema,
  updateExpenseInputSchema,
  upsertBudgetCategoryLimitInputSchema,
} from "@travel-app/shared-types";
import {
  CurrencyExchangeNotFoundError,
  DepositNotFoundError,
  ExpenseNotFoundError,
  PaymentNotFoundError,
  RefundNotFoundError,
  WalletNotFoundError,
  WalletTransactionNotFoundError,
  type FinanceRepository,
} from "./finance-repository";

const DEMO_TRIP_ID = "00000000-0000-4000-8000-000000000101"; // [דמו] טיול לתאילנד

export class MockFinanceRepository implements FinanceRepository {
  private wallets = new Map<string, Wallet>();
  private expenses = new Map<string, Expense>();
  private expenseParticipants = new Map<string, ExpenseParticipant>();
  private payments = new Map<string, Payment>();
  private refunds = new Map<string, Refund>();
  private currencyExchanges = new Map<string, CurrencyExchange>();
  private walletTransactions = new Map<string, WalletTransaction>();
  private deposits = new Map<string, Deposit>();
  private budgetCategoryLimits = new Map<string, BudgetCategoryLimit>();

  constructor() {
    this.seed();
  }

  private seed(): void {
    const now = new Date().toISOString();

    const wallet: Wallet = {
      id: randomUUID(),
      tripId: DEMO_TRIP_ID,
      currencyCode: "THB",
      openingBalance: 20000,
      initialAmount: 20000,
      currentBalance: 19850,
    };
    this.wallets.set(wallet.id, wallet);

    const expense: Expense = {
      id: randomUUID(),
      tripId: DEMO_TRIP_ID,
      bookingId: null,
      placeId: null,
      category: "food",
      description: "[דמו] ארוחת ערב",
      itemName: null,
      quantity: null,
      amount: 450,
      currencyCode: "THB",
      expenseAt: now,
      timezone: "Asia/Bangkok",
      personalRating: null,
      tipRecipient: null,
      tipCategory: null,
      notes: "נתוני דמה לצורך פיתוח UI בלבד.",
      dataSource: "manual",
      deletedAt: null,
    };
    this.expenses.set(expense.id, expense);

    const payment: Payment = {
      id: randomUUID(),
      expenseId: expense.id,
      bookingId: null,
      amount: 150,
      currencyCode: "THB",
      paymentAt: now,
      paymentMethod: "cash",
      cardId: null,
      paidByCompanionId: null,
      notes: "מקדמה במזומן — נתוני דמה.",
      deletedAt: null,
    };
    this.payments.set(payment.id, payment);

    const foodLimit: BudgetCategoryLimit = {
      id: randomUUID(),
      tripId: DEMO_TRIP_ID,
      category: "food",
      limitAmount: 2500,
      createdAt: now,
      updatedAt: now,
    };
    this.budgetCategoryLimits.set(foodLimit.id, foodLimit);
  }

  async listWallets({ tripId }: { tripId: string }): Promise<Wallet[]> {
    return Array.from(this.wallets.values()).filter((w) => w.tripId === tripId);
  }

  private recordWalletTx(walletId: string, type: WalletTransaction["type"], amount: number, notes?: string): void {
    const tx: WalletTransaction = {
      id: randomUUID(),
      walletId,
      type,
      amount,
      txAt: new Date().toISOString(),
      notes: notes ?? null,
    };
    this.walletTransactions.set(tx.id, tx);
  }

  async listWalletTransactions({ tripId }: { tripId: string }): Promise<WalletTransaction[]> {
    const walletIds = new Set(Array.from(this.wallets.values()).filter((w) => w.tripId === tripId).map((w) => w.id));
    return Array.from(this.walletTransactions.values())
      .filter((tx) => walletIds.has(tx.walletId))
      .sort((a, b) => b.txAt.localeCompare(a.txAt));
  }

  async topUpWallet({ input }: { input: CreateWalletInput }): Promise<Wallet> {
    const parsed = createWalletInputSchema.parse(input);
    const existing = Array.from(this.wallets.values()).find(
      (w) => w.tripId === parsed.tripId && w.currencyCode === parsed.currencyCode,
    );

    if (existing) {
      const updated: Wallet = {
        ...existing,
        initialAmount: existing.initialAmount + parsed.initialAmount,
        currentBalance: existing.currentBalance + parsed.initialAmount,
      };
      this.wallets.set(existing.id, updated);
      this.recordWalletTx(existing.id, "top_up", parsed.initialAmount);
      return updated;
    }

    const wallet: Wallet = {
      id: randomUUID(),
      tripId: parsed.tripId,
      currencyCode: parsed.currencyCode,
      openingBalance: parsed.initialAmount,
      initialAmount: parsed.initialAmount,
      currentBalance: parsed.initialAmount,
    };
    this.wallets.set(wallet.id, wallet);
    this.recordWalletTx(wallet.id, "top_up", parsed.initialAmount);
    return wallet;
  }

  async reconcileWallet({ input }: { input: ReconcileWalletInput }): Promise<Wallet> {
    const parsed = reconcileWalletInputSchema.parse(input);
    const existing = this.wallets.get(parsed.walletId);
    if (!existing) throw new WalletNotFoundError(parsed.walletId);

    const delta = parsed.actualBalance - existing.currentBalance;
    const updated: Wallet = { ...existing, currentBalance: parsed.actualBalance };
    this.wallets.set(existing.id, updated);
    this.recordWalletTx(existing.id, "adjustment", delta, parsed.reason ?? `התאמה ל-${parsed.actualBalance} לפי ספירה בפועל`);
    return updated;
  }

  async correctWalletTopUp({ input }: { input: CorrectWalletTopUpInput }): Promise<Wallet> {
    const parsed = correctWalletTopUpInputSchema.parse(input);
    const existingTx = this.walletTransactions.get(parsed.transactionId);
    if (!existingTx) throw new WalletTransactionNotFoundError(parsed.transactionId);
    if (existingTx.type !== "top_up") throw new Error("ניתן לתקן רק תנועות מסוג הפקדה (top_up)");

    const wallet = this.wallets.get(existingTx.walletId);
    if (!wallet) throw new WalletNotFoundError(existingTx.walletId);

    const oldAmount = existingTx.amount;
    const delta = parsed.correctedAmount - oldAmount;
    const updated: Wallet = {
      ...wallet,
      initialAmount: wallet.initialAmount + delta,
      currentBalance: wallet.currentBalance + delta,
    };
    this.wallets.set(wallet.id, updated);
    this.recordWalletTx(
      wallet.id,
      "adjustment",
      delta,
      parsed.reason ?? (parsed.correctedAmount === 0 ? `ביטול הפקדה שגויה של ${oldAmount}` : `תיקון הפקדה: מ-${oldAmount} ל-${parsed.correctedAmount}`),
    );
    return updated;
  }

  async listExpenses({ tripId, includeDeleted = false }: { tripId: string; includeDeleted?: boolean }): Promise<Expense[]> {
    return Array.from(this.expenses.values())
      .filter((e) => e.tripId === tripId && (includeDeleted || e.deletedAt === null))
      .sort((a, b) => b.expenseAt.localeCompare(a.expenseAt));
  }

  async listExpensesForTrips({ tripIds }: { tripIds: string[] }): Promise<Expense[]> {
    const idSet = new Set(tripIds);
    return Array.from(this.expenses.values())
      .filter((e) => idSet.has(e.tripId) && e.deletedAt === null)
      .sort((a, b) => b.expenseAt.localeCompare(a.expenseAt));
  }

  async updateExpense({ input }: { input: UpdateExpenseInput }): Promise<Expense> {
    const parsed = updateExpenseInputSchema.parse(input);
    const existing = this.expenses.get(parsed.expenseId);
    if (!existing) throw new ExpenseNotFoundError(parsed.expenseId);
    const updated: Expense = {
      ...existing,
      category: parsed.category ?? existing.category,
      description: parsed.description ?? existing.description,
      amount: parsed.amount ?? existing.amount,
      currencyCode: parsed.currencyCode ?? existing.currencyCode,
      expenseAt: parsed.expenseAt ?? existing.expenseAt,
    };
    this.expenses.set(parsed.expenseId, updated);
    return updated;
  }

  async softDeleteExpense({ expenseId }: { expenseId: string }): Promise<Expense> {
    const existing = this.expenses.get(expenseId);
    if (!existing) throw new ExpenseNotFoundError(expenseId);
    const updated: Expense = { ...existing, deletedAt: new Date().toISOString() };
    this.expenses.set(expenseId, updated);
    return updated;
  }

  async restoreExpense({ expenseId }: { expenseId: string }): Promise<Expense> {
    const existing = this.expenses.get(expenseId);
    if (!existing) throw new ExpenseNotFoundError(expenseId);
    const updated: Expense = { ...existing, deletedAt: null };
    this.expenses.set(expenseId, updated);
    return updated;
  }

  async createExpense({ input }: { input: CreateExpenseInput }): Promise<Expense> {
    const parsed = createExpenseInputSchema.parse(input);
    const expense: Expense = {
      id: randomUUID(),
      tripId: parsed.tripId,
      bookingId: parsed.bookingId ?? null,
      placeId: parsed.placeId ?? null,
      category: parsed.category,
      description: parsed.description ?? null,
      itemName: parsed.itemName ?? null,
      quantity: parsed.quantity ?? null,
      amount: parsed.amount,
      currencyCode: parsed.currencyCode,
      expenseAt: parsed.expenseAt,
      timezone: parsed.timezone ?? null,
      personalRating: parsed.personalRating ?? null,
      tipRecipient: parsed.tipRecipient ?? null,
      tipCategory: parsed.tipCategory ?? null,
      notes: parsed.notes ?? null,
      dataSource: "manual",
      deletedAt: null,
    };
    this.expenses.set(expense.id, expense);

    for (const companionId of parsed.participantCompanionIds ?? []) {
      const participant: ExpenseParticipant = { id: randomUUID(), expenseId: expense.id, companionId };
      this.expenseParticipants.set(participant.id, participant);
    }

    return expense;
  }

  async listExpenseParticipants({ tripId }: { tripId: string }): Promise<ExpenseParticipant[]> {
    const tripExpenseIds = new Set(Array.from(this.expenses.values()).filter((e) => e.tripId === tripId).map((e) => e.id));
    return Array.from(this.expenseParticipants.values()).filter((p) => tripExpenseIds.has(p.expenseId));
  }

  async listPayments({ expenseId, includeDeleted }: { expenseId: string; includeDeleted?: boolean }): Promise<Payment[]> {
    return Array.from(this.payments.values())
      .filter((p) => p.expenseId === expenseId && (includeDeleted || p.deletedAt === null))
      .sort((a, b) => a.paymentAt.localeCompare(b.paymentAt));
  }

  async listPaymentsByTrip({ tripId, includeDeleted }: { tripId: string; includeDeleted?: boolean }): Promise<Payment[]> {
    const tripExpenseIds = new Set(
      Array.from(this.expenses.values()).filter((e) => e.tripId === tripId).map((e) => e.id),
    );
    return Array.from(this.payments.values())
      .filter((p) => p.expenseId !== null && tripExpenseIds.has(p.expenseId) && (includeDeleted || p.deletedAt === null))
      .sort((a, b) => b.paymentAt.localeCompare(a.paymentAt));
  }

  async createPayment({ input }: { input: CreatePaymentInput }): Promise<Payment> {
    const parsed = createPaymentInputSchema.parse(input);
    const payment: Payment = {
      id: randomUUID(),
      expenseId: parsed.expenseId ?? null,
      bookingId: parsed.bookingId ?? null,
      amount: parsed.amount,
      currencyCode: parsed.currencyCode,
      paymentAt: parsed.paymentAt,
      paymentMethod: parsed.paymentMethod,
      cardId: parsed.cardId ?? null,
      paidByCompanionId: parsed.paidByCompanionId ?? null,
      notes: parsed.notes ?? null,
      deletedAt: null,
    };
    this.payments.set(payment.id, payment);

    if (parsed.paymentMethod === "cash" && parsed.expenseId) {
      const expense = this.expenses.get(parsed.expenseId);
      if (expense) {
        const wallet = Array.from(this.wallets.values()).find(
          (w) => w.tripId === expense.tripId && w.currencyCode === parsed.currencyCode,
        );
        if (wallet) {
          this.wallets.set(wallet.id, { ...wallet, currentBalance: wallet.currentBalance - parsed.amount });
          this.recordWalletTx(wallet.id, "cash_payment_out", -parsed.amount);
        } else {
          console.warn(
            `cash payment recorded without a matching wallet — balance not adjusted (tripId=${expense.tripId}, currencyCode=${parsed.currencyCode})`,
          );
        }
      }
    }

    return payment;
  }

  async softDeletePayment({ paymentId }: { paymentId: string }): Promise<Payment> {
    const existing = this.payments.get(paymentId);
    if (!existing) throw new PaymentNotFoundError(paymentId);
    const updated: Payment = { ...existing, deletedAt: new Date().toISOString() };
    this.payments.set(paymentId, updated);
    return updated;
  }

  async restorePayment({ paymentId }: { paymentId: string }): Promise<Payment> {
    const existing = this.payments.get(paymentId);
    if (!existing) throw new PaymentNotFoundError(paymentId);
    const updated: Payment = { ...existing, deletedAt: null };
    this.payments.set(paymentId, updated);
    return updated;
  }

  private adjustWallet(tripId: string, currencyCode: string, delta: number, type: WalletTransaction["type"]): void {
    const wallet = Array.from(this.wallets.values()).find(
      (w) => w.tripId === tripId && w.currencyCode === currencyCode,
    );
    if (wallet) {
      this.wallets.set(wallet.id, { ...wallet, currentBalance: wallet.currentBalance + delta });
      this.recordWalletTx(wallet.id, type, delta);
      return;
    }
    const newWallet: Wallet = {
      id: randomUUID(),
      tripId,
      currencyCode,
      openingBalance: 0,
      initialAmount: 0,
      currentBalance: delta,
    };
    this.wallets.set(newWallet.id, newWallet);
    this.recordWalletTx(newWallet.id, type, delta);
  }

  async listCurrencyExchanges({ tripId }: { tripId: string }): Promise<CurrencyExchange[]> {
    return Array.from(this.currencyExchanges.values())
      .filter((c) => c.tripId === tripId)
      .sort((a, b) => b.exchangeAt.localeCompare(a.exchangeAt));
  }

  async createCurrencyExchange({ input }: { input: CreateCurrencyExchangeInput }): Promise<CurrencyExchange> {
    const parsed = createCurrencyExchangeInputSchema.parse(input);
    const exchange: CurrencyExchange = {
      id: randomUUID(),
      tripId: parsed.tripId,
      givenAmount: parsed.givenAmount,
      givenCurrencyCode: parsed.givenCurrencyCode,
      receivedAmount: parsed.receivedAmount,
      receivedCurrencyCode: parsed.receivedCurrencyCode,
      actualRate: parsed.actualRate,
      feeAmount: parsed.feeAmount ?? null,
      exchangeAt: parsed.exchangeAt,
      notes: parsed.notes ?? null,
    };
    this.currencyExchanges.set(exchange.id, exchange);

    this.adjustWallet(parsed.tripId, parsed.givenCurrencyCode, -parsed.givenAmount, "exchange_out");
    this.adjustWallet(parsed.tripId, parsed.receivedCurrencyCode, parsed.receivedAmount, "exchange_in");

    return exchange;
  }

  async correctCurrencyExchange({ input }: { input: CorrectCurrencyExchangeInput }): Promise<CurrencyExchange> {
    const parsed = correctCurrencyExchangeInputSchema.parse(input);
    const existing = this.currencyExchanges.get(parsed.exchangeId);
    if (!existing) throw new CurrencyExchangeNotFoundError(parsed.exchangeId);

    const givenDelta = existing.givenAmount - parsed.correctedGivenAmount;
    if (givenDelta !== 0) {
      const wallet = Array.from(this.wallets.values()).find(
        (w) => w.tripId === existing.tripId && w.currencyCode === existing.givenCurrencyCode,
      );
      if (wallet) {
        this.wallets.set(wallet.id, { ...wallet, currentBalance: wallet.currentBalance + givenDelta });
        this.recordWalletTx(
          wallet.id,
          "adjustment",
          givenDelta,
          parsed.reason ?? `תיקון להמרה: הסכום שניתן שונה מ-${existing.givenAmount} ל-${parsed.correctedGivenAmount}`,
        );
      }
    }

    const receivedDelta = parsed.correctedReceivedAmount - existing.receivedAmount;
    if (receivedDelta !== 0) {
      const wallet = Array.from(this.wallets.values()).find(
        (w) => w.tripId === existing.tripId && w.currencyCode === existing.receivedCurrencyCode,
      );
      if (wallet) {
        this.wallets.set(wallet.id, { ...wallet, currentBalance: wallet.currentBalance + receivedDelta });
        this.recordWalletTx(
          wallet.id,
          "adjustment",
          receivedDelta,
          parsed.reason ?? `תיקון להמרה: הסכום שהתקבל שונה מ-${existing.receivedAmount} ל-${parsed.correctedReceivedAmount}`,
        );
      }
    }

    const updated: CurrencyExchange = {
      ...existing,
      givenAmount: parsed.correctedGivenAmount,
      receivedAmount: parsed.correctedReceivedAmount,
      actualRate: parsed.correctedReceivedAmount / parsed.correctedGivenAmount,
    };
    this.currencyExchanges.set(existing.id, updated);
    return updated;
  }

  async listRefunds({ tripId }: { tripId: string }): Promise<Refund[]> {
    return Array.from(this.refunds.values())
      .filter((r) => r.tripId === tripId)
      .sort((a, b) => b.refundAt.localeCompare(a.refundAt));
  }

  async createRefund({ input }: { input: CreateRefundInput }): Promise<Refund> {
    const parsed = createRefundInputSchema.parse(input);
    const isReceived = parsed.isReceived ?? true;
    const refund: Refund = {
      id: randomUUID(),
      tripId: parsed.tripId,
      sourceExpenseId: parsed.sourceExpenseId,
      sourcePaymentId: parsed.sourcePaymentId ?? null,
      amount: parsed.amount,
      currencyCode: parsed.currencyCode,
      reason: parsed.reason ?? null,
      refundAt: parsed.refundAt,
      isReceived,
      notes: parsed.notes ?? null,
    };
    this.refunds.set(refund.id, refund);

    if (isReceived) {
      this.adjustWallet(parsed.tripId, parsed.currencyCode, parsed.amount, "refund_in");
    }

    return refund;
  }

  async markRefundReceived({ input }: { input: MarkRefundReceivedInput }): Promise<Refund> {
    const parsed = markRefundReceivedInputSchema.parse(input);
    const existing = this.refunds.get(parsed.refundId);
    if (!existing) throw new RefundNotFoundError(parsed.refundId);

    const updated: Refund = {
      ...existing,
      isReceived: true,
      refundAt: new Date(parsed.receivedDate).toISOString(),
    };
    this.refunds.set(existing.id, updated);

    if (!existing.isReceived) {
      this.adjustWallet(existing.tripId, existing.currencyCode, existing.amount, "refund_in");
    }

    return updated;
  }

  async listDeposits({ tripId }: { tripId: string }): Promise<Deposit[]> {
    return Array.from(this.deposits.values())
      .filter((d) => d.tripId === tripId && d.deletedAt === null)
      .sort((a, b) => b.createdAt.localeCompare(a.createdAt));
  }

  async createDeposit({ input }: { input: CreateDepositInput }): Promise<Deposit> {
    const parsed = createDepositInputSchema.parse(input);
    const deposit: Deposit = {
      id: randomUUID(),
      tripId: parsed.tripId,
      bookingId: parsed.bookingId ?? null,
      amount: parsed.amount,
      currencyCode: parsed.currencyCode,
      paidTo: parsed.paidTo ?? null,
      reason: parsed.reason ?? null,
      expectedReturnDate: parsed.expectedReturnDate ?? null,
      isReturned: false,
      returnedAmount: null,
      returnedDate: null,
      deletedAt: null,
      createdAt: new Date().toISOString(),
    };
    this.deposits.set(deposit.id, deposit);

    this.adjustWallet(parsed.tripId, parsed.currencyCode, -parsed.amount, "deposit_out");

    return deposit;
  }

  async markDepositReturned({ input }: { input: MarkDepositReturnedInput }): Promise<Deposit> {
    const parsed = markDepositReturnedInputSchema.parse(input);
    const existing = this.deposits.get(parsed.depositId);
    if (!existing) throw new DepositNotFoundError(parsed.depositId);

    const updated: Deposit = {
      ...existing,
      isReturned: true,
      returnedAmount: parsed.returnedAmount,
      returnedDate: parsed.returnedDate,
    };
    this.deposits.set(existing.id, updated);

    if (parsed.returnedAmount > 0) {
      this.adjustWallet(existing.tripId, existing.currencyCode, parsed.returnedAmount, "deposit_return_in");
    }

    return updated;
  }

  async listBudgetCategoryLimits({ tripId }: { tripId: string }): Promise<BudgetCategoryLimit[]> {
    return Array.from(this.budgetCategoryLimits.values())
      .filter((b) => b.tripId === tripId)
      .sort((a, b) => a.category.localeCompare(b.category));
  }

  async upsertBudgetCategoryLimit({ input }: { input: UpsertBudgetCategoryLimitInput }): Promise<BudgetCategoryLimit> {
    const parsed = upsertBudgetCategoryLimitInputSchema.parse(input);
    const existing = Array.from(this.budgetCategoryLimits.values()).find(
      (b) => b.tripId === parsed.tripId && b.category === parsed.category,
    );
    const now = new Date().toISOString();

    if (existing) {
      const updated: BudgetCategoryLimit = { ...existing, limitAmount: parsed.limitAmount, updatedAt: now };
      this.budgetCategoryLimits.set(existing.id, updated);
      return updated;
    }

    const created: BudgetCategoryLimit = {
      id: randomUUID(),
      tripId: parsed.tripId,
      category: parsed.category,
      limitAmount: parsed.limitAmount,
      createdAt: now,
      updatedAt: now,
    };
    this.budgetCategoryLimits.set(created.id, created);
    return created;
  }

  async deleteBudgetCategoryLimit({ id }: { id: string }): Promise<void> {
    this.budgetCategoryLimits.delete(id);
  }
}

export const mockFinanceRepository = new MockFinanceRepository();
