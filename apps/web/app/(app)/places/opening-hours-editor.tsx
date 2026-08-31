"use client";

import type { OpeningHours } from "@travel-app/shared-types";

const DAYS: Array<{ key: keyof OpeningHours; label: string }> = [
  { key: "sun", label: "ראשון" },
  { key: "mon", label: "שני" },
  { key: "tue", label: "שלישי" },
  { key: "wed", label: "רביעי" },
  { key: "thu", label: "חמישי" },
  { key: "fri", label: "שישי" },
  { key: "sat", label: "שבת" },
];

export const CLOSED_ALL: OpeningHours = { sun: null, mon: null, tue: null, wed: null, thu: null, fri: null, sat: null };

/** מבוקר (value/onChange) — לא state פנימי — כדי שחיפוש-מקום (Google Places)
 * יוכל למלא-מראש שעות אמיתיות (ר' PlaceCreateForm), לא רק עריכה ידנית. */
export function OpeningHoursEditor({ value, onChange }: { value: OpeningHours; onChange: (hours: OpeningHours) => void }) {
  const hasAnyHours = DAYS.some(({ key }) => value[key] !== null);

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: "0.375rem" }}>
      <span>שעות פתיחה (אופציונלי — מולאו-מראש אם נמצאו בחיפוש)</span>
      {DAYS.map(({ key, label }) => {
        const day = value[key];
        return (
          <div key={key} style={{ display: "flex", gap: "0.5rem", alignItems: "center" }}>
            <label style={{ display: "flex", alignItems: "center", gap: "0.25rem", width: "5rem" }}>
              <input
                type="checkbox"
                checked={day !== null}
                onChange={(event) =>
                  onChange({
                    ...value,
                    [key]: event.target.checked ? { open: "09:00", close: "18:00" } : null,
                  })
                }
              />
              {label}
            </label>
            {day ? (
              <>
                <input
                  type="time"
                  value={day.open}
                  onChange={(event) => onChange({ ...value, [key]: { open: event.target.value, close: day.close } })}
                  style={timeInputStyle}
                />
                <span style={{ color: "var(--color-text-muted)" }}>–</span>
                <input
                  type="time"
                  value={day.close}
                  onChange={(event) => onChange({ ...value, [key]: { open: day.open, close: event.target.value } })}
                  style={timeInputStyle}
                />
              </>
            ) : (
              <span style={{ color: "var(--color-text-muted)", fontSize: "0.8125rem" }}>סגור</span>
            )}
          </div>
        );
      })}
      <input type="hidden" name="openingHours" value={hasAnyHours ? JSON.stringify(value) : ""} />
    </div>
  );
}

const timeInputStyle: React.CSSProperties = {
  padding: "0.375rem 0.5rem",
  borderRadius: "var(--radius-md)",
  border: "1px solid var(--color-border)",
  background: "var(--color-surface-elevated)",
  color: "var(--color-text-primary)",
};
