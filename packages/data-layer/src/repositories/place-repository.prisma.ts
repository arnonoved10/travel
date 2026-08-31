// PENDING_INTEGRATION — ראה ההערה המקבילה ב-trip-repository.prisma.ts.
import { PrismaClient } from "@travel-app/db";
import type { CreatePlaceInput, Place } from "@travel-app/shared-types";
import { createPlaceInputSchema } from "@travel-app/shared-types";
import { PlaceNotFoundError, type PlaceRepository } from "./place-repository";

function toPlace(row: {
  id: string;
  userId: string;
  name: string;
  category: string;
  address: string | null;
  country: string | null;
  city: string | null;
  lat: number | null;
  lng: number | null;
  officialWebsite: string | null;
  phone: string | null;
  whatsapp: string | null;
  email: string | null;
  openingHours: unknown;
  generalNotes: string | null;
  isFavorite: boolean;
  dontReturn: boolean;
  personalRating: number | null;
  mapLink: string | null;
  deletedAt: Date | null;
  createdAt: Date;
  updatedAt: Date;
}): Place {
  return {
    ...row,
    category: row.category as Place["category"],
    openingHours: row.openingHours as Place["openingHours"],
    deletedAt: row.deletedAt ? row.deletedAt.toISOString() : null,
    createdAt: row.createdAt.toISOString(),
    updatedAt: row.updatedAt.toISOString(),
  };
}

export class PrismaPlaceRepository implements PlaceRepository {
  constructor(private readonly prisma: PrismaClient) {}

  async list({ userId, includeDeleted = false }: { userId: string; includeDeleted?: boolean }): Promise<Place[]> {
    const rows = await this.prisma.place.findMany({
      where: { userId, ...(includeDeleted ? {} : { deletedAt: null }) },
      orderBy: { createdAt: "desc" },
    });
    return rows.map(toPlace);
  }

  async getById({ userId, placeId }: { userId: string; placeId: string }): Promise<Place | null> {
    const row = await this.prisma.place.findFirst({ where: { id: placeId, userId } });
    return row ? toPlace(row) : null;
  }

  async listByIds({ placeIds }: { placeIds: string[] }): Promise<Place[]> {
    if (placeIds.length === 0) return [];
    const rows = await this.prisma.place.findMany({ where: { id: { in: placeIds } } });
    return rows.map(toPlace);
  }

  async create({ userId, input }: { userId: string; input: CreatePlaceInput }): Promise<Place> {
    const parsed = createPlaceInputSchema.parse(input);
    const row = await this.prisma.place.create({ data: { userId, ...parsed } });
    return toPlace(row);
  }

  async softDelete({ userId, placeId }: { userId: string; placeId: string }): Promise<Place> {
    const existing = await this.prisma.place.findFirst({ where: { id: placeId, userId } });
    if (!existing) throw new PlaceNotFoundError(placeId);

    const row = await this.prisma.place.update({ where: { id: placeId }, data: { deletedAt: new Date() } });
    return toPlace(row);
  }

  async restore({ userId, placeId }: { userId: string; placeId: string }): Promise<Place> {
    const existing = await this.prisma.place.findFirst({ where: { id: placeId, userId } });
    if (!existing) throw new PlaceNotFoundError(placeId);

    const row = await this.prisma.place.update({ where: { id: placeId }, data: { deletedAt: null } });
    return toPlace(row);
  }

  async toggleFavorite({ userId, placeId }: { userId: string; placeId: string }): Promise<Place> {
    const existing = await this.prisma.place.findFirst({ where: { id: placeId, userId } });
    if (!existing) throw new PlaceNotFoundError(placeId);

    const row = await this.prisma.place.update({ where: { id: placeId }, data: { isFavorite: !existing.isFavorite } });
    return toPlace(row);
  }

  async toggleDontReturn({ userId, placeId }: { userId: string; placeId: string }): Promise<Place> {
    const existing = await this.prisma.place.findFirst({ where: { id: placeId, userId } });
    if (!existing) throw new PlaceNotFoundError(placeId);

    const row = await this.prisma.place.update({ where: { id: placeId }, data: { dontReturn: !existing.dontReturn } });
    return toPlace(row);
  }

  async setPersonalRating({
    userId,
    placeId,
    personalRating,
  }: {
    userId: string;
    placeId: string;
    personalRating: number | null;
  }): Promise<Place> {
    const existing = await this.prisma.place.findFirst({ where: { id: placeId, userId } });
    if (!existing) throw new PlaceNotFoundError(placeId);

    const row = await this.prisma.place.update({ where: { id: placeId }, data: { personalRating } });
    return toPlace(row);
  }
}
