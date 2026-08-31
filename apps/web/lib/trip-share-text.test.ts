import { describe, expect, it } from "vitest";
import { buildTripShareText } from "./trip-share-text";

const baseTrip = { name: "טיול לתאילנד", startDate: "2026-12-01", endDate: "2026-12-10" };

describe("buildTripShareText", () => {
  it("includes trip name and dates", () => {
    const text = buildTripShareText({
      trip: baseTrip,
      hotelStays: [],
      flights: [],
      transportBookings: [],
      countryNames: [],
      cityNames: [],
    });
    expect(text).toContain("טיול לתאילנד");
    expect(text).toContain("2026-12-01 — 2026-12-10");
  });

  it("includes countries and cities on one line when present", () => {
    const text = buildTripShareText({
      trip: baseTrip,
      hotelStays: [],
      flights: [],
      transportBookings: [],
      countryNames: ["תאילנד"],
      cityNames: ["בנגקוק", "פאטאיה"],
    });
    expect(text).toContain("תאילנד · בנגקוק, פאטאיה");
  });

  it("omits the geography line entirely when there are no countries/cities", () => {
    const text = buildTripShareText({
      trip: baseTrip,
      hotelStays: [],
      flights: [],
      transportBookings: [],
      countryNames: [],
      cityNames: [],
    });
    expect(text.split("\n")).toHaveLength(2);
  });

  it("lists hotel stays with check-in/check-out dates", () => {
    const text = buildTripShareText({
      trip: baseTrip,
      hotelStays: [{ hotelName: "מלון סנטרל", checkInDate: "2026-12-01", checkOutDate: "2026-12-05" }],
      flights: [],
      transportBookings: [],
      countryNames: [],
      cityNames: [],
    });
    expect(text).toContain("🏨 מלונות:");
    expect(text).toContain("- מלון סנטרל (2026-12-01 – 2026-12-05)");
  });

  it("lists flights with route and flight number", () => {
    const text = buildTripShareText({
      trip: baseTrip,
      hotelStays: [],
      flights: [{ airline: "El Al", flightNumber: "LY83", departureAirport: "TLV", arrivalAirport: "BKK", departureAt: "2026-12-01T02:30:00.000Z" }],
      transportBookings: [],
      countryNames: [],
      cityNames: [],
    });
    expect(text).toContain("✈️ טיסות:");
    expect(text).toContain("- El Al LY83: TLV→BKK (2026-12-01)");
  });

  it("lists transport bookings with pickup/dropoff", () => {
    const text = buildTripShareText({
      trip: baseTrip,
      hotelStays: [],
      flights: [],
      transportBookings: [{ pickupText: "שדה תעופה", dropoffText: "מלון", pickupAt: "2026-12-01T09:15:00.000Z" }],
      countryNames: [],
      cityNames: [],
    });
    expect(text).toContain("🚕 תחבורה:");
    expect(text).toContain("- שדה תעופה → מלון (2026-12-01 09:15)");
  });

  it("omits a section entirely when its list is empty", () => {
    const text = buildTripShareText({
      trip: baseTrip,
      hotelStays: [],
      flights: [],
      transportBookings: [],
      countryNames: [],
      cityNames: [],
    });
    expect(text).not.toContain("🏨");
    expect(text).not.toContain("✈️");
    expect(text).not.toContain("🚕");
  });
});
