import { randomUUID } from "node:crypto";
import type { CreateTripInput, Trip, UpdateTripInput } from "@travel-app/shared-types";
import { createTripInputSchema, updateTripInputSchema } from "@travel-app/shared-types";
import { TripNotFoundError, type TripRepository } from "./trip-repository";

/**
 * מימוש דמו בזיכרון בלבד — לפיתוח ה-UI בלי חיבור Supabase חי.
 * הנתונים לא נשמרים בין הפעלות שרת, ומאופסים תמיד עם 2 טיולי דוגמה מסומנים
 * בבירור כדמו בשם ("[דמו]"). אסור להשתמש בזה מול משתמשים אמיתיים בפרודקשן —
 * ראה packages/data-layer/src/config.ts (isDemoMode).
 */
export class MockTripRepository implements TripRepository {
  private trips = new Map<string, Trip>();

  constructor() {
    this.seed();
  }

  private seed(): void {
    const demoUserId = "00000000-0000-4000-8000-000000000001";
    const now = new Date().toISOString();

    const seedTrips: Trip[] = [
      {
        id: "00000000-0000-4000-8000-000000000101",
        userId: demoUserId,
        name: "[דמו] טיול לתאילנד",
        status: "planning",
        startDate: "2026-12-01",
        endDate: "2026-12-15",
        baseCurrencyCode: "THB",
        primaryTimezone: "Asia/Bangkok",
        tripType: "beach",
        coverImageUrl: null,
        notes: "נתוני דמה לצורך פיתוח UI בלבד — לא טיול אמיתי.",
        medicalNotes: null,
        passportExpiryDate: null,
        internationalDrivingPermitExpiryDate: null,
        israeliDrivingLicenseExpiryDate: null,
        visaRequirementsChecked: false,
        totalBudgetAmount: 12000,
        dailyBudgetAmount: 900,
        deletedAt: null,
        createdAt: now,
        updatedAt: now,
      },
      {
        id: "00000000-0000-4000-8000-000000000102",
        userId: demoUserId,
        name: "[דמו] סוף שבוע בפראג",
        status: "completed",
        startDate: "2026-03-10",
        endDate: "2026-03-13",
        baseCurrencyCode: "EUR",
        primaryTimezone: "Europe/Prague",
        tripType: "city",
        coverImageUrl: null,
        notes: "נתוני דמה לצורך פיתוח UI בלבד — לא טיול אמיתי.",
        medicalNotes: null,
        passportExpiryDate: null,
        internationalDrivingPermitExpiryDate: null,
        israeliDrivingLicenseExpiryDate: null,
        visaRequirementsChecked: false,
        totalBudgetAmount: null,
        dailyBudgetAmount: null,
        deletedAt: null,
        createdAt: now,
        updatedAt: now,
      },
    ];

    for (const trip of seedTrips) {
      this.trips.set(trip.id, trip);
    }
  }

  async list({ userId, includeDeleted = false }: { userId: string; includeDeleted?: boolean }): Promise<Trip[]> {
    return Array.from(this.trips.values())
      .filter((t) => t.userId === userId)
      .filter((t) => includeDeleted || t.deletedAt === null)
      .sort((a, b) => b.createdAt.localeCompare(a.createdAt));
  }

  async getById({ userId, tripId }: { userId: string; tripId: string }): Promise<Trip | null> {
    const trip = this.trips.get(tripId);
    if (!trip || trip.userId !== userId) return null;
    return trip;
  }

  async getByIdForShareView({ tripId }: { tripId: string }): Promise<Trip | null> {
    return this.trips.get(tripId) ?? null;
  }

  async create({ userId, input }: { userId: string; input: CreateTripInput }): Promise<Trip> {
    const parsed = createTripInputSchema.parse(input);
    const now = new Date().toISOString();
    const trip: Trip = {
      id: randomUUID(),
      userId,
      name: parsed.name,
      status: "planning",
      startDate: parsed.startDate,
      endDate: parsed.endDate,
      baseCurrencyCode: parsed.baseCurrencyCode ?? null,
      primaryTimezone: parsed.primaryTimezone ?? null,
      tripType: parsed.tripType ?? null,
      coverImageUrl: null,
      notes: parsed.notes ?? null,
      medicalNotes: null,
      passportExpiryDate: parsed.passportExpiryDate ?? null,
      internationalDrivingPermitExpiryDate: parsed.internationalDrivingPermitExpiryDate ?? null,
      israeliDrivingLicenseExpiryDate: parsed.israeliDrivingLicenseExpiryDate ?? null,
      visaRequirementsChecked: parsed.visaRequirementsChecked ?? false,
      totalBudgetAmount: parsed.totalBudgetAmount ?? null,
      dailyBudgetAmount: parsed.dailyBudgetAmount ?? null,
      deletedAt: null,
      createdAt: now,
      updatedAt: now,
    };
    this.trips.set(trip.id, trip);
    return trip;
  }

  async update({
    userId,
    tripId,
    input,
  }: {
    userId: string;
    tripId: string;
    input: UpdateTripInput;
  }): Promise<Trip> {
    const existing = await this.getById({ userId, tripId });
    if (!existing) throw new TripNotFoundError(tripId);

    const parsed = updateTripInputSchema.parse(input);
    const updated: Trip = {
      ...existing,
      ...parsed,
      baseCurrencyCode: parsed.baseCurrencyCode !== undefined ? parsed.baseCurrencyCode : existing.baseCurrencyCode,
      primaryTimezone: parsed.primaryTimezone !== undefined ? parsed.primaryTimezone : existing.primaryTimezone,
      tripType: parsed.tripType !== undefined ? parsed.tripType : existing.tripType,
      coverImageUrl: parsed.coverImageUrl !== undefined ? parsed.coverImageUrl : existing.coverImageUrl,
      notes: parsed.notes !== undefined ? parsed.notes : existing.notes,
      medicalNotes: parsed.medicalNotes !== undefined ? parsed.medicalNotes : existing.medicalNotes,
      passportExpiryDate: parsed.passportExpiryDate !== undefined ? parsed.passportExpiryDate : existing.passportExpiryDate,
      internationalDrivingPermitExpiryDate:
        parsed.internationalDrivingPermitExpiryDate !== undefined ? parsed.internationalDrivingPermitExpiryDate : existing.internationalDrivingPermitExpiryDate,
      israeliDrivingLicenseExpiryDate:
        parsed.israeliDrivingLicenseExpiryDate !== undefined ? parsed.israeliDrivingLicenseExpiryDate : existing.israeliDrivingLicenseExpiryDate,
      visaRequirementsChecked: parsed.visaRequirementsChecked !== undefined ? parsed.visaRequirementsChecked : existing.visaRequirementsChecked,
      totalBudgetAmount: parsed.totalBudgetAmount !== undefined ? parsed.totalBudgetAmount : existing.totalBudgetAmount,
      dailyBudgetAmount: parsed.dailyBudgetAmount !== undefined ? parsed.dailyBudgetAmount : existing.dailyBudgetAmount,
      updatedAt: new Date().toISOString(),
    };
    this.trips.set(tripId, updated);
    return updated;
  }

  async softDelete({ userId, tripId }: { userId: string; tripId: string }): Promise<Trip> {
    const existing = await this.getById({ userId, tripId });
    if (!existing) throw new TripNotFoundError(tripId);

    const updated: Trip = { ...existing, deletedAt: new Date().toISOString(), updatedAt: new Date().toISOString() };
    this.trips.set(tripId, updated);
    return updated;
  }

  async restore({ userId, tripId }: { userId: string; tripId: string }): Promise<Trip> {
    const trip = this.trips.get(tripId);
    if (!trip || trip.userId !== userId) throw new TripNotFoundError(tripId);

    const updated: Trip = { ...trip, deletedAt: null, updatedAt: new Date().toISOString() };
    this.trips.set(tripId, updated);
    return updated;
  }
}

// Singleton במודול — נשאר "חי" למשך ריצת תהליך ה-dev server (מספיק לצורך פיתוח UI).
export const mockTripRepository = new MockTripRepository();
