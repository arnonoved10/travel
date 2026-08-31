import { randomUUID } from "node:crypto";
import type { CreateLoyaltyProgramInput, LoyaltyProgram } from "@travel-app/shared-types";
import { createLoyaltyProgramInputSchema } from "@travel-app/shared-types";
import { LoyaltyProgramNotFoundError, type LoyaltyProgramRepository } from "./loyalty-program-repository";

const DEMO_USER_ID = "00000000-0000-4000-8000-000000000001";

export class MockLoyaltyProgramRepository implements LoyaltyProgramRepository {
  private loyaltyPrograms = new Map<string, LoyaltyProgram>();

  constructor() {
    this.seed();
  }

  private seed(): void {
    const seedPrograms: Array<Omit<LoyaltyProgram, "id">> = [
      {
        userId: DEMO_USER_ID,
        programName: "[דמו] אל על מתמיד",
        programType: "airline",
        memberNumber: "DEMO12345",
        currentBalance: 15000,
        tierStatus: "כסף",
        notes: "נתוני דמה לצורך פיתוח UI בלבד.",
        deletedAt: null,
      },
    ];
    for (const program of seedPrograms) {
      const id = randomUUID();
      this.loyaltyPrograms.set(id, { ...program, id });
    }
  }

  async list({ userId, includeDeleted = false }: { userId: string; includeDeleted?: boolean }): Promise<LoyaltyProgram[]> {
    return Array.from(this.loyaltyPrograms.values())
      .filter((p) => p.userId === userId)
      .filter((p) => includeDeleted || p.deletedAt === null);
  }

  async getById({ userId, loyaltyProgramId }: { userId: string; loyaltyProgramId: string }): Promise<LoyaltyProgram | null> {
    const program = this.loyaltyPrograms.get(loyaltyProgramId);
    if (!program || program.userId !== userId) return null;
    return program;
  }

  async create({ userId, input }: { userId: string; input: CreateLoyaltyProgramInput }): Promise<LoyaltyProgram> {
    const parsed = createLoyaltyProgramInputSchema.parse(input);
    const program: LoyaltyProgram = {
      id: randomUUID(),
      userId,
      programName: parsed.programName,
      programType: parsed.programType ?? null,
      memberNumber: parsed.memberNumber ?? null,
      currentBalance: parsed.currentBalance ?? null,
      tierStatus: parsed.tierStatus ?? null,
      notes: parsed.notes ?? null,
      deletedAt: null,
    };
    this.loyaltyPrograms.set(program.id, program);
    return program;
  }

  async softDelete({ userId, loyaltyProgramId }: { userId: string; loyaltyProgramId: string }): Promise<LoyaltyProgram> {
    const existing = await this.getById({ userId, loyaltyProgramId });
    if (!existing) throw new LoyaltyProgramNotFoundError(loyaltyProgramId);

    const updated: LoyaltyProgram = { ...existing, deletedAt: new Date().toISOString() };
    this.loyaltyPrograms.set(loyaltyProgramId, updated);
    return updated;
  }

  async restore({ userId, loyaltyProgramId }: { userId: string; loyaltyProgramId: string }): Promise<LoyaltyProgram> {
    const existing = await this.getById({ userId, loyaltyProgramId });
    if (!existing) throw new LoyaltyProgramNotFoundError(loyaltyProgramId);

    const updated: LoyaltyProgram = { ...existing, deletedAt: null };
    this.loyaltyPrograms.set(loyaltyProgramId, updated);
    return updated;
  }
}

export const mockLoyaltyProgramRepository = new MockLoyaltyProgramRepository();
