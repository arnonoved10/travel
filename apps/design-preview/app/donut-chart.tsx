/** גרף-עוגה (SVG, טכניקת stroke-dasharray למספר-פלחים) — משותף בין דף
 * הבית ("פילוח הוצאות") ודף "הוצאות" החדש, כדי לא לשכפל את הלוגיקה. */
export function DonutChart({ segments, size = 130, strokeWidth = 22 }: { segments: { color: string; value: number }[]; size?: number; strokeWidth?: number }) {
  const total = segments.reduce((sum, s) => sum + s.value, 0);
  const radius = (size - strokeWidth) / 2;
  const circumference = 2 * Math.PI * radius;
  let cumulative = 0;
  return (
    <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`}>
      <circle cx={size / 2} cy={size / 2} r={radius} fill="none" stroke="rgba(255,255,255,0.07)" strokeWidth={strokeWidth} />
      {total > 0
        ? segments.map((seg, i) => {
            const fraction = seg.value / total;
            const dash = fraction * circumference;
            const offset = -cumulative * circumference;
            cumulative += fraction;
            return (
              <circle
                key={i}
                cx={size / 2}
                cy={size / 2}
                r={radius}
                fill="none"
                stroke={seg.color}
                strokeWidth={strokeWidth}
                strokeDasharray={`${dash} ${circumference - dash}`}
                strokeDashoffset={offset}
                transform={`rotate(-90 ${size / 2} ${size / 2})`}
              />
            );
          })
        : null}
    </svg>
  );
}
