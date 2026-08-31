import type { Payment, PaymentCard } from "@travel-app/shared-types";
import { formatMoney } from "@/lib/currency-format";

// מסכם רק תשלומים המקושרים ל-Expense (listPaymentsByTrip לא מכסה תשלום
// שמקושר ישירות ל-Booking בלי Expense — ראה DECISIONS.md).
export function CreditCardSummary({ payments, cards }: { payments: Payment[]; cards: PaymentCard[] }) {
  const cardPayments = payments.filter((p) => p.paymentMethod === "credit_card");
  if (cardPayments.length === 0) {
    return <p style={{ color: "var(--color-text-muted)", fontSize: "0.8125rem" }}>אין עדיין תשלומים בכרטיס אשראי.</p>;
  }

  const cardNameById = new Map(cards.map((c) => [c.id, c.cardName]));
  const totals = new Map<string, number>();
  for (const payment of cardPayments) {
    const key = `${payment.cardId ?? "ללא שיוך"}::${payment.currencyCode}`;
    totals.set(key, (totals.get(key) ?? 0) + payment.amount);
  }

  return (
    <ul style={{ listStyle: "none", padding: 0, display: "flex", flexDirection: "column", gap: "0.375rem" }}>
      {Array.from(totals.entries()).map(([key, total]) => {
        const [cardId, currencyCode] = key.split("::") as [string, string];
        const cardName = cardId !== "ללא שיוך" ? (cardNameById.get(cardId) ?? "כרטיס לא ידוע") : "ללא שיוך לכרטיס";
        return (
          <li key={key} style={{ display: "flex", justifyContent: "space-between", fontSize: "0.875rem" }}>
            <span>{cardName}</span>
            <span style={{ fontWeight: 600 }}>{formatMoney(total, currencyCode)}</span>
          </li>
        );
      })}
    </ul>
  );
}
