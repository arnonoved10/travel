import Link from "next/link";
import type { Icon as PhosphorIcon } from "@phosphor-icons/react";
import { ICON_SIZE } from "./tokens";

export function QuickAction({
  href,
  label,
  icon: Icon,
  external,
}: {
  href: string;
  label: string;
  icon: PhosphorIcon;
  external?: boolean;
}) {
  return (
    <Link
      href={href}
      target={external ? "_blank" : undefined}
      rel={external ? "noopener noreferrer" : undefined}
      className="ui-card-interactive"
      style={{
        display: "flex",
        flexDirection: "row",
        alignItems: "center",
        gap: "var(--space-3)",
        padding: "var(--space-3)",
        borderRadius: "var(--radius-md)",
        background: "var(--color-surface)",
        border: "1px solid var(--color-border)",
        color: "var(--color-text-primary)",
        textDecoration: "none",
      }}
    >
      <div
        style={{
          width: "2.25rem",
          height: "2.25rem",
          borderRadius: "50%",
          background: "var(--gradient-brand)",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          color: "#fff",
          flexShrink: 0,
        }}
      >
        <Icon size={ICON_SIZE.sm} weight="fill" aria-hidden />
      </div>
      <span style={{ font: "var(--text-caption)", fontWeight: 600, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{label}</span>
    </Link>
  );
}
