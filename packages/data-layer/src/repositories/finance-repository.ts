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

/**
 * Wallet + Expense + Payment תחת ריפוזיטורי אחד בכוונה — תשלום במזומן חייב
 * ליצור תנועת ארנק תואמת אוטומטית (01_architecture_v2.md, סעיף 10),
 * ופיצול לשלושה ריפוזיטוריים נפרדים היה מסבך את שמירת העקביות הזו.
 */
export interface FinanceRepository {
  listWallets(params: { tripId: string }): Promise<Wallet[]>;
  topUpWallet(params: { input: CreateWalletInput }): Promise<Wallet>;
  /** מתאים currentBalance לסכום שנספר בפועל, ורושם WalletTransaction מסוג "adjustment" עם ההפרש. */
  reconcileWallet(params: { input: ReconcileWalletInput }): Promise<Wallet>;
  /**
   * מתקן/מבטל הפקדה (top_up) ספציפית שנרשמה בטעות (סכום שגוי, או שהופקדה
   * במטבע הלא-נכון). כמו reconcileWallet ו-correctCurrencyExchange — לא
   * מוחקת/משכתבת את ה-WalletTransaction המקורי (הטבלה append-only, ר' סכימה),
   * אלא רושמת תנועת "adjustment" חדשה עם ההפרש. correctedAmount=0 מבטל את
   * ההפקדה לגמרי; המשתמש מפקיד מחדש בנפרד במטבע הנכון דרך topUpWallet.
   */
  correctWalletTopUp(params: { input: CorrectWalletTopUpInput }): Promise<Wallet>;
  /** דוח תנועות מלא לכל ארנקי הטיול, ממוין מהחדש לישן. */
  listWalletTransactions(params: { tripId: string }): Promise<WalletTransaction[]>;

  listExpenses(params: { tripId: string; includeDeleted?: boolean }): Promise<Expense[]>;
  /** גרסה מקובצת של listExpenses (בלי includeDeleted — רק הוצאות פעילות) — שאילתה אחת ל-N טיולים. */
  listExpensesForTrips(params: { tripIds: string[] }): Promise<Expense[]>;
  /** אם input.participantCompanionIds מועבר, יוצר גם את שורות ה-ExpenseParticipant התואמות (ר' listExpenseParticipants). */
  createExpense(params: { input: CreateExpenseInput }): Promise<Expense>;
  /** עדכון-חלקי — רק שדות שהופיעו ב-input.input משתנים (ר' UpdateExpenseInput). */
  updateExpense(params: { input: UpdateExpenseInput }): Promise<Expense>;
  softDeleteExpense(params: { expenseId: string }): Promise<Expense>;
  restoreExpense(params: { expenseId: string }): Promise<Expense>;

  /** לכל הוצאות הטיול, לצורך "סגירת חשבונות" (computeSettleUp) — הוצאות בלי משתתפים-נבחרים פשוט לא מופיעות כאן. */
  listExpenseParticipants(params: { tripId: string }): Promise<ExpenseParticipant[]>;

  listPayments(params: { expenseId: string; includeDeleted?: boolean }): Promise<Payment[]>;
  /**
   * כל תשלומי הטיול (למשל לסיכום הוצאות כרטיס אשראי). מכסה רק תשלומים
   * המקושרים ל-Expense — Payment לא מחזיק tripId ישירות, ותשלום המקושר
   * ישירות ל-Booking (בלי Expense) לא נכלל בשלב הזה (מגבלה מתועדת ב-DECISIONS.md).
   */
  listPaymentsByTrip(params: { tripId: string; includeDeleted?: boolean }): Promise<Payment[]>;
  /** אם paymentMethod === "cash", מפחית אוטומטית מיתרת הארנק המתאים (אם קיים). */
  createPayment(params: { input: CreatePaymentInput }): Promise<Payment>;
  /**
   * כמו softDeleteExpense — לא מבטל את ההשפעה על הארנק (אם היה תשלום במזומן,
   * היתרה נשארת כפי שהיא). אותה מגבלה מתועדת, אותה סיבה: תיקון ארנק אוטומטי
   * דורש עיצוב נפרד (ר' DECISIONS.md).
   */
  softDeletePayment(params: { paymentId: string }): Promise<Payment>;
  restorePayment(params: { paymentId: string }): Promise<Payment>;

  listCurrencyExchanges(params: { tripId: string }): Promise<CurrencyExchange[]>;
  /**
   * לא נחשבת הוצאה. מפחיתה אוטומטית מארנק המטבע הנתון (given) ומוסיפה
   * אוטומטית לארנק המטבע המתקבל (received) — יוצרת/מעדכנת את שני הארנקים.
   */
  createCurrencyExchange(params: { input: CreateCurrencyExchangeInput }): Promise<CurrencyExchange>;
  /**
   * תיקון להמרה שכבר נרשמה (למשל הקלדה שגויה של סכום) — לא מוחקת/משכתבת
   * את שתי תנועות הארנק המקוריות (exchange_out/exchange_in), אלא מוסיפה
   * תנועת "adjustment" חדשה על כל ארנק שהסכום שלו השתנה (אותה סמנטיקה בדיוק
   * כמו reconcileWallet — דלתא+סיבה, לא שכתוב היסטוריה), ומעדכנת את השורה
   * עצמה (givenAmount/receivedAmount/actualRate) כדי שהתצוגה תשקף את הסכום
   * הנכון. משאירה given/receivedCurrencyCode כפי שהם — תיקון מטבע (לא רק
   * סכום) הוא שינוי מהותי יותר, מחוץ לסקופ הזה.
   */
  correctCurrencyExchange(params: { input: CorrectCurrencyExchangeInput }): Promise<CurrencyExchange>;

  listRefunds(params: { tripId: string }): Promise<Refund[]>;
  /**
   * החזר תמיד "מוסיף" כסף בפועל — לא הכנסה רגילה ולא הוצאה שלילית (סעיף
   * "Refund" בהבהרות). כש-isReceived!==false (ברירת מחדל) מזכה אוטומטית את
   * הארנק המתאים למטבע ההחזר, ויוצר אותו אם לא קיים — אותה סמנטיקה כמו
   * Currency Exchange. כש-isReceived===false (החזר צפוי/ממתין) הארנק לא
   * מזוכה עדיין — הזיכוי קורה רק ב-markRefundReceived.
   */
  createRefund(params: { input: CreateRefundInput }): Promise<Refund>;
  /** מזכה את הארנק בסכום ההחזר המקורי, ומעדכן isReceived+refundAt לתאריך הקבלה בפועל. */
  markRefundReceived(params: { input: MarkRefundReceivedInput }): Promise<Refund>;

  listDeposits(params: { tripId: string }): Promise<Deposit[]>;
  /** פיקדון תמיד מפחית מהארנק המתאים ברגע התשלום (deposit_out). */
  createDeposit(params: { input: CreateDepositInput }): Promise<Deposit>;
  /** מזכה את הארנק בסכום שהוחזר בפועל (deposit_return_in) — יכול להיות פחות מהסכום המקורי. */
  markDepositReturned(params: { input: MarkDepositReturnedInput }): Promise<Deposit>;

  listBudgetCategoryLimits(params: { tripId: string }): Promise<BudgetCategoryLimit[]>;
  /** יוצר או מעדכן (לפי tripId+category ייחודי) — טופס אחד לשני המצבים. */
  upsertBudgetCategoryLimit(params: { input: UpsertBudgetCategoryLimitInput }): Promise<BudgetCategoryLimit>;
  deleteBudgetCategoryLimit(params: { id: string }): Promise<void>;
}

export class WalletNotFoundError extends Error {
  constructor(walletId: string) {
    super(`Wallet ${walletId} not found`);
    this.name = "WalletNotFoundError";
  }
}

export class WalletTransactionNotFoundError extends Error {
  constructor(transactionId: string) {
    super(`WalletTransaction ${transactionId} not found`);
    this.name = "WalletTransactionNotFoundError";
  }
}

export class DepositNotFoundError extends Error {
  constructor(depositId: string) {
    super(`Deposit ${depositId} not found`);
    this.name = "DepositNotFoundError";
  }
}

export class RefundNotFoundError extends Error {
  constructor(refundId: string) {
    super(`Refund ${refundId} not found`);
    this.name = "RefundNotFoundError";
  }
}

export class ExpenseNotFoundError extends Error {
  constructor(expenseId: string) {
    super(`Expense ${expenseId} not found`);
    this.name = "ExpenseNotFoundError";
  }
}

export class PaymentNotFoundError extends Error {
  constructor(paymentId: string) {
    super(`Payment ${paymentId} not found`);
    this.name = "PaymentNotFoundError";
  }
}

export class CurrencyExchangeNotFoundError extends Error {
  constructor(exchangeId: string) {
    super(`CurrencyExchange ${exchangeId} not found`);
    this.name = "CurrencyExchangeNotFoundError";
  }
}
