const RADIUS_OPTIONS_KM = [0.5, 1, 2, 3, 5, 10];

export function NearbyPanel({
  active,
  radiusKm,
  onToggle,
  onRadiusChange,
  hasUserLocation,
  matchCount,
}: {
  active: boolean;
  radiusKm: number;
  onToggle: () => void;
  onRadiusChange: (km: number) => void;
  hasUserLocation: boolean;
  matchCount: number | null;
}) {
  return (
    <div
      style={{
        background: "var(--color-surface-solid)",
        border: "1px solid var(--color-border)",
        borderRadius: "var(--radius-md)",
        padding: "0.625rem 0.75rem",
        display: "flex",
        flexDirection: "column",
        gap: "0.5rem",
        fontSize: "0.8125rem",
      }}
    >
      <button
        type="button"
        onClick={onToggle}
        style={{
          border: "none",
          background: active ? "var(--color-primary)" : "transparent",
          color: active ? "#fff" : "var(--color-text)",
          borderRadius: "var(--radius-sm)",
          padding: "0.375rem 0.625rem",
          cursor: "pointer",
          fontWeight: 600,
          textAlign: "start",
        }}
      >
        📍 קרוב אליי {active && matchCount !== null ? `(${matchCount})` : ""}
      </button>

      {active ? (
        !hasUserLocation ? (
          <div style={{ color: "var(--color-text-muted)" }}>לחץ על &quot;המיקום שלי&quot; כדי לאפשר סינון לפי מרחק.</div>
        ) : (
          <div style={{ display: "flex", gap: "0.25rem", flexWrap: "wrap" }}>
            {RADIUS_OPTIONS_KM.map((km) => (
              <button
                key={km}
                type="button"
                onClick={() => onRadiusChange(km)}
                style={{
                  border: "1px solid var(--color-border)",
                  background: radiusKm === km ? "var(--color-primary)" : "transparent",
                  color: radiusKm === km ? "#fff" : "var(--color-text)",
                  borderRadius: "999px",
                  padding: "0.25rem 0.625rem",
                  cursor: "pointer",
                  fontSize: "0.75rem",
                }}
              >
                {km < 1 ? `${km * 1000} מ'` : `${km} ק"מ`}
              </button>
            ))}
          </div>
        )
      ) : null}
    </div>
  );
}
