import type { ReactNode } from "react";
import Link from "next/link";
import { GlassCard, type GlassCardVariant } from "@/components/ui/GlassCard";

/** Title+action header composed on top of GlassCard — the recurring "card with a heading
 * and an optional link" shape used across the dashboard, not a competing primitive.
 * GlassCard is always rendered `interactive` (cursor:pointer + hover) — without an `href`
 * that's a false affordance (looks clickable, does nothing), so any DashboardCard with no
 * navigation of its own should get one. */
export function DashboardCard({
  title,
  action,
  variant = "primary",
  href,
  children,
}: {
  title: string;
  action?: ReactNode;
  variant?: GlassCardVariant;
  /** כשמוגדר, כל הכרטיס הופך לקישור — לכרטיסים שאין להם action/קישור-פנימי משלהם. */
  href?: string;
  children: ReactNode;
}) {
  const card = (
    <GlassCard variant={variant} interactive>
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: "var(--space-3)" }}>
        <h2 style={{ font: "var(--text-card-title)" }}>{title}</h2>
        {action}
      </div>
      {children}
    </GlassCard>
  );

  if (!href) return card;
  return (
    <Link href={href} style={{ display: "block", textDecoration: "none", color: "inherit" }}>
      {card}
    </Link>
  );
}
