import type { MapStyleId } from "@/lib/map/types";

const STYLES: { id: MapStyleId; label: string; comingSoon?: boolean }[] = [
  { id: "standard-3d", label: "3D" },
  { id: "satellite", label: "לוויין" },
  { id: "street", label: "רחובות" },
  { id: "terrain", label: "טופוגרפיה", comingSoon: true },
  { id: "night", label: "לילה", comingSoon: true },
];

export function StyleSwitcher({ current, onChange }: { current: MapStyleId; onChange: (style: MapStyleId) => void }) {
  return (
    <div
      style={{
        display: "flex",
        gap: "0.25rem",
        background: "var(--color-surface-solid)",
        border: "1px solid var(--color-border)",
        borderRadius: "var(--radius-md)",
        padding: "0.25rem",
      }}
    >
      {STYLES.map((s) => (
        <button
          key={s.id}
          type="button"
          onClick={() => onChange(s.id)}
          title={s.comingSoon ? `${s.label} — נתמך חלקית, עדיין בפיתוח` : s.label}
          style={{
            border: "none",
            cursor: "pointer",
            padding: "0.375rem 0.625rem",
            borderRadius: "var(--radius-sm)",
            background: current === s.id ? "var(--color-primary)" : "transparent",
            color: current === s.id ? "#fff" : "var(--color-text)",
            fontSize: "0.75rem",
            fontWeight: current === s.id ? 600 : 400,
            opacity: s.comingSoon && current !== s.id ? 0.6 : 1,
            whiteSpace: "nowrap",
          }}
        >
          {s.label}
          {s.comingSoon ? " (בקרוב)" : ""}
        </button>
      ))}
    </div>
  );
}
