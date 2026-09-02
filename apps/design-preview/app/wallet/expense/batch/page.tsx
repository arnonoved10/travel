"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { ScreenShell, ScreenHeader, Card, Field, PrimaryButton, COLOR, SPACE, inputStyle } from "../../../design-system";
import { CurrencyPickerButton } from "../../../pickers";
import { today, nowTime, defaultCurrencyPriority, allCategories, categoryColor, nextId, type PaymentMethod } from "../../../wallet-data";
import { useWalletStore } from "../../../wallet-store";

const CATEGORY_COLOR: Record<string, string> = { מלון: COLOR.primary, מסעדות: COLOR.warning, תחבורה: "#4f8fe0", פעילויות: COLOR.success, קניות: "#e0699a", אחר: COLOR.textSecondary };

interface BatchRow {
  key: string;
  category: string;
  title: string;
  currency: string;
  amount: string;
  tip: string;
  tipMode: "included" | "separate";
  method: PaymentMethod;
  cardId?: string;
}

/** הוספת כמה הוצאות בבת-אחת — לפי בקשה מפורשת: "יצאתי לבלות והייתי
 * בכמה מקומות ולא הכנסתי אותם, אז שארצה להזין אותם אוכל לבחור כמה
 * הוצאות". תאריך+שעה משותפים לכל השורות (ברירת-מחדל: עכשיו), כל שורה
 * נשמרת בסוף דרך saveExpense הקיים — לא לוגיקה כפולה, רק UI מרוכז.
 */
export default function BatchExpenseScreen() {
  const router = useRouter();
  const store = useWalletStore();
  const [date, setDate] = useState(today());
  const [time, setTime] = useState(nowTime());
  const [categories, setCategories] = useState<string[]>(["מלון", "מסעדות", "תחבורה", "פעילויות", "קניות", "אחר"]);
  const [rows, setRows] = useState<BatchRow[]>([]);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    setCategories(allCategories());
  }, []);

  useEffect(() => {
    if (store.hydrated && rows.length === 0) {
      setRows([makeRow(store.localCurrency.currencyCode)]);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [store.hydrated]);

  function makeRow(currency: string): BatchRow {
    return { key: nextId("row"), category: "אחר", title: "", currency, amount: "", tip: "", tipMode: "included", method: "cash", cardId: undefined };
  }

  function addRow() {
    setRows((prev) => [...prev, makeRow(store.localCurrency.currencyCode)]);
  }
  function removeRow(key: string) {
    setRows((prev) => prev.filter((r) => r.key !== key));
  }
  function updateRow(key: string, patch: Partial<BatchRow>) {
    setRows((prev) => prev.map((r) => (r.key === key ? { ...r, ...patch } : r)));
  }

  if (!store.hydrated) return null;

  function handleSaveAll() {
    const valid = rows.filter((r) => r.title.trim() && Number(r.amount) > 0);
    if (valid.length === 0) return setError("יש להזין לפחות הוצאה אחת עם שם וסכום");
    for (const row of valid) {
      const tipValue = row.tip && Number(row.tip) > 0 ? Number(row.tip) : 0;
      const finalAmount = row.tipMode === "separate" ? Number(row.amount) + tipValue : Number(row.amount);
      store.saveExpense(
        {
          title: row.title.trim(),
          category: row.category,
          currency: row.currency,
          amount: finalAmount,
          tipAmount: tipValue > 0 ? tipValue : undefined,
          date,
          time,
          paymentMethod: row.method,
          cardId: row.cardId,
        },
        null
      );
    }
    router.push("/wallet");
  }

  return (
    <ScreenShell>
      <ScreenHeader title="הוספת כמה הוצאות" />
      <div style={{ fontSize: "11.5px", color: COLOR.textSecondary }}>לדוגמה: יום שלם של קניות, או ערב שהייתם בכמה מקומות — כל שורה היא הוצאה נפרדת, ונשמרות יחד באותו תאריך ושעה.</div>

      <div style={{ display: "flex", gap: SPACE.sm }}>
        <div style={{ flex: 1 }}>
          <Field label="תאריך (משותף לכל ההוצאות)">
            <input type="date" value={date} onChange={(e) => setDate(e.target.value)} style={inputStyle} />
          </Field>
        </div>
        <div style={{ flex: 1 }}>
          <Field label="שעה">
            <input type="time" value={time} onChange={(e) => setTime(e.target.value)} style={inputStyle} />
          </Field>
        </div>
      </div>

      {rows.map((row, i) => (
        <Card key={row.key} style={{ display: "flex", flexDirection: "column", gap: SPACE.sm }}>
          <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
            <span style={{ fontSize: "12px", fontWeight: 700, color: COLOR.textSecondary }}>הוצאה {i + 1}</span>
            {rows.length > 1 ? (
              <button type="button" onClick={() => removeRow(row.key)} aria-label={`הסרת הוצאה ${i + 1}`} style={{ background: "none", border: "none", color: COLOR.danger, cursor: "pointer", fontSize: "13px" }}>
                ✕ הסרה
              </button>
            ) : null}
          </div>

          <input value={row.title} onChange={(e) => updateRow(row.key, { title: e.target.value })} placeholder="שם ההוצאה (למשל: מסעדה)" style={inputStyle} />

          <div style={{ display: "flex", gap: SPACE.sm, overflowX: "auto" }}>
            {categories.map((c) => (
              <button
                key={c}
                type="button"
                onClick={() => updateRow(row.key, { category: c })}
                style={{
                  flexShrink: 0,
                  display: "flex",
                  alignItems: "center",
                  gap: "6px",
                  padding: "6px 11px",
                  borderRadius: "999px",
                  background: row.category === c ? `${COLOR.primary}22` : COLOR.cardElevated,
                  border: `1px solid ${row.category === c ? COLOR.primary : COLOR.border}`,
                  color: row.category === c ? COLOR.primaryLight : COLOR.textSecondary,
                  fontSize: "11px",
                  fontWeight: 700,
                  cursor: "pointer",
                }}
              >
                <span aria-hidden style={{ width: "8px", height: "8px", borderRadius: "50%", background: categoryColor(c, CATEGORY_COLOR) }} />
                {c}
              </button>
            ))}
          </div>

          <div style={{ display: "flex", alignItems: "center", gap: SPACE.sm }}>
            <div style={{ width: "120px", flexShrink: 0 }}>
              <CurrencyPickerButton selectedCode={row.currency} onSelect={(code) => updateRow(row.key, { currency: code })} priorityCodes={defaultCurrencyPriority(store.localCurrency.currencyCode)} />
            </div>
            <input type="number" value={row.amount} onChange={(e) => updateRow(row.key, { amount: e.target.value })} placeholder="סכום" style={{ ...inputStyle, flex: 1, textAlign: "left" }} />
          </div>

          <div style={{ display: "flex", alignItems: "center", gap: SPACE.sm }}>
            <input type="number" value={row.tip} onChange={(e) => updateRow(row.key, { tip: e.target.value })} placeholder="טיפ (לא חובה)" style={{ ...inputStyle, flex: 1, textAlign: "left" }} />
            <div style={{ display: "flex", borderRadius: "10px", overflow: "hidden", border: `1px solid ${COLOR.border}`, flexShrink: 0 }}>
              <button
                type="button"
                onClick={() => updateRow(row.key, { tipMode: "included" })}
                style={{ padding: "0 8px", border: "none", background: row.tipMode === "included" ? COLOR.primary : "transparent", color: row.tipMode === "included" ? "#fff" : COLOR.textSecondary, fontSize: "10px", fontWeight: 700, cursor: "pointer" }}
              >
                כלול
              </button>
              <button
                type="button"
                onClick={() => updateRow(row.key, { tipMode: "separate" })}
                style={{ padding: "0 8px", border: "none", background: row.tipMode === "separate" ? COLOR.primary : "transparent", color: row.tipMode === "separate" ? "#fff" : COLOR.textSecondary, fontSize: "10px", fontWeight: 700, cursor: "pointer" }}
              >
                בנפרד
              </button>
            </div>
          </div>

          <div style={{ display: "flex", gap: SPACE.sm }}>
            <button
              type="button"
              onClick={() => updateRow(row.key, { method: "cash" })}
              style={{ flex: 1, padding: "8px", borderRadius: "10px", background: row.method === "cash" ? `${COLOR.primary}22` : COLOR.cardElevated, border: `1px solid ${row.method === "cash" ? COLOR.primary : COLOR.border}`, color: row.method === "cash" ? COLOR.primaryLight : COLOR.textSecondary, fontSize: "11.5px", fontWeight: 700, cursor: "pointer" }}
            >
              מזומן
            </button>
            <button
              type="button"
              onClick={() => updateRow(row.key, { method: "credit", cardId: row.cardId ?? store.cards.find((c) => c.isPrimary)?.id ?? store.cards[0]?.id })}
              style={{ flex: 1, padding: "8px", borderRadius: "10px", background: row.method === "credit" ? `${COLOR.primary}22` : COLOR.cardElevated, border: `1px solid ${row.method === "credit" ? COLOR.primary : COLOR.border}`, color: row.method === "credit" ? COLOR.primaryLight : COLOR.textSecondary, fontSize: "11.5px", fontWeight: 700, cursor: "pointer" }}
            >
              כרטיס אשראי
            </button>
          </div>
          {row.method === "credit" && store.cards.length > 0 ? (
            <div style={{ display: "flex", gap: SPACE.sm, overflowX: "auto" }}>
              {store.cards.map((c) => (
                <button
                  key={c.id}
                  type="button"
                  onClick={() => updateRow(row.key, { cardId: c.id })}
                  style={{ flexShrink: 0, padding: "6px 10px", borderRadius: "10px", background: row.cardId === c.id ? `${COLOR.primary}22` : COLOR.cardElevated, border: `1px solid ${row.cardId === c.id ? COLOR.primary : COLOR.border}`, color: row.cardId === c.id ? COLOR.primaryLight : COLOR.textSecondary, fontSize: "10.5px", fontWeight: 700, cursor: "pointer" }}
                >
                  {c.nickname}
                </button>
              ))}
            </div>
          ) : null}
        </Card>
      ))}

      <button type="button" onClick={addRow} style={{ padding: "12px", borderRadius: "12px", background: "none", border: `1px dashed ${COLOR.border}`, color: COLOR.textSecondary, fontSize: "13px", fontWeight: 700, cursor: "pointer" }}>
        + הוספת הוצאה נוספת
      </button>

      {error ? <div style={{ color: COLOR.danger, fontSize: "12.5px" }}>{error}</div> : null}
      <PrimaryButton onClick={handleSaveAll}>שמירת כל ההוצאות</PrimaryButton>
    </ScreenShell>
  );
}
