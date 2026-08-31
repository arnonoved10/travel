"use client";

import { markDepositReturnedAction } from "./actions";
import { inputStyle } from "../bookings/form-styles";
import { DatePicker } from "@/components/ui/DatePicker";

export function MarkDepositReturnedForm({
  tripId,
  depositId,
  defaultAmount,
}: {
  tripId: string;
  depositId: string;
  defaultAmount: number;
}) {
  return (
    <form
      action={markDepositReturnedAction.bind(null, tripId, depositId)}
      style={{ display: "flex", gap: "0.375rem", alignItems: "center", flexWrap: "wrap", marginTop: "0.375rem" }}
    >
      <input
        name="returnedAmount"
        type="number"
        min="0"
        step="0.01"
        defaultValue={defaultAmount}
        required
        style={{ ...inputStyle, maxWidth: "110px", padding: "0.25rem 0.5rem" }}
      />
      <DatePicker name="returnedDate" defaultValue={new Date().toISOString().slice(0, 10)} required style={{ width: "150px" }} />
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
        סמן כהוחזר
      </button>
    </form>
  );
}
