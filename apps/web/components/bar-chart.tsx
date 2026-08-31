// גרף עמודות אופקי פשוט ב-CSS/flex — בלי ספריית תרשימים חיצונית. מכבד RTL
// אוטומטית (html dir="rtl") כי הפס הממולא הוא flex item יחיד בתוך track,
// וכיוון ה-flex עוקב אחרי ה-direction של המסמך.
export function BarChart({ data, unit }: { data: Array<{ label: string; value: number }>; unit: string }) {
  if (data.length === 0) return null;
  const max = Math.max(...data.map((d) => d.value), 1);

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: "0.5rem" }}>
      {data.map((d) => (
        <div key={d.label}>
          <div style={{ display: "flex", justifyContent: "space-between", fontSize: "0.8125rem", marginBottom: "0.25rem" }}>
            <span>{d.label}</span>
            <span style={{ color: "var(--color-text-muted)" }}>
              {Math.round(d.value * 100) / 100} {unit}
            </span>
          </div>
          <div style={{ display: "flex", background: "var(--color-surface-elevated)", borderRadius: "var(--radius-full)", height: "10px", overflow: "hidden" }}>
            <div
              style={{
                width: `${Math.max((d.value / max) * 100, 2)}%`,
                background: "var(--gradient-brand)",
                borderRadius: "var(--radius-full)",
              }}
            />
          </div>
        </div>
      ))}
    </div>
  );
}
