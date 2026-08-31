import { beforeEach, describe, expect, it } from "vitest";
import { MockPlaceRepository } from "./place-repository.mock";
import { PlaceNotFoundError } from "./place-repository";

const userA = "11111111-1111-4111-8111-111111111111";
const userB = "22222222-2222-4222-8222-222222222222";

describe("MockPlaceRepository", () => {
  let repo: MockPlaceRepository;

  beforeEach(() => {
    repo = new MockPlaceRepository();
  });

  it("creates a place and returns it in that user's library", async () => {
    const created = await repo.create({
      userId: userA,
      input: { name: "בית קפה לבדיקה", category: "cafe" },
    });

    expect(created.id).toBeTruthy();
    expect(created.deletedAt).toBeNull();

    const list = await repo.list({ userId: userA });
    expect(list.map((p) => p.id)).toContain(created.id);
  });

  it("isolates places between users, matching the RLS-fixed schema requirement", async () => {
    const created = await repo.create({ userId: userA, input: { name: "מקום פרטי", category: "attraction" } });

    const userBList = await repo.list({ userId: userB });
    expect(userBList.map((p) => p.id)).not.toContain(created.id);
    expect(await repo.getById({ userId: userB, placeId: created.id })).toBeNull();
  });

  it("soft-deletes a place: hidden by default, throws when a different user tries to delete it", async () => {
    const created = await repo.create({ userId: userA, input: { name: "מקום למחיקה", category: "shop" } });

    await expect(repo.softDelete({ userId: userB, placeId: created.id })).rejects.toThrow(PlaceNotFoundError);

    const deleted = await repo.softDelete({ userId: userA, placeId: created.id });
    expect(deleted.deletedAt).not.toBeNull();

    const list = await repo.list({ userId: userA });
    expect(list.map((p) => p.id)).not.toContain(created.id);
  });

  it("restores a soft-deleted place — visible again in the default list", async () => {
    const created = await repo.create({ userId: userA, input: { name: "מקום לשחזור", category: "shop" } });
    await repo.softDelete({ userId: userA, placeId: created.id });

    const restored = await repo.restore({ userId: userA, placeId: created.id });
    expect(restored.deletedAt).toBeNull();

    const list = await repo.list({ userId: userA });
    expect(list.map((p) => p.id)).toContain(created.id);
  });

  it("stores address and lat/lng when both coordinates are given together", async () => {
    const created = await repo.create({
      userId: userA,
      input: { name: "מסעדה עם קואורדינטות", category: "restaurant", address: "123 Sukhumvit Rd", lat: 13.7563, lng: 100.5018 },
    });

    expect(created.address).toBe("123 Sukhumvit Rd");
    expect(created.lat).toBe(13.7563);
    expect(created.lng).toBe(100.5018);
  });

  it("rejects a place with only one of lat/lng filled in", async () => {
    await expect(
      repo.create({ userId: userA, input: { name: "מקום חצי-מוגדר", category: "other", lat: 13.7563 } }),
    ).rejects.toThrow();
  });

  it("toggles isFavorite on and off", async () => {
    const created = await repo.create({ userId: userA, input: { name: "מקום למועדפים", category: "cafe" } });
    expect(created.isFavorite).toBe(false);

    const favorited = await repo.toggleFavorite({ userId: userA, placeId: created.id });
    expect(favorited.isFavorite).toBe(true);

    const unfavorited = await repo.toggleFavorite({ userId: userA, placeId: created.id });
    expect(unfavorited.isFavorite).toBe(false);
  });

  it("throws when toggling favorite on a place owned by a different user", async () => {
    const created = await repo.create({ userId: userA, input: { name: "מקום פרטי", category: "cafe" } });
    await expect(repo.toggleFavorite({ userId: userB, placeId: created.id })).rejects.toThrow(PlaceNotFoundError);
  });

  it("sets and clears a personal rating", async () => {
    const created = await repo.create({ userId: userA, input: { name: "מקום לדירוג", category: "restaurant" } });
    expect(created.personalRating).toBeNull();

    const rated = await repo.setPersonalRating({ userId: userA, placeId: created.id, personalRating: 4 });
    expect(rated.personalRating).toBe(4);

    const cleared = await repo.setPersonalRating({ userId: userA, placeId: created.id, personalRating: null });
    expect(cleared.personalRating).toBeNull();
  });

  it("throws when setting a personal rating on a place owned by a different user", async () => {
    const created = await repo.create({ userId: userA, input: { name: "מקום פרטי", category: "cafe" } });
    await expect(repo.setPersonalRating({ userId: userB, placeId: created.id, personalRating: 5 })).rejects.toThrow(
      PlaceNotFoundError,
    );
  });

  it("listByIds batch-fetches places across users without an ownership check", async () => {
    const a = await repo.create({ userId: userA, input: { name: "מקום א", category: "cafe" } });
    const b = await repo.create({ userId: userB, input: { name: "מקום ב", category: "restaurant" } });

    const result = await repo.listByIds({ placeIds: [a.id, b.id, "does-not-exist"] });

    expect(result.map((p) => p.id).sort()).toEqual([a.id, b.id].sort());
  });
});
