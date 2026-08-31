"use client";

import { DeleteWithUndoButton } from "@/components/delete-with-undo-button";
import { restoreDocumentAction } from "@/app/(app)/trash/actions";
import { softDeleteDocumentAction } from "./actions";

export function DeleteDocumentButton({ tripId, documentId }: { tripId: string; documentId: string }) {
  return (
    <DeleteWithUndoButton
      style={{ padding: "0.25rem 0.5rem", borderRadius: "var(--radius-full)", fontSize: "0.75rem" }}
      onDelete={() => softDeleteDocumentAction(tripId, documentId)}
      onUndo={() => restoreDocumentAction(documentId)}
      undoMessage="המסמך הוסר."
    />
  );
}
