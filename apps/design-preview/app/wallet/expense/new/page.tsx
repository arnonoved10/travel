"use client";

import { Suspense, useEffect, useMemo, useRef, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { ScreenShell, ScreenHeader, PillTabs, IconPill, Field, PrimaryButton, CameraIcon, inputStyle, textareaStyle, COLOR, SPACE } from "../../../design-system";
import { CurrencyPickerButton } from "../../../pickers";
import { runDemoReceiptOcrAction } from "../../../actions";
import { compressImageFile, today, nowTime, defaultCurrencyPriority, allCategories, addCustomCategory, categoryColor, type Category, type PaymentMethod, type Expense } from "../../../wallet-data";
import { useWalletStore } from "../../../wallet-store";

const CATEGORY_COLOR: Record<string, string> = { מלון: COLOR.primary, מסעדות: COLOR.warning, תחבורה: "#4f8fe0", פעילויות: COLOR.success, קניות: "#e0699a", אחר: COLOR.textSecondary };
const METHOD_TABS: { key: PaymentMethod; label: string }[] = [
  { key: "cash", label: "מזומן" },
  { key: "credit", label: "כרטיס אשראי" },
];

/**
 * מסך "הוספת/עריכת הוצאה" (20) — הלוגיקה (כולל צילום-קבלה + OCR אמיתי דרך
 * Tesseract, ר' actions.ts) זהה-במדויק ללוגיקה שהייתה בחלונית-ההוצאה
 * הישנה בתוך wallet/page.tsx (חילוץ, לא שכתוב). מסך זה הוא כעת המקור היחיד
 * ליצירה *וגם* לעריכה (?edit=<id>) — הדיאלוג הישן ב-wallet/page.tsx הוסר
 * כדי שלא יהיו שני מימושים מקבילים שיכולים להתבדר זה מזה (בדיוק הבאג
 * שתוקן קודם בהמרת-מטבע).
 */
export default function AddExpenseScreen() {
  return (
    <Suspense fallback={null}>
      <AddExpenseForm />
    </Suspense>
  );
}

function AddExpenseForm() {
  const router = useRouter();
  const store = useWalletStore();
  const searchParams = useSearchParams();
  const editId = searchParams.get("edit");
  const editing = store.hydrated ? store.expenses.find((e) => e.id === editId) ?? null : null;
  const isEditMode = !!editId;

  const [title, setTitle] = useState("");
  const [merchant, setMerchant] = useState("");
  const [category, setCategory] = useState<Category>("אחר");
  const [categories, setCategories] = useState<Category[]>(["מלון", "מסעדות", "תחבורה", "פעילויות", "קניות", "אחר"]);
  const [addingCategory, setAddingCategory] = useState(false);
  const [newCategoryName, setNewCategoryName] = useState("");
  const [currency, setCurrency] = useState("USD");
  const [amount, setAmount] = useState("");
  const [tip, setTip] = useState("");
  const [tipMode, setTipMode] = useState<"included" | "separate">("included");
  const [date, setDate] = useState(today());
  const [time, setTime] = useState(nowTime());
  const [method, setMethod] = useState<PaymentMethod>("cash");
  const [cardId, setCardId] = useState<string | undefined>(undefined);
  const [notes, setNotes] = useState("");
  const [receiptDataUrl, setReceiptDataUrl] = useState<string | null>(null);
  const [ocrState, setOcrState] = useState<"idle" | "loading" | "done" | "error">("idle");
  const [autoFilled, setAutoFilled] = useState<string[]>([]);
  const [error, setError] = useState<string | null>(null);
  const cameraInputRef = useRef<HTMLInputElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const prefilled = useRef(false);
  const currencyTouched = useRef(false);

  useEffect(() => {
    if (typeof window !== "undefined" && window.location.search.includes("autoCamera=1")) {
      cameraInputRef.current?.click();
    }
  }, []);

  useEffect(() => {
    setCategories(allCategories());
  }, []);

  function handleAddCategory() {
    const name = newCategoryName.trim();
    if (!name) return;
    addCustomCategory(name);
    setCategories(allCategories());
    setCategory(name);
    setNewCategoryName("");
    setAddingCategory(false);
  }

  // ברירת-מחדל למטבע: המטבע המקומי של יעד הטיול הפעיל — רק אם המשתמש עוד
  // לא שינה אותו ידנית, ורק ביצירה חדשה (לא דורס עריכה קיימת).
  useEffect(() => {
    if (store.hydrated && !isEditMode && !currencyTouched.current) {
      setCurrency(store.localCurrency.currencyCode);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [store.hydrated, store.localCurrency.currencyCode, isEditMode]);

  // מילוי-מראש בעת עריכה
  useEffect(() => {
    if (editing && !prefilled.current) {
      prefilled.current = true;
      setTitle(editing.title);
      setMerchant(editing.merchant ?? "");
      setCategory(editing.category);
      setCurrency(editing.currency);
      setAmount(String(editing.amount));
      setTip(editing.tipAmount ? String(editing.tipAmount) : "");
      setDate(editing.date);
      setTime(editing.time ?? nowTime());
      setMethod(editing.paymentMethod === "credit" ? "credit" : "cash");
      setCardId(editing.cardId);
      setNotes(editing.notes ?? "");
      if (editing.receiptId && store.receipts[editing.receiptId]) setReceiptDataUrl(store.receipts[editing.receiptId]!);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [editing]);

  // ברירת-מחדל לכרטיס: הכרטיס הראשי (אם קיים) כשעוברים לתשלום באשראי
  useEffect(() => {
    if (method === "credit" && !cardId && store.cards.length > 0) {
      setCardId(store.cards.find((c) => c.isPrimary)?.id ?? store.cards[0]!.id);
    }
    if (method !== "credit") setCardId(undefined);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [method, store.cards.length]);

  async function handleReceiptFile(file: File) {
    setOcrState("loading");
    try {
      const compressed = await compressImageFile(file);
      setReceiptDataUrl(compressed);
      const base64 = compressed.split(",")[1] ?? "";
      const ocr = await runDemoReceiptOcrAction(base64, "image/jpeg");
      if (ocr.ok && ocr.fields.length > 0) {
        const filled: string[] = [];
        for (const f of ocr.fields) {
          if (!f.extractedValue) continue;
          const name = f.fieldName.toLowerCase();
          if ((name.includes("amount") || name.includes("total")) && !amount) {
            const num = f.extractedValue.replace(/[^\d.]/g, "");
            if (num) {
              setAmount(num);
              filled.push("סכום");
            }
          } else if ((name.includes("merchant") || name.includes("vendor")) && !merchant) {
            setMerchant(f.extractedValue);
            filled.push("בית עסק");
          }
        }
        setAutoFilled(filled);
        setOcrState("done");
      } else {
        setOcrState(ocr.ok ? "done" : "error");
      }
    } catch {
      setOcrState("error");
    }
  }

  // הוצאות קודמות לבחירה מהירה — שמות ייחודיים, האחרון-שנרשם מכל שם, כדי
  // שלא יצטרכו להקליד "עיסוי"/"מסאז'" מחדש בכל פעם שחוזרים על אותה הוצאה.
  const recentExpenseSuggestions = useMemo(() => {
    const seen = new Map<string, Expense>();
    for (const e of store.expenses) {
      const key = e.title.trim().toLowerCase();
      if (!key || seen.has(key)) continue;
      seen.set(key, e);
    }
    return Array.from(seen.values()).slice(0, 8);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [store.expenses.length]);

  function pickSuggestion(e: Expense) {
    setTitle(e.title);
    setCategory(e.category);
    setMerchant(e.merchant ?? "");
    setCurrency(e.currency);
    currencyTouched.current = true;
  }

  if (!store.hydrated) return null;
  if (isEditMode && !editing) return null;

  function handleSave() {
    if (!title.trim()) return setError("יש להזין שם הוצאה");
    if (!(Number(amount) > 0)) return setError("יש להזין סכום גדול מ-0");
    if (tipMode === "included" && tip && Number(tip) > Number(amount)) return setError("הטיפ לא יכול להיות גדול מהסכום הכולל");
    setError(null);
    // הטיפ נשמר תמיד כתת-סכום של amount (עקבי, לא משנה איך המשתמש הזין
    // אותו): במצב "בנפרד" מנרמלים על-ידי הוספת הטיפ ל-amount בזמן השמירה,
    // כדי שיתרת הארנק/כרטיס תרד בדיוק לפי מה שבאמת שולם.
    const tipValue = tip && Number(tip) > 0 ? Number(tip) : 0;
    const finalAmount = tipMode === "separate" ? Number(amount) + tipValue : Number(amount);
    store.saveExpense(
      { title: title.trim(), merchant: merchant || undefined, category, currency, amount: finalAmount, tipAmount: tipValue > 0 ? tipValue : undefined, date, time, paymentMethod: method, cardId, notes: notes || undefined },
      receiptDataUrl,
      editId ?? undefined
    );
    router.push("/wallet");
  }

  function handleDelete() {
    if (!editing) return;
    if (!confirm(`למחוק את ההוצאה "${editing.title}"?`)) return;
    store.deleteExpense(editing.id);
    router.push("/wallet");
  }

  return (
    <ScreenShell>
      <ScreenHeader title={isEditMode ? "עריכת הוצאה" : "הוספת הוצאה"} />

      {!isEditMode ? (
        <button
          type="button"
          onClick={() => router.push("/wallet/expense/batch")}
          style={{ background: "none", border: "none", color: COLOR.primaryLight, fontSize: "12px", fontWeight: 700, cursor: "pointer", padding: 0, textAlign: "start" }}
        >
          יש לי כמה הוצאות להזין ביחד ←
        </button>
      ) : null}

      {!isEditMode && recentExpenseSuggestions.length > 0 ? (
        <div>
          <div style={{ fontSize: "12.5px", fontWeight: 600, color: COLOR.textSecondary, marginBottom: SPACE.sm }}>מהוצאות קודמות</div>
          <div style={{ display: "flex", gap: SPACE.sm, overflowX: "auto" }}>
            {recentExpenseSuggestions.map((e) => (
              <button
                key={e.id}
                type="button"
                onClick={() => pickSuggestion(e)}
                style={{ flexShrink: 0, display: "flex", flexDirection: "column", alignItems: "flex-start", gap: "2px", padding: "8px 13px", borderRadius: "12px", background: COLOR.card, border: `1px solid ${COLOR.border}`, color: COLOR.textPrimary, cursor: "pointer" }}
              >
                <span style={{ fontSize: "12.5px", fontWeight: 700 }}>{e.title}</span>
                <span style={{ fontSize: "10px", color: COLOR.textSecondary }}>{e.category}</span>
              </button>
            ))}
          </div>
        </div>
      ) : null}

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

      <Field label="טיפ (אופציונלי)">
        <div style={{ display: "flex", gap: SPACE.sm }}>
          <input type="number" value={tip} onChange={(e) => setTip(e.target.value)} placeholder="0" style={{ ...inputStyle, flex: 1, textAlign: "left" }} />
          <div style={{ display: "flex", borderRadius: "12px", overflow: "hidden", border: `1px solid ${COLOR.border}`, flexShrink: 0 }}>
            <button
              type="button"
              onClick={() => setTipMode("included")}
              style={{ padding: "0 10px", border: "none", background: tipMode === "included" ? COLOR.primary : "transparent", color: tipMode === "included" ? "#fff" : COLOR.textSecondary, fontSize: "11px", fontWeight: 700, cursor: "pointer" }}
            >
              כלול בסכום
            </button>
            <button
              type="button"
              onClick={() => setTipMode("separate")}
              style={{ padding: "0 10px", border: "none", background: tipMode === "separate" ? COLOR.primary : "transparent", color: tipMode === "separate" ? "#fff" : COLOR.textSecondary, fontSize: "11px", fontWeight: 700, cursor: "pointer" }}
            >
              בנפרד
            </button>
          </div>
        </div>
        <div style={{ fontSize: "11px", color: COLOR.textSecondary, marginTop: "4px" }}>
          {tipMode === "included"
            ? "הסכום שלמעלה כולל את הטיפ (למשל: החשבון 100, מתוכם 10 טיפ)"
            : `הטיפ מתווסף לסכום שלמעלה${amount && tip ? ` — סה״כ ישולם: ${(Number(amount) + Number(tip)).toLocaleString()}` : ""}`}
        </div>
      </Field>

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

      <div>
        <div style={{ fontSize: "12.5px", fontWeight: 600, color: COLOR.textSecondary, marginBottom: SPACE.sm }}>קטגוריה</div>
        <div style={{ display: "flex", gap: SPACE.sm, overflowX: "auto" }}>
          {(categories.includes(category) ? categories : [...categories, category]).map((c) => (
            <IconPill
              key={c}
              label={c}
              icon={<span aria-hidden style={{ width: "14px", height: "14px", borderRadius: "50%", background: categoryColor(c, CATEGORY_COLOR) }} />}
              active={category === c}
              onClick={() => setCategory(c)}
            />
          ))}
          <IconPill label="+ חדשה" icon={<span style={{ fontSize: "14px", color: COLOR.textSecondary }}>+</span>} onClick={() => setAddingCategory(true)} />
        </div>
        {addingCategory ? (
          <div style={{ display: "flex", gap: SPACE.sm, marginTop: SPACE.sm }}>
            <input
              value={newCategoryName}
              onChange={(e) => setNewCategoryName(e.target.value)}
              placeholder="שם קטגוריה חדשה (למשל: מסאז')"
              autoFocus
              style={{ ...inputStyle, flex: 1 }}
              onKeyDown={(e) => {
                if (e.key === "Enter") handleAddCategory();
              }}
            />
            <button
              type="button"
              onClick={handleAddCategory}
              style={{ padding: "0 16px", borderRadius: "12px", background: COLOR.primary, border: "none", color: "#fff", fontSize: "13px", fontWeight: 700, cursor: "pointer" }}
            >
              הוספה
            </button>
          </div>
        ) : null}
      </div>

      <Field label="שם ההוצאה">
        <input value={title} onChange={(e) => setTitle(e.target.value)} placeholder="לדוגמה: מסעדת רעמן" style={inputStyle} />
      </Field>

      <div style={{ display: "flex", gap: SPACE.sm }}>
        <div style={{ flex: 1 }}>
          <Field label="תאריך">
            <input type="date" value={date} onChange={(e) => setDate(e.target.value)} style={inputStyle} />
          </Field>
        </div>
        <div style={{ flex: 1 }}>
          <Field label="שעה">
            <input type="time" value={time} onChange={(e) => setTime(e.target.value)} style={inputStyle} />
          </Field>
        </div>
      </div>

      <Field label="הערות (אופציונלי)">
        <textarea value={notes} onChange={(e) => setNotes(e.target.value)} style={textareaStyle} />
      </Field>

      <Field label="צרף קבלה">
        {receiptDataUrl ? (
          <div>
            <img src={receiptDataUrl} alt="קבלה" style={{ width: "100%", maxHeight: "180px", objectFit: "contain", borderRadius: "12px", background: "#000" }} />
            {ocrState === "loading" ? <div style={{ fontSize: "11px", color: COLOR.textSecondary, marginTop: "6px" }}>מזהה פרטים מהקבלה...</div> : null}
            {ocrState === "done" && autoFilled.length > 0 ? <div style={{ fontSize: "11px", color: COLOR.success, marginTop: "6px" }}>זוהו אוטומטית: {autoFilled.join(", ")} — יש לוודא שהערכים נכונים</div> : null}
            {ocrState === "error" ? <div style={{ fontSize: "11px", color: COLOR.textSecondary, marginTop: "6px" }}>לא זוהו פרטים אוטומטית — נא להזין ידנית</div> : null}
          </div>
        ) : (
          <div style={{ display: "flex", gap: SPACE.sm }}>
            <button type="button" onClick={() => cameraInputRef.current?.click()} style={{ flex: 1, display: "flex", alignItems: "center", justifyContent: "center", gap: "6px", padding: "11px", borderRadius: "12px", background: `${COLOR.primary}22`, border: `1px solid ${COLOR.primary}55`, color: COLOR.primaryLight, fontSize: "12.5px", fontWeight: 700, cursor: "pointer" }}>
              <CameraIcon size={16} color={COLOR.primaryLight} />
              צילום קבלה
            </button>
            <button type="button" onClick={() => fileInputRef.current?.click()} style={{ flex: 1, padding: "11px", borderRadius: "12px", background: COLOR.card, border: `1px solid ${COLOR.border}`, color: COLOR.textPrimary, fontSize: "12.5px", fontWeight: 700, cursor: "pointer" }}>
              בחירת תמונה קיימת
            </button>
          </div>
        )}
        <input ref={cameraInputRef} type="file" accept="image/*" capture="environment" style={{ display: "none" }} onChange={(e) => { const f = e.target.files?.[0]; if (f) handleReceiptFile(f); e.target.value = ""; }} />
        <input ref={fileInputRef} type="file" accept="image/*" style={{ display: "none" }} onChange={(e) => { const f = e.target.files?.[0]; if (f) handleReceiptFile(f); e.target.value = ""; }} />
      </Field>

      {error ? <div style={{ color: COLOR.danger, fontSize: "12.5px" }}>{error}</div> : null}
      <PrimaryButton onClick={handleSave}>{isEditMode ? "עדכון הוצאה" : "שמור הוצאה"}</PrimaryButton>
      {isEditMode ? (
        <button type="button" onClick={handleDelete} style={{ width: "100%", padding: "13px", borderRadius: "12px", background: "none", border: `1px solid ${COLOR.danger}55`, color: COLOR.danger, fontSize: "13.5px", fontWeight: 700, cursor: "pointer" }}>
          מחיקת ההוצאה
        </button>
      ) : null}
    </ScreenShell>
  );
}
