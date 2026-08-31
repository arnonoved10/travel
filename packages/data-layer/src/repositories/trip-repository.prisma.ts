// PENDING_INTEGRATION: הקוד כאן אמיתי (לא מדומה) ומייצג את הלוגיקה הסופית
// המתוכננת, אבל **לא נבדק אף פעם מול Supabase חי** — אין עדיין DATABASE_URL
// אמיתי (ראה docs/PHASE_0_REPORT.md). אל תניח שזה "עובד" עד שירוץ בפועל מול
// DB אמיתי ויעבור את הבדיקות ב-packages/data-layer/src/*.integration.test.ts
// (ייכתבו כשיהיה חיבור). RLS (packages/db/prisma/rls_policies.sql) אמור
// לאכוף בידוד משתמשים בכל מקרה, גם אם ה-userId כאן שגוי — אבל שכבת ה-Data
// Layer עדיין מסננת במפורש לפי userId כהגנת עומק (defense in depth).
import { PrismaClient } from "@travel-app/db";
import type { CreateTripInput, Trip, UpdateTripInput } from "@travel-app/shared-types";
import { createTripInputSchema, updateTripInputSchema } from "@travel-app/shared-types";
import { TripNotFoundError, type TripRepository } from "./trip-repository";

function toDateOnly(date: Date): string {
  return date.toISOString().slice(0, 10);
}

function toTrip(row: {
  id: string;
  userId: string;
  name: string;
  status: string;
  startDate: Date;
  endDate: Date;
  baseCurrencyCode: string | null;
  primaryTimezone: string | null;
  tripType: string | null;
  coverImageUrl: string | null;
  notes: string | null;
  medicalNotes: string | null;
  passportExpiryDate: Date | null;
  internationalDrivingPermitExpiryDate: Date | null;
  israeliDrivingLicenseExpiryDate: Date | null;
  visaRequirementsChecked: boolean;
  totalBudgetAmount: unknown;
  dailyBudgetAmount: unknown;
  deletedAt: Date | null;
  createdAt: Date;
  updatedAt: Date;
}): Trip {
  return {
    id: row.id,
    userId: row.userId,
    name: row.name,
    status: row.status as Trip["status"],
    startDate: toDateOnly(row.startDate),
    endDate: toDateOnly(row.endDate),
    baseCurrencyCode: row.baseCurrencyCode,
    primaryTimezone: row.primaryTimezone,
    tripType: row.tripType as Trip["tripType"],
    coverImageUrl: row.coverImageUrl,
    notes: row.notes,
    medicalNotes: row.medicalNotes,
    passportExpiryDate: row.passportExpiryDate ? toDateOnly(row.passportExpiryDate) : null,
    internationalDrivingPermitExpiryDate: row.internationalDrivingPermitExpiryDate ? toDateOnly(row.internationalDrivingPermitExpiryDate) : null,
    israeliDrivingLicenseExpiryDate: row.israeliDrivingLicenseExpiryDate ? toDateOnly(row.israeliDrivingLicenseExpiryDate) : null,
    visaRequirementsChecked: row.visaRequirementsChecked,
    totalBudgetAmount: row.totalBudgetAmount !== null ? Number(row.totalBudgetAmount) : null,
    dailyBudgetAmount: row.dailyBudgetAmount !== null ? Number(row.dailyBudgetAmount) : null,
    deletedAt: row.deletedAt ? row.deletedAt.toISOString() : null,
    createdAt: row.createdAt.toISOString(),
    updatedAt: row.updatedAt.toISOString(),
  };
}

export class PrismaTripRepository implements TripRepository {
  constructor(private readonly prisma: PrismaClient) {}

  async list({ userId, includeDeleted = false }: { userId: string; includeDeleted?: boolean }): Promise<Trip[]> {
    const rows = await this.prisma.trip.findMany({
      where: { userId, ...(includeDeleted ? {} : { deletedAt: null }) },
      orderBy: { createdAt: "desc" },
    });
    return rows.map(toTrip);
  }

  async getById({ userId, tripId }: { userId: string; tripId: string }): Promise<Trip | null> {
    const row = await this.prisma.trip.findFirst({ where: { id: tripId, userId } });
    return row ? toTrip(row) : null;
  }

  async getByIdForShareView({ tripId }: { tripId: string }): Promise<Trip | null> {
    const row = await this.prisma.trip.findUnique({ where: { id: tripId } });
    return row ? toTrip(row) : null;
  }

  async create({ userId, input }: { userId: string; input: CreateTripInput }): Promise<Trip> {
    const parsed = createTripInputSchema.parse(input);
    const row = await this.prisma.trip.create({
      data: {
        userId,
        name: parsed.name,
        status: "planning",
        startDate: new Date(parsed.startDate),
        endDate: new Date(parsed.endDate),
        baseCurrencyCode: parsed.baseCurrencyCode,
        primaryTimezone: parsed.primaryTimezone,
        tripType: parsed.tripType,
        notes: parsed.notes,
        passportExpiryDate: parsed.passportExpiryDate ? new Date(parsed.passportExpiryDate) : undefined,
        internationalDrivingPermitExpiryDate: parsed.internationalDrivingPermitExpiryDate ? new Date(parsed.internationalDrivingPermitExpiryDate) : undefined,
        israeliDrivingLicenseExpiryDate: parsed.israeliDrivingLicenseExpiryDate ? new Date(parsed.israeliDrivingLicenseExpiryDate) : undefined,
        visaRequirementsChecked: parsed.visaRequirementsChecked,
        totalBudgetAmount: parsed.totalBudgetAmount,
        dailyBudgetAmount: parsed.dailyBudgetAmount,
      },
    });
    return toTrip(row);
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
    const parsed = updateTripInputSchema.parse(input);
    const existing = await this.prisma.trip.findFirst({ where: { id: tripId, userId } });
    if (!existing) throw new TripNotFoundError(tripId);

    const row = await this.prisma.trip.update({
      where: { id: tripId },
      data: {
        ...parsed,
        startDate: parsed.startDate ? new Date(parsed.startDate) : undefined,
        endDate: parsed.endDate ? new Date(parsed.endDate) : undefined,
        passportExpiryDate: parsed.passportExpiryDate ? new Date(parsed.passportExpiryDate) : parsed.passportExpiryDate,
        internationalDrivingPermitExpiryDate: parsed.internationalDrivingPermitExpiryDate
          ? new Date(parsed.internationalDrivingPermitExpiryDate)
          : parsed.internationalDrivingPermitExpiryDate,
        israeliDrivingLicenseExpiryDate: parsed.israeliDrivingLicenseExpiryDate
          ? new Date(parsed.israeliDrivingLicenseExpiryDate)
          : parsed.israeliDrivingLicenseExpiryDate,
      },
    });
    return toTrip(row);
  }

  async softDelete({ userId, tripId }: { userId: string; tripId: string }): Promise<Trip> {
    const existing = await this.prisma.trip.findFirst({ where: { id: tripId, userId } });
    if (!existing) throw new TripNotFoundError(tripId);

    const row = await this.prisma.trip.update({ where: { id: tripId }, data: { deletedAt: new Date() } });
    return toTrip(row);
  }

  async restore({ userId, tripId }: { userId: string; tripId: string }): Promise<Trip> {
    const existing = await this.prisma.trip.findFirst({ where: { id: tripId, userId } });
    if (!existing) throw new TripNotFoundError(tripId);

    const row = await this.prisma.trip.update({ where: { id: tripId }, data: { deletedAt: null } });
    return toTrip(row);
  }
}
