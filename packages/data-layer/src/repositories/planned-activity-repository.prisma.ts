// PENDING_INTEGRATION — ראה ההערה המקבילה ב-trip-repository.prisma.ts.
import { PrismaClient } from "@travel-app/db";
import type {
  CreatePlannedActivityInput,
  PlannedActivity,
  UpdatePlannedActivityPersonalRatingInput,
  UpdatePlannedActivityStatusInput,
} from "@travel-app/shared-types";
import {
  createPlannedActivityInputSchema,
  updatePlannedActivityPersonalRatingInputSchema,
  updatePlannedActivityStatusInputSchema,
} from "@travel-app/shared-types";
import { PlannedActivityNotFoundError, type PlannedActivityRepository } from "./planned-activity-repository";

function toPlannedActivity(row: {
  id: string;
  tripId: string;
  placeId: string | null;
  bookingId: string | null;
  name: string;
  activityType: string | null;
  plannedAt: Date | null;
  plannedTimezone: string | null;
  estimatedDurationMinutes: number | null;
  estimatedPrice: unknown;
  estimatedCurrencyCode: string | null;
  notes: string | null;
  status: string;
  personalRating: number | null;
  deletedAt: Date | null;
  createdAt: Date;
  updatedAt: Date;
}): PlannedActivity {
  return {
    id: row.id,
    tripId: row.tripId,
    placeId: row.placeId,
    bookingId: row.bookingId,
    name: row.name,
    activityType: row.activityType,
    plannedAt: row.plannedAt ? row.plannedAt.toISOString() : null,
    plannedTimezone: row.plannedTimezone,
    estimatedDurationMinutes: row.estimatedDurationMinutes,
    estimatedPrice: row.estimatedPrice === null ? null : Number(row.estimatedPrice),
    estimatedCurrencyCode: row.estimatedCurrencyCode,
    notes: row.notes,
    status: row.status as PlannedActivity["status"],
    personalRating: row.personalRating,
    deletedAt: row.deletedAt ? row.deletedAt.toISOString() : null,
    createdAt: row.createdAt.toISOString(),
    updatedAt: row.updatedAt.toISOString(),
  };
}

export class PrismaPlannedActivityRepository implements PlannedActivityRepository {
  constructor(private readonly prisma: PrismaClient) {}

  async listForTrip({ tripId, includeDeleted = false }: { tripId: string; includeDeleted?: boolean }): Promise<PlannedActivity[]> {
    const rows = await this.prisma.plannedActivity.findMany({
      where: { tripId, ...(includeDeleted ? {} : { deletedAt: null }) },
      orderBy: { plannedAt: "asc" },
    });
    return rows.map(toPlannedActivity);
  }

  async create({ input }: { input: CreatePlannedActivityInput }): Promise<PlannedActivity> {
    const parsed = createPlannedActivityInputSchema.parse(input);
    const row = await this.prisma.plannedActivity.create({
      data: {
        tripId: parsed.tripId,
        placeId: parsed.placeId,
        name: parsed.name,
        activityType: parsed.activityType,
        plannedAt: parsed.plannedAt ? new Date(parsed.plannedAt) : undefined,
        plannedTimezone: parsed.plannedTimezone,
        estimatedDurationMinutes: parsed.estimatedDurationMinutes,
        estimatedPrice: parsed.estimatedPrice,
        estimatedCurrencyCode: parsed.estimatedCurrencyCode,
        notes: parsed.notes,
        status: parsed.status,
      },
    });
    return toPlannedActivity(row);
  }

  async getById({ plannedActivityId }: { plannedActivityId: string }): Promise<PlannedActivity | null> {
    const row = await this.prisma.plannedActivity.findUnique({ where: { id: plannedActivityId } });
    return row ? toPlannedActivity(row) : null;
  }

  async updateStatus({ input }: { input: UpdatePlannedActivityStatusInput }): Promise<PlannedActivity> {
    const parsed = updatePlannedActivityStatusInputSchema.parse(input);
    const existing = await this.prisma.plannedActivity.findUnique({ where: { id: parsed.plannedActivityId } });
    if (!existing) throw new PlannedActivityNotFoundError(parsed.plannedActivityId);

    const row = await this.prisma.plannedActivity.update({
      where: { id: parsed.plannedActivityId },
      data: { status: parsed.status },
    });
    return toPlannedActivity(row);
  }

  async updatePersonalRating({ input }: { input: UpdatePlannedActivityPersonalRatingInput }): Promise<PlannedActivity> {
    const parsed = updatePlannedActivityPersonalRatingInputSchema.parse(input);
    const existing = await this.prisma.plannedActivity.findUnique({ where: { id: parsed.plannedActivityId } });
    if (!existing) throw new PlannedActivityNotFoundError(parsed.plannedActivityId);

    const row = await this.prisma.plannedActivity.update({
      where: { id: parsed.plannedActivityId },
      data: { personalRating: parsed.personalRating },
    });
    return toPlannedActivity(row);
  }

  async linkToBooking({ plannedActivityId, bookingId }: { plannedActivityId: string; bookingId: string }): Promise<PlannedActivity> {
    const existing = await this.prisma.plannedActivity.findUnique({ where: { id: plannedActivityId } });
    if (!existing) throw new PlannedActivityNotFoundError(plannedActivityId);

    const row = await this.prisma.plannedActivity.update({
      where: { id: plannedActivityId },
      data: { bookingId, status: "booked" },
    });
    return toPlannedActivity(row);
  }

  async softDelete({ plannedActivityId }: { plannedActivityId: string }): Promise<PlannedActivity> {
    const existing = await this.prisma.plannedActivity.findUnique({ where: { id: plannedActivityId } });
    if (!existing) throw new PlannedActivityNotFoundError(plannedActivityId);

    const row = await this.prisma.plannedActivity.update({
      where: { id: plannedActivityId },
      data: { deletedAt: new Date() },
    });
    return toPlannedActivity(row);
  }

  async restore({ plannedActivityId }: { plannedActivityId: string }): Promise<PlannedActivity> {
    const existing = await this.prisma.plannedActivity.findUnique({ where: { id: plannedActivityId } });
    if (!existing) throw new PlannedActivityNotFoundError(plannedActivityId);

    const row = await this.prisma.plannedActivity.update({
      where: { id: plannedActivityId },
      data: { deletedAt: null },
    });
    return toPlannedActivity(row);
  }
}
