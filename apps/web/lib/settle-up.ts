export interface SettleUpExpenseInput {
  id: string;
  amount: number;
  currencyCode: string;
}

export interface SettleUpPaymentInput {
  expenseId: string | null;
  paidByCompanionId: string | null;
}

export interface SettleUpCompanionInput {
  id: string;
  displayName: string;
}

export interface SettleUpBalance {
  companionId: string;
  displayName: string;
  /** חיובי = מגיע למלווה הזה (הוא שילם יותר מהחלק שלו); שלילי = המלווה הזה חייב. */
  netAmount: number;
}

export interface SettleUpResult {
  balances: SettleUpBalance[];
  unconvertedCurrencyCodes: string[];
}

/**
 * "מי חייב למי" — רק הוצאות עם משתתפים נבחרים-במפורש נכללות (לא הכל
 * מתחלק אוטומטית, ר' DECISIONS.md/plan). בעל החשבון תמיד משתתף מובלע
 * בכל הוצאה משותפת ולכן לא מיוצג ברשימת היתרות (רק המלווים). חלוקה שווה
 * בלבד ב-v1. מי ששילם בפועל = Payment.paidByCompanionId אם קיים תשלום עם
 * ייחוס להוצאה; אחרת בהנחה "בעל החשבון שילם" (לא מיוצג במפורש). אותו
 * דפוס-המרה כמו computeBudgetProgress — rateToILSByCurrency כבר מוכן,
 * הוצאה במטבע בלי שער זמין לא נכללת ומדווחת כ"לא הומרה".
 */
export function computeSettleUp(params: {
  expenses: SettleUpExpenseInput[];
  expenseParticipantsByExpenseId: Map<string, string[]>;
  payments: SettleUpPaymentInput[];
  companions: SettleUpCompanionInput[];
  rateToILSByCurrency: Map<string, number>;
}): SettleUpResult {
  const { expenses, expenseParticipantsByExpenseId, payments, companions, rateToILSByCurrency } = params;

  const netByCompanionId = new Map<string, number>(companions.map((c) => [c.id, 0]));
  const unconverted = new Set<string>();

  const payerByExpenseId = new Map<string, string>();
  for (const payment of payments) {
    if (payment.expenseId && payment.paidByCompanionId && !payerByExpenseId.has(payment.expenseId)) {
      payerByExpenseId.set(payment.expenseId, payment.paidByCompanionId);
    }
  }

  for (const expense of expenses) {
    const participantIds = expenseParticipantsByExpenseId.get(expense.id);
    if (!participantIds || participantIds.length === 0) continue;

    const rate = rateToILSByCurrency.get(expense.currencyCode);
    if (rate === undefined) {
      unconverted.add(expense.currencyCode);
      continue;
    }

    const amountILS = expense.amount * rate;
    const groupSize = participantIds.length + 1; // +1 = בעל החשבון, משתתף מובלע תמיד
    const shareILS = amountILS / groupSize;

    const payerCompanionId = payerByExpenseId.get(expense.id);
    if (payerCompanionId && netByCompanionId.has(payerCompanionId)) {
      netByCompanionId.set(payerCompanionId, netByCompanionId.get(payerCompanionId)! + amountILS);
    }

    for (const companionId of participantIds) {
      if (!netByCompanionId.has(companionId)) continue; // מלווה שנמחק בינתיים
      netByCompanionId.set(companionId, netByCompanionId.get(companionId)! - shareILS);
    }
  }

  const balances: SettleUpBalance[] = companions.map((c) => ({
    companionId: c.id,
    displayName: c.displayName,
    netAmount: netByCompanionId.get(c.id) ?? 0,
  }));

  return { balances, unconvertedCurrencyCodes: Array.from(unconverted).sort() };
}
