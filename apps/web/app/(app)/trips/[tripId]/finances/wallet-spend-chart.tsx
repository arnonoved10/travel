import type { Wallet, Expense } from "@travel-app/shared-types";

/** תרשים-עמודות פשוט (SVG/CSS, בלי ספריית-גרפים) — הוצאה לפי מטבע, אחד ליד
 * השני, כדי לענות על "כמה הוצאתי בכל מטבע" במבט אחד כשיש כמה ארנקים. */
export function WalletSpendChart({ wallets, expenses }: { wallets: Wallet[]; expenses: Expense[] }) {
  const rows = wallets
    .map((wallet) => ({
      currencyCode: wallet.currencyCode,
      spent: expenses.filter((e) => e.currencyCode === wallet.currencyCode).reduce((sum, e) => sum + e.amount, 0),
    }))
    .filter((row) => row.spent > 0);

  if (rows.length === 0) return null;

  const max = Math.max(...rows.map((row) => row.spent));

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: "0.375rem", marginBottom: "0.75rem" }}>
      {rows.map((row) => (
        <div key={row.currencyCode} style={{ display: "flex", alignItems: "center", gap: "0.5rem" }}>
          <span style={{ fontSize: "0.75rem", color: "var(--color-text-muted)", width: "3.5rem", flexShrink: 0 }}>{row.currencyCode}</span>
          <div style={{ flex: 1, background: "var(--color-surface)", borderRadius: "var(--radius-sm)", overflow: "hidden", height: "0.75rem" }}>
            <div
              style={{
                width: `${(row.spent / max) * 100}%`,
                height: "100%",
                background: "var(--gradient-brand)",
                borderRadius: "var(--radius-sm)",
              }}
            />
          </div>
          <span style={{ fontSize: "0.75rem", color: "var(--color-text-muted)", flexShrink: 0 }}>{row.spent.toLocaleString("he-IL")}</span>
        </div>
      ))}
    </div>
  );
}
