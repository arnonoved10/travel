// PENDING_INTEGRATION — ראה ההערה המקבילה ב-trip-repository.prisma.ts.
import { PrismaClient } from "@travel-app/db";
import type { CreateLoyaltyProgramInput, LoyaltyProgram } from "@travel-app/shared-types";
import { createLoyaltyProgramInputSchema } from "@travel-app/shared-types";
import { LoyaltyProgramNotFoundError, type LoyaltyProgramRepository } from "./loyalty-program-repository";

function toLoyaltyProgram(row: {
  id: string;
  userId: string;
  programName: string;
  programType: string | null;
  memberNumber: string | null;
  currentBalance: number | null;
  tierStatus: string | null;
  notes: string | null;
  deletedAt: Date | null;
}): LoyaltyProgram {
  return {
    ...row,
    programType: row.programType as LoyaltyProgram["programType"],
    deletedAt: row.deletedAt ? row.deletedAt.toISOString() : null,
  };
}

export class PrismaLoyaltyProgramRepository implements LoyaltyProgramRepository {
  constructor(private readonly prisma: PrismaClient) {}

  async list({ userId, includeDeleted = false }: { userId: string; includeDeleted?: boolean }): Promise<LoyaltyProgram[]> {
    const rows = await this.prisma.loyaltyProgram.findMany({
      where: { userId, ...(includeDeleted ? {} : { deletedAt: null }) },
    });
    return rows.map(toLoyaltyProgram);
  }

  async getById({ userId, loyaltyProgramId }: { userId: string; loyaltyProgramId: string }): Promise<LoyaltyProgram | null> {
    const row = await this.prisma.loyaltyProgram.findFirst({ where: { id: loyaltyProgramId, userId } });
    return row ? toLoyaltyProgram(row) : null;
  }

  async create({ userId, input }: { userId: string; input: CreateLoyaltyProgramInput }): Promise<LoyaltyProgram> {
    const parsed = createLoyaltyProgramInputSchema.parse(input);
    const row = await this.prisma.loyaltyProgram.create({ data: { userId, ...parsed } });
    return toLoyaltyProgram(row);
  }

  async softDelete({ userId, loyaltyProgramId }: { userId: string; loyaltyProgramId: string }): Promise<LoyaltyProgram> {
    const existing = await this.prisma.loyaltyProgram.findFirst({ where: { id: loyaltyProgramId, userId } });
    if (!existing) throw new LoyaltyProgramNotFoundError(loyaltyProgramId);

    const row = await this.prisma.loyaltyProgram.update({ where: { id: loyaltyProgramId }, data: { deletedAt: new Date() } });
    return toLoyaltyProgram(row);
  }

  async restore({ userId, loyaltyProgramId }: { userId: string; loyaltyProgramId: string }): Promise<LoyaltyProgram> {
    const existing = await this.prisma.loyaltyProgram.findFirst({ where: { id: loyaltyProgramId, userId } });
    if (!existing) throw new LoyaltyProgramNotFoundError(loyaltyProgramId);

    const row = await this.prisma.loyaltyProgram.update({ where: { id: loyaltyProgramId }, data: { deletedAt: null } });
    return toLoyaltyProgram(row);
  }
}
