import { beforeEach, describe, expect, it } from "vitest";
import { MockPlannedActivityRepository } from "./planned-activity-repository.mock";
import { PlannedActivityNotFoundError } from "./planned-activity-repository";

const tripId = "55555555-5555-4555-8555-555555555555";

describe("MockPlannedActivityRepository", () => {
  let repo: MockPlannedActivityRepository;

  beforeEach(() => {
    repo = new MockPlannedActivityRepository();
  });

  it("creates a planned activity with default status want_to_book", async () => {
    const activity = await repo.create({
      input: { tripId, name: "צלילה באי קוה טאו" },
    });

    expect(activity.id).toBeTruthy();
    expect(activity.status).toBe("want_to_book");
    expect(activity.deletedAt).toBeNull();

    const list = await repo.listForTrip({ tripId });
    expect(list.map((a) => a.id)).toContain(activity.id);
  });

  it("stores estimated price/currency/duration and planned datetime", async () => {
    const activity = await repo.create({
      input: {
        tripId,
        name: "טרק בהרים",
        activityType: "attraction",
        plannedAt: "2026-12-05T08:00:00.000Z",
        estimatedDurationMinutes: 240,
        estimatedPrice: 500,
        estimatedCurrencyCode: "THB",
      },
    });

    expect(activity.plannedAt).toBe("2026-12-05T08:00:00.000Z");
    expect(activity.estimatedDurationMinutes).toBe(240);
    expect(activity.estimatedPrice).toBe(500);
    expect(activity.estimatedCurrencyCode).toBe("THB");
  });

  it("does not list activities from another trip", async () => {
    await repo.create({ input: { tripId, name: "פעילות בטיול הזה" } });
    const otherTripList = await repo.listForTrip({ tripId: "66666666-6666-4666-8666-666666666666" });
    expect(otherTripList).toHaveLength(0);
  });

  it("updates status, e.g. from want_to_book to booked", async () => {
    const activity = await repo.create({ input: { tripId, name: "סיור מודרך" } });
    const updated = await repo.updateStatus({ input: { plannedActivityId: activity.id, status: "booked" } });

    expect(updated.status).toBe("booked");
    const list = await repo.listForTrip({ tripId });
    expect(list.find((a) => a.id === activity.id)?.status).toBe("booked");
  });

  it("throws when updating status of a non-existent activity", async () => {
    await expect(
      repo.updateStatus({ input: { plannedActivityId: "00000000-0000-4000-8000-000000009999", status: "done" } }),
    ).rejects.toThrow(PlannedActivityNotFoundError);
  });

  it("soft-deletes an activity: hidden by default, still fetchable with includeDeleted", async () => {
    const activity = await repo.create({ input: { tripId, name: "פעילות למחיקה" } });
    const deleted = await repo.softDelete({ plannedActivityId: activity.id });

    expect(deleted.deletedAt).not.toBeNull();
    const visibleList = await repo.listForTrip({ tripId });
    expect(visibleList.map((a) => a.id)).not.toContain(activity.id);

    const fullList = await repo.listForTrip({ tripId, includeDeleted: true });
    expect(fullList.map((a) => a.id)).toContain(activity.id);
  });

  it("restores a soft-deleted activity — visible again in the default list", async () => {
    const activity = await repo.create({ input: { tripId, name: "פעילות לשחזור" } });
    await repo.softDelete({ plannedActivityId: activity.id });

    const restored = await repo.restore({ plannedActivityId: activity.id });
    expect(restored.deletedAt).toBeNull();

    const visibleList = await repo.listForTrip({ tripId });
    expect(visibleList.map((a) => a.id)).toContain(activity.id);
  });

  it("rejects an empty name", async () => {
    await expect(repo.create({ input: { tripId, name: "" } })).rejects.toThrow();
  });

  it("fetches an activity by id, and returns null for a missing one", async () => {
    const activity = await repo.create({ input: { tripId, name: "לבדיקת getById" } });
    expect((await repo.getById({ plannedActivityId: activity.id }))?.id).toBe(activity.id);
    expect(await repo.getById({ plannedActivityId: "00000000-0000-4000-8000-000000009999" })).toBeNull();
  });

  it("links an activity to a real booking and marks it booked", async () => {
    const activity = await repo.create({ input: { tripId, name: "להמרה להזמנה" } });
    const bookingId = "77777777-7777-4777-8777-777777777777";
    const linked = await repo.linkToBooking({ plannedActivityId: activity.id, bookingId });

    expect(linked.bookingId).toBe(bookingId);
    expect(linked.status).toBe("booked");
    expect((await repo.getById({ plannedActivityId: activity.id }))?.bookingId).toBe(bookingId);
  });

  it("throws when linking a non-existent activity to a booking", async () => {
    await expect(
      repo.linkToBooking({ plannedActivityId: "00000000-0000-4000-8000-000000009999", bookingId: "irrelevant" }),
    ).rejects.toThrow(PlannedActivityNotFoundError);
  });

  it("sets and clears a personal rating", async () => {
    const activity = await repo.create({ input: { tripId, name: "לדירוג אחרי הביצוע" } });
    expect(activity.personalRating).toBeNull();

    const rated = await repo.updatePersonalRating({ input: { plannedActivityId: activity.id, personalRating: 5 } });
    expect(rated.personalRating).toBe(5);

    const cleared = await repo.updatePersonalRating({ input: { plannedActivityId: activity.id, personalRating: null } });
    expect(cleared.personalRating).toBeNull();
  });

  it("throws when setting a personal rating on a non-existent activity", async () => {
    await expect(
      repo.updatePersonalRating({ input: { plannedActivityId: "00000000-0000-4000-8000-000000009999", personalRating: 3 } }),
    ).rejects.toThrow(PlannedActivityNotFoundError);
  });
});
