"use client";

import { useState, useTransition } from "react";
import { convertCurrencyAction } from "@/app/(app)/trips/[tripId]/finances/actions";

const inputStyle: React.CSSProperties = {
  padding: "0.5rem 0.75rem",
  borderRadius: "var(--radius-md)",
  border: "1px solid var(--color-border)",
  background: "var(--color-surface-elevated)",
  color: "var(--color-text-primary)",
};

/** ממיר מהיר בין שני מטבעות — לחישוב מנטלי מהיר תוך כדי קניות, לא קשור ליתרת הארנק. */
export function CurrencyQuickConverter() {
  const [amount, setAmount] = useState("100");
  const [fromCurrency, setFromCurrency] = useState("THB");
  const [toCurrency, setToCurrency] = useState("ILS");
  const [result, setResult] = useState<number | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();

  function handleConvert() {
    setError(null);
    const parsedAmount = Number(amount);
    if (!Number.isFinite(parsedAmount) || parsedAmount < 0 || !fromCurrency || !toCurrency) {
      setError("יש למלא סכום וקודי מטבע תקינים.");
      return;
    }
    startTransition(async () => {
      const response = await convertCurrencyAction(parsedAmount, fromCurrency, toCurrency);
      if (!response.ok) {
        setError(response.error);
        setResult(null);
        return;
      }
      setResult(response.result);
    });
  }

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: "0.5rem" }}>
      <div style={{ display: "flex", gap: "0.5rem", flexWrap: "wrap", alignItems: "center" }}>
        <input
          type="number"
          min="0"
          step="0.01"
          value={amount}
          onChange={(e) => setAmount(e.target.value)}
          style={{ ...inputStyle, maxWidth: "110px" }}
        />
        <input
          value={fromCurrency}
          onChange={(e) => setFromCurrency(e.target.value.toUpperCase())}
          maxLength={3}
          placeholder="מ-(THB)"
          style={{ ...inputStyle, maxWidth: "80px" }}
        />
        <span style={{ color: "var(--color-text-muted)" }}>→</span>
        <input
          value={toCurrency}
          onChange={(e) => setToCurrency(e.target.value.toUpperCase())}
          maxLength={3}
          placeholder="ל-(ILS)"
          style={{ ...inputStyle, maxWidth: "80px" }}
        />
        <button
          type="button"
          onClick={handleConvert}
          disabled={isPending}
          style={{
            padding: "0.5rem 0.875rem",
            borderRadius: "var(--radius-full)",
            border: "none",
            background: isPending ? "var(--color-secondary)" : "var(--gradient-brand)",
            color: isPending ? "var(--color-text-muted)" : "#fff",
            fontWeight: 700,
            cursor: isPending ? "default" : "pointer",
            boxShadow: isPending ? "none" : "var(--glow-brand)",
            transition: "all var(--duration-base) var(--ease-out)",
          }}
        >
          {isPending ? "ממיר…" : "המר"}
        </button>
      </div>
      {result !== null ? (
        <p style={{ margin: 0, fontWeight: 600 }}>
          {amount} {fromCurrency} ≈ {result.toFixed(2)} {toCurrency}
        </p>
      ) : null}
      {error ? <span style={{ color: "var(--color-danger)", fontSize: "0.8125rem" }}>{error}</span> : null}
    </div>
  );
}
