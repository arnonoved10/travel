"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { getDemoCurrencyRatesAction, type DemoCurrencyResult } from "./actions";
import {
  currencyMeta,
  formatMoney,
  type MoneySource,
  type CurrencyBalance,
  type CreditCardInfo,
  type Expense,
  type MoneyAddition,
  type ConversionRecord,
  SK,
  loadJSON,
  saveJSON,
  today,
  INITIAL_BALANCES,
  INITIAL_EXPENSES,
  nextId,
  resolveLocalCurrency,
} from "./wallet-data";

/**
 * Hook משותף לכל מסכי-הארנק החדשים (16-21) — חילוץ מדויק (לא שכתוב) של
 * הלוגיקה העסקית שכבר הייתה קיימת ב-wallet/page.tsx הישן (תג-אחד לפני
 * הפיצול-למסכים): hydrate/persist מ-localStorage, adjustBalance,
 * add/reduce/convert/expense, בדיוק אותם חישובים. לפי הדרישה "אל תבנה
 * מחדש פעולה שכבר קיימת — חבר אותה לעיצוב החדש".
 */
export function useWalletStore() {
  const [hydrated, setHydrated] = useState(false);
  const [balances, setBalances] = useState<CurrencyBalance[]>(INITIAL_BALANCES);
  const [expenses, setExpenses] = useState<Expense[]>(INITIAL_EXPENSES);
  const [cards, setCards] = useState<CreditCardInfo[]>([]);
  const [additions, setAdditions] = useState<MoneyAddition[]>([]);
  const [conversions, setConversions] = useState<ConversionRecord[]>([]);
  const [receipts, setReceipts] = useState<Record<string, string>>({});
  const [baseCurrency, setBaseCurrency] = useState("ILS");
  const [manualCountryCode, setManualCountryCode] = useState<string | null>(null);
  const [geoCountryCode, setGeoCountryCode] = useState<string | null>(null);
  const [rates, setRates] = useState<{ status: "loading" | "success" | "error"; data: DemoCurrencyResult | null }>({ status: "loading", data: null });
  const [toast, setToast] = useState<{ message: string; actionLabel?: string; onAction?: () => void } | null>(null);
  const toastTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const pendingDeleteExpense = useRef<{ tx: Expense; index: number } | null>(null);
  const pendingDeleteCard = useRef<{ card: CreditCardInfo; index: number } | null>(null);

  function showToast(message: string, actionLabel?: string, onAction?: () => void) {
    if (toastTimer.current) clearTimeout(toastTimer.current);
    setToast({ message, actionLabel, onAction });
    toastTimer.current = setTimeout(() => setToast(null), 4200);
  }

  useEffect(() => {
    setBalances(loadJSON(SK.balances, INITIAL_BALANCES));
    setExpenses(loadJSON(SK.expenses, INITIAL_EXPENSES));
    setCards(loadJSON(SK.cards, []));
    setAdditions(loadJSON(SK.additions, []));
    setConversions(loadJSON(SK.conversions, []));
    setReceipts(loadJSON(SK.receipts, {}));
    setBaseCurrency(loadJSON(SK.baseCcy, "ILS"));
    setManualCountryCode(loadJSON<string | null>(SK.manualCountry, null));
    setGeoCountryCode(loadJSON<string | null>(SK.geoCountry, null));
    setHydrated(true);
  }, []);
  useEffect(() => {
    if (!hydrated) return;
    saveJSON(SK.balances, balances);
  }, [balances, hydrated]);
  useEffect(() => {
    if (!hydrated) return;
    saveJSON(SK.expenses, expenses);
  }, [expenses, hydrated]);
  useEffect(() => {
    if (!hydrated) return;
    saveJSON(SK.cards, cards);
  }, [cards, hydrated]);
  useEffect(() => {
    if (!hydrated) return;
    saveJSON(SK.additions, additions);
  }, [additions, hydrated]);
  useEffect(() => {
    if (!hydrated) return;
    saveJSON(SK.conversions, conversions);
  }, [conversions, hydrated]);
  useEffect(() => {
    if (!hydrated) return;
    saveJSON(SK.receipts, receipts);
  }, [receipts, hydrated]);
  useEffect(() => {
    if (!hydrated) return;
    saveJSON(SK.baseCcy, baseCurrency);
  }, [baseCurrency, hydrated]);
  useEffect(() => {
    if (!hydrated) return;
    saveJSON(SK.manualCountry, manualCountryCode);
  }, [manualCountryCode, hydrated]);

  useEffect(() => {
    getDemoCurrencyRatesAction()
      .then((res) => setRates({ status: res ? "success" : "error", data: res }))
      .catch(() => setRates({ status: "error", data: null }));
  }, []);

  const localCurrency = useMemo(() => resolveLocalCurrency({ manualCountryCode, geoCountryCode, baseCurrency }), [manualCountryCode, geoCountryCode, baseCurrency]);

  useEffect(() => {
    if (!hydrated) return;
    setBalances((prev) => (prev.some((b) => b.code === localCurrency.currencyCode) ? prev : [...prev, { code: localCurrency.currencyCode, balance: 0, spent: 0, lastUpdated: today() }]));
  }, [localCurrency.currencyCode, hydrated]);

  function rateToILS(code: string): number | null {
    if (code === "ILS") return 1;
    return rates.data?.ratesToILS[code] ?? null;
  }
  function convertAmount(amount: number, from: string, to: string): number | null {
    const f = rateToILS(from);
    const t = rateToILS(to);
    if (f == null || t == null) return null;
    return (amount * f) / t;
  }
  function balanceOf(code: string) {
    return balances.find((b) => b.code === code) ?? { code, balance: 0, spent: 0, lastUpdated: today() };
  }
  function adjustBalance(code: string, delta: number, alsoSpent = 0) {
    setBalances((prev) => {
      const idx = prev.findIndex((b) => b.code === code);
      if (idx === -1) return [...prev, { code, balance: delta, spent: alsoSpent, lastUpdated: today() }];
      const arr = [...prev];
      arr[idx] = { ...arr[idx]!, balance: arr[idx]!.balance + delta, spent: arr[idx]!.spent + alsoSpent, lastUpdated: today() };
      return arr;
    });
  }

  function addMoney(currency: string, amount: number, source: MoneySource, date: string, note: string) {
    adjustBalance(currency, amount);
    setAdditions((prev) => [{ id: nextId("add"), currency, amount, source, date, note: note || undefined }, ...prev]);
    showToast(`נוספו ${formatMoney(amount, currency)} ליתרת ${currencyMeta(currency).name}`);
  }
  function reduceMoney(currency: string, amount: number, note: string): boolean {
    const bal = balanceOf(currency);
    if (amount > bal.balance) {
      showToast("הסכום גדול מהיתרה הזמינה — הפעולה בוטלה");
      return false;
    }
    adjustBalance(currency, -amount);
    setAdditions((prev) => [{ id: nextId("red"), currency, amount: -amount, source: "other", date: today(), note: note || "הפחתה ידנית" }, ...prev]);
    showToast(`הופחתו ${formatMoney(amount, currency)} מיתרת ${currencyMeta(currency).name}`);
    return true;
  }
  function convertCurrency(fromCcy: string, fromAmount: number, toCcy: string, toAmount: number, fee: number, location: string, dateTime: string): boolean {
    const bal = balanceOf(fromCcy);
    if (fromAmount > bal.balance) {
      showToast("היתרה במטבע המקור אינה מספיקה — ההמרה בוטלה");
      return false;
    }
    const marketRate = convertAmount(1, fromCcy, toCcy);
    adjustBalance(fromCcy, -fromAmount);
    adjustBalance(toCcy, toAmount);
    setConversions((prev) => [
      { id: nextId("cnv"), fromCurrency: fromCcy, fromAmount, toCurrency: toCcy, toAmount, fee: fee || undefined, location: location || undefined, dateTime, effectiveRate: toAmount / fromAmount, marketRateAtTime: marketRate ?? undefined },
      ...prev,
    ]);
    showToast(`הומרו ${formatMoney(fromAmount, fromCcy)} ל-${formatMoney(toAmount, toCcy)}`);
    return true;
  }
  function saveExpense(patch: Omit<Expense, "id">, receiptDataUrl: string | null | undefined, existingId?: string) {
    let receiptId = existingId ? expenses.find((e) => e.id === existingId)?.receiptId : undefined;
    if (receiptDataUrl) {
      receiptId = existingId ? receiptId ?? nextId("rcpt") : nextId("rcpt");
      setReceipts((prev) => ({ ...prev, [receiptId!]: receiptDataUrl }));
    } else if (receiptDataUrl === null && existingId) {
      receiptId = undefined;
    }
    if (existingId) {
      setExpenses((prev) => prev.map((e) => (e.id === existingId ? { ...e, ...patch, receiptId } : e)));
    } else {
      const expense: Expense = { id: nextId("tx"), ...patch, receiptId };
      setExpenses((prev) => [expense, ...prev]);
      if (patch.paymentMethod !== "credit") {
        adjustBalance(patch.currency, -patch.amount, patch.amount);
      } else {
        setBalances((prev) => {
          const idx = prev.findIndex((b) => b.code === patch.currency);
          if (idx === -1) return [...prev, { code: patch.currency, balance: 0, spent: patch.amount, lastUpdated: today() }];
          const arr = [...prev];
          arr[idx] = { ...arr[idx]!, spent: arr[idx]!.spent + patch.amount, lastUpdated: today() };
          return arr;
        });
      }
    }
    showToast(existingId ? "ההוצאה עודכנה" : "ההוצאה נוספה");
  }
  function deleteExpense(id: string) {
    const idx = expenses.findIndex((e) => e.id === id);
    const tx = expenses[idx]!;
    pendingDeleteExpense.current = { tx, index: idx };
    setExpenses((prev) => prev.filter((e) => e.id !== id));
    if (tx.paymentMethod !== "credit") adjustBalance(tx.currency, tx.amount, -tx.amount);
    else setBalances((prev) => prev.map((b) => (b.code === tx.currency ? { ...b, spent: Math.max(0, b.spent - tx.amount) } : b)));
    showToast(`"${tx.title}" נמחקה`, "בטל", () => {
      const pending = pendingDeleteExpense.current;
      if (!pending) return;
      setExpenses((prev) => {
        const arr = [...prev];
        arr.splice(pending.index, 0, pending.tx);
        return arr;
      });
      if (pending.tx.paymentMethod !== "credit") adjustBalance(pending.tx.currency, -pending.tx.amount, pending.tx.amount);
      else setBalances((prev) => prev.map((b) => (b.code === pending.tx.currency ? { ...b, spent: b.spent + pending.tx.amount } : b)));
      setToast(null);
    });
  }
  function saveCard(card: Omit<CreditCardInfo, "id">, existingId?: string) {
    if (existingId) {
      setCards((prev) => prev.map((c) => (c.id === existingId ? { ...c, ...card, isPrimary: card.isPrimary ? true : c.isPrimary } : card.isPrimary ? { ...c, isPrimary: false } : c)));
    } else {
      setCards((prev) => (card.isPrimary ? [...prev.map((c) => ({ ...c, isPrimary: false })), { id: nextId("card"), ...card }] : [...prev, { id: nextId("card"), ...card }]));
    }
    showToast(existingId ? "הכרטיס עודכן" : "כרטיס האשראי נוסף");
  }
  function setPrimaryCard(id: string) {
    setCards((prev) => prev.map((c) => ({ ...c, isPrimary: c.id === id })));
    showToast("הכרטיס הוגדר כראשי");
  }
  function deleteCard(id: string) {
    const idx = cards.findIndex((c) => c.id === id);
    const card = cards[idx]!;
    pendingDeleteCard.current = { card, index: idx };
    setCards((prev) => prev.filter((c) => c.id !== id));
    showToast(`"${card.nickname}" נמחק`, "בטל", () => {
      const pending = pendingDeleteCard.current;
      if (!pending) return;
      setCards((prev) => {
        const arr = [...prev];
        arr.splice(pending.index, 0, pending.card);
        return arr;
      });
      setToast(null);
    });
  }

  const totalConvertedToBase = useMemo(() => {
    let sum = 0;
    for (const b of balances) {
      const v = convertAmount(b.balance, b.code, baseCurrency);
      if (v != null) sum += v;
    }
    return sum;
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [balances, baseCurrency, rates.data]);

  return {
    hydrated,
    balances,
    expenses,
    cards,
    additions,
    conversions,
    receipts,
    baseCurrency,
    setBaseCurrency,
    manualCountryCode,
    setManualCountryCode,
    geoCountryCode,
    setGeoCountryCode,
    rates,
    localCurrency,
    toast,
    showToast,
    rateToILS,
    convertAmount,
    balanceOf,
    adjustBalance,
    addMoney,
    reduceMoney,
    convertCurrency,
    saveExpense,
    deleteExpense,
    saveCard,
    setPrimaryCard,
    deleteCard,
    totalConvertedToBase,
  };
}

export type WalletStore = ReturnType<typeof useWalletStore>;
