import type { Trip } from "@travel-app/shared-types";
import { getDestinationPhotos } from "@/lib/destination-photos";
import { GlassCard } from "@/components/ui/GlassCard";
import { ProgressRing } from "@/components/ui/ProgressRing";

/** כרטיס-הטיול המרכזי במובייל: תמונת-יעד + יום-נוכחי/אחוז/ימים-שנותרו —
 * במקום שני כרטיסי-מחשב נפרדים (TripHeroCard + התקדמות בתוך TripRouteCard).
 * אותו מקור-תמונה בדיוק כמו trip-hero-card.tsx/trip-route-card.tsx (Trip.
 * coverImageUrl או תצלום-אמיתי-מתויג לפי שם-הטיול), בלי לזייף יעד. */
export function MobileTripHeroCard({ trip, today, dayDates }: { trip: Trip; today: string; dayDates: string[] }) {
  const destinationPhotos = getDestinationPhotos(trip);
  const heroPhotoUrl = trip.coverImageUrl ?? destinationPhotos?.hero ?? null;

  const totalDays = dayDates.length;
  const todayIndex = dayDates.indexOf(today);
  const beforeTrip = totalDays > 0 && today < dayDates[0]!;
  const afterTrip = totalDays > 0 && today > dayDates[totalDays - 1]!;
  const dayNumber = todayIndex >= 0 ? todayIndex + 1 : afterTrip ? totalDays : 0;
  const elapsedDays = beforeTrip ? 0 : afterTrip ? totalDays : dayNumber;
  const remainingDays = totalDays - elapsedDays;
  const percent = totalDays > 0 ? Math.round((elapsedDays / totalDays) * 100) : 0;

  return (
    <GlassCard
      variant="hero"
      style={{
        minHeight: "11rem",
        display: "flex",
        flexDirection: "column",
        justifyContent: "flex-end",
        padding: "var(--space-4)",
        gap: "0.625rem",
        backgroundImage: heroPhotoUrl
          ? `linear-gradient(180deg, rgba(6,8,16,0.35) 0%, rgba(6,8,16,0.55) 55%, rgba(6,8,16,0.9) 100%), url(${heroPhotoUrl})`
          : [
              "radial-gradient(130% 140% at 100% -10%, color-mix(in srgb, var(--color-accent-blue) 28%, transparent), transparent 55%)",
              "radial-gradient(120% 140% at 0% 110%, color-mix(in srgb, var(--color-accent-purple) 30%, transparent), transparent 55%)",
              "linear-gradient(165deg, #0c2b3a 0%, #0a1f3a 42%, #150c33 100%)",
            ].join(", "),
        backgroundSize: "cover",
        backgroundPosition: "center",
      }}
    >
      <h2 style={{ font: "var(--text-h3)", margin: 0, textShadow: heroPhotoUrl ? "0 1px 6px rgba(0,0,0,0.6)" : "none" }}>{trip.name}</h2>

      {totalDays > 0 ? (
        <div
          style={{
            display: "flex",
            alignItems: "center",
            gap: "0.75rem",
            padding: "0.625rem 0.75rem",
            borderRadius: "var(--radius-md)",
            background: "rgba(8,10,20,0.55)",
            backdropFilter: "blur(10px)",
            WebkitBackdropFilter: "blur(10px)",
            border: "1px solid var(--color-border)",
          }}
        >
          <ProgressRing percent={percent} size={44} strokeWidth={4} />
          <div style={{ flex: 1, display: "flex", flexDirection: "column", gap: "0.25rem", minWidth: 0 }}>
            <span style={{ font: "var(--text-caption)", fontWeight: 700 }}>
              {beforeTrip ? "טרם התחיל" : `יום ${dayNumber} מתוך ${totalDays}`}
            </span>
            <span style={{ font: "var(--text-caption)", fontSize: "0.75rem", color: "var(--color-accent-purple)", fontWeight: 700 }}>
              {beforeTrip ? `מתחיל ב-${trip.startDate}` : `נותרו ${remainingDays} ימים`}
            </span>
          </div>
        </div>
      ) : null}

      {!trip.coverImageUrl && destinationPhotos ? (
        <div style={{ font: "var(--text-caption)", fontSize: "0.625rem", opacity: 0.55, color: "#fff" }}>{destinationPhotos.credit}</div>
      ) : null}
    </GlassCard>
  );
}
