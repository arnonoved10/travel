import { afterEach, describe, expect, it, vi } from "vitest";
import { OsrmRoutingProvider } from "./osrm-provider";

const query = { fromLat: 13.7563, fromLng: 100.5018, toLat: 13.7367, toLng: 100.5231 };

function stubFetchWith(body: unknown, ok = true): void {
  vi.stubGlobal(
    "fetch",
    vi.fn(async () => ({ ok, status: ok ? 200 : 500, json: async () => body }) as Response),
  );
}

describe("OsrmRoutingProvider", () => {
  afterEach(() => {
    vi.unstubAllGlobals();
  });

  it("maps a real-shaped OSRM response to distanceKm/travelTimeMinutes", async () => {
    stubFetchWith({ code: "Ok", routes: [{ distance: 3423.5, duration: 612 }] });
    const provider = new OsrmRoutingProvider();

    const result = await provider.getDrivingRoute(query);

    expect(result).not.toBeNull();
    expect(result?.distanceKm).toBe(3.4);
    expect(result?.travelTimeMinutes).toBe(10);
    expect(result?.provider).toBe("osrm");
  });

  it("returns null rather than a fabricated distance when OSRM finds no route", async () => {
    stubFetchWith({ code: "NoRoute", routes: [] });
    const provider = new OsrmRoutingProvider();

    const result = await provider.getDrivingRoute(query);

    expect(result).toBeNull();
  });

  it("throws instead of returning fabricated data when the request fails", async () => {
    stubFetchWith({}, false);
    const provider = new OsrmRoutingProvider();

    await expect(provider.getDrivingRoute(query)).rejects.toThrow();
  });

  describe("getOptimizedTripOrder", () => {
    const waypoints = [
      { lat: 13.7563, lng: 100.5018 }, // start (index 0)
      { lat: 13.7367, lng: 100.5231 }, // middle (index 1)
      { lat: 13.75, lng: 100.49 }, // middle (index 2)
      { lat: 13.72, lng: 100.55 }, // end (index 3)
    ];

    it("reorders the middle waypoints while keeping start/end fixed, and maps OSRM legs", async () => {
      // OSRM decides the best visiting order is index 0, 2, 1, 3 — waypoint_index
      // is each INPUT waypoint's position in that optimized order.
      stubFetchWith({
        code: "Ok",
        waypoints: [{ waypoint_index: 0 }, { waypoint_index: 2 }, { waypoint_index: 1 }, { waypoint_index: 3 }],
        trips: [
          {
            legs: [
              { distance: 1000, duration: 120 },
              { distance: 2000, duration: 240 },
              { distance: 3000, duration: 360 },
            ],
          },
        ],
      });
      const provider = new OsrmRoutingProvider();

      const result = await provider.getOptimizedTripOrder(waypoints);

      expect(result).not.toBeNull();
      expect(result?.orderedIndices).toEqual([0, 2, 1, 3]);
      expect(result?.legDistancesKm).toEqual([1, 2, 3]);
      expect(result?.legTravelTimeMinutes).toEqual([2, 4, 6]);
    });

    it("returns null rather than fabricating an order when OSRM can't solve the trip", async () => {
      stubFetchWith({ code: "NoTrips" });
      const provider = new OsrmRoutingProvider();

      const result = await provider.getOptimizedTripOrder(waypoints);

      expect(result).toBeNull();
    });

    it("returns null without calling the network for fewer than two waypoints", async () => {
      const fetchSpy = vi.fn();
      vi.stubGlobal("fetch", fetchSpy);
      const provider = new OsrmRoutingProvider();

      const result = await provider.getOptimizedTripOrder([{ lat: 1, lng: 1 }]);

      expect(result).toBeNull();
      expect(fetchSpy).not.toHaveBeenCalled();
    });

    it("throws instead of returning fabricated data when the request fails", async () => {
      stubFetchWith({}, false);
      const provider = new OsrmRoutingProvider();

      await expect(provider.getOptimizedTripOrder(waypoints)).rejects.toThrow();
    });
  });
});
