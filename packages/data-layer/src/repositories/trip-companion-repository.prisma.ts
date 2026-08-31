// PENDING_INTEGRATION — ראה ההערה המקבילה ב-trip-repository.prisma.ts.
import { PrismaClient } from "@travel-app/db";
import type { CreateTripCompanionInput, TripCompanion } from "@travel-app/shared-types";
import { createTripCompanionInputSchema } from "@travel-app/shared-types";
import { TripCompanionNotFoundError, type TripCompanionRepository } from "./trip-companion-repository";

function toTripCompanion(row: {
  id: string;
  tripId: string;
  displayName: string;
  relation: string | null;
  notes: string | null;
  deletedAt: Date | null;
}): TripCompanion {
  return { ...row, deletedAt: row.deletedAt ? row.deletedAt.toISOString() : null };
}

export class PrismaTripCompanionRepository implements TripCompanionRepository {
  constructor(private readonly prisma: PrismaClient) {}

  async listForTrip({ tripId, includeDeleted = false }: { tripId: string; includeDeleted?: boolean }): Promise<TripCompanion[]> {
    const rows = await this.prisma.tripCompanion.findMany({
      where: { tripId, ...(includeDeleted ? {} : { deletedAt: null }) },
    });
    return rows.map(toTripCompanion);
  }

  async create({ input }: { input: CreateTripCompanionInput }): Promise<TripCompanion> {
    const parsed = createTripCompanionInputSchema.parse(input);
    const row = await this.prisma.tripCompanion.create({
      data: { tripId: parsed.tripId, displayName: parsed.displayName, relation: parsed.relation ?? null, notes: parsed.notes ?? null },
    });
    return toTripCompanion(row);
  }

  async softDelete({ companionId }: { companionId: string }): Promise<TripCompanion> {
    const existing = await this.prisma.tripCompanion.findUnique({ where: { id: companionId } });
    if (!existing) throw new TripCompanionNotFoundError(companionId);

    const row = await this.prisma.tripCompanion.update({ where: { id: companionId }, data: { deletedAt: new Date() } });
    return toTripCompanion(row);
  }
}
