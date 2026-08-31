import { describe, expect, it } from "vitest";
import { mapExtractedFieldsToFlightPrefill, mapExtractedFieldsToHotelPrefill } from "./map-extracted-fields";

describe("mapExtractedFieldsToHotelPrefill", () => {
  it("maps confirmation number, date, phone, email, and amount from heuristic-style fields", () => {
    const prefill = mapExtractedFieldsToHotelPrefill([
      { fieldName: "date", extractedValue: "2026-08-01", confidenceScore: 0.7 },
      { fieldName: "confirmation_number", extractedValue: "ABC123", confidenceScore: 0.6 },
      { fieldName: "phone", extractedValue: "+972-50-1234567", confidenceScore: 0.9 },
      { fieldName: "email", extractedValue: "hotel@example.com", confidenceScore: 0.9 },
      { fieldName: "amount", extractedValue: "₪1,200", confidenceScore: 0.5 },
    ]);

    expect(prefill.checkInDate).toBe("2026-08-01");
    expect(prefill.confirmationNumber).toBe("ABC123");
    expect(prefill.phone).toBe("+972-50-1234567");
    expect(prefill.email).toBe("hotel@example.com");
    expect(prefill.agreedPrice).toBe(1200);
  });

  it("leaves hotelName undefined when no vendor-name field was extracted (heuristic OCR can't read it)", () => {
    const prefill = mapExtractedFieldsToHotelPrefill([{ fieldName: "date", extractedValue: "2026-08-01", confidenceScore: 0.7 }]);
    expect(prefill.hotelName).toBeUndefined();
  });

  it("returns an empty prefill for an empty extraction result", () => {
    expect(mapExtractedFieldsToHotelPrefill([])).toEqual({
      hotelName: undefined,
      checkInDate: undefined,
      confirmationNumber: undefined,
      phone: undefined,
      email: undefined,
      agreedPrice: undefined,
    });
  });
});

describe("mapExtractedFieldsToFlightPrefill", () => {
  it("maps airline, confirmation number, and amount", () => {
    const prefill = mapExtractedFieldsToFlightPrefill([
      { fieldName: "airline", extractedValue: "El Al", confidenceScore: 0.8 },
      { fieldName: "confirmation_number", extractedValue: "XYZ789", confidenceScore: 0.6 },
      { fieldName: "amount", extractedValue: "1500", confidenceScore: 0.5 },
    ]);

    expect(prefill.airline).toBe("El Al");
    expect(prefill.confirmationNumber).toBe("XYZ789");
    expect(prefill.agreedPrice).toBe(1500);
  });

  it("does not fabricate a departure time from a bare extracted date", () => {
    // ה-type FlightPrefill בכוונה לא כולל departureAt בכלל — אין דרך לחלץ שעה
    // אמינה מ-OCR, אז לא בונים datetime עם שעה מומצאת.
    const prefill = mapExtractedFieldsToFlightPrefill([{ fieldName: "date", extractedValue: "2026-08-01", confidenceScore: 0.7 }]);
    expect(prefill).not.toHaveProperty("departureAt");
  });
});
