import type { SettleUpBalance } from "@/lib/settle-up";

function formatILS(amount: number): string {
  return `₪${Math.round(Math.abs(amount)).toLocaleString("he-IL")}`;
}

export function SettleUpSection({ balances, unconvertedCurrencyCodes }: { balances: SettleUpBalance[]; unconvertedCurrencyCodes: string[] }) {
  if (balances.length === 0) return null;

  return (
    <section
      id="settle-up"
      style={{
        padding: "1rem",
        borderRadius: "10px",
        border: "1px solid var(--color-border)",
        display: "flex",
        flexDirection: "column",
        gap: "0.5rem",
      }}
    >
      <h2 style={{ fontSize: "1.125rem", margin: 0 }}>💰 סגירת חשבונות</h2>
      <p style={{ fontSize: "0.75rem", color: "var(--color-text-muted)", margin: 0 }}>
        רק הוצאות שסימנת בהן משתתפים נכללות כאן. חלוקה שווה בין המשתתפים ובעל החשבון.
      </p>
      <ul style={{ listStyle: "none", margin: 0, padding: 0, display: "flex", flexDirection: "column", gap: "0.375rem" }}>
        {balances.map((balance) => (
          <li key={balance.companionId} style={{ display: "flex", justifyContent: "space-between", fontSize: "0.875rem" }}>
            <span>{balance.displayName}</span>
            {balance.netAmount > 0.5 ? (
              <span style={{ color: "var(--color-success, green)" }}>מגיע ל{balance.displayName} {formatILS(balance.netAmount)}</span>
            ) : balance.netAmount < -0.5 ? (
              <span style={{ color: "var(--color-danger)" }}>{balance.displayName} חייב/ת {formatILS(balance.netAmount)}</span>
            ) : (
              <span style={{ color: "var(--color-text-muted)" }}>מאוזן</span>
            )}
          </li>
        ))}
      </ul>
      {unconvertedCurrencyCodes.length > 0 ? (
        <p style={{ fontSize: "0.75rem", color: "var(--color-text-muted)", margin: 0 }}>
          לא נכלל בחישוב: הוצאות במטבע {unconvertedCurrencyCodes.join(", ")} — לא נמצא עבורן שער חליפין זמין כרגע.
        </p>
      ) : null}
    </section>
  );
}
