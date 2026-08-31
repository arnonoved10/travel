import { describe, expect, it } from "vitest";
import { buildFlightSearchLinks } from "./flight-search-links";

describe("buildFlightSearchLinks", () => {
  it("builds search URLs with uppercase IATA codes and the correct date formats", () => {
    const links = buildFlightSearchLinks({ departureAirport: "tlv", arrivalAirport: "bkk", departureDate: "2026-06-01" });

    expect(links.googleFlightsUrl).toContain("TLV");
    expect(links.googleFlightsUrl).toContain("BKK");
    expect(links.kayakUrl).toBe("https://www.kayak.com/flights/TLV-BKK/2026-06-01");
    expect(links.skyscannerUrl).toBe("https://www.skyscanner.net/transport/flights/tlv/bkk/260601/");
    for (const url of Object.values(links)) {
      expect(url).toMatch(/^https:\/\//);
    }
  });
});
