"use client";

import { discardSharedInboxItemAction } from "./actions";

// לא DeleteWithUndoButton: מחיקה כאן היא סופית לצמיתות (SharedInboxItem אין לו
// deletedAt/restore — זו תיבת-קליטה זמנית, לא רשומה היסטורית, ר' schema.prisma).
export function DiscardSharedItemButton({ itemId }: { itemId: string }) {
  return (
    <form
      action={discardSharedInboxItemAction.bind(null, itemId)}
      onSubmit={(event) => {
        if (!confirm("למחוק את הפריט המשותף? הפעולה לא ניתנת לביטול.")) {
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
          fontSize: "0.8125rem",
        }}
      >
        מחק
      </button>
    </form>
  );
}
