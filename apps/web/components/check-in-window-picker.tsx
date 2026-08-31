"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { formatTimeWithIsraelReference } from "@/lib/dates";
import { setFlightCheckInWindowAction } from "@/app/(app)/trips/[tripId]/bookings/actions";
import { Select } from "@/components/ui/Select";

// אפשרויות אמיתיות ונפוצות (24 שעות — רוב חברות-התעופה; 48/72 — טיסות
// low-cost כמו AirAsia/Southwest) — לא ברירת-מחדל אחידה מומצאת, המשתמש בוחר.
const WINDOW_OPTIONS = [
  { hours: 24, label: "24 שעות לפני (רוב החברות)" },
  { hours: 48, label: "48 שעות לפני" },
  { hours: 72, label: "72 שעות לפני (חלק מחברות ה-low-cost)" },
];

/** קובע מתי צ'ק-אין נפתח (departureAt פחות חלון-שעות) ומזין את התראת
 * "צ'ק-אין נפתח" (flight_checkin_open) — אותו עיקרון בדיוק כמו
 * AirportTimingCalculator, רק בלי חישוב-נסיעה משני (שדה אחד בלבד). */
export function CheckInWindowPicker({
  tripId,
  flightId,
  departureAt,
  timezone,
  initialWindowHours,
}: {
  tripId: string;
  flightId: string;
  departureAt: string;
  timezone: string;
  initialWindowHours: number | null;
}) {
  const [windowHours, setWindowHours] = useState(initialWindowHours ?? 24);
  const [isPending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);
  const router = useRouter();

  const opensAt = new Date(new Date(departureAt).getTime() - windowHours * 60 * 60 * 1000).toISOString();
  const isSaved = initialWindowHours === windowHours;

  return (
    <details style={{ marginTop: "0.375rem" }}>
      <summary style={{ cursor: "pointer", fontSize: "0.8125rem", color: "var(--color-primary)" }}>🎫 מתי נפתח הצ&apos;ק-אין?</summary>
      <div style={{ display: "flex", flexDirection: "column", gap: "0.375rem", marginTop: "0.5rem", maxWidth: "360px" }}>
        <label style={{ display: "flex", flexDirection: "column", gap: "0.25rem", fontSize: "0.8125rem" }}>
          <span>חלון צ&apos;ק-אין של חברת התעופה</span>
          <Select
            value={String(windowHours)}
            onChange={(v) => setWindowHours(Number(v))}
            style={selectStyle}
            options={WINDOW_OPTIONS.map((opt) => ({ value: String(opt.hours), label: opt.label }))}
          />
        </label>
        <p style={{ margin: 0, fontSize: "0.8125rem", fontWeight: 600 }}>הצ&apos;ק-אין נפתח: {formatTimeWithIsraelReference(opensAt, timezone)}</p>

        <div style={{ display: "flex", alignItems: "center", gap: "0.5rem" }}>
          <button
            type="button"
            disabled={isPending || isSaved}
            onClick={() => {
              setError(null);
              startTransition(async () => {
                const result = await setFlightCheckInWindowAction(tripId, { flightId, checkInWindowHours: windowHours });
                if (!result.ok) {
                  setError(result.error ?? "השמירה נכשלה.");
                  return;
                }
                router.refresh();
              });
            }}
            style={{
              padding: "0.35rem 0.75rem",
              borderRadius: "var(--radius-full)",
              border: "1px solid color-mix(in srgb, var(--color-primary) 30%, transparent)",
              background: isSaved ? "transparent" : "color-mix(in srgb, var(--color-primary) 14%, transparent)",
              color: "var(--color-primary)",
              cursor: isPending || isSaved ? "default" : "pointer",
              fontSize: "0.75rem",
              fontWeight: 600,
            }}
          >
            {isPending ? "שומר…" : isSaved ? "✓ נשמר" : "שמור והפעל תזכורת"}
          </button>
          <span style={{ fontSize: "0.6875rem", color: "var(--color-text-muted)" }}>נשמר על הטיסה כדי שהתראת &quot;צ&apos;ק-אין נפתח&quot; ב-/now תוכל לפעול</span>
        </div>
        {error ? <span style={{ color: "var(--color-danger)", fontSize: "0.75rem" }}>{error}</span> : null}
      </div>
    </details>
  );
}

const selectStyle: React.CSSProperties = {
  padding: "0.5rem",
  borderRadius: "var(--radius-md)",
  border: "1px solid var(--color-border)",
  background: "var(--color-surface-elevated)",
  color: "var(--color-text-primary)",
};
