import { beforeEach, describe, expect, it } from "vitest";
import { MockBookingRepository } from "./booking-repository.mock";
import { BookingNotFoundError } from "./booking-repository";

const tripId = "33333333-3333-4333-8333-333333333333";

describe("MockBookingRepository", () => {
  let repo: MockBookingRepository;

  beforeEach(() => {
    repo = new MockBookingRepository();
  });

  it("creates a hotel stay and returns it for the trip's list", async () => {
    const created = await repo.createHotelStay({
      input: { tripId, hotelName: "מלון בדיקה", checkInDate: "2026-07-01", checkOutDate: "2026-07-05" },
    });

    expect(created.status).toBe("booked");
    const list = await repo.listHotelStays({ tripId });
    expect(list.map((h) => h.id)).toContain(created.id);
  });

  it("rejects a hotel stay with checkout before checkin", async () => {
    await expect(
      repo.createHotelStay({
        input: { tripId, hotelName: "מלון תאריכים הפוכים", checkInDate: "2026-07-05", checkOutDate: "2026-07-01" },
      }),
    ).rejects.toThrow();
  });

  it("creates a flight and returns it sorted by departure time", async () => {
    const later = await repo.createFlight({
      input: {
        tripId,
        airline: "בדיקה איירליינס",
        departureAirport: "TLV",
        arrivalAirport: "BKK",
        departureAt: "2026-07-10T10:00:00.000Z",
        departureTimezone: "Asia/Jerusalem",
        arrivalAt: "2026-07-10T20:00:00.000Z",
        arrivalTimezone: "Asia/Bangkok",
      },
    });
    const earlier = await repo.createFlight({
      input: {
        tripId,
        airline: "בדיקה איירליינס 2",
        departureAirport: "TLV",
        arrivalAirport: "BKK",
        departureAt: "2026-07-01T10:00:00.000Z",
        departureTimezone: "Asia/Jerusalem",
        arrivalAt: "2026-07-01T20:00:00.000Z",
        arrivalTimezone: "Asia/Bangkok",
      },
    });

    const list = await repo.listFlights({ tripId });
    const ids = list.map((f) => f.id);
    expect(ids.indexOf(earlier.id)).toBeLessThan(ids.indexOf(later.id));
  });

  it("rejects a flight arriving before it departs", async () => {
    await expect(
      repo.createFlight({
        input: {
          tripId,
          airline: "בדיקה",
          departureAirport: "TLV",
          arrivalAirport: "BKK",
          departureAt: "2026-07-10T20:00:00.000Z",
          departureTimezone: "Asia/Jerusalem",
          arrivalAt: "2026-07-10T10:00:00.000Z",
          arrivalTimezone: "Asia/Bangkok",
        },
      }),
    ).rejects.toThrow();
  });

  it("sets and returns a flight's airport-timing fields, defaulting to null", async () => {
    const created = await repo.createFlight({
      input: {
        tripId,
        airline: "בדיקה",
        departureAirport: "TLV",
        arrivalAirport: "BKK",
        departureAt: "2026-07-10T10:00:00.000Z",
        departureTimezone: "Asia/Jerusalem",
        arrivalAt: "2026-07-10T20:00:00.000Z",
        arrivalTimezone: "Asia/Bangkok",
      },
    });
    expect(created.airportArrivalLeadMinutes).toBeNull();
    expect(created.travelTimeToAirportMinutes).toBeNull();

    const updated = await repo.updateFlightAirportTiming({
      input: { flightId: created.id, airportArrivalLeadMinutes: 180, travelTimeToAirportMinutes: 45 },
    });
    expect(updated.airportArrivalLeadMinutes).toBe(180);
    expect(updated.travelTimeToAirportMinutes).toBe(45);
  });

  it("throws when setting airport timing on a non-existent flight", async () => {
    await expect(
      repo.updateFlightAirportTiming({
        input: { flightId: "00000000-0000-4000-8000-000000009999", airportArrivalLeadMinutes: 180, travelTimeToAirportMinutes: null },
      }),
    ).rejects.toThrow(BookingNotFoundError);
  });

  it("sets a flight's live status/delay, defaulting to null, and stamps a checked-at time", async () => {
    const created = await repo.createFlight({
      input: {
        tripId,
        airline: "בדיקה",
        flightNumber: "BK123",
        departureAirport: "TLV",
        arrivalAirport: "BKK",
        departureAt: "2026-07-10T10:00:00.000Z",
        departureTimezone: "Asia/Jerusalem",
        arrivalAt: "2026-07-10T20:00:00.000Z",
        arrivalTimezone: "Asia/Bangkok",
      },
    });
    expect(created.liveStatus).toBeNull();
    expect(created.liveStatusCheckedAt).toBeNull();

    const updated = await repo.updateFlightLiveStatus({
      input: { flightId: created.id, liveStatus: "active", liveDelayMinutes: 25 },
    });
    expect(updated.liveStatus).toBe("active");
    expect(updated.liveDelayMinutes).toBe(25);
    expect(updated.liveStatusCheckedAt).not.toBeNull();
  });

  it("throws when setting live status on a non-existent flight", async () => {
    await expect(
      repo.updateFlightLiveStatus({
        input: { flightId: "00000000-0000-4000-8000-000000009999", liveStatus: "landed", liveDelayMinutes: null },
      }),
    ).rejects.toThrow(BookingNotFoundError);
  });

  it("creates a transport booking", async () => {
    const created = await repo.createTransportBooking({
      input: {
        tripId,
        mode: "taxi",
        pickupAt: "2026-07-01T05:00:00.000Z",
        pickupTimezone: "Asia/Bangkok",
      },
    });

    expect(created.mode).toBe("taxi");
    expect(created.linkedFlightId).toBeNull();
    const list = await repo.listTransportBookings({ tripId });
    expect(list.map((t) => t.id)).toContain(created.id);
  });

  it("links a transport booking to a flight at creation and edits pickup details afterwards", async () => {
    const flight = await repo.createFlight({
      input: {
        tripId,
        airline: "בדיקה",
        departureAirport: "TLV",
        arrivalAirport: "BKK",
        departureAt: "2026-07-10T10:00:00.000Z",
        departureTimezone: "Asia/Jerusalem",
        arrivalAt: "2026-07-10T20:00:00.000Z",
        arrivalTimezone: "Asia/Bangkok",
      },
    });
    const created = await repo.createTransportBooking({
      input: {
        tripId,
        mode: "private_transfer",
        pickupAt: "2026-07-10T20:30:00.000Z",
        pickupTimezone: "Asia/Bangkok",
        linkedFlightId: flight.id,
      },
    });
    expect(created.linkedFlightId).toBe(flight.id);

    const updated = await repo.updateTransportBooking({
      input: {
        transportBookingId: created.id,
        pickupAt: "2026-07-10T21:00:00.000Z",
        pickupTimezone: "Asia/Bangkok",
        pickupText: "טרמינל 1, יציאה 3",
        driverName: "סומרסק",
      },
    });
    expect(updated.pickupAt).toBe("2026-07-10T21:00:00.000Z");
    expect(updated.pickupText).toBe("טרמינל 1, יציאה 3");
    expect(updated.driverName).toBe("סומרסק");
    expect(updated.linkedFlightId).toBe(flight.id);
  });

  it("throws when updating a non-existent transport booking", async () => {
    await expect(
      repo.updateTransportBooking({
        input: {
          transportBookingId: "00000000-0000-4000-8000-000000009999",
          pickupAt: "2026-07-10T21:00:00.000Z",
          pickupTimezone: "Asia/Bangkok",
        },
      }),
    ).rejects.toThrow(BookingNotFoundError);
  });

  it("creates an insurance policy", async () => {
    const created = await repo.createInsurance({
      input: {
        tripId,
        company: "חברת ביטוח בדיקה",
        startDate: "2026-07-01",
        endDate: "2026-07-15",
        emergencyPhone: "+972-3-1234567",
      },
    });

    expect(created.company).toBe("חברת ביטוח בדיקה");
    expect(created.emergencyPhone).toBe("+972-3-1234567");
    const list = await repo.listInsurances({ tripId });
    expect(list.map((i) => i.id)).toContain(created.id);
  });

  it("rejects an insurance policy ending before it starts", async () => {
    await expect(
      repo.createInsurance({
        input: { tripId, company: "חברה", startDate: "2026-07-15", endDate: "2026-07-01" },
      }),
    ).rejects.toThrow();
  });

  it("creates an activity reservation", async () => {
    const created = await repo.createActivityReservation({
      input: { tripId, venueName: "פארק אטרקציות בדיקה", activityDate: "2026-07-08", activityTime: "10:00", ticketType: "כניסה כללית" },
    });

    expect(created.venueName).toBe("פארק אטרקציות בדיקה");
    expect(created.ticketType).toBe("כניסה כללית");
    const list = await repo.listActivityReservations({ tripId });
    expect(list.map((a) => a.id)).toContain(created.id);
  });

  it("rejects an activity reservation with an empty venue name", async () => {
    await expect(
      repo.createActivityReservation({ input: { tripId, venueName: "", activityDate: "2026-07-08" } }),
    ).rejects.toThrow();
  });

  it("soft-deletes and restores an activity reservation", async () => {
    const created = await repo.createActivityReservation({
      input: { tripId, venueName: "אטרקציה להסרה", activityDate: "2026-07-08" },
    });
    await repo.softDeleteActivityReservation({ activityReservationId: created.id });
    expect((await repo.listActivityReservations({ tripId })).map((a) => a.id)).not.toContain(created.id);

    await repo.restoreActivityReservation({ activityReservationId: created.id });
    expect((await repo.listActivityReservations({ tripId })).map((a) => a.id)).toContain(created.id);
  });

  it("soft-deletes a hotel stay: hidden from the list afterwards", async () => {
    const created = await repo.createHotelStay({
      input: { tripId, hotelName: "מלון להסרה", checkInDate: "2026-07-01", checkOutDate: "2026-07-05" },
    });
    const deleted = await repo.softDeleteHotelStay({ hotelStayId: created.id });

    expect(deleted.deletedAt).not.toBeNull();
    const list = await repo.listHotelStays({ tripId });
    expect(list.map((h) => h.id)).not.toContain(created.id);
  });

  it("restores a soft-deleted hotel stay — visible again in the default list", async () => {
    const created = await repo.createHotelStay({
      input: { tripId, hotelName: "מלון לשחזור", checkInDate: "2026-07-01", checkOutDate: "2026-07-05" },
    });
    await repo.softDeleteHotelStay({ hotelStayId: created.id });

    const restored = await repo.restoreHotelStay({ hotelStayId: created.id });
    expect(restored.deletedAt).toBeNull();

    const list = await repo.listHotelStays({ tripId });
    expect(list.map((h) => h.id)).toContain(created.id);
  });

  it("soft-deletes a flight: hidden from the list afterwards", async () => {
    const created = await repo.createFlight({
      input: {
        tripId,
        airline: "בדיקה איירליינס",
        departureAirport: "TLV",
        arrivalAirport: "BKK",
        departureAt: "2026-07-10T10:00:00.000Z",
        departureTimezone: "Asia/Jerusalem",
        arrivalAt: "2026-07-10T20:00:00.000Z",
        arrivalTimezone: "Asia/Bangkok",
      },
    });
    await repo.softDeleteFlight({ flightId: created.id });

    const list = await repo.listFlights({ tripId });
    expect(list.map((f) => f.id)).not.toContain(created.id);
  });

  it("soft-deletes a transport booking: hidden from the list afterwards", async () => {
    const created = await repo.createTransportBooking({
      input: { tripId, mode: "taxi", pickupAt: "2026-07-01T05:00:00.000Z", pickupTimezone: "Asia/Bangkok" },
    });
    await repo.softDeleteTransportBooking({ transportBookingId: created.id });

    const list = await repo.listTransportBookings({ tripId });
    expect(list.map((t) => t.id)).not.toContain(created.id);
  });

  it("soft-deletes an insurance policy: hidden from the list afterwards", async () => {
    const created = await repo.createInsurance({
      input: { tripId, company: "חברה להסרה", startDate: "2026-07-01", endDate: "2026-07-15" },
    });
    await repo.softDeleteInsurance({ insuranceId: created.id });

    const list = await repo.listInsurances({ tripId });
    expect(list.map((i) => i.id)).not.toContain(created.id);
  });

  it("creates a car rental", async () => {
    const created = await repo.createCarRental({
      input: {
        tripId,
        vehicleType: "motorbike",
        companyName: "השכרת דמה",
        pickupAt: "2026-07-01T09:00:00.000Z",
        pickupTimezone: "Asia/Bangkok",
        depositAmount: 3000,
        depositCurrencyCode: "THB",
      },
    });

    expect(created.vehicleType).toBe("motorbike");
    expect(created.companyName).toBe("השכרת דמה");
    expect(created.insuranceIncluded).toBe(false);
    expect(created.depositAmount).toBe(3000);
    const list = await repo.listCarRentals({ tripId });
    expect(list.map((c) => c.id)).toContain(created.id);
  });

  it("rejects a car rental with a dropoff time before pickup", async () => {
    await expect(
      repo.createCarRental({
        input: {
          tripId,
          vehicleType: "car",
          companyName: "חברה",
          pickupAt: "2026-07-10T09:00:00.000Z",
          pickupTimezone: "Asia/Bangkok",
          dropoffAt: "2026-07-05T09:00:00.000Z",
        },
      }),
    ).rejects.toThrow();
  });

  it("soft-deletes a car rental: hidden from the list afterwards", async () => {
    const created = await repo.createCarRental({
      input: {
        tripId,
        vehicleType: "scooter",
        companyName: "להסרה",
        pickupAt: "2026-07-01T09:00:00.000Z",
        pickupTimezone: "Asia/Bangkok",
      },
    });
    await repo.softDeleteCarRental({ carRentalId: created.id });

    const list = await repo.listCarRentals({ tripId });
    expect(list.map((c) => c.id)).not.toContain(created.id);
  });

  it("throws when soft-deleting a booking that doesn't exist", async () => {
    const missingId = "00000000-0000-4000-8000-000000009999";
    await expect(repo.softDeleteHotelStay({ hotelStayId: missingId })).rejects.toThrow(BookingNotFoundError);
    await expect(repo.softDeleteFlight({ flightId: missingId })).rejects.toThrow(BookingNotFoundError);
    await expect(repo.softDeleteTransportBooking({ transportBookingId: missingId })).rejects.toThrow(BookingNotFoundError);
    await expect(repo.softDeleteInsurance({ insuranceId: missingId })).rejects.toThrow(BookingNotFoundError);
    await expect(repo.softDeleteActivityReservation({ activityReservationId: missingId })).rejects.toThrow(BookingNotFoundError);
    await expect(repo.softDeleteCarRental({ carRentalId: missingId })).rejects.toThrow(BookingNotFoundError);
  });

  it("stores hotel secondary fields (floor/view/breakfast/early-checkin/booking contact info)", async () => {
    const created = await repo.createHotelStay({
      input: {
        tripId,
        hotelName: "מלון עם פרטים מלאים",
        checkInDate: "2026-07-01",
        checkOutDate: "2026-07-05",
        floor: "12",
        view: "ים",
        breakfastHours: "07:00-10:30",
        breakfastLocation: "מסעדה ראשית",
        earlyCheckIn: true,
        externalBookingId: "EXT-123",
        cancellationPolicy: "ביטול חינם עד 48 שעות",
        phone: "+66-2-000-0000",
      },
    });

    expect(created.floor).toBe("12");
    expect(created.view).toBe("ים");
    expect(created.earlyCheckIn).toBe(true);
    expect(created.lateCheckOut).toBe(false);
    expect(created.externalBookingId).toBe("EXT-123");
    expect(created.cancellationPolicy).toBe("ביטול חינם עד 48 שעות");
  });

  it("stores flight terminal/baggage fields", async () => {
    const created = await repo.createFlight({
      input: {
        tripId,
        airline: "בדיקה איירליינס",
        departureAirport: "TLV",
        arrivalAirport: "BKK",
        departureTerminal: "3",
        arrivalTerminal: "1",
        baggage: "23kg + טרולי",
        departureAt: "2026-07-10T10:00:00.000Z",
        departureTimezone: "Asia/Jerusalem",
        arrivalAt: "2026-07-10T22:00:00.000Z",
        arrivalTimezone: "Asia/Bangkok",
      },
    });

    expect(created.departureTerminal).toBe("3");
    expect(created.baggage).toBe("23kg + טרולי");
  });

  it("stores transport ETA and toll/parking fees", async () => {
    const created = await repo.createTransportBooking({
      input: {
        tripId,
        mode: "taxi",
        pickupAt: "2026-07-01T09:00:00.000Z",
        pickupTimezone: "Asia/Bangkok",
        etaAt: "2026-07-01T09:45:00.000Z",
        etaTimezone: "Asia/Bangkok",
        tollFees: 50,
        parkingFees: 20,
      },
    });

    expect(created.etaAt).toBe("2026-07-01T09:45:00.000Z");
    expect(created.tollFees).toBe(50);
    expect(created.parkingFees).toBe(20);
  });

  it("creates, lists, and deletes a booking benefit", async () => {
    const hotel = await repo.createHotelStay({
      input: { tripId, hotelName: "מלון עם הטבות", checkInDate: "2026-07-01", checkOutDate: "2026-07-05" },
    });

    const benefit = await repo.createBookingBenefit({
      input: { bookingId: hotel.bookingId, benefitName: "ארוחת בוקר חינם", benefitType: "breakfast" },
    });

    let list = await repo.listBookingBenefits({ bookingId: hotel.bookingId });
    expect(list.map((b) => b.id)).toContain(benefit.id);
    expect(list[0]?.benefitType).toBe("breakfast");

    await repo.deleteBookingBenefit({ benefitId: benefit.id });
    list = await repo.listBookingBenefits({ bookingId: hotel.bookingId });
    expect(list).toHaveLength(0);
  });

  it("creates transport quotes and lists them sorted cheapest-first", async () => {
    await repo.createTransportQuote({ input: { tripId, provider: "ספק יקר", price: 500, currencyCode: "THB" } });
    await repo.createTransportQuote({ input: { tripId, provider: "ספק זול", price: 200, currencyCode: "THB" } });

    const quotes = await repo.listTransportQuotes({ tripId });
    expect(quotes.map((q) => q.provider)).toEqual(["ספק זול", "ספק יקר"]);
    expect(quotes[0]?.isSelected).toBe(false);
  });

  it("toggles a transport quote's isSelected flag", async () => {
    const quote = await repo.createTransportQuote({ input: { tripId, provider: "ספק", price: 300, currencyCode: "THB" } });

    const selected = await repo.toggleTransportQuoteSelected({ quoteId: quote.id });
    expect(selected.isSelected).toBe(true);

    const unselected = await repo.toggleTransportQuoteSelected({ quoteId: quote.id });
    expect(unselected.isSelected).toBe(false);
  });

  it("deletes a transport quote", async () => {
    const quote = await repo.createTransportQuote({ input: { tripId, provider: "ספק למחיקה", price: 400, currencyCode: "THB" } });
    await repo.deleteTransportQuote({ quoteId: quote.id });

    const quotes = await repo.listTransportQuotes({ tripId });
    expect(quotes.map((q) => q.id)).not.toContain(quote.id);
  });

  it("sets and clears a hotel stay's personal rating", async () => {
    const created = await repo.createHotelStay({
      input: { tripId, hotelName: "מלון לדירוג", checkInDate: "2026-07-01", checkOutDate: "2026-07-05" },
    });
    expect(created.personalRating).toBeNull();

    const rated = await repo.updateHotelStayPersonalRating({ input: { hotelStayId: created.id, personalRating: 4 } });
    expect(rated.personalRating).toBe(4);

    const cleared = await repo.updateHotelStayPersonalRating({ input: { hotelStayId: created.id, personalRating: null } });
    expect(cleared.personalRating).toBeNull();
  });

  it("throws when setting a personal rating on a non-existent hotel stay", async () => {
    await expect(
      repo.updateHotelStayPersonalRating({ input: { hotelStayId: "00000000-0000-4000-8000-000000009999", personalRating: 3 } }),
    ).rejects.toThrow(BookingNotFoundError);
  });

  it("sets and clears a transport booking's personal rating", async () => {
    const created = await repo.createTransportBooking({
      input: { tripId, mode: "taxi", pickupAt: "2026-07-01T05:00:00.000Z", pickupTimezone: "Asia/Bangkok" },
    });
    expect(created.personalRating).toBeNull();

    const rated = await repo.updateTransportBookingPersonalRating({
      input: { transportBookingId: created.id, personalRating: 2 },
    });
    expect(rated.personalRating).toBe(2);

    const cleared = await repo.updateTransportBookingPersonalRating({
      input: { transportBookingId: created.id, personalRating: null },
    });
    expect(cleared.personalRating).toBeNull();
  });

  it("throws when setting a personal rating on a non-existent transport booking", async () => {
    await expect(
      repo.updateTransportBookingPersonalRating({
        input: { transportBookingId: "00000000-0000-4000-8000-000000009999", personalRating: 3 },
      }),
    ).rejects.toThrow(BookingNotFoundError);
  });
});
