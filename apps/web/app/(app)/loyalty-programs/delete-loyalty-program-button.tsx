"use client";

import { DeleteWithUndoButton } from "@/components/delete-with-undo-button";
import { restoreLoyaltyProgramAction, softDeleteLoyaltyProgramAction } from "./actions";

export function DeleteLoyaltyProgramButton({ loyaltyProgramId }: { loyaltyProgramId: string }) {
  return (
    <DeleteWithUndoButton
      style={{ padding: "0.375rem 0.75rem", borderRadius: "var(--radius-full)", fontSize: "0.8125rem" }}
      onDelete={() => softDeleteLoyaltyProgramAction(loyaltyProgramId)}
      onUndo={() => restoreLoyaltyProgramAction(loyaltyProgramId)}
      undoMessage="התוכנית הוסרה."
    />
  );
}
