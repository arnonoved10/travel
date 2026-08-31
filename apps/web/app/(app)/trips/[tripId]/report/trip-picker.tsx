"use client";

import { useRouter } from "next/navigation";
import { Select } from "@/components/ui/Select";

export function TripPicker({ tripId, trips }: { tripId: string; trips: Array<{ id: string; name: string }> }) {
  const router = useRouter();

  if (trips.length <= 1) return null;

  return (
    <label style={{ display: "flex", flexDirection: "column", gap: "0.25rem", fontSize: "0.8125rem" }}>
      טיול לדוח
      <Select
        value={tripId}
        onChange={(v) => router.push(`/trips/${v}/report`)}
        style={{
          padding: "0.5rem",
          borderRadius: "var(--radius-md)",
          border: "1px solid var(--color-border)",
          background: "var(--color-surface-elevated)",
          color: "var(--color-text-primary)",
        }}
        options={trips.map((t) => ({ value: t.id, label: t.name }))}
      />
    </label>
  );
}
