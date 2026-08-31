"use client";

import type { ChecklistItem } from "@travel-app/shared-types";
import { toggleChecklistItemAction, deleteChecklistItemAction } from "./actions";

export function ChecklistItemRow({ tripId, item }: { tripId: string; item: ChecklistItem }) {
  return (
    <li style={{ display: "flex", alignItems: "center", gap: "0.5rem", padding: "0.375rem 0" }}>
      <form action={toggleChecklistItemAction.bind(null, tripId, item.id)}>
        <input
          type="checkbox"
          defaultChecked={item.isDone}
          onChange={(e) => e.currentTarget.form?.requestSubmit()}
          aria-label={`סמן "${item.name}" כבוצע`}
        />
      </form>
      <span style={{ flex: 1, textDecoration: item.isDone ? "line-through" : "none", color: item.isDone ? "var(--color-text-muted)" : "inherit" }}>
        {item.name}
        {item.quantity ? ` (x${item.quantity})` : ""}
        {item.category ? <span style={{ color: "var(--color-text-muted)", fontSize: "0.75rem" }}> · {item.category}</span> : null}
      </span>
      <form action={deleteChecklistItemAction.bind(null, tripId, item.id)}>
        <button
          type="submit"
          style={{
            padding: "0.125rem 0.5rem",
            borderRadius: "var(--radius-full)",
            border: "1px solid var(--color-border)",
            background: "var(--color-surface)",
            color: "var(--color-text-muted)",
            cursor: "pointer",
            fontSize: "0.75rem",
          }}
        >
          הסר
        </button>
      </form>
    </li>
  );
}
