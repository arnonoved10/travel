export type StatusBadgeTone = "success" | "info" | "warning" | "danger" | "neutral" | "brand";

const TONE_COLOR: Record<StatusBadgeTone, string> = {
  success: "var(--color-success)",
  info: "var(--color-info)",
  warning: "var(--color-warning)",
  danger: "var(--color-danger)",
  neutral: "var(--color-text-muted)",
  brand: "var(--color-primary)",
};

export function StatusBadge({ label, tone = "neutral" }: { label: string; tone?: StatusBadgeTone }) {
  const color = TONE_COLOR[tone];
  return (
    <span
      style={{
        display: "inline-flex",
        alignItems: "center",
        padding: "0.25rem 0.625rem",
        borderRadius: "var(--radius-full)",
        fontSize: "0.6875rem",
        fontWeight: 700,
        letterSpacing: "0.02em",
        color,
        background: `color-mix(in srgb, ${color} 16%, transparent)`,
        border: `1px solid color-mix(in srgb, ${color} 30%, transparent)`,
        whiteSpace: "nowrap",
      }}
    >
      {label}
    </span>
  );
}
