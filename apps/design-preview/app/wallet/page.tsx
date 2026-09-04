"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import {
  LegacyCard as Card,
  LegacyScreenHeader as ScreenHeader,
  LegacyScreenShell as ScreenShell,
  LegacyBottomNav as BottomNav,
  LEGACY_COLOR as COLOR,
  LegacyExpenseIcon,
  LegacyAddMoneyIcon,
  LegacyConvertIcon,
  LegacyDepositIcon,
} from "../route/legacy-shared";
import { type DemoCurrencyResult } from "../actions";
import { DonutChart } from "../donut-chart";
import { useWalletStore } from "../wallet-store";
import { TripSwitcherPill } from "../trip-switcher";
import { useStoredImage } from "../use-stored-image";
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
  type Deposit,
  today,
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

// שני רכיבים קטנים שנשלפו החוצה בכוונה: useStoredImage הוא Hook, ואי-אפשר
// לקרוא ל-Hook בתוך .map() ישירות — צריך רכיב-שורה נפרד שקורא לו בעצמו.
function ReceiptThumbnail({ receiptId, catColor, onView }: { receiptId: string; catColor: string; onView: () => void }) {
  const url = useStoredImage(receiptId);
  if (!url) return <LegacyExpenseIcon color={catColor} size={18} />;
  return (
    <button
      type="button"
      onClick={(e) => {
        e.stopPropagation();
        onView();
      }}
      aria-label="הצגת הקבלה"
      style={{ position: "absolute", inset: 0, borderRadius: "10px", overflow: "hidden", border: "none", padding: 0, cursor: "pointer" }}
    >
      <img src={url} alt="קבלה" style={{ width: "100%", height: "100%", objectFit: "cover" }} />
    </button>
  );
}
function ReceiptViewerImage({ receiptId }: { receiptId: string }) {
  const url = useStoredImage(receiptId);
  if (!url) return null;
  return <img src={url} alt="קבלה" style={{ width: "100%", borderRadius: "12px" }} />;
}

export default function WalletPreviewScreen() {
  const router = useRouter();
  // ---------- ארנק: מאוחד על useWalletStore (לא עוד עותק-עצמאי) ----------
  // עד עכשיו המסך הזה שכפל באופן עצמאי את כל לוגיקת ה-hydrate/persist/
  // חישובי-הארנק שכבר קיימת ב-wallet-store.ts (עותק שני, בנוסף לעותק
  // שלישי ב-more/page.tsx) — שלושה מקומות שצריך לשמור מסונכרנים לנצח, כולל
  // (החל מתוכנית ההיקף-לכל-טיול) את היגיון "לאיזה טיול לשייך". אוחד לעותק
  // אחד: כל מה שהיה state/effect מקומי כאן עכשיו מגיע מה-hook המשותף.
  const store = useWalletStore();
  const { balances, expenses, cards, additions, conversions, deposits, baseCurrency, setBaseCurrency, manualCountryCode, setManualCountryCode, rates, toast, showToast, dismissToast, rateToILS, balanceOf, adjustBalance, totalConvertedToBase } = store;
  const convert = store.convertAmount;
  const localCurrency = store.localCurrency;

  // ---------- state מקומי (UI בלבד — לא נתוני-ארנק) ----------
  const [tab, setTab] = useState<Tab>("overview");
  const [summaryExpanded, setSummaryExpanded] = useState(false);

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

  function openDialog(d: NonNullable<typeof dialog>) {
    dismissToast();
    setMenuForExpense(null);
    setMenuForCard(null);
    setDialog(d);
  }

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

  // ---------- פעולות: מעטפות דקות מעל ה-hook (שומרות confirm()/סגירת-חלונית/תפריט מקומיים) ----------
  function handleAddMoney(currency: string, amount: number, source: MoneySource, date: string, note: string) {
    store.addMoney(currency, amount, source, date, note);
    setDialog(null);
  }
  function handleReduceMoney(currency: string, amount: number, note: string) {
    if (!store.reduceMoney(currency, amount, note)) return;
    setDialog(null);
  }
  function handleConvert(fromCcy: string, fromAmount: number, toCcy: string, toAmount: number, fee: number, location: string, dateTime: string) {
    if (!store.convertCurrency(fromCcy, fromAmount, toCcy, toAmount, fee, location, dateTime)) return;
    setDialog(null);
  }
  function handleDeleteExpense(id: string) {
    const tx = expenses.find((e) => e.id === id);
    if (!tx || !confirm(`למחוק את ההוצאה "${tx.title}"?`)) return;
    setDialog(null);
    setMenuForExpense(null);
    store.deleteExpense(id);
  }
  function handleSaveCard(card: Omit<CreditCardInfo, "id">, existingId?: string) {
    store.saveCard(card, existingId);
    setDialog(null);
  }
  function handleSetPrimaryCard(id: string) {
    store.setPrimaryCard(id);
    setMenuForCard(null);
  }
  function handleDeleteCard(id: string) {
    const card = cards.find((c) => c.id === id);
    if (!card || !confirm(`למחוק את הכרטיס "${card.nickname}"?`)) return;
    setMenuForCard(null);
    store.deleteCard(id);
  }

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

  // פילוח לפי מטבע — לפי בקשה מפורשת: "כמה הוצאות באיזה מטבעות ועל מה".
  // כל מטבע שהייתה בו הוצאה אי-פעם בטיול: סכום כולל (במטבע המקורי, לא
  // ממוצע) + כמה תנועות. הוצאות בלבד — המרות (store.conversions) נשארות
  // נפרדות לגמרי, כבר כך היום (convertCurrency לא נוגע ב-expenses), בדיוק
  // כמו שצריך: "כסף שהמרנו לא נכנס כהוצאה".
  const CURRENCY_CHART_COLORS = ["#43d6aa", "#4f8fe0", "#8a5adf", "#f5a544", "#ef6f61", "#e0699a", "#2dd4bf", "#facc15"];
  const expenseByCurrency = new Map<string, { total: number; count: number }>();
  for (const e of expenses) {
    const row = expenseByCurrency.get(e.currency) ?? { total: 0, count: 0 };
    row.total += e.amount;
    row.count += 1;
    expenseByCurrency.set(e.currency, row);
  }
  const totalExpensesILS = expenses.reduce((sum, e) => sum + (convert(e.amount, e.currency, "ILS") ?? 0), 0);
  const currencyRows = Array.from(expenseByCurrency.entries())
    .map(([code, row], i) => ({
      code,
      total: row.total,
      count: row.count,
      ilsValue: convert(row.total, code, "ILS") ?? 0,
      color: CURRENCY_CHART_COLORS[i % CURRENCY_CHART_COLORS.length]!,
      // המרות-מטבע שהמקור שלהן הוא המטבע הזה — מוצג ליד המטבע, לא כהוצאה.
      conversionsFrom: conversions.filter((c) => c.fromCurrency === code),
    }))
    .sort((a, b) => b.ilsValue - a.ilsValue);

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

  const pendingDeposits = deposits.filter((d) => d.status === "pending");
  const depositTotalsByCurrency = new Map<string, number>();
  for (const d of pendingDeposits) depositTotalsByCurrency.set(d.currency, (depositTotalsByCurrency.get(d.currency) ?? 0) + d.amount);
  const depositTotalLabel = Array.from(depositTotalsByCurrency.entries())
    .map(([code, sum]) => formatMoney(sum, code))
    .join(" · ");
  const nextDepositDue = pendingDeposits
    .filter((d) => d.expectedReturnDate)
    .sort((a, b) => (a.expectedReturnDate! < b.expectedReturnDate! ? -1 : 1))[0];
  const depositDueNow = pendingDeposits.some((d) => d.expectedReturnDate && d.expectedReturnDate <= today());

  function cardTotalLabel(cardId: string): string {
    const totals = new Map<string, number>();
    for (const e of expenses) if (e.cardId === cardId) totals.set(e.currency, (totals.get(e.currency) ?? 0) + e.amount);
    for (const d of deposits) if (d.paymentMethod === "credit" && d.cardId === cardId && d.status === "pending") totals.set(d.currency, (totals.get(d.currency) ?? 0) + d.amount);
    return Array.from(totals.entries())
      .map(([code, sum]) => formatMoney(sum, code))
      .join(" · ");
  }

  return (
    <ScreenShell>
      <ScreenHeader title="הארנק שלי" subtitle="כל מטבעות הטיול" action={<TripSwitcherPill />} />

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
            {/* שני מטבעות בכל מלבן (לא מלבן לכל מטבע) — לפי בקשה מפורשת, אותו
                עיקרון שכבר יושם בכרטיס-השערים בדף הבית. כשנשאר מלבן חסר-זוג
                מציגים "מקום פנוי" דש-קווקו במקומו, כדי שהצד הפנוי באמת יישאר
                פנוי לדברים נוספים במקום להיעלם. */}
            <div style={{ display: "grid", gridTemplateColumns: "repeat(2, 1fr)", gap: "6px" }}>
              {secondaryBalances.length === 0 ? (
                <div style={{ gridColumn: "1 / -1", fontSize: "11.5px", color: COLOR.textMuted, padding: "8px 2px" }}>אין עדיין מטבעות נוספים בארנק</div>
              ) : (
                (() => {
                  const pairs: (typeof secondaryBalances | null)[] = [];
                  for (let i = 0; i < secondaryBalances.length; i += 2) pairs.push(secondaryBalances.slice(i, i + 2));
                  if (pairs.length % 2 === 1) pairs.push(null);
                  return pairs.map((pair, i) =>
                    pair ? (
                      <div key={i} style={{ display: "flex", flexDirection: "column", borderRadius: "12px", background: COLOR.cardBg, border: `1px solid ${COLOR.cardBorder}`, overflow: "hidden" }}>
                        {pair.map((b, j) => {
                          const country = primaryCountryForCurrency(b.code);
                          return (
                            <button
                              key={b.code}
                              type="button"
                              onClick={() => router.push(`/wallet/currency/${b.code}`)}
                              style={{ display: "flex", alignItems: "center", gap: "6px", padding: "8px 10px", background: "none", border: "none", borderTop: j > 0 ? `1px solid ${COLOR.cardBorder}` : "none", cursor: "pointer", textAlign: "start" }}
                            >
                              {country ? <FlagIcon countryCode={country.code} size={18} /> : <span>{currencyMeta(b.code).symbol}</span>}
                              <span style={{ fontSize: "10px", fontWeight: 700, color: COLOR.textSecondary, flexShrink: 0 }}>{b.code}</span>
                              <span style={{ flex: 1, minWidth: 0, textAlign: "end", fontSize: "12px", fontWeight: 800, color: b.balance < 0 ? COLOR.danger : "#fff" }}>{formatMoney(b.balance, b.code)}</span>
                            </button>
                          );
                        })}
                      </div>
                    ) : (
                      <div key={i} style={{ borderRadius: "12px", border: `1px dashed ${COLOR.cardBorder}`, display: "flex", alignItems: "center", justifyContent: "center", minHeight: "44px" }}>
                        <span style={{ fontSize: "10.5px", color: COLOR.textMuted }}>מקום פנוי</span>
                      </div>
                    ),
                  );
                })()
              )}
            </div>
          </div>

          {/* כרטיסי אשראי — נראים גם בסקירה הראשית (לא רק בטאב "כרטיסים"),
              כמו המטבעות, כדי לדעת כמה שולם בכל כרטיס כולל היסטוריה מלאה
              במסך הפרטים שלו */}
          <div>
            <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: "6px" }}>
              <span style={{ fontSize: "12.5px", fontWeight: 800, color: COLOR.textSecondary }}>כרטיסי אשראי</span>
              <button type="button" onClick={() => openDialog({ type: "addCard" })} style={{ padding: "4px 10px", borderRadius: "999px", background: "rgba(138,90,223,0.18)", border: `1px solid ${COLOR.purple}55`, color: "#c9b3ff", fontSize: "10.5px", fontWeight: 700, cursor: "pointer" }}>
                + הוספת כרטיס
              </button>
            </div>
            {cards.length === 0 ? (
              <div style={{ fontSize: "11.5px", color: COLOR.textMuted, padding: "8px 2px" }}>לא נוספו כרטיסי אשראי</div>
            ) : (
              <div style={{ display: "flex", flexDirection: "column", gap: "6px" }}>
                {cards.map((c) => {
                  const totalLabel = cardTotalLabel(c.id);
                  return (
                    <button
                      key={c.id}
                      type="button"
                      onClick={() => router.push(`/wallet/cards/${c.id}`)}
                      style={{ display: "flex", alignItems: "center", gap: "10px", padding: "9px 12px", borderRadius: "12px", background: COLOR.cardBg, border: `1px solid ${COLOR.cardBorder}`, cursor: "pointer", textAlign: "start" }}
                    >
                      <span aria-hidden style={{ width: "34px", height: "22px", borderRadius: "5px", background: c.color, flexShrink: 0 }} />
                      <div style={{ flex: 1, minWidth: 0 }}>
                        <div style={{ fontSize: "12.5px", fontWeight: 700, color: "#fff" }}>{c.nickname}</div>
                        <div style={{ fontSize: "10px", color: COLOR.textSecondary }}>
                          {c.issuer} · •••• {c.last4}
                        </div>
                      </div>
                      <span style={{ fontSize: "13px", fontWeight: 800, color: totalLabel ? "#fff" : COLOR.textMuted, whiteSpace: "nowrap" }}>{totalLabel || "—"}</span>
                    </button>
                  );
                })}
              </div>
            )}
          </div>

          {/* ארנק הפקדונות — כרטיס קבוע, כמו כרטיסי המטבעות, שמציג את סך כל
              הפקדונות הפתוחים ומוביל לפירוט המלא (למי ניתן, באיזה מטבע, ומתי
              צפוי להחזר) */}
          <button
            type="button"
            onClick={() => router.push("/wallet/deposits")}
            style={{ display: "flex", alignItems: "center", justifyContent: "space-between", width: "100%", padding: "12px 14px", borderRadius: "14px", background: COLOR.cardBg, border: `1px solid ${depositDueNow ? COLOR.warning : COLOR.cardBorder}`, cursor: "pointer", textAlign: "start" }}
          >
            <div>
              <div style={{ fontSize: "13px", fontWeight: 800, color: "#fff" }}>
                פקדונות פתוחים{pendingDeposits.length > 0 ? ` (${pendingDeposits.length})` : ""}
              </div>
              <div style={{ fontSize: "10.5px", color: depositDueNow ? COLOR.warning : COLOR.textSecondary, marginTop: "1px" }}>
                {pendingDeposits.length === 0 ? "אין כרגע פקדונות פתוחים · לחצו לרישום פיקדון" : depositDueNow ? "יש פיקדון שזמן ההחזרה שלו הגיע" : nextDepositDue?.expectedReturnDate ? `הקרוב לחזרה: ${nextDepositDue.expectedReturnDate}` : "לא נקבע תאריך החזרה"}
              </div>
            </div>
            <div style={{ fontSize: "15px", fontWeight: 800, color: pendingDeposits.length === 0 ? COLOR.textMuted : "#fff", whiteSpace: "nowrap" }}>{depositTotalLabel || "—"}</div>
          </button>

          {/* פעולות מהירות */}
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr 1fr 1fr", gap: "6px" }}>
            <QuickAction label="הוצאה" icon={<LegacyExpenseIcon size={16} />} onClick={() => router.push("/wallet/expense/new")} />
            <QuickAction label="כסף" icon={<LegacyAddMoneyIcon size={16} />} onClick={() => router.push("/wallet/add")} />
            <QuickAction label="המרה" icon={<LegacyConvertIcon size={16} />} onClick={() => router.push("/wallet/convert")} />
            <QuickAction label="קבלה" icon={<CameraIcon size={16} />} onClick={() => router.push("/wallet/expense/new?autoCamera=1")} />
            <QuickAction label="פיקדון" icon={<LegacyDepositIcon size={16} />} onClick={() => router.push("/wallet/deposits")} />
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
                <div style={{ display: "flex", justifyContent: "space-between", fontSize: "11.5px", color: COLOR.textSecondary, marginBottom: "10px" }}>
                  <span>
                    מזומן/חיוב: <strong style={{ color: "#fff" }}>{formatMoney(cashExpenseTotal, baseCurrency)}</strong>
                  </span>
                  <span>
                    אשראי: <strong style={{ color: "#fff" }}>{formatMoney(creditExpenseTotal, baseCurrency)}</strong>
                  </span>
                </div>

                {/* פילוח לפי מטבע — לפי בקשה מפורשת: "כמה הוצאות באיזה
                    מטבעות ועל מה", עם ציון-מיוחד להמרות (לא נספרות כהוצאה,
                    רק מוצגות לצד המטבע שממנו הן יצאו). */}
                {currencyRows.length > 0 ? (
                  <div style={{ marginBottom: "10px" }}>
                    <div style={{ fontSize: "11.5px", fontWeight: 800, color: "#fff", marginBottom: "8px" }}>פילוח לפי מטבע</div>
                    <div style={{ display: "flex", alignItems: "center", gap: "12px" }}>
                      <div style={{ flexShrink: 0 }}>
                        <DonutChart segments={currencyRows.map((r) => ({ color: r.color, value: r.ilsValue }))} size={72} strokeWidth={13} />
                      </div>
                      <div style={{ flex: 1, minWidth: 0, display: "flex", flexDirection: "column", gap: "6px" }}>
                        {currencyRows.map((r) => (
                          <div key={r.code}>
                            <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", fontSize: "11px" }}>
                              <span style={{ display: "flex", alignItems: "center", gap: "5px", color: COLOR.textSecondary }}>
                                <span aria-hidden style={{ width: "7px", height: "7px", borderRadius: "50%", background: r.color, flexShrink: 0 }} />
                                {r.code}
                                <span style={{ color: COLOR.textMuted }}>({r.count})</span>
                              </span>
                              <strong style={{ color: "#fff" }}>{formatMoney(r.total, r.code)}</strong>
                            </div>
                            {r.conversionsFrom.map((c) => (
                              <div key={c.id} style={{ fontSize: "9.5px", color: COLOR.purple, marginTop: "1px" }}>
                                הומר {formatMoney(c.fromAmount, c.fromCurrency)} ל-{c.toCurrency}, התקבלו {formatMoney(c.toAmount, c.toCurrency)}
                              </div>
                            ))}
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>
                ) : null}

                <div style={{ fontSize: "11px", color: COLOR.textMuted }}>סך כל היתרות (כל המטבעות ממוירים ל-{currencyMeta(baseCurrency).name}): {totalConvertedToBase != null ? formatMoney(totalConvertedToBase, baseCurrency) : "טוען שער..."}</div>
                <div style={{ fontSize: "11px", color: COLOR.textMuted, marginTop: "3px" }}>סך כל ההוצאות בשקלים (לפי שער-חי): {formatMoney(totalExpensesILS, "ILS")}</div>
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
                      {t.receiptId ? (
                        <ReceiptThumbnail receiptId={t.receiptId} catColor={catColor} onView={() => setViewingReceiptId(t.receiptId!)} />
                      ) : (
                        <LegacyExpenseIcon color={catColor} size={18} />
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

      {tab === "history" ? <AllHistoryList expenses={expenses} additions={additions} conversions={conversions} deposits={deposits} /> : null}

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

      {viewingReceiptId ? (
        <Sheet title="הקבלה" onClose={() => setViewingReceiptId(null)}>
          <ReceiptViewerImage receiptId={viewingReceiptId} />
        </Sheet>
      ) : null}

      {dialog?.type === "addMoney" ? <AddMoneyForm currency={dialog.currency} balances={balances} onClose={() => setDialog(null)} onSave={handleAddMoney} /> : null}
      {dialog?.type === "reduceMoney" ? <ReduceMoneyForm currency={dialog.currency} balance={balanceOf(dialog.currency).balance} onClose={() => setDialog(null)} onSave={handleReduceMoney} /> : null}
      {(dialog?.type === "history" || dialog?.type === "currencyDetail") && detailCurrency ? (
        dialog.type === "history" ? (
          <HistorySheet currency={detailCurrency} expenses={expenses} additions={additions} conversions={conversions} deposits={deposits} onClose={() => setDialog(null)} />
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
            if (!balances.some((b) => b.code === code)) adjustBalance(code, 0);
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

function QuickAction({ label, icon, onClick }: { label: string; icon: React.ReactNode; onClick: () => void }) {
  return (
    <button type="button" onClick={onClick} style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: "4px", padding: "10px 4px", borderRadius: "12px", background: COLOR.cardBg, border: `1px solid ${COLOR.cardBorder}`, color: "#fff", fontSize: "10.5px", fontWeight: 700, cursor: "pointer" }}>
      {icon}
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

function AllHistoryList({ expenses, additions, conversions, deposits }: { expenses: Expense[]; additions: MoneyAddition[]; conversions: ConversionRecord[]; deposits: Deposit[] }) {
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
  for (const d of deposits) {
    rows.push({
      sortKey: `${d.dateGiven}T00:00`,
      displayDate: d.dateGiven,
      label: `פיקדון: ${d.title}`,
      amountLabel: `-${formatMoney(d.amount, d.currency)}`,
      color: COLOR.warning,
      currency: d.currency,
      href: `/wallet/deposit/new?edit=${d.id}`,
    });
    if (d.status === "returned" && d.returnedDate) {
      rows.push({
        sortKey: `${d.returnedDate}T00:00`,
        displayDate: d.returnedDate,
        label: `פיקדון הוחזר: ${d.title}`,
        amountLabel: `+${formatMoney(d.amount, d.currency)}`,
        color: COLOR.success,
        currency: d.currency,
        href: `/wallet/deposit/new?edit=${d.id}`,
      });
    }
  }
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
              <input type="number" value={amount} onChange={(e) => setAmount(e.target.value)} onFocus={(e) => e.target.select()} style={{ width: "100%", padding: "9px 10px", borderRadius: "10px", background: "#0e1930", border: `1px solid ${COLOR.cardBorder}`, color: "#fff", fontSize: "14px" }} />
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
          <input type="number" value={amount} onChange={(e) => setAmount(e.target.value)} onFocus={(e) => e.target.select()} style={inputStyle()} />
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
          <input type="number" value={amount} onChange={(e) => setAmount(e.target.value)} onFocus={(e) => e.target.select()} style={inputStyle()} />
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
              <input data-testid="convert-from-amount" type="number" value={fromAmount} onChange={(e) => setFromAmount(e.target.value)} onFocus={(e) => e.target.select()} style={inputStyle()} />
            </Field>
          </div>
          <div style={{ flex: 1 }}>
            <Field label="סכום שהתקבל בפועל" hint="הזינו את הסכום שקיבלתם בפועל — לא שער האינטרנט">
              <input data-testid="convert-to-amount" type="number" value={toAmount} onChange={(e) => setToAmount(e.target.value)} onFocus={(e) => e.target.select()} style={inputStyle()} />
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
          <input type="number" value={fee} onChange={(e) => setFee(e.target.value)} onFocus={(e) => e.target.select()} style={inputStyle()} />
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
  deposits,
  onClose,
}: {
  currency: string;
  expenses: Expense[];
  additions: MoneyAddition[];
  conversions: ConversionRecord[];
  deposits: Deposit[];
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
  for (const d of deposits.filter((x) => x.currency === currency)) {
    rows.push({ dateTime: d.dateGiven, label: `פיקדון: ${d.title}`, amountLabel: `-${formatMoney(d.amount, currency)}`, color: COLOR.warning });
    if (d.status === "returned" && d.returnedDate) rows.push({ dateTime: d.returnedDate, label: `פיקדון הוחזר: ${d.title}`, amountLabel: `+${formatMoney(d.amount, currency)}`, color: COLOR.success });
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
              <input type="number" value={feePercent} onChange={(e) => setFeePercent(e.target.value)} onFocus={(e) => e.target.select()} style={inputStyle()} />
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

