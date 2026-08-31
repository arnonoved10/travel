"use client";

import { markRefundReceivedAction } from "./actions";
import { DatePicker } from "@/components/ui/DatePicker";

export function MarkRefundReceivedForm({ tripId, refundId }: { tripId: string; refundId: string }) {
  return (
    <form
      action={markRefundReceivedAction.bind(null, tripId, refundId)}
      style={{ display: "flex", gap: "0.375rem", alignItems: "center", flexWrap: "wrap", marginTop: "0.375rem" }}
    >
      <DatePicker name="receivedDate" defaultValue={new Date().toISOString().slice(0, 10)} required style={{ width: "150px" }} />
      <button
        type="submit"
        style={{
          padding: "0.25rem 0.5rem",
          borderRadius: "var(--radius-full)",
          border: "1px solid color-mix(in srgb, var(--color-primary) 30%, transparent)",
          background: "color-mix(in srgb, var(--color-primary) 14%, transparent)",
          color: "var(--color-primary)",
          fontWeight: 600,
          cursor: "pointer",
          fontSize: "0.75rem",
        }}
      >
        סמן כהתקבל
      </button>
    </form>
  );
}
