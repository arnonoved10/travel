"use client";

import { useEffect, useState } from "react";
import { ScreenShell, ScreenHeader, Card, Badge, PrimaryButton, COLOR, SPACE } from "../design-system";
import { loadJSON, saveJSON, nextId, formatMoney } from "../wallet-data";

interface TrackerEntry {
  id: string;
  date: string;
  label: string;
  amount: number;
  currency: string;
}
interface TrackerState {
  massages: TrackerEntry[];
  tips: TrackerEntry[];
  fruits: TrackerEntry[];
}

const SK_TRACKER = "design-preview-personal-tracker-v1";

const DEFAULT_STATE: TrackerState = {
  massages: [
    { id: nextId("trk"), date: "2025-05-28 15:30", label: "Thai Massage", amount: 45, currency: "EUR" },
    { id: nextId("trk"), date: "2025-05-31 11:00", label: "Aroma Massage", amount: 70, currency: "EUR" },
  ],
  tips: [{ id: nextId("trk"), date: "2025-05-28", label: "Bellboy", amount: 5, currency: "EUR" }],
  fruits: [{ id: nextId("trk"), date: "2025-05-28", label: "מנגו", amount: 3, currency: "EUR" }],
};

const SECTIONS: { key: keyof TrackerState; label: string; addLabel: string }[] = [
  { key: "massages", label: "מסאז'ים", addLabel: "הוסף מסאז' חדש" },
  { key: "tips", label: "טיפים לצוות מלון", addLabel: "הוסף טיפ חדש" },
  { key: "fruits", label: "פירות ושטעמי", addLabel: "הוסף פרי חדש" },
];

/** מסך "מעקב אישי בטיול" (37) — מעקב עצמאי (מסאז'ים/טיפים/פירות), נפרד
 * מהארנק הראשי (לא הוצאה רשמית), נשמר ב-localStorage משלו. */
export default function PersonalTrackerScreen() {
  const [state, setState] = useState<TrackerState>(DEFAULT_STATE);
  const [newLabel, setNewLabel] = useState<Record<string, string>>({});
  const [newAmount, setNewAmount] = useState<Record<string, string>>({});

  useEffect(() => {
    setState(loadJSON(SK_TRACKER, DEFAULT_STATE));
  }, []);

  function persist(next: TrackerState) {
    setState(next);
    saveJSON(SK_TRACKER, next);
  }

  function addEntry(key: keyof TrackerState) {
    const label = newLabel[key]?.trim();
    const amount = Number(newAmount[key]);
    if (!label || !(amount > 0)) return;
    const entry: TrackerEntry = { id: nextId("trk"), date: new Date().toISOString().slice(0, 16).replace("T", " "), label, amount, currency: "EUR" };
    persist({ ...state, [key]: [...state[key], entry] });
    setNewLabel((p) => ({ ...p, [key]: "" }));
    setNewAmount((p) => ({ ...p, [key]: "" }));
  }

  function removeEntry(key: keyof TrackerState, id: string, label: string) {
    if (!confirm(`למחוק את "${label}"?`)) return;
    persist({ ...state, [key]: state[key].filter((e) => e.id !== id) });
  }

  return (
    <ScreenShell>
      <ScreenHeader title="מעקב אישי בטיול" />
      {SECTIONS.map((sec) => (
        <Card key={sec.key}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: SPACE.sm }}>
            <span style={{ fontSize: "14px", fontWeight: 700, color: COLOR.textPrimary }}>{sec.label}</span>
            <Badge tone="primary">{state[sec.key].length}</Badge>
          </div>
          <div style={{ display: "flex", flexDirection: "column", gap: SPACE.xs, marginBottom: SPACE.sm }}>
            {state[sec.key].map((entry) => (
              <div key={entry.id} style={{ display: "flex", alignItems: "center", justifyContent: "space-between", fontSize: "12px", gap: SPACE.xs }}>
                <span style={{ color: COLOR.textSecondary, flex: 1, minWidth: 0 }}>
                  {entry.date} · {entry.label}
                </span>
                <span style={{ color: COLOR.textPrimary, fontWeight: 600, whiteSpace: "nowrap" }}>{formatMoney(entry.amount, entry.currency)}</span>
                <button
                  type="button"
                  onClick={() => removeEntry(sec.key, entry.id, entry.label)}
                  aria-label={`מחיקת ${entry.label}`}
                  style={{ width: "20px", height: "20px", borderRadius: "6px", background: "none", border: "none", color: COLOR.danger, cursor: "pointer", fontSize: "12px", flexShrink: 0 }}
                >
                  ✕
                </button>
              </div>
            ))}
          </div>
          <div style={{ display: "flex", gap: SPACE.xs }}>
            <input
              value={newLabel[sec.key] ?? ""}
              onChange={(e) => setNewLabel((p) => ({ ...p, [sec.key]: e.target.value }))}
              placeholder="תיאור"
              style={{ flex: 2, padding: "8px 10px", borderRadius: "10px", background: COLOR.cardElevated, border: `1px solid ${COLOR.border}`, color: COLOR.textPrimary, fontSize: "12px" }}
            />
            <input
              value={newAmount[sec.key] ?? ""}
              onChange={(e) => setNewAmount((p) => ({ ...p, [sec.key]: e.target.value }))}
              placeholder="€"
              type="number"
              style={{ flex: 1, padding: "8px 10px", borderRadius: "10px", background: COLOR.cardElevated, border: `1px solid ${COLOR.border}`, color: COLOR.textPrimary, fontSize: "12px" }}
            />
          </div>
          <PrimaryButton onClick={() => addEntry(sec.key)} style={{ marginTop: SPACE.sm, minHeight: "38px", fontSize: "12.5px" }}>
            {sec.addLabel}
          </PrimaryButton>
        </Card>
      ))}
    </ScreenShell>
  );
}
