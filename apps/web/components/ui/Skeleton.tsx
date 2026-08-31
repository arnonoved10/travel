import type { CSSProperties } from "react";

const shimmerStyle: CSSProperties = {
  background: "var(--color-surface)",
  borderRadius: "var(--radius-sm)",
  animation: "skeleton-pulse 1.4s ease-in-out infinite",
};

export function SkeletonBar({ width = "100%", height = "1rem" }: { width?: string; height?: string }) {
  return <div style={{ ...shimmerStyle, width, height }} />;
}

export function SkeletonCard({ height = "8rem" }: { height?: string }) {
  return (
    <div
      style={{
        border: "1px solid var(--color-border)",
        borderRadius: "var(--radius-lg)",
        padding: "var(--space-4)",
        height,
        display: "flex",
        flexDirection: "column",
        gap: "var(--space-2)",
        justifyContent: "center",
      }}
    >
      <SkeletonBar width="40%" height="0.75rem" />
      <SkeletonBar width="70%" height="1.5rem" />
    </div>
  );
}
