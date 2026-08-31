import { beforeEach, describe, expect, it } from "vitest";
import { MockLoyaltyProgramRepository } from "./loyalty-program-repository.mock";
import { LoyaltyProgramNotFoundError } from "./loyalty-program-repository";

const userA = "88888888-8888-4888-8888-888888888888";
const userB = "99999999-9999-4999-8999-999999999999";

describe("MockLoyaltyProgramRepository", () => {
  let repo: MockLoyaltyProgramRepository;

  beforeEach(() => {
    repo = new MockLoyaltyProgramRepository();
  });

  it("creates a loyalty program and returns it in that user's list", async () => {
    const created = await repo.create({ userId: userA, input: { programName: "מרג'ד בונבוי", programType: "hotel" } });
    const list = await repo.list({ userId: userA });
    expect(list.map((p) => p.id)).toContain(created.id);
  });

  it("isolates loyalty programs between users", async () => {
    const created = await repo.create({ userId: userA, input: { programName: "פרטי" } });

    const userBList = await repo.list({ userId: userB });
    expect(userBList.map((p) => p.id)).not.toContain(created.id);
    expect(await repo.getById({ userId: userB, loyaltyProgramId: created.id })).toBeNull();
  });

  it("soft-deletes a loyalty program and hides it from the default list", async () => {
    const created = await repo.create({ userId: userA, input: { programName: "למחיקה" } });
    await repo.softDelete({ userId: userA, loyaltyProgramId: created.id });

    const list = await repo.list({ userId: userA });
    expect(list.map((p) => p.id)).not.toContain(created.id);
  });

  it("throws when a different user tries to delete a loyalty program", async () => {
    const created = await repo.create({ userId: userA, input: { programName: "מוגן" } });
    await expect(repo.softDelete({ userId: userB, loyaltyProgramId: created.id })).rejects.toThrow(LoyaltyProgramNotFoundError);
  });

  it("restores a soft-deleted loyalty program", async () => {
    const created = await repo.create({ userId: userA, input: { programName: "לשחזור" } });
    await repo.softDelete({ userId: userA, loyaltyProgramId: created.id });

    const restored = await repo.restore({ userId: userA, loyaltyProgramId: created.id });
    expect(restored.deletedAt).toBeNull();

    const list = await repo.list({ userId: userA });
    expect(list.map((p) => p.id)).toContain(created.id);
  });
});
