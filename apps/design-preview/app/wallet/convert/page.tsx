"use client";

import { Suspense, useEffect, useRef, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { ScreenShell, ScreenHeader, Card, Field, PrimaryButton, Money, COLOR, SPACE, inputStyle } from "../../design-system";
import { CurrencyPickerButton } from "../../pickers";
import { formatMoney, today, nowTime, defaultCurrencyPriority } from "../../wallet-data";
import { useWalletStore } from "../../wallet-store";

export default function ConvertScreen() {
  return (
    <Suspense fallback={null}>
      <ConvertForm />
    </Suspense>
  );
}

function ConvertForm() {
  const router = useRouter();
  const store = useWalletStore();
  const searchParams = useSearchParams();
  const editId = searchParams.get("edit");
  const editing = store.hydrated ? store.conversions.find((c) => c.id === editId) ?? null : null;
  const isEditMode = !!editId;

  const [from, setFrom] = useState("USD");
  const [to, setTo] = useState("JPY");
  const [fromAmount, setFromAmount] = useState(0);
  const [toAmount, setToAmount] = useState(0);
  const [date, setDate] = useState(today());
  const [time, setTime] = useState(nowTime());
  const [error, setError] = useState<string | null>(null);
  const prefilled = useRef(false);

  useEffect(() => {
    if (editing && !prefilled.current) {
      prefilled.current = true;
      setFrom(editing.fromCurrency);
      setTo(editing.toCurrency);
      setFromAmount(editing.fromAmount);
      setToAmount(editing.toAmount);
      const [d, t] = editing.dateTime.includes("T") ? editing.dateTime.split("T") : [editing.dateTime, nowTime()];
      setDate(d!);
      setTime((t ?? nowTime()).slice(0, 5));
    }
  }, [editing]);

  const marketRate = store.hydrated ? store.convertAmount(1, from, to) : null;
  const rateStillLoading = store.rates.status === "loading";
  const rateUnavailable = !rateStillLoading && marketRate == null;

  const effectiveToAmount = toAmount > 0 ? toAmount : marketRate != null ? Math.round(fromAmount * marketRate * 100) / 100 : 0;
  const fee = 12;

  if (!store.hydrated) return null;
  if (isEditMode && !editing) return null;

  const canSubmit = effectiveToAmount > 0 && fromAmount > 0;

  function handleSubmit() {
    if (!canSubmit) {
      if (rateStillLoading) return setError("שער ההמרה עדיין נטען — נסו שוב בעוד רגע");
      if (rateUnavailable) return setError(`אין שער חי זמין ל-${to} כרגע — יש להזין ידנית את הסכום שהתקבל בפועל בשדה "אל"`);
      return setError("יש להזין סכום תקין שיתקבל");
    }
    const dateTime = `${date}T${time}:00`;
    const ok = isEditMode
      ? store.updateConversion(editId!, from, fromAmount, to, effectiveToAmount, fee, "", dateTime)
      : store.convertCurrency(from, fromAmount, to, effectiveToAmount, fee, "", dateTime);
    if (!ok) return setError("היתרה במטבע המקור אינה מספיקה");
    router.push("/wallet");
  }

  function handleDelete() {
    if (!editing) return;
    if (!confirm(`למחוק את ההמרה ל-${to}?`)) return;
    store.deleteConversion(editing.id);
    router.push("/wallet");
  }

  return (
    <ScreenShell>
      <ScreenHeader title={isEditMode ? "עריכת המרה" : "המרת מטבע"} />

      <Card>
        <div style={{ fontSize: "11.5px", color: COLOR.textSecondary, marginBottom: SPACE.sm }}>מהם</div>
        <div style={{ display: "flex", alignItems: "center", gap: SPACE.sm }}>
          <CurrencyPickerButton selectedCode={from} onSelect={setFrom} priorityCodes={defaultCurrencyPriority(store.localCurrency.currencyCode)} />
          <input type="number" value={fromAmount || ""} onChange={(e) => setFromAmount(Number(e.target.value) || 0)} onFocus={(e) => e.target.select()} placeholder="0" style={{ ...inputStyle, width: "110px", textAlign: "left" }} />
        </div>
      </Card>

      <div style={{ textAlign: "center" }}>
        <button
          type="button"
          onClick={() => {
            setFrom(to);
            setTo(from);
          }}
          aria-label="החלפה"
          style={{ width: "40px", height: "40px", borderRadius: "50%", background: COLOR.primary, border: "none", color: "#fff", cursor: "pointer" }}
        >
          ⇅
        </button>
      </div>

      <Card>
        <div style={{ fontSize: "11.5px", color: COLOR.textSecondary, marginBottom: SPACE.sm }}>אל</div>
        <div style={{ display: "flex", alignItems: "center", gap: SPACE.sm }}>
          <CurrencyPickerButton selectedCode={to} onSelect={setTo} priorityCodes={defaultCurrencyPriority(store.localCurrency.currencyCode)} />
          <input type="number" value={effectiveToAmount || ""} onChange={(e) => setToAmount(Number(e.target.value))} onFocus={(e) => e.target.select()} style={{ ...inputStyle, width: "110px", textAlign: "left" }} />
        </div>
      </Card>

      {marketRate != null ? (
        <div style={{ fontSize: "11.5px", color: COLOR.textSecondary, textAlign: "center" }}>שער המרה: 1 {from} = {marketRate.toFixed(2)} {to}</div>
      ) : rateStillLoading ? (
        <div style={{ fontSize: "11.5px", color: COLOR.textSecondary, textAlign: "center" }}>טוען שער המרה...</div>
      ) : rateUnavailable ? (
        <div style={{ fontSize: "11.5px", color: COLOR.warning, textAlign: "center" }}>אין שער חי זמין ל-{to} כרגע — הזינו ידנית את הסכום שהתקבל בפועל</div>
      ) : null}

      <Card style={{ display: "flex", justifyContent: "space-between" }}>
        <span style={{ fontSize: "12px", color: COLOR.textSecondary }}>סכום שיתקבל</span>
        <span style={{ fontSize: "14px", fontWeight: 700, color: COLOR.textPrimary }}>
          <Money text={formatMoney(effectiveToAmount, to)} />
        </span>
      </Card>
      <div style={{ fontSize: "11px", color: COLOR.textSecondary, textAlign: "center" }}>עמלת המרה: ₪{fee}</div>

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

      {error ? <div style={{ color: COLOR.danger, fontSize: "12.5px", textAlign: "center" }}>{error}</div> : null}
      <PrimaryButton onClick={handleSubmit} disabled={!canSubmit}>{rateStillLoading && !canSubmit ? "טוען שער המרה..." : isEditMode ? "עדכון ההמרה" : "המר עכשיו"}</PrimaryButton>
      {isEditMode ? (
        <button type="button" onClick={handleDelete} style={{ width: "100%", padding: "13px", borderRadius: "12px", background: "none", border: `1px solid ${COLOR.danger}55`, color: COLOR.danger, fontSize: "13.5px", fontWeight: 700, cursor: "pointer" }}>
          מחיקת ההמרה
        </button>
      ) : null}
    </ScreenShell>
  );
}
