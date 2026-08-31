import Link from "next/link";
import { Bell } from "@phosphor-icons/react/ssr";
import { ICON_SIZE } from "./tokens";

/** `count` is optional and omitted by default — there is no real unread-notification
 * counter wired up yet (see /today's notification-reminders coverage in DECISIONS.md,
 * merged from /now on 2026-08-28). Never pass a fabricated number just to match a
 * mockup badge. */
export function NotificationButton({ href = "/today", count }: { href?: string; count?: number }) {
  return (
    <Link
      href={href}
      aria-label="התראות"
      title="התראות"
      style={{
        position: "relative",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        width: "2.5rem",
        height: "2.5rem",
        borderRadius: "50%",
        border: "1px solid var(--color-border)",
        background: "var(--color-surface)",
        color: "var(--color-text-primary)",
        transition: "background var(--duration-fast) var(--ease-out)",
      }}
    >
      <Bell size={ICON_SIZE.md} weight="fill" aria-hidden />
      {count && count > 0 ? (
        <span
          style={{
            position: "absolute",
            top: "-2px",
            insetInlineEnd: "-2px",
            minWidth: "1.125rem",
            height: "1.125rem",
            padding: "0 0.25rem",
            borderRadius: "var(--radius-full)",
            background: "var(--color-danger)",
            color: "#fff",
            fontSize: "0.625rem",
            fontWeight: 700,
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            border: "2px solid var(--color-bg)",
          }}
        >
          {count > 9 ? "9+" : count}
        </span>
      ) : null}
    </Link>
  );
}
