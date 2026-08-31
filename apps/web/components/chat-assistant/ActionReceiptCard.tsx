"use client";

import { CheckCircle } from "@phosphor-icons/react";
import { DeleteWithUndoButton } from "@/components/delete-with-undo-button";
import type { ExecutedChatAction } from "@/app/(app)/assistant/actions";
import {
  softDeleteHotelStayAction,
  softDeleteFlightAction,
  softDeleteTransportBookingAction,
} from "@/app/(app)/trips/[tripId]/bookings/actions";
import { softDeleteExpenseAction } from "@/app/(app)/trips/[tripId]/finances/actions";
import {
  restoreExpenseAction,
  restoreHotelStayAction,
  restoreFlightAction,
  restoreTransportBookingAction,
} from "@/app/(app)/trash/actions";

/** "כרטיס-קבלה" לכל פעולה אמיתית שהעוזר ביצע — לא בונה מנגנון-ביטול חדש, קורא
 * לאותם softDeleteXAction/restoreXAction שכל כפתור-מחיקה רגיל באפליקציה כבר
 * משתמש בהם (DeleteWithUndoButton, ר' bookings/delete-booking-buttons.tsx). */
export function ActionReceiptCard({ action }: { action: ExecutedChatAction }) {
  const undoHandlers = (() => {
    switch (action.kind) {
      case "expense":
        return { onDelete: () => softDeleteExpenseAction(action.tripId, action.entityId), onUndo: () => restoreExpenseAction(action.entityId) };
      case "hotel":
        return { onDelete: () => softDeleteHotelStayAction(action.tripId, action.entityId), onUndo: () => restoreHotelStayAction(action.entityId) };
      case "flight":
        return { onDelete: () => softDeleteFlightAction(action.tripId, action.entityId), onUndo: () => restoreFlightAction(action.entityId) };
      case "transport":
        return {
          onDelete: () => softDeleteTransportBookingAction(action.tripId, action.entityId),
          onUndo: () => restoreTransportBookingAction(action.entityId),
        };
      default:
        return null;
    }
  })();

  return (
    <div
      style={{
        display: "flex",
        alignItems: "center",
        justifyContent: "space-between",
        gap: "0.5rem",
        padding: "0.5rem 0.75rem",
        borderRadius: "var(--radius-md)",
        background: "color-mix(in srgb, var(--color-success) 12%, transparent)",
        border: "1px solid color-mix(in srgb, var(--color-success) 30%, transparent)",
        fontSize: "0.8125rem",
      }}
    >
      <span style={{ display: "flex", alignItems: "center", gap: "0.375rem" }}>
        <CheckCircle size={16} weight="fill" color="var(--color-success)" aria-hidden />
        {action.summary}
      </span>
      {action.undoable && undoHandlers ? (
        <DeleteWithUndoButton
          label="בטל"
          style={{ padding: "0.125rem 0.5rem", fontSize: "0.75rem" }}
          onDelete={undoHandlers.onDelete}
          onUndo={undoHandlers.onUndo}
          undoMessage="הפעולה בוטלה."
        />
      ) : null}
    </div>
  );
}
