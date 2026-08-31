"use client";

import { softDeleteTripAction } from "./actions";

// לא עבר לדפוס DeleteWithUndoButton: softDeleteTripAction מבצע redirect ל-/trips מיד
// אחרי המחיקה (כי אי אפשר להישאר על עמוד טיול שנמחק), כך שאין הזדמנות להציג טוסט על
// אותו עמוד — לשחזור יש כבר את `/trash` הקיים.
export function DeleteTripButton({ tripId }: { tripId: string }) {
  return (
    <form
      action={softDeleteTripAction.bind(null, tripId)}
      onSubmit={(event) => {
        if (!confirm("למחוק את הטיול? אפשר לשחזר אותו מאוחר יותר מרשימת הטיולים שנמחקו.")) {
          event.preventDefault();
        }
      }}
    >
      <button
        type="submit"
        style={{
          padding: "0.5rem 1rem",
          borderRadius: "var(--radius-full)",
          border: "1px solid color-mix(in srgb, var(--color-danger) 30%, transparent)",
          background: "color-mix(in srgb, var(--color-danger) 12%, transparent)",
          color: "var(--color-danger)",
          fontWeight: 600,
          cursor: "pointer",
        }}
      >
        מחק טיול (Soft Delete)
      </button>
    </form>
  );
}
