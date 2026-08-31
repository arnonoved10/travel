import Link from "next/link";

function initialsFrom(label: string): string {
  const trimmed = label.trim();
  if (!trimmed) return "?";
  const parts = trimmed.split(/\s+/);
  if (parts.length === 1) return parts[0]!.slice(0, 2).toUpperCase();
  return (parts[0]![0]! + parts[1]![0]!).toUpperCase();
}

/** Initials-on-gradient avatar — deliberately not a photo. The reference mockup uses real
 * headshots, but this app has no user-photo field and fabricating a "person" (stock/AI
 * photo standing in for a real human) would misrepresent a real person's likeness. See
 * DECISIONS.md "Redesign יסודי שני". */
export function Avatar({ label, size = 40, href }: { label: string; size?: number; href?: string }) {
  const circle = (
    <div
      title={label}
      style={{
        width: size,
        height: size,
        borderRadius: "50%",
        background: "var(--gradient-brand)",
        color: "#fff",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        fontWeight: 700,
        fontSize: size * 0.4,
        flexShrink: 0,
        boxShadow: "var(--shadow-sm)",
      }}
    >
      {initialsFrom(label)}
    </div>
  );

  if (!href) return circle;
  return (
    <Link href={href} aria-label="הגדרות חשבון" style={{ display: "inline-flex" }}>
      {circle}
    </Link>
  );
}
