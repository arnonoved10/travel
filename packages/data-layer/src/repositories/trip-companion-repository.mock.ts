import { randomUUID } from "node:crypto";
import type { CreateTripCompanionInput, TripCompanion } from "@travel-app/shared-types";
import { createTripCompanionInputSchema } from "@travel-app/shared-types";
import { TripCompanionNotFoundError, type TripCompanionRepository } from "./trip-companion-repository";

const DEMO_TRIP_ID = "00000000-0000-4000-8000-000000000101"; // [דמו] טיול לתאילנד

export class MockTripCompanionRepository implements TripCompanionRepository {
  private companions = new Map<string, TripCompanion>();

  constructor() {
    this.seed();
  }

  private seed(): void {
    const seedCompanions: Array<Omit<TripCompanion, "id">> = [
      { tripId: DEMO_TRIP_ID, displayName: "[דמו] דנה", relation: "בת זוג", notes: null, deletedAt: null },
      { tripId: DEMO_TRIP_ID, displayName: "[דמו] יואב", relation: "חבר", notes: null, deletedAt: null },
    ];
    for (const companion of seedCompanions) {
      const id = randomUUID();
      this.companions.set(id, { ...companion, id });
    }
  }

  async listForTrip({ tripId, includeDeleted = false }: { tripId: string; includeDeleted?: boolean }): Promise<TripCompanion[]> {
    return Array.from(this.companions.values())
      .filter((c) => c.tripId === tripId)
      .filter((c) => includeDeleted || c.deletedAt === null);
  }

  async create({ input }: { input: CreateTripCompanionInput }): Promise<TripCompanion> {
    const parsed = createTripCompanionInputSchema.parse(input);
    const companion: TripCompanion = {
      id: randomUUID(),
      tripId: parsed.tripId,
      displayName: parsed.displayName,
      relation: parsed.relation ?? null,
      notes: parsed.notes ?? null,
      deletedAt: null,
    };
    this.companions.set(companion.id, companion);
    return companion;
  }

  async softDelete({ companionId }: { companionId: string }): Promise<TripCompanion> {
    const existing = this.companions.get(companionId);
    if (!existing) throw new TripCompanionNotFoundError(companionId);

    const updated: TripCompanion = { ...existing, deletedAt: new Date().toISOString() };
    this.companions.set(companionId, updated);
    return updated;
  }
}

export const mockTripCompanionRepository = new MockTripCompanionRepository();
