"use client";

import { DeleteWithUndoButton } from "@/components/delete-with-undo-button";
import { restoreExpenseAction } from "@/app/(app)/trash/actions";
import { softDeleteExpenseAction } from "./actions";

export function DeleteExpenseButton({ tripId, expenseId }: { tripId: string; expenseId: string }) {
  return (
    <DeleteWithUndoButton
      style={{ padding: "0.25rem 0.5rem", borderRadius: "var(--radius-full)", fontSize: "0.75rem" }}
      onDelete={() => softDeleteExpenseAction(tripId, expenseId)}
      onUndo={() => restoreExpenseAction(expenseId)}
      undoMessage="ההוצאה הוסרה. (תשלומים שכבר נרשמו עליה לא התבטלו)"
    />
  );
}
