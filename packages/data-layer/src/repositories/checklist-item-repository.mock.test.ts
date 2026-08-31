import { beforeEach, describe, expect, it } from "vitest";
import { MockChecklistItemRepository } from "./checklist-item-repository.mock";
import { ChecklistItemNotFoundError } from "./checklist-item-repository";

const tripId = "66666666-6666-4666-8666-666666666666";

describe("MockChecklistItemRepository", () => {
  let repo: MockChecklistItemRepository;

  beforeEach(() => {
    repo = new MockChecklistItemRepository();
  });

  it("creates an item and lists it for the correct trip and list type", async () => {
    const created = await repo.create({ input: { tripId, listType: "packing", name: "נעלי הליכה", category: "בגדים", quantity: 1 } });
    expect(created.isDone).toBe(false);

    const list = await repo.listForTrip({ tripId, listType: "packing" });
    expect(list.map((i) => i.id)).toContain(created.id);
  });

  it("keeps packing and before_trip lists separate for the same trip", async () => {
    await repo.create({ input: { tripId, listType: "packing", name: "מטריה" } });
    await repo.create({ input: { tripId, listType: "before_trip", name: "לבטל מנוי" } });

    const packing = await repo.listForTrip({ tripId, listType: "packing" });
    const beforeTrip = await repo.listForTrip({ tripId, listType: "before_trip" });
    expect(packing.map((i) => i.name)).toContain("מטריה");
    expect(packing.map((i) => i.name)).not.toContain("לבטל מנוי");
    expect(beforeTrip.map((i) => i.name)).toContain("לבטל מנוי");
  });

  it("toggles isDone on and off", async () => {
    const created = await repo.create({ input: { tripId, listType: "packing", name: "משקפי שמש" } });
    const toggled = await repo.toggleDone({ itemId: created.id });
    expect(toggled.isDone).toBe(true);

    const toggledBack = await repo.toggleDone({ itemId: created.id });
    expect(toggledBack.isDone).toBe(false);
  });

  it("throws when toggling a non-existent item", async () => {
    await expect(repo.toggleDone({ itemId: "00000000-0000-4000-8000-000000009999" })).rejects.toThrow(ChecklistItemNotFoundError);
  });

  it("soft-deletes an item: hidden from the list afterwards", async () => {
    const created = await repo.create({ input: { tripId, listType: "packing", name: "כובע" } });
    const deleted = await repo.softDelete({ itemId: created.id });
    expect(deleted.deletedAt).not.toBeNull();

    const list = await repo.listForTrip({ tripId, listType: "packing" });
    expect(list.map((i) => i.id)).not.toContain(created.id);
  });

  it("assigns increasing orderIndex per list, scoped to trip+listType", async () => {
    const first = await repo.create({ input: { tripId, listType: "packing", name: "פריט 1" } });
    const second = await repo.create({ input: { tripId, listType: "packing", name: "פריט 2" } });
    expect(second.orderIndex).toBeGreaterThan(first.orderIndex);
  });
});
