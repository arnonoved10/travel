"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import {
  correctCurrencyExchangeInputSchema,
  createCurrencyExchangeInputSchema,
  createDepositInputSchema,
  createExpenseInputSchema,
  createPaymentInputSchema,
  createRefundInputSchema,
  createWalletInputSchema,
  markDepositReturnedInputSchema,
  markRefundReceivedInputSchema,
  reconcileWalletInputSchema,
  upsertBudgetCategoryLimitInputSchema,
} from "@travel-app/shared-types";
import { findNearbyAtms, getCurrencyRateProvider, getFinanceRepository, getTripRepository, type AtmCandidate } from "@travel-app/data-layer";
import { getCurrentUser } from "@/lib/auth/get-current-user";
import { logger } from "@/lib/logger";

export interface FinanceFormState {
  fieldErrors?: Record<string, string[]>;
  formError?: string;
  /** מזהה הישות שנוצרה — כדי שהוספה-מהירה (quick-add-panel-content.tsx) תוכל
   * להציע מיד "צרף מסמך/קבלה לזה" בלי לצאת מהפאנל. */
  createdId?: string;
}

async function assertTripOwnership(userId: string, tripId: string): Promise<void> {
  const tripRepository = await getTripRepository();
  const trip = await tripRepository.getById({ userId, tripId });
  if (!trip) throw new Error("trip not found or not owned by user");
}

function readOptionalString(formData: FormData, key: string): string | undefined {
  const value = formData.get(key);
  if (typeof value !== "string" || value.trim() === "") return undefined;
  return value;
}

function readOptionalNumber(formData: FormData, key: string): number | undefined {
  const value = formData.get(key);
  if (typeof value !== "string" || value.trim() === "") return undefined;
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : undefined;
}

export async function topUpWalletAction(
  tripId: string,
  _prevState: FinanceFormState,
  formData: FormData,
): Promise<FinanceFormState> {
  const user = await getCurrentUser();
  if (!user) redirect("/login");

  try {
    await assertTripOwnership(user.id, tripId);
  } catch {
    return { formError: "הטיול לא נמצא או שאין לך הרשאה אליו." };
  }

  const parsed = createWalletInputSchema.safeParse({
    tripId,
    currencyCode: formData.get("currencyCode"),
    initialAmount: Number(formData.get("initialAmount")),
  });

  if (!parsed.success) {
    return { fieldErrors: parsed.error.flatten().fieldErrors };
  }

  const financeRepository = await getFinanceRepository();
  const wallet = await financeRepository.topUpWallet({ input: parsed.data });
  logger.info("wallet topped up", { walletId: wallet.id, tripId });

  revalidatePath(`/trips/${tripId}`);
  // יתרת-הארנק מוצגת גם בסיידבר הגלובלי (ר' app/(app)/layout.tsx) — שם
  // שנתלה על ה-layout המשותף, לא על עמוד-הטיול הספציפי, אז revalidatePath
  // הרגיל למעלה לא היה מרענן אותה. "/","layout" מרענן את כל עץ ה-layout,
  // כולל הסיידבר, בלי קשר לאיזה עמוד המשתמש נמצא בו כרגע.
  revalidatePath("/", "layout");
  return { createdId: wallet.id };
}

export async function reconcileWalletAction(
  tripId: string,
  walletId: string,
  _prevState: FinanceFormState,
  formData: FormData,
): Promise<FinanceFormState> {
  const user = await getCurrentUser();
  if (!user) redirect("/login");

  try {
    await assertTripOwnership(user.id, tripId);
  } catch {
    return { formError: "הטיול לא נמצא או שאין לך הרשאה אליו." };
  }

  const parsed = reconcileWalletInputSchema.safeParse({
    walletId,
    actualBalance: Number(formData.get("actualBalance")),
    reason: readOptionalString(formData, "reason"),
  });

  if (!parsed.success) {
    return { fieldErrors: parsed.error.flatten().fieldErrors };
  }

  const financeRepository = await getFinanceRepository();
  const wallet = await financeRepository.reconcileWallet({ input: parsed.data });
  logger.info("wallet reconciled", { walletId: wallet.id, tripId });

  revalidatePath(`/trips/${tripId}`);
  return {};
}

export async function createExpenseAction(
  tripId: string,
  _prevState: FinanceFormState,
  formData: FormData,
): Promise<FinanceFormState> {
  const user = await getCurrentUser();
  if (!user) redirect("/login");

  try {
    await assertTripOwnership(user.id, tripId);
  } catch {
    return { formError: "הטיול לא נמצא או שאין לך הרשאה אליו." };
  }

  // תאריך-הוצאה: אם הוזן (מסך-יום ספציפי, ר' days/[date]/page.tsx) — צהריים
  // באותו יום, כדי שסינון-לפי-יום ("expenseAt.slice(0,10) === date") יתאים
  // תמיד, בלי תלות באזור-זמן. בלי תאריך — עכשיו ממש (התנהגות קודמת, ללא שינוי).
  const expenseDateOnly = readOptionalString(formData, "expenseAt");
  const expenseAt = expenseDateOnly ? new Date(`${expenseDateOnly}T12:00:00`).toISOString() : new Date().toISOString();

  const parsed = createExpenseInputSchema.safeParse({
    tripId,
    category: formData.get("category"),
    description: readOptionalString(formData, "description"),
    placeId: readOptionalString(formData, "placeId"),
    personalRating: readOptionalNumber(formData, "personalRating"),
    itemName: readOptionalString(formData, "itemName"),
    quantity: readOptionalNumber(formData, "quantity"),
    amount: Number(formData.get("amount")),
    currencyCode: formData.get("currencyCode"),
    expenseAt,
    timezone: readOptionalString(formData, "timezone"),
    tipRecipient: readOptionalString(formData, "tipRecipient"),
    tipCategory: readOptionalString(formData, "tipCategory"),
    participantCompanionIds: formData.getAll("participantIds").filter((v): v is string => typeof v === "string" && v.length > 0),
  });

  if (!parsed.success) {
    return { fieldErrors: parsed.error.flatten().fieldErrors };
  }

  const financeRepository = await getFinanceRepository();
  const expense = await financeRepository.createExpense({ input: parsed.data });
  logger.info("expense created", { expenseId: expense.id, tripId });

  // אופן-תשלום אופציונלי (בקשת משתמש: "ואז זה ירד מהארנק בהתאם" — לא לחייב
  // צעד נפרד של "הוסף תשלום" אחרי "הוסף הוצאה"). יוצר Payment מקושר באותה
  // פעולה; ל-cash זה כבר מפעיל את ניכוי-הארנק הקיים (financeRepository.createPayment).
  const paymentMethod = readOptionalString(formData, "paymentMethod");
  if (paymentMethod) {
    const paymentParsed = createPaymentInputSchema.safeParse({
      expenseId: expense.id,
      amount: expense.amount,
      currencyCode: expense.currencyCode,
      paymentAt: expense.expenseAt,
      paymentMethod,
    });
    if (paymentParsed.success) {
      await financeRepository.createPayment({ input: paymentParsed.data });
      logger.info("payment created alongside expense", { expenseId: expense.id, paymentMethod, tripId });
    }
  }

  revalidatePath(`/trips/${tripId}`);
  // ר' ההערה המקבילה ב-topUpWalletAction — תשלום-מזומן משנה יתרת-ארנק
  // שמוצגת גם בסיידבר הגלובלי, שתלוי ב-layout המשותף.
  if (paymentMethod === "cash") revalidatePath("/", "layout");
  return { createdId: expense.id };
}

export async function createPaymentAction(
  tripId: string,
  _prevState: FinanceFormState,
  formData: FormData,
): Promise<FinanceFormState> {
  const user = await getCurrentUser();
  if (!user) redirect("/login");

  try {
    await assertTripOwnership(user.id, tripId);
  } catch {
    return { formError: "הטיול לא נמצא או שאין לך הרשאה אליו." };
  }

  const parsed = createPaymentInputSchema.safeParse({
    expenseId: readOptionalString(formData, "expenseId"),
    amount: Number(formData.get("amount")),
    currencyCode: formData.get("currencyCode"),
    paymentAt: new Date().toISOString(),
    paymentMethod: formData.get("paymentMethod"),
    cardId: readOptionalString(formData, "cardId"),
  });

  if (!parsed.success) {
    return { fieldErrors: parsed.error.flatten().fieldErrors };
  }

  const financeRepository = await getFinanceRepository();
  const payment = await financeRepository.createPayment({ input: parsed.data });
  logger.info("payment created", { paymentId: payment.id, tripId });

  revalidatePath(`/trips/${tripId}`);
  // ר' ההערה המקבילה ב-topUpWalletAction — כמו ב-createExpenseAction, זה משנה
  // יתרת-ארנק רק כש-cash + expenseId (ר' finance-repository.prisma.ts).
  if (parsed.data.paymentMethod === "cash" && parsed.data.expenseId) revalidatePath("/", "layout");
  return {};
}

export async function createCurrencyExchangeAction(
  tripId: string,
  _prevState: FinanceFormState,
  formData: FormData,
): Promise<FinanceFormState> {
  const user = await getCurrentUser();
  if (!user) redirect("/login");

  try {
    await assertTripOwnership(user.id, tripId);
  } catch {
    return { formError: "הטיול לא נמצא או שאין לך הרשאה אליו." };
  }

  const givenAmount = Number(formData.get("givenAmount"));
  const receivedAmount = Number(formData.get("receivedAmount"));
  const parsed = createCurrencyExchangeInputSchema.safeParse({
    tripId,
    givenAmount,
    givenCurrencyCode: formData.get("givenCurrencyCode"),
    receivedAmount,
    receivedCurrencyCode: formData.get("receivedCurrencyCode"),
    actualRate: givenAmount > 0 ? receivedAmount / givenAmount : 0,
    feeAmount: readOptionalString(formData, "feeAmount") ? Number(formData.get("feeAmount")) : undefined,
    exchangeAt: new Date().toISOString(),
  });

  if (!parsed.success) {
    return { fieldErrors: parsed.error.flatten().fieldErrors };
  }

  const financeRepository = await getFinanceRepository();
  const exchange = await financeRepository.createCurrencyExchange({ input: parsed.data });
  logger.info("currency exchange created", { exchangeId: exchange.id, tripId });

  revalidatePath(`/trips/${tripId}`);
  // ר' ההערה המקבילה ב-topUpWalletAction — המרת-מטבע מורידה ומוסיפה משני
  // ארנקים (financeRepository.createCurrencyExchange).
  revalidatePath("/", "layout");
  return { createdId: exchange.id };
}

export async function correctCurrencyExchangeAction(
  tripId: string,
  exchangeId: string,
  _prevState: FinanceFormState,
  formData: FormData,
): Promise<FinanceFormState> {
  const user = await getCurrentUser();
  if (!user) redirect("/login");

  try {
    await assertTripOwnership(user.id, tripId);
  } catch {
    return { formError: "הטיול לא נמצא או שאין לך הרשאה אליו." };
  }

  const parsed = correctCurrencyExchangeInputSchema.safeParse({
    exchangeId,
    correctedGivenAmount: Number(formData.get("correctedGivenAmount")),
    correctedReceivedAmount: Number(formData.get("correctedReceivedAmount")),
    reason: readOptionalString(formData, "reason"),
  });

  if (!parsed.success) {
    return { fieldErrors: parsed.error.flatten().fieldErrors };
  }

  const financeRepository = await getFinanceRepository();
  const exchange = await financeRepository.correctCurrencyExchange({ input: parsed.data });
  logger.info("currency exchange corrected", { exchangeId: exchange.id, tripId });

  revalidatePath(`/trips/${tripId}`);
  return {};
}

export async function createRefundAction(
  tripId: string,
  _prevState: FinanceFormState,
  formData: FormData,
): Promise<FinanceFormState> {
  const user = await getCurrentUser();
  if (!user) redirect("/login");

  try {
    await assertTripOwnership(user.id, tripId);
  } catch {
    return { formError: "הטיול לא נמצא או שאין לך הרשאה אליו." };
  }

  const isPending = formData.get("pending") === "on";
  const expectedDate = readOptionalString(formData, "expectedDate");
  const parsed = createRefundInputSchema.safeParse({
    tripId,
    sourceExpenseId: formData.get("sourceExpenseId"),
    amount: Number(formData.get("amount")),
    currencyCode: formData.get("currencyCode"),
    reason: readOptionalString(formData, "reason"),
    refundAt: isPending && expectedDate ? new Date(expectedDate).toISOString() : new Date().toISOString(),
    isReceived: !isPending,
  });

  if (!parsed.success) {
    return { fieldErrors: parsed.error.flatten().fieldErrors };
  }

  const financeRepository = await getFinanceRepository();
  const refund = await financeRepository.createRefund({ input: parsed.data });
  logger.info("refund created", { refundId: refund.id, tripId, isReceived: refund.isReceived });

  revalidatePath(`/trips/${tripId}`);
  return {};
}

export async function markRefundReceivedAction(tripId: string, refundId: string, formData: FormData): Promise<void> {
  const user = await getCurrentUser();
  if (!user) redirect("/login");
  await assertTripOwnership(user.id, tripId);

  const parsed = markRefundReceivedInputSchema.parse({
    refundId,
    receivedDate: formData.get("receivedDate"),
  });

  const financeRepository = await getFinanceRepository();
  await financeRepository.markRefundReceived({ input: parsed });
  logger.info("refund marked received", { refundId, tripId });

  revalidatePath(`/trips/${tripId}`);
}

// הערה: מחיקת הוצאה לא מבטלת תשלומים/הפחתות ארנק שכבר נרשמו עליה — אם היה
// תשלום במזומן, יתרת הארנק נשארת מופחתת. תיקון אוטומטי של הארנק במחיקה
// לא בוצע כאן (היקף שונה, מתאים יותר לתכנון עתידי לצד Payment soft delete).
export async function softDeleteExpenseAction(tripId: string, expenseId: string): Promise<void> {
  const user = await getCurrentUser();
  if (!user) redirect("/login");
  await assertTripOwnership(user.id, tripId);

  const financeRepository = await getFinanceRepository();
  await financeRepository.softDeleteExpense({ expenseId });
  logger.info("expense soft-deleted", { expenseId, tripId });

  revalidatePath(`/trips/${tripId}`);
}

export async function softDeletePaymentAction(tripId: string, paymentId: string): Promise<void> {
  const user = await getCurrentUser();
  if (!user) redirect("/login");
  await assertTripOwnership(user.id, tripId);

  const financeRepository = await getFinanceRepository();
  await financeRepository.softDeletePayment({ paymentId });
  logger.info("payment soft-deleted", { paymentId, tripId });

  revalidatePath(`/trips/${tripId}`);
}

export async function createDepositAction(
  tripId: string,
  _prevState: FinanceFormState,
  formData: FormData,
): Promise<FinanceFormState> {
  const user = await getCurrentUser();
  if (!user) redirect("/login");

  try {
    await assertTripOwnership(user.id, tripId);
  } catch {
    return { formError: "הטיול לא נמצא או שאין לך הרשאה אליו." };
  }

  const parsed = createDepositInputSchema.safeParse({
    tripId,
    amount: Number(formData.get("amount")),
    currencyCode: formData.get("currencyCode"),
    paidTo: readOptionalString(formData, "paidTo"),
    reason: readOptionalString(formData, "reason"),
    expectedReturnDate: readOptionalString(formData, "expectedReturnDate"),
  });

  if (!parsed.success) {
    return { fieldErrors: parsed.error.flatten().fieldErrors };
  }

  const financeRepository = await getFinanceRepository();
  const deposit = await financeRepository.createDeposit({ input: parsed.data });
  logger.info("deposit created", { depositId: deposit.id, tripId });

  revalidatePath(`/trips/${tripId}`);
  return {};
}

export async function markDepositReturnedAction(tripId: string, depositId: string, formData: FormData): Promise<void> {
  const user = await getCurrentUser();
  if (!user) redirect("/login");
  await assertTripOwnership(user.id, tripId);

  const parsed = markDepositReturnedInputSchema.parse({
    depositId,
    returnedAmount: Number(formData.get("returnedAmount")),
    returnedDate: formData.get("returnedDate"),
  });

  const financeRepository = await getFinanceRepository();
  await financeRepository.markDepositReturned({ input: parsed });
  logger.info("deposit marked returned", { depositId, tripId });

  revalidatePath(`/trips/${tripId}`);
}

export async function upsertBudgetCategoryLimitAction(
  tripId: string,
  _prevState: FinanceFormState,
  formData: FormData,
): Promise<FinanceFormState> {
  const user = await getCurrentUser();
  if (!user) redirect("/login");

  try {
    await assertTripOwnership(user.id, tripId);
  } catch {
    return { formError: "הטיול לא נמצא או שאין לך הרשאה אליו." };
  }

  const parsed = upsertBudgetCategoryLimitInputSchema.safeParse({
    tripId,
    category: formData.get("category"),
    limitAmount: Number(formData.get("limitAmount")),
  });

  if (!parsed.success) {
    return { fieldErrors: parsed.error.flatten().fieldErrors };
  }

  const financeRepository = await getFinanceRepository();
  const limit = await financeRepository.upsertBudgetCategoryLimit({ input: parsed.data });
  logger.info("budget category limit upserted", { limitId: limit.id, tripId });

  revalidatePath(`/trips/${tripId}`);
  return {};
}

export async function deleteBudgetCategoryLimitAction(tripId: string, limitId: string): Promise<void> {
  const user = await getCurrentUser();
  if (!user) redirect("/login");
  await assertTripOwnership(user.id, tripId);

  const financeRepository = await getFinanceRepository();
  await financeRepository.deleteBudgetCategoryLimit({ id: limitId });
  logger.info("budget category limit deleted", { limitId, tripId });

  revalidatePath(`/trips/${tripId}`);
}

/** המרה מהירה בין שני מטבעות — ILS הוא ה-pivot (אין rate ישיר בין שני מטבעות זרים). */
export async function convertCurrencyAction(
  amount: number,
  fromCurrency: string,
  toCurrency: string,
): Promise<{ ok: true; result: number } | { ok: false; error: string }> {
  const user = await getCurrentUser();
  if (!user) redirect("/login");

  if (!Number.isFinite(amount) || amount < 0) {
    return { ok: false, error: "סכום לא תקין." };
  }

  const currencyRateProvider = getCurrencyRateProvider();
  const rates = await currencyRateProvider.getRatesToILS([fromCurrency, toCurrency]);
  const fromRate = rates.find((r) => r.currencyCode === fromCurrency.toUpperCase())?.rateToILS;
  const toRate = rates.find((r) => r.currencyCode === toCurrency.toUpperCase())?.rateToILS;

  if (fromRate === undefined || toRate === undefined) {
    return { ok: false, error: "לא נמצא שער חליפין עדכני לאחד המטבעות." };
  }

  return { ok: true, result: (amount * fromRate) / toRate };
}

/** כספומט קרוב למיקום הנוכחי (Overpass, לא Place/PlaceCategory — ר' DECISIONS.md). */
export async function findAtmsNearMeAction(
  lat: number,
  lng: number,
  radiusKm: number,
): Promise<{ ok: true; results: AtmCandidate[] } | { ok: false; error: string }> {
  const user = await getCurrentUser();
  if (!user) redirect("/login");

  try {
    const results = await findNearbyAtms(lat, lng, radiusKm);
    if (results === null) {
      return { ok: false, error: "לא הצלחנו לחפש כספומטים כרגע. אפשר לנסות שוב." };
    }
    return { ok: true, results };
  } catch (error) {
    logger.warn("atm search failed", { error: error instanceof Error ? error.message : String(error) });
    return { ok: false, error: "החיפוש נכשל כרגע. אפשר לנסות שוב." };
  }
}
