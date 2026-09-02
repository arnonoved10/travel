"use client";

import { useRouter } from "next/navigation";
import { ScreenShell, ScreenHeader, Card, Badge, Money, PrimaryButton, COLOR, SPACE } from "../../design-system";
import { formatMoney, today, PAYMENT_METHOD_LABEL } from "../../wallet-data";
import { useWalletStore } from "../../wallet-store";

/** רשימת הפיקדונות — פתוחים (עדיין אצל המלון/השכרת הרכב) מודגשים למעלה,
 * במיוחד אם תאריך ההחזר הצפוי הגיע/עבר, כדי "לתזכר" — לפי בקשה מפורשת. */
export default function DepositsScreen() {
  const router = useRouter();
  const store = useWalletStore();
  if (!store.hydrated) return null;

  const pending = store.deposits.filter((d) => d.status === "pending").sort((a, b) => (a.expectedReturnDate ?? "9999") < (b.expectedReturnDate ?? "9999") ? -1 : 1);
  const returned = store.deposits.filter((d) => d.status === "returned").sort((a, b) => ((a.returnedDate ?? "") < (b.returnedDate ?? "") ? 1 : -1));
  const todayStr = today();

  function handleMarkReturned(id: string, title: string) {
    if (!confirm(`לסמן את "${title}" כהוחזר? הסכום יחזור לארנק/יזוכה בכרטיס.`)) return;
    store.markDepositReturned(id);
  }

  return (
    <ScreenShell>
      <ScreenHeader title="פיקדונות" />
      <PrimaryButton onClick={() => router.push("/wallet/deposit/new")}>+ רישום פיקדון חדש</PrimaryButton>

      <div>
        <div style={{ fontSize: "13.5px", fontWeight: 700, color: COLOR.textPrimary, marginBottom: SPACE.sm }}>פיקדונות פתוחים</div>
        {pending.length === 0 ? (
          <Card style={{ textAlign: "center", color: COLOR.textSecondary, fontSize: "12.5px" }}>אין כרגע פיקדונות פתוחים</Card>
        ) : (
          <div style={{ display: "flex", flexDirection: "column", gap: SPACE.sm }}>
            {pending.map((d) => {
              const isDue = d.expectedReturnDate && d.expectedReturnDate <= todayStr;
              return (
                <Card key={d.id} style={{ borderColor: isDue ? COLOR.warning : undefined }}>
                  <div onClick={() => router.push(`/wallet/deposit/new?edit=${d.id}`)} style={{ cursor: "pointer" }}>
                    <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
                      <span style={{ fontSize: "13.5px", fontWeight: 700, color: COLOR.textPrimary }}>{d.title}</span>
                      <span style={{ fontSize: "14px", fontWeight: 700, color: COLOR.textPrimary }}>
                        <Money text={formatMoney(d.amount, d.currency)} />
                      </span>
                    </div>
                    <div style={{ fontSize: "11px", color: COLOR.textSecondary, marginTop: "2px" }}>
                      ניתן ב-{d.dateGiven} · {PAYMENT_METHOD_LABEL[d.paymentMethod]}
                      {d.expectedReturnDate ? ` · צפוי חזרה ${d.expectedReturnDate}` : ""}
                    </div>
                    {isDue ? <Badge tone="warning">תזכורת: זמן להחזרה הגיע — ודאו שקיבלתם את הפיקדון בחזרה</Badge> : null}
                  </div>
                  <button
                    type="button"
                    onClick={() => handleMarkReturned(d.id, d.title)}
                    style={{ width: "100%", marginTop: SPACE.sm, padding: "9px", borderRadius: "10px", background: `${COLOR.success}1A`, border: `1px solid ${COLOR.success}55`, color: COLOR.success, fontSize: "12px", fontWeight: 700, cursor: "pointer" }}
                  >
                    ✓ סמן כהוחזר
                  </button>
                </Card>
              );
            })}
          </div>
        )}
      </div>

      {returned.length > 0 ? (
        <div>
          <div style={{ fontSize: "13.5px", fontWeight: 700, color: COLOR.textPrimary, marginBottom: SPACE.sm }}>פיקדונות שהוחזרו</div>
          <div style={{ display: "flex", flexDirection: "column", gap: SPACE.sm }}>
            {returned.map((d) => (
              <Card key={d.id} onClick={() => router.push(`/wallet/deposit/new?edit=${d.id}`)} style={{ cursor: "pointer", opacity: 0.75 }}>
                <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
                  <span style={{ fontSize: "13px", fontWeight: 700, color: COLOR.textPrimary }}>{d.title}</span>
                  <span style={{ fontSize: "13px", fontWeight: 700, color: COLOR.success }}>
                    ✓ הוחזר <Money text={formatMoney(d.amount, d.currency)} />
                  </span>
                </div>
                <div style={{ fontSize: "10.5px", color: COLOR.textSecondary, marginTop: "2px" }}>
                  הוחזר ב-{d.returnedDate} · {PAYMENT_METHOD_LABEL[d.paymentMethod]}
                </div>
              </Card>
            ))}
          </div>
        </div>
      ) : null}
    </ScreenShell>
  );
}
