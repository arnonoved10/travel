import { buildNavigateLinks } from "@/lib/navigate-links";

export function NavigateButtons({
  lat,
  lng,
  address,
}: {
  lat: number | null;
  lng: number | null;
  address?: string | null;
}) {
  const { googleMapsUrl, wazeUrl } = buildNavigateLinks({ lat, lng, address });
  if (!googleMapsUrl || !wazeUrl) return null;

  return (
    <div style={{ display: "flex", gap: "0.5rem" }}>
      <a href={googleMapsUrl} target="_blank" rel="noopener noreferrer" style={linkButtonStyle}>
        🧭 Google Maps
      </a>
      <a href={wazeUrl} target="_blank" rel="noopener noreferrer" style={linkButtonStyle}>
        🚗 Waze
      </a>
    </div>
  );
}

const linkButtonStyle: React.CSSProperties = {
  padding: "0.375rem 0.625rem",
  borderRadius: "var(--radius-full)",
  border: "1px solid var(--color-border)",
  background: "var(--color-surface)",
  color: "var(--color-text-primary)",
  textDecoration: "none",
  fontSize: "0.8125rem",
  fontWeight: 600,
  whiteSpace: "nowrap",
};
