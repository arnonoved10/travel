import { beforeEach, describe, expect, it } from "vitest";
import { MockRouteRepository } from "./route-repository.mock";
import { RouteStopNotFoundError } from "./route-repository";

const tripId = "77777777-7777-4777-8777-777777777777";
const placeIdA = "88888888-8888-4888-8888-888888888888";
const placeIdB = "99999999-9999-4999-8999-999999999999";
const placeIdC = "aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa";
const date = "2026-12-05";

describe("MockRouteRepository", () => {
  let repo: MockRouteRepository;

  beforeEach(() => {
    repo = new MockRouteRepository();
  });

  it("adds a stop with orderIndex 0 as the first stop of the day", async () => {
    const stop = await repo.addStop({ input: { tripId, date, placeId: placeIdA } });
    expect(stop.orderIndex).toBe(0);

    const list = await repo.listForDay({ tripId, date });
    expect(list.map((s) => s.id)).toEqual([stop.id]);
  });

  it("appends subsequent stops with incrementing orderIndex, sorted by order", async () => {
    const first = await repo.addStop({ input: { tripId, date, placeId: placeIdA } });
    const second = await repo.addStop({ input: { tripId, date, placeId: placeIdB } });
    const third = await repo.addStop({ input: { tripId, date, placeId: placeIdC } });

    const list = await repo.listForDay({ tripId, date });
    expect(list.map((s) => s.id)).toEqual([first.id, second.id, third.id]);
    expect(list.map((s) => s.orderIndex)).toEqual([0, 1, 2]);
  });

  it("does not mix stops from different days or different trips", async () => {
    await repo.addStop({ input: { tripId, date, placeId: placeIdA } });
    await repo.addStop({ input: { tripId, date: "2026-12-06", placeId: placeIdB } });
    await repo.addStop({ input: { tripId: "66666666-6666-4666-8666-666666666666", date, placeId: placeIdC } });

    const list = await repo.listForDay({ tripId, date });
    expect(list).toHaveLength(1);
    expect(list[0]?.placeId).toBe(placeIdA);
  });

  it("moves a stop up, swapping order with the previous stop", async () => {
    const first = await repo.addStop({ input: { tripId, date, placeId: placeIdA } });
    const second = await repo.addStop({ input: { tripId, date, placeId: placeIdB } });

    const afterMove = await repo.moveStop({ routeStopId: second.id, direction: "up" });
    expect(afterMove.map((s) => s.id)).toEqual([second.id, first.id]);
  });

  it("does nothing when moving the first stop up (no-op, does not throw)", async () => {
    const first = await repo.addStop({ input: { tripId, date, placeId: placeIdA } });
    const second = await repo.addStop({ input: { tripId, date, placeId: placeIdB } });

    const afterMove = await repo.moveStop({ routeStopId: first.id, direction: "up" });
    expect(afterMove.map((s) => s.id)).toEqual([first.id, second.id]);
  });

  it("removes a stop", async () => {
    const stop = await repo.addStop({ input: { tripId, date, placeId: placeIdA } });
    await repo.removeStop({ routeStopId: stop.id });

    const list = await repo.listForDay({ tripId, date });
    expect(list).toHaveLength(0);
  });

  it("throws when moving or removing a non-existent stop", async () => {
    await expect(repo.moveStop({ routeStopId: "00000000-0000-4000-8000-000000009999", direction: "up" })).rejects.toThrow(
      RouteStopNotFoundError,
    );
    await expect(repo.removeStop({ routeStopId: "00000000-0000-4000-8000-000000009999" })).rejects.toThrow(RouteStopNotFoundError);
  });

  it("rejects a stop without a placeId", async () => {
    await expect(repo.addStop({ input: { tripId, date, placeId: "" } })).rejects.toThrow();
  });

  it("reorderStops sets orderIndex by array position and writes distance/time when provided", async () => {
    const first = await repo.addStop({ input: { tripId, date, placeId: placeIdA } });
    const second = await repo.addStop({ input: { tripId, date, placeId: placeIdB } });
    const third = await repo.addStop({ input: { tripId, date, placeId: placeIdC } });

    const result = await repo.reorderStops({
      tripId,
      date,
      stops: [
        { routeStopId: third.id, distanceKm: 5, travelTimeMinutes: 12 },
        { routeStopId: first.id },
        { routeStopId: second.id, distanceKm: 3.5, travelTimeMinutes: 9 },
      ],
    });

    expect(result.map((s) => s.id)).toEqual([third.id, first.id, second.id]);
    expect(result.map((s) => s.orderIndex)).toEqual([0, 1, 2]);
    expect(result.find((s) => s.id === third.id)?.distanceKm).toBe(5);
    expect(result.find((s) => s.id === second.id)?.travelTimeMinutes).toBe(9);
    // הפריט שלא קיבל distanceKm/travelTimeMinutes נשאר כפי שהיה (null), לא נדרס.
    expect(result.find((s) => s.id === first.id)?.distanceKm).toBeNull();
  });

  it("reorderStops throws when a routeStopId doesn't exist", async () => {
    const first = await repo.addStop({ input: { tripId, date, placeId: placeIdA } });

    await expect(
      repo.reorderStops({ tripId, date, stops: [{ routeStopId: first.id }, { routeStopId: "00000000-0000-4000-8000-000000009999" }] }),
    ).rejects.toThrow(RouteStopNotFoundError);
  });
});
