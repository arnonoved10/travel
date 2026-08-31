import type { CreateLoyaltyProgramInput, LoyaltyProgram } from "@travel-app/shared-types";

/** אותו עיקרון כמו ContactRepository — ראה contact-repository.ts. גלובלי פר-משתמש, לא פר-טיול. */
export interface LoyaltyProgramRepository {
  list(params: { userId: string; includeDeleted?: boolean }): Promise<LoyaltyProgram[]>;
  getById(params: { userId: string; loyaltyProgramId: string }): Promise<LoyaltyProgram | null>;
  create(params: { userId: string; input: CreateLoyaltyProgramInput }): Promise<LoyaltyProgram>;
  softDelete(params: { userId: string; loyaltyProgramId: string }): Promise<LoyaltyProgram>;
  restore(params: { userId: string; loyaltyProgramId: string }): Promise<LoyaltyProgram>;
}

export class LoyaltyProgramNotFoundError extends Error {
  constructor(loyaltyProgramId: string) {
    super(`LoyaltyProgram ${loyaltyProgramId} not found`);
    this.name = "LoyaltyProgramNotFoundError";
  }
}
