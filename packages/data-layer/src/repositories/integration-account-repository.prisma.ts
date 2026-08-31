// PENDING_INTEGRATION — ראה ההערה המקבילה ב-trip-repository.prisma.ts.
import { PrismaClient } from "@travel-app/db";
import type { CreateIntegrationAccountInput, IntegrationAccount } from "@travel-app/shared-types";
import { createIntegrationAccountInputSchema } from "@travel-app/shared-types";
import { IntegrationAccountNotFoundError, type IntegrationAccountRepository } from "./integration-account-repository";

function toIntegrationAccount(row: {
  id: string;
  userId: string;
  serviceName: string;
  integrationType: string;
  appLink: string | null;
  websiteLink: string | null;
  accountLink: string | null;
  bookingsLink: string | null;
  emailOrUsername: string | null;
  oauthProvider: string | null;
  oauthSecretRef: string | null;
  oauthScope: string | null;
  oauthConnectedAt: Date | null;
  oauthExpiresAt: Date | null;
  notes: string | null;
  deletedAt: Date | null;
}): IntegrationAccount {
  return {
    ...row,
    serviceName: row.serviceName as IntegrationAccount["serviceName"],
    integrationType: row.integrationType as IntegrationAccount["integrationType"],
    oauthConnectedAt: row.oauthConnectedAt ? row.oauthConnectedAt.toISOString() : null,
    oauthExpiresAt: row.oauthExpiresAt ? row.oauthExpiresAt.toISOString() : null,
    deletedAt: row.deletedAt ? row.deletedAt.toISOString() : null,
  };
}

export class PrismaIntegrationAccountRepository implements IntegrationAccountRepository {
  constructor(private readonly prisma: PrismaClient) {}

  async list({ userId, includeDeleted = false }: { userId: string; includeDeleted?: boolean }): Promise<IntegrationAccount[]> {
    const rows = await this.prisma.integrationAccount.findMany({
      where: { userId, ...(includeDeleted ? {} : { deletedAt: null }) },
    });
    return rows.map(toIntegrationAccount);
  }

  async getById({ userId, integrationAccountId }: { userId: string; integrationAccountId: string }): Promise<IntegrationAccount | null> {
    const row = await this.prisma.integrationAccount.findFirst({ where: { id: integrationAccountId, userId } });
    return row ? toIntegrationAccount(row) : null;
  }

  async create({ userId, input }: { userId: string; input: CreateIntegrationAccountInput }): Promise<IntegrationAccount> {
    const parsed = createIntegrationAccountInputSchema.parse(input);
    const row = await this.prisma.integrationAccount.create({ data: { userId, integrationType: "manual_link", ...parsed } });
    return toIntegrationAccount(row);
  }

  async softDelete({ userId, integrationAccountId }: { userId: string; integrationAccountId: string }): Promise<IntegrationAccount> {
    const existing = await this.prisma.integrationAccount.findFirst({ where: { id: integrationAccountId, userId } });
    if (!existing) throw new IntegrationAccountNotFoundError(integrationAccountId);

    const row = await this.prisma.integrationAccount.update({ where: { id: integrationAccountId }, data: { deletedAt: new Date() } });
    return toIntegrationAccount(row);
  }

  async restore({ userId, integrationAccountId }: { userId: string; integrationAccountId: string }): Promise<IntegrationAccount> {
    const existing = await this.prisma.integrationAccount.findFirst({ where: { id: integrationAccountId, userId } });
    if (!existing) throw new IntegrationAccountNotFoundError(integrationAccountId);

    const row = await this.prisma.integrationAccount.update({ where: { id: integrationAccountId }, data: { deletedAt: null } });
    return toIntegrationAccount(row);
  }
}
