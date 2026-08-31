import { afterEach, describe, expect, it, vi } from "vitest";
import type { PlaceCategory } from "@travel-app/shared-types";
import { OverpassPoiProvider } from "./overpass-provider";

const query = { lat: 32.0853, lng: 34.7818, radiusKm: 5, categories: ["restaurant", "viewpoint"] as PlaceCategory[] };

function stubFetchWith(body: unknown, ok = true): void {
  vi.stubGlobal(
    "fetch",
    vi.fn(async () => ({ ok, status: ok ? 200 : 500, json: async () => body }) as Response),
  );
}

describe("OverpassPoiProvider", () => {
  afterEach(() => {
    vi.unstubAllGlobals();
  });

  it("maps named OSM elements with recognized tags to PoiCandidates", async () => {
    stubFetchWith({
      elements: [
        { type: "node", id: 1, lat: 32.09, lon: 34.78, tags: { name: "מסעדת הים", amenity: "restaurant" } },
        { type: "way", id: 2, center: { lat: 32.08, lon: 34.79 }, tags: { name: "תצפית ההר", tourism: "viewpoint" } },
      ],
    });
    const provider = new OverpassPoiProvider();

    const results = await provider.searchNearby(query);

    expect(results).not.toBeNull();
    expect(results).toHaveLength(2);
    expect(results?.[0]).toMatchObject({ externalId: "node/1", name: "מסעדת הים", category: "restaurant", lat: 32.09, lng: 34.78 });
    expect(results?.[1]).toMatchObject({ externalId: "way/2", name: "תצפית ההר", category: "viewpoint", lat: 32.08, lng: 34.79 });
  });

  it("skips elements without a real name rather than fabricating one", async () => {
    stubFetchWith({
      elements: [
        { type: "node", id: 1, lat: 32.09, lon: 34.78, tags: { amenity: "restaurant" } },
        { type: "node", id: 2, lat: 32.1, lon: 34.8, tags: { name: "בית קפה עם שם", amenity: "restaurant" } },
      ],
    });
    const provider = new OverpassPoiProvider();

    const results = await provider.searchNearby(query);

    expect(results).toHaveLength(1);
    expect(results?.[0]?.name).toBe("בית קפה עם שם");
  });

  it("skips elements whose tags don't match any requested category", async () => {
    stubFetchWith({
      elements: [{ type: "node", id: 1, lat: 32.09, lon: 34.78, tags: { name: "חנות נעליים", shop: "shoes" } }],
    });
    const provider = new OverpassPoiProvider();

    const results = await provider.searchNearby(query);

    expect(results).toEqual([]);
  });

  it("returns an empty array without calling the network when no requested category has an OSM mapping", async () => {
    const fetchSpy = vi.fn();
    vi.stubGlobal("fetch", fetchSpy);
    const provider = new OverpassPoiProvider();

    const results = await provider.searchNearby({ lat: 32, lng: 34, radiusKm: 5, categories: ["hotel"] });

    expect(results).toEqual([]);
    expect(fetchSpy).not.toHaveBeenCalled();
  });

  it("returns null rather than fabricating results on a malformed response", async () => {
    stubFetchWith({ notElements: true });
    const provider = new OverpassPoiProvider();

    const results = await provider.searchNearby(query);

    expect(results).toBeNull();
  });

  it("throws instead of returning fabricated data when the request fails", async () => {
    stubFetchWith({}, false);
    const provider = new OverpassPoiProvider();

    await expect(provider.searchNearby(query)).rejects.toThrow();
  });
});
