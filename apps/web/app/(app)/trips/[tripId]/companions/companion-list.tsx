"use client";

import type { TripCompanion } from "@travel-app/shared-types";
import { deleteTripCompanionAction } from "./actions";
import { Avatar } from "@/components/ui/Avatar";

export function TripCompanionList({ tripId, companions }: { tripId: string; companions: TripCompanion[] }) {
  if (companions.length === 0) {
    return <p style={{ color: "var(--color-text-muted)", fontSize: "0.875rem", margin: 0 }}>אין עדיין מלווים בטיול הזה.</p>;
  }

  return (
    <ul style={{ listStyle: "none", margin: 0, padding: 0, display: "flex", flexDirection: "column", gap: "0.25rem" }}>
      {companions.map((companion) => (
        <li key={companion.id} style={{ display: "flex", alignItems: "center", gap: "0.625rem", padding: "0.25rem 0" }}>
          <Avatar label={companion.displayName} size={28} />
          <span style={{ flex: 1 }}>
            {companion.displayName}
            {companion.relation ? <span style={{ color: "var(--color-text-muted)", fontSize: "0.75rem" }}> · {companion.relation}</span> : null}
          </span>
          <form action={deleteTripCompanionAction.bind(null, tripId, companion.id)}>
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
      ))}
    </ul>
  );
}
