"use client";

import { deleteBudgetCategoryLimitAction } from "./actions";

export function DeleteBudgetCategoryLimitButton({ tripId, limitId }: { tripId: string; limitId: string }) {
  return (
    <form action={deleteBudgetCategoryLimitAction.bind(null, tripId, limitId)} style={{ display: "inline" }}>
      <button
        type="submit"
        style={{
          padding: "0.125rem 0.4rem",
          borderRadius: "var(--radius-full)",
          border: "1px solid var(--color-border)",
          background: "var(--color-surface)",
          color: "var(--color-text-muted)",
          cursor: "pointer",
          fontSize: "0.75rem",
          marginInlineStart: "0.375rem",
        }}
      >
        הסר
      </button>
    </form>
  );
}
