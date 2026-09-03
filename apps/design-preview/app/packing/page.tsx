"use client";

import { useEffect, useState } from "react";
import { ScreenShell, ScreenHeader, Card, PrimaryButton, CheckIcon, COLOR, SPACE } from "../design-system";
import { loadJSON, saveJSON, tripScopedKey } from "../wallet-data";
import { currentScopeTripId } from "../trips-data";

interface PackingItem {
  id: string;
  label: string;
  done: boolean;
}
interface PackingCategory {
  key: string;
  label: string;
  items: PackingItem[];
}

const SK_PACKING = "design-preview-packing-v1";

const DEFAULT_CATEGORIES: PackingCategory[] = [
  { key: "documents", label: "מסמכים", items: mk(["דרכון", "כרטיסי טיסה", "ביטוח נסיעות", "אישורי הזמנה", "רישיון נהיגה"], true) },
  { key: "clothing", label: "ביגוד", items: mk(["חולצות", "מכנסיים", "תחתונים", "גרביים", "נעלי הליכה", "מעיל", "כובע", "בגד ים", "פיג'מה", "כפפות", "צעיף", "נעלי בית"]) },
  { key: "electronics", label: "אלקטרוניקה", items: mk(["מטען טלפון", "מטען נייד", "מתאם חשמל", "אוזניות", "מצלמה", "כבל טעינה"], true) },
  { key: "health", label: "תרופות ובריאות", items: mk(["תרופות אישיות", "משחת שיניים", "קרם הגנה", "משקפי שמש"]) },
  { key: "custom", label: "פריטים מותאמים אישית", items: [] },
];

function mk(labels: string[], done = false): PackingItem[] {
  return labels.map((label, i) => ({ id: `${label}-${i}`, label, done }));
}

export default function PackingListScreen() {
  const [categories, setCategories] = useState<PackingCategory[]>(DEFAULT_CATEGORIES);
  const [newItem, setNewItem] = useState("");
  const [tripId] = useState(() => currentScopeTripId());

  useEffect(() => {
    setCategories(loadJSON(tripScopedKey(SK_PACKING, tripId), DEFAULT_CATEGORIES));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  function persist(next: PackingCategory[]) {
    setCategories(next);
    saveJSON(tripScopedKey(SK_PACKING, tripId), next);
  }

  function toggle(catKey: string, itemId: string) {
    persist(categories.map((c) => (c.key !== catKey ? c : { ...c, items: c.items.map((i) => (i.id === itemId ? { ...i, done: !i.done } : i)) })));
  }

  function addCustom() {
    if (!newItem.trim()) return;
    persist(categories.map((c) => (c.key !== "custom" ? c : { ...c, items: [...c.items, { id: `custom-${Date.now()}`, label: newItem.trim(), done: false }] })));
    setNewItem("");
  }

  function removeItem(catKey: string, itemId: string, label: string) {
    if (!confirm(`למחוק את "${label}" מהרשימה?`)) return;
    persist(categories.map((c) => (c.key !== catKey ? c : { ...c, items: c.items.filter((i) => i.id !== itemId) })));
  }

  const total = categories.reduce((s, c) => s + c.items.length, 0);
  const done = categories.reduce((s, c) => s + c.items.filter((i) => i.done).length, 0);
  const pct = total > 0 ? Math.round((done / total) * 100) : 0;

  return (
    <ScreenShell>
      <ScreenHeader title="רשימת אריזה" />

      <Card>
        <div style={{ display: "flex", justifyContent: "space-between", marginBottom: SPACE.sm }}>
          <span style={{ fontSize: "13px", fontWeight: 700, color: COLOR.textPrimary }}>{pct}%</span>
          <span style={{ fontSize: "12px", color: COLOR.textSecondary }}>
            {done} / {total}
          </span>
        </div>
        <div style={{ height: "8px", borderRadius: "999px", background: COLOR.cardElevated, overflow: "hidden" }}>
          <div style={{ width: `${pct}%`, height: "100%", background: COLOR.success }} />
        </div>
      </Card>

      {categories.map((cat) => {
        const catDone = cat.items.filter((i) => i.done).length;
        return (
          <div key={cat.key}>
            <div style={{ display: "flex", justifyContent: "space-between", marginBottom: SPACE.sm }}>
              <span style={{ fontSize: "13px", fontWeight: 700, color: COLOR.textPrimary }}>{cat.label}</span>
              <span style={{ fontSize: "12px", color: catDone === cat.items.length && cat.items.length > 0 ? COLOR.success : COLOR.warning }}>
                {catDone} / {cat.items.length}
              </span>
            </div>
            <div style={{ display: "flex", flexDirection: "column", gap: SPACE.xs }}>
              {cat.items.map((item) => (
                <div key={item.id} style={{ display: "flex", alignItems: "center", gap: SPACE.sm, padding: "9px 12px", borderRadius: "10px", background: COLOR.card, border: `1px solid ${COLOR.border}` }}>
                  <label style={{ display: "flex", alignItems: "center", gap: SPACE.sm, flex: 1, minWidth: 0, cursor: "pointer" }}>
                    <input type="checkbox" checked={item.done} onChange={() => toggle(cat.key, item.id)} />
                    <span style={{ fontSize: "12.5px", color: item.done ? COLOR.textSecondary : COLOR.textPrimary, textDecoration: item.done ? "line-through" : "none" }}>{item.label}</span>
                    {item.done ? <CheckIcon size={14} /> : null}
                  </label>
                  <button
                    type="button"
                    onClick={() => removeItem(cat.key, item.id, item.label)}
                    aria-label={`מחיקת ${item.label}`}
                    style={{ width: "24px", height: "24px", borderRadius: "7px", background: "none", border: "none", color: COLOR.danger, cursor: "pointer", fontSize: "13px", flexShrink: 0 }}
                  >
                    ✕
                  </button>
                </div>
              ))}
              {cat.items.length === 0 ? <div style={{ fontSize: "11.5px", color: COLOR.textSecondary }}>אין פריטים עדיין</div> : null}
            </div>
          </div>
        );
      })}

      <div style={{ display: "flex", gap: SPACE.sm }}>
        <input value={newItem} onChange={(e) => setNewItem(e.target.value)} placeholder="פריט חדש" style={{ flex: 1, padding: "10px 12px", borderRadius: "12px", background: COLOR.cardElevated, border: `1px solid ${COLOR.border}`, color: COLOR.textPrimary }} />
      </div>
      <PrimaryButton onClick={addCustom}>הוסף פריט מותאם אישית</PrimaryButton>
    </ScreenShell>
  );
}
