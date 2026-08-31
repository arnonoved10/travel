import { buildHotelSearchLinks } from "@/lib/hotel-search-links";

/** קישורי-השוואה חיצוניים למלון — רק לפני הזמנה בפועל (want_to_book/need_to_book). */
export function HotelPriceLinks({
  hotelName,
  address,
  checkInDate,
  checkOutDate,
}: {
  hotelName: string;
  address?: string | null;
  checkInDate: string;
  checkOutDate: string;
}) {
  const { bookingComUrl, googleHotelsUrl, trivagoUrl, hotelsComUrl } = buildHotelSearchLinks({ hotelName, address, checkInDate, checkOutDate });

  return (
    <div style={{ display: "flex", flexWrap: "wrap", gap: "0.5rem", marginTop: "0.375rem" }}>
      <span style={{ fontSize: "0.75rem", color: "var(--color-text-muted)", alignSelf: "center" }}>💰 השווה מחירים:</span>
      <a href={bookingComUrl} target="_blank" rel="noopener noreferrer" style={linkButtonStyle}>
        Booking.com
      </a>
      <a href={googleHotelsUrl} target="_blank" rel="noopener noreferrer" style={linkButtonStyle}>
        Google Hotels
      </a>
      <a href={trivagoUrl} target="_blank" rel="noopener noreferrer" style={linkButtonStyle}>
        Trivago
      </a>
      <a href={hotelsComUrl} target="_blank" rel="noopener noreferrer" style={linkButtonStyle}>
        Hotels.com
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
