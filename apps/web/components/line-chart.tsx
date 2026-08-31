/** Pure SVG line/trend chart — no charting library dependency, matching the project's
 * existing pattern (see BarChart, DonutChart). `points` must already be in x-axis order. */
export function LineChart({
  points,
  unit,
  height = 140,
}: {
  points: Array<{ label: string; value: number }>;
  unit: string;
  height?: number;
}) {
  if (points.length === 0) return null;

  const width = Math.max(points.length * 36, 240);
  const padding = 8;
  const max = Math.max(...points.map((p) => p.value), 1);
  const innerHeight = height - padding * 2;

  const coords = points.map((p, i) => {
    const x = points.length === 1 ? width / 2 : (i / (points.length - 1)) * (width - padding * 2) + padding;
    const y = padding + innerHeight - (p.value / max) * innerHeight;
    return { x, y, ...p };
  });

  const polylinePoints = coords.map((c) => `${c.x},${c.y}`).join(" ");
  const areaPoints = `${padding},${height - padding} ${polylinePoints} ${width - padding},${height - padding}`;
  const last = coords[coords.length - 1]!;

  // רק כמה תוויות על ציר ה-X (לא כל נקודה) כדי לא לצפוף — הראשונה, האחרונה, ועוד כמה באמצע.
  const labelIndices = new Set<number>([0, coords.length - 1]);
  const step = Math.ceil(coords.length / 5);
  for (let i = 0; i < coords.length; i += step) labelIndices.add(i);

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: "0.375rem" }}>
      <div style={{ overflowX: "auto" }}>
        <svg width={width} height={height} viewBox={`0 0 ${width} ${height}`} style={{ display: "block", minWidth: "100%" }}>
          <polygon points={areaPoints} fill="var(--color-primary)" opacity={0.12} />
          <polyline points={polylinePoints} fill="none" stroke="var(--color-primary)" strokeWidth={2} strokeLinejoin="round" strokeLinecap="round" />
          {coords.map((c) => (
            <circle key={c.label} cx={c.x} cy={c.y} r={c === last ? 4 : 2} fill="var(--color-primary)" />
          ))}
        </svg>
      </div>
      <div style={{ display: "flex", justifyContent: "space-between", fontSize: "0.75rem", color: "var(--color-text-muted)" }}>
        {coords
          .filter((_, i) => labelIndices.has(i))
          .map((c) => (
            <span key={c.label}>{c.label}</span>
          ))}
      </div>
      <p style={{ margin: 0, fontSize: "0.8125rem", color: "var(--color-text-muted)" }}>
        סה&quot;כ מצטבר: <strong style={{ color: "var(--color-text-primary)" }}>{Math.round(last.value * 100) / 100}</strong> {unit}
      </p>
    </div>
  );
}
