import { z } from "zod";
import { tripStatusSchema, tripTypeSchema } from "./enums";

export const tripSchema = z.object({
  id: z.uuid(),
  userId: z.uuid(),
  name: z.string().min(1),
  status: tripStatusSchema,
  startDate: z.iso.date(),
  endDate: z.iso.date(),
  baseCurrencyCode: z.string().length(3).nullable(),
  primaryTimezone: z.string().nullable(),
  tripType: tripTypeSchema.nullable(),
  coverImageUrl: z.url().nullable(),
  notes: z.string().nullable(),
  medicalNotes: z.string().nullable(),
  passportExpiryDate: z.iso.date().nullable(),
  internationalDrivingPermitExpiryDate: z.iso.date().nullable(),
  israeliDrivingLicenseExpiryDate: z.iso.date().nullable(),
  visaRequirementsChecked: z.boolean(),
  // תמיד ב-₪ — ר' apps/web/lib/budget.ts להמרה מהוצאות במטבעות שונים.
  totalBudgetAmount: z.number().positive().nullable(),
  dailyBudgetAmount: z.number().positive().nullable(),
  // Soft Delete — לא מחיקה פיזית. null = פעיל. הרשומה וכל היחסים שלה נשארים.
  deletedAt: z.iso.datetime().nullable(),
  createdAt: z.iso.datetime(),
  updatedAt: z.iso.datetime(),
});
export type Trip = z.infer<typeof tripSchema>;

export const createTripInputSchema = z
  .object({
    name: z.string().trim().min(1, "שם הטיול הוא שדה חובה"),
    startDate: z.iso.date("תאריך התחלה לא תקין"),
    endDate: z.iso.date("תאריך סיום לא תקין"),
    baseCurrencyCode: z.string().length(3).optional(),
    primaryTimezone: z.string().optional(),
    tripType: tripTypeSchema.optional(),
    notes: z.string().optional(),
    passportExpiryDate: z.iso.date().optional(),
    internationalDrivingPermitExpiryDate: z.iso.date().optional(),
    israeliDrivingLicenseExpiryDate: z.iso.date().optional(),
    visaRequirementsChecked: z.boolean().optional(),
    totalBudgetAmount: z.number().positive().optional(),
    dailyBudgetAmount: z.number().positive().optional(),
  })
  .refine((data) => data.endDate >= data.startDate, {
    message: "תאריך סיום חייב להיות אחרי תאריך התחלה",
    path: ["endDate"],
  });
export type CreateTripInput = z.infer<typeof createTripInputSchema>;

export const updateTripInputSchema = z
  .object({
    name: z.string().trim().min(1).optional(),
    status: tripStatusSchema.optional(),
    startDate: z.iso.date().optional(),
    endDate: z.iso.date().optional(),
    baseCurrencyCode: z.string().length(3).nullable().optional(),
    primaryTimezone: z.string().nullable().optional(),
    tripType: tripTypeSchema.nullable().optional(),
    coverImageUrl: z.url().nullable().optional(),
    notes: z.string().nullable().optional(),
    medicalNotes: z.string().nullable().optional(),
    passportExpiryDate: z.iso.date().nullable().optional(),
    internationalDrivingPermitExpiryDate: z.iso.date().nullable().optional(),
    israeliDrivingLicenseExpiryDate: z.iso.date().nullable().optional(),
    visaRequirementsChecked: z.boolean().optional(),
    totalBudgetAmount: z.number().positive().nullable().optional(),
    dailyBudgetAmount: z.number().positive().nullable().optional(),
  })
  .refine((data) => !(data.startDate && data.endDate) || data.endDate >= data.startDate, {
    message: "תאריך סיום חייב להיות אחרי תאריך התחלה",
    path: ["endDate"],
  });
export type UpdateTripInput = z.infer<typeof updateTripInputSchema>;

/**
 * הצורה של TripDateChangeLog.impactReport (Json ב-schema.prisma).
 * מנוע הבדיקה בפועל (סעיף 8 בהבהרות: לילות ללא מלון, חפיפות מלונות, פעילויות/
 * טיסות מחוץ לטווח, ימים חדשים ללא תכנון) ייבנה בשלב 2 (מנוע חוסרים) לפי
 * 01_architecture_v2.md — הטיפוס כאן קיים כבר עכשיו כדי שהמודל לא יחסום את זה.
 */
export const tripDateChangeImpactReportSchema = z.object({
  nightsWithoutHotel: z.array(z.iso.date()),
  hotelsOutsideNewRange: z.array(z.uuid()),
  overlappingHotelBookingIds: z.array(z.tuple([z.uuid(), z.uuid()])),
  activitiesOutsideNewRange: z.array(z.uuid()),
  flightsOutsideNewRange: z.array(z.uuid()),
  transportNeedingReview: z.array(z.uuid()),
  newDaysWithoutPlanning: z.array(z.iso.date()),
});
export type TripDateChangeImpactReport = z.infer<typeof tripDateChangeImpactReportSchema>;
