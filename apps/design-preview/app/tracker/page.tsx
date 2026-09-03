"use client";

import { useEffect, useState } from "react";
import { ScreenShell, ScreenHeader, Card, Badge, PrimaryButton, COLOR, SPACE } from "../design-system";
import { loadJSON, saveJSON, nextId, formatMoney, tripScopedKey } from "../wallet-data";
import { currentScopeTripId } from "../trips-data";
import { TripSwitcherPill } from "../trip-switcher";

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

// לפי בקשה מפורשת: אין יותר רשומות-דמו שמופיעות מעצמן. מעקב חדש (או
// טיול חדש) מתחיל ריק לגמרי — המשתמש מוסיף בעצמו את מה שבאמת קרה לו.
const DEFAULT_STATE: TrackerState = { massages: [], tips: [], fruits: [] };

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
  const [tripId] = useState(() => currentScopeTripId());

  useEffect(() => {
    setState(loadJSON(tripScopedKey(SK_TRACKER, tripId), DEFAULT_STATE));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  function persist(next: TrackerState) {
    setState(next);
    saveJSON(tripScopedKey(SK_TRACKER, tripId), next);
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
      <ScreenHeader title="מעקב אישי בטיול" action={<TripSwitcherPill background={COLOR.card} border={COLOR.border} color={COLOR.textPrimary} />} />
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
              onFocus={(e) => e.target.select()}
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
