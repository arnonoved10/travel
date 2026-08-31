// PENDING_INTEGRATION — ראה ההערה המקבילה ב-trip-repository.prisma.ts.
import { PrismaClient } from "@travel-app/db";
import type { Place, TripPlace, TripPlaceStatus } from "@travel-app/shared-types";
import type { TripPlaceRepository, TripPlaceWithPlace } from "./trip-place-repository";

export class PrismaTripPlaceRepository implements TripPlaceRepository {
  constructor(private readonly prisma: PrismaClient) {}

  private toTripPlaceWithPlace(row: Awaited<ReturnType<PrismaClient["tripPlace"]["findMany"]>>[number] & { place: NonNullable<Awaited<ReturnType<PrismaClient["place"]["findUnique"]>>> }): TripPlaceWithPlace {
    return {
      id: row.id,
      tripId: row.tripId,
      placeId: row.placeId,
      status: row.status,
      notes: row.notes,
      place: {
        ...row.place,
        category: row.place.category,
        openingHours: row.place.openingHours as Place["openingHours"],
        deletedAt: row.place.deletedAt ? row.place.deletedAt.toISOString() : null,
        createdAt: row.place.createdAt.toISOString(),
        updatedAt: row.place.updatedAt.toISOString(),
      },
    };
  }

  async listForTrip({ userId, tripId }: { userId: string; tripId: string }): Promise<TripPlaceWithPlace[]> {
    const rows = await this.prisma.tripPlace.findMany({
      where: { tripId, place: { userId } },
      include: { place: true },
    });
    return rows.map((row) => this.toTripPlaceWithPlace(row));
  }

  async listForTrips({ userId, tripIds }: { userId: string; tripIds: string[] }): Promise<TripPlaceWithPlace[]> {
    if (tripIds.length === 0) return [];
    const rows = await this.prisma.tripPlace.findMany({
      where: { tripId: { in: tripIds }, place: { userId } },
      include: { place: true },
    });
    return rows.map((row) => this.toTripPlaceWithPlace(row));
  }

  async linkPlaceToTrip({
    userId,
    tripId,
    placeId,
    status,
  }: {
    userId: string;
    tripId: string;
    placeId: string;
    status: TripPlaceStatus;
  }): Promise<TripPlace> {
    const place = await this.prisma.place.findFirst({ where: { id: placeId, userId } });
    if (!place) throw new Error("place not found or not owned by user");

    const row = await this.prisma.tripPlace.upsert({
      where: { tripId_placeId: { tripId, placeId } },
      create: { tripId, placeId, status },
      update: { status },
    });
    return row;
  }
}
