import type { Icon as PhosphorIcon } from "@phosphor-icons/react";
import type { ReactNode } from "react";
import Link from "next/link";
import { GlassCard } from "./GlassCard";
import { ProgressRing } from "./ProgressRing";
import { ICON_SIZE } from "./tokens";

export type StatCardTint = "primary" | "blue" | "purple" | "pink" | "success";

const TINT_COLOR: Record<StatCardTint, string> = {
  primary: "var(--color-primary)",
  blue: "var(--color-accent-blue)",
  purple: "var(--color-accent-purple)",
  pink: "var(--color-accent-pink)",
  success: "var(--color-success)",
};

export function StatCard({
  label,
  value,
  icon: Icon,
  hint,
  ringPercent,
  tint = "primary",
  href,
}: {
  label: string;
  value: ReactNode;
  icon?: PhosphorIcon;
  hint?: string;
  /** When set, renders a small progress ring instead of the icon badge — used where a
   * real ratio exists (e.g. spent vs. loaded funds), never a fabricated percentage. */
  ringPercent?: number;
  /** Icon-badge accent. Defaults to the app's single selectable brand color (unchanged
   * behavior for every existing call site) — pass a specific tint to give a metric its
   * own identity, e.g. a row of stat cards where each one covers a different topic. */
  tint?: StatCardTint;
  /** כשקיים, כל הכרטיס הופך לקישור אמיתי לשם — בלי זה הכרטיס נראה לחיץ (עיצוב
   * interactive) אבל לא עושה כלום בלחיצה, ר' תלונת-משתמש "אני לוחץ על האייקונים
   * ולא קורה כלום". */
  href?: string;
}) {
  const color = TINT_COLOR[tint];
  const card = (
    <GlassCard variant="secondary" interactive>
      <div style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between" }}>
        <div>
          <div style={{ font: "var(--text-caption)", color: "var(--color-text-muted)", marginBottom: "0.25rem" }}>{label}</div>
          <div style={{ font: "var(--text-metric)" }}>{value}</div>
          {hint ? (
            <div style={{ font: "var(--text-caption)", color: "var(--color-text-muted)", marginTop: "0.125rem" }}>{hint}</div>
          ) : null}
        </div>
        {ringPercent !== undefined ? (
          <ProgressRing percent={ringPercent} size={40} strokeWidth={4} />
        ) : Icon ? (
          <div
            style={{
              width: "2.875rem",
              height: "2.875rem",
              borderRadius: "13px",
              background: `color-mix(in srgb, ${color} 16%, transparent)`,
              border: `1px solid color-mix(in srgb, ${color} 30%, transparent)`,
              color,
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              flexShrink: 0,
            }}
          >
            <Icon size={ICON_SIZE.lg} weight="fill" aria-hidden />
          </div>
        ) : null}
      </div>
    </GlassCard>
  );

  if (!href) return card;
  return (
    <Link href={href} style={{ display: "block", textDecoration: "none", color: "inherit" }}>
      {card}
    </Link>
  );
}
