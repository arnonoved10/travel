"use client";

import { useParams, useRouter } from "next/navigation";
import { ScreenShell, ScreenHeader, Card, IconPill, PrimaryButton, Money, PlusIcon, SuitcaseIcon, DocumentIcon, COLOR, SPACE } from "../../../design-system";
import { FlagIcon } from "../../../country-currency-data";
import { primaryCountryForCurrency, formatMoney, currencyMeta } from "../../../wallet-data";
import { useWalletStore } from "../../../wallet-store";
import { ToastBar } from "../../../toast-bar";

export default function CurrencyDetailsScreen() {
  const router = useRouter();
  const params = useParams<{ code: string }>();
  const code = params.code.toUpperCase();
  const store = useWalletStore();

  if (!store.hydrated) return null;
  const balance = store.balanceOf(code);
  const country = primaryCountryForCurrency(code);
  const recent = [
    ...store.additions.filter((a) => a.currency === code).map((a) => ({ id: a.id, label: currencyMeta(a.currency).name, amount: a.amount, date: a.date })),
    ...store.expenses.filter((e) => e.currency === code).map((e) => ({ id: e.id, label: e.title, amount: -e.amount, date: e.date })),
  ]
    .sort((a, b) => (a.date < b.date ? 1 : -1))
    .slice(0, 8);

  return (
    <ScreenShell>
      <ScreenHeader title={currencyMeta(code).name} action={country ? <FlagIcon countryCode={country.code} size={26} /> : undefined} />

      <Card style={{ textAlign: "center" }}>
        <div style={{ fontSize: "11px", color: COLOR.textSecondary }}>יתרה זמינה</div>
        <div style={{ fontSize: "24px", fontWeight: 700, color: COLOR.textPrimary, marginTop: "4px" }}>
          <Money text={formatMoney(balance.balance, code)} />
        </div>
      </Card>

      <div style={{ display: "flex", gap: SPACE.sm }}>
        <IconPill label="הוספה" icon={<PlusIcon color={COLOR.textPrimary} size={18} />} onClick={() => router.push("/wallet/add")} />
        <IconPill label="המרה" icon={<SuitcaseIcon />} onClick={() => router.push("/wallet/convert")} />
        <IconPill label="הוצאה" icon={<DocumentIcon />} onClick={() => router.push("/wallet/expense/new")} />
        <IconPill label="היסטוריה" icon={<DocumentIcon />} onClick={() => router.push("/wallet/history")} />
      </div>

      <div>
        <div style={{ fontSize: "13.5px", fontWeight: 700, color: COLOR.textPrimary, marginBottom: SPACE.sm }}>תנועות אחרונות</div>
        {recent.length === 0 ? (
          <Card style={{ textAlign: "center", color: COLOR.textSecondary, fontSize: "12.5px" }}>אין עדיין תנועות במטבע זה</Card>
        ) : (
          <div style={{ display: "flex", flexDirection: "column", gap: SPACE.xs }}>
            {recent.map((item) => (
              <div key={item.id} style={{ display: "flex", justifyContent: "space-between", padding: "8px 4px" }}>
                <span style={{ fontSize: "12.5px", color: COLOR.textPrimary }}>{item.label}</span>
                <span style={{ fontSize: "13px", fontWeight: 700, color: item.amount >= 0 ? COLOR.success : COLOR.danger }}>
                  <Money text={`${item.amount >= 0 ? "+" : ""}${formatMoney(item.amount, code)}`} />
                </span>
              </div>
            ))}
          </div>
        )}
      </div>

      <PrimaryButton onClick={() => router.push("/wallet/history")}>הצג את כל התנועות</PrimaryButton>
      <ToastBar toast={store.toast} />
    </ScreenShell>
  );
}
