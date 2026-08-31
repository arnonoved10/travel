import Link from "next/link";
import type { Trip, Wallet } from "@travel-app/shared-types";
import { currencyFlagEmoji } from "@/lib/country-flags";
import { CURRENCY_NAMES } from "@/lib/currencies";

/** שורת-ארנקים ברמת-דשבורד: מטבע-היעד-המקומי קודם, ואז דולר/אירו/שקל (אותו
 * סדר-עדיפות בדיוק כמו CurrencySelect, ר' lib/preferred-currencies.ts) —
 * ומטבעות-נוספים שהמשתמש הוסיף בפועל, אחריהם. "נוצל" = initialAmount-
 * currentBalance (סכום-כל-מה-שהופקד-אי-פעם פחות מה-שנשאר) — נכון תמיד
 * לפי-הגדרה, לא תלוי בשיוך-הוצאות למטבע. הדגל-ענק-כרקע-שקוף הוא לפי המוקאפ —
 * לא תמונה מזויפת, רק אמוג'י-דגל אמיתי (country-flags.ts) בגודל דקורטיבי.
 * בלי פס-אחוז-נותר בכרטיס הזה (לפי המוקאפ — הכרטיסים כאן פשוטים, מספר גדול
 * בלבד): האחוז המדויק עדיין מוצג במקום ייעודי (StatCard "יתרת ארנק" למטה
 * ו-WalletSummaryCard), לא נמחק, רק לא כפול כאן. */
const NUMBER_TINTS = ["var(--color-success)", "var(--color-accent-blue)", "var(--color-text-primary)", "var(--color-accent-purple)"];

export function DashboardWalletsRow({ trip, wallets, preferredCurrencyCodes }: { trip: Trip; wallets: Wallet[]; preferredCurrencyCodes: string[] }) {
  if (wallets.length === 0) {
    return (
      <p style={{ margin: 0, color: "var(--color-text-muted)", font: "var(--text-caption)" }}>
        עדיין אין ארנק לטיול הזה — ארנק נוצר אוטומטית בהטענה או בהמרת-מטבע ראשונה.
      </p>
    );
  }

  const priority = new Map(preferredCurrencyCodes.map((code, i) => [code, i]));
  const sorted = [...wallets].sort((a, b) => (priority.get(a.currencyCode) ?? 999) - (priority.get(b.currencyCode) ?? 999));

  return (
    <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(210px, 1fr))", gap: "0.875rem" }}>
      {sorted.map((wallet, index) => {
        const flag = currencyFlagEmoji(wallet.currencyCode);
        const numberTint = NUMBER_TINTS[index % NUMBER_TINTS.length];
        return (
          <Link
            key={wallet.id}
            href={`/trips/${trip.id}#wallet`}
            className="ui-card-interactive"
            style={{
              position: "relative",
              display: "flex",
              flexDirection: "column",
              gap: "0.5rem",
              padding: "1.125rem 1.25rem",
              borderRadius: "var(--radius-lg)",
              border: "1px solid var(--color-border)",
              background: "var(--color-surface-elevated)",
              boxShadow: "var(--shadow-sm)",
              textDecoration: "none",
              color: "var(--color-text-primary)",
              overflow: "hidden",
            }}
          >
            {flag ? (
              <span
                aria-hidden
                style={{ position: "absolute", insetInlineEnd: "-0.75rem", top: "-1.25rem", fontSize: "6rem", opacity: 0.12, lineHeight: 1, pointerEvents: "none" }}
              >
                {flag}
              </span>
            ) : null}
            <span style={{ display: "flex", alignItems: "center", gap: "0.5rem", position: "relative" }}>
              {flag ? <span style={{ fontSize: "1.5rem" }} aria-hidden>{flag}</span> : null}
              <span style={{ font: "var(--text-caption)", color: "var(--color-text-muted)", fontWeight: 700 }}>
                {CURRENCY_NAMES[wallet.currencyCode] ?? wallet.currencyCode} ({wallet.currencyCode})
              </span>
            </span>
            <span style={{ font: "var(--text-metric)", fontSize: "1.75rem", position: "relative", color: numberTint }}>
              <span style={{ fontVariantNumeric: "tabular-nums" }}>{wallet.currentBalance.toLocaleString("he-IL")}</span>
            </span>
            <span style={{ font: "var(--text-caption)", color: "var(--color-text-muted)", position: "relative" }}>
              <span style={{ fontVariantNumeric: "tabular-nums" }}>יתרה התחלתית · {wallet.initialAmount.toLocaleString("he-IL")}</span>
            </span>
          </Link>
        );
      })}
    </div>
  );
}
