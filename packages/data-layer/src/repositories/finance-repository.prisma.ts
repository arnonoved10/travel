// PENDING_INTEGRATION — ראה ההערה המקבילה ב-trip-repository.prisma.ts.
import { PrismaClient } from "@travel-app/db";
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

function toWalletTransaction(row: {
  id: string;
  walletId: string;
  type: string;
  amount: unknown;
  txAt: Date;
  notes: string | null;
}): WalletTransaction {
  return {
    id: row.id,
    walletId: row.walletId,
    type: row.type as WalletTransaction["type"],
    amount: Number(row.amount),
    txAt: row.txAt.toISOString(),
    notes: row.notes,
  };
}

function toDeposit(row: {
  id: string;
  tripId: string;
  bookingId: string | null;
  amount: unknown;
  currencyCode: string;
  paidTo: string | null;
  reason: string | null;
  expectedReturnDate: Date | null;
  isReturned: boolean;
  returnedAmount: unknown;
  returnedDate: Date | null;
  deletedAt: Date | null;
  createdAt: Date;
}): Deposit {
  return {
    id: row.id,
    tripId: row.tripId,
    bookingId: row.bookingId,
    amount: Number(row.amount),
    currencyCode: row.currencyCode,
    paidTo: row.paidTo,
    reason: row.reason,
    expectedReturnDate: row.expectedReturnDate ? row.expectedReturnDate.toISOString().slice(0, 10) : null,
    isReturned: row.isReturned,
    returnedAmount: row.returnedAmount !== null ? Number(row.returnedAmount) : null,
    returnedDate: row.returnedDate ? row.returnedDate.toISOString().slice(0, 10) : null,
    deletedAt: row.deletedAt ? row.deletedAt.toISOString() : null,
    createdAt: row.createdAt.toISOString(),
  };
}

function toBudgetCategoryLimit(row: {
  id: string;
  tripId: string;
  category: string;
  limitAmount: unknown;
  createdAt: Date;
  updatedAt: Date;
}): BudgetCategoryLimit {
  return {
    id: row.id,
    tripId: row.tripId,
    category: row.category,
    limitAmount: Number(row.limitAmount),
    createdAt: row.createdAt.toISOString(),
    updatedAt: row.updatedAt.toISOString(),
  };
}

function toRefund(row: {
  id: string;
  tripId: string;
  sourceExpenseId: string;
  sourcePaymentId: string | null;
  amount: unknown;
  currencyCode: string;
  reason: string | null;
  refundAt: Date;
  isReceived: boolean;
  notes: string | null;
}): Refund {
  return {
    id: row.id,
    tripId: row.tripId,
    sourceExpenseId: row.sourceExpenseId,
    sourcePaymentId: row.sourcePaymentId,
    amount: Number(row.amount),
    currencyCode: row.currencyCode,
    reason: row.reason,
    refundAt: row.refundAt.toISOString(),
    isReceived: row.isReceived,
    notes: row.notes,
  };
}

function toCurrencyExchange(row: {
  id: string;
  tripId: string;
  givenAmount: unknown;
  givenCurrencyCode: string;
  receivedAmount: unknown;
  receivedCurrencyCode: string;
  actualRate: unknown;
  feeAmount: unknown;
  exchangeAt: Date;
  notes: string | null;
}): CurrencyExchange {
  return {
    id: row.id,
    tripId: row.tripId,
    givenAmount: Number(row.givenAmount),
    givenCurrencyCode: row.givenCurrencyCode,
    receivedAmount: Number(row.receivedAmount),
    receivedCurrencyCode: row.receivedCurrencyCode,
    actualRate: Number(row.actualRate),
    feeAmount: row.feeAmount !== null ? Number(row.feeAmount) : null,
    exchangeAt: row.exchangeAt.toISOString(),
    notes: row.notes,
  };
}

function toWallet(row: {
  id: string;
  tripId: string;
  currencyCode: string;
  openingBalance: unknown;
  initialAmount: unknown;
  currentBalance: unknown;
}): Wallet {
  return {
    id: row.id,
    tripId: row.tripId,
    currencyCode: row.currencyCode,
    openingBalance: Number(row.openingBalance),
    initialAmount: Number(row.initialAmount),
    currentBalance: Number(row.currentBalance),
  };
}

function toExpense(row: {
  id: string;
  tripId: string;
  bookingId: string | null;
  placeId: string | null;
  category: string;
  description: string | null;
  itemName: string | null;
  quantity: number | null;
  amount: unknown;
  currencyCode: string;
  expenseAt: Date;
  timezone: string | null;
  personalRating: number | null;
  tipRecipient: string | null;
  tipCategory: string | null;
  notes: string | null;
  dataSource: string;
  deletedAt: Date | null;
}): Expense {
  return {
    id: row.id,
    tripId: row.tripId,
    bookingId: row.bookingId,
    placeId: row.placeId,
    category: row.category as Expense["category"],
    description: row.description,
    itemName: row.itemName,
    quantity: row.quantity,
    amount: Number(row.amount),
    currencyCode: row.currencyCode,
    expenseAt: row.expenseAt.toISOString(),
    timezone: row.timezone,
    personalRating: row.personalRating,
    tipRecipient: row.tipRecipient,
    tipCategory: row.tipCategory as Expense["tipCategory"],
    notes: row.notes,
    dataSource: row.dataSource as Expense["dataSource"],
    deletedAt: row.deletedAt ? row.deletedAt.toISOString() : null,
  };
}

function toPayment(row: {
  id: string;
  expenseId: string | null;
  bookingId: string | null;
  amount: unknown;
  currencyCode: string;
  paymentAt: Date;
  paymentMethod: string;
  cardId: string | null;
  paidByCompanionId: string | null;
  notes: string | null;
  deletedAt: Date | null;
}): Payment {
  return {
    id: row.id,
    expenseId: row.expenseId,
    bookingId: row.bookingId,
    amount: Number(row.amount),
    currencyCode: row.currencyCode,
    paymentAt: row.paymentAt.toISOString(),
    paymentMethod: row.paymentMethod as Payment["paymentMethod"],
    cardId: row.cardId,
    paidByCompanionId: row.paidByCompanionId,
    notes: row.notes,
    deletedAt: row.deletedAt ? row.deletedAt.toISOString() : null,
  };
}

export class PrismaFinanceRepository implements FinanceRepository {
  constructor(private readonly prisma: PrismaClient) {}

  async listWallets({ tripId }: { tripId: string }): Promise<Wallet[]> {
    const rows = await this.prisma.wallet.findMany({ where: { tripId } });
    return rows.map(toWallet);
  }

  async topUpWallet({ input }: { input: CreateWalletInput }): Promise<Wallet> {
    const parsed = createWalletInputSchema.parse(input);
    const row = await this.prisma.wallet.upsert({
      where: { tripId_currencyCode: { tripId: parsed.tripId, currencyCode: parsed.currencyCode } },
      create: {
        tripId: parsed.tripId,
        currencyCode: parsed.currencyCode,
        openingBalance: parsed.initialAmount,
        initialAmount: parsed.initialAmount,
        currentBalance: parsed.initialAmount,
      },
      update: {
        initialAmount: { increment: parsed.initialAmount },
        currentBalance: { increment: parsed.initialAmount },
      },
    });

    await this.prisma.walletTransaction.create({
      data: { walletId: row.id, type: "top_up", amount: parsed.initialAmount, txAt: new Date() },
    });

    return toWallet(row);
  }

  async reconcileWallet({ input }: { input: ReconcileWalletInput }): Promise<Wallet> {
    const parsed = reconcileWalletInputSchema.parse(input);
    const existing = await this.prisma.wallet.findUnique({ where: { id: parsed.walletId } });
    if (!existing) throw new WalletNotFoundError(parsed.walletId);

    const delta = parsed.actualBalance - Number(existing.currentBalance);
    const row = await this.prisma.wallet.update({ where: { id: parsed.walletId }, data: { currentBalance: parsed.actualBalance } });
    await this.prisma.walletTransaction.create({
      data: {
        walletId: row.id,
        type: "adjustment",
        amount: delta,
        notes: parsed.reason ?? `התאמה ל-${parsed.actualBalance} לפי ספירה בפועל`,
        txAt: new Date(),
      },
    });
    return toWallet(row);
  }

  async correctWalletTopUp({ input }: { input: CorrectWalletTopUpInput }): Promise<Wallet> {
    const parsed = correctWalletTopUpInputSchema.parse(input);
    const existing = await this.prisma.walletTransaction.findUnique({ where: { id: parsed.transactionId } });
    if (!existing) throw new WalletTransactionNotFoundError(parsed.transactionId);
    if (existing.type !== "top_up") throw new Error("ניתן לתקן רק תנועות מסוג הפקדה (top_up)");

    const oldAmount = Number(existing.amount);
    const delta = parsed.correctedAmount - oldAmount;

    const wallet = await this.prisma.$transaction(async (tx) => {
      const updatedWallet = await tx.wallet.update({
        where: { id: existing.walletId },
        data: { initialAmount: { increment: delta }, currentBalance: { increment: delta } },
      });
      await tx.walletTransaction.create({
        data: {
          walletId: existing.walletId,
          type: "adjustment",
          amount: delta,
          notes:
            parsed.reason ??
            (parsed.correctedAmount === 0
              ? `ביטול הפקדה שגויה של ${oldAmount}`
              : `תיקון הפקדה: מ-${oldAmount} ל-${parsed.correctedAmount}`),
          txAt: new Date(),
        },
      });
      return updatedWallet;
    });

    return toWallet(wallet);
  }

  async listWalletTransactions({ tripId }: { tripId: string }): Promise<WalletTransaction[]> {
    const rows = await this.prisma.walletTransaction.findMany({
      where: { wallet: { tripId } },
      orderBy: { txAt: "desc" },
    });
    return rows.map(toWalletTransaction);
  }

  async listExpenses({ tripId, includeDeleted = false }: { tripId: string; includeDeleted?: boolean }): Promise<Expense[]> {
    const rows = await this.prisma.expense.findMany({
      where: { tripId, ...(includeDeleted ? {} : { deletedAt: null }) },
      orderBy: { expenseAt: "desc" },
    });
    return rows.map(toExpense);
  }

  async listExpensesForTrips({ tripIds }: { tripIds: string[] }): Promise<Expense[]> {
    if (tripIds.length === 0) return [];
    const rows = await this.prisma.expense.findMany({
      where: { tripId: { in: tripIds }, deletedAt: null },
      orderBy: { expenseAt: "desc" },
    });
    return rows.map(toExpense);
  }

  async updateExpense({ input }: { input: UpdateExpenseInput }): Promise<Expense> {
    const parsed = updateExpenseInputSchema.parse(input);
    const existing = await this.prisma.expense.findUnique({ where: { id: parsed.expenseId } });
    if (!existing) throw new ExpenseNotFoundError(parsed.expenseId);
    const row = await this.prisma.expense.update({
      where: { id: parsed.expenseId },
      data: {
        category: parsed.category,
        description: parsed.description,
        amount: parsed.amount,
        currencyCode: parsed.currencyCode,
        expenseAt: parsed.expenseAt ? new Date(parsed.expenseAt) : undefined,
      },
    });
    return toExpense(row);
  }

  async softDeleteExpense({ expenseId }: { expenseId: string }): Promise<Expense> {
    const existing = await this.prisma.expense.findUnique({ where: { id: expenseId } });
    if (!existing) throw new ExpenseNotFoundError(expenseId);
    const row = await this.prisma.expense.update({ where: { id: expenseId }, data: { deletedAt: new Date() } });
    return toExpense(row);
  }

  async restoreExpense({ expenseId }: { expenseId: string }): Promise<Expense> {
    const existing = await this.prisma.expense.findUnique({ where: { id: expenseId } });
    if (!existing) throw new ExpenseNotFoundError(expenseId);
    const row = await this.prisma.expense.update({ where: { id: expenseId }, data: { deletedAt: null } });
    return toExpense(row);
  }

  async createExpense({ input }: { input: CreateExpenseInput }): Promise<Expense> {
    const parsed = createExpenseInputSchema.parse(input);
    const row = await this.prisma.$transaction(async (tx) => {
      const createdExpense = await tx.expense.create({
        data: {
          tripId: parsed.tripId,
          bookingId: parsed.bookingId,
          placeId: parsed.placeId,
          category: parsed.category,
          description: parsed.description,
          itemName: parsed.itemName,
          quantity: parsed.quantity,
          amount: parsed.amount,
          currencyCode: parsed.currencyCode,
          expenseAt: new Date(parsed.expenseAt),
          timezone: parsed.timezone,
          personalRating: parsed.personalRating,
          tipRecipient: parsed.tipRecipient,
          tipCategory: parsed.tipCategory,
          notes: parsed.notes,
        },
      });

      if (parsed.participantCompanionIds && parsed.participantCompanionIds.length > 0) {
        await tx.expenseParticipant.createMany({
          data: parsed.participantCompanionIds.map((companionId) => ({ expenseId: createdExpense.id, companionId })),
        });
      }

      return createdExpense;
    });
    return toExpense(row);
  }

  async listExpenseParticipants({ tripId }: { tripId: string }): Promise<ExpenseParticipant[]> {
    const rows = await this.prisma.expenseParticipant.findMany({ where: { expense: { tripId } } });
    return rows;
  }

  async listPayments({ expenseId, includeDeleted }: { expenseId: string; includeDeleted?: boolean }): Promise<Payment[]> {
    const rows = await this.prisma.payment.findMany({
      where: { expenseId, ...(includeDeleted ? {} : { deletedAt: null }) },
      orderBy: { paymentAt: "asc" },
    });
    return rows.map(toPayment);
  }

  async listPaymentsByTrip({ tripId, includeDeleted }: { tripId: string; includeDeleted?: boolean }): Promise<Payment[]> {
    const rows = await this.prisma.payment.findMany({
      where: { expense: { tripId }, ...(includeDeleted ? {} : { deletedAt: null }) },
      orderBy: { paymentAt: "desc" },
    });
    return rows.map(toPayment);
  }

  async softDeletePayment({ paymentId }: { paymentId: string }): Promise<Payment> {
    const existing = await this.prisma.payment.findUnique({ where: { id: paymentId } });
    if (!existing) throw new PaymentNotFoundError(paymentId);
    const row = await this.prisma.payment.update({ where: { id: paymentId }, data: { deletedAt: new Date() } });
    return toPayment(row);
  }

  async restorePayment({ paymentId }: { paymentId: string }): Promise<Payment> {
    const existing = await this.prisma.payment.findUnique({ where: { id: paymentId } });
    if (!existing) throw new PaymentNotFoundError(paymentId);
    const row = await this.prisma.payment.update({ where: { id: paymentId }, data: { deletedAt: null } });
    return toPayment(row);
  }

  async createPayment({ input }: { input: CreatePaymentInput }): Promise<Payment> {
    const parsed = createPaymentInputSchema.parse(input);

    const payment = await this.prisma.$transaction(async (tx) => {
      const createdPayment = await tx.payment.create({
        data: {
          expenseId: parsed.expenseId,
          bookingId: parsed.bookingId,
          amount: parsed.amount,
          currencyCode: parsed.currencyCode,
          paymentAt: new Date(parsed.paymentAt),
          paymentMethod: parsed.paymentMethod,
          cardId: parsed.cardId,
          paidByCompanionId: parsed.paidByCompanionId,
          notes: parsed.notes,
        },
      });

      if (parsed.paymentMethod === "cash" && parsed.expenseId) {
        const expense = await tx.expense.findUnique({ where: { id: parsed.expenseId } });
        if (expense) {
          const wallet = await tx.wallet.findUnique({
            where: { tripId_currencyCode: { tripId: expense.tripId, currencyCode: parsed.currencyCode } },
          });
          if (wallet) {
            await tx.wallet.update({
              where: { id: wallet.id },
              data: { currentBalance: { decrement: parsed.amount } },
            });
            await tx.walletTransaction.create({
              data: {
                walletId: wallet.id,
                type: "cash_payment_out",
                amount: parsed.amount,
                relatedPaymentId: createdPayment.id,
                txAt: new Date(),
              },
            });
          }
        }
      }

      return createdPayment;
    });

    return toPayment(payment);
  }

  async listCurrencyExchanges({ tripId }: { tripId: string }): Promise<CurrencyExchange[]> {
    const rows = await this.prisma.currencyExchange.findMany({ where: { tripId }, orderBy: { exchangeAt: "desc" } });
    return rows.map(toCurrencyExchange);
  }

  async createCurrencyExchange({ input }: { input: CreateCurrencyExchangeInput }): Promise<CurrencyExchange> {
    const parsed = createCurrencyExchangeInputSchema.parse(input);

    const exchange = await this.prisma.$transaction(async (tx) => {
      const createdExchange = await tx.currencyExchange.create({
        data: {
          tripId: parsed.tripId,
          givenAmount: parsed.givenAmount,
          givenCurrencyCode: parsed.givenCurrencyCode,
          receivedAmount: parsed.receivedAmount,
          receivedCurrencyCode: parsed.receivedCurrencyCode,
          actualRate: parsed.actualRate,
          feeAmount: parsed.feeAmount,
          locationName: parsed.locationName,
          exchangeAt: new Date(parsed.exchangeAt),
          notes: parsed.notes,
        },
      });

      const givenWallet = await tx.wallet.upsert({
        where: { tripId_currencyCode: { tripId: parsed.tripId, currencyCode: parsed.givenCurrencyCode } },
        create: { tripId: parsed.tripId, currencyCode: parsed.givenCurrencyCode, openingBalance: 0, initialAmount: 0, currentBalance: -parsed.givenAmount },
        update: { currentBalance: { decrement: parsed.givenAmount } },
      });
      await tx.walletTransaction.create({
        data: {
          walletId: givenWallet.id,
          type: "exchange_out",
          amount: parsed.givenAmount,
          relatedExchangeId: createdExchange.id,
          txAt: new Date(parsed.exchangeAt),
        },
      });

      const receivedWallet = await tx.wallet.upsert({
        where: { tripId_currencyCode: { tripId: parsed.tripId, currencyCode: parsed.receivedCurrencyCode } },
        create: { tripId: parsed.tripId, currencyCode: parsed.receivedCurrencyCode, openingBalance: 0, initialAmount: 0, currentBalance: parsed.receivedAmount },
        update: { currentBalance: { increment: parsed.receivedAmount } },
      });
      await tx.walletTransaction.create({
        data: {
          walletId: receivedWallet.id,
          type: "exchange_in",
          amount: parsed.receivedAmount,
          relatedExchangeId: createdExchange.id,
          txAt: new Date(parsed.exchangeAt),
        },
      });

      return createdExchange;
    });

    return toCurrencyExchange(exchange);
  }

  async correctCurrencyExchange({ input }: { input: CorrectCurrencyExchangeInput }): Promise<CurrencyExchange> {
    const parsed = correctCurrencyExchangeInputSchema.parse(input);
    const existing = await this.prisma.currencyExchange.findUnique({ where: { id: parsed.exchangeId } });
    if (!existing) throw new CurrencyExchangeNotFoundError(parsed.exchangeId);

    const oldGivenAmount = Number(existing.givenAmount);
    const oldReceivedAmount = Number(existing.receivedAmount);
    const givenDelta = oldGivenAmount - parsed.correctedGivenAmount;
    const receivedDelta = parsed.correctedReceivedAmount - oldReceivedAmount;

    const exchange = await this.prisma.$transaction(async (tx) => {
      if (givenDelta !== 0) {
        const givenWallet = await tx.wallet.update({
          where: { tripId_currencyCode: { tripId: existing.tripId, currencyCode: existing.givenCurrencyCode } },
          data: { currentBalance: { increment: givenDelta } },
        });
        await tx.walletTransaction.create({
          data: {
            walletId: givenWallet.id,
            type: "adjustment",
            amount: givenDelta,
            relatedExchangeId: existing.id,
            notes: parsed.reason ?? `תיקון להמרה: הסכום שניתן שונה מ-${oldGivenAmount} ל-${parsed.correctedGivenAmount}`,
            txAt: new Date(),
          },
        });
      }

      if (receivedDelta !== 0) {
        const receivedWallet = await tx.wallet.update({
          where: { tripId_currencyCode: { tripId: existing.tripId, currencyCode: existing.receivedCurrencyCode } },
          data: { currentBalance: { increment: receivedDelta } },
        });
        await tx.walletTransaction.create({
          data: {
            walletId: receivedWallet.id,
            type: "adjustment",
            amount: receivedDelta,
            relatedExchangeId: existing.id,
            notes: parsed.reason ?? `תיקון להמרה: הסכום שהתקבל שונה מ-${oldReceivedAmount} ל-${parsed.correctedReceivedAmount}`,
            txAt: new Date(),
          },
        });
      }

      return tx.currencyExchange.update({
        where: { id: existing.id },
        data: {
          givenAmount: parsed.correctedGivenAmount,
          receivedAmount: parsed.correctedReceivedAmount,
          actualRate: parsed.correctedReceivedAmount / parsed.correctedGivenAmount,
        },
      });
    });

    return toCurrencyExchange(exchange);
  }

  async listRefunds({ tripId }: { tripId: string }): Promise<Refund[]> {
    const rows = await this.prisma.refund.findMany({ where: { tripId }, orderBy: { refundAt: "desc" } });
    return rows.map(toRefund);
  }

  async createRefund({ input }: { input: CreateRefundInput }): Promise<Refund> {
    const parsed = createRefundInputSchema.parse(input);
    const isReceived = parsed.isReceived ?? true;

    const refund = await this.prisma.$transaction(async (tx) => {
      const createdRefund = await tx.refund.create({
        data: {
          tripId: parsed.tripId,
          sourceExpenseId: parsed.sourceExpenseId,
          sourcePaymentId: parsed.sourcePaymentId,
          amount: parsed.amount,
          currencyCode: parsed.currencyCode,
          reason: parsed.reason,
          refundAt: new Date(parsed.refundAt),
          isReceived,
          notes: parsed.notes,
        },
      });

      if (isReceived) {
        const wallet = await tx.wallet.upsert({
          where: { tripId_currencyCode: { tripId: parsed.tripId, currencyCode: parsed.currencyCode } },
          create: {
            tripId: parsed.tripId,
            currencyCode: parsed.currencyCode,
            openingBalance: 0,
            initialAmount: 0,
            currentBalance: parsed.amount,
          },
          update: { currentBalance: { increment: parsed.amount } },
        });
        await tx.walletTransaction.create({
          data: {
            walletId: wallet.id,
            type: "refund_in",
            amount: parsed.amount,
            txAt: new Date(parsed.refundAt),
          },
        });
      }

      return createdRefund;
    });

    return toRefund(refund);
  }

  async markRefundReceived({ input }: { input: MarkRefundReceivedInput }): Promise<Refund> {
    const parsed = markRefundReceivedInputSchema.parse(input);
    const existing = await this.prisma.refund.findUnique({ where: { id: parsed.refundId } });
    if (!existing) throw new RefundNotFoundError(parsed.refundId);

    const refund = await this.prisma.$transaction(async (tx) => {
      const updatedRefund = await tx.refund.update({
        where: { id: parsed.refundId },
        data: { isReceived: true, refundAt: new Date(parsed.receivedDate) },
      });

      if (!existing.isReceived) {
        const amount = Number(existing.amount);
        const wallet = await tx.wallet.upsert({
          where: { tripId_currencyCode: { tripId: existing.tripId, currencyCode: existing.currencyCode } },
          create: { tripId: existing.tripId, currencyCode: existing.currencyCode, openingBalance: 0, initialAmount: 0, currentBalance: amount },
          update: { currentBalance: { increment: amount } },
        });
        await tx.walletTransaction.create({
          data: {
            walletId: wallet.id,
            type: "refund_in",
            amount,
            txAt: new Date(parsed.receivedDate),
          },
        });
      }

      return updatedRefund;
    });

    return toRefund(refund);
  }

  async listDeposits({ tripId }: { tripId: string }): Promise<Deposit[]> {
    const rows = await this.prisma.deposit.findMany({ where: { tripId, deletedAt: null }, orderBy: { createdAt: "desc" } });
    return rows.map(toDeposit);
  }

  async createDeposit({ input }: { input: CreateDepositInput }): Promise<Deposit> {
    const parsed = createDepositInputSchema.parse(input);

    const deposit = await this.prisma.$transaction(async (tx) => {
      const createdDeposit = await tx.deposit.create({
        data: {
          tripId: parsed.tripId,
          bookingId: parsed.bookingId,
          amount: parsed.amount,
          currencyCode: parsed.currencyCode,
          paidTo: parsed.paidTo,
          reason: parsed.reason,
          expectedReturnDate: parsed.expectedReturnDate ? new Date(parsed.expectedReturnDate) : undefined,
        },
      });

      const wallet = await tx.wallet.upsert({
        where: { tripId_currencyCode: { tripId: parsed.tripId, currencyCode: parsed.currencyCode } },
        create: { tripId: parsed.tripId, currencyCode: parsed.currencyCode, openingBalance: 0, initialAmount: 0, currentBalance: -parsed.amount },
        update: { currentBalance: { decrement: parsed.amount } },
      });
      await tx.walletTransaction.create({
        data: {
          walletId: wallet.id,
          type: "deposit_out",
          amount: -parsed.amount,
          relatedDepositId: createdDeposit.id,
          txAt: new Date(),
        },
      });

      return createdDeposit;
    });

    return toDeposit(deposit);
  }

  async markDepositReturned({ input }: { input: MarkDepositReturnedInput }): Promise<Deposit> {
    const parsed = markDepositReturnedInputSchema.parse(input);
    const existing = await this.prisma.deposit.findUnique({ where: { id: parsed.depositId } });
    if (!existing) throw new DepositNotFoundError(parsed.depositId);

    const deposit = await this.prisma.$transaction(async (tx) => {
      const updatedDeposit = await tx.deposit.update({
        where: { id: parsed.depositId },
        data: { isReturned: true, returnedAmount: parsed.returnedAmount, returnedDate: new Date(parsed.returnedDate) },
      });

      if (parsed.returnedAmount > 0) {
        const wallet = await tx.wallet.upsert({
          where: { tripId_currencyCode: { tripId: existing.tripId, currencyCode: existing.currencyCode } },
          create: { tripId: existing.tripId, currencyCode: existing.currencyCode, openingBalance: 0, initialAmount: 0, currentBalance: parsed.returnedAmount },
          update: { currentBalance: { increment: parsed.returnedAmount } },
        });
        await tx.walletTransaction.create({
          data: {
            walletId: wallet.id,
            type: "deposit_return_in",
            amount: parsed.returnedAmount,
            relatedDepositId: existing.id,
            txAt: new Date(),
          },
        });
      }

      return updatedDeposit;
    });

    return toDeposit(deposit);
  }

  async listBudgetCategoryLimits({ tripId }: { tripId: string }): Promise<BudgetCategoryLimit[]> {
    const rows = await this.prisma.budgetCategoryLimit.findMany({ where: { tripId }, orderBy: { category: "asc" } });
    return rows.map(toBudgetCategoryLimit);
  }

  async upsertBudgetCategoryLimit({ input }: { input: UpsertBudgetCategoryLimitInput }): Promise<BudgetCategoryLimit> {
    const parsed = upsertBudgetCategoryLimitInputSchema.parse(input);
    const row = await this.prisma.budgetCategoryLimit.upsert({
      where: { tripId_category: { tripId: parsed.tripId, category: parsed.category } },
      create: { tripId: parsed.tripId, category: parsed.category, limitAmount: parsed.limitAmount },
      update: { limitAmount: parsed.limitAmount },
    });
    return toBudgetCategoryLimit(row);
  }

  async deleteBudgetCategoryLimit({ id }: { id: string }): Promise<void> {
    await this.prisma.budgetCategoryLimit.delete({ where: { id } });
  }
}
