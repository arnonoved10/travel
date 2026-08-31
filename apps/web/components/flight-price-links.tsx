import { buildFlightSearchLinks } from "@/lib/flight-search-links";

/** קישורי-השוואה חיצוניים לטיסה — רק לפני הזמנה בפועל (want_to_book/need_to_book). */
export function FlightPriceLinks({
  departureAirport,
  arrivalAirport,
  departureDate,
}: {
  departureAirport: string;
  arrivalAirport: string;
  departureDate: string;
}) {
  const { googleFlightsUrl, skyscannerUrl, kayakUrl } = buildFlightSearchLinks({ departureAirport, arrivalAirport, departureDate });

  return (
    <div style={{ display: "flex", flexWrap: "wrap", gap: "0.5rem", marginTop: "0.375rem" }}>
      <span style={{ fontSize: "0.75rem", color: "var(--color-text-muted)", alignSelf: "center" }}>💰 השווה מחירים:</span>
      <a href={googleFlightsUrl} target="_blank" rel="noopener noreferrer" style={linkButtonStyle}>
        Google Flights
      </a>
      <a href={skyscannerUrl} target="_blank" rel="noopener noreferrer" style={linkButtonStyle}>
        Skyscanner
      </a>
      <a href={kayakUrl} target="_blank" rel="noopener noreferrer" style={linkButtonStyle}>
        Kayak
      </a>
    </div>
  );
}

const linkButtonStyle: React.CSSProperties = {
  padding: "0.25rem 0.625rem",
  borderRadius: "var(--radius-full)",
  border: "1px solid var(--color-border)",
  background: "var(--color-surface)",
  color: "var(--color-text-primary)",
  textDecoration: "none",
  fontSize: "0.75rem",
  fontWeight: 600,
  whiteSpace: "nowrap",
};
