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
  type Deposit,
  type TripBudget,
  SK,
  loadJSON,
  saveJSON,
  today,
  INITIAL_BALANCES,
  INITIAL_EXPENSES,
  INITIAL_CARDS,
  nextId,
  resolveLocalCurrency,
  defaultCurrencyPriority,
  tripScopedKey,
  notifyStorageFailure,
} from "./wallet-data";
import { currentScopeTripId } from "./trips-data";
import { putImage, deleteImage } from "./image-store";

/**
 * Hook משותף לכל מסכי-הארנק החדשים (16-21) — חילוץ מדויק (לא שכתוב) של
 * הלוגיקה העסקית שכבר הייתה קיימת ב-wallet/page.tsx הישן (תג-אחד לפני
 * הפיצול-למסכים): hydrate/persist מ-localStorage, adjustBalance,
 * add/reduce/convert/expense, בדיוק אותם חישובים. לפי הדרישה "אל תבנה
 * מחדש פעולה שכבר קיימת — חבר אותה לעיצוב החדש".
 */
export function useWalletStore() {
  // נקבע פעם אחת בעליית-הרכיב, לא נקרא-מחדש בכל אפקט בנפרד — כדי שאם
  // הטיול-הפעיל מתחלף באמצע ה-mount (למשל מטאב אחר) לא "יזלוג" מצב-הידרציה
  // של טיול אחד עם כתיבת-שמירה של טיול אחר. ר' ההסבר המלא בתוכנית-ההיקף-
  // לכל-טיול (trips-data.ts, currentScopeTripId).
  const [tripId] = useState(() => currentScopeTripId());
  const [hydrated, setHydrated] = useState(false);
  const [balances, setBalances] = useState<CurrencyBalance[]>(INITIAL_BALANCES);
  const [expenses, setExpenses] = useState<Expense[]>(INITIAL_EXPENSES);
  const [cards, setCards] = useState<CreditCardInfo[]>([]);
  const [additions, setAdditions] = useState<MoneyAddition[]>([]);
  const [conversions, setConversions] = useState<ConversionRecord[]>([]);
  const [deposits, setDeposits] = useState<Deposit[]>([]);
  const [baseCurrency, setBaseCurrency] = useState("ILS");
  const [budget, setBudgetState] = useState<TripBudget | null>(null);
  const [manualCountryCode, setManualCountryCode] = useState<string | null>(null);
  const [geoCountryCode, setGeoCountryCode] = useState<string | null>(null);
  const [rates, setRates] = useState<{ status: "loading" | "success" | "error"; data: DemoCurrencyResult | null }>({ status: "loading", data: null });
  const [toast, setToast] = useState<{ message: string; actionLabel?: string; onAction?: () => void } | null>(null);
  const toastTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const pendingDeleteExpense = useRef<{ tx: Expense; index: number } | null>(null);
  const pendingDeleteCard = useRef<{ card: CreditCardInfo; index: number } | null>(null);
  const pendingDeleteAddition = useRef<{ addition: MoneyAddition; index: number } | null>(null);
  const pendingDeleteConversion = useRef<{ record: ConversionRecord; index: number } | null>(null);
  const pendingDeleteBalance = useRef<{ balance: CurrencyBalance; index: number } | null>(null);
  const pendingDeleteDeposit = useRef<{ deposit: Deposit; index: number } | null>(null);

  function showToast(message: string, actionLabel?: string, onAction?: () => void) {
    if (toastTimer.current) clearTimeout(toastTimer.current);
    setToast({ message, actionLabel, onAction });
    toastTimer.current = setTimeout(() => setToast(null), 4200);
  }
  /** מסתירה טוסט מיידית (למשל כשפותחים חלונית חדשה) — בלי לחכות לפסק-הזמן
   * הרגיל, כדי שטוסט-"בטל" ישן לא יישאר גלוי מאחורי חלונית חדשה. */
  function dismissToast() {
    if (toastTimer.current) clearTimeout(toastTimer.current);
    setToast(null);
  }

  useEffect(() => {
    setBalances(loadJSON(tripScopedKey(SK.balances, tripId), INITIAL_BALANCES));
    setExpenses(loadJSON(tripScopedKey(SK.expenses, tripId), INITIAL_EXPENSES));
    setCards(loadJSON(tripScopedKey(SK.cards, tripId), INITIAL_CARDS));
    setAdditions(loadJSON(tripScopedKey(SK.additions, tripId), []));
    setConversions(loadJSON(tripScopedKey(SK.conversions, tripId), []));
    setDeposits(loadJSON(tripScopedKey(SK.deposits, tripId), []));
    setBaseCurrency(loadJSON(tripScopedKey(SK.baseCcy, tripId), "ILS"));
    setBudgetState(loadJSON<TripBudget | null>(tripScopedKey(SK.budget, tripId), null));
    setManualCountryCode(loadJSON<string | null>(tripScopedKey(SK.manualCountry, tripId), null));
    setGeoCountryCode(loadJSON<string | null>(tripScopedKey(SK.geoCountry, tripId), null));
    setHydrated(true);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);
  useEffect(() => {
    if (!hydrated) return;
    saveJSON(tripScopedKey(SK.balances, tripId), balances);
  }, [balances, hydrated, tripId]);
  useEffect(() => {
    if (!hydrated) return;
    saveJSON(tripScopedKey(SK.expenses, tripId), expenses);
  }, [expenses, hydrated, tripId]);
  useEffect(() => {
    if (!hydrated) return;
    saveJSON(tripScopedKey(SK.cards, tripId), cards);
  }, [cards, hydrated, tripId]);
  useEffect(() => {
    if (!hydrated) return;
    saveJSON(tripScopedKey(SK.additions, tripId), additions);
  }, [additions, hydrated, tripId]);
  useEffect(() => {
    if (!hydrated) return;
    saveJSON(tripScopedKey(SK.conversions, tripId), conversions);
  }, [conversions, hydrated, tripId]);
  useEffect(() => {
    if (!hydrated) return;
    saveJSON(tripScopedKey(SK.deposits, tripId), deposits);
  }, [deposits, hydrated, tripId]);
  useEffect(() => {
    if (!hydrated) return;
    saveJSON(tripScopedKey(SK.baseCcy, tripId), baseCurrency);
  }, [baseCurrency, hydrated, tripId]);
  useEffect(() => {
    if (!hydrated) return;
    saveJSON(tripScopedKey(SK.budget, tripId), budget);
  }, [budget, hydrated, tripId]);
  useEffect(() => {
    if (!hydrated) return;
    saveJSON(tripScopedKey(SK.manualCountry, tripId), manualCountryCode);
  }, [manualCountryCode, hydrated, tripId]);
  // חסר קודם: geoCountryCode היה נקרא בהידרציה אבל לא נשמר בשום persist
  // effect — רק CurrenciesSection.detectByLocation כתב אותו ישירות ל-
  // localStorage, עוקף את ה-state של ה-hook. נוסף כחלק מאיחוד-שלושת-
  // ההעתקים העצמאיים (ר' תוכנית ההיקף-לכל-טיול).
  useEffect(() => {
    if (!hydrated) return;
    saveJSON(tripScopedKey(SK.geoCountry, tripId), geoCountryCode);
  }, [geoCountryCode, hydrated, tripId]);

  useEffect(() => {
    getDemoCurrencyRatesAction()
      .then((res) => setRates({ status: res ? "success" : "error", data: res }))
      .catch(() => setRates({ status: "error", data: null }));
  }, []);

  const localCurrency = useMemo(() => resolveLocalCurrency({ manualCountryCode, geoCountryCode, baseCurrency }), [manualCountryCode, geoCountryCode, baseCurrency]);

  // 4 מטבעות-בסיס קבועים תמיד זמינים בארנק (יתרת-אפס אם עוד אין בהם כסף):
  // המטבע המקומי של יעד הטיול, דולר, אירו ושקל — ניתן עדיין להסיר כל אחד
  // מהם בנפרד, זו רק ברירת-מחדל שחוסכת "הוספת מטבע" ידנית לכל אחד.
  useEffect(() => {
    if (!hydrated) return;
    const baseline = defaultCurrencyPriority(localCurrency.currencyCode);
    setBalances((prev) => {
      const missing = baseline.filter((code) => !prev.some((b) => b.code === code));
      if (missing.length === 0) return prev;
      return [...prev, ...missing.map((code) => ({ code, balance: 0, spent: 0, lastUpdated: today() }))];
    });
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
  /** מסירה מטבע מהארנק לגמרי (לא רק מאפסת יתרה) — עם אפשרות "בטל", כמו
   * שאר פעולות-המחיקה בארנק. אינה נוגעת בהוצאות/תנועות עבר באותו מטבע. */
  function removeBalanceCurrency(code: string) {
    const idx = balances.findIndex((b) => b.code === code);
    if (idx === -1) return;
    const balance = balances[idx]!;
    pendingDeleteBalance.current = { balance, index: idx };
    setBalances((prev) => prev.filter((b) => b.code !== code));
    showToast(`מטבע ${currencyMeta(code).name} הוסר מהארנק`, "בטל", () => {
      const pending = pendingDeleteBalance.current;
      if (!pending) return;
      setBalances((prev) => {
        const arr = [...prev];
        arr.splice(pending.index, 0, pending.balance);
        return arr;
      });
      setToast(null);
    });
  }

  /** מזיזה מטבע במיקום אחד קדימה/אחורה ברשימת-היתרות — הפעולה היחידה
   * שהייתה קיימת רק ב-CurrenciesSection (more/page.tsx) ולא כאן, לפני
   * איחוד-שלושת-ההעתקים העצמאיים (ר' תוכנית ההיקף-לכל-טיול). */
  function moveBalance(index: number, dir: -1 | 1) {
    setBalances((prev) => {
      const j = index + dir;
      if (j < 0 || j >= prev.length) return prev;
      const arr = [...prev];
      [arr[index], arr[j]] = [arr[j]!, arr[index]!];
      return arr;
    });
  }

  function addMoney(currency: string, amount: number, source: MoneySource, date: string, note: string) {
    adjustBalance(currency, amount);
    setAdditions((prev) => [{ id: nextId("add"), currency, amount, source, date, note: note || undefined }, ...prev]);
    showToast(`נוספו ${formatMoney(amount, currency)} ליתרת ${currencyMeta(currency).name}`);
  }
  /** מבטלת הפקדה ספציפית שנרשמה בטעות (למשל במטבע הלא-נכון) — מסירה אותה
   * ומחזירה את היתרה למצב שהיה לפני ההפקדה, עם אפשרות "בטל" (undo) באותו
   * דפוס כמו deleteExpense. אחרי הביטול אפשר להפקיד מחדש דרך addMoney. */
  function deleteAddition(id: string) {
    const idx = additions.findIndex((a) => a.id === id);
    if (idx === -1) return;
    const addition = additions[idx]!;
    pendingDeleteAddition.current = { addition, index: idx };
    setAdditions((prev) => prev.filter((a) => a.id !== id));
    adjustBalance(addition.currency, -addition.amount);
    showToast(`ההפקדה של ${formatMoney(addition.amount, addition.currency)} בוטלה`, "בטל", () => {
      const pending = pendingDeleteAddition.current;
      if (!pending) return;
      setAdditions((prev) => {
        const arr = [...prev];
        arr.splice(pending.index, 0, pending.addition);
        return arr;
      });
      adjustBalance(pending.addition.currency, pending.addition.amount);
      setToast(null);
    });
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
  /** עריכת המרה קיימת — מבטלת את השפעת-היתרות של הרשומה הישנה ואז מחילה
   * את הרשומה החדשה, כדי ששינוי סכום/מטבע לא ישאיר יתרות "תקועות". */
  function updateConversion(id: string, fromCcy: string, fromAmount: number, toCcy: string, toAmount: number, fee: number, location: string, dateTime: string): boolean {
    const existing = conversions.find((c) => c.id === id);
    if (!existing) return false;
    adjustBalance(existing.fromCurrency, existing.fromAmount);
    adjustBalance(existing.toCurrency, -existing.toAmount);
    const bal = balanceOf(fromCcy);
    const availableBalance = fromCcy === existing.fromCurrency ? bal.balance + existing.fromAmount : bal.balance;
    if (fromAmount > availableBalance) {
      adjustBalance(existing.fromCurrency, -existing.fromAmount);
      adjustBalance(existing.toCurrency, existing.toAmount);
      showToast("היתרה במטבע המקור אינה מספיקה — העדכון בוטל");
      return false;
    }
    const marketRate = convertAmount(1, fromCcy, toCcy);
    adjustBalance(fromCcy, -fromAmount);
    adjustBalance(toCcy, toAmount);
    setConversions((prev) =>
      prev.map((c) =>
        c.id === id
          ? { ...c, fromCurrency: fromCcy, fromAmount, toCurrency: toCcy, toAmount, fee: fee || undefined, location: location || undefined, dateTime, effectiveRate: toAmount / fromAmount, marketRateAtTime: marketRate ?? undefined }
          : c
      )
    );
    showToast("ההמרה עודכנה");
    return true;
  }
  function deleteConversion(id: string) {
    const idx = conversions.findIndex((c) => c.id === id);
    if (idx === -1) return;
    const record = conversions[idx]!;
    pendingDeleteConversion.current = { record, index: idx };
    setConversions((prev) => prev.filter((c) => c.id !== id));
    adjustBalance(record.fromCurrency, record.fromAmount);
    adjustBalance(record.toCurrency, -record.toAmount);
    showToast(`ההמרה ל-${currencyMeta(record.toCurrency).name} נמחקה`, "בטל", () => {
      const pending = pendingDeleteConversion.current;
      if (!pending) return;
      setConversions((prev) => {
        const arr = [...prev];
        arr.splice(pending.index, 0, pending.record);
        return arr;
      });
      adjustBalance(pending.record.fromCurrency, -pending.record.fromAmount);
      adjustBalance(pending.record.toCurrency, pending.record.toAmount);
      setToast(null);
    });
  }
  function saveExpense(patch: Omit<Expense, "id">, receiptDataUrl: string | null | undefined, existingId?: string) {
    const previousReceiptId = existingId ? expenses.find((e) => e.id === existingId)?.receiptId : undefined;
    let receiptId = previousReceiptId;
    if (receiptDataUrl) {
      receiptId = previousReceiptId ?? nextId("rcpt");
      // לא מחכים ל-await בכוונה — הפונקציה נקראת מיד לפני router.push, ועיכוב
      // של כמה מ"ש בגלל IndexedDB גרוע יותר מכתיבה שמסתיימת רגע אחרי הניווט.
      // כשל אמיתי כן מוצג למשתמש (לא נבלע), לא רק ל-console.
      putImage(receiptId, receiptDataUrl).catch((err) => {
        console.error(`saveExpense: putImage failed for receipt "${receiptId}":`, err);
        notifyStorageFailure("שמירת תמונת הקבלה נכשלה — ייתכן שאין מספיק מקום פנוי באחסון. שאר פרטי ההוצאה נשמרו.");
      });
    } else if (receiptDataUrl === null && existingId) {
      receiptId = undefined;
      // המשתמש הסיר קבלה קיימת בעריכה — מוחקים גם את התמונה עצמה, לא רק
      // את הקישור אליה (באג קודם: התמונה נשארה יתומה ב-storage לצמיתות).
      if (previousReceiptId) deleteImage(previousReceiptId).catch((err) => console.error("saveExpense: deleteImage failed:", err));
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
      pendingDeleteExpense.current = null; // מסמן "הביטול קרה בפועל" עבור הבדיקה המושהית למטה
      setToast(null);
    });
    // מחיקת תמונת-הקבלה עצמה (באג קודם: לא נמחקה לעולם) — מושהית עד רגע אחרי
    // שהטוסט-"בטל" נעלם לבד (4200ms ב-showToast), כדי ש"בטל" ישחזר גם את
    // התמונה במלואה, לא רק את רשומת-ההוצאה.
    if (tx.receiptId) {
      const receiptId = tx.receiptId;
      setTimeout(() => {
        if (pendingDeleteExpense.current?.tx.id === tx.id) deleteImage(receiptId).catch((err) => console.error("deleteExpense: deleteImage failed:", err));
      }, 4300);
    }
  }

  // ---------- פיקדונות (מלון/רכב שכור/וכו') ----------
  // בניגוד להוצאה: לא הוצאה קבועה — יורד מהארנק/נספר-על-הכרטיס כשניתן,
  // וחוזר בדיוק באותה דרך כשמסמנים "הוחזר" (לא רק state, גם ההשפעה
  // הכספית מתבטלת בפועל).
  function addDeposit(patch: Omit<Deposit, "id" | "status" | "returnedDate">) {
    const deposit: Deposit = { id: nextId("dep"), ...patch, status: "pending" };
    setDeposits((prev) => [deposit, ...prev]);
    if (patch.paymentMethod !== "credit") {
      adjustBalance(patch.currency, -patch.amount);
    } else {
      setBalances((prev) => {
        const idx = prev.findIndex((b) => b.code === patch.currency);
        if (idx === -1) return [...prev, { code: patch.currency, balance: 0, spent: patch.amount, lastUpdated: today() }];
        const arr = [...prev];
        arr[idx] = { ...arr[idx]!, spent: arr[idx]!.spent + patch.amount, lastUpdated: today() };
        return arr;
      });
    }
    showToast(`פיקדון "${patch.title}" נרשם — ${formatMoney(patch.amount, patch.currency)}`);
    return deposit;
  }
  function markDepositReturned(id: string) {
    const deposit = deposits.find((d) => d.id === id);
    if (!deposit || deposit.status === "returned") return;
    setDeposits((prev) => prev.map((d) => (d.id === id ? { ...d, status: "returned", returnedDate: today() } : d)));
    if (deposit.paymentMethod !== "credit") adjustBalance(deposit.currency, deposit.amount);
    else setBalances((prev) => prev.map((b) => (b.code === deposit.currency ? { ...b, spent: Math.max(0, b.spent - deposit.amount) } : b)));
    showToast(`הפיקדון "${deposit.title}" סומן כהוחזר`);
  }
  function deleteDeposit(id: string) {
    const idx = deposits.findIndex((d) => d.id === id);
    if (idx === -1) return;
    const deposit = deposits[idx]!;
    pendingDeleteDeposit.current = { deposit, index: idx };
    setDeposits((prev) => prev.filter((d) => d.id !== id));
    // רק אם הפיקדון עדיין "תקוע" (pending) יש להחזיר את ההשפעה על הארנק —
    // אם כבר סומן כהוחזר, ההשפעה כבר בוטלה קודם ואין מה להפוך שוב.
    if (deposit.status === "pending") {
      if (deposit.paymentMethod !== "credit") adjustBalance(deposit.currency, deposit.amount);
      else setBalances((prev) => prev.map((b) => (b.code === deposit.currency ? { ...b, spent: Math.max(0, b.spent - deposit.amount) } : b)));
    }
    showToast(`הפיקדון "${deposit.title}" נמחק`, "בטל", () => {
      const pending = pendingDeleteDeposit.current;
      if (!pending) return;
      setDeposits((prev) => {
        const arr = [...prev];
        arr.splice(pending.index, 0, pending.deposit);
        return arr;
      });
      if (pending.deposit.status === "pending") {
        if (pending.deposit.paymentMethod !== "credit") adjustBalance(pending.deposit.currency, -pending.deposit.amount);
        else setBalances((prev) => prev.map((b) => (b.code === pending.deposit.currency ? { ...b, spent: b.spent + pending.deposit.amount } : b)));
      }
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

  // null (לא 0/סכום-חלקי) אם שער-החליפין של אחד המטבעות עוד לא נטען —
  // אחרת מציגים סכום-שגוי-בשקט בזמן הטעינה במקום "טוען שער..." כנה.
  const totalConvertedToBase = useMemo(() => {
    let sum = 0;
    for (const b of balances) {
      const v = convertAmount(b.balance, b.code, baseCurrency);
      if (v == null) return null;
      sum += v;
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
    deposits,
    baseCurrency,
    setBaseCurrency,
    budget,
    setBudget: setBudgetState,
    manualCountryCode,
    setManualCountryCode,
    geoCountryCode,
    setGeoCountryCode,
    rates,
    localCurrency,
    toast,
    showToast,
    dismissToast,
    rateToILS,
    convertAmount,
    balanceOf,
    adjustBalance,
    removeBalanceCurrency,
    moveBalance,
    addMoney,
    deleteAddition,
    reduceMoney,
    convertCurrency,
    updateConversion,
    deleteConversion,
    saveExpense,
    deleteExpense,
    addDeposit,
    markDepositReturned,
    deleteDeposit,
    saveCard,
    setPrimaryCard,
    deleteCard,
    totalConvertedToBase,
  };
}

export type WalletStore = ReturnType<typeof useWalletStore>;
