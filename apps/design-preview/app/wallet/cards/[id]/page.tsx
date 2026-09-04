"use client";

import { useParams, useRouter } from "next/navigation";
import { ScreenShell, ScreenHeader, Card, Badge, Money, PrimaryButton, DangerButton, COLOR, SPACE } from "../../../design-system";
import { formatMoney, currencyMeta } from "../../../wallet-data";
import { useWalletStore } from "../../../wallet-store";

/** פיקדון בכרטיס: כל עוד לא הוחזר הוא נספר כמוחזק על הכרטיס (מציג "מוחזק"),
 * וברגע שהוא מסומן כהוחזר הוא לא נספר יותר בסכום המוחזק אלא מוצג כשורת
 * זיכוי נפרדת — כדי ש"יהיה רואים שיש זיכוי בכרטיס" לפי בקשה מפורשת. */

/** מסך פרטי כרטיס-אשראי — מה שנרכש עליו בפועל, לפי בקשה מפורשת: הוצאה
 * שסומנה "כרטיס אשראי" צריכה "להופיע על הכרטיס", לא רק להיספר בשקט. */
export default function CardDetailsScreen() {
  const router = useRouter();
  const params = useParams<{ id: string }>();
  const store = useWalletStore();

  if (!store.hydrated) return null;
  const card = store.cards.find((c) => c.id === params.id);
  if (!card) {
    return (
      <ScreenShell>
        <ScreenHeader title="פרטי כרטיס" />
        <Card style={{ textAlign: "center", color: COLOR.textSecondary }}>הכרטיס לא נמצא</Card>
      </ScreenShell>
    );
  }

  const cardExpenses = store.expenses.filter((e) => e.cardId === card.id).sort((a, b) => (a.date < b.date ? 1 : -1));
  const cardDeposits = store.deposits
    .filter((d) => d.paymentMethod === "credit" && d.cardId === card.id)
    .sort((a, b) => (a.dateGiven < b.dateGiven ? 1 : -1));
  const totalsByCurrency = new Map<string, number>();
  for (const e of cardExpenses) totalsByCurrency.set(e.currency, (totalsByCurrency.get(e.currency) ?? 0) + e.amount);
  for (const d of cardDeposits) if (d.status === "pending") totalsByCurrency.set(d.currency, (totalsByCurrency.get(d.currency) ?? 0) + d.amount);

  return (
    <ScreenShell>
      <ScreenHeader title={card.nickname} />

      <Card>
        <div style={{ display: "flex", alignItems: "center", gap: SPACE.md, marginBottom: SPACE.md }}>
          <div style={{ width: "48px", height: "32px", borderRadius: "6px", background: card.color, flexShrink: 0 }} />
          <div style={{ flex: 1, minWidth: 0 }}>
            <div style={{ fontSize: "14px", fontWeight: 700, color: COLOR.textPrimary }}>
              {card.issuer} •••• {card.last4}
            </div>
            <div style={{ fontSize: "11.5px", color: COLOR.textSecondary }}>{card.nickname}</div>
          </div>
          {card.isPrimary ? <Badge tone="success">מועדף</Badge> : null}
        </div>
        {card.feePercent ? <div style={{ fontSize: "11.5px", color: COLOR.textSecondary }}>עמלת המרה: {card.feePercent}%</div> : null}
        {card.creditLimit ? (
          <div style={{ fontSize: "11.5px", color: COLOR.textSecondary }}>
            מסגרת אשראי: <Money text={formatMoney(card.creditLimit, card.currency)} />
          </div>
        ) : null}
      </Card>

      <div>
        <div style={{ fontSize: "13.5px", fontWeight: 700, color: COLOR.textPrimary, marginBottom: SPACE.sm }}>סך הכל שנרכש על הכרטיס</div>
        {totalsByCurrency.size === 0 ? (
          <Card style={{ textAlign: "center", color: COLOR.textSecondary, fontSize: "12.5px" }}>אין עדיין הוצאות על הכרטיס הזה</Card>
        ) : (
          <div style={{ display: "flex", flexDirection: "column", gap: SPACE.xs }}>
            {Array.from(totalsByCurrency.entries()).map(([code, total]) => (
              <div key={code} style={{ display: "flex", justifyContent: "space-between", alignItems: "center", padding: "8px 4px" }}>
                <span style={{ fontSize: "12.5px", color: COLOR.textSecondary }}>{currencyMeta(code).name}</span>
                <span style={{ fontSize: "14px", fontWeight: 700, color: COLOR.textPrimary }}>
                  <Money text={formatMoney(total, code)} />
                </span>
              </div>
            ))}
          </div>
        )}
      </div>

      <div style={{ display: "flex", gap: SPACE.sm }}>
        {!card.isPrimary ? (
          <button
            type="button"
            onClick={() => store.setPrimaryCard(card.id)}
            style={{ flex: 1, padding: "10px", borderRadius: "10px", background: COLOR.card, border: `1px solid ${COLOR.border}`, color: COLOR.textPrimary, fontSize: "12px", fontWeight: 700, cursor: "pointer" }}
          >
            הפוך למועדף
          </button>
        ) : null}
        <button
          type="button"
          onClick={() => router.push(`/wallet/cards?edit=${card.id}`)}
          style={{ flex: 1, padding: "10px", borderRadius: "10px", background: `${COLOR.primary}22`, border: `1px solid ${COLOR.primary}55`, color: COLOR.primaryLight, fontSize: "12px", fontWeight: 700, cursor: "pointer" }}
        >
          עריכת פרטי הכרטיס
        </button>
      </div>

      <div>
        <div style={{ fontSize: "13.5px", fontWeight: 700, color: COLOR.textPrimary, marginBottom: SPACE.sm }}>הוצאות שחויבו על הכרטיס</div>
        {cardExpenses.length === 0 ? (
          <Card style={{ textAlign: "center", color: COLOR.textSecondary, fontSize: "12.5px" }}>אין עדיין הוצאות</Card>
        ) : (
          <div style={{ display: "flex", flexDirection: "column", gap: SPACE.xs }}>
            {cardExpenses.map((e) => (
              <Card
                key={e.id}
                onClick={() => router.push(`/wallet/expense/new?edit=${e.id}`)}
                style={{ display: "flex", alignItems: "center", justifyContent: "space-between", cursor: "pointer" }}
              >
                <div>
                  <div style={{ fontSize: "12.5px", fontWeight: 700, color: COLOR.textPrimary }}>{e.title}</div>
                  <div style={{ fontSize: "10.5px", color: COLOR.textSecondary }}>
                    {e.category} · {e.date}
                  </div>
                </div>
                <span style={{ fontSize: "13px", fontWeight: 700, color: COLOR.textPrimary }}>
                  <Money text={formatMoney(e.amount, e.currency)} />
                </span>
              </Card>
            ))}
          </div>
        )}
      </div>

      {cardDeposits.length > 0 ? (
        <div>
          <div style={{ fontSize: "13.5px", fontWeight: 700, color: COLOR.textPrimary, marginBottom: SPACE.sm }}>פיקדונות בכרטיס</div>
          <div style={{ display: "flex", flexDirection: "column", gap: SPACE.xs }}>
            {cardDeposits.map((d) => (
              <Card
                key={d.id}
                onClick={() => router.push(`/wallet/deposit/new?edit=${d.id}`)}
                style={{ display: "flex", alignItems: "center", justifyContent: "space-between", cursor: "pointer" }}
              >
                <div>
                  <div style={{ fontSize: "12.5px", fontWeight: 700, color: COLOR.textPrimary }}>{d.title}</div>
                  <div style={{ fontSize: "10.5px", color: COLOR.textSecondary }}>
                    {d.status === "pending" ? `ניתן ב-${d.dateGiven}` : `זוכה ב-${d.returnedDate}`}
                  </div>
                </div>
                <div style={{ textAlign: "left" }}>
                  {d.status === "pending" ? (
                    <>
                      <span style={{ fontSize: "13px", fontWeight: 700, color: COLOR.textPrimary, display: "block" }}>
                        <Money text={formatMoney(d.amount, d.currency)} />
                      </span>
                      <Badge tone="warning">מוחזק</Badge>
                    </>
                  ) : (
                    <>
                      <span style={{ fontSize: "13px", fontWeight: 700, color: COLOR.success, display: "block" }}>
                        זיכוי -<Money text={formatMoney(d.amount, d.currency)} />
                      </span>
                      <Badge tone="success">✓ זוכה בכרטיס</Badge>
                    </>
                  )}
                </div>
              </Card>
            ))}
          </div>
        </div>
      ) : null}

      <PrimaryButton onClick={() => router.push("/wallet/expense/new")}>הוספת הוצאה על הכרטיס הזה</PrimaryButton>
      <DangerButton
        onClick={() => {
          if (confirm(`למחוק את הכרטיס "${card.nickname}"?`)) {
            store.deleteCard(card.id);
            router.push("/wallet/cards");
          }
        }}
      >
        מחיקת הכרטיס
      </DangerButton>
    </ScreenShell>
  );
}
