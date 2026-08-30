"use client";

import { useRouter } from "next/navigation";
import { ScreenShell, ScreenHeader, BottomNav, Card, ElevatedCard, PrimaryButton, SecondaryButton, Money, COLOR, SPACE, ChevronIcon } from "../design-system";
import { FlagIcon } from "../country-currency-data";
import { primaryCountryForCurrency, formatMoney, currencyMeta } from "../wallet-data";
import { useWalletStore } from "../wallet-store";
import { ToastBar } from "../toast-bar";

/**
 * מסך "הארנק שלי" (16) — נקודת-הכניסה לכל אשכול-הארנק. הלוגיקה (יתרות,
 * שערים, תנועות) מגיעה מ-useWalletStore (זהה ל-100% ללוגיקה שהייתה בגרסה
 * הקודמת של מסך זה) — כאן רק מבנה-התצוגה החדש לפי חבילת-העיצוב המחייבת.
 * טאבים/חלוניות ישנים פוצלו למסכים נפרדים: /wallet/currency/[code],
 * /wallet/add, /wallet/convert, /wallet/expense/new, /wallet/expense/scan,
 * /wallet/cards, /wallet/history.
 */
export default function WalletHomeScreen() {
  const router = useRouter();
  const store = useWalletStore();
  const { balances, totalConvertedToBase, baseCurrency, additions, conversions, expenses, toast } = store;

  const recentActivity = [
    ...additions.map((a) => ({ id: a.id, date: a.date, label: currencyMeta(a.currency).name, amount: a.amount, currency: a.currency })),
    ...conversions.map((c) => ({ id: c.id, date: c.dateTime.slice(0, 10), label: `המרה ל-${currencyMeta(c.toCurrency).name}`, amount: -c.fromAmount, currency: c.fromCurrency })),
    ...expenses.map((e) => ({ id: e.id, date: e.date, label: e.title, amount: -e.amount, currency: e.currency })),
  ]
    .sort((a, b) => (a.date < b.date ? 1 : -1))
    .slice(0, 5);

  if (!store.hydrated) return null;

  return (
    <ScreenShell>
      <ScreenHeader title="הארנק שלי" />

      <ElevatedCard style={{ background: `linear-gradient(160deg, ${COLOR.success}22, ${COLOR.cardElevated})`, border: `1px solid ${COLOR.success}55` }}>
        <div style={{ fontSize: "12px", color: COLOR.textSecondary, marginBottom: "6px" }}>יתרה כוללת</div>
        <div style={{ fontSize: "26px", fontWeight: 700, color: COLOR.textPrimary }}><Money text={formatMoney(totalConvertedToBase, baseCurrency)} /></div>
        <div style={{ fontSize: "11px", color: COLOR.textSecondary, marginTop: "6px" }}>מעודכן היום, {new Date().toLocaleTimeString("he-IL", { hour: "2-digit", minute: "2-digit" })}</div>
      </ElevatedCard>

      <div>
        <div style={{ fontSize: "14px", fontWeight: 700, color: COLOR.textPrimary, marginBottom: SPACE.sm }}>מטבעות</div>
        <div style={{ display: "flex", flexDirection: "column", gap: SPACE.sm }}>
          {balances.map((b) => {
            const country = primaryCountryForCurrency(b.code);
            return (
              <Card key={b.code} onClick={() => router.push(`/wallet/currency/${b.code}`)} style={{ display: "flex", alignItems: "center", gap: SPACE.md, padding: "12px 14px" }}>
                {country ? <FlagIcon countryCode={country.code} size={26} /> : null}
                <div style={{ flex: 1 }}>
                  <div style={{ fontSize: "13.5px", fontWeight: 700, color: COLOR.textPrimary }}>{b.code}</div>
                </div>
                <div style={{ fontSize: "14px", fontWeight: 700, color: COLOR.textPrimary }}><Money text={formatMoney(b.balance, b.code)} /></div>
                <ChevronIcon />
              </Card>
            );
          })}
        </div>
      </div>

      <div>
        <div style={{ fontSize: "14px", fontWeight: 700, color: COLOR.textPrimary, marginBottom: SPACE.sm }}>תנועות אחרונות</div>
        {recentActivity.length === 0 ? (
          <Card style={{ textAlign: "center", color: COLOR.textSecondary, fontSize: "12.5px" }}>אין עדיין תנועות</Card>
        ) : (
          <div style={{ display: "flex", flexDirection: "column", gap: SPACE.xs }}>
            {recentActivity.map((item) => (
              <div key={item.id} style={{ display: "flex", alignItems: "center", justifyContent: "space-between", padding: "8px 4px" }}>
                <div style={{ fontSize: "12.5px", color: COLOR.textPrimary }}>{item.label}</div>
                <div style={{ display: "flex", flexDirection: "column", alignItems: "flex-end" }}>
                  <span style={{ fontSize: "13px", fontWeight: 700, color: item.amount >= 0 ? COLOR.success : COLOR.danger }}>
                    <Money text={`${item.amount >= 0 ? "+" : ""}${formatMoney(item.amount, item.currency)}`} />
                  </span>
                  <span style={{ fontSize: "10.5px", color: COLOR.textSecondary }}>{item.date}</span>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      <div style={{ display: "flex", gap: SPACE.sm }}>
        <SecondaryButton onClick={() => router.push("/wallet/convert")}>המרת מטבע</SecondaryButton>
        <PrimaryButton onClick={() => router.push("/wallet/add")}>הוספת כסף +</PrimaryButton>
      </div>

      <ToastBar toast={toast} />
      <BottomNav active={null} />
    </ScreenShell>
  );
}
