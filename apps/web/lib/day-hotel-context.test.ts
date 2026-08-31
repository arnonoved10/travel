import { describe, expect, it } from "vitest";
import type { HotelStay } from "@travel-app/shared-types";
import { resolveDayHotelContext } from "./day-hotel-context";

function makeHotel(overrides: Partial<HotelStay> = {}): HotelStay {
  return {
    id: "hotel-1",
    bookingId: "booking-1",
    tripId: "trip-1",
    placeId: null,
    hotelName: "מלון לדוגמה",
    address: null,
    lat: 13.75,
    lng: 100.5,
    checkInDate: "2026-06-01",
    checkOutDate: "2026-06-03",
    nights: 2,
    ...overrides,
  } as HotelStay;
}

describe("resolveDayHotelContext", () => {
  it("uses the same hotel for morning and night on a mid-stay day", () => {
    const hotel = makeHotel({ checkInDate: "2026-06-01", checkOutDate: "2026-06-05" });

    const { morningHotel, nightHotel } = resolveDayHotelContext([hotel], "2026-06-03");

    expect(morningHotel?.id).toBe(hotel.id);
    expect(nightHotel?.id).toBe(hotel.id);
  });

  it("splits morning/night across two hotels on a transition day", () => {
    const previousHotel = makeHotel({ id: "hotel-prev", checkInDate: "2026-06-01", checkOutDate: "2026-06-03" });
    const nextHotel = makeHotel({ id: "hotel-next", checkInDate: "2026-06-03", checkOutDate: "2026-06-05" });

    const { morningHotel, nightHotel } = resolveDayHotelContext([previousHotel, nextHotel], "2026-06-03");

    expect(morningHotel?.id).toBe("hotel-prev");
    expect(nightHotel?.id).toBe("hotel-next");
  });

  it("returns null for both when no hotel covers the date at all", () => {
    const hotel = makeHotel({ checkInDate: "2026-06-01", checkOutDate: "2026-06-03" });

    const { morningHotel, nightHotel } = resolveDayHotelContext([hotel], "2026-07-15");

    expect(morningHotel).toBeNull();
    expect(nightHotel).toBeNull();
  });

  it("returns null for both when there are no hotel stays at all", () => {
    const { morningHotel, nightHotel } = resolveDayHotelContext([], "2026-06-03");

    expect(morningHotel).toBeNull();
    expect(nightHotel).toBeNull();
  });
});
