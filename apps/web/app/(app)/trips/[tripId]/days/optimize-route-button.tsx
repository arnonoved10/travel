"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { optimizeDayRouteAction } from "./actions";

export function OptimizeRouteButton({ tripId, date }: { tripId: string; date: string }) {
  const [isPending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);
  const router = useRouter();

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: "0.375rem" }}>
      <button
        type="button"
        disabled={isPending}
        onClick={() => {
          setError(null);
          startTransition(async () => {
            const result = await optimizeDayRouteAction(tripId, date);
            if (!result.ok) {
              setError(result.error ?? "אופטימיזציית המסלול נכשלה.");
              return;
            }
            router.refresh();
          });
        }}
        style={{
          padding: "0.5rem 0.875rem",
          borderRadius: "var(--radius-full)",
          border: "1px solid color-mix(in srgb, var(--color-primary) 30%, transparent)",
          background: isPending ? "var(--color-secondary)" : "color-mix(in srgb, var(--color-primary) 14%, transparent)",
          color: "var(--color-primary)",
          cursor: isPending ? "default" : "pointer",
          fontSize: "0.8125rem",
          fontWeight: 600,
        }}
      >
        {isPending ? "מחשב מסלול…" : "🧭 מצא את המסלול הטוב ביותר"}
      </button>
      {error ? <span style={{ color: "var(--color-danger)", fontSize: "0.8125rem" }}>{error}</span> : null}
    </div>
  );
}
