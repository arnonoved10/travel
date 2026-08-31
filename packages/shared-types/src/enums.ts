// מראה 1:1 של ה-enums הרלוונטיים לשלב 1 מתוך packages/db/prisma/schema.prisma.
// כל שינוי כאן חייב להישאר מסונכרן עם הסכימה — הם לא מקור אמת עצמאי.
import { z } from "zod";

export const tripStatusSchema = z.enum(["planning", "upcoming", "active", "completed", "archived"]);
export type TripStatus = z.infer<typeof tripStatusSchema>;

// אופציונלי לגמרי (nullable) — נבחר ידנית ביצירה/עריכה, מזין הצעות-אריזה
// לפי-סוג-טיול (ר' packing-trip-type-suggestions.ts). לא משפיע על שום דבר
// אחר באפליקציה.
export const tripTypeSchema = z.enum(["beach", "ski", "city", "nature", "business", "road_trip", "other"]);
export type TripType = z.infer<typeof tripTypeSchema>;

export const loyaltyProgramTypeSchema = z.enum(["airline", "hotel", "car_rental", "other"]);
export type LoyaltyProgramType = z.infer<typeof loyaltyProgramTypeSchema>;

export const integrationServiceSchema = z.enum([
  "booking_com",
  "agoda",
  "hotels_com",
  "expedia",
  "bolt",
  "grab",
  "airline",
  "car_rental_company",
  "insurance_company",
  "other",
]);
export type IntegrationService = z.infer<typeof integrationServiceSchema>;

// oauth_data_portability קיים בסכימה/ב-enum הזה לקראת העתיד (Booking.com Data
// Portability API, ר' PROJECT_REQUIREMENTS.md #24) — נדחה במפורש לשלב שיש
// דומיין/פריסה יציבה. ה-UI היום תומך רק ב-manual_link בפועל.
export const integrationTypeSchema = z.enum(["manual_link", "oauth_data_portability"]);
export type IntegrationType = z.infer<typeof integrationTypeSchema>;

export const placeCategorySchema = z.enum([
  "hotel",
  "restaurant",
  "cafe",
  "bar",
  "mall",
  "shop",
  "massage",
  "attraction",
  "entertainment",
  "beach",
  "nature",
  "river",
  "waterfall",
  "viewpoint",
  "market",
  "airport",
  "port",
  "train_station",
  "hospital",
  "pharmacy",
  "chabad_house",
  "car_rental_company",
  "other",
]);
export type PlaceCategory = z.infer<typeof placeCategorySchema>;

export const tripPlaceStatusSchema = z.enum([
  "want_to_go",
  "planned",
  "visited",
  "not_visited",
  "favorite",
  "dont_return",
]);
export type TripPlaceStatus = z.infer<typeof tripPlaceStatusSchema>;

export const lifecycleStatusSchema = z.enum([
  "want_to_book",
  "planned",
  "need_to_book",
  "booked",
  "partially_paid",
  "paid",
  "done",
  "not_done",
  "postponed",
  "cancelled",
]);
export type LifecycleStatus = z.infer<typeof lifecycleStatusSchema>;

export const bookingTypeSchema = z.enum([
  "hotel_stay",
  "flight",
  "transport",
  "car_rental",
  "insurance",
  "activity_reservation",
  "other",
]);
export type BookingType = z.infer<typeof bookingTypeSchema>;

export const bookingSourceSchema = z.enum([
  "booking_com",
  "agoda",
  "hotels_com",
  "expedia",
  "hotel_website",
  "direct",
  "agent",
  "bolt",
  "grab",
  "other",
]);
export type BookingSource = z.infer<typeof bookingSourceSchema>;

export const mealPlanSchema = z.enum([
  "none",
  "breakfast_included",
  "breakfast_paid",
  "half_board",
  "full_board",
  "all_inclusive",
]);
export type MealPlan = z.infer<typeof mealPlanSchema>;

export const breakfastPriceUnitSchema = z.enum(["per_person", "per_room", "per_day", "per_stay"]);
export type BreakfastPriceUnit = z.infer<typeof breakfastPriceUnitSchema>;

export const flightLegTypeSchema = z.enum(["outbound", "return", "internal", "connecting"]);
export type FlightLegType = z.infer<typeof flightLegTypeSchema>;

// ערכי flight_status האמיתיים שמחזיר Aviationstack, ר' apps/web/lib/flight-status/.
// "unknown" הוא הערך היחיד שאנחנו ממציאים — כשה-API מחזיר משהו לא-צפוי, לא
// דוחסים אותו לאחד הערכים האמיתיים.
export const flightLiveStatusSchema = z.enum(["scheduled", "active", "landed", "cancelled", "diverted", "incident", "unknown"]);
export type FlightLiveStatus = z.infer<typeof flightLiveStatusSchema>;

export const transportModeSchema = z.enum([
  "taxi",
  "private_transfer",
  "ferry",
  "train",
  "bus",
  "water_taxi",
  "other",
]);
export type TransportMode = z.infer<typeof transportModeSchema>;

export const vehicleTypeSchema = z.enum([
  "small",
  "sedan",
  "large",
  "suv",
  "minivan",
  "van",
  "luxury",
  "vip",
  "other",
]);
export type VehicleType = z.infer<typeof vehicleTypeSchema>;

export const rentalVehicleTypeSchema = z.enum(["car", "motorbike", "scooter", "bicycle", "jet_ski", "other"]);
export type RentalVehicleType = z.infer<typeof rentalVehicleTypeSchema>;

// טקסט חופשי בכוונה — לא enum סגור. הוחלט 2026-08-15: קטגוריית הוצאה
// חייבת להיות דינמית כדי שאפשר יהיה להוסיף קטגוריה חדשה בלי migration.
// DEFAULT_EXPENSE_CATEGORIES למטה הן רק הצעות ל-UI (datalist), לא אכיפה.
export const expenseCategorySchema = z.string().trim().min(1, "יש לבחור או להזין קטגוריה");
export type ExpenseCategory = z.infer<typeof expenseCategorySchema>;

export const DEFAULT_EXPENSE_CATEGORIES = [
  "hotel",
  "flight",
  "transport",
  "car_rental",
  "food",
  "cafe",
  "bar",
  "massage",
  "shopping",
  "fruit",
  "attraction",
  "insurance",
  "tip",
  "tourist_tax",
  "other",
] as const;

export const tipCategorySchema = z.enum([
  "cleaner",
  "bellboy",
  "waiter",
  "driver",
  "masseur",
  "guide",
  "hotel_staff",
  "other",
]);
export type TipCategory = z.infer<typeof tipCategorySchema>;

export const paymentMethodSchema = z.enum(["cash", "credit_card", "debit_card", "digital_wallet", "bank_transfer", "other"]);
export type PaymentMethod = z.infer<typeof paymentMethodSchema>;

export const walletTxTypeSchema = z.enum([
  "cash_payment_out",
  "top_up",
  "exchange_out",
  "exchange_in",
  "refund_in",
  "deposit_out",
  "deposit_return_in",
  "adjustment",
]);
export type WalletTxType = z.infer<typeof walletTxTypeSchema>;

export const documentEntityTypeSchema = z.enum([
  "booking",
  "expense",
  "payment",
  "hotel_stay",
  "flight",
  "transport_booking",
  "insurance",
  "activity_reservation",
  "car_rental",
  "place",
  "planned_activity",
  "trip",
  "trip_day",
  "other",
]);
export type DocumentEntityType = z.infer<typeof documentEntityTypeSchema>;

export const documentTypeSchema = z.enum([
  "booking_confirmation",
  "receipt",
  "invoice",
  "payment_confirmation",
  "voucher",
  "ticket",
  "policy",
  "contract",
  "screenshot",
  "image",
  "pdf",
  "passport_copy",
  "other",
]);
export type DocumentType = z.infer<typeof documentTypeSchema>;

export const dataSourceSchema = z.enum(["manual", "document", "ocr", "api", "imported", "ai_suggested"]);
export type DataSource = z.infer<typeof dataSourceSchema>;

export const ocrStatusSchema = z.enum(["pending", "parsed", "needs_confirmation", "confirmed", "failed"]);
export type OcrStatus = z.infer<typeof ocrStatusSchema>;

export const contactCategorySchema = z.enum([
  "hotel",
  "driver",
  "taxi_company",
  "insurance",
  "rental_company",
  "airline",
  "ferry",
  "guide",
  "agent",
  "attraction",
  "other",
]);
export type ContactCategory = z.infer<typeof contactCategorySchema>;

export const travelModeSchema = z.enum(["walk", "taxi", "public_transport", "rental_car", "other"]);
export type TravelMode = z.infer<typeof travelModeSchema>;

export const checklistListTypeSchema = z.enum(["packing", "before_trip"]);
export type ChecklistListType = z.infer<typeof checklistListTypeSchema>;

export const auditActionSchema = z.enum(["create", "update", "delete", "status_change"]);
export type AuditAction = z.infer<typeof auditActionSchema>;

export const benefitTypeSchema = z.enum([
  "breakfast",
  "airport_transfer",
  "early_checkin",
  "late_checkout",
  "room_upgrade",
  "lounge_access",
  "parking",
  "wifi",
  "pool_access",
  "gym",
  "spa",
  "hotel_credit",
  "meals",
  "drinks",
  "free_cancellation",
  "taxes_included",
  "other",
]);
export type BenefitType = z.infer<typeof benefitTypeSchema>;

export const notificationEventTypeSchema = z.enum([
  "flight_approaching",
  "need_to_leave_for_airport",
  "taxi_approaching",
  "checkout_approaching",
  "unpaid_booking",
  "night_without_hotel",
  "activity_not_booked",
  "deposit_due_return",
  "insurance_ending",
  "overdue_not_marked_done",
  "flight_checkin_open",
]);
export type NotificationEventType = z.infer<typeof notificationEventTypeSchema>;
