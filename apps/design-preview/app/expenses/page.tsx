"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { LegacyCard as Card, LegacyScreenHeader as ScreenHeader, LegacyScreenShell as ScreenShell, LegacyBottomNav as BottomNav, LEGACY_COLOR as COLOR, LegacyPlusIcon } from "../route/legacy-shared";
import { CameraIcon } from "../ui-kit";
import { TripSwitcherPill } from "../trip-switcher";
import { useWalletStore } from "../wallet-store";
import { formatMoney, categoryColor, type Category, type Expense } from "../wallet-data";

const CATEGORY_COLOR: Record<string, string> = {
  מלון: "#4f8fe0",
  מסעדות: COLOR.success,
  תחבורה: COLOR.warning,
  פעילויות: COLOR.purple,
  קניות: "#e0699a",
  אחר: COLOR.textSecondary,
};

/**
 * דף "הוצאות" חדש בסרגל הניווט — מרכז אחד לכל ההוצאות: סיכום+פילוח-
 * קטגוריות (אותו חישוב בדיוק כמו wallet/reports), כפתורי הוספה/הוספה-
 * מרובה/סריקת-קבלה (מקשרים למסכים הקיימים, לא טפסים כפולים), ורשימת כל
 * ההוצאות עם עריכה (/wallet/expense/new?edit=, שכבר תומך בעריכה מלאה)
 * ומחיקה (store.deleteExpense הקיים).
 */
export default function ExpensesScreen() {
  const router = useRouter();
  const store = useWalletStore();
  const [filter, setFilter] = useState<Category | "all">("all");
  const [search, setSearch] = useState("");

  if (!store.hydrated) return null;

  const totalSpent = store.expenses.reduce((sum, e) => sum + (store.convertAmount(e.amount, e.currency, "ILS") ?? 0), 0);
  const byCategory = new Map<Category, number>();
  for (const e of store.expenses) {
    const ils = store.convertAmount(e.amount, e.currency, "ILS") ?? 0;
    byCategory.set(e.category, (byCategory.get(e.category) ?? 0) + ils);
  }
  const categories = Array.from(byCategory.entries()).sort((a, b) => b[1] - a[1]);

  const filtered = store.expenses
    .filter((e) => (filter === "all" || e.category === filter) && (!search || e.title.includes(search) || (e.merchant ?? "").includes(search)))
    .sort((a, b) => (a.date < b.date ? 1 : a.date > b.date ? -1 : 0));

  function handleDelete(e: Expense) {
    if (!confirm(`למחוק את "${e.title}"?`)) return;
    store.deleteExpense(e.id);
  }

  return (
    <ScreenShell>
      <ScreenHeader title="הוצאות" subtitle="כל ההוצאות של הטיול" action={<TripSwitcherPill />} />

      <Card>
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: categories.length > 0 ? "10px" : 0 }}>
          <span style={{ fontSize: "12.5px", color: COLOR.textSecondary }}>סה״כ הוצאות</span>
          <span style={{ fontSize: "18px", fontWeight: 800, color: COLOR.textPrimary }}>{formatMoney(totalSpent, "ILS")}</span>
        </div>
        {categories.length > 0 ? (
          <div style={{ display: "flex", flexDirection: "column", gap: "6px" }}>
            {categories.map(([cat, amount]) => {
              const pct = totalSpent > 0 ? Math.round((amount / totalSpent) * 100) : 0;
              const color = categoryColor(cat, CATEGORY_COLOR);
              return (
                <div key={cat}>
                  <div style={{ display: "flex", justifyContent: "space-between", fontSize: "11px", marginBottom: "3px" }}>
                    <span style={{ color: COLOR.textSecondary, display: "flex", alignItems: "center", gap: "5px" }}>
                      <span aria-hidden style={{ width: "7px", height: "7px", borderRadius: "50%", background: color, flexShrink: 0 }} />
                      {cat}
                    </span>
                    <span style={{ color: COLOR.textPrimary, fontWeight: 700 }}>{formatMoney(amount, "ILS")}</span>
                  </div>
                  <div style={{ height: "5px", borderRadius: "999px", background: "rgba(255,255,255,0.06)", overflow: "hidden" }}>
                    <div style={{ width: `${pct}%`, height: "100%", background: color }} />
                  </div>
                </div>
              );
            })}
          </div>
        ) : (
          <div style={{ fontSize: "12px", color: COLOR.textMuted, textAlign: "center", padding: "6px 0" }}>אין עדיין הוצאות</div>
        )}
      </Card>

      {/* לפי בקשה מפורשת: היו כאן "הוספה" ו"הוספה מרובה" — כפל מיותר, כי
          "הוספה מרובה" (/wallet/expense/batch) כבר מציעה "+ הוספת הוצאה
          נוספת" בסוף כל הוצאה, ומסיימת אם לא מוסיפים עוד — כך שהיא מכסה
          גם את מקרה ההוספה הבודדת. נשאר כפתור אחד בשם "הוספה" שמוביל
          לאותו מסך-הוספה-מרובה. */}
      <div style={{ display: "flex", gap: "8px" }}>
        <button
          type="button"
          onClick={() => router.push("/wallet/expense/batch")}
          style={{ flex: 1, display: "flex", flexDirection: "column", alignItems: "center", gap: "5px", padding: "10px 4px", borderRadius: "14px", background: COLOR.cardBg, border: `1px solid ${COLOR.cardBorder}`, color: "#fff", cursor: "pointer" }}
        >
          <LegacyPlusIcon size={16} />
          <span style={{ fontSize: "10.5px", fontWeight: 700 }}>הוספה</span>
        </button>
        <button
          type="button"
          onClick={() => router.push("/wallet/expense/scan")}
          style={{ flex: 1, display: "flex", flexDirection: "column", alignItems: "center", gap: "5px", padding: "10px 4px", borderRadius: "14px", background: COLOR.cardBg, border: `1px solid ${COLOR.cardBorder}`, color: "#fff", cursor: "pointer" }}
        >
          <CameraIcon size={16} />
          <span style={{ fontSize: "10.5px", fontWeight: 700 }}>סריקת קבלה</span>
        </button>
      </div>

      <div style={{ display: "flex", alignItems: "center", gap: "8px", background: COLOR.cardBg, border: `1px solid ${COLOR.cardBorder}`, borderRadius: "12px", padding: "8px 12px" }}>
        <input value={search} onChange={(e) => setSearch(e.target.value)} placeholder="חיפוש הוצאה" style={{ flex: 1, background: "transparent", border: "none", outline: "none", color: COLOR.textPrimary, fontSize: "13px" }} />
      </div>
      <div style={{ display: "flex", gap: "6px", overflowX: "auto", paddingBottom: "2px" }}>
        {(["all", ...categories.map(([c]) => c)] as const).map((c) => (
          <button
            key={c}
            type="button"
            onClick={() => setFilter(c)}
            aria-pressed={filter === c}
            style={{
              flexShrink: 0,
              padding: "6px 12px",
              borderRadius: "999px",
              fontSize: "11px",
              fontWeight: 700,
              whiteSpace: "nowrap",
              cursor: "pointer",
              background: filter === c ? COLOR.purple : "rgba(255,255,255,0.06)",
              border: `1px solid ${filter === c ? COLOR.purple : COLOR.cardBorder}`,
              color: "#fff",
            }}
          >
            {c === "all" ? "הכל" : c}
          </button>
        ))}
      </div>

      <div style={{ display: "flex", flexDirection: "column", gap: "8px" }}>
        {filtered.length === 0 ? (
          <Card style={{ textAlign: "center", color: COLOR.textSecondary, fontSize: "12.5px" }}>אין הוצאות תואמות</Card>
        ) : (
          filtered.map((e) => (
            <Card key={e.id} style={{ display: "flex", alignItems: "center", gap: "10px" }}>
              <div onClick={() => router.push(`/wallet/expense/new?edit=${e.id}`)} style={{ flex: 1, minWidth: 0, cursor: "pointer" }}>
                <div style={{ fontSize: "13px", fontWeight: 700, color: COLOR.textPrimary, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{e.title}</div>
                <div style={{ fontSize: "11px", color: COLOR.textSecondary, marginTop: "2px" }}>
                  {e.date} · {e.category}
                </div>
              </div>
              <span style={{ fontSize: "13px", fontWeight: 700, color: COLOR.danger, flexShrink: 0 }}>-{formatMoney(e.amount, e.currency)}</span>
              <button
                type="button"
                onClick={() => handleDelete(e)}
                aria-label={`מחיקת ${e.title}`}
                style={{ width: "28px", height: "28px", borderRadius: "8px", background: "rgba(239,111,97,0.12)", border: `1px solid ${COLOR.danger}40`, color: COLOR.danger, cursor: "pointer", fontSize: "13px", flexShrink: 0 }}
              >
                ✕
              </button>
            </Card>
          ))
        )}
      </div>

      <BottomNav active="expenses" />
    </ScreenShell>
  );
}
