import { randomBytes, randomUUID } from "node:crypto";
import type { TripShareLink } from "@travel-app/shared-types";
import { mockTripRepository } from "./trip-repository.mock";
import { TripNotFoundForShareLinkError, type TripShareLinkRepository } from "./trip-share-link-repository";

function generateToken(): string {
  return randomBytes(24).toString("base64url");
}

export class MockTripShareLinkRepository implements TripShareLinkRepository {
  private links = new Map<string, TripShareLink>();

  private async assertOwnership(userId: string, tripId: string): Promise<void> {
    const trip = await mockTripRepository.getById({ userId, tripId });
    if (!trip) throw new TripNotFoundForShareLinkError(tripId);
  }

  private findActive(tripId: string): TripShareLink | undefined {
    return Array.from(this.links.values()).find((l) => l.tripId === tripId && l.revokedAt === null);
  }

  async getActiveForTrip({ tripId }: { tripId: string }): Promise<TripShareLink | null> {
    return this.findActive(tripId) ?? null;
  }

  async getOrCreateForTrip({ userId, tripId }: { userId: string; tripId: string }): Promise<TripShareLink> {
    await this.assertOwnership(userId, tripId);
    const existing = this.findActive(tripId);
    if (existing) return existing;

    const link: TripShareLink = {
      id: randomUUID(),
      tripId,
      token: generateToken(),
      createdAt: new Date().toISOString(),
      revokedAt: null,
    };
    this.links.set(link.id, link);
    return link;
  }

  async revoke({ userId, tripId }: { userId: string; tripId: string }): Promise<void> {
    await this.assertOwnership(userId, tripId);
    const existing = this.findActive(tripId);
    if (!existing) return;
    this.links.set(existing.id, { ...existing, revokedAt: new Date().toISOString() });
  }

  async regenerate({ userId, tripId }: { userId: string; tripId: string }): Promise<TripShareLink> {
    await this.revoke({ userId, tripId });
    return this.getOrCreateForTrip({ userId, tripId });
  }

  async resolveToken({ token }: { token: string }): Promise<TripShareLink | null> {
    const link = Array.from(this.links.values()).find((l) => l.token === token);
    if (!link || link.revokedAt !== null) return null;
    return link;
  }
}

export const mockTripShareLinkRepository = new MockTripShareLinkRepository();
