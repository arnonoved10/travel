"use client";

import { useEffect, useState } from "react";
import { ScreenShell, ScreenHeader, Card, Money, COLOR, SPACE } from "../../design-system";
import { formatMoney, categoryColor, type Category } from "../../wallet-data";
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

  const totalBudget = 10000;
  const totalSpent = store.expenses.reduce((sum, e) => sum + (store.convertAmount(e.amount, e.currency, "ILS") ?? 0), 0);
  const remaining = Math.max(0, totalBudget - totalSpent);
  const pct = Math.min(100, Math.round((totalSpent / totalBudget) * 100));

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

      <Card>
        <div style={{ fontSize: "12px", color: COLOR.textSecondary, marginBottom: "4px" }}>תקציב כולל</div>
        <div style={{ fontSize: "22px", fontWeight: 700, color: COLOR.textPrimary, marginBottom: SPACE.sm }}>
          <Money text={formatMoney(totalBudget, "ILS")} />
        </div>
        <div style={{ height: "8px", borderRadius: "999px", background: COLOR.cardElevated, overflow: "hidden" }}>
          <div style={{ width: `${pct}%`, height: "100%", background: COLOR.primary }} />
        </div>
        <div style={{ display: "flex", justifyContent: "space-between", marginTop: SPACE.sm, fontSize: "11.5px", color: COLOR.textSecondary }}>
          <span>
            נותר <Money text={formatMoney(remaining, "ILS")} />
          </span>
          <span>
            הוצאתי <Money text={formatMoney(totalSpent, "ILS")} />
          </span>
        </div>
      </Card>

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
