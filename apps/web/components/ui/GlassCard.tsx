import type { CSSProperties, ReactNode, HTMLAttributes } from "react";

export type GlassCardVariant = "hero" | "primary" | "secondary" | "compact" | "floating";

const VARIANT_STYLE: Record<GlassCardVariant, CSSProperties> = {
  hero: {
    borderRadius: "var(--radius-xl)",
    border: "1px solid var(--color-border)",
    boxShadow: "var(--shadow-lg)",
    padding: 0,
  },
  primary: {
    background: "var(--color-glass)",
    backdropFilter: "blur(12px)",
    WebkitBackdropFilter: "blur(12px)",
    border: "1px solid var(--color-border)",
    borderRadius: "var(--radius-lg)",
    boxShadow: "var(--shadow-md)",
    padding: "var(--space-5)",
  },
  secondary: {
    background: "var(--color-surface)",
    border: "1px solid var(--color-border)",
    borderRadius: "var(--radius-md)",
    boxShadow: "var(--shadow-sm)",
    padding: "var(--space-4)",
  },
  compact: {
    background: "var(--color-surface)",
    border: "1px solid var(--color-border)",
    borderRadius: "var(--radius-sm)",
    padding: "var(--space-3)",
  },
  floating: {
    background: "var(--color-surface-elevated)",
    backdropFilter: "blur(18px)",
    WebkitBackdropFilter: "blur(18px)",
    border: "1px solid var(--color-border)",
    borderRadius: "var(--radius-lg)",
    boxShadow: "var(--shadow-lg)",
    padding: "var(--space-4)",
  },
};

interface GlassCardProps extends HTMLAttributes<HTMLDivElement> {
  variant?: GlassCardVariant;
  interactive?: boolean;
  children: ReactNode;
}

/** The one card primitive every other card in the app is built from — see
 * DECISIONS.md "Redesign יסודי שני". Variants map to the Hero/Primary/Secondary/
 * Compact/Floating hierarchy the design calls for; never hard-code card chrome
 * (background/border/blur/shadow/radius) outside this component. */
export function GlassCard({ variant = "primary", interactive = false, style, children, ...rest }: GlassCardProps) {
  return (
    <div
      {...rest}
      style={{
        ...VARIANT_STYLE[variant],
        position: "relative",
        overflow: "hidden",
        transition: `transform var(--duration-base) var(--ease-out), box-shadow var(--duration-base) var(--ease-out)`,
        cursor: interactive ? "pointer" : undefined,
        ...style,
      }}
      className={interactive ? "ui-card-interactive" : undefined}
    >
      {children}
    </div>
  );
}
