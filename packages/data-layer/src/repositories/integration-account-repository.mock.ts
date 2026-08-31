import { randomUUID } from "node:crypto";
import type { CreateIntegrationAccountInput, IntegrationAccount } from "@travel-app/shared-types";
import { createIntegrationAccountInputSchema } from "@travel-app/shared-types";
import { IntegrationAccountNotFoundError, type IntegrationAccountRepository } from "./integration-account-repository";

const DEMO_USER_ID = "00000000-0000-4000-8000-000000000001";

export class MockIntegrationAccountRepository implements IntegrationAccountRepository {
  private accounts = new Map<string, IntegrationAccount>();

  constructor() {
    this.seed();
  }

  private seed(): void {
    const seedAccounts: Array<Omit<IntegrationAccount, "id">> = [
      {
        userId: DEMO_USER_ID,
        serviceName: "booking_com",
        integrationType: "manual_link",
        appLink: null,
        websiteLink: "https://www.booking.com",
        accountLink: null,
        bookingsLink: null,
        emailOrUsername: "demo@example.com",
        oauthProvider: null,
        oauthSecretRef: null,
        oauthScope: null,
        oauthConnectedAt: null,
        oauthExpiresAt: null,
        notes: "נתוני דמה לצורך פיתוח UI בלבד.",
        deletedAt: null,
      },
    ];
    for (const account of seedAccounts) {
      const id = randomUUID();
      this.accounts.set(id, { ...account, id });
    }
  }

  async list({ userId, includeDeleted = false }: { userId: string; includeDeleted?: boolean }): Promise<IntegrationAccount[]> {
    return Array.from(this.accounts.values())
      .filter((a) => a.userId === userId)
      .filter((a) => includeDeleted || a.deletedAt === null);
  }

  async getById({ userId, integrationAccountId }: { userId: string; integrationAccountId: string }): Promise<IntegrationAccount | null> {
    const account = this.accounts.get(integrationAccountId);
    if (!account || account.userId !== userId) return null;
    return account;
  }

  async create({ userId, input }: { userId: string; input: CreateIntegrationAccountInput }): Promise<IntegrationAccount> {
    const parsed = createIntegrationAccountInputSchema.parse(input);
    const account: IntegrationAccount = {
      id: randomUUID(),
      userId,
      serviceName: parsed.serviceName,
      integrationType: "manual_link",
      appLink: parsed.appLink ?? null,
      websiteLink: parsed.websiteLink ?? null,
      accountLink: parsed.accountLink ?? null,
      bookingsLink: parsed.bookingsLink ?? null,
      emailOrUsername: parsed.emailOrUsername ?? null,
      oauthProvider: null,
      oauthSecretRef: null,
      oauthScope: null,
      oauthConnectedAt: null,
      oauthExpiresAt: null,
      notes: parsed.notes ?? null,
      deletedAt: null,
    };
    this.accounts.set(account.id, account);
    return account;
  }

  async softDelete({ userId, integrationAccountId }: { userId: string; integrationAccountId: string }): Promise<IntegrationAccount> {
    const existing = await this.getById({ userId, integrationAccountId });
    if (!existing) throw new IntegrationAccountNotFoundError(integrationAccountId);

    const updated: IntegrationAccount = { ...existing, deletedAt: new Date().toISOString() };
    this.accounts.set(integrationAccountId, updated);
    return updated;
  }

  async restore({ userId, integrationAccountId }: { userId: string; integrationAccountId: string }): Promise<IntegrationAccount> {
    const existing = await this.getById({ userId, integrationAccountId });
    if (!existing) throw new IntegrationAccountNotFoundError(integrationAccountId);

    const updated: IntegrationAccount = { ...existing, deletedAt: null };
    this.accounts.set(integrationAccountId, updated);
    return updated;
  }
}

export const mockIntegrationAccountRepository = new MockIntegrationAccountRepository();
