"use client";

import { DeleteWithUndoButton } from "@/components/delete-with-undo-button";
import { restorePaymentAction } from "@/app/(app)/trash/actions";
import { softDeletePaymentAction } from "./actions";

export function DeletePaymentButton({ tripId, paymentId }: { tripId: string; paymentId: string }) {
  return (
    <DeleteWithUndoButton
      style={{ padding: "0.125rem 0.375rem", borderRadius: "var(--radius-full)", fontSize: "0.6875rem" }}
      onDelete={() => softDeletePaymentAction(tripId, paymentId)}
      onUndo={() => restorePaymentAction(paymentId)}
      undoMessage="התשלום הוסר. (יתרת הארנק לא עודכנה אוטומטית)"
    />
  );
}
