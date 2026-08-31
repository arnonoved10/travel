import type { ReactNode } from "react";

export interface TimelineItem {
  id: string;
  time: string;
  title: string;
  detail?: string;
  /** Dot color for this event, e.g. differentiating hotel/flight/transport at a glance
   * (see Trip Master Dashboard mockup, Claude Design 2026-08-27). Defaults to the brand
   * gradient when omitted, matching every existing caller's current look. */
  dotColor?: string;
  /** תוכן חופשי בקצה השורה (למשל כפתור-מחיקה) — ר' days/[date]/page.tsx, שם
   * כל פריט בציר-הזמן ניתן-למחיקה במקום. אופציונלי, לא שובר קריאות קיימות. */
  action?: ReactNode;
}

export function Timeline({ items }: { items: TimelineItem[] }) {
  return (
    <ol style={{ listStyle: "none", margin: 0, padding: 0, display: "flex", flexDirection: "column" }}>
      {items.map((item, index) => (
        <li key={item.id} style={{ display: "flex", gap: "var(--space-3)" }}>
          <div style={{ display: "flex", flexDirection: "column", alignItems: "center", width: "3.5rem", flexShrink: 0 }}>
            <span style={{ font: "var(--text-label)", color: "var(--color-primary)", whiteSpace: "nowrap" }}>{item.time}</span>
            <span
              aria-hidden
              style={{
                marginTop: "0.375rem",
                width: "10px",
                height: "10px",
                borderRadius: "50%",
                background: item.dotColor ?? "var(--gradient-brand)",
                boxShadow: item.dotColor ? `0 0 10px color-mix(in srgb, ${item.dotColor} 70%, transparent)` : "var(--glow-brand)",
                flexShrink: 0,
              }}
            />
            {index < items.length - 1 ? (
              <span aria-hidden style={{ flex: 1, width: "1px", background: "var(--color-border)", marginTop: "0.25rem" }} />
            ) : null}
          </div>
          <div style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between", gap: "0.5rem", flex: 1, paddingBottom: "var(--space-4)" }}>
            <div>
              <div style={{ font: "var(--text-card-title)" }}>{item.title}</div>
              {item.detail ? (
                <div style={{ font: "var(--text-caption)", color: "var(--color-text-muted)" }}>{item.detail}</div>
              ) : null}
            </div>
            {item.action ? <div style={{ flexShrink: 0 }}>{item.action}</div> : null}
          </div>
        </li>
      ))}
    </ol>
  );
}
