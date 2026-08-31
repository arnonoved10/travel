import { randomUUID } from "node:crypto";
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

const DEMO_TRIP_ID = "00000000-0000-4000-8000-000000000101"; // [דמו] טיול לתאילנד

export class MockPlannedActivityRepository implements PlannedActivityRepository {
  private activities = new Map<string, PlannedActivity>();

  constructor() {
    this.seed();
  }

  private seed(): void {
    const now = new Date().toISOString();
    const activity: PlannedActivity = {
      id: randomUUID(),
      tripId: DEMO_TRIP_ID,
      placeId: null,
      bookingId: null,
      name: "[דמו] סיור באי פי פי",
      activityType: "attraction",
      plannedAt: null,
      plannedTimezone: null,
      estimatedDurationMinutes: 360,
      estimatedPrice: 1800,
      estimatedCurrencyCode: "THB",
      notes: "נתוני דמה לצורך פיתוח UI בלבד.",
      status: "want_to_book",
      personalRating: null,
      deletedAt: null,
      createdAt: now,
      updatedAt: now,
    };
    this.activities.set(activity.id, activity);
  }

  async listForTrip({ tripId, includeDeleted = false }: { tripId: string; includeDeleted?: boolean }): Promise<PlannedActivity[]> {
    return Array.from(this.activities.values())
      .filter((a) => a.tripId === tripId)
      .filter((a) => includeDeleted || a.deletedAt === null)
      .sort((a, b) => (a.plannedAt ?? a.createdAt).localeCompare(b.plannedAt ?? b.createdAt));
  }

  async create({ input }: { input: CreatePlannedActivityInput }): Promise<PlannedActivity> {
    const parsed = createPlannedActivityInputSchema.parse(input);
    const now = new Date().toISOString();
    const activity: PlannedActivity = {
      id: randomUUID(),
      tripId: parsed.tripId,
      placeId: parsed.placeId ?? null,
      bookingId: null,
      name: parsed.name,
      activityType: parsed.activityType ?? null,
      plannedAt: parsed.plannedAt ?? null,
      plannedTimezone: parsed.plannedTimezone ?? null,
      estimatedDurationMinutes: parsed.estimatedDurationMinutes ?? null,
      estimatedPrice: parsed.estimatedPrice ?? null,
      estimatedCurrencyCode: parsed.estimatedCurrencyCode ?? null,
      notes: parsed.notes ?? null,
      status: parsed.status,
      personalRating: null,
      deletedAt: null,
      createdAt: now,
      updatedAt: now,
    };
    this.activities.set(activity.id, activity);
    return activity;
  }

  async getById({ plannedActivityId }: { plannedActivityId: string }): Promise<PlannedActivity | null> {
    return this.activities.get(plannedActivityId) ?? null;
  }

  async updateStatus({ input }: { input: UpdatePlannedActivityStatusInput }): Promise<PlannedActivity> {
    const parsed = updatePlannedActivityStatusInputSchema.parse(input);
    const existing = this.activities.get(parsed.plannedActivityId);
    if (!existing) throw new PlannedActivityNotFoundError(parsed.plannedActivityId);

    const updated: PlannedActivity = { ...existing, status: parsed.status, updatedAt: new Date().toISOString() };
    this.activities.set(updated.id, updated);
    return updated;
  }

  async updatePersonalRating({ input }: { input: UpdatePlannedActivityPersonalRatingInput }): Promise<PlannedActivity> {
    const parsed = updatePlannedActivityPersonalRatingInputSchema.parse(input);
    const existing = this.activities.get(parsed.plannedActivityId);
    if (!existing) throw new PlannedActivityNotFoundError(parsed.plannedActivityId);

    const updated: PlannedActivity = { ...existing, personalRating: parsed.personalRating, updatedAt: new Date().toISOString() };
    this.activities.set(updated.id, updated);
    return updated;
  }

  async linkToBooking({ plannedActivityId, bookingId }: { plannedActivityId: string; bookingId: string }): Promise<PlannedActivity> {
    const existing = this.activities.get(plannedActivityId);
    if (!existing) throw new PlannedActivityNotFoundError(plannedActivityId);

    const updated: PlannedActivity = { ...existing, bookingId, status: "booked", updatedAt: new Date().toISOString() };
    this.activities.set(plannedActivityId, updated);
    return updated;
  }

  async softDelete({ plannedActivityId }: { plannedActivityId: string }): Promise<PlannedActivity> {
    const existing = this.activities.get(plannedActivityId);
    if (!existing) throw new PlannedActivityNotFoundError(plannedActivityId);

    const updated: PlannedActivity = { ...existing, deletedAt: new Date().toISOString(), updatedAt: new Date().toISOString() };
    this.activities.set(plannedActivityId, updated);
    return updated;
  }

  async restore({ plannedActivityId }: { plannedActivityId: string }): Promise<PlannedActivity> {
    const existing = this.activities.get(plannedActivityId);
    if (!existing) throw new PlannedActivityNotFoundError(plannedActivityId);

    const updated: PlannedActivity = { ...existing, deletedAt: null, updatedAt: new Date().toISOString() };
    this.activities.set(plannedActivityId, updated);
    return updated;
  }
}

export const mockPlannedActivityRepository = new MockPlannedActivityRepository();
