import { beforeEach, describe, expect, it } from "vitest";
import { MockTripCompanionRepository } from "./trip-companion-repository.mock";
import { TripCompanionNotFoundError } from "./trip-companion-repository";

const tripA = "aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa";
const tripB = "bbbbbbbb-bbbb-4bbb-8bbb-bbbbbbbbbbbb";

describe("MockTripCompanionRepository", () => {
  let repo: MockTripCompanionRepository;

  beforeEach(() => {
    repo = new MockTripCompanionRepository();
  });

  it("creates a companion and returns it in that trip's list", async () => {
    const created = await repo.create({ input: { tripId: tripA, displayName: "רותם" } });
    const list = await repo.listForTrip({ tripId: tripA });
    expect(list.map((c) => c.id)).toContain(created.id);
  });

  it("isolates companions between trips", async () => {
    const created = await repo.create({ input: { tripId: tripA, displayName: "פרטי" } });

    const tripBList = await repo.listForTrip({ tripId: tripB });
    expect(tripBList.map((c) => c.id)).not.toContain(created.id);
  });

  it("soft-deletes a companion and hides it from the default list", async () => {
    const created = await repo.create({ input: { tripId: tripA, displayName: "למחיקה" } });
    await repo.softDelete({ companionId: created.id });

    const list = await repo.listForTrip({ tripId: tripA });
    expect(list.map((c) => c.id)).not.toContain(created.id);
  });

  it("includes a soft-deleted companion when includeDeleted is passed", async () => {
    const created = await repo.create({ input: { tripId: tripA, displayName: "היסטורי" } });
    await repo.softDelete({ companionId: created.id });

    const list = await repo.listForTrip({ tripId: tripA, includeDeleted: true });
    expect(list.map((c) => c.id)).toContain(created.id);
  });

  it("throws when soft-deleting a companion that doesn't exist", async () => {
    await expect(repo.softDelete({ companionId: "does-not-exist" })).rejects.toThrow(TripCompanionNotFoundError);
  });
});
