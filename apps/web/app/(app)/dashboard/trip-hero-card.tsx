import Link from "next/link";
import { ArrowLeft } from "@phosphor-icons/react/ssr";
import type { Trip, WeatherForecastSnapshot } from "@travel-app/shared-types";
import { getTripDayDates } from "@/lib/trip-days";
import { getDestinationPhotos } from "@/lib/destination-photos";
import { GlassCard } from "@/components/ui/GlassCard";
import { ICON_SIZE } from "@/components/ui/tokens";
import { Temperature } from "@/components/temperature";
import { countryFlagEmoji } from "@/lib/country-flags";
import type { WeatherReferencePlace } from "@/lib/weather-reference-place";

function getTodayIsoDate(): string {
  return new Date().toISOString().slice(0, 10);
}

export function TripHeroCard({
  trip,
  weatherPlace,
  currentWeather,
}: {
  trip: Trip;
  weatherPlace: WeatherReferencePlace | null;
  currentWeather: Omit<WeatherForecastSnapshot, "id" | "retrievedAt"> | null;
}) {
  const dayDates = getTripDayDates(trip.startDate, trip.endDate);
  const today = getTodayIsoDate();
  const elapsedDays = dayDates.filter((d) => d <= today).length;
  const progressPct = dayDates.length > 0 ? Math.min(100, Math.round((elapsedDays / dayDates.length) * 100)) : 0;
  // אין שדה מיקום/עיר/מדינה על Trip עצמו (ראה PROJECT_REQUIREMENTS.md #1) — נגזר בכנות
  // מהמקום המקושר לטיול שיש לו קואורדינטות (אותו מקום שמשמש למזג האוויר), לא מומצא.
  const locationLabel = weatherPlace ? [weatherPlace.city, weatherPlace.country].filter(Boolean).join(", ") : null;
  const locationFlag = countryFlagEmoji(weatherPlace?.country);
  // Trip.coverImageUrl (a real schema field, no UI to set it yet) always wins when present.
  // Otherwise fall back to curated real photography matched by destination keyword — never
  // a fabricated/AI-looking image, and never guessed for a trip we can't identify (see
  // lib/destination-photos.ts, DECISIONS.md).
  const destinationPhotos = getDestinationPhotos(trip);
  const heroPhotoUrl = trip.coverImageUrl ?? destinationPhotos?.hero ?? null;

  return (
    <GlassCard
      variant="hero"
      style={{
        height: "296px",
        display: "flex",
        flexDirection: "column",
        justifyContent: "space-between",
        boxShadow: "0 20px 50px rgba(0,0,0,.45)",
        backgroundImage: heroPhotoUrl
          ? `linear-gradient(to top, rgba(4,6,12,0.95) 5%, rgba(4,6,12,0.25) 60%), url(${heroPhotoUrl})`
          : [
              "linear-gradient(to top, rgba(4,6,12,0.97) 15%, rgba(4,6,12,0.4) 65%)",
              "radial-gradient(140% 100% at 10% 100%, rgba(139,92,246,0.5), transparent 60%)",
              "radial-gradient(120% 100% at 100% 0%, rgba(59,130,246,0.4), transparent 55%)",
              "radial-gradient(90% 70% at 60% 30%, rgba(236,72,153,0.16), transparent 60%)",
              "linear-gradient(160deg, #171029 0%, #0a0e17 100%)",
            ].join(", "),
        backgroundSize: "cover",
        backgroundPosition: "center",
      }}
    >
      <div style={{ padding: "var(--space-6)", color: "#fff" }}>
        <div
          style={{
            display: "inline-flex",
            font: "var(--text-label)",
            letterSpacing: "0.08em",
            opacity: 0.85,
            marginBottom: "var(--space-2)",
            padding: "0.1875rem 0.625rem",
            borderRadius: "var(--radius-full)",
            background: "rgba(255,255,255,0.12)",
            border: "1px solid rgba(255,255,255,0.2)",
          }}
        >
          הטיול הנוכחי
        </div>
        <h1 style={{ font: "var(--text-display)", margin: 0 }}>{trip.name}</h1>
        <div style={{ font: "var(--text-body)", opacity: 0.85, marginTop: "var(--space-1)" }}>
          {trip.startDate} – {trip.endDate}
          {locationLabel ? ` · ${locationFlag ? `${locationFlag} ` : ""}${locationLabel}` : ""}
        </div>

        {currentWeather ? (
          <div style={{ display: "flex", alignItems: "center", gap: "0.375rem", marginTop: "var(--space-3)", font: "var(--text-caption)" }}>
            <span style={{ fontSize: "1.25rem", lineHeight: 1 }}>{currentWeather.conditionIcon}</span>
            <span style={{ fontWeight: 700 }}>
              <Temperature celsius={currentWeather.temperatureC} />
            </span>
            <span style={{ opacity: 0.8 }}>{currentWeather.condition}</span>
          </div>
        ) : null}

        <Link
          href={`/trips/${trip.id}`}
          style={{
            display: "inline-flex",
            alignItems: "center",
            gap: "0.5rem",
            marginTop: "var(--space-5)",
            padding: "0.75rem 1.5rem",
            borderRadius: "var(--radius-full)",
            background: "var(--gradient-brand)",
            color: "#fff",
            textDecoration: "none",
            font: "var(--text-caption)",
            fontWeight: 700,
            boxShadow: "var(--glow-brand)",
          }}
        >
          פרטי הטיול
          <ArrowLeft size={ICON_SIZE.sm} weight="fill" aria-hidden />
        </Link>
      </div>

      <div style={{ padding: "0 var(--space-6) var(--space-6)" }}>
        <div style={{ display: "flex", alignItems: "center", gap: "var(--space-3)" }}>
          <div style={{ flex: 1, height: "6px", borderRadius: "var(--radius-full)", background: "rgba(255,255,255,0.18)" }}>
            <div
              style={{
                width: `${progressPct}%`,
                height: "100%",
                borderRadius: "var(--radius-full)",
                background: "var(--gradient-brand)",
              }}
            />
          </div>
          <div style={{ font: "var(--text-caption)", whiteSpace: "nowrap", opacity: 0.9, color: "#fff" }}>
            {elapsedDays > 0 ? Math.min(elapsedDays, dayDates.length) : 0} מתוך {dayDates.length} ימים
          </div>
        </div>
        {!trip.coverImageUrl && destinationPhotos ? (
          <div style={{ font: "var(--text-caption)", fontSize: "0.6875rem", opacity: 0.55, marginTop: "0.375rem", color: "#fff" }}>
            {destinationPhotos.credit}
          </div>
        ) : null}
      </div>
    </GlassCard>
  );
}
