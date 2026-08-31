"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { ScreenShell, ScreenHeader, PrimaryButton, COLOR, SPACE, RADIUS } from "../../design-system";
import { CurrencyPickerButton } from "../../pickers";
import { MONEY_SOURCE_LABEL, formatMoney, today, type MoneySource } from "../../wallet-data";
import { useWalletStore } from "../../wallet-store";

const QUICK_AMOUNTS = [500, 1000, 2000, 5000];
const SOURCES: MoneySource[] = ["cash_from_home", "atm_withdrawal", "transfer", "refund", "extra_income", "other"];

export default function AddMoneyScreen() {
  const router = useRouter();
  const store = useWalletStore();
  const [currency, setCurrency] = useState("ILS");
  const [amount, setAmount] = useState(0);
  const [source, setSource] = useState<MoneySource>("cash_from_home");

  if (!store.hydrated) return null;

  function handleSubmit() {
    if (amount <= 0) return;
    store.addMoney(currency, amount, source, today(), "");
    router.push("/wallet");
  }

  return (
    <ScreenShell>
      <ScreenHeader title="הוספת כסף" />
      <CurrencyPickerButton selectedCode={currency} onSelect={(c) => setCurrency(c)} priorityCodes={store.balances.map((b) => b.code)} />

      <div style={{ textAlign: "center", padding: `${SPACE.xl}px 0` }}>
        <input
          type="number"
          inputMode="decimal"
          value={amount || ""}
          onChange={(e) => setAmount(Number(e.target.value) || 0)}
          placeholder="0"
          style={{
            width: "100%",
            textAlign: "center",
            fontSize: "36px",
            fontWeight: 700,
            color: COLOR.textPrimary,
            background: "transparent",
            border: "none",
            outline: "none",
          }}
        />
        {amount > 0 ? <div style={{ fontSize: "13px", color: COLOR.textSecondary, marginTop: SPACE.xs }}>{formatMoney(amount, currency)}</div> : null}
      </div>

      <div style={{ display: "flex", gap: SPACE.sm }}>
        {QUICK_AMOUNTS.map((q) => (
          <button
            key={q}
            type="button"
            onClick={() => setAmount((a) => a + q)}
            style={{ flex: 1, padding: "10px 0", borderRadius: `${RADIUS.pill}px`, background: COLOR.card, border: `1px solid ${COLOR.border}`, color: COLOR.textPrimary, fontSize: "13px", fontWeight: 700, cursor: "pointer" }}
          >
            {q.toLocaleString()}
          </button>
        ))}
      </div>

      <div>
        <div style={{ fontSize: "12.5px", fontWeight: 600, color: COLOR.textSecondary, marginBottom: SPACE.sm }}>שיטת פעולה</div>
        <div style={{ display: "flex", flexDirection: "column", gap: SPACE.xs }}>
          {SOURCES.map((s) => (
            <label key={s} style={{ display: "flex", alignItems: "center", gap: SPACE.sm, padding: "10px 12px", borderRadius: "12px", background: COLOR.card, border: `1px solid ${source === s ? COLOR.primary : COLOR.border}`, cursor: "pointer" }}>
              <input type="radio" checked={source === s} onChange={() => setSource(s)} />
              <span style={{ fontSize: "13px", color: COLOR.textPrimary }}>{MONEY_SOURCE_LABEL[s]}</span>
            </label>
          ))}
        </div>
      </div>

      <PrimaryButton onClick={handleSubmit} disabled={amount <= 0}>
        הוספת כסף
      </PrimaryButton>
    </ScreenShell>
  );
}
