"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import type { FlightLiveStatus } from "@travel-app/shared-types";
import { checkFlightStatusAction } from "@/app/(app)/trips/[tripId]/bookings/actions";
import { FLIGHT_LIVE_STATUS_LABELS, FLIGHT_LIVE_STATUS_TONE } from "@/lib/flight-live-status-labels";
import { StatusBadge } from "./ui/StatusBadge";

/**
 * בדיקת סטטוס-טיסה חי (Aviationstack) — כפתור מפורש, לא polling אוטומטי (המכסה
 * החינמית מוגבלת ל-100 קריאות/חודש). מציג את התוצאה האמיתית האחרונה שנבדקה,
 * כולל מתי — לא "רענון שקוף" שמסתיר שהנתון עשוי להיות ישן.
 */
export function FlightStatusCheck({
  tripId,
  flightId,
  flightNumber,
  flightDate,
  liveStatus,
  liveDelayMinutes,
  liveStatusCheckedAt,
  isConfigured,
}: {
  tripId: string;
  flightId: string;
  flightNumber: string | null;
  flightDate: string;
  liveStatus: FlightLiveStatus | null;
  liveDelayMinutes: number | null;
  liveStatusCheckedAt: string | null;
  isConfigured: boolean;
}) {
  const [isPending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);
  const router = useRouter();

  if (!isConfigured && !liveStatus) return null;

  return (
    <span style={{ display: "inline-flex", alignItems: "center", gap: "0.375rem", flexWrap: "wrap" }}>
      {liveStatus ? (
        <>
          <StatusBadge label={FLIGHT_LIVE_STATUS_LABELS[liveStatus]} tone={FLIGHT_LIVE_STATUS_TONE[liveStatus]} />
          {liveDelayMinutes ? <span style={{ fontSize: "0.75rem", color: "var(--color-danger)" }}>עיכוב {liveDelayMinutes} דק&apos;</span> : null}
          {liveStatusCheckedAt ? (
            <span style={{ fontSize: "0.6875rem", color: "var(--color-text-muted)" }}>נבדק {new Date(liveStatusCheckedAt).toLocaleString("he-IL")}</span>
          ) : null}
        </>
      ) : null}
      {isConfigured ? (
        <button
          type="button"
          disabled={isPending || !flightNumber}
          title={!flightNumber ? "יש להזין מספר טיסה כדי לבדוק סטטוס" : undefined}
          onClick={() => {
            setError(null);
            startTransition(async () => {
              const result = await checkFlightStatusAction(tripId, flightId, flightNumber ?? "", flightDate);
              if (!result.ok) {
                setError(result.error ?? "הבדיקה נכשלה.");
                return;
              }
              router.refresh();
            });
          }}
          style={{
            padding: "0.25rem 0.625rem",
            borderRadius: "var(--radius-full)",
            border: "1px solid var(--color-border)",
            background: "var(--color-surface)",
            color: "var(--color-text-primary)",
            cursor: isPending || !flightNumber ? "default" : "pointer",
            fontSize: "0.75rem",
            fontWeight: 600,
          }}
        >
          {isPending ? "בודק…" : "🔄 בדוק סטטוס טיסה"}
        </button>
      ) : null}
      {error ? <span style={{ color: "var(--color-danger)", fontSize: "0.75rem" }}>{error}</span> : null}
    </span>
  );
}
