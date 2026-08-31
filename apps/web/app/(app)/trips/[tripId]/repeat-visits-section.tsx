import type { RepeatVisitSuggestion } from "@/lib/repeat-visits";
import { quickLinkPlaceToTripAction } from "./trip-places/actions";

export function RepeatVisitsSection({ tripId, suggestions }: { tripId: string; suggestions: RepeatVisitSuggestion[] }) {
  if (suggestions.length === 0) return null;

  const cities = Array.from(new Set(suggestions.map((s) => s.city)));

  return (
    <section
      id="repeat-visits"
      style={{
        padding: "var(--space-4)",
        borderRadius: "var(--radius-lg)",
        background: "var(--color-glass)",
        backdropFilter: "blur(12px)",
        WebkitBackdropFilter: "blur(12px)",
        border: "1px solid var(--color-border)",
      }}
    >
      <h2 style={{ fontSize: "0.9375rem", marginTop: 0, marginBottom: "0.25rem" }}>חזרת ל{cities.join(", ")}?</h2>
      <p style={{ color: "var(--color-text-muted)", fontSize: "0.8125rem", marginTop: 0 }}>
        מקומות שסימנת כ&quot;ביקרתי&quot; או כמועדפים בטיולים קודמים לאותה עיר, ועדיין לא נוספו לטיול הזה
      </p>
      <ul style={{ listStyle: "none", padding: 0, margin: 0, display: "flex", flexDirection: "column", gap: "0.375rem" }}>
        {suggestions.map((s) => (
          <li
            key={s.place.id}
            style={{
              display: "flex",
              justifyContent: "space-between",
              alignItems: "center",
              gap: "0.5rem",
              padding: "0.375rem 0.5rem",
              borderRadius: "var(--radius-md)",
              background: "var(--color-surface-elevated)",
            }}
          >
            <div>
              <div style={{ fontWeight: 600, fontSize: "0.875rem" }}>
                {s.place.isFavorite ? "★ " : ""}
                {s.place.name}
                {s.place.personalRating ? ` · ${"★".repeat(s.place.personalRating)}` : ""}
              </div>
              <div style={{ color: "var(--color-text-muted)", fontSize: "0.75rem" }}>מ&quot;{s.sourceTripName}&quot;</div>
            </div>
            <form action={quickLinkPlaceToTripAction.bind(null, tripId, s.place.id, "want_to_go")}>
              <button
                type="submit"
                style={{
                  padding: "0.25rem 0.625rem",
                  borderRadius: "var(--radius-full)",
                  border: "1px solid color-mix(in srgb, var(--color-primary) 30%, transparent)",
                  background: "color-mix(in srgb, var(--color-primary) 14%, transparent)",
                  color: "var(--color-primary)",
                  fontWeight: 600,
                  cursor: "pointer",
                  fontSize: "0.75rem",
                  whiteSpace: "nowrap",
                }}
              >
                הוסף לטיול
              </button>
            </form>
          </li>
        ))}
      </ul>
    </section>
  );
}
