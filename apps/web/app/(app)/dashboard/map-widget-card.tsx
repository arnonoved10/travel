import Link from "next/link";
import { MapPinned } from "lucide-react";
import { ArrowUpRight } from "@phosphor-icons/react/ssr";
import type { TripPlaceWithPlace } from "@travel-app/data-layer";
import type { Trip } from "@travel-app/shared-types";
import { isMapProviderConfigured } from "@/lib/map/config";
import { GlassCard } from "@/components/ui/GlassCard";
import { EmptyState } from "@/components/ui/EmptyState";
import { ICON_SIZE } from "@/components/ui/tokens";
import { MapWidgetView } from "./map-widget-view";

/** The map is meant to be one of the most prominent elements on the dashboard (per the
 * redesign brief) — sized to sit beside TripHeroCard, not as a small buried widget. */
export function MapWidgetCard({ trip, tripPlaces }: { trip: Trip; tripPlaces: TripPlaceWithPlace[] }) {
  const plotted = tripPlaces.filter((tp) => tp.place.lat !== null && tp.place.lng !== null);
  const configured = isMapProviderConfigured();

  return (
    <GlassCard variant="hero" style={{ height: "296px", position: "relative", boxShadow: "0 20px 50px rgba(0,0,0,.45)" }}>
      <Link
        href="/map"
        style={{
          position: "absolute",
          top: "var(--space-4)",
          insetInlineEnd: "var(--space-4)",
          zIndex: 5,
          display: "inline-flex",
          alignItems: "center",
          gap: "0.375rem",
          padding: "0.5rem 0.875rem",
          borderRadius: "var(--radius-full)",
          background: "var(--color-surface-elevated)",
          backdropFilter: "blur(16px)",
          WebkitBackdropFilter: "blur(16px)",
          border: "1px solid var(--color-border)",
          color: "var(--color-text-primary)",
          textDecoration: "none",
          font: "var(--text-caption)",
          fontWeight: 700,
          boxShadow: "var(--shadow-md)",
        }}
      >
        מסך מפה מלא
        <ArrowUpRight size={ICON_SIZE.sm} weight="bold" aria-hidden />
      </Link>

      {/* מצב-ריק נקי ומעוצב — בלי הודעות טכניות (שם משתנה-סביבה) ובלי תמונת-
          יעד כפולה (כבר מוצגת בכרטיס "המסלול שלי" ובכרטיס הטיול). כשאין
          ספק-מפה מחובר וגם כשיש ספק אבל אין עדיין מקומות עם קואורדינטות —
          אותו מצב-ריק, ניסוח ידידותי בלבד. */}
      {!configured || plotted.length === 0 ? (
        <div
          style={{
            position: "relative",
            minHeight: "296px",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            padding: "var(--space-6)",
            backgroundImage: [
              "radial-gradient(130% 110% at 12% 15%, rgba(139,92,246,0.22), transparent 55%)",
              "radial-gradient(130% 110% at 95% 95%, rgba(59,130,246,0.18), transparent 55%)",
              "radial-gradient(80% 60% at 60% 40%, rgba(139,92,246,0.1), transparent 60%)",
              "var(--color-bg-elevated)",
            ].join(", "),
          }}
        >
          <EmptyState
            icon={MapPinned}
            title="עדיין אין נתונים להצגה על המפה"
            description="מקומות עם מיקום שתוסיף לטיול יופיעו כאן."
          />
        </div>
      ) : (
        <div style={{ height: "296px" }}>
          <MapWidgetView
            markers={plotted.map((tp) => ({
              id: tp.place.id,
              lat: tp.place.lat!,
              lng: tp.place.lng!,
              category: tp.place.category,
              status: tp.status,
            }))}
            center={[
              plotted.reduce((sum, tp) => sum + tp.place.lat!, 0) / plotted.length,
              plotted.reduce((sum, tp) => sum + tp.place.lng!, 0) / plotted.length,
            ]}
            zoom={plotted.length > 1 ? 11 : 13}
          />
        </div>
      )}
    </GlassCard>
  );
}
