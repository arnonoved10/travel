"use client";

import { DeleteWithUndoButton } from "@/components/delete-with-undo-button";
import { softDeletePlaceAction } from "./actions";
import { restorePlaceAction } from "@/app/(app)/trash/actions";

export function DeletePlaceButton({ placeId }: { placeId: string }) {
  return (
    <DeleteWithUndoButton
      onDelete={() => softDeletePlaceAction(placeId)}
      onUndo={() => restorePlaceAction(placeId)}
      undoMessage="המקום הוסר מהספרייה."
    />
  );
}
