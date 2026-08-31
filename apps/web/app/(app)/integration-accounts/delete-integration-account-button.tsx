"use client";

import { DeleteWithUndoButton } from "@/components/delete-with-undo-button";
import { restoreIntegrationAccountAction, softDeleteIntegrationAccountAction } from "./actions";

export function DeleteIntegrationAccountButton({ integrationAccountId }: { integrationAccountId: string }) {
  return (
    <DeleteWithUndoButton
      style={{ padding: "0.375rem 0.75rem", borderRadius: "var(--radius-full)", fontSize: "0.8125rem" }}
      onDelete={() => softDeleteIntegrationAccountAction(integrationAccountId)}
      onUndo={() => restoreIntegrationAccountAction(integrationAccountId)}
      undoMessage="החשבון הוסר."
    />
  );
}
