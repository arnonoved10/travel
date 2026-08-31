"use client";

import { useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { ScreenShell, ScreenHeader, PillTabs, IconPill, Field, PrimaryButton, CameraIcon, inputStyle, textareaStyle, COLOR, SPACE } from "../../../design-system";
import { CurrencyPickerButton } from "../../../pickers";
import { runDemoReceiptOcrAction } from "../../../actions";
import { compressImageFile, today, type Category, type PaymentMethod } from "../../../wallet-data";
import { useWalletStore } from "../../../wallet-store";

const CATEGORIES: Category[] = ["מלון", "מסעדות", "תחבורה", "פעילויות", "קניות", "אחר"];
const METHOD_TABS: { key: PaymentMethod; label: string }[] = [
  { key: "cash", label: "מזומן" },
  { key: "credit", label: "כרטיס אשראי" },
];

/**
 * מסך "הוספת הוצאה" (20) — הלוגיקה (כולל צילום-קבלה + OCR אמיתי דרך
 * Tesseract, ר' actions.ts) זהה-במדויק ללוגיקה שהייתה בחלונית-ההוצאה
 * הישנה בתוך wallet/page.tsx (חילוץ, לא שכתוב).
 */
export default function AddExpenseScreen() {
  const router = useRouter();
  const store = useWalletStore();
  const [title, setTitle] = useState("");
  const [merchant, setMerchant] = useState("");
  const [category, setCategory] = useState<Category>("אחר");
  const [currency, setCurrency] = useState("JPY");
  const [amount, setAmount] = useState("");
  const [date, setDate] = useState(today());
  const [method, setMethod] = useState<PaymentMethod>("cash");
  const [notes, setNotes] = useState("");
  const [receiptDataUrl, setReceiptDataUrl] = useState<string | null>(null);
  const [ocrState, setOcrState] = useState<"idle" | "loading" | "done" | "error">("idle");
  const [autoFilled, setAutoFilled] = useState<string[]>([]);
  const [error, setError] = useState<string | null>(null);
  const cameraInputRef = useRef<HTMLInputElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (typeof window !== "undefined" && window.location.search.includes("autoCamera=1")) {
      cameraInputRef.current?.click();
    }
  }, []);

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

  if (!store.hydrated) return null;

  function handleSave() {
    if (!title.trim()) return setError("יש להזין שם הוצאה");
    if (!(Number(amount) > 0)) return setError("יש להזין סכום גדול מ-0");
    setError(null);
    store.saveExpense({ title: title.trim(), merchant: merchant || undefined, category, currency, amount: Number(amount), date, paymentMethod: method, cardId: undefined }, receiptDataUrl);
    router.push("/wallet");
  }

  return (
    <ScreenShell>
      <ScreenHeader title="הוספת הוצאה" />
      <PillTabs options={METHOD_TABS} value={method} onChange={setMethod} />

      <div style={{ display: "flex", alignItems: "center", gap: SPACE.sm }}>
        <div style={{ width: "140px", flexShrink: 0 }}>
          <CurrencyPickerButton selectedCode={currency} onSelect={setCurrency} priorityCodes={store.balances.map((b) => b.code)} />
        </div>
        <input type="number" value={amount} onChange={(e) => setAmount(e.target.value)} placeholder="0" style={{ ...inputStyle, flex: 1, minWidth: 0, textAlign: "left", fontSize: "20px", fontWeight: 700 }} />
      </div>

      <div>
        <div style={{ fontSize: "12.5px", fontWeight: 600, color: COLOR.textSecondary, marginBottom: SPACE.sm }}>קטגוריה</div>
        <div style={{ display: "flex", gap: SPACE.sm, overflowX: "auto" }}>
          {CATEGORIES.map((c) => (
            <IconPill key={c} label={c} icon={<CameraIcon size={16} color={category === c ? COLOR.primaryLight : COLOR.textSecondary} />} active={category === c} onClick={() => setCategory(c)} />
          ))}
        </div>
      </div>

      <Field label="שם ההוצאה">
        <input value={title} onChange={(e) => setTitle(e.target.value)} placeholder="לדוגמה: מסעדת רעמן" style={inputStyle} />
      </Field>

      <Field label="תאריך">
        <input type="date" value={date} onChange={(e) => setDate(e.target.value)} style={inputStyle} />
      </Field>

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
      <PrimaryButton onClick={handleSave}>שמור הוצאה</PrimaryButton>
    </ScreenShell>
  );
}
