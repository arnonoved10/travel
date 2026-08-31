// PENDING_INTEGRATION — ראה ההערה המקבילה ב-trip-repository.prisma.ts.
import { randomBytes } from "node:crypto";
import { PrismaClient } from "@travel-app/db";
import type { TripShareLink } from "@travel-app/shared-types";
import { TripNotFoundForShareLinkError, type TripShareLinkRepository } from "./trip-share-link-repository";

function generateToken(): string {
  return randomBytes(24).toString("base64url");
}

function toTripShareLink(row: { id: string; tripId: string; token: string; createdAt: Date; revokedAt: Date | null }): TripShareLink {
  return {
    id: row.id,
    tripId: row.tripId,
    token: row.token,
    createdAt: row.createdAt.toISOString(),
    revokedAt: row.revokedAt ? row.revokedAt.toISOString() : null,
  };
}

export class PrismaTripShareLinkRepository implements TripShareLinkRepository {
  constructor(private readonly prisma: PrismaClient) {}

  private async assertOwnership(userId: string, tripId: string): Promise<void> {
    const trip = await this.prisma.trip.findFirst({ where: { id: tripId, userId } });
    if (!trip) throw new TripNotFoundForShareLinkError(tripId);
  }

  async getActiveForTrip({ tripId }: { tripId: string }): Promise<TripShareLink | null> {
    const link = await this.prisma.tripShareLink.findFirst({ where: { tripId, revokedAt: null } });
    return link ? toTripShareLink(link) : null;
  }

  async getOrCreateForTrip({ userId, tripId }: { userId: string; tripId: string }): Promise<TripShareLink> {
    await this.assertOwnership(userId, tripId);
    const existing = await this.prisma.tripShareLink.findFirst({ where: { tripId, revokedAt: null } });
    if (existing) return toTripShareLink(existing);

    const created = await this.prisma.tripShareLink.create({ data: { tripId, token: generateToken() } });
    return toTripShareLink(created);
  }

  async revoke({ userId, tripId }: { userId: string; tripId: string }): Promise<void> {
    await this.assertOwnership(userId, tripId);
    const existing = await this.prisma.tripShareLink.findFirst({ where: { tripId, revokedAt: null } });
    if (!existing) return;
    await this.prisma.tripShareLink.update({ where: { id: existing.id }, data: { revokedAt: new Date() } });
  }

  async regenerate({ userId, tripId }: { userId: string; tripId: string }): Promise<TripShareLink> {
    await this.revoke({ userId, tripId });
    return this.getOrCreateForTrip({ userId, tripId });
  }

  async resolveToken({ token }: { token: string }): Promise<TripShareLink | null> {
    const link = await this.prisma.tripShareLink.findUnique({ where: { token } });
    if (!link || link.revokedAt !== null) return null;
    return toTripShareLink(link);
  }
}
