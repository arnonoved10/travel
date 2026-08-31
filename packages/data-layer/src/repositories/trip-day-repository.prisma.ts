// PENDING_INTEGRATION — ראה ההערה המקבילה ב-trip-repository.prisma.ts.
import { PrismaClient } from "@travel-app/db";
import type { TripDay } from "@travel-app/shared-types";
import { TripDayNotFoundError, type TripDayRepository } from "./trip-day-repository";

function toDateOnly(date: string): Date {
  return new Date(`${date}T00:00:00Z`);
}

export class PrismaTripDayRepository implements TripDayRepository {
  constructor(private readonly prisma: PrismaClient) {}

  async getOrCreate({ tripId, date }: { tripId: string; date: string }): Promise<TripDay> {
    const calendarDate = toDateOnly(date);
    const row = await this.prisma.tripDay.upsert({
      where: { tripId_calendarDate: { tripId, calendarDate } },
      create: { tripId, calendarDate },
      update: {},
    });
    return { id: row.id, tripId: row.tripId, date, dayIndex: row.dayIndex, notes: row.notes };
  }

  async updateNotes({ tripDayId, notes }: { tripDayId: string; notes: string | null }): Promise<TripDay> {
    const existing = await this.prisma.tripDay.findUnique({ where: { id: tripDayId } });
    if (!existing) throw new TripDayNotFoundError(tripDayId);

    const row = await this.prisma.tripDay.update({ where: { id: tripDayId }, data: { notes } });
    return {
      id: row.id,
      tripId: row.tripId,
      date: row.calendarDate.toISOString().slice(0, 10),
      dayIndex: row.dayIndex,
      notes: row.notes,
    };
  }

  async listForTrip({ tripId }: { tripId: string }): Promise<TripDay[]> {
    const rows = await this.prisma.tripDay.findMany({ where: { tripId, notes: { not: null } } });
    return rows.map((row) => ({
      id: row.id,
      tripId: row.tripId,
      date: row.calendarDate.toISOString().slice(0, 10),
      dayIndex: row.dayIndex,
      notes: row.notes,
    }));
  }
}
