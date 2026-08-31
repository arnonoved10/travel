import { beforeEach, describe, expect, it } from "vitest";
import { MockPushSubscriptionRepository } from "./push-subscription-repository.mock";

const userA = "88888888-8888-4888-8888-888888888888";
const userB = "99999999-9999-4999-8999-999999999999";

describe("MockPushSubscriptionRepository", () => {
  let repo: MockPushSubscriptionRepository;

  beforeEach(() => {
    repo = new MockPushSubscriptionRepository();
  });

  it("creates a subscription and returns it in that user's list", async () => {
    const created = await repo.upsert({
      userId: userA,
      input: { endpoint: "https://push.example.com/a", p256dh: "key1", auth: "auth1" },
    });
    const list = await repo.listForUser({ userId: userA });
    expect(list.map((s) => s.id)).toContain(created.id);
  });

  it("upserting the same endpoint again updates it in place rather than duplicating", async () => {
    const first = await repo.upsert({
      userId: userA,
      input: { endpoint: "https://push.example.com/a", p256dh: "key1", auth: "auth1" },
    });
    const second = await repo.upsert({
      userId: userA,
      input: { endpoint: "https://push.example.com/a", p256dh: "key2", auth: "auth2" },
    });

    expect(second.id).toBe(first.id);
    const list = await repo.listForUser({ userId: userA });
    expect(list).toHaveLength(1);
    expect(list[0]!.p256dh).toBe("key2");
  });

  it("isolates subscriptions between users", async () => {
    const created = await repo.upsert({
      userId: userA,
      input: { endpoint: "https://push.example.com/a", p256dh: "key1", auth: "auth1" },
    });

    const userBList = await repo.listForUser({ userId: userB });
    expect(userBList.map((s) => s.id)).not.toContain(created.id);
  });

  it("deletes a subscription by endpoint", async () => {
    await repo.upsert({ userId: userA, input: { endpoint: "https://push.example.com/a", p256dh: "key1", auth: "auth1" } });
    await repo.deleteByEndpoint({ endpoint: "https://push.example.com/a" });

    const list = await repo.listForUser({ userId: userA });
    expect(list).toHaveLength(0);
  });

  it("deleting a non-existent endpoint does not throw", async () => {
    await expect(repo.deleteByEndpoint({ endpoint: "https://push.example.com/does-not-exist" })).resolves.toBeUndefined();
  });
});
