"use client";

import { useEffect, useState } from "react";
import { ScreenShell, ScreenHeader, Card, Money, PrimaryButton, EditIcon, TrashIcon, inputStyle, COLOR, SPACE } from "../../design-system";
import { formatMoney, categoryColor, type Category } from "../../wallet-data";
import { CurrencyPickerButton } from "../../pickers";
import { useWalletStore } from "../../wallet-store";
import { activeTrip, type DemoTrip } from "../../trips-data";

const CATEGORY_COLOR: Record<Category, string> = {
  מלון: "#4f8fe0",
  מסעדות: COLOR.success,
  תחבורה: COLOR.warning,
  פעילויות: COLOR.primaryLight,
  קניות: "#e0699a",
  אחר: COLOR.textSecondary,
};

/** מסך "דוחות ותקציב" (24) — מחושב מנתוני-ההוצאות האמיתיים ב-localStorage
 * (לא נתוני-דמו קבועים בפני עצמם), דרך useWalletStore הקיים. */
export default function ReportsScreen() {
  const store = useWalletStore();
  const [trip, setTrip] = useState<DemoTrip | null>(null);

  useEffect(() => {
    setTrip(activeTrip());
  }, []);

  if (!store.hydrated) return null;

  const totalSpent = store.expenses.reduce((sum, e) => sum + (store.convertAmount(e.amount, e.currency, "ILS") ?? 0), 0);

  // "ימי-הוצאה" — כמה ימים שונים יש בהם לפחות הוצאה אחת, לצורך "ממוצע
  // ליום" — אותה שיטת-חישוב כמו ב-wallet/page.tsx, לא המצאה חדשה.
  const spendDays = new Set(store.expenses.map((e) => e.date)).size || 1;

  const byCategory = new Map<Category, { total: number; count: number }>();
  for (const e of store.expenses) {
    const ils = store.convertAmount(e.amount, e.currency, "ILS") ?? 0;
    const row = byCategory.get(e.category) ?? { total: 0, count: 0 };
    row.total += ils;
    row.count += 1;
    byCategory.set(e.category, row);
  }
  const categories = Array.from(byCategory.entries()).sort((a, b) => b[1].total - a[1].total);

  // טיפים: תת-סכום של amount (לא הוצאה נוספת) — מוצג כפילוח נפרד לפי
  // השירות שעליו ניתן הטיפ, בלי לשנות את סכומי הקטגוריות למעלה.
  const tipsByCategory = new Map<Category, number>();
  let totalTips = 0;
  for (const e of store.expenses) {
    if (!e.tipAmount) continue;
    const ils = store.convertAmount(e.tipAmount, e.currency, "ILS") ?? 0;
    tipsByCategory.set(e.category, (tipsByCategory.get(e.category) ?? 0) + ils);
    totalTips += ils;
  }
  const tipRows = Array.from(tipsByCategory.entries()).sort((a, b) => b[1] - a[1]);

  // תזרים כספים: כמה כסף נכנס לארנק בפועל (הפקדות חיוביות בלבד — לא סופרים
  // חזרה המרות/הפחתות-ידניות), מול כמה יצא.
  const totalAdded = store.additions.filter((a) => a.amount > 0).reduce((sum, a) => sum + (store.convertAmount(a.amount, a.currency, "ILS") ?? 0), 0);
  const avgPerDay = totalSpent / spendDays;

  const hotelStats = byCategory.get("מלון");
  const avgPerNight = hotelStats && trip && trip.nights > 0 ? hotelStats.total / trip.nights : null;

  return (
    <ScreenShell>
      <ScreenHeader title="דוחות ותקציב" />

      <BudgetCard store={store} totalSpent={totalSpent} />

      <div>
        <div style={{ fontSize: "13.5px", fontWeight: 700, color: COLOR.textPrimary, marginBottom: SPACE.sm }}>תזרים כספים</div>
        <Card>
          <Row label="הופקד לארנק" value={formatMoney(totalAdded, "ILS")} />
          <Row label="הוצאנו סה״כ" value={formatMoney(totalSpent, "ILS")} />
          <Row label="ממוצע הוצאה ליום" value={formatMoney(avgPerDay, "ILS")} last />
        </Card>
      </div>

      <div>
        <div style={{ fontSize: "13.5px", fontWeight: 700, color: COLOR.textPrimary, marginBottom: SPACE.sm }}>פילוח הוצאות</div>
        {categories.length === 0 ? (
          <Card style={{ textAlign: "center", color: COLOR.textSecondary, fontSize: "12.5px" }}>אין עדיין הוצאות לניתוח</Card>
        ) : (
          <div style={{ display: "flex", flexDirection: "column", gap: SPACE.sm }}>
            {categories.map(([cat, { total, count }]) => {
              const share = totalSpent > 0 ? Math.round((total / totalSpent) * 100) : 0;
              const avgPerExpense = total / count;
              const avgPerDayThisCategory = count / spendDays;
              return (
                <div key={cat} style={{ display: "flex", flexDirection: "column", gap: "3px" }}>
                  <div style={{ display: "flex", alignItems: "center", gap: SPACE.sm }}>
                    <span style={{ width: "10px", height: "10px", borderRadius: "50%", background: categoryColor(cat, CATEGORY_COLOR), flexShrink: 0 }} />
                    <span style={{ fontSize: "12px", color: COLOR.textPrimary, flex: 1 }}>{cat}</span>
                    <span style={{ fontSize: "12px", color: COLOR.textSecondary }}>{share}%</span>
                    <span style={{ fontSize: "12px", fontWeight: 700, color: COLOR.textPrimary, minWidth: "70px", textAlign: "left" }}>
                      <Money text={formatMoney(total, "ILS")} />
                    </span>
                  </div>
                  <div style={{ fontSize: "10.5px", color: COLOR.textSecondary, paddingInlineStart: "18px" }}>
                    {count} {count === 1 ? "פעם" : "פעמים"} · ממוצע {formatMoney(avgPerExpense, "ILS")} להוצאה · {avgPerDayThisCategory < 1 ? avgPerDayThisCategory.toFixed(2) : avgPerDayThisCategory.toFixed(1)} ליום
                    {cat === "מלון" && avgPerNight != null ? ` · ${formatMoney(avgPerNight, "ILS")} ללילה (${trip!.nights} לילות)` : ""}
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {totalTips > 0 ? (
        <div>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: SPACE.sm }}>
            <span style={{ fontSize: "13.5px", fontWeight: 700, color: COLOR.textPrimary }}>טיפים</span>
            <span style={{ fontSize: "12.5px", fontWeight: 700, color: COLOR.textPrimary }}>
              <Money text={formatMoney(totalTips, "ILS")} />
            </span>
          </div>
          <div style={{ fontSize: "11px", color: COLOR.textSecondary, marginBottom: SPACE.sm }}>כלולים כבר בסכום ההוצאה של כל קטגוריה למעלה — מוצג כאן בנפרד לפי השירות שעליו ניתן הטיפ</div>
          <div style={{ display: "flex", flexDirection: "column", gap: SPACE.xs }}>
            {tipRows.map(([cat, amount]) => (
              <div key={cat} style={{ display: "flex", alignItems: "center", gap: SPACE.sm }}>
                <span style={{ width: "10px", height: "10px", borderRadius: "50%", background: categoryColor(cat, CATEGORY_COLOR), flexShrink: 0 }} />
                <span style={{ fontSize: "12px", color: COLOR.textPrimary, flex: 1 }}>{cat}</span>
                <span style={{ fontSize: "12px", fontWeight: 700, color: COLOR.textPrimary, minWidth: "70px", textAlign: "left" }}>
                  <Money text={formatMoney(amount, "ILS")} />
                </span>
              </div>
            ))}
          </div>
        </div>
      ) : null}
    </ScreenShell>
  );
}

function Row({ label, value, last }: { label: string; value: string; last?: boolean }) {
  return (
    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", padding: "7px 0", borderBottom: last ? "none" : `1px solid ${COLOR.border}` }}>
      <span style={{ fontSize: "12px", color: COLOR.textSecondary }}>{label}</span>
      <span style={{ fontSize: "13px", fontWeight: 700, color: COLOR.textPrimary }}>
        <Money text={value} />
      </span>
    </div>
  );
}

/** תקציב אמיתי, לפי בקשה מפורשת: לא סכום קבוע מראש (כמו הקודם), אלא
 * שדה שהמשתמש בעצמו קובע — נשמר ב-useWalletStore (SK.budget, אותו דפוס
 * כמו baseCurrency), ניתן לעריכה/מחיקה כאן. כל עוד לא הוגדר, מוצג מצב-ריק
 * עם טופס-הזנה במקום פס-התקדמות מזויף. */
function BudgetCard({ store, totalSpent }: { store: ReturnType<typeof useWalletStore>; totalSpent: number }) {
  const [editing, setEditing] = useState(store.budget == null);
  const [amount, setAmount] = useState(store.budget ? String(store.budget.amount) : "");
  const [currency, setCurrency] = useState<string | null>(store.budget?.currency ?? store.baseCurrency);

  // מרענן את הטופס בכל פעם שנכנסים למצב-עריכה/ריק — כדי שמחיקת תקציב לא
  // תשאיר ערכים ישנים בשדות (למשל אחרי מחיקה, השדה חייב להיות נקי ולא
  // "7500" שנשאר מעריכה קודמת), ושלחיצה על "עריכה" תמיד תציג את הערך
  // האמיתי הנוכחי.
  useEffect(() => {
    if (editing || store.budget == null) {
      setAmount(store.budget ? String(store.budget.amount) : "");
      setCurrency(store.budget?.currency ?? store.baseCurrency);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [editing, store.budget]);

  const budgetInILS = store.budget ? store.convertAmount(store.budget.amount, store.budget.currency, "ILS") : null;
  const pct = budgetInILS != null && budgetInILS > 0 ? Math.min(100, Math.round((totalSpent / budgetInILS) * 100)) : 0;
  const remaining = budgetInILS != null ? Math.max(0, budgetInILS - totalSpent) : null;

  function save() {
    const n = Number(amount);
    if (!amount || n <= 0 || !currency) return;
    store.setBudget({ amount: n, currency });
    setEditing(false);
  }

  if (editing || store.budget == null) {
    return (
      <Card style={{ display: "flex", flexDirection: "column", gap: SPACE.sm }}>
        <div style={{ fontSize: "12px", color: COLOR.textSecondary }}>הגדרת תקציב לטיול</div>
        <div style={{ display: "flex", gap: SPACE.sm }}>
          <input
            type="number"
            min={0}
            value={amount}
            onChange={(e) => setAmount(e.target.value)}
            onFocus={(e) => e.target.select()}
            style={{ ...inputStyle, flex: 1 }}
            placeholder="סכום"
          />
          <div style={{ flex: 1 }}>
            <CurrencyPickerButton selectedCode={currency} onSelect={setCurrency} priorityCodes={store.balances.map((b) => b.code)} />
          </div>
        </div>
        <PrimaryButton onClick={save}>שמירת תקציב</PrimaryButton>
        {store.budget ? (
          <button
            type="button"
            onClick={() => {
              setAmount(String(store.budget!.amount));
              setCurrency(store.budget!.currency);
              setEditing(false);
            }}
            style={{ background: "none", border: "none", color: COLOR.textSecondary, fontSize: "12px", cursor: "pointer", padding: 0 }}
          >
            ביטול
          </button>
        ) : null}
      </Card>
    );
  }

  return (
    <Card>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "4px" }}>
        <span style={{ fontSize: "12px", color: COLOR.textSecondary }}>תקציב כולל</span>
        <div style={{ display: "flex", gap: SPACE.md }}>
          <button type="button" aria-label="עריכת תקציב" onClick={() => setEditing(true)} style={{ background: "none", border: "none", cursor: "pointer", padding: 0, display: "flex" }}>
            <EditIcon />
          </button>
          <button
            type="button"
            aria-label="מחיקת תקציב"
            onClick={() => {
              if (confirm("למחוק את התקציב?")) store.setBudget(null);
            }}
            style={{ background: "none", border: "none", cursor: "pointer", padding: 0, display: "flex" }}
          >
            <TrashIcon />
          </button>
        </div>
      </div>
      {budgetInILS == null ? (
        <div style={{ fontSize: "12.5px", color: COLOR.textSecondary }}>טוען שער החלפה...</div>
      ) : (
        <>
          <div style={{ fontSize: "22px", fontWeight: 700, color: COLOR.textPrimary, marginBottom: SPACE.sm }}>
            <Money text={formatMoney(budgetInILS, "ILS")} />
          </div>
          <div style={{ height: "8px", borderRadius: "999px", background: COLOR.cardElevated, overflow: "hidden" }}>
            <div style={{ width: `${pct}%`, height: "100%", background: pct >= 100 ? COLOR.danger : COLOR.primary }} />
          </div>
          <div style={{ display: "flex", justifyContent: "space-between", marginTop: SPACE.sm, fontSize: "11.5px", color: COLOR.textSecondary }}>
            <span>
              נותר <Money text={formatMoney(remaining ?? 0, "ILS")} />
            </span>
            <span>
              הוצאתי <Money text={formatMoney(totalSpent, "ILS")} />
            </span>
          </div>
        </>
      )}
    </Card>
  );
}
