export interface DonutChartSegment {
  label: string;
  value: number;
  color: string;
}

/** Pure SVG donut chart — no charting library dependency, matching the project's existing
 * pattern of building simple visualizations from scratch (see the trip report's BarChart). */
export function DonutChart({
  segments,
  size = 140,
  strokeWidth = 20,
  centerLabel,
  centerSubLabel,
}: {
  segments: DonutChartSegment[];
  size?: number;
  strokeWidth?: number;
  centerLabel?: string;
  centerSubLabel?: string;
}) {
  const total = segments.reduce((sum, s) => sum + s.value, 0);
  const radius = (size - strokeWidth) / 2;
  const circumference = 2 * Math.PI * radius;

  const arcs = segments
    .filter((s) => s.value > 0)
    .reduce<{ label: string; value: number; color: string; dash: number; offset: number }[]>((acc, s) => {
      const fraction = total > 0 ? s.value / total : 0;
      const dash = fraction * circumference;
      const previousOffset = acc.length > 0 ? acc[acc.length - 1]!.offset + acc[acc.length - 1]!.dash : 0;
      acc.push({ ...s, dash, offset: previousOffset });
      return acc;
    }, []);

  return (
    <div style={{ display: "flex", alignItems: "center", gap: "1rem", flexWrap: "wrap" }}>
      <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`} style={{ transform: "rotate(-90deg)" }}>
        <circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          fill="none"
          stroke="var(--color-border)"
          strokeWidth={strokeWidth}
        />
        {arcs.map((arc) => (
          <circle
            key={arc.label}
            cx={size / 2}
            cy={size / 2}
            r={radius}
            fill="none"
            stroke={arc.color}
            strokeWidth={strokeWidth}
            strokeDasharray={`${arc.dash} ${circumference - arc.dash}`}
            strokeDashoffset={-arc.offset}
            strokeLinecap="butt"
          />
        ))}
        {centerLabel ? (
          <g style={{ transform: "rotate(90deg)", transformOrigin: "center" }}>
            <text x={size / 2} y={size / 2 - 4} textAnchor="middle" fontSize="15" fontWeight="700" fill="var(--color-text)">
              {centerLabel}
            </text>
            {centerSubLabel ? (
              <text x={size / 2} y={size / 2 + 14} textAnchor="middle" fontSize="10" fill="var(--color-text-muted)">
                {centerSubLabel}
              </text>
            ) : null}
          </g>
        ) : null}
      </svg>

      <ul style={{ listStyle: "none", margin: 0, padding: 0, display: "flex", flexDirection: "column", gap: "0.375rem" }}>
        {arcs.map((arc) => (
          <li key={arc.label} style={{ display: "flex", alignItems: "center", gap: "0.5rem", fontSize: "0.8125rem" }}>
            <span style={{ width: "10px", height: "10px", borderRadius: "50%", background: arc.color, flexShrink: 0 }} />
            <span>{arc.label}</span>
            <span style={{ color: "var(--color-text-muted)" }}>
              {total > 0 ? Math.round((arc.value / total) * 100) : 0}%
            </span>
          </li>
        ))}
      </ul>
    </div>
  );
}
