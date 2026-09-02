"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { LegacyCard as Card, LegacyIconSlot as IconSlot, LegacyScreenHeader as ScreenHeader, LegacyScreenShell as ScreenShell, LegacyBottomNav as BottomNav, LEGACY_COLOR as COLOR } from "../route/legacy-shared";
import { getDemoCurrencyRatesAction, type DemoCurrencyResult } from "../actions";
import { FlagIcon } from "../country-currency-data";
import { CountryPickerSheet, CurrencyPickerButton, AddCurrencySheet } from "../pickers";
import { Field, Sheet, ActionRow, PillSelect, DotsIcon, CameraIcon, inputStyle, ToastView } from "../ui-kit";
import {
  CURRENCY_CATALOG,
  currencyMeta,
  formatMoney,
  primaryCountryForCurrency,
  PAYMENT_METHOD_LABEL,
  MONEY_SOURCE_LABEL,
  type PaymentMethod,
  type MoneySource,
  type Category,
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
  defaultCurrencyPriority,
  categoryColor,
} from "../wallet-data";

/**
 * מסך ארנק רב-מטבעי (design-preview בלבד) — גרסה מחודשת: כרטיס "מטבע
 * מקומי" קבוע אחד עם כל הפעולות למעלה (נקבע אוטומטית לפי יעד-הטיול הפעיל,
 * עם אפשרות-על לבחירה ידנית — למשל יפן/ין), שאר המטבעות ככרטיסי-מיני
 * קומפקטיים (דגל+קוד+יתרה), שורת-פעולות-מהירות שפותחת חלוניות, ו-5
 * טאבים: סקירה/פעולות/שערים/כרטיסים/היסטוריה. גיבוי/שחזור/דוח עברו למסך
 * "עוד" (לא כאן יותר). הכל נשמר ב-localStorage בלבד — לא מחובר ל-DB.
 */

const CATEGORY_COLOR: Record<Category, string> = {
  מלון: COLOR.purple,
  מסעדות: COLOR.warning,
  תחבורה: "#4f8fe0",
  פעילויות: COLOR.success,
  קניות: "#e0699a",
  אחר: COLOR.textSecondary,
};
const CARD_COLORS = ["#6642b9", "#4f8fe0", "#43d6aa", "#e0524a", "#f5a544", "#1c2750"];

type Tab = "overview" | "activity" | "rates" | "cards" | "history";
const TABS: { key: Tab; label: string }[] = [
  { key: "overview", label: "סקירה" },
  { key: "activity", label: "פעולות" },
  { key: "rates", label: "שערים" },
  { key: "cards", label: "כרטיסים" },
  { key: "history", label: "היסטוריה" },
];

export default function WalletPreviewScreen() {
  const router = useRouter();
  // ---------- state ----------
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

  const [tab, setTab] = useState<Tab>("overview");
  const [summaryExpanded, setSummaryExpanded] = useState(false);

  const [rates, setRates] = useState<{ status: "loading" | "success" | "error"; data: DemoCurrencyResult | null }>({ status: "loading", data: null });

  const [dialog, setDialog] = useState<
    | { type: "addMoney" | "reduceMoney" | "history" | "currencyDetail"; currency: string }
    | { type: "convert"; from: string }
    | { type: "addCurrency" }
    | { type: "changeCountry" }
    | { type: "addCard" | "editCard"; id?: string }
    | { type: "paymentFilter" }
    | null
  >(null);
  const [menuForExpense, setMenuForExpense] = useState<string | null>(null);
  const [menuForCard, setMenuForCard] = useState<string | null>(null);
  const [paymentFilter, setPaymentFilter] = useState<PaymentMethod | "all">("all");
  const [viewingReceiptId, setViewingReceiptId] = useState<string | null>(null);

  const [toast, setToast] = useState<{ message: string; actionLabel?: string; onAction?: () => void } | null>(null);
  const toastTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const pendingDeleteExpense = useRef<{ tx: Expense; index: number } | null>(null);
  const pendingDeleteCard = useRef<{ card: CreditCardInfo; index: number } | null>(null);

  function showToast(message: string, actionLabel?: string, onAction?: () => void) {
    if (toastTimer.current) clearTimeout(toastTimer.current);
    setToast({ message, actionLabel, onAction });
    toastTimer.current = setTimeout(() => setToast(null), 4200);
  }
  function openDialog(d: NonNullable<typeof dialog>) {
    if (toastTimer.current) clearTimeout(toastTimer.current);
    setToast(null);
    setMenuForExpense(null);
    setMenuForCard(null);
    setDialog(d);
  }

  // ---------- hydrate מ-localStorage ----------
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

  // ---------- מטבע מקומי (אוטומטי לפי יעד-הטיול הפעיל, ניתן-לעקיפה ידנית) ----------
  const localCurrency = useMemo(() => resolveLocalCurrency({ manualCountryCode, geoCountryCode, baseCurrency }), [manualCountryCode, geoCountryCode, baseCurrency]);

  // מוסיף אוטומטית 4 מטבעות-בסיס קבועים לארנק אם עוד לא קיימים בו (בלי
  // לגעת ביתרות/בהיסטוריה של מטבעות אחרים): המטבע המקומי של יעד הטיול,
  // דולר, אירו ושקל — תמיד זמינים מראש, גם עם יתרת-אפס, כדי שלא יהיה
  // צריך "להוסיף מטבע" ידנית לכל אחד מהם. עדיין ניתן להסיר כל אחד מהם
  // בנפרד דרך מסך פרטי-המטבע, לפי בקשה מפורשת — זו רק ברירת-מחדל.
  useEffect(() => {
    if (!hydrated) return;
    const baseline = defaultCurrencyPriority(localCurrency.currencyCode);
    setBalances((prev) => {
      const missing = baseline.filter((code) => !prev.some((b) => b.code === code));
      if (missing.length === 0) return prev;
      return [...prev, ...missing.map((code) => ({ code, balance: 0, spent: 0, lastUpdated: today() }))];
    });
  }, [localCurrency.currencyCode, hydrated]);

  // מיקום עוזר ה-AI במסך הארנק בלבד: הפינה השמאלית העליונה (אזור פנוי
  // בכותרת), כדי שלא יכסה את כרטיס "פעילות אחרונה" בתחתית התצוגה.
  useEffect(() => {
    const btn = document.querySelector<HTMLButtonElement>('button[aria-label="עוזר AI"]');
    if (!btn) return;
    const original = btn.getAttribute("style");
    btn.style.width = "40px";
    btn.style.height = "40px";
    btn.style.bottom = "auto";
    btn.style.insetInlineStart = "auto";
    btn.style.insetInlineEnd = "16px";
    btn.style.top = "14px";
    return () => {
      if (original) btn.setAttribute("style", original);
      else btn.removeAttribute("style");
    };
  }, []);

  // ---------- עזרי-מטבע ----------
  function rateToILS(code: string): number | null {
    if (code === "ILS") return 1;
    return rates.data?.ratesToILS[code] ?? null;
  }
  function convert(amount: number, from: string, to: string): number | null {
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

  // ---------- פעולות: הוספת/הפחתת כסף ----------
  function handleAddMoney(currency: string, amount: number, source: MoneySource, date: string, note: string) {
    adjustBalance(currency, amount);
    setAdditions((prev) => [{ id: nextId("add"), currency, amount, source, date, note: note || undefined }, ...prev]);
    setDialog(null);
    showToast(`נוספו ${formatMoney(amount, currency)} ליתרת ${currencyMeta(currency).name}`);
  }
  function handleReduceMoney(currency: string, amount: number, note: string) {
    const bal = balanceOf(currency);
    if (amount > bal.balance) {
      showToast("הסכום גדול מהיתרה הזמינה — הפעולה בוטלה");
      return;
    }
    adjustBalance(currency, -amount);
    setAdditions((prev) => [{ id: nextId("red"), currency, amount: -amount, source: "other", date: today(), note: note || "הפחתה ידנית" }, ...prev]);
    setDialog(null);
    showToast(`הופחתו ${formatMoney(amount, currency)} מיתרת ${currencyMeta(currency).name}`);
  }

  // ---------- פעולות: המרת מטבע לפי סכום שהתקבל בפועל (לא שער האינטרנט) ----------
  function handleConvert(fromCcy: string, fromAmount: number, toCcy: string, toAmount: number, fee: number, location: string, dateTime: string) {
    const bal = balanceOf(fromCcy);
    if (fromAmount > bal.balance) {
      showToast("היתרה במטבע המקור אינה מספיקה — ההמרה בוטלה");
      return;
    }
    const marketRate = convert(1, fromCcy, toCcy);
    adjustBalance(fromCcy, -fromAmount);
    adjustBalance(toCcy, toAmount);
    setConversions((prev) => [
      { id: nextId("cnv"), fromCurrency: fromCcy, fromAmount, toCurrency: toCcy, toAmount, fee: fee || undefined, location: location || undefined, dateTime, effectiveRate: toAmount / fromAmount, marketRateAtTime: marketRate ?? undefined },
      ...prev,
    ]);
    setDialog(null);
    showToast(`הומרו ${formatMoney(fromAmount, fromCcy)} ל-${formatMoney(toAmount, toCcy)}`);
  }

  // ---------- פעולות: הוצאות ----------
  function handleDeleteExpense(id: string) {
    const idx = expenses.findIndex((e) => e.id === id);
    const tx = expenses[idx]!;
    if (!confirm(`למחוק את ההוצאה "${tx.title}"?`)) return;
    pendingDeleteExpense.current = { tx, index: idx };
    setExpenses((prev) => prev.filter((e) => e.id !== id));
    if (tx.paymentMethod !== "credit") adjustBalance(tx.currency, tx.amount, -tx.amount);
    else setBalances((prev) => prev.map((b) => (b.code === tx.currency ? { ...b, spent: Math.max(0, b.spent - tx.amount) } : b)));
    setDialog(null);
    setMenuForExpense(null);
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

  // ---------- פעולות: כרטיסי אשראי ----------
  function handleSaveCard(card: Omit<CreditCardInfo, "id">, existingId?: string) {
    if (existingId) {
      setCards((prev) => prev.map((c) => (c.id === existingId ? { ...c, ...card, isPrimary: card.isPrimary ? true : c.isPrimary } : card.isPrimary ? { ...c, isPrimary: false } : c)));
    } else {
      setCards((prev) => (card.isPrimary ? [...prev.map((c) => ({ ...c, isPrimary: false })), { id: nextId("card"), ...card }] : [...prev, { id: nextId("card"), ...card }]));
    }
    setDialog(null);
    showToast(existingId ? "הכרטיס עודכן" : "כרטיס האשראי נוסף");
  }
  function handleSetPrimaryCard(id: string) {
    setCards((prev) => prev.map((c) => ({ ...c, isPrimary: c.id === id })));
    setMenuForCard(null);
    showToast("הכרטיס הוגדר כראשי");
  }
  function handleDeleteCard(id: string) {
    const idx = cards.findIndex((c) => c.id === id);
    const card = cards[idx]!;
    if (!confirm(`למחוק את הכרטיס "${card.nickname}"?`)) return;
    pendingDeleteCard.current = { card, index: idx };
    setCards((prev) => prev.filter((c) => c.id !== id));
    setMenuForCard(null);
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

  // ---------- סיכומים ----------
  const totalConvertedToBase = useMemo(() => {
    let sum = 0;
    let allResolved = true;
    for (const b of balances) {
      const v = convert(b.balance, b.code, baseCurrency);
      if (v == null) {
        allResolved = false;
        continue;
      }
      sum += v;
    }
    return allResolved ? sum : null;
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [balances, baseCurrency, rates]);

  const cashExpenseTotal = expenses.filter((e) => e.paymentMethod !== "credit").reduce((s, e) => s + (convert(e.amount, e.currency, baseCurrency) ?? 0), 0);
  const creditExpenseTotal = expenses.filter((e) => e.paymentMethod === "credit").reduce((s, e) => s + (convert(e.amount, e.currency, baseCurrency) ?? 0), 0);
  const totalExpenseAll = cashExpenseTotal + creditExpenseTotal;

  const spentToday = expenses.filter((e) => e.date === today()).reduce((s, e) => s + (convert(e.amount, e.currency, baseCurrency) ?? 0), 0);
  const DAILY_BUDGET_BASE = 800;
  const remainingToday = Math.max(0, DAILY_BUDGET_BASE - spentToday);
  const tripDaysSoFar = new Set(expenses.map((e) => e.date)).size || 1;
  const avgDaily = totalExpenseAll / tripDaysSoFar;
  const TRIP_TOTAL_DAYS = 48;
  const forecastTotal = avgDaily * TRIP_TOTAL_DAYS;

  const filteredExpenses = paymentFilter === "all" ? expenses : expenses.filter((e) => e.paymentMethod === paymentFilter);
  const menuExpense = expenses.find((e) => e.id === menuForExpense) ?? null;
  const editingCard = dialog?.type === "editCard" ? cards.find((c) => c.id === dialog.id) ?? null : null;
  const menuCard = cards.find((c) => c.id === menuForCard) ?? null;

  const localBalance = balanceOf(localCurrency.currencyCode);
  const currencyPriorityRank = new Map(defaultCurrencyPriority(localCurrency.currencyCode).map((code, i) => [code, i]));
  const secondaryBalances = balances
    .filter((b) => b.code !== localCurrency.currencyCode)
    .sort((a, b) => {
      const ra = currencyPriorityRank.has(a.code) ? currencyPriorityRank.get(a.code)! : Infinity;
      const rb = currencyPriorityRank.has(b.code) ? currencyPriorityRank.get(b.code)! : Infinity;
      if (ra !== rb) return ra - rb;
      return a.code.localeCompare(b.code);
    });
  const detailCurrency = dialog?.type === "currencyDetail" || dialog?.type === "history" ? dialog.currency : null;

  return (
    <ScreenShell>
      <ScreenHeader title="הארנק שלי" subtitle="[דמו] כל מטבעות הטיול" />

      {/* טאבים */}
      <div style={{ display: "flex", gap: "4px", background: "rgba(255,255,255,0.04)", borderRadius: "12px", padding: "3px" }}>
        {TABS.map((t) => (
          <button
            key={t.key}
            type="button"
            onClick={() => setTab(t.key)}
            style={{ flex: 1, padding: "8px 2px", borderRadius: "9px", fontSize: "11.5px", fontWeight: 700, whiteSpace: "nowrap", cursor: "pointer", background: tab === t.key ? COLOR.purple : "transparent", color: "#fff", border: "none" }}
          >
            {t.label}
          </button>
        ))}
      </div>

      {tab === "overview" ? (
        <>
          {/* כרטיס מטבע מקומי */}
          <Card style={{ border: `1px solid ${COLOR.purple}55`, background: "linear-gradient(160deg, rgba(102,66,185,0.22), #0a1830)" }}>
            <div style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between", marginBottom: "8px" }}>
              <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
                {localCurrency.countryCode ? <FlagIcon countryCode={localCurrency.countryCode} size={26} /> : null}
                <div>
                  <div style={{ display: "flex", alignItems: "center", gap: "6px" }}>
                    <span style={{ fontSize: "14px", fontWeight: 800, color: "#fff" }}>{currencyMeta(localCurrency.currencyCode).name}</span>
                    <span style={{ fontSize: "9px", fontWeight: 800, color: "#c9b3ff", background: "rgba(138,90,223,0.22)", border: `1px solid ${COLOR.purple}55`, borderRadius: "999px", padding: "2px 7px" }}>המטבע המקומי</span>
                  </div>
                  <div style={{ fontSize: "10px", color: COLOR.textMuted, marginTop: "1px" }}>{localCurrency.sourceLabel}</div>
                </div>
              </div>
              <div style={{ display: "flex", flexDirection: "column", alignItems: "flex-end", gap: "4px" }}>
                <button type="button" onClick={() => openDialog({ type: "changeCountry" })} style={{ background: "none", border: "none", color: COLOR.textSecondary, fontSize: "11px", fontWeight: 700, cursor: "pointer", textDecoration: "underline" }}>
                  שינוי מדינה
                </button>
                {manualCountryCode ? (
                  <button type="button" onClick={() => setManualCountryCode(null)} style={{ background: "none", border: "none", color: COLOR.textMuted, fontSize: "10px", cursor: "pointer" }}>
                    איפוס לזיהוי אוטומטי
                  </button>
                ) : null}
              </div>
            </div>
            <button type="button" onClick={() => router.push("/wallet/add")} style={{ display: "block", width: "100%", textAlign: "start", background: "none", border: "none", padding: 0, cursor: "pointer", marginBottom: "10px" }}>
              <div style={{ fontSize: "26px", fontWeight: 800, color: localBalance.balance < 0 ? COLOR.danger : COLOR.turquoise, fontVariantNumeric: "tabular-nums" }}>{formatMoney(localBalance.balance, localCurrency.currencyCode)}</div>
              <div style={{ fontSize: "11px", color: localBalance.balance < 0 ? COLOR.danger : COLOR.textSecondary }}>{localBalance.balance < 0 ? "יתרה שלילית" : "יתרה זמינה"} · נוצל: {formatMoney(localBalance.spent, localCurrency.currencyCode)}</div>
            </button>
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr 1fr", gap: "6px" }}>
              <button type="button" onClick={() => router.push("/wallet/add")} style={miniActionBtn(COLOR.success)}>
                הוספת כסף
              </button>
              <button type="button" onClick={() => openDialog({ type: "reduceMoney", currency: localCurrency.currencyCode })} style={miniActionBtn(COLOR.danger)}>
                הפחתה
              </button>
              <button type="button" onClick={() => router.push("/wallet/convert")} style={miniActionBtn(COLOR.purple)}>
                המרה
              </button>
              <button type="button" onClick={() => router.push("/wallet/history")} style={miniActionBtn(COLOR.textSecondary)}>
                היסטוריה
              </button>
            </div>
          </Card>

          {/* מטבעות נוספים — כרטיסי-מיני קומפקטיים */}
          <div>
            <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: "6px" }}>
              <span style={{ fontSize: "12.5px", fontWeight: 800, color: COLOR.textSecondary }}>מטבעות נוספים</span>
              <button type="button" onClick={() => openDialog({ type: "addCurrency" })} style={{ padding: "4px 10px", borderRadius: "999px", background: "rgba(138,90,223,0.18)", border: `1px solid ${COLOR.purple}55`, color: "#c9b3ff", fontSize: "10.5px", fontWeight: 700, cursor: "pointer" }}>
                + הוספת מטבע
              </button>
            </div>
            <div style={{ display: "grid", gridTemplateColumns: `repeat(${Math.min(3, Math.max(1, secondaryBalances.length))}, 1fr)`, gap: "6px" }}>
              {secondaryBalances.length === 0 ? (
                <div style={{ gridColumn: "1 / -1", fontSize: "11.5px", color: COLOR.textMuted, padding: "8px 2px" }}>אין עדיין מטבעות נוספים בארנק</div>
              ) : (
                secondaryBalances.map((b) => {
                  const country = primaryCountryForCurrency(b.code);
                  return (
                    <button key={b.code} type="button" onClick={() => router.push(`/wallet/currency/${b.code}`)} style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: "3px", padding: "9px 4px", borderRadius: "12px", background: COLOR.cardBg, border: `1px solid ${COLOR.cardBorder}`, cursor: "pointer" }}>
                      {country ? <FlagIcon countryCode={country.code} size={20} /> : <span>{currencyMeta(b.code).symbol}</span>}
                      <span style={{ fontSize: "10px", fontWeight: 700, color: COLOR.textSecondary }}>{b.code}</span>
                      <span style={{ fontSize: "12px", fontWeight: 800, color: b.balance < 0 ? COLOR.danger : "#fff" }}>{formatMoney(b.balance, b.code)}</span>
                    </button>
                  );
                })
              )}
            </div>
          </div>

          {/* פעולות מהירות */}
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr 1fr 1fr", gap: "6px" }}>
            <QuickAction label="הוצאה" onClick={() => router.push("/wallet/expense/new")} />
            <QuickAction label="כסף" onClick={() => router.push("/wallet/add")} />
            <QuickAction label="המרה" onClick={() => router.push("/wallet/convert")} />
            <QuickAction label="קבלה" icon={<CameraIcon size={16} />} onClick={() => router.push("/wallet/expense/new?autoCamera=1")} />
            <QuickAction label="פיקדון" onClick={() => router.push("/wallet/deposits")} />
          </div>

          {/* סיכום יומי קומפקטי */}
          <Card>
            <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: "8px" }}>
              <span style={{ fontSize: "13px", fontWeight: 800, color: "#fff" }}>סיכום יומי</span>
              <select value={baseCurrency} onChange={(e) => setBaseCurrency(e.target.value)} style={{ padding: "4px 6px", borderRadius: "8px", background: "#0e1930", border: `1px solid ${COLOR.cardBorder}`, color: "#fff", fontSize: "10.5px" }}>
                {CURRENCY_CATALOG.map((c) => (
                  <option key={c.code} value={c.code}>
                    בסיס: {c.code}
                  </option>
                ))}
              </select>
            </div>
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: "6px" }}>
              {[
                { label: "הוצא היום", value: formatMoney(spentToday, baseCurrency) },
                { label: "נותר היום", value: formatMoney(remainingToday, baseCurrency) },
                { label: "ממוצע יומי", value: formatMoney(avgDaily, baseCurrency) },
              ].map((row) => (
                <div key={row.label} style={{ background: "#0e1930", border: `1px solid ${COLOR.cardBorder}`, borderRadius: "10px", padding: "6px" }}>
                  <div style={{ fontSize: "9px", color: COLOR.textMuted }}>{row.label}</div>
                  <div style={{ fontSize: "12px", fontWeight: 800, color: "#fff", marginTop: "1px" }}>{row.value}</div>
                </div>
              ))}
            </div>
            <button type="button" onClick={() => setSummaryExpanded((v) => !v)} style={{ marginTop: "8px", background: "none", border: "none", color: COLOR.purple, fontSize: "11px", fontWeight: 700, cursor: "pointer", padding: 0 }}>
              {summaryExpanded ? "הסתרת פרטים נוספים ▲" : "פרטים נוספים ▼"}
            </button>
            {summaryExpanded ? (
              <div style={{ marginTop: "8px" }}>
                <div style={{ background: "rgba(138,90,223,0.12)", border: `1px solid ${COLOR.purple}40`, borderRadius: "10px", padding: "8px", fontSize: "11.5px", color: "#c9b3ff", marginBottom: "8px" }}>
                  תחזית לסוף הטיול (48 ימים): <strong>{formatMoney(forecastTotal, baseCurrency)}</strong>
                </div>
                <div style={{ display: "flex", justifyContent: "space-between", fontSize: "11.5px", color: COLOR.textSecondary, marginBottom: "6px" }}>
                  <span>
                    מזומן/חיוב: <strong style={{ color: "#fff" }}>{formatMoney(cashExpenseTotal, baseCurrency)}</strong>
                  </span>
                  <span>
                    אשראי: <strong style={{ color: "#fff" }}>{formatMoney(creditExpenseTotal, baseCurrency)}</strong>
                  </span>
                </div>
                <div style={{ fontSize: "11px", color: COLOR.textMuted }}>סך כל היתרות (כל המטבעות ממוירים ל-{currencyMeta(baseCurrency).name}): {totalConvertedToBase != null ? formatMoney(totalConvertedToBase, baseCurrency) : "טוען שער..."}</div>
                <button type="button" onClick={() => router.push("/wallet/reports")} style={{ marginTop: "8px", background: "none", border: "none", color: COLOR.purple, fontSize: "11px", fontWeight: 700, cursor: "pointer", padding: 0 }}>
                  לדוח התקציב המלא ←
                </button>
              </div>
            ) : null}
          </Card>

          {/* התחלת פעילות אחרונה */}
          <div>
            <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: "6px" }}>
              <span style={{ fontSize: "12.5px", fontWeight: 800, color: COLOR.textSecondary }}>פעילות אחרונה</span>
              <button type="button" onClick={() => setTab("activity")} style={{ background: "none", border: "none", color: COLOR.purple, fontSize: "11px", fontWeight: 700, cursor: "pointer" }}>
                לכל ההוצאות ←
              </button>
            </div>
            {expenses.length === 0 ? (
              <div style={{ fontSize: "11.5px", color: COLOR.textMuted, padding: "4px 2px" }}>אין עדיין הוצאות</div>
            ) : (
              <div style={{ display: "flex", flexDirection: "column", gap: "6px" }}>
                {expenses.slice(0, 2).map((t) => (
                  <Card key={t.id} style={{ display: "flex", alignItems: "center", justifyContent: "space-between", padding: "10px 12px" }}>
                    <span style={{ fontSize: "12.5px", fontWeight: 700, color: "#fff" }}>{t.title}</span>
                    <span style={{ fontSize: "12.5px", fontWeight: 800, color: "#fff" }}>{formatMoney(t.amount, t.currency)}</span>
                  </Card>
                ))}
              </div>
            )}
          </div>
        </>
      ) : null}

      {tab === "activity" ? (
        <>
          <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
            <span style={{ fontSize: "14px", fontWeight: 800, color: "#fff" }}>הוצאות</span>
            <button type="button" onClick={() => router.push("/wallet/expense/new")} style={{ display: "flex", alignItems: "center", gap: "6px", padding: "7px 13px", borderRadius: "999px", background: "rgba(138,90,223,0.18)", border: `1px solid ${COLOR.purple}55`, color: "#c9b3ff", fontSize: "12px", fontWeight: 700, cursor: "pointer" }}>
              + הוספת הוצאה
            </button>
          </div>
          <div style={{ display: "flex", gap: "6px", overflowX: "auto" }}>
            {(["all", "cash", "credit", "debit", "transfer", "digital_wallet", "other"] as const).map((pm) => (
              <button
                key={pm}
                type="button"
                onClick={() => setPaymentFilter(pm)}
                style={{ padding: "6px 12px", borderRadius: "999px", fontSize: "11px", fontWeight: 700, whiteSpace: "nowrap", cursor: "pointer", background: paymentFilter === pm ? COLOR.purple : "#12213f", border: `1px solid ${paymentFilter === pm ? COLOR.purple : COLOR.cardBorder}`, color: "#fff" }}
              >
                {pm === "all" ? "הכול" : PAYMENT_METHOD_LABEL[pm]}
              </button>
            ))}
          </div>
          <div style={{ display: "flex", flexDirection: "column", gap: "8px" }}>
            {filteredExpenses.length === 0 ? (
              <div style={{ fontSize: "12.5px", color: COLOR.textSecondary, padding: "6px 2px" }}>אין הוצאות תואמות</div>
            ) : (
              filteredExpenses.map((t) => {
                const card = cards.find((c) => c.id === t.cardId);
                const catColor = categoryColor(t.category, CATEGORY_COLOR);
                return (
                  <Card key={t.id} onClick={() => router.push(`/wallet/expense/new?edit=${t.id}`)} style={{ display: "flex", alignItems: "center", gap: "10px", padding: "12px", cursor: "pointer" }}>
                    <span aria-hidden style={{ width: "36px", height: "36px", borderRadius: "10px", background: `${catColor}22`, border: `1px solid ${catColor}55`, display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0, position: "relative" }}>
                      {t.receiptId && receipts[t.receiptId] ? (
                        <button
                          type="button"
                          onClick={(e) => {
                            e.stopPropagation();
                            setViewingReceiptId(t.receiptId!);
                          }}
                          aria-label="הצגת הקבלה"
                          style={{ position: "absolute", inset: 0, borderRadius: "10px", overflow: "hidden", border: "none", padding: 0, cursor: "pointer" }}
                        >
                          <img src={receipts[t.receiptId]} alt="קבלה" style={{ width: "100%", height: "100%", objectFit: "cover" }} />
                        </button>
                      ) : (
                        <IconSlot size={18} />
                      )}
                    </span>
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <div style={{ fontSize: "13.5px", fontWeight: 700, color: "#fff" }}>{t.title}</div>
                      <div style={{ fontSize: "11px", color: COLOR.textSecondary, marginTop: "1px" }}>
                        {t.category} · {t.date} · {PAYMENT_METHOD_LABEL[t.paymentMethod]}
                        {card ? ` (${card.nickname})` : ""}
                      </div>
                    </div>
                    <div style={{ fontSize: "14px", fontWeight: 800, color: "#fff", whiteSpace: "nowrap" }}>{formatMoney(t.amount, t.currency)}</div>
                    <button
                      type="button"
                      onClick={(e) => {
                        e.stopPropagation();
                        setMenuForExpense(t.id);
                      }}
                      aria-label={`פעולות עבור ${t.title}`}
                      style={{ width: "32px", height: "32px", borderRadius: "9px", background: "rgba(255,255,255,0.06)", border: `1px solid ${COLOR.cardBorder}`, color: "#fff", display: "flex", alignItems: "center", justifyContent: "center", cursor: "pointer", flexShrink: 0 }}
                    >
                      <DotsIcon size={14} />
                    </button>
                  </Card>
                );
              })
            )}
          </div>
        </>
      ) : null}

      {tab === "rates" ? <ExchangeRatesSection rates={rates} localCurrency={localCurrency.currencyCode} /> : null}

      {tab === "cards" ? (
        <>
          <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
            <span style={{ fontSize: "14px", fontWeight: 800, color: "#fff" }}>כרטיסי אשראי</span>
            <button type="button" onClick={() => openDialog({ type: "addCard" })} style={{ padding: "6px 12px", borderRadius: "999px", background: "rgba(138,90,223,0.18)", border: `1px solid ${COLOR.purple}55`, color: "#c9b3ff", fontSize: "11.5px", fontWeight: 700, cursor: "pointer" }}>
              + הוספת כרטיס
            </button>
          </div>
          <button type="button" onClick={() => router.push("/wallet/cards")} style={{ background: "none", border: "none", color: COLOR.purple, fontSize: "11px", fontWeight: 700, cursor: "pointer", padding: 0, textAlign: "start" }}>
            מסך ניהול כרטיסים מלא ←
          </button>
          {cards.length === 0 ? (
            <div style={{ fontSize: "12.5px", color: COLOR.textSecondary, padding: "6px 2px" }}>לא נוספו כרטיסי אשראי</div>
          ) : (
            <div style={{ display: "flex", flexDirection: "column", gap: "8px" }}>
              {cards.map((c) => (
                <Card key={c.id} style={{ display: "flex", alignItems: "center", gap: "10px" }}>
                  <div onClick={() => router.push(`/wallet/cards/${c.id}`)} style={{ display: "flex", alignItems: "center", gap: "10px", flex: 1, minWidth: 0, cursor: "pointer" }}>
                    <span aria-hidden style={{ width: "40px", height: "26px", borderRadius: "5px", background: c.color, flexShrink: 0 }} />
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <div style={{ fontSize: "13.5px", fontWeight: 700, color: "#fff", display: "flex", alignItems: "center", gap: "6px" }}>
                        {c.nickname}
                        {c.isPrimary ? <span style={{ fontSize: "9px", fontWeight: 800, color: COLOR.success, background: "rgba(67,214,170,0.14)", border: `1px solid ${COLOR.success}40`, borderRadius: "999px", padding: "1px 6px" }}>ראשי</span> : null}
                      </div>
                      <div style={{ fontSize: "11px", color: COLOR.textSecondary }}>
                        {c.issuer} · •••• {c.last4} · {c.currency}
                        {c.feePercent ? ` · עמלה ${c.feePercent}%` : ""}
                      </div>
                    </div>
                  </div>
                  <button type="button" onClick={() => setMenuForCard(c.id)} aria-label={`פעולות עבור ${c.nickname}`} style={{ width: "32px", height: "32px", borderRadius: "9px", background: "rgba(255,255,255,0.06)", border: `1px solid ${COLOR.cardBorder}`, color: "#fff", display: "flex", alignItems: "center", justifyContent: "center", cursor: "pointer", flexShrink: 0 }}>
                    <DotsIcon size={14} />
                  </button>
                </Card>
              ))}
            </div>
          )}
        </>
      ) : null}

      {tab === "history" ? <AllHistoryList expenses={expenses} additions={additions} conversions={conversions} /> : null}

      <BottomNav active="wallet" />

      <ToastView toast={toast} />

      {menuExpense ? (
        <Sheet title={menuExpense.title} onClose={() => setMenuForExpense(null)}>
          <ActionRow label="עריכת ההוצאה" onClick={() => { setMenuForExpense(null); router.push(`/wallet/expense/new?edit=${menuExpense.id}`); }} />
          <ActionRow label="מחיקת ההוצאה" danger onClick={() => handleDeleteExpense(menuExpense.id)} />
        </Sheet>
      ) : null}

      {menuCard ? (
        <Sheet title={menuCard.nickname} onClose={() => setMenuForCard(null)}>
          <ActionRow label="עריכת הכרטיס" onClick={() => openDialog({ type: "editCard", id: menuCard.id })} />
          {!menuCard.isPrimary ? <ActionRow label="הפיכה לכרטיס ראשי" onClick={() => handleSetPrimaryCard(menuCard.id)} /> : null}
          <ActionRow label="מחיקת הכרטיס" danger onClick={() => handleDeleteCard(menuCard.id)} />
        </Sheet>
      ) : null}

      {viewingReceiptId && receipts[viewingReceiptId] ? (
        <Sheet title="הקבלה" onClose={() => setViewingReceiptId(null)}>
          <img src={receipts[viewingReceiptId]} alt="קבלה" style={{ width: "100%", borderRadius: "12px" }} />
        </Sheet>
      ) : null}

      {dialog?.type === "addMoney" ? <AddMoneyForm currency={dialog.currency} balances={balances} onClose={() => setDialog(null)} onSave={handleAddMoney} /> : null}
      {dialog?.type === "reduceMoney" ? <ReduceMoneyForm currency={dialog.currency} balance={balanceOf(dialog.currency).balance} onClose={() => setDialog(null)} onSave={handleReduceMoney} /> : null}
      {(dialog?.type === "history" || dialog?.type === "currencyDetail") && detailCurrency ? (
        dialog.type === "history" ? (
          <HistorySheet currency={detailCurrency} expenses={expenses} additions={additions} conversions={conversions} onClose={() => setDialog(null)} />
        ) : (
          <CurrencyDetailSheet
            currency={detailCurrency}
            balance={balanceOf(detailCurrency)}
            onClose={() => setDialog(null)}
            onAddMoney={() => openDialog({ type: "addMoney", currency: detailCurrency })}
            onReduceMoney={() => openDialog({ type: "reduceMoney", currency: detailCurrency })}
            onConvert={() => openDialog({ type: "convert", from: detailCurrency })}
            onHistory={() => openDialog({ type: "history", currency: detailCurrency })}
          />
        )
      ) : null}
      {dialog?.type === "convert" ? <ConvertForm balances={balances} rates={rates} defaultFrom={dialog.from} onClose={() => setDialog(null)} onSave={handleConvert} /> : null}
      {dialog?.type === "addCurrency" ? (
        <AddCurrencySheet
          existingCodes={balances.map((b) => b.code)}
          onClose={() => setDialog(null)}
          onAdd={(code) => {
            setBalances((prev) => (prev.some((b) => b.code === code) ? prev : [...prev, { code, balance: 0, spent: 0, lastUpdated: today() }]));
            setDialog(null);
            showToast(`נוסף מטבע ${currencyMeta(code).name}`);
          }}
        />
      ) : null}
      {dialog?.type === "changeCountry" ? (
        <CountryPickerSheet
          onClose={() => setDialog(null)}
          onSelect={(c) => {
            setManualCountryCode(c.code);
            setDialog(null);
            showToast(`המטבע המקומי הוגדר ל-${currencyMeta(c.currencyCodes[0]!).name} (${c.nameHe})`);
          }}
        />
      ) : null}
      {dialog?.type === "addCard" || dialog?.type === "editCard" ? <AddCardForm initial={editingCard} onClose={() => setDialog(null)} onSave={(card) => handleSaveCard(card, editingCard?.id)} /> : null}
    </ScreenShell>
  );
}

function miniActionBtn(color: string): React.CSSProperties {
  return { padding: "8px 4px", borderRadius: "10px", background: `${color}22`, border: `1px solid ${color}55`, color, fontSize: "10.5px", fontWeight: 700, cursor: "pointer" };
}

function QuickAction({ label, icon, onClick }: { label: string; icon?: React.ReactNode; onClick: () => void }) {
  return (
    <button type="button" onClick={onClick} style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: "4px", padding: "10px 4px", borderRadius: "12px", background: COLOR.cardBg, border: `1px solid ${COLOR.cardBorder}`, color: "#fff", fontSize: "10.5px", fontWeight: 700, cursor: "pointer" }}>
      {icon ?? <IconSlot size={16} />}
      {label}
    </button>
  );
}

// ============================== כרטיס-מטבע-מיני — פרטים מלאים ==============================

function CurrencyDetailSheet({
  currency,
  balance,
  onClose,
  onAddMoney,
  onReduceMoney,
  onConvert,
  onHistory,
}: {
  currency: string;
  balance: CurrencyBalance;
  onClose: () => void;
  onAddMoney: () => void;
  onReduceMoney: () => void;
  onConvert: () => void;
  onHistory: () => void;
}) {
  const meta = currencyMeta(currency);
  const country = primaryCountryForCurrency(currency);
  return (
    <Sheet title={`${meta.name} · ${meta.code}`} onClose={onClose}>
      <div style={{ display: "flex", alignItems: "center", gap: "10px", marginBottom: "12px" }}>
        {country ? <FlagIcon countryCode={country.code} size={30} /> : null}
        <div>
          <div style={{ fontSize: "24px", fontWeight: 800, color: balance.balance < 0 ? COLOR.danger : COLOR.turquoise }}>{formatMoney(balance.balance, currency)}</div>
          <div style={{ fontSize: "11px", color: COLOR.textSecondary }}>נוצל: {formatMoney(balance.spent, currency)} · עדכון אחרון: {balance.lastUpdated}</div>
        </div>
      </div>
      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr 1fr", gap: "6px" }}>
        <button type="button" onClick={onAddMoney} style={miniActionBtn(COLOR.success)}>
          הוספת כסף
        </button>
        <button type="button" onClick={onReduceMoney} style={miniActionBtn(COLOR.danger)}>
          הפחתה
        </button>
        <button type="button" onClick={onConvert} style={miniActionBtn(COLOR.purple)}>
          המרה
        </button>
        <button type="button" onClick={onHistory} style={miniActionBtn(COLOR.textSecondary)}>
          היסטוריה
        </button>
      </div>
    </Sheet>
  );
}

// ============================== היסטוריה מלאה (כל המטבעות) ==============================

function AllHistoryList({ expenses, additions, conversions }: { expenses: Expense[]; additions: MoneyAddition[]; conversions: ConversionRecord[] }) {
  const router = useRouter();
  type Row = { sortKey: string; displayDate: string; label: string; amountLabel: string; color: string; currency: string; ltr?: boolean; href?: string };
  const rows: Row[] = [];
  for (const e of expenses)
    rows.push({
      sortKey: `${e.date}T${e.time ?? "00:00"}`,
      displayDate: e.time ? `${e.date} · ${e.time}` : e.date,
      label: `הוצאה: ${e.title}`,
      amountLabel: `-${formatMoney(e.amount, e.currency)}`,
      color: COLOR.danger,
      currency: e.currency,
      href: `/wallet/expense/new?edit=${e.id}`,
    });
  for (const a of additions)
    rows.push({
      sortKey: `${a.date}T00:00`,
      displayDate: a.date,
      label: a.amount >= 0 ? `הוספה: ${MONEY_SOURCE_LABEL[a.source]}` : `הפחתה: ${a.note ?? ""}`,
      amountLabel: `${a.amount >= 0 ? "+" : ""}${formatMoney(a.amount, a.currency)}`,
      color: a.amount >= 0 ? COLOR.success : COLOR.danger,
      currency: a.currency,
    });
  // תוכן ה"המרה" (קודי-מטבע + חץ) הוא איי-לנד LTR בתוך עמוד RTL — בלי לאלץ
  // כיוון-תצוגה מפורש, אלגוריתם ה-bidi הופך את סדר האסימונים הניטרליים
  // (כמו "€ 100 ← ฿ 3,000" שהופך ל-"3,000 ฿ → 100 €" חזותית) — אותה
  // משפחת-באג בדיוק כמו היפוך "MASTER TRIP"/"TRIP MASTER" שתוקן קודם.
  for (const c of conversions)
    rows.push({
      sortKey: c.dateTime,
      displayDate: c.dateTime.includes("T") ? c.dateTime.replace("T", " · ").slice(0, 16) : c.dateTime,
      label: `המרה: ${c.fromCurrency} → ${c.toCurrency}`,
      amountLabel: `${formatMoney(c.fromAmount, c.fromCurrency)} → ${formatMoney(c.toAmount, c.toCurrency)}`,
      color: COLOR.warning,
      currency: c.toCurrency,
      ltr: true,
      href: `/wallet/convert?edit=${c.id}`,
    });
  rows.sort((a, b) => (a.sortKey < b.sortKey ? 1 : -1));

  return (
    <>
      <span style={{ fontSize: "14px", fontWeight: 800, color: "#fff" }}>היסטוריה — כל הפעולות</span>
      {rows.length === 0 ? (
        <div style={{ fontSize: "12.5px", color: COLOR.textSecondary, padding: "6px 2px" }}>אין עדיין פעולות</div>
      ) : (
        <div style={{ display: "flex", flexDirection: "column", gap: "8px" }}>
          {rows.map((r, i) => {
            const country = primaryCountryForCurrency(r.currency);
            return (
              <Card key={i} onClick={r.href ? () => router.push(r.href!) : undefined} style={{ display: "flex", alignItems: "center", gap: "10px", cursor: r.href ? "pointer" : undefined }}>
                {country ? <FlagIcon countryCode={country.code} size={20} /> : null}
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ fontSize: "13px", fontWeight: 700, color: "#fff", direction: r.ltr ? "ltr" : undefined, textAlign: r.ltr ? "right" : undefined }}>{r.label}</div>
                  <div style={{ fontSize: "10.5px", color: COLOR.textMuted }}>{r.displayDate}</div>
                </div>
                <div style={{ fontSize: "13px", fontWeight: 800, color: r.color, whiteSpace: "nowrap", direction: r.ltr ? "ltr" : undefined }}>{r.amountLabel}</div>
              </Card>
            );
          })}
        </div>
      )}
    </>
  );
}

// ============================== שערי מטבעות (מכוונים דינמית למטבע המקומי) ==============================

function ExchangeRatesSection({ rates, localCurrency }: { rates: { status: "loading" | "success" | "error"; data: DemoCurrencyResult | null }; localCurrency: string }) {
  const fixedCandidates = (["USD", "EUR", "ILS"] as const).filter((c) => c !== localCurrency);
  const [tab, setTab] = useState<string>(fixedCandidates[0] ?? "custom");
  const [amount, setAmount] = useState("100");
  const [from, setFrom] = useState(localCurrency);
  const [to, setTo] = useState<string>(fixedCandidates[0] ?? "USD");

  function rateToLocal(code: string): number | null {
    if (rates.status !== "success" || !rates.data) return null;
    const local = localCurrency === "ILS" ? 1 : rates.data.ratesToILS[localCurrency];
    const x = code === "ILS" ? 1 : rates.data.ratesToILS[code];
    if (!local || !x) return null;
    return x / local;
  }
  function convertPair(amt: number, f: string, t: string): number | null {
    if (rates.status !== "success" || !rates.data) return null;
    const fr = f === "ILS" ? 1 : rates.data.ratesToILS[f];
    const tr = t === "ILS" ? 1 : rates.data.ratesToILS[t];
    if (!fr || !tr) return null;
    return (amt * fr) / tr;
  }
  const localMeta = currencyMeta(localCurrency);

  return (
    <Card>
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: "10px" }}>
        <span style={{ fontWeight: 800, fontSize: "14px" }}>שערי מטבעות</span>
        {rates.status === "success" ? (
          <span style={{ fontSize: "9.5px", fontWeight: 700, color: COLOR.success, background: "rgba(67,214,170,0.14)", border: `1px solid ${COLOR.success}40`, borderRadius: "999px", padding: "2px 7px" }}>שער חי</span>
        ) : rates.status === "loading" ? (
          <span style={{ fontSize: "9.5px", fontWeight: 700, color: COLOR.textSecondary }}>טוען...</span>
        ) : (
          <span style={{ fontSize: "9.5px", fontWeight: 700, color: COLOR.warning }}>נתוני הדגמה</span>
        )}
      </div>
      <div style={{ fontSize: "10.5px", color: COLOR.textMuted, marginBottom: "10px" }}>שער-מידע להשוואה בלבד — אינו קובע את הסכום שיתקבל בפועל בהמרה אמיתית (ר' טאב "פעולות" ← המרה)</div>
      <div style={{ display: "flex", gap: "6px", marginBottom: "12px", overflowX: "auto" }}>
        {[...fixedCandidates, "custom"].map((t) => (
          <button key={t} type="button" onClick={() => setTab(t)} style={{ padding: "6px 12px", borderRadius: "999px", fontSize: "11px", fontWeight: 700, whiteSpace: "nowrap", cursor: "pointer", background: tab === t ? COLOR.purple : "rgba(255,255,255,0.06)", border: `1px solid ${tab === t ? COLOR.purple : COLOR.cardBorder}`, color: "#fff" }}>
            {t === "custom" ? "מחשבון חופשי" : `${t} / ${localMeta.symbol}`}
          </button>
        ))}
      </div>
      {tab !== "custom" ? (
        (() => {
          const r = rateToLocal(tab);
          return (
            <div>
              <div style={{ fontSize: "20px", fontWeight: 800, color: COLOR.turquoise, direction: "ltr", textAlign: "right" }}>
                1 {tab} = {r != null ? `${localMeta.symbol}${r.toFixed(2)}` : "—"}
              </div>
              <div style={{ fontSize: "10px", color: COLOR.textMuted, marginTop: "4px" }}>
                {rates.status === "success" ? `מקור: ${rates.data?.source === "boi" ? "בנק ישראל" : "Frankfurter (ECB)"} · נכון ל-${rates.data?.asOf ?? "—"}` : "אין חיבור לשער חי כרגע"}
              </div>
            </div>
          );
        })()
      ) : (
        <div style={{ display: "flex", flexDirection: "column", gap: "8px" }}>
          <div style={{ display: "flex", gap: "6px", alignItems: "flex-end" }}>
            <div style={{ flex: 1, minWidth: 0 }}>
              <input type="number" value={amount} onChange={(e) => setAmount(e.target.value)} style={{ width: "100%", padding: "9px 10px", borderRadius: "10px", background: "#0e1930", border: `1px solid ${COLOR.cardBorder}`, color: "#fff", fontSize: "14px" }} />
            </div>
            <div style={{ width: "108px", flexShrink: 0 }}>
              <CurrencyPickerButton selectedCode={from} onSelect={setFrom} testId="rates-calc-from" />
            </div>
            <button type="button" aria-label="החלפת מטבעות" onClick={() => { setFrom(to); setTo(from); }} style={{ width: "34px", height: "34px", borderRadius: "10px", background: "rgba(255,255,255,0.06)", border: `1px solid ${COLOR.cardBorder}`, color: "#fff", cursor: "pointer", flexShrink: 0 }}>
              ⇄
            </button>
            <div style={{ width: "108px", flexShrink: 0 }}>
              <CurrencyPickerButton selectedCode={to} onSelect={setTo} testId="rates-calc-to" />
            </div>
          </div>
          <div style={{ fontSize: "17px", fontWeight: 800, color: COLOR.turquoise, direction: "ltr", textAlign: "right" }}>
            {(() => {
              const res = convertPair(Number(amount) || 0, from, to);
              return res != null ? `${Number(amount) || 0} ${from} = ${res.toLocaleString(undefined, { maximumFractionDigits: 2 })} ${to}` : "אין שער זמין";
            })()}
          </div>
        </div>
      )}
    </Card>
  );
}

// ============================== חלוניות ==============================

function AddMoneyForm({ currency, balances, onClose, onSave }: { currency: string; balances: CurrencyBalance[]; onClose: () => void; onSave: (currency: string, amount: number, source: MoneySource, date: string, note: string) => void }) {
  const [ccy, setCcy] = useState(currency);
  const [amount, setAmount] = useState("");
  const [source, setSource] = useState<MoneySource>("cash_from_home");
  const [date, setDate] = useState(today());
  const [note, setNote] = useState("");
  return (
    <Sheet title="הוספת כסף" onClose={onClose}>
      <div style={{ display: "flex", flexDirection: "column", gap: "12px" }}>
        <Field label="מטבע">
          <CurrencyPickerButton selectedCode={ccy} onSelect={setCcy} options={balances.map((b) => b.code)} testId="add-money-ccy" />
        </Field>
        <Field label="סכום">
          <input type="number" value={amount} onChange={(e) => setAmount(e.target.value)} style={inputStyle()} />
        </Field>
        <Field label="מקור הכסף">
          <PillSelect options={["cash_from_home", "atm_withdrawal", "refund", "extra_income", "transfer", "other"] as const} value={source} onChange={setSource} labels={MONEY_SOURCE_LABEL} />
        </Field>
        <Field label="תאריך">
          <input type="date" value={date} onChange={(e) => setDate(e.target.value)} style={inputStyle()} />
        </Field>
        <Field label="הערה (לא חובה)">
          <input value={note} onChange={(e) => setNote(e.target.value)} style={inputStyle()} />
        </Field>
        <button type="button" disabled={!amount} onClick={() => onSave(ccy, Number(amount), source, date, note)} style={{ padding: "13px", borderRadius: "12px", background: amount ? COLOR.purple : "rgba(255,255,255,0.08)", border: "none", color: amount ? "#fff" : COLOR.textMuted, fontSize: "14.5px", fontWeight: 800, cursor: amount ? "pointer" : "default" }}>
          אישור והוספה
        </button>
      </div>
    </Sheet>
  );
}

function ReduceMoneyForm({ currency, balance, onClose, onSave }: { currency: string; balance: number; onClose: () => void; onSave: (currency: string, amount: number, note: string) => void }) {
  const [amount, setAmount] = useState("");
  const [note, setNote] = useState("");
  const meta = currencyMeta(currency);
  return (
    <Sheet title={`הפחתת כסף — ${meta.name}`} onClose={onClose}>
      <div style={{ display: "flex", flexDirection: "column", gap: "12px" }}>
        <div style={{ fontSize: "12px", color: COLOR.textSecondary }}>יתרה זמינה: {formatMoney(balance, currency)}</div>
        <Field label="סכום להפחתה">
          <input type="number" value={amount} onChange={(e) => setAmount(e.target.value)} style={inputStyle()} />
        </Field>
        <Field label="סיבה (לא חובה)">
          <input value={note} onChange={(e) => setNote(e.target.value)} style={inputStyle()} />
        </Field>
        <button type="button" disabled={!amount} onClick={() => onSave(currency, Number(amount), note)} style={{ padding: "13px", borderRadius: "12px", background: amount ? COLOR.danger : "rgba(255,255,255,0.08)", border: "none", color: "#fff", fontSize: "14.5px", fontWeight: 800, cursor: amount ? "pointer" : "default" }}>
          אישור הפחתה
        </button>
      </div>
    </Sheet>
  );
}

function ConvertForm({
  balances,
  rates,
  defaultFrom,
  onClose,
  onSave,
}: {
  balances: CurrencyBalance[];
  rates: { status: "loading" | "success" | "error"; data: DemoCurrencyResult | null };
  defaultFrom: string;
  onClose: () => void;
  onSave: (fromCcy: string, fromAmount: number, toCcy: string, toAmount: number, fee: number, location: string, dateTime: string) => void;
}) {
  const [fromCcy, setFromCcy] = useState(balances.some((b) => b.code === defaultFrom) ? defaultFrom : balances[0]?.code ?? "ILS");
  const [fromAmount, setFromAmount] = useState("");
  const [toCcy, setToCcy] = useState<string | null>(null);
  const [toAmount, setToAmount] = useState("");
  const [fee, setFee] = useState("");
  const [location, setLocation] = useState("");
  const [dateTime, setDateTime] = useState(() => new Date().toISOString().slice(0, 16));

  const fromBalance = balances.find((b) => b.code === fromCcy)?.balance ?? 0;
  const fromCountry = primaryCountryForCurrency(fromCcy);
  const toCountry = toCcy ? primaryCountryForCurrency(toCcy) : null;
  const marketInfo = (() => {
    if (!toCcy || rates.status !== "success" || !rates.data) return null;
    const f = fromCcy === "ILS" ? 1 : rates.data.ratesToILS[fromCcy];
    const t = toCcy === "ILS" ? 1 : rates.data.ratesToILS[toCcy];
    if (!f || !t) return null;
    return f / t;
  })();
  const canSave = toCcy != null && Number(fromAmount) > 0 && Number(toAmount) > 0 && Number(fromAmount) <= fromBalance;

  function swap() {
    if (!toCcy) return;
    setFromCcy(toCcy);
    setToCcy(fromCcy);
    setFromAmount(toAmount);
    setToAmount(fromAmount);
  }

  return (
    <Sheet title="המרת מטבע" onClose={onClose}>
      <div style={{ display: "flex", flexDirection: "column", gap: "12px" }}>
        <div style={{ display: "flex", gap: "8px", alignItems: "flex-end" }}>
          <div style={{ flex: 1 }}>
            <Field label="ממדינה / מטבע מקור">
              <CurrencyPickerButton selectedCode={fromCcy} onSelect={setFromCcy} options={balances.map((b) => b.code)} testId="convert-from-ccy" />
            </Field>
          </div>
          <button type="button" aria-label="החלפת כיוון ההמרה" onClick={swap} style={{ width: "38px", height: "38px", borderRadius: "10px", background: "rgba(255,255,255,0.06)", border: `1px solid ${COLOR.cardBorder}`, color: "#fff", cursor: "pointer", flexShrink: 0, marginBottom: "1px" }}>
            ⇄
          </button>
          <div style={{ flex: 1 }}>
            <Field label="אל מדינה / מטבע יעד">
              <CurrencyPickerButton selectedCode={toCcy} onSelect={setToCcy} placeholder="בחירת מטבע יעד" testId="convert-to-ccy" />
            </Field>
          </div>
        </div>
        <div style={{ fontSize: "11px", color: COLOR.textSecondary, display: "flex", alignItems: "center", gap: "6px" }}>
          {fromCountry ? <FlagIcon countryCode={fromCountry.code} size={16} /> : null}
          יתרה זמינה ב-{fromCcy}: <strong style={{ color: "#fff" }}>{formatMoney(fromBalance, fromCcy)}</strong>
          {toCountry ? (
            <>
              <span style={{ margin: "0 4px" }}>←</span>
              <FlagIcon countryCode={toCountry.code} size={16} />
              <span>{toCountry.nameHe}</span>
            </>
          ) : null}
        </div>
        <div style={{ display: "flex", gap: "8px" }}>
          <div style={{ flex: 1 }}>
            <Field label="סכום שנמסר">
              <input data-testid="convert-from-amount" type="number" value={fromAmount} onChange={(e) => setFromAmount(e.target.value)} style={inputStyle()} />
            </Field>
          </div>
          <div style={{ flex: 1 }}>
            <Field label="סכום שהתקבל בפועל" hint="הזינו את הסכום שקיבלתם בפועל — לא שער האינטרנט">
              <input data-testid="convert-to-amount" type="number" value={toAmount} onChange={(e) => setToAmount(e.target.value)} style={inputStyle()} />
            </Field>
          </div>
        </div>
        {marketInfo != null ? (
          <div style={{ fontSize: "11.5px", color: COLOR.textSecondary, background: "rgba(255,255,255,0.04)", borderRadius: "8px", padding: "8px" }}>
            שער-מידע להשוואה בלבד: 1 {fromCcy} ≈ {marketInfo.toFixed(4)} {toCcy}
            {Number(fromAmount) > 0 && Number(toAmount) > 0 ? (
              <div style={{ marginTop: "3px", color: "#fff", fontWeight: 700 }}>השער שביצעתם בפועל: 1 {fromCcy} = {(Number(toAmount) / Number(fromAmount)).toFixed(4)} {toCcy}</div>
            ) : null}
          </div>
        ) : null}
        <Field label="עמלה (לא חובה)">
          <input type="number" value={fee} onChange={(e) => setFee(e.target.value)} style={inputStyle()} />
        </Field>
        <Field label="מקום ההמרה (לא חובה)">
          <input value={location} onChange={(e) => setLocation(e.target.value)} style={inputStyle()} />
        </Field>
        <Field label="תאריך ושעה">
          <input type="datetime-local" value={dateTime} onChange={(e) => setDateTime(e.target.value)} style={inputStyle()} />
        </Field>
        {Number(fromAmount) > fromBalance ? <div style={{ fontSize: "12px", color: COLOR.danger, fontWeight: 700 }}>היתרה במטבע המקור אינה מספיקה</div> : null}
        <button type="button" disabled={!canSave} onClick={() => canSave && onSave(fromCcy, Number(fromAmount), toCcy!, Number(toAmount), Number(fee) || 0, location, dateTime)} style={{ padding: "13px", borderRadius: "12px", background: canSave ? COLOR.purple : "rgba(255,255,255,0.08)", border: "none", color: canSave ? "#fff" : COLOR.textMuted, fontSize: "14.5px", fontWeight: 800, cursor: canSave ? "pointer" : "default" }}>
          ביצוע ההמרה
        </button>
      </div>
    </Sheet>
  );
}

function HistorySheet({
  currency,
  expenses,
  additions,
  conversions,
  onClose,
}: {
  currency: string;
  expenses: Expense[];
  additions: MoneyAddition[];
  conversions: ConversionRecord[];
  onClose: () => void;
}) {
  type Row = { dateTime: string; label: string; amountLabel: string; color: string };
  const rows: Row[] = [];
  for (const e of expenses.filter((x) => x.currency === currency)) rows.push({ dateTime: e.date, label: `הוצאה: ${e.title}`, amountLabel: `-${formatMoney(e.amount, e.currency)}`, color: COLOR.danger });
  for (const a of additions.filter((x) => x.currency === currency)) rows.push({ dateTime: a.date, label: a.amount >= 0 ? `הוספה: ${MONEY_SOURCE_LABEL[a.source]}` : `הפחתה: ${a.note ?? ""}`, amountLabel: `${a.amount >= 0 ? "+" : ""}${formatMoney(a.amount, currency)}`, color: a.amount >= 0 ? COLOR.success : COLOR.danger });
  for (const c of conversions.filter((x) => x.fromCurrency === currency || x.toCurrency === currency)) {
    if (c.fromCurrency === currency) rows.push({ dateTime: c.dateTime, label: `המרה ל-${c.toCurrency}`, amountLabel: `-${formatMoney(c.fromAmount, currency)}`, color: COLOR.warning });
    if (c.toCurrency === currency) rows.push({ dateTime: c.dateTime, label: `המרה מ-${c.fromCurrency}`, amountLabel: `+${formatMoney(c.toAmount, currency)}`, color: COLOR.success });
  }
  rows.sort((a, b) => (a.dateTime < b.dateTime ? 1 : -1));

  return (
    <Sheet title={`היסטוריה — ${currencyMeta(currency).name}`} onClose={onClose}>
      {rows.length === 0 ? (
        <div style={{ fontSize: "13px", color: COLOR.textSecondary }}>אין עדיין פעולות במטבע זה</div>
      ) : (
        <div style={{ display: "flex", flexDirection: "column", gap: "8px" }}>
          {rows.map((r, i) => (
            <div key={i} style={{ display: "flex", alignItems: "center", justifyContent: "space-between", padding: "10px", borderRadius: "10px", background: "#0e1930", border: `1px solid ${COLOR.cardBorder}` }}>
              <div>
                <div style={{ fontSize: "13px", fontWeight: 700, color: "#fff" }}>{r.label}</div>
                <div style={{ fontSize: "10.5px", color: COLOR.textMuted }}>{r.dateTime}</div>
              </div>
              <div style={{ fontSize: "14px", fontWeight: 800, color: r.color }}>{r.amountLabel}</div>
            </div>
          ))}
        </div>
      )}
    </Sheet>
  );
}

function AddCardForm({ initial, onClose, onSave }: { initial: CreditCardInfo | null; onClose: () => void; onSave: (card: Omit<CreditCardInfo, "id">) => void }) {
  const [nickname, setNickname] = useState(initial?.nickname ?? "");
  const [issuer, setIssuer] = useState(initial?.issuer ?? "");
  const [last4, setLast4] = useState(initial?.last4 ?? "");
  const [currency, setCurrency] = useState(initial?.currency ?? "ILS");
  const [feePercent, setFeePercent] = useState(initial?.feePercent ? String(initial.feePercent) : "");
  const [color, setColor] = useState(initial?.color ?? CARD_COLORS[0]!);
  const [isPrimary, setIsPrimary] = useState(initial?.isPrimary ?? false);
  const canSave = nickname.trim().length > 0 && /^\d{4}$/.test(last4);

  return (
    <Sheet title={initial ? "עריכת כרטיס אשראי" : "הוספת כרטיס אשראי"} onClose={onClose}>
      <div style={{ display: "flex", flexDirection: "column", gap: "12px" }}>
        <div style={{ fontSize: "10.5px", color: COLOR.textMuted, background: "rgba(245,165,68,0.1)", border: `1px solid ${COLOR.warning}30`, borderRadius: "8px", padding: "8px" }}>
          לעולם לא נשמרים מספר כרטיס מלא, תוקף או קוד אבטחה — רק 4 הספרות האחרונות.
        </div>
        <Field label="שם/כינוי הכרטיס">
          <input value={nickname} onChange={(e) => setNickname(e.target.value)} placeholder="לדוגמה: ויזה הנסיעות" style={inputStyle()} />
        </Field>
        <Field label="חברה מנפיקה">
          <input value={issuer} onChange={(e) => setIssuer(e.target.value)} placeholder="לדוגמה: ויזה כאל" style={inputStyle()} />
        </Field>
        <Field label="4 ספרות אחרונות בלבד">
          <input value={last4} onChange={(e) => setLast4(e.target.value.replace(/\D/g, "").slice(0, 4))} inputMode="numeric" style={inputStyle()} />
        </Field>
        <div style={{ display: "flex", gap: "8px" }}>
          <div style={{ flex: 1 }}>
            <Field label="מטבע החיוב">
              <CurrencyPickerButton selectedCode={currency} onSelect={setCurrency} testId="card-currency" />
            </Field>
          </div>
          <div style={{ flex: 1 }}>
            <Field label="עמלת המרה % (אם ידוע)">
              <input type="number" value={feePercent} onChange={(e) => setFeePercent(e.target.value)} style={inputStyle()} />
            </Field>
          </div>
        </div>
        <Field label="צבע לזיהוי">
          <div style={{ display: "flex", gap: "8px" }}>
            {CARD_COLORS.map((c) => (
              <button key={c} type="button" onClick={() => setColor(c)} aria-label={`בחירת צבע ${c}`} style={{ width: "30px", height: "30px", borderRadius: "50%", background: c, border: color === c ? "3px solid #fff" : "1px solid rgba(255,255,255,0.3)", cursor: "pointer" }} />
            ))}
          </div>
        </Field>
        <button type="button" onClick={() => setIsPrimary((v) => !v)} style={{ display: "flex", alignItems: "center", gap: "8px", background: "none", border: "none", padding: 0, cursor: "pointer", textAlign: "start" }}>
          <span style={{ width: "18px", height: "18px", borderRadius: "5px", border: `1.5px solid ${COLOR.purple}`, background: isPrimary ? COLOR.purple : "transparent", flexShrink: 0 }} />
          <span style={{ fontSize: "12.5px", color: "#fff" }}>קבע ככרטיס ראשי</span>
        </button>
        <button
          type="button"
          disabled={!canSave}
          onClick={() => onSave({ nickname, issuer, last4, currency, feePercent: feePercent ? Number(feePercent) : undefined, color, isPrimary })}
          style={{ padding: "13px", borderRadius: "12px", background: canSave ? COLOR.purple : "rgba(255,255,255,0.08)", border: "none", color: canSave ? "#fff" : COLOR.textMuted, fontSize: "14.5px", fontWeight: 800, cursor: canSave ? "pointer" : "default" }}
        >
          שמירת הכרטיס
        </button>
      </div>
    </Sheet>
  );
}

