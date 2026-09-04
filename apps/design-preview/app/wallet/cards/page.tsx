"use client";

import { Suspense, useEffect, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { ScreenShell, ScreenHeader, Card, Badge, PrimaryButton, EditIcon, TrashIcon, COLOR, SPACE } from "../../design-system";
import { type CreditCardInfo } from "../../wallet-data";
import { useWalletStore } from "../../wallet-store";

const CARD_COLORS = ["#7C3AED", "#4f8fe0", "#34D399", "#EF4444"];

export default function CreditCardsScreen() {
  return (
    <Suspense fallback={null}>
      <CreditCardsScreenInner />
    </Suspense>
  );
}

function CreditCardsScreenInner() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const store = useWalletStore();
  const [formOpen, setFormOpen] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [nickname, setNickname] = useState("");
  const [issuer, setIssuer] = useState("Visa");
  const [last4, setLast4] = useState("");
  const [creditLimit, setCreditLimit] = useState("");
  const openedFromQuery = searchParams.get("edit");

  useEffect(() => {
    if (openedFromQuery && store.hydrated) {
      const c = store.cards.find((card) => card.id === openedFromQuery);
      if (c) openEditForm(c);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [openedFromQuery, store.hydrated]);

  if (!store.hydrated) return null;

  function openAddForm() {
    setEditingId(null);
    setNickname("");
    setIssuer("Visa");
    setLast4("");
    setCreditLimit("");
    setFormOpen(true);
  }

  function openEditForm(c: CreditCardInfo) {
    setEditingId(c.id);
    setNickname(c.nickname);
    setIssuer(c.issuer);
    setLast4(c.last4);
    setCreditLimit(c.creditLimit != null ? String(c.creditLimit) : "");
    setFormOpen(true);
  }

  function handleSubmit() {
    if (!nickname.trim() || last4.length !== 4) return;
    const creditLimitNum = creditLimit ? Number(creditLimit) : undefined;
    if (editingId) {
      const existing = store.cards.find((c) => c.id === editingId);
      store.saveCard(
        { nickname: nickname.trim(), issuer, last4, currency: existing?.currency ?? "ILS", color: existing?.color ?? CARD_COLORS[0]!, isPrimary: existing?.isPrimary ?? false, creditLimit: creditLimitNum },
        editingId
      );
    } else {
      store.saveCard({ nickname: nickname.trim(), issuer, last4, currency: "ILS", color: CARD_COLORS[store.cards.length % CARD_COLORS.length]!, isPrimary: store.cards.length === 0, creditLimit: creditLimitNum });
    }
    setFormOpen(false);
    setEditingId(null);
  }

  function handleDelete(c: CreditCardInfo) {
    if (!confirm(`למחוק את הכרטיס "${c.nickname}"?`)) return;
    store.deleteCard(c.id);
  }

  return (
    <ScreenShell>
      <ScreenHeader title="כרטיסי אשראי" />
      <PrimaryButton onClick={() => (formOpen ? setFormOpen(false) : openAddForm())}>{formOpen ? "ביטול" : "+ הוסף כרטיס"}</PrimaryButton>

      {formOpen ? (
        <Card style={{ display: "flex", flexDirection: "column", gap: SPACE.sm }}>
          <input value={nickname} onChange={(e) => setNickname(e.target.value)} placeholder="כינוי הכרטיס" style={{ padding: "10px", borderRadius: "10px", background: COLOR.cardElevated, border: `1px solid ${COLOR.border}`, color: COLOR.textPrimary }} />
          <input value={issuer} onChange={(e) => setIssuer(e.target.value)} placeholder="חברה מנפיקה" style={{ padding: "10px", borderRadius: "10px", background: COLOR.cardElevated, border: `1px solid ${COLOR.border}`, color: COLOR.textPrimary }} />
          <input value={last4} onChange={(e) => setLast4(e.target.value.replace(/\D/g, "").slice(0, 4))} placeholder="4 ספרות אחרונות" style={{ padding: "10px", borderRadius: "10px", background: COLOR.cardElevated, border: `1px solid ${COLOR.border}`, color: COLOR.textPrimary }} />
          <input
            type="number"
            min={0}
            value={creditLimit}
            onChange={(e) => setCreditLimit(e.target.value)}
            onFocus={(e) => e.target.select()}
            placeholder="מסגרת אשראי (לא חובה)"
            style={{ padding: "10px", borderRadius: "10px", background: COLOR.cardElevated, border: `1px solid ${COLOR.border}`, color: COLOR.textPrimary }}
          />
          <PrimaryButton onClick={handleSubmit}>{editingId ? "שמירת שינויים" : "שמור כרטיס"}</PrimaryButton>
        </Card>
      ) : null}

      <div style={{ display: "flex", flexDirection: "column", gap: SPACE.sm }}>
        {store.cards.length === 0 ? (
          <div style={{ fontSize: "12.5px", color: COLOR.textSecondary, padding: "6px 2px" }}>לא נוספו כרטיסי אשראי</div>
        ) : (
          store.cards.map((c) => (
            <Card key={c.id} style={{ display: "flex", alignItems: "center", gap: SPACE.md }}>
              <div onClick={() => router.push(`/wallet/cards/${c.id}`)} style={{ display: "flex", alignItems: "center", gap: SPACE.md, flex: 1, minWidth: 0, cursor: "pointer" }}>
                <div style={{ width: "36px", height: "24px", borderRadius: "5px", background: c.color, flexShrink: 0 }} />
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ fontSize: "13px", fontWeight: 700, color: COLOR.textPrimary }}>
                    {c.issuer} •••• {c.last4}
                  </div>
                  <div style={{ fontSize: "11px", color: COLOR.textSecondary }}>{c.nickname}</div>
                </div>
              </div>
              {c.isPrimary ? (
                <Badge tone="success">מועדף</Badge>
              ) : (
                <button type="button" onClick={() => store.setPrimaryCard(c.id)} style={{ background: "none", border: "none", cursor: "pointer", fontSize: "10.5px", fontWeight: 700, color: COLOR.primaryLight, whiteSpace: "nowrap" }}>
                  הפוך למועדף
                </button>
              )}
              <button type="button" onClick={() => openEditForm(c)} aria-label="עריכת הכרטיס" style={{ background: "none", border: "none", cursor: "pointer", display: "flex" }}>
                <EditIcon />
              </button>
              <button type="button" onClick={() => handleDelete(c)} aria-label="מחיקת הכרטיס" style={{ background: "none", border: "none", cursor: "pointer", display: "flex" }}>
                <TrashIcon size={16} color={COLOR.danger} />
              </button>
            </Card>
          ))
        )}
      </div>
    </ScreenShell>
  );
}
