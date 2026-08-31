interface ShareTripInput {
  trip: { name: string; startDate: string; endDate: string };
  hotelStays: Array<{ hotelName: string; checkInDate: string; checkOutDate: string }>;
  flights: Array<{ airline: string; flightNumber: string | null; departureAirport: string; arrivalAirport: string; departureAt: string }>;
  transportBookings: Array<{ pickupText: string | null; dropoffText: string | null; pickupAt: string }>;
  countryNames: string[];
  cityNames: string[];
}

/** מרכיב תקציר טקסט קריא של הטיול לשיתוף (navigator.share / WhatsApp) — לא URL,
 * כי אין עדיין מסך צפייה ציבורי לא-מאומת (ר' #88 Share Security, עדיין לא קיים). */
export function buildTripShareText(input: ShareTripInput): string {
  const { trip, hotelStays, flights, transportBookings, countryNames, cityNames } = input;
  const lines: string[] = [];

  lines.push(`טיול: ${trip.name}`);
  lines.push(`${trip.startDate} — ${trip.endDate}`);
  if (countryNames.length > 0 || cityNames.length > 0) {
    lines.push([countryNames.join(", "), cityNames.join(", ")].filter(Boolean).join(" · "));
  }

  if (hotelStays.length > 0) {
    lines.push("");
    lines.push("🏨 מלונות:");
    for (const h of hotelStays) {
      lines.push(`- ${h.hotelName} (${h.checkInDate} – ${h.checkOutDate})`);
    }
  }

  if (flights.length > 0) {
    lines.push("");
    lines.push("✈️ טיסות:");
    for (const f of flights) {
      lines.push(`- ${f.airline}${f.flightNumber ? ` ${f.flightNumber}` : ""}: ${f.departureAirport}→${f.arrivalAirport} (${f.departureAt.slice(0, 10)})`);
    }
  }

  if (transportBookings.length > 0) {
    lines.push("");
    lines.push("🚕 תחבורה:");
    for (const t of transportBookings) {
      lines.push(`- ${t.pickupText ?? "?"} → ${t.dropoffText ?? "?"} (${t.pickupAt.slice(0, 16).replace("T", " ")})`);
    }
  }

  return lines.join("\n");
}
