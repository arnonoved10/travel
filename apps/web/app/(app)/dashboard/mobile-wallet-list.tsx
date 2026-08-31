import Link from "next/link";
import type { Trip, Wallet } from "@travel-app/shared-types";
import { currencyFlagEmoji } from "@/lib/country-flags";
import { CURRENCY_NAMES } from "@/lib/currencies";
import { DashboardCard } from "./dashboard-card";

/** ארנק קומפקטי למובייל — אותם נתונים ואותו סדר-עדיפות בדיוק כמו
 * dashboard-wallets-row.tsx (מטבע-היעד-המקומי קודם, ואז דולר/אירו/שקל),
 * אבל כרשימת-שורות צפופה במקום רשת-כרטיסים גדולה (בקשת משתמש: "ארנק
 * קומפקטי ונוח... בכל מטבע הצג כמה היה בהתחלה, כמה נשאר ואחוז היתרה"). */
export function MobileWalletList({ trip, wallets, preferredCurrencyCodes }: { trip: Trip; wallets: Wallet[]; preferredCurrencyCodes: string[] }) {
  return (
    <DashboardCard
      title="הארנקים שלי"
      action={
        <Link href={`/trips/${trip.id}#wallet`} style={{ font: "var(--text-caption)", color: "var(--color-primary)", fontWeight: 700 }}>
          ניהול ←
        </Link>
      }
    >
      {wallets.length === 0 ? (
        <p style={{ margin: 0, color: "var(--color-text-muted)", font: "var(--text-caption)" }}>
          עדיין אין ארנק לטיול הזה — ארנק נוצר אוטומטית בהטענה או בהמרת-מטבע ראשונה.
        </p>
      ) : (
        renderRows(trip, wallets, preferredCurrencyCodes)
      )}
    </DashboardCard>
  );
}

function renderRows(trip: Trip, wallets: Wallet[], preferredCurrencyCodes: string[]) {
  const priority = new Map(preferredCurrencyCodes.map((code, i) => [code, i]));
  const sorted = [...wallets].sort((a, b) => (priority.get(a.currencyCode) ?? 999) - (priority.get(b.currencyCode) ?? 999));

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: "0.75rem" }}>
      {sorted.map((wallet, index) => {
        const flag = currencyFlagEmoji(wallet.currencyCode);
        const percentRemaining = wallet.initialAmount > 0 ? Math.round((wallet.currentBalance / wallet.initialAmount) * 100) : null;
        return (
          <div key={wallet.id} style={{ display: "flex", flexDirection: "column", gap: "0.375rem" }}>
            <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: "0.5rem" }}>
              <span style={{ display: "flex", alignItems: "center", gap: "0.5rem", font: "var(--text-caption)", fontWeight: 700 }}>
                {flag ? <span style={{ fontSize: "1.25rem" }} aria-hidden>{flag}</span> : null}
                {CURRENCY_NAMES[wallet.currencyCode] ?? wallet.currencyCode} ({wallet.currencyCode})
              </span>
              <span style={{ font: "var(--text-h3)", fontVariantNumeric: "tabular-nums" }}>{wallet.currentBalance.toLocaleString("he-IL")}</span>
            </div>
            {percentRemaining !== null ? (
              <div style={{ height: "6px", borderRadius: "var(--radius-full)", background: "var(--color-surface)", overflow: "hidden" }}>
                <div style={{ height: "100%", width: `${Math.max(0, Math.min(100, percentRemaining))}%`, borderRadius: "var(--radius-full)", background: "var(--gradient-brand)" }} />
              </div>
            ) : null}
            <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", font: "var(--text-caption)", color: "var(--color-text-muted)" }}>
              <span>התחלתי ב-{wallet.initialAmount.toLocaleString("he-IL")}</span>
              {percentRemaining !== null ? <span style={{ fontWeight: 700 }}>{percentRemaining}% נותר</span> : null}
            </div>
            {index < sorted.length - 1 ? <div style={{ height: 1, background: "var(--color-border)", marginTop: "0.125rem" }} /> : null}
          </div>
        );
      })}
    </div>
  );
}
