import { rmSync } from "node:fs";
import path from "node:path";
import { beforeEach, describe, expect, it } from "vitest";
import { MockSharedInboxRepository } from "./shared-inbox-repository.mock";
import { SharedInboxItemNotFoundError } from "./shared-inbox-repository";

const userA = "88888888-8888-4888-8888-888888888888";
const userB = "99999999-9999-4999-8999-999999999999";

// שלא כמו שאר ה-Mock Repositories, זה נשען על קובץ-דיסק משותף (ר' ההערה
// ב-shared-inbox-repository.mock.ts) ולא Map-בזיכרון-פר-instance — צריך לנקות
// אותו במפורש בין טסטים כדי לשמר בידוד, כי `new MockSharedInboxRepository()`
// כשלעצמו כבר לא מאפס state.
describe("MockSharedInboxRepository", () => {
  let repo: MockSharedInboxRepository;

  beforeEach(() => {
    rmSync(path.join(process.cwd(), ".shared-inbox-cache"), { recursive: true, force: true });
    repo = new MockSharedInboxRepository();
  });

  it("creates an item with a file and returns it in that user's pending list", async () => {
    const created = await repo.create({
      userId: userA,
      input: { fileUrl: "data:image/png;base64,AAAA", fileName: "confirmation.png", mimeType: "image/png" },
    });
    const list = await repo.listPending({ userId: userA });
    expect(list.map((i) => i.id)).toContain(created.id);
    expect(created.fileUrl).toBe("data:image/png;base64,AAAA");
  });

  it("creates a text-only item (no file) with fileUrl null", async () => {
    const created = await repo.create({ userId: userA, input: { sharedTitle: "אישור הזמנה", sharedUrl: "https://example.com" } });
    expect(created.fileUrl).toBeNull();
    expect(created.sharedTitle).toBe("אישור הזמנה");
  });

  it("isolates items between users", async () => {
    const created = await repo.create({ userId: userA, input: { fileUrl: "data:image/png;base64,AAAA" } });

    const userBList = await repo.listPending({ userId: userB });
    expect(userBList.map((i) => i.id)).not.toContain(created.id);
    expect(await repo.getById({ userId: userB, itemId: created.id })).toBeNull();
  });

  it("deletes an item permanently (no soft-delete)", async () => {
    const created = await repo.create({ userId: userA, input: { fileUrl: "data:image/png;base64,AAAA" } });
    await repo.delete({ userId: userA, itemId: created.id });

    const list = await repo.listPending({ userId: userA });
    expect(list.map((i) => i.id)).not.toContain(created.id);
    expect(await repo.getById({ userId: userA, itemId: created.id })).toBeNull();
  });

  it("throws when a different user tries to delete an item", async () => {
    const created = await repo.create({ userId: userA, input: { fileUrl: "data:image/png;base64,AAAA" } });
    await expect(repo.delete({ userId: userB, itemId: created.id })).rejects.toThrow(SharedInboxItemNotFoundError);
  });
});
