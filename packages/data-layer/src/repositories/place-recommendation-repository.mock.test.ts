import { beforeEach, describe, expect, it } from "vitest";
import { MockPlaceRecommendationRepository } from "./place-recommendation-repository.mock";

const tripId = "66666666-6666-4666-8666-666666666666";

describe("MockPlaceRecommendationRepository", () => {
  let repo: MockPlaceRecommendationRepository;

  beforeEach(() => {
    repo = new MockPlaceRecommendationRepository();
  });

  it("stores items for a trip and returns them via listForTrip", async () => {
    await repo.replaceForTrip({
      tripId,
      scopeLabel: "בנגקוק",
      items: [
        { category: "מסעדה", name: "מסעדת בדיקה", address: null, rating: 4.5, userRatingsTotal: 100, mapsUrl: "https://maps.test/1", photoUrl: null },
      ],
    });

    const list = await repo.listForTrip({ tripId });
    expect(list).toHaveLength(1);
    expect(list[0]?.name).toBe("מסעדת בדיקה");
    expect(list[0]?.scopeLabel).toBe("בנגקוק");
  });

  it("replacing the same scope does not leave duplicates", async () => {
    await repo.replaceForTrip({
      tripId,
      scopeLabel: "בנגקוק",
      items: [{ category: null, name: "מקום ישן", address: null, rating: null, userRatingsTotal: null, mapsUrl: "https://maps.test/old", photoUrl: null }],
    });
    await repo.replaceForTrip({
      tripId,
      scopeLabel: "בנגקוק",
      items: [{ category: null, name: "מקום חדש", address: null, rating: null, userRatingsTotal: null, mapsUrl: "https://maps.test/new", photoUrl: null }],
    });

    const list = await repo.listForTrip({ tripId });
    expect(list).toHaveLength(1);
    expect(list[0]?.name).toBe("מקום חדש");
  });

  it("replacing one scope does not affect another scope's items in the same trip", async () => {
    await repo.replaceForTrip({
      tripId,
      scopeLabel: "בנגקוק",
      items: [{ category: null, name: "בנגקוק א", address: null, rating: null, userRatingsTotal: null, mapsUrl: "https://maps.test/bkk", photoUrl: null }],
    });
    await repo.replaceForTrip({
      tripId,
      scopeLabel: "צ'יאנג מאי",
      items: [{ category: null, name: "צ'יאנג מאי א", address: null, rating: null, userRatingsTotal: null, mapsUrl: "https://maps.test/cnx", photoUrl: null }],
    });

    const list = await repo.listForTrip({ tripId });
    expect(list.map((r) => r.name).sort()).toEqual(["בנגקוק א", "צ'יאנג מאי א"]);
  });

  it("clearForTrip removes all recommendations for the trip", async () => {
    await repo.replaceForTrip({
      tripId,
      scopeLabel: "בנגקוק",
      items: [{ category: null, name: "מקום", address: null, rating: null, userRatingsTotal: null, mapsUrl: "https://maps.test/1", photoUrl: null }],
    });
    await repo.clearForTrip({ tripId });

    expect(await repo.listForTrip({ tripId })).toHaveLength(0);
  });
});
