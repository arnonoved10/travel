"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { computeAirportTiming } from "@/lib/airport-timing";
import { formatTimeWithIsraelReference } from "@/lib/dates";
import { setFlightAirportTimingAction } from "@/app/(app)/trips/[tripId]/bookings/actions";
import { Select } from "@/components/ui/Select";

const LEAD_TIME_OPTIONS = [
  { minutes: 90, label: "טיסת פנים/פנימית — 1.5 שעות" },
  { minutes: 120, label: "טיסה בינלאומית קצרה — 2 שעות" },
  { minutes: 180, label: "טיסה בינלאומית — 3 שעות" },
  { minutes: 240, label: "טיסה בינקונטיננטלית/עומס — 4 שעות" },
];

/**
 * מחשבון "מתי לצאת/מתי להגיע לשדה" — קלט (זמן-מראש+זמן-נסיעה) מגיע מהמשתמש
 * במפורש, לא ברירת מחדל מומצאת. בלי זמן נסיעה מוצגת רק שעת ההגעה לשדה.
 * "שמור" מתמיד את שני הערכים על הטיסה (Flight.airportArrivalLeadMinutes/
 * travelTimeToAirportMinutes) — זה מה שמזין את תזכורת "זמן לצאת לשדה" ב-/now,
 * בשונה מהתצוגה החיה למטה שמחושבת תמיד מקומית בלי שמירה.
 */
export function AirportTimingCalculator({
  tripId,
  flightId,
  departureAt,
  timezone,
  initialLeadMinutes,
  initialTravelMinutes,
}: {
  tripId: string;
  flightId: string;
  departureAt: string;
  timezone: string;
  initialLeadMinutes: number | null;
  initialTravelMinutes: number | null;
}) {
  const [leadMinutes, setLeadMinutes] = useState(initialLeadMinutes ?? 180);
  const [travelMinutes, setTravelMinutes] = useState<string>(initialTravelMinutes !== null ? String(initialTravelMinutes) : "");
  const [isPending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);
  const router = useRouter();

  const travelTimeToAirportMinutes = travelMinutes.trim() === "" ? undefined : Number(travelMinutes);
  const result = computeAirportTiming({
    departureAt,
    recommendedArrivalLeadMinutes: leadMinutes,
    travelTimeToAirportMinutes: Number.isFinite(travelTimeToAirportMinutes) ? travelTimeToAirportMinutes : undefined,
  });

  const isSaved = initialLeadMinutes === leadMinutes && (initialTravelMinutes ?? null) === (Number.isFinite(travelTimeToAirportMinutes) ? travelTimeToAirportMinutes! : null);

  return (
    <details style={{ marginTop: "0.375rem" }}>
      <summary style={{ cursor: "pointer", fontSize: "0.8125rem", color: "var(--color-primary)" }}>
        🛫 מתי לצאת לשדה?
      </summary>
      <div style={{ display: "flex", flexDirection: "column", gap: "0.375rem", marginTop: "0.5rem", maxWidth: "360px" }}>
        <label style={{ display: "flex", flexDirection: "column", gap: "0.25rem", fontSize: "0.8125rem" }}>
          <span>זמן מומלץ בשדה לפני המראה</span>
          <Select
            value={String(leadMinutes)}
            onChange={(v) => setLeadMinutes(Number(v))}
            style={selectStyle}
            options={LEAD_TIME_OPTIONS.map((opt) => ({ value: String(opt.minutes), label: opt.label }))}
          />
        </label>
        <label style={{ display: "flex", flexDirection: "column", gap: "0.25rem", fontSize: "0.8125rem" }}>
          <span>זמן נסיעה עד השדה (דקות, אופציונלי)</span>
          <input
            type="number"
            min={0}
            value={travelMinutes}
            onChange={(e) => setTravelMinutes(e.target.value)}
            placeholder="לדוגמה: 45"
            style={selectStyle}
          />
        </label>
        <p style={{ margin: 0, fontSize: "0.8125rem", color: "var(--color-text-muted)" }}>
          הגעה מומלצת לשדה: {formatTimeWithIsraelReference(result.recommendedAirportArrivalAt, timezone)}
        </p>
        {result.recommendedLeaveAt ? (
          <p style={{ margin: 0, fontSize: "0.8125rem", fontWeight: 600 }}>
            צאו עד: {formatTimeWithIsraelReference(result.recommendedLeaveAt, timezone)}
          </p>
        ) : (
          <p style={{ margin: 0, fontSize: "0.75rem", color: "var(--color-text-muted)" }}>
            הזינו זמן נסיעה כדי לראות גם שעת יציאה מומלצת ולאפשר תזכורת &quot;זמן לצאת לשדה&quot;.
          </p>
        )}

        <div style={{ display: "flex", alignItems: "center", gap: "0.5rem" }}>
          <button
            type="button"
            disabled={isPending || isSaved}
            onClick={() => {
              setError(null);
              startTransition(async () => {
                const result2 = await setFlightAirportTimingAction(tripId, {
                  flightId,
                  airportArrivalLeadMinutes: leadMinutes,
                  travelTimeToAirportMinutes: Number.isFinite(travelTimeToAirportMinutes) ? travelTimeToAirportMinutes! : null,
                });
                if (!result2.ok) {
                  setError(result2.error ?? "השמירה נכשלה.");
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
          <span style={{ fontSize: "0.6875rem", color: "var(--color-text-muted)" }}>
            נשמר על הטיסה כדי שהתראת &quot;זמן לצאת לשדה&quot; ב-/now תוכל לפעול
          </span>
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
