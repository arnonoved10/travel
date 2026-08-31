import { beforeEach, describe, expect, it } from "vitest";
import { MockIntegrationAccountRepository } from "./integration-account-repository.mock";
import { IntegrationAccountNotFoundError } from "./integration-account-repository";

const userA = "88888888-8888-4888-8888-888888888888";
const userB = "99999999-9999-4999-8999-999999999999";

describe("MockIntegrationAccountRepository", () => {
  let repo: MockIntegrationAccountRepository;

  beforeEach(() => {
    repo = new MockIntegrationAccountRepository();
  });

  it("creates an integration account (always manual_link) and returns it in that user's list", async () => {
    const created = await repo.create({ userId: userA, input: { serviceName: "agoda", emailOrUsername: "me@example.com" } });
    expect(created.integrationType).toBe("manual_link");
    const list = await repo.list({ userId: userA });
    expect(list.map((a) => a.id)).toContain(created.id);
  });

  it("isolates integration accounts between users", async () => {
    const created = await repo.create({ userId: userA, input: { serviceName: "bolt" } });

    const userBList = await repo.list({ userId: userB });
    expect(userBList.map((a) => a.id)).not.toContain(created.id);
    expect(await repo.getById({ userId: userB, integrationAccountId: created.id })).toBeNull();
  });

  it("soft-deletes an integration account and hides it from the default list", async () => {
    const created = await repo.create({ userId: userA, input: { serviceName: "expedia" } });
    await repo.softDelete({ userId: userA, integrationAccountId: created.id });

    const list = await repo.list({ userId: userA });
    expect(list.map((a) => a.id)).not.toContain(created.id);
  });

  it("throws when a different user tries to delete an integration account", async () => {
    const created = await repo.create({ userId: userA, input: { serviceName: "hotels_com" } });
    await expect(repo.softDelete({ userId: userB, integrationAccountId: created.id })).rejects.toThrow(IntegrationAccountNotFoundError);
  });

  it("restores a soft-deleted integration account", async () => {
    const created = await repo.create({ userId: userA, input: { serviceName: "grab" } });
    await repo.softDelete({ userId: userA, integrationAccountId: created.id });

    const restored = await repo.restore({ userId: userA, integrationAccountId: created.id });
    expect(restored.deletedAt).toBeNull();

    const list = await repo.list({ userId: userA });
    expect(list.map((a) => a.id)).toContain(created.id);
  });
});
