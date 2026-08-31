import { randomUUID } from "node:crypto";
import type { TripDay } from "@travel-app/shared-types";
import { TripDayNotFoundError, type TripDayRepository } from "./trip-day-repository";

function key(tripId: string, date: string): string {
  return `${tripId}:${date}`;
}

export class MockTripDayRepository implements TripDayRepository {
  private tripDays = new Map<string, TripDay>();

  async getOrCreate({ tripId, date }: { tripId: string; date: string }): Promise<TripDay> {
    const existing = this.tripDays.get(key(tripId, date));
    if (existing) return existing;

    const created: TripDay = { id: randomUUID(), tripId, date, dayIndex: null, notes: null };
    this.tripDays.set(key(tripId, date), created);
    return created;
  }

  async updateNotes({ tripDayId, notes }: { tripDayId: string; notes: string | null }): Promise<TripDay> {
    const entry = Array.from(this.tripDays.entries()).find(([, day]) => day.id === tripDayId);
    if (!entry) throw new TripDayNotFoundError(tripDayId);

    const [entryKey, existing] = entry;
    const updated: TripDay = { ...existing, notes };
    this.tripDays.set(entryKey, updated);
    return updated;
  }

  async listForTrip({ tripId }: { tripId: string }): Promise<TripDay[]> {
    return Array.from(this.tripDays.values()).filter((day) => day.tripId === tripId && day.notes !== null);
  }
}

export const mockTripDayRepository = new MockTripDayRepository();
