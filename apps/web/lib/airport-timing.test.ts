import { describe, expect, it } from "vitest";
import { computeAirportTiming } from "./airport-timing";

describe("computeAirportTiming", () => {
  it("computes recommended airport arrival time from lead time alone", () => {
    const result = computeAirportTiming({
      departureAt: "2026-12-01T10:00:00.000Z",
      recommendedArrivalLeadMinutes: 180,
    });
    expect(result.recommendedAirportArrivalAt).toBe("2026-12-01T07:00:00.000Z");
    expect(result.recommendedLeaveAt).toBeNull();
  });

  it("also computes recommended leave-home time when travel time is provided", () => {
    const result = computeAirportTiming({
      departureAt: "2026-12-01T10:00:00.000Z",
      recommendedArrivalLeadMinutes: 180,
      travelTimeToAirportMinutes: 45,
    });
    expect(result.recommendedAirportArrivalAt).toBe("2026-12-01T07:00:00.000Z");
    expect(result.recommendedLeaveAt).toBe("2026-12-01T06:15:00.000Z");
  });
});
