export type SearchResultCategory =
  | "trip"
  | "place"
  | "contact"
  | "hotel_stay"
  | "flight"
  | "transport_booking"
  | "expense"
  | "document";

export interface SearchResult {
  id: string;
  category: SearchResultCategory;
  title: string;
  detail: string;
  href: string;
}

function matches(query: string, ...fields: (string | null | undefined)[]): boolean {
  return fields.some((field) => field?.toLowerCase().includes(query));
}

/**
 * חיפוש טקסט חופשי פשוט (substring, case-insensitive) על פני כל הישויות
 * שהמשתמש עשוי לחפש — לא רק שמות טיולים. מקבל נתונים שכבר נשלפו (לא ניגש
 * ל-Repository בעצמו) כדי להישאר פונקציה טהורה וניתנת לבדיקה.
 */
export function searchAllEntities(
  query: string,
  data: {
    trips: { id: string; name: string; startDate: string; endDate: string }[];
    places: { id: string; name: string; address: string | null; city: string | null; country: string | null }[];
    contacts: { id: string; name: string; company: string | null; phone: string | null }[];
    hotelStays: { id: string; tripId: string; hotelName: string; address: string | null }[];
    flights: { id: string; tripId: string; airline: string; flightNumber: string | null }[];
    transportBookings: { id: string; tripId: string; mode: string; pickupText: string | null; dropoffText: string | null }[];
    expenses: { id: string; tripId: string; category: string; description: string | null }[];
    documents: { id: string; tripId: string | null; fileName: string | null; notes: string | null }[];
  },
): SearchResult[] {
  const q = query.trim().toLowerCase();
  if (!q) return [];

  const results: SearchResult[] = [];

  for (const trip of data.trips) {
    if (matches(q, trip.name)) {
      results.push({ id: trip.id, category: "trip", title: trip.name, detail: `${trip.startDate}–${trip.endDate}`, href: `/trips/${trip.id}` });
    }
  }

  for (const place of data.places) {
    if (matches(q, place.name, place.address, place.city, place.country)) {
      results.push({
        id: place.id,
        category: "place",
        title: place.name,
        detail: [place.city, place.country].filter(Boolean).join(", "),
        href: "/places",
      });
    }
  }

  for (const contact of data.contacts) {
    if (matches(q, contact.name, contact.company, contact.phone)) {
      results.push({ id: contact.id, category: "contact", title: contact.name, detail: contact.company ?? "", href: "/contacts" });
    }
  }

  for (const hotel of data.hotelStays) {
    if (matches(q, hotel.hotelName, hotel.address)) {
      results.push({ id: hotel.id, category: "hotel_stay", title: hotel.hotelName, detail: hotel.address ?? "", href: `/trips/${hotel.tripId}` });
    }
  }

  for (const flight of data.flights) {
    if (matches(q, flight.airline, flight.flightNumber)) {
      results.push({
        id: flight.id,
        category: "flight",
        title: `${flight.airline}${flight.flightNumber ? ` ${flight.flightNumber}` : ""}`,
        detail: "",
        href: `/trips/${flight.tripId}`,
      });
    }
  }

  for (const transport of data.transportBookings) {
    if (matches(q, transport.mode, transport.pickupText, transport.dropoffText)) {
      results.push({
        id: transport.id,
        category: "transport_booking",
        title: [transport.pickupText, transport.dropoffText].filter(Boolean).join(" ← ") || transport.mode,
        detail: transport.mode,
        href: `/trips/${transport.tripId}`,
      });
    }
  }

  for (const expense of data.expenses) {
    if (matches(q, expense.description, expense.category)) {
      results.push({
        id: expense.id,
        category: "expense",
        title: expense.description ?? expense.category,
        detail: expense.category,
        href: `/trips/${expense.tripId}#finances`,
      });
    }
  }

  for (const document of data.documents) {
    if (matches(q, document.fileName, document.notes)) {
      results.push({
        id: document.id,
        category: "document",
        title: document.fileName ?? "מסמך ללא שם",
        detail: document.notes ?? "",
        href: document.tripId ? `/trips/${document.tripId}#document-center` : "/places",
      });
    }
  }

  return results;
}
