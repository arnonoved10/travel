// PENDING_INTEGRATION — ראה ההערה המקבילה ב-trip-repository.prisma.ts.
import { PrismaClient } from "@travel-app/db";
import type { PlaceRecommendation, PlaceRecommendationItemInput } from "@travel-app/shared-types";
import type { PlaceRecommendationRepository } from "./place-recommendation-repository";

function toPlaceRecommendation(row: {
  id: string;
  tripId: string;
  scopeLabel: string;
  category: string | null;
  name: string;
  address: string | null;
  rating: unknown;
  userRatingsTotal: number | null;
  mapsUrl: string;
  photoUrl: string | null;
  createdAt: Date;
}): PlaceRecommendation {
  return {
    id: row.id,
    tripId: row.tripId,
    scopeLabel: row.scopeLabel,
    category: row.category,
    name: row.name,
    address: row.address,
    rating: row.rating !== null ? Number(row.rating) : null,
    userRatingsTotal: row.userRatingsTotal,
    mapsUrl: row.mapsUrl,
    photoUrl: row.photoUrl,
    createdAt: row.createdAt.toISOString(),
  };
}

export class PrismaPlaceRecommendationRepository implements PlaceRecommendationRepository {
  constructor(private readonly prisma: PrismaClient) {}

  async listForTrip({ tripId }: { tripId: string }): Promise<PlaceRecommendation[]> {
    const rows = await this.prisma.placeRecommendation.findMany({
      where: { tripId },
      orderBy: [{ scopeLabel: "asc" }, { createdAt: "desc" }],
    });
    return rows.map(toPlaceRecommendation);
  }

  async replaceForTrip({
    tripId,
    scopeLabel,
    items,
  }: {
    tripId: string;
    scopeLabel: string;
    items: PlaceRecommendationItemInput[];
  }): Promise<PlaceRecommendation[]> {
    await this.prisma.placeRecommendation.deleteMany({ where: { tripId, scopeLabel } });
    if (items.length === 0) return [];

    await this.prisma.placeRecommendation.createMany({
      data: items.map((item) => ({
        tripId,
        scopeLabel,
        category: item.category,
        name: item.name,
        address: item.address,
        rating: item.rating,
        userRatingsTotal: item.userRatingsTotal,
        mapsUrl: item.mapsUrl,
        photoUrl: item.photoUrl,
      })),
    });

    const rows = await this.prisma.placeRecommendation.findMany({
      where: { tripId, scopeLabel },
      orderBy: { createdAt: "desc" },
    });
    return rows.map(toPlaceRecommendation);
  }

  async clearForTrip({ tripId }: { tripId: string }): Promise<void> {
    await this.prisma.placeRecommendation.deleteMany({ where: { tripId } });
  }
}
