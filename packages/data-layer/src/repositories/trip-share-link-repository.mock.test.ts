import { beforeEach, describe, expect, it } from "vitest";
import { MockTripShareLinkRepository } from "./trip-share-link-repository.mock";
import { mockTripRepository } from "./trip-repository.mock";
import { TripNotFoundForShareLinkError } from "./trip-share-link-repository";

const DEMO_USER_ID = "00000000-0000-4000-8000-000000000001"; // תואם ל-seed הפנימי של MockTripRepository

describe("MockTripShareLinkRepository", () => {
  let repo: MockTripShareLinkRepository;
  let tripId: string;

  beforeEach(async () => {
    repo = new MockTripShareLinkRepository();
    const trips = await mockTripRepository.list({ userId: DEMO_USER_ID });
    tripId = trips[0]!.id;
  });

  it("creates a new share link on first call, and returns the same one on a second call", async () => {
    const first = await repo.getOrCreateForTrip({ userId: DEMO_USER_ID, tripId });
    const second = await repo.getOrCreateForTrip({ userId: DEMO_USER_ID, tripId });

    expect(second.id).toBe(first.id);
    expect(second.token).toBe(first.token);
    expect(first.revokedAt).toBeNull();
  });

  it("getActiveForTrip returns null until a link is created, then returns it without creating a new one", async () => {
    expect(await repo.getActiveForTrip({ tripId })).toBeNull();

    const created = await repo.getOrCreateForTrip({ userId: DEMO_USER_ID, tripId });
    const active = await repo.getActiveForTrip({ tripId });

    expect(active?.id).toBe(created.id);
  });

  it("throws instead of creating a link for a trip the user doesn't own", async () => {
    await expect(repo.getOrCreateForTrip({ userId: "someone-else", tripId })).rejects.toThrow(TripNotFoundForShareLinkError);
  });

  it("resolves an active token to its link", async () => {
    const link = await repo.getOrCreateForTrip({ userId: DEMO_USER_ID, tripId });
    const resolved = await repo.resolveToken({ token: link.token });

    expect(resolved?.id).toBe(link.id);
  });

  it("returns null for a token that was never issued", async () => {
    expect(await repo.resolveToken({ token: "not-a-real-token" })).toBeNull();
  });

  it("stops resolving a token once revoked", async () => {
    const link = await repo.getOrCreateForTrip({ userId: DEMO_USER_ID, tripId });
    await repo.revoke({ userId: DEMO_USER_ID, tripId });

    expect(await repo.resolveToken({ token: link.token })).toBeNull();
  });

  it("issues a fresh token on regenerate, invalidating the old one", async () => {
    const original = await repo.getOrCreateForTrip({ userId: DEMO_USER_ID, tripId });
    const regenerated = await repo.regenerate({ userId: DEMO_USER_ID, tripId });

    expect(regenerated.token).not.toBe(original.token);
    expect(await repo.resolveToken({ token: original.token })).toBeNull();
    expect(await repo.resolveToken({ token: regenerated.token })).not.toBeNull();
  });
});
