import { describe, expect, it } from "vitest";
import { searchAllEntities } from "./global-search";

const emptyData = {
  trips: [],
  places: [],
  contacts: [],
  hotelStays: [],
  flights: [],
  transportBookings: [],
  expenses: [],
  documents: [],
};

describe("searchAllEntities", () => {
  it("returns an empty array for an empty query", () => {
    expect(searchAllEntities("", emptyData)).toEqual([]);
    expect(searchAllEntities("   ", emptyData)).toEqual([]);
  });

  it("matches a trip by name, case-insensitively", () => {
    const results = searchAllEntities("תאילנד", {
      ...emptyData,
      trips: [{ id: "t1", name: "טיול לתאילנד", startDate: "2026-01-01", endDate: "2026-01-10" }],
    });
    expect(results).toHaveLength(1);
    expect(results[0]?.category).toBe("trip");
  });

  it("matches a place by city even when the name doesn't match", () => {
    const results = searchAllEntities("בנגקוק", {
      ...emptyData,
      places: [{ id: "p1", name: "מסעדה", address: null, city: "בנגקוק", country: "תאילנד" }],
    });
    expect(results).toHaveLength(1);
    expect(results[0]?.category).toBe("place");
  });

  it("matches a contact by company", () => {
    const results = searchAllEntities("חברת", {
      ...emptyData,
      contacts: [{ id: "c1", name: "יוסי", company: "חברת תיירות", phone: null }],
    });
    expect(results).toHaveLength(1);
    expect(results[0]?.category).toBe("contact");
  });

  it("matches a hotel stay and links into the owning trip", () => {
    const results = searchAllEntities("מלון הים", {
      ...emptyData,
      hotelStays: [{ id: "h1", tripId: "trip-1", hotelName: "מלון הים הגדול", address: null }],
    });
    expect(results[0]?.href).toBe("/trips/trip-1");
  });

  it("matches a flight by flight number", () => {
    const results = searchAllEntities("LY001", {
      ...emptyData,
      flights: [{ id: "f1", tripId: "trip-1", airline: "El Al", flightNumber: "LY001" }],
    });
    expect(results).toHaveLength(1);
    expect(results[0]?.category).toBe("flight");
  });

  it("matches a transport booking by pickup or dropoff text", () => {
    const results = searchAllEntities("שדה תעופה", {
      ...emptyData,
      transportBookings: [{ id: "tr1", tripId: "trip-1", mode: "taxi", pickupText: "מלון", dropoffText: "שדה תעופה" }],
    });
    expect(results).toHaveLength(1);
  });

  it("matches an expense by description, linking to the finances section", () => {
    const results = searchAllEntities("ארוחת ערב", {
      ...emptyData,
      expenses: [{ id: "e1", tripId: "trip-1", category: "food", description: "ארוחת ערב במסעדה" }],
    });
    expect(results[0]?.href).toBe("/trips/trip-1#finances");
  });

  it("matches a document by file name, linking to the document center", () => {
    const results = searchAllEntities("דרכון", {
      ...emptyData,
      documents: [{ id: "d1", tripId: "trip-1", fileName: "סריקת דרכון.pdf", notes: null }],
    });
    expect(results[0]?.href).toBe("/trips/trip-1#document-center");
  });

  it("returns no results when nothing matches", () => {
    const results = searchAllEntities("xyz-no-match", {
      ...emptyData,
      trips: [{ id: "t1", name: "טיול לתאילנד", startDate: "2026-01-01", endDate: "2026-01-10" }],
    });
    expect(results).toHaveLength(0);
  });

  it("aggregates matches across multiple categories in one call", () => {
    const results = searchAllEntities("תאילנד", {
      trips: [{ id: "t1", name: "טיול לתאילנד", startDate: "2026-01-01", endDate: "2026-01-10" }],
      places: [{ id: "p1", name: "מקדש", address: null, city: null, country: "תאילנד" }],
      contacts: [],
      hotelStays: [],
      flights: [],
      transportBookings: [],
      expenses: [],
      documents: [],
    });
    expect(results.map((r) => r.category).sort()).toEqual(["place", "trip"]);
  });
});
