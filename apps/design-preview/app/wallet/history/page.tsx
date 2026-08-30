"use client";

import { useState } from "react";
import { ScreenShell, ScreenHeader, PillTabs, Card, Money, DangerButton, TrashIcon, SearchIcon, COLOR, SPACE, inputStyle } from "../../design-system";
import { formatMoney, type Category } from "../../wallet-data";
import { useWalletStore } from "../../wallet-store";

const FILTERS: { key: Category | "all"; label: string }[] = [
  { key: "all", label: "הכל" },
  { key: "תחבורה", label: "תחבורה" },
  { key: "מסעדות", label: "אוכל" },
  { key: "קניות", label: "קניות" },
];

export default function ExpenseHistoryScreen() {
  const store = useWalletStore();
  const [filter, setFilter] = useState<Category | "all">("all");
  const [search, setSearch] = useState("");
  const [selected, setSelected] = useState<Set<string>>(new Set());

  if (!store.hydrated) return null;

  const filtered = store.expenses.filter((e) => (filter === "all" || e.category === filter) && (!search || e.title.includes(search) || (e.merchant ?? "").includes(search)));
  const selectedTotal = filtered.filter((e) => selected.has(e.id)).reduce((s, e) => s + e.amount, 0);

  function toggle(id: string) {
    setSelected((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  }

  return (
    <ScreenShell>
      <ScreenHeader title="היסטוריית הוצאות" />
      <div style={{ display: "flex", alignItems: "center", gap: SPACE.sm, background: COLOR.card, border: `1px solid ${COLOR.border}`, borderRadius: "12px", padding: "8px 12px" }}>
        <SearchIcon />
        <input value={search} onChange={(e) => setSearch(e.target.value)} placeholder="חיפוש הוצאה" style={{ flex: 1, background: "transparent", border: "none", outline: "none", color: COLOR.textPrimary, fontSize: "13px" }} />
      </div>
      <PillTabs options={FILTERS} value={filter} onChange={setFilter} />

      <div style={{ display: "flex", flexDirection: "column", gap: SPACE.sm }}>
        {filtered.length === 0 ? (
          <Card style={{ textAlign: "center", color: COLOR.textSecondary, fontSize: "12.5px" }}>אין הוצאות תואמות</Card>
        ) : (
          filtered.map((e) => (
            <Card key={e.id} onClick={() => toggle(e.id)} style={{ display: "flex", alignItems: "center", gap: SPACE.md, border: `1px solid ${selected.has(e.id) ? COLOR.primary : COLOR.border}` }}>
              <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{ fontSize: "13px", fontWeight: 700, color: COLOR.textPrimary }}>{e.title}</div>
                <div style={{ fontSize: "11px", color: COLOR.textSecondary }}>
                  {e.date} · {e.category}
                </div>
              </div>
              <span style={{ fontSize: "13px", fontWeight: 700, color: COLOR.danger }}>
                <Money text={`-${formatMoney(e.amount, e.currency)}`} />
              </span>
              <button
                type="button"
                onClick={(ev) => {
                  ev.stopPropagation();
                  if (confirm(`למחוק את "${e.title}"?`)) store.deleteExpense(e.id);
                }}
                aria-label="מחיקה"
                style={{ background: "none", border: "none", cursor: "pointer" }}
              >
                <TrashIcon size={16} />
              </button>
            </Card>
          ))
        )}
      </div>

      {selected.size > 0 ? (
        <Card style={{ display: "flex", justifyContent: "space-between" }}>
          <span style={{ fontSize: "12px", color: COLOR.textSecondary }}>סה"כ נבחר</span>
          <span style={{ fontSize: "14px", fontWeight: 700, color: COLOR.textPrimary }}>
            <Money text={formatMoney(selectedTotal, "ILS")} />
          </span>
        </Card>
      ) : null}
    </ScreenShell>
  );
}
