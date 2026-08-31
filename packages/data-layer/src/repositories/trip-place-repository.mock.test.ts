import { beforeEach, describe, expect, it } from "vitest";
import { MockTripPlaceRepository } from "./trip-place-repository.mock";
import { MockPlaceRepository, mockPlaceRepository } from "./place-repository.mock";

const userId = "55555555-5555-4555-8555-555555555555";
const tripId = "66666666-6666-4666-8666-666666666666";

describe("MockTripPlaceRepository", () => {
  let repo: MockTripPlaceRepository;

  beforeEach(() => {
    repo = new MockTripPlaceRepository();
    // מנקה ומחדש את ה-singleton הגלובלי כדי שהבדיקות לא ישפיעו אחת על השנייה
    Object.assign(mockPlaceRepository, new MockPlaceRepository());
  });

  it("links a place owned by the user to a trip and lists it back with the place details", async () => {
    const place = await mockPlaceRepository.create({ userId, input: { name: "מקום לקישור", category: "cafe" } });

    const link = await repo.linkPlaceToTrip({ userId, tripId, placeId: place.id, status: "want_to_go" });
    expect(link.status).toBe("want_to_go");

    const list = await repo.listForTrip({ userId, tripId });
    expect(list).toHaveLength(1);
    expect(list[0]?.place.name).toBe("מקום לקישור");
  });

  it("rejects linking a place that belongs to a different user", async () => {
    const place = await mockPlaceRepository.create({ userId, input: { name: "מקום פרטי", category: "hotel" } });
    const otherUserId = "77777777-7777-4777-8777-777777777777";

    await expect(
      repo.linkPlaceToTrip({ userId: otherUserId, tripId, placeId: place.id, status: "planned" }),
    ).rejects.toThrow();
  });

  it("updates the status when the same place is linked to the trip again", async () => {
    const place = await mockPlaceRepository.create({ userId, input: { name: "מקום", category: "beach" } });
    await repo.linkPlaceToTrip({ userId, tripId, placeId: place.id, status: "want_to_go" });
    await repo.linkPlaceToTrip({ userId, tripId, placeId: place.id, status: "visited" });

    const list = await repo.listForTrip({ userId, tripId });
    expect(list).toHaveLength(1);
    expect(list[0]?.status).toBe("visited");
  });
});
