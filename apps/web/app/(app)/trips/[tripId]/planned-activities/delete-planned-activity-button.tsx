"use client";

import { DeleteWithUndoButton } from "@/components/delete-with-undo-button";
import { restorePlannedActivityAction } from "@/app/(app)/trash/actions";
import { softDeletePlannedActivityAction } from "./actions";

export function DeletePlannedActivityButton({ tripId, plannedActivityId }: { tripId: string; plannedActivityId: string }) {
  return (
    <DeleteWithUndoButton
      onDelete={() => softDeletePlannedActivityAction(tripId, plannedActivityId)}
      onUndo={() => restorePlannedActivityAction(plannedActivityId)}
      undoMessage="הפעילות הוסרה מהתכנון."
    />
  );
}
