"use client";

import { Suspense, useEffect, useRef, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { ScreenShell, ScreenHeader, PillTabs, Field, PrimaryButton, inputStyle, textareaStyle, COLOR, SPACE } from "../../../design-system";
import { CurrencyPickerButton } from "../../../pickers";
import { today, defaultCurrencyPriority, type PaymentMethod } from "../../../wallet-data";
import { useWalletStore } from "../../../wallet-store";

const METHOD_TABS: { key: PaymentMethod; label: string }[] = [
  { key: "cash", label: "מזומן" },
  { key: "credit", label: "כרטיס אשראי" },
];

/** רישום פיקדון (מלון/רכב שכור/וכו') — סכום שמוחזק זמנית ואמור לחזור.
 * לא הוצאה: יורד מהארנק/נספר-על-הכרטיס כשניתן, ומוחזר בדיוק כשמסמנים
 * "הוחזר" במסך /wallet/deposits — לפי בקשה מפורשת. */
export default function NewDepositScreen() {
  return (
    <Suspense fallback={null}>
      <NewDepositForm />
    </Suspense>
  );
}

function NewDepositForm() {
  const router = useRouter();
  const store = useWalletStore();
  const searchParams = useSearchParams();
  const editId = searchParams.get("edit");
  const editing = store.hydrated ? store.deposits.find((d) => d.id === editId) ?? null : null;
  const isEditMode = !!editId;

  const [title, setTitle] = useState("");
  const [currency, setCurrency] = useState("USD");
  const [amount, setAmount] = useState("");
  const [method, setMethod] = useState<PaymentMethod>("cash");
  const [cardId, setCardId] = useState<string | undefined>(undefined);
  const [dateGiven, setDateGiven] = useState(today());
  const [expectedReturnDate, setExpectedReturnDate] = useState("");
  const [notes, setNotes] = useState("");
  const [error, setError] = useState<string | null>(null);
  const prefilled = useRef(false);
  const currencyTouched = useRef(false);

  useEffect(() => {
    if (store.hydrated && !isEditMode && !currencyTouched.current) {
      setCurrency(store.localCurrency.currencyCode);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [store.hydrated, store.localCurrency.currencyCode, isEditMode]);

  useEffect(() => {
    if (editing && !prefilled.current) {
      prefilled.current = true;
      setTitle(editing.title);
      setCurrency(editing.currency);
      setAmount(String(editing.amount));
      setMethod(editing.paymentMethod === "credit" ? "credit" : "cash");
      setCardId(editing.cardId);
      setDateGiven(editing.dateGiven);
      setExpectedReturnDate(editing.expectedReturnDate ?? "");
      setNotes(editing.notes ?? "");
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [editing]);

  useEffect(() => {
    if (method === "credit" && !cardId && store.cards.length > 0) {
      setCardId(store.cards.find((c) => c.isPrimary)?.id ?? store.cards[0]!.id);
    }
    if (method !== "credit") setCardId(undefined);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [method, store.cards.length]);

  if (!store.hydrated) return null;
  if (isEditMode && !editing) return null;

  function handleSave() {
    if (!title.trim()) return setError("יש להזין שם לפיקדון (למשל: פיקדון מלון)");
    if (!(Number(amount) > 0)) return setError("יש להזין סכום גדול מ-0");
    setError(null);
    const patch = { title: title.trim(), currency, amount: Number(amount), paymentMethod: method, cardId, dateGiven, expectedReturnDate: expectedReturnDate || undefined, notes: notes || undefined };
    if (isEditMode && editing) {
      store.deleteDeposit(editing.id);
      store.addDeposit(patch);
    } else {
      store.addDeposit(patch);
    }
    router.push("/wallet/deposits");
  }

  function handleDelete() {
    if (!editing) return;
    if (!confirm(`למחוק את הפיקדון "${editing.title}"?${editing.status === "pending" ? " הסכום יוחזר לארנק." : ""}`)) return;
    store.deleteDeposit(editing.id);
    router.push("/wallet/deposits");
  }

  return (
    <ScreenShell>
      <ScreenHeader title={isEditMode ? "עריכת פיקדון" : "רישום פיקדון"} />
      <div style={{ fontSize: "11.5px", color: COLOR.textSecondary }}>
        לדוגמה: פיקדון שמלון או השכרת רכב מבקשים ומחזירים בסוף — לא הוצאה בפועל, אלא סכום שמוחזק זמנית.
      </div>

      <PillTabs options={METHOD_TABS} value={method} onChange={setMethod} />

      <div style={{ display: "flex", alignItems: "center", gap: SPACE.sm }}>
        <div style={{ width: "140px", flexShrink: 0 }}>
          <CurrencyPickerButton
            selectedCode={currency}
            onSelect={(c) => {
              currencyTouched.current = true;
              setCurrency(c);
            }}
            priorityCodes={defaultCurrencyPriority(store.localCurrency.currencyCode)}
          />
        </div>
        <input type="number" value={amount} onChange={(e) => setAmount(e.target.value)} placeholder="0" style={{ ...inputStyle, flex: 1, minWidth: 0, textAlign: "left", fontSize: "20px", fontWeight: 700 }} />
      </div>

      {method === "credit" ? (
        <div>
          <div style={{ fontSize: "12.5px", fontWeight: 600, color: COLOR.textSecondary, marginBottom: SPACE.sm }}>כרטיס אשראי</div>
          {store.cards.length === 0 ? (
            <div style={{ fontSize: "12px", color: COLOR.textSecondary }}>
              אין כרטיסי אשראי —{" "}
              <button type="button" onClick={() => router.push("/wallet/cards")} style={{ background: "none", border: "none", color: COLOR.primaryLight, fontSize: "12px", fontWeight: 700, cursor: "pointer", padding: 0 }}>
                הוספת כרטיס
              </button>
            </div>
          ) : (
            <div style={{ display: "flex", gap: SPACE.sm, overflowX: "auto" }}>
              {store.cards.map((c) => (
                <button
                  key={c.id}
                  type="button"
                  onClick={() => setCardId(c.id)}
                  style={{
                    flexShrink: 0,
                    padding: "9px 14px",
                    borderRadius: "12px",
                    background: cardId === c.id ? `${COLOR.primary}22` : COLOR.card,
                    border: `1px solid ${cardId === c.id ? COLOR.primary : COLOR.border}`,
                    color: cardId === c.id ? COLOR.primaryLight : COLOR.textSecondary,
                    fontSize: "12.5px",
                    fontWeight: 700,
                    cursor: "pointer",
                  }}
                >
                  {c.nickname} · {c.last4}
                </button>
              ))}
            </div>
          )}
        </div>
      ) : null}

      <Field label="עבור מה (למשל: פיקדון מלון בבנגקוק)">
        <input value={title} onChange={(e) => setTitle(e.target.value)} placeholder="פיקדון מלון / פיקדון רכב שכור" style={inputStyle} />
      </Field>

      <div style={{ display: "flex", gap: SPACE.sm }}>
        <div style={{ flex: 1 }}>
          <Field label="תאריך מתן הפיקדון">
            <input type="date" value={dateGiven} onChange={(e) => setDateGiven(e.target.value)} style={inputStyle} />
          </Field>
        </div>
        <div style={{ flex: 1 }}>
          <Field label="תאריך צפוי להחזר (לא חובה)">
            <input type="date" value={expectedReturnDate} onChange={(e) => setExpectedReturnDate(e.target.value)} style={inputStyle} />
          </Field>
        </div>
      </div>

      <Field label="הערות (אופציונלי)">
        <textarea value={notes} onChange={(e) => setNotes(e.target.value)} style={textareaStyle} />
      </Field>

      {error ? <div style={{ color: COLOR.danger, fontSize: "12.5px" }}>{error}</div> : null}
      <PrimaryButton onClick={handleSave}>{isEditMode ? "עדכון הפיקדון" : "רישום הפיקדון"}</PrimaryButton>
      {isEditMode ? (
        <button type="button" onClick={handleDelete} style={{ width: "100%", padding: "13px", borderRadius: "12px", background: "none", border: `1px solid ${COLOR.danger}55`, color: COLOR.danger, fontSize: "13.5px", fontWeight: 700, cursor: "pointer" }}>
          מחיקת הפיקדון
        </button>
      ) : null}
    </ScreenShell>
  );
}
