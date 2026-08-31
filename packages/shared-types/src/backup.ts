import { z } from "zod";
import { tripSchema } from "./trip";
import { placeSchema, tripPlaceSchema } from "./place";
import { plannedActivitySchema } from "./planned-activity";
import { hotelStaySchema, flightSchema, transportBookingSchema, carRentalSchema, insuranceSchema } from "./booking";
import { bookingBenefitSchema } from "./booking-benefit";
import { transportQuoteSchema } from "./transport-quote";
import { expenseSchema } from "./expense";
import { paymentSchema } from "./payment";
import { walletSchema, walletTransactionSchema } from "./wallet";
import { currencyExchangeSchema } from "./currency-exchange";
import { refundSchema } from "./refund";
import { depositSchema } from "./deposit";
import { budgetCategoryLimitSchema } from "./budget-category-limit";
import { documentSchema } from "./document";
import { contactSchema } from "./contact";
import { paymentCardSchema } from "./payment-card";
import { checklistItemSchema } from "./checklist-item";
import { tripCountrySchema, tripCitySchema } from "./trip-geography";
import { tripDaySchema } from "./trip-day";

/**
 * גיבוי מלא לחשבון (#90 Backup Architecture) — Export/Restore קריא-מכונה.
 * מכסה את כל הישויות בבעלות המשתמש שיש להן create() ברור לשחזור. לא כולל
 * WalletTransaction/AuditLog/StatusHistory/NotificationPreference — אלה
 * נגזרים/היסטוריים (ר' הערה ב-restore-backup.ts). formatVersion מאפשר
 * לזהות קובץ ישן אם המבנה ישתנה בעתיד.
 */
export const BACKUP_FORMAT_VERSION = 1;

export const backupFileSchema = z.object({
  formatVersion: z.literal(BACKUP_FORMAT_VERSION),
  exportedAt: z.iso.datetime(),
  trips: z.array(tripSchema),
  places: z.array(placeSchema),
  tripPlaces: z.array(tripPlaceSchema),
  plannedActivities: z.array(plannedActivitySchema),
  hotelStays: z.array(hotelStaySchema),
  flights: z.array(flightSchema),
  transportBookings: z.array(transportBookingSchema),
  carRentals: z.array(carRentalSchema),
  insurances: z.array(insuranceSchema),
  bookingBenefits: z.array(bookingBenefitSchema),
  transportQuotes: z.array(transportQuoteSchema),
  expenses: z.array(expenseSchema),
  payments: z.array(paymentSchema),
  wallets: z.array(walletSchema),
  walletTransactions: z.array(walletTransactionSchema),
  currencyExchanges: z.array(currencyExchangeSchema),
  refunds: z.array(refundSchema),
  deposits: z.array(depositSchema),
  budgetCategoryLimits: z.array(budgetCategoryLimitSchema),
  documents: z.array(documentSchema),
  contacts: z.array(contactSchema),
  paymentCards: z.array(paymentCardSchema),
  checklistItems: z.array(checklistItemSchema),
  tripCountries: z.array(tripCountrySchema),
  tripCities: z.array(tripCitySchema),
  tripDays: z.array(tripDaySchema),
});
export type BackupFile = z.infer<typeof backupFileSchema>;

export interface RestoreSummary {
  restoredCounts: Record<string, number>;
  skipped: Array<{ entity: string; reason: string }>;
}
