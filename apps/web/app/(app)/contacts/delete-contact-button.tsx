"use client";

import { DeleteWithUndoButton } from "@/components/delete-with-undo-button";
import { restoreContactAction } from "@/app/(app)/trash/actions";
import { softDeleteContactAction } from "./actions";

export function DeleteContactButton({ contactId }: { contactId: string }) {
  return (
    <DeleteWithUndoButton
      style={{ padding: "0.375rem 0.75rem", borderRadius: "var(--radius-full)", fontSize: "0.8125rem" }}
      onDelete={() => softDeleteContactAction(contactId)}
      onUndo={() => restoreContactAction(contactId)}
      undoMessage="איש הקשר הוסר."
    />
  );
}
