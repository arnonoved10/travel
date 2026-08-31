import { beforeEach, describe, expect, it } from "vitest";
import { MockTripRepository } from "./trip-repository.mock";
import { TripNotFoundError } from "./trip-repository";

const userA = "11111111-1111-4111-8111-111111111111";
const userB = "22222222-2222-4222-8222-222222222222";

describe("MockTripRepository", () => {
  let repo: MockTripRepository;

  beforeEach(() => {
    repo = new MockTripRepository();
  });

  it("seeds demo trips clearly labeled as demo, scoped to the demo user", async () => {
    const demoUserId = "00000000-0000-4000-8000-000000000001";
    const trips = await repo.list({ userId: demoUserId });
    expect(trips.length).toBeGreaterThan(0);
    for (const trip of trips) {
      expect(trip.name).toContain("[דמו]");
    }
  });

  it("creates a trip for a user and returns it in that user's list", async () => {
    const created = await repo.create({
      userId: userA,
      input: { name: "טיול בדיקה", startDate: "2026-06-01", endDate: "2026-06-10" },
    });

    expect(created.id).toBeTruthy();
    expect(created.status).toBe("planning");
    expect(created.deletedAt).toBeNull();

    const list = await repo.list({ userId: userA });
    expect(list.map((t) => t.id)).toContain(created.id);
  });

  it("isolates trips between users — user B cannot see or fetch user A's trip", async () => {
    const created = await repo.create({
      userId: userA,
      input: { name: "טיול פרטי של א", startDate: "2026-06-01", endDate: "2026-06-10" },
    });

    const userBList = await repo.list({ userId: userB });
    expect(userBList.map((t) => t.id)).not.toContain(created.id);

    const fetchedByB = await repo.getById({ userId: userB, tripId: created.id });
    expect(fetchedByB).toBeNull();
  });

  it("prevents user B from updating user A's trip", async () => {
    const created = await repo.create({
      userId: userA,
      input: { name: "טיול פרטי", startDate: "2026-06-01", endDate: "2026-06-10" },
    });

    await expect(
      repo.update({ userId: userB, tripId: created.id, input: { name: "נגנב" } }),
    ).rejects.toThrow(TripNotFoundError);
  });

  it("extends and shortens a trip's dates via update", async () => {
    const created = await repo.create({
      userId: userA,
      input: { name: "טיול לשינוי תאריכים", startDate: "2026-06-01", endDate: "2026-06-10" },
    });

    const extended = await repo.update({
      userId: userA,
      tripId: created.id,
      input: { endDate: "2026-06-20" },
    });
    expect(extended.endDate).toBe("2026-06-20");

    const shortened = await repo.update({
      userId: userA,
      tripId: created.id,
      input: { endDate: "2026-06-05" },
    });
    expect(shortened.endDate).toBe("2026-06-05");
  });

  it("soft-deletes a trip: hidden from default list, still fetchable with includeDeleted, restorable", async () => {
    const created = await repo.create({
      userId: userA,
      input: { name: "טיול למחיקה", startDate: "2026-06-01", endDate: "2026-06-10" },
    });

    const deleted = await repo.softDelete({ userId: userA, tripId: created.id });
    expect(deleted.deletedAt).not.toBeNull();

    const defaultList = await repo.list({ userId: userA });
    expect(defaultList.map((t) => t.id)).not.toContain(created.id);

    const includingDeleted = await repo.list({ userId: userA, includeDeleted: true });
    expect(includingDeleted.map((t) => t.id)).toContain(created.id);

    const restored = await repo.restore({ userId: userA, tripId: created.id });
    expect(restored.deletedAt).toBeNull();

    const listAfterRestore = await repo.list({ userId: userA });
    expect(listAfterRestore.map((t) => t.id)).toContain(created.id);
  });

  it("leaves budget fields null by default and sets them via create/update", async () => {
    const created = await repo.create({
      userId: userA,
      input: { name: "טיול עם תקציב", startDate: "2026-06-01", endDate: "2026-06-10" },
    });
    expect(created.totalBudgetAmount).toBeNull();
    expect(created.dailyBudgetAmount).toBeNull();

    const withBudget = await repo.update({
      userId: userA,
      tripId: created.id,
      input: { totalBudgetAmount: 10000, dailyBudgetAmount: 700 },
    });
    expect(withBudget.totalBudgetAmount).toBe(10000);
    expect(withBudget.dailyBudgetAmount).toBe(700);

    const clearedTotal = await repo.update({
      userId: userA,
      tripId: created.id,
      input: { totalBudgetAmount: null },
    });
    expect(clearedTotal.totalBudgetAmount).toBeNull();
    expect(clearedTotal.dailyBudgetAmount).toBe(700);
  });

  it("rejects creating a trip with end date before start date", async () => {
    await expect(
      repo.create({
        userId: userA,
        input: { name: "תאריכים הפוכים", startDate: "2026-06-10", endDate: "2026-06-01" },
      }),
    ).rejects.toThrow();
  });

  it("getByIdForShareView returns the trip without a userId — for the public share page only", async () => {
    const created = await repo.create({
      userId: userA,
      input: { name: "טיול לשיתוף", startDate: "2026-06-01", endDate: "2026-06-10" },
    });

    const found = await repo.getByIdForShareView({ tripId: created.id });
    expect(found?.id).toBe(created.id);
    expect(await repo.getByIdForShareView({ tripId: "does-not-exist" })).toBeNull();
  });
});
