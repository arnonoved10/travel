import type { LucideIcon } from "lucide-react";
import type { ReactNode } from "react";
import { ICON_SIZE, ICON_STROKE_WIDTH } from "./tokens";

export function EmptyState({
  icon: Icon,
  title,
  description,
  action,
}: {
  icon: LucideIcon;
  title: string;
  description?: string;
  action?: ReactNode;
}) {
  return (
    <div
      style={{
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        textAlign: "center",
        gap: "var(--space-2)",
        padding: "var(--space-5) var(--space-3)",
        color: "var(--color-text-muted)",
      }}
    >
      <div
        style={{
          width: "2.75rem",
          height: "2.75rem",
          borderRadius: "50%",
          background: "var(--color-surface)",
          border: "1px solid var(--color-border)",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
        }}
      >
        <Icon size={ICON_SIZE.lg} strokeWidth={ICON_STROKE_WIDTH} aria-hidden />
      </div>
      <div style={{ font: "var(--text-card-title)", color: "var(--color-text-secondary)" }}>{title}</div>
      {description ? <div style={{ font: "var(--text-caption)", maxWidth: "260px" }}>{description}</div> : null}
      {action}
    </div>
  );
}
