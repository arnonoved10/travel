"use client";

import { useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { ScreenShell, ScreenHeader, Card, PrimaryButton, Money, COLOR, SPACE, inputStyle } from "../../design-system";
import { CurrencyPickerButton } from "../../pickers";
import { formatMoney, today } from "../../wallet-data";
import { useWalletStore } from "../../wallet-store";

export default function ConvertScreen() {
  const router = useRouter();
  const store = useWalletStore();
  const [from, setFrom] = useState("USD");
  const [to, setTo] = useState("JPY");
  const [fromAmount, setFromAmount] = useState(500);
  const [toAmount, setToAmount] = useState(0);
  const [error, setError] = useState<string | null>(null);

  const marketRate = store.hydrated ? store.convertAmount(1, from, to) : null;
  const rateStillLoading = store.rates.status === "loading";
  const rateUnavailable = !rateStillLoading && marketRate == null;

  const effectiveToAmount = toAmount > 0 ? toAmount : marketRate != null ? Math.round(fromAmount * marketRate * 100) / 100 : 0;
  const fee = 12;

  if (!store.hydrated) return null;

  const canSubmit = effectiveToAmount > 0 && fromAmount > 0;

  function handleSubmit() {
    if (!canSubmit) {
      if (rateStillLoading) return setError("שער ההמרה עדיין נטען — נסו שוב בעוד רגע");
      if (rateUnavailable) return setError(`אין שער חי זמין ל-${to} כרגע — יש להזין ידנית את הסכום שהתקבל בפועל בשדה "אל"`);
      return setError("יש להזין סכום תקין שיתקבל");
    }
    const ok = store.convertCurrency(from, fromAmount, to, effectiveToAmount, fee, "", new Date().toISOString());
    if (!ok) return setError("היתרה במטבע המקור אינה מספיקה");
    router.push("/wallet");
  }

  return (
    <ScreenShell>
      <ScreenHeader title="המרת מטבע" />

      <Card>
        <div style={{ fontSize: "11.5px", color: COLOR.textSecondary, marginBottom: SPACE.sm }}>מהם</div>
        <div style={{ display: "flex", alignItems: "center", gap: SPACE.sm }}>
          <CurrencyPickerButton selectedCode={from} onSelect={setFrom} priorityCodes={store.balances.map((b) => b.code)} />
          <input type="number" value={fromAmount} onChange={(e) => setFromAmount(Number(e.target.value))} style={{ ...inputStyle, width: "110px", textAlign: "left" }} />
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
          <CurrencyPickerButton selectedCode={to} onSelect={setTo} priorityCodes={store.balances.map((b) => b.code)} />
          <input type="number" value={effectiveToAmount || ""} onChange={(e) => setToAmount(Number(e.target.value))} style={{ ...inputStyle, width: "110px", textAlign: "left" }} />
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

      {error ? <div style={{ color: COLOR.danger, fontSize: "12.5px", textAlign: "center" }}>{error}</div> : null}
      <PrimaryButton onClick={handleSubmit} disabled={!canSubmit}>{rateStillLoading && !canSubmit ? "טוען שער המרה..." : "המר עכשיו"}</PrimaryButton>
    </ScreenShell>
  );
}
