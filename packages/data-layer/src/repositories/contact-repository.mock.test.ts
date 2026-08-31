import { beforeEach, describe, expect, it } from "vitest";
import { MockContactRepository } from "./contact-repository.mock";
import { ContactNotFoundError } from "./contact-repository";

const userA = "88888888-8888-4888-8888-888888888888";
const userB = "99999999-9999-4999-8999-999999999999";

describe("MockContactRepository", () => {
  let repo: MockContactRepository;

  beforeEach(() => {
    repo = new MockContactRepository();
  });

  it("creates a contact and returns it in that user's list", async () => {
    const created = await repo.create({ userId: userA, input: { name: "נהג בדיקה", category: "driver" } });
    const list = await repo.list({ userId: userA });
    expect(list.map((c) => c.id)).toContain(created.id);
  });

  it("isolates contacts between users", async () => {
    const created = await repo.create({ userId: userA, input: { name: "איש קשר פרטי", category: "guide" } });

    const userBList = await repo.list({ userId: userB });
    expect(userBList.map((c) => c.id)).not.toContain(created.id);
    expect(await repo.getById({ userId: userB, contactId: created.id })).toBeNull();
  });

  it("soft-deletes a contact and hides it from the default list", async () => {
    const created = await repo.create({ userId: userA, input: { name: "למחיקה", category: "other" } });
    await repo.softDelete({ userId: userA, contactId: created.id });

    const list = await repo.list({ userId: userA });
    expect(list.map((c) => c.id)).not.toContain(created.id);
  });

  it("throws when a different user tries to delete a contact", async () => {
    const created = await repo.create({ userId: userA, input: { name: "מוגן", category: "agent" } });
    await expect(repo.softDelete({ userId: userB, contactId: created.id })).rejects.toThrow(ContactNotFoundError);
  });
});
