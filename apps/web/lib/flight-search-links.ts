// קישורי-חיפוש חיצוניים לטיסה (Google Flights/Skyscanner/Kayak) — אותו
// עיקרון בדיוק כמו hotel-search-links.ts: URL חיפוש רגיל לפי קודי שדה-תעופה
// (IATA, כבר קיימים ב-Flight.departureAirport/arrivalAirport), לא scraping.
export interface FlightSearchLinks {
  googleFlightsUrl: string;
  skyscannerUrl: string;
  kayakUrl: string;
}

export function buildFlightSearchLinks(params: {
  departureAirport: string;
  arrivalAirport: string;
  departureDate: string; // YYYY-MM-DD
}): FlightSearchLinks {
  const from = params.departureAirport.trim().toUpperCase();
  const to = params.arrivalAirport.trim().toUpperCase();
  const date = params.departureDate;
  const [year, month, day] = date.split("-");
  const yymmdd = `${year!.slice(2)}${month}${day}`;

  return {
    googleFlightsUrl: `https://www.google.com/travel/flights?q=${encodeURIComponent(`Flights from ${from} to ${to} on ${date}`)}`,
    skyscannerUrl: `https://www.skyscanner.net/transport/flights/${from.toLowerCase()}/${to.toLowerCase()}/${yymmdd}/`,
    kayakUrl: `https://www.kayak.com/flights/${from}-${to}/${date}`,
  };
}
