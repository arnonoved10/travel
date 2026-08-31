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

  const effectiveToAmount = toAmount > 0 ? toAmount : marketRate != null ? Math.round(fromAmount * marketRate * 100) / 100 : 0;
  const fee = 12;

  if (!store.hydrated) return null;

  function handleSubmit() {
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

      {marketRate != null ? <div style={{ fontSize: "11.5px", color: COLOR.textSecondary, textAlign: "center" }}>שער המרה: 1 {from} = {marketRate.toFixed(2)} {to}</div> : null}

      <Card style={{ display: "flex", justifyContent: "space-between" }}>
        <span style={{ fontSize: "12px", color: COLOR.textSecondary }}>סכום שיתקבל</span>
        <span style={{ fontSize: "14px", fontWeight: 700, color: COLOR.textPrimary }}>
          <Money text={formatMoney(effectiveToAmount, to)} />
        </span>
      </Card>
      <div style={{ fontSize: "11px", color: COLOR.textSecondary, textAlign: "center" }}>עמלת המרה: ₪{fee}</div>

      {error ? <div style={{ color: COLOR.danger, fontSize: "12.5px", textAlign: "center" }}>{error}</div> : null}
      <PrimaryButton onClick={handleSubmit}>המר עכשיו</PrimaryButton>
    </ScreenShell>
  );
}
