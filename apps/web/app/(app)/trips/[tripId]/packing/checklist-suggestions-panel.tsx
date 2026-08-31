"use client";

import { addSuggestedChecklistItemAction } from "./actions";

export interface ChecklistSuggestion {
  name: string;
  reason: string;
  checkUrl?: string;
}

export function ChecklistSuggestionsPanel({
  tripId,
  listType,
  title,
  suggestions,
}: {
  tripId: string;
  listType: "packing" | "before_trip";
  title: string;
  suggestions: ChecklistSuggestion[];
}) {
  if (suggestions.length === 0) return null;

  return (
    <div
      style={{
        display: "flex",
        flexDirection: "column",
        gap: "0.5rem",
        padding: "var(--space-4)",
        borderRadius: "var(--radius-md)",
        background: "var(--color-surface-elevated)",
        border: "1px solid var(--color-border)",
      }}
    >
      <div style={{ fontSize: "0.8125rem", fontWeight: 600 }}>{title}</div>
      <ul style={{ listStyle: "none", margin: 0, padding: 0, display: "flex", flexDirection: "column", gap: "0.375rem" }}>
        {suggestions.map((suggestion) => (
          <li key={suggestion.name} style={{ display: "flex", alignItems: "center", gap: "0.5rem" }}>
            <form action={addSuggestedChecklistItemAction.bind(null, tripId, listType, suggestion.name)}>
              <button
                type="submit"
                aria-label={`הוסף "${suggestion.name}" לרשימה`}
                style={{
                  padding: "0.125rem 0.5rem",
                  borderRadius: "var(--radius-full)",
                  border: "1px solid color-mix(in srgb, var(--color-primary) 30%, transparent)",
                  background: "color-mix(in srgb, var(--color-primary) 14%, transparent)",
                  color: "var(--color-primary)",
                  fontWeight: 600,
                  cursor: "pointer",
                  fontSize: "0.875rem",
                  lineHeight: 1.4,
                }}
              >
                +
              </button>
            </form>
            <span style={{ fontSize: "0.8125rem" }}>
              {suggestion.name}
              <span style={{ color: "var(--color-text-muted)" }}> — {suggestion.reason}</span>
              {suggestion.checkUrl ? (
                <>
                  {" · "}
                  <a href={suggestion.checkUrl} target="_blank" rel="noopener noreferrer" style={{ color: "var(--color-primary)" }}>
                    בדוק
                  </a>
                </>
              ) : null}
            </span>
          </li>
        ))}
      </ul>
    </div>
  );
}
