import Link from "next/link";
import { Warning } from "@phosphor-icons/react/ssr";
import type { Trip } from "@travel-app/shared-types";
import type { Gap } from "@/lib/gap-detection";
import { GlassCard } from "@/components/ui/GlassCard";
import { ICON_SIZE } from "@/components/ui/tokens";
import { NoHotelNightsList } from "@/components/no-hotel-nights";

export function GapAlertsCard({ trip, gaps }: { trip: Trip; gaps: Gap[] }) {
  if (gaps.length === 0) return null;

  // "לילות בלי מלון" מוצג בנפרד, כצ'יפים לחיצים (ר' no-hotel-nights.tsx) —
  // לא עוד שורת-טקסט שטוחה בתוך רשימת-החוסרים הכללית (בקשת משתמש: "זה בכלל
  // לא יפה"). שאר סוגי-החוסרים (ביטוח/תקציב/מסמכים וכו') נשארים ברשימה הרגילה.
  const noHotelNights = gaps.filter((g) => g.id.startsWith("no-hotel-")).map((g) => g.date!);
  const otherGaps = gaps.filter((g) => !g.id.startsWith("no-hotel-"));

  return (
    <GlassCard
      variant="secondary"
      style={{
        borderColor: "color-mix(in srgb, var(--color-warning) 35%, var(--color-border))",
        background: "color-mix(in srgb, var(--color-warning) 8%, var(--color-surface))",
      }}
    >
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
        <h2 style={{ font: "var(--text-card-title)", margin: 0, color: "var(--color-warning)", display: "flex", alignItems: "center", gap: "0.5rem" }}>
          <Warning size={ICON_SIZE.md} weight="fill" aria-hidden />
          בדיקת חוסרים ({gaps.length})
        </h2>
        <Link href={`/trips/${trip.id}`} style={{ font: "var(--text-caption)", color: "var(--color-warning)", fontWeight: 700 }}>
          לטיול ←
        </Link>
      </div>

      {noHotelNights.length > 0 ? (
        <div style={{ marginTop: "var(--space-3)" }}>
          <NoHotelNightsList tripId={trip.id} nights={noHotelNights} />
        </div>
      ) : null}

      {otherGaps.length > 0 ? (
        <ul style={{ listStyle: "none", padding: 0, marginTop: "var(--space-3)", marginBottom: 0, display: "flex", flexDirection: "column", gap: "0.375rem" }}>
          {otherGaps.slice(0, 4).map((gap) => (
            <li key={gap.id} style={{ font: "var(--text-caption)" }}>
              <span style={{ fontWeight: 600, color: "var(--color-text-secondary)" }}>{gap.title}</span>
            </li>
          ))}
        </ul>
      ) : null}
      {otherGaps.length > 4 ? (
        <div style={{ marginTop: "0.375rem", font: "var(--text-caption)", color: "var(--color-text-muted)" }}>ועוד {otherGaps.length - 4}…</div>
      ) : null}
    </GlassCard>
  );
}
