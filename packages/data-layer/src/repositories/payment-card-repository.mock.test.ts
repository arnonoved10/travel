import { beforeEach, describe, expect, it } from "vitest";
import { MockPaymentCardRepository } from "./payment-card-repository.mock";

const userA = "88888888-8888-4888-8888-888888888888";
const userB = "99999999-9999-4999-8999-999999999999";

describe("MockPaymentCardRepository", () => {
  let repo: MockPaymentCardRepository;

  beforeEach(() => {
    repo = new MockPaymentCardRepository();
  });

  it("creates a card and returns it in that user's list", async () => {
    const created = await repo.create({ userId: userA, input: { cardName: "ויזה כחולה", defaultCurrencyCode: "USD" } });
    const list = await repo.list({ userId: userA });
    expect(list.map((c) => c.id)).toContain(created.id);
    expect(created.defaultCurrencyCode).toBe("USD");
  });

  it("defaults defaultCurrencyCode to null when not provided", async () => {
    const created = await repo.create({ userId: userA, input: { cardName: "מאסטרקארד" } });
    expect(created.defaultCurrencyCode).toBeNull();
  });

  it("isolates cards between users", async () => {
    const created = await repo.create({ userId: userA, input: { cardName: "כרטיס פרטי" } });

    const userBList = await repo.list({ userId: userB });
    expect(userBList.map((c) => c.id)).not.toContain(created.id);
  });
});
