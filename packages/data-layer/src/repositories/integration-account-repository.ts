import type { CreateIntegrationAccountInput, IntegrationAccount } from "@travel-app/shared-types";

/** אותו עיקרון כמו LoyaltyProgramRepository — גלובלי פר-משתמש, לא פר-טיול. */
export interface IntegrationAccountRepository {
  list(params: { userId: string; includeDeleted?: boolean }): Promise<IntegrationAccount[]>;
  getById(params: { userId: string; integrationAccountId: string }): Promise<IntegrationAccount | null>;
  create(params: { userId: string; input: CreateIntegrationAccountInput }): Promise<IntegrationAccount>;
  softDelete(params: { userId: string; integrationAccountId: string }): Promise<IntegrationAccount>;
  restore(params: { userId: string; integrationAccountId: string }): Promise<IntegrationAccount>;
}

export class IntegrationAccountNotFoundError extends Error {
  constructor(integrationAccountId: string) {
    super(`IntegrationAccount ${integrationAccountId} not found`);
    this.name = "IntegrationAccountNotFoundError";
  }
}
