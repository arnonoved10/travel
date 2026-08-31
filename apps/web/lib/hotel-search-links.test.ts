import { describe, expect, it } from "vitest";
import { buildHotelSearchLinks } from "./hotel-search-links";

describe("buildHotelSearchLinks", () => {
  it("builds search URLs with the hotel name, address, and dates encoded", () => {
    const links = buildHotelSearchLinks({
      hotelName: "Grand Hotel",
      address: "Bangkok, Thailand",
      checkInDate: "2026-06-01",
      checkOutDate: "2026-06-05",
    });

    expect(links.bookingComUrl).toContain("Grand%20Hotel");
    expect(links.bookingComUrl).toContain("checkin=2026-06-01");
    expect(links.bookingComUrl).toContain("checkout=2026-06-05");
    expect(links.googleHotelsUrl).toContain("Grand%20Hotel");
    expect(links.trivagoUrl).toContain("checkin_year_month_day=2026-06-01");
    expect(links.hotelsComUrl).toContain("startDate=2026-06-01");
    for (const url of Object.values(links)) {
      expect(url).toMatch(/^https:\/\//);
    }
  });

  it("still builds valid links when address is missing", () => {
    const links = buildHotelSearchLinks({ hotelName: "Grand Hotel", checkInDate: "2026-06-01", checkOutDate: "2026-06-05" });

    expect(links.bookingComUrl).toContain("Grand%20Hotel");
    expect(links.bookingComUrl).not.toContain("undefined");
  });
});
