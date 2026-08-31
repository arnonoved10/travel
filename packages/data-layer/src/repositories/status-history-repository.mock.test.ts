import { beforeEach, describe, expect, it } from "vitest";
import { MockStatusHistoryRepository } from "./status-history-repository.mock";

const userId = "88888888-8888-4888-8888-888888888888";
const activityId = "77777777-7777-4777-8777-777777777777";
const otherActivityId = "66666666-6666-4666-8666-666666666666";

describe("MockStatusHistoryRepository", () => {
  let repo: MockStatusHistoryRepository;

  beforeEach(() => {
    repo = new MockStatusHistoryRepository();
  });

  it("records a status transition and returns it for that entity", async () => {
    await repo.record({
      input: { userId, entityType: "planned_activity", entityId: activityId, oldStatus: "want_to_book", newStatus: "booked" },
    });

    const list = await repo.listForEntities({ refs: [{ entityType: "planned_activity", entityId: activityId }] });
    expect(list).toHaveLength(1);
    expect(list[0]).toMatchObject({ oldStatus: "want_to_book", newStatus: "booked" });
  });

  it("returns transitions in chronological order (oldest first)", async () => {
    const wait = () => new Promise((resolve) => setTimeout(resolve, 2));

    await repo.record({ input: { userId, entityType: "planned_activity", entityId: activityId, newStatus: "want_to_book" } });
    await wait();
    await repo.record({
      input: { userId, entityType: "planned_activity", entityId: activityId, oldStatus: "want_to_book", newStatus: "planned" },
    });
    await wait();
    await repo.record({
      input: { userId, entityType: "planned_activity", entityId: activityId, oldStatus: "planned", newStatus: "booked" },
    });

    const list = await repo.listForEntities({ refs: [{ entityType: "planned_activity", entityId: activityId }] });
    expect(list.map((e) => e.newStatus)).toEqual(["want_to_book", "planned", "booked"]);
  });

  it("isolates entries between different entities", async () => {
    await repo.record({ input: { userId, entityType: "planned_activity", entityId: activityId, newStatus: "booked" } });
    await repo.record({ input: { userId, entityType: "planned_activity", entityId: otherActivityId, newStatus: "want_to_book" } });

    const list = await repo.listForEntities({ refs: [{ entityType: "planned_activity", entityId: activityId }] });
    expect(list).toHaveLength(1);
    expect(list[0]?.entityId).toBe(activityId);
  });
});
