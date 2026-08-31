import { beforeEach, describe, expect, it } from "vitest";
import { MockAuditLogRepository } from "./audit-log-repository.mock";

const tripId = "11111111-2222-4333-8444-555555555555";
const otherTripId = "99999999-8888-4777-8666-555555555555";
const userId = "aaaaaaaa-bbbb-4ccc-8ddd-eeeeeeeeeeee";

describe("MockAuditLogRepository", () => {
  let repo: MockAuditLogRepository;

  beforeEach(() => {
    repo = new MockAuditLogRepository();
  });

  it("records a field-level change with an update action", async () => {
    const entry = await repo.record({
      input: { userId, entityType: "trip", entityId: tripId, fieldName: "name", oldValue: "טיול ישן", newValue: "טיול חדש", action: "update" },
    });

    expect(entry.id).toBeTruthy();
    expect(entry.fieldName).toBe("name");
    expect(entry.oldValue).toBe("טיול ישן");
    expect(entry.newValue).toBe("טיול חדש");
    expect(entry.action).toBe("update");
  });

  it("lists entries for the requested entity refs, sorted newest first", async () => {
    const first = await repo.record({
      input: { entityType: "trip", entityId: tripId, fieldName: "name", newValue: "א", action: "update" },
    });
    await new Promise((resolve) => setTimeout(resolve, 2));
    const second = await repo.record({
      input: { entityType: "trip", entityId: tripId, fieldName: "status", newValue: "active", action: "status_change" },
    });

    const list = await repo.listForEntities({ refs: [{ entityType: "trip", entityId: tripId }] });
    expect(list.map((e) => e.id)).toEqual([second.id, first.id]);
  });

  it("merges entries across multiple entity refs (e.g. a trip and its planned activities)", async () => {
    await repo.record({ input: { entityType: "trip", entityId: tripId, fieldName: "name", newValue: "א", action: "update" } });
    await repo.record({
      input: { entityType: "planned_activity", entityId: "22222222-3333-4444-8555-666666666666", fieldName: "status", newValue: "booked", action: "status_change" },
    });

    const list = await repo.listForEntities({
      refs: [
        { entityType: "trip", entityId: tripId },
        { entityType: "planned_activity", entityId: "22222222-3333-4444-8555-666666666666" },
      ],
    });
    expect(list).toHaveLength(2);
  });

  it("does not include entries for a different trip", async () => {
    await repo.record({ input: { entityType: "trip", entityId: otherTripId, fieldName: "name", newValue: "אחר", action: "update" } });

    const list = await repo.listForEntities({ refs: [{ entityType: "trip", entityId: tripId }] });
    expect(list).toHaveLength(0);
  });

  it("rejects a record without an entityId", async () => {
    await expect(
      repo.record({ input: { entityType: "trip", entityId: "not-a-uuid", fieldName: "name", action: "update" } }),
    ).rejects.toThrow();
  });
});
