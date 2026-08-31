import { describe, expect, it } from "vitest";
import { buildDriverWhatsAppMessage } from "./driver-whatsapp-message";

describe("buildDriverWhatsAppMessage", () => {
  it("includes pickup/dropoff and pickup time without a linked flight", () => {
    const text = buildDriverWhatsAppMessage({
      transportBooking: {
        mode: "taxi",
        pickupText: "מלון סנטרל",
        dropoffText: "שדה התעופה",
        pickupAt: "2026-07-10T05:00:00.000Z",
        pickupTimezone: "Asia/Bangkok",
      },
      linkedFlight: null,
    });

    expect(text).toContain("מלון סנטרל");
    expect(text).toContain("שדה התעופה");
    expect(text).not.toContain("טיסה:");
  });

  it("includes flight number, arrival time, and live status/delay when a flight is linked", () => {
    const text = buildDriverWhatsAppMessage({
      transportBooking: {
        mode: "private_transfer",
        pickupText: null,
        dropoffText: "מלון סנטרל",
        pickupAt: "2026-07-10T20:30:00.000Z",
        pickupTimezone: "Asia/Bangkok",
      },
      linkedFlight: {
        airline: "El Al",
        flightNumber: "LY83",
        arrivalAt: "2026-07-10T20:00:00.000Z",
        arrivalTimezone: "Asia/Bangkok",
        liveStatus: "active",
        liveDelayMinutes: 25,
      },
    });

    expect(text).toContain("El Al LY83");
    expect(text).toContain("עיכוב של 25 דקות");
  });

  it("omits the delay clause when there is no delay", () => {
    const text = buildDriverWhatsAppMessage({
      transportBooking: {
        mode: "private_transfer",
        pickupText: null,
        dropoffText: null,
        pickupAt: "2026-07-10T20:30:00.000Z",
        pickupTimezone: "Asia/Bangkok",
      },
      linkedFlight: {
        airline: "El Al",
        flightNumber: "LY83",
        arrivalAt: "2026-07-10T20:00:00.000Z",
        arrivalTimezone: "Asia/Bangkok",
        liveStatus: "landed",
        liveDelayMinutes: null,
      },
    });

    expect(text).not.toContain("עיכוב");
    expect(text).toContain("נחתה");
  });
});
