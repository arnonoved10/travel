"use client";

import { useTransition } from "react";
import { moveRouteStopAction, removeRouteStopAction } from "./actions";

const buttonStyle: React.CSSProperties = {
  padding: "0.25rem 0.5rem",
  borderRadius: "var(--radius-full)",
  border: "1px solid var(--color-border)",
  background: "var(--color-surface)",
  color: "var(--color-text-primary)",
  cursor: "pointer",
  fontSize: "0.875rem",
};

export function RouteStopControls({
  tripId,
  date,
  routeStopId,
  isFirst,
  isLast,
}: {
  tripId: string;
  date: string;
  routeStopId: string;
  isFirst: boolean;
  isLast: boolean;
}) {
  const [isPending, startTransition] = useTransition();

  return (
    <div style={{ display: "flex", gap: "0.375rem" }}>
      <button
        type="button"
        disabled={isPending || isFirst}
        onClick={() => startTransition(() => void moveRouteStopAction(tripId, date, routeStopId, "up"))}
        style={{ ...buttonStyle, opacity: isFirst ? 0.4 : 1 }}
      >
        ⬆️
      </button>
      <button
        type="button"
        disabled={isPending || isLast}
        onClick={() => startTransition(() => void moveRouteStopAction(tripId, date, routeStopId, "down"))}
        style={{ ...buttonStyle, opacity: isLast ? 0.4 : 1 }}
      >
        ⬇️
      </button>
      <button
        type="button"
        disabled={isPending}
        onClick={() => {
          if (confirm("להסיר את העצירה מהמסלול?")) {
            startTransition(() => void removeRouteStopAction(tripId, date, routeStopId));
          }
        }}
        style={{ ...buttonStyle, borderColor: "var(--color-danger)", color: "var(--color-danger)" }}
      >
        הסר
      </button>
    </div>
  );
}
