import { z } from "zod";
import {
  bookingSourceSchema,
  bookingTypeSchema,
  breakfastPriceUnitSchema,
  flightLegTypeSchema,
  flightLiveStatusSchema,
  lifecycleStatusSchema,
  mealPlanSchema,
  rentalVehicleTypeSchema,
  transportModeSchema,
  vehicleTypeSchema,
} from "./enums";

export const bookingSchema = z.object({
  id: z.uuid(),
  tripId: z.uuid(),
  placeId: z.uuid().nullable(),
  bookingType: bookingTypeSchema,
  status: lifecycleStatusSchema,
  agreedPrice: z.number().nonnegative().nullable(),
  agreedCurrencyCode: z.string().length(3).nullable(),
  source: bookingSourceSchema.nullable(),
  sourceOther: z.string().nullable(),
  providerName: z.string().nullable(),
  externalBookingId: z.string().nullable(),
  confirmationNumber: z.string().nullable(),
  bookingLink: z.url().nullable(),
  manageBookingLink: z.url().nullable(),
  cancellationPolicy: z.string().nullable(),
  phone: z.string().nullable(),
  whatsapp: z.string().nullable(),
  email: z.email().nullable(),
  website: z.url().nullable(),
  notes: z.string().nullable(),
});
export type Booking = z.infer<typeof bookingSchema>;

export const createHotelStayInputSchema = z
  .object({
    tripId: z.uuid(),
    placeId: z.uuid().optional(),
    hotelName: z.string().trim().min(1, "שם המלון הוא שדה חובה"),
    address: z.string().optional(),
    lat: z.number().min(-90).max(90).optional(),
    lng: z.number().min(-180).max(180).optional(),
    checkInDate: z.iso.date("תאריך צ'ק-אין לא תקין"),
    checkOutDate: z.iso.date("תאריך צ'ק-אאוט לא תקין"),
    checkInTime: z.string().optional(),
    checkOutTime: z.string().optional(),
    timezone: z.string().optional(),
    roomType: z.string().optional(),
    bedType: z.string().optional(),
    floor: z.string().optional(),
    view: z.string().optional(),
    smoking: z.boolean().optional(),
    guestsCount: z.number().int().positive().optional(),
    pricePerNight: z.number().nonnegative().optional(),
    agreedPrice: z.number().nonnegative().optional(),
    agreedCurrencyCode: z.string().length(3).optional(),
    mealPlan: mealPlanSchema.optional(),
    breakfastPrice: z.number().nonnegative().optional(),
    breakfastPriceUnit: breakfastPriceUnitSchema.optional(),
    breakfastHours: z.string().optional(),
    breakfastLocation: z.string().optional(),
    earlyCheckIn: z.boolean().optional(),
    lateCheckOut: z.boolean().optional(),
    externalBookingId: z.string().optional(),
    cancellationPolicy: z.string().optional(),
    phone: z.string().optional(),
    whatsapp: z.string().optional(),
    email: z.email().optional(),
    website: z.url().optional(),
    confirmationNumber: z.string().optional(),
    notes: z.string().optional(),
  })
  .refine((data) => data.checkOutDate >= data.checkInDate, {
    message: "תאריך צ'ק-אאוט חייב להיות אחרי תאריך צ'ק-אין",
    path: ["checkOutDate"],
  });
export type CreateHotelStayInput = z.infer<typeof createHotelStayInputSchema>;

// עדכון-חלקי — שדות-הליבה שסביר שמתקנים אחרי-מעשה (עוזר-הצ'אט: "בעצם שילמתי
// 600", "תזיז את הצ'ק-אאוט"). שאר השדות (קומה/נוף/סוג-מיטה וכו') עדיין רק
// בזמן היצירה — לא הורחב מעבר למה שהתבקש בפועל, ר' ההערה המקבילה על TransportBooking.
export const updateHotelStayInputSchema = z.object({
  hotelStayId: z.uuid(),
  hotelName: z.string().trim().min(1).optional(),
  checkInDate: z.iso.date("תאריך צ'ק-אין לא תקין").optional(),
  checkOutDate: z.iso.date("תאריך צ'ק-אאוט לא תקין").optional(),
  agreedPrice: z.number().nonnegative().optional(),
  agreedCurrencyCode: z.string().length(3).optional(),
});
export type UpdateHotelStayInput = z.infer<typeof updateHotelStayInputSchema>;

export const createFlightInputSchema = z
  .object({
    tripId: z.uuid(),
    airline: z.string().trim().min(1, "חברת התעופה היא שדה חובה"),
    flightNumber: z.string().optional(),
    departureAirport: z.string().trim().min(3, "קוד שדה תעופה לא תקין"),
    arrivalAirport: z.string().trim().min(3, "קוד שדה תעופה לא תקין"),
    departureTerminal: z.string().optional(),
    arrivalTerminal: z.string().optional(),
    departureAt: z.iso.datetime("שעת המראה לא תקינה"),
    departureTimezone: z.string().min(1, "אזור זמן יציאה הוא שדה חובה"),
    arrivalAt: z.iso.datetime("שעת נחיתה לא תקינה"),
    arrivalTimezone: z.string().min(1, "אזור זמן נחיתה הוא שדה חובה"),
    seat: z.string().optional(),
    baggage: z.string().optional(),
    legType: flightLegTypeSchema.optional(),
    agreedPrice: z.number().nonnegative().optional(),
    agreedCurrencyCode: z.string().length(3).optional(),
    externalBookingId: z.string().optional(),
    cancellationPolicy: z.string().optional(),
    phone: z.string().optional(),
    whatsapp: z.string().optional(),
    email: z.email().optional(),
    website: z.url().optional(),
    confirmationNumber: z.string().optional(),
    notes: z.string().optional(),
  })
  .refine((data) => data.arrivalAt >= data.departureAt, {
    message: "שעת נחיתה חייבת להיות אחרי שעת המראה",
    path: ["arrivalAt"],
  });
export type CreateFlightInput = z.infer<typeof createFlightInputSchema>;

export const updateFlightInputSchema = z.object({
  flightId: z.uuid(),
  airline: z.string().trim().min(1).optional(),
  departureAt: z.iso.datetime("שעת המראה לא תקינה").optional(),
  arrivalAt: z.iso.datetime("שעת נחיתה לא תקינה").optional(),
  agreedPrice: z.number().nonnegative().optional(),
  agreedCurrencyCode: z.string().length(3).optional(),
});
export type UpdateFlightInput = z.infer<typeof updateFlightInputSchema>;

export const createTransportBookingInputSchema = z.object({
  tripId: z.uuid(),
  mode: transportModeSchema,
  pickupText: z.string().optional(),
  pickupLat: z.number().min(-90).max(90).optional(),
  pickupLng: z.number().min(-180).max(180).optional(),
  dropoffText: z.string().optional(),
  dropoffLat: z.number().min(-90).max(90).optional(),
  dropoffLng: z.number().min(-180).max(180).optional(),
  pickupAt: z.iso.datetime("שעת איסוף לא תקינה"),
  pickupTimezone: z.string().min(1, "אזור זמן איסוף הוא שדה חובה"),
  etaAt: z.iso.datetime("שעת הגעה משוערת לא תקינה").optional(),
  etaTimezone: z.string().optional(),
  passengersCount: z.number().int().positive().optional(),
  luggageCount: z.number().int().nonnegative().optional(),
  vehicleType: vehicleTypeSchema.optional(),
  driverName: z.string().optional(),
  companyName: z.string().optional(),
  vehicleOnBoard: z.string().optional(),
  seat: z.string().optional(),
  tollFees: z.number().nonnegative().optional(),
  parkingFees: z.number().nonnegative().optional(),
  agreedPrice: z.number().nonnegative().optional(),
  agreedCurrencyCode: z.string().length(3).optional(),
  externalBookingId: z.string().optional(),
  cancellationPolicy: z.string().optional(),
  phone: z.string().optional(),
  whatsapp: z.string().optional(),
  email: z.email().optional(),
  website: z.url().optional(),
  notes: z.string().optional(),
  // קישור מפורש (המשתמש בוחר, לא ניחוש לפי תאריך) להסעה-מטיסה — ר' ההערה
  // המקבילה ב-schema.prisma. משמש להודעת "שלח לנהג" עם פרטי-נחיתה אמיתיים.
  linkedFlightId: z.uuid().optional(),
});
export type CreateTransportBookingInput = z.infer<typeof createTransportBookingInputSchema>;

// עדכון-בעריכה של הסעה קיימת — למשל הקדמה/איחור של שעת האיסוף לפני שמעדכנים
// את הנהג. רק השדות שבאמת ניתנים לעריכה מהמסך; שאר השדות (מחיר/אגרות/וכו')
// עדיין רק בזמן היצירה, כדי לא להרחיב את ההיקף מעבר למה שהתבקש בפועל.
export const updateTransportBookingInputSchema = z.object({
  transportBookingId: z.uuid(),
  pickupText: z.string().optional(),
  dropoffText: z.string().optional(),
  // אופציונליים עכשיו (היו חובה) — טופס-העריכה הרגיל תמיד שולח את שניהם
  // (defaultValue מהערך הקיים) אז לא נשבר, אבל עוזר-הצ'אט צריך patch חלקי
  // אמיתי (למשל לשנות רק agreedPrice בלי לדעת/לשלוח מחדש את pickupAt).
  pickupAt: z.iso.datetime("שעת איסוף לא תקינה").optional(),
  pickupTimezone: z.string().min(1, "אזור זמן איסוף הוא שדה חובה").optional(),
  etaAt: z.iso.datetime("שעת הגעה משוערת לא תקינה").optional(),
  etaTimezone: z.string().optional(),
  driverName: z.string().optional(),
  companyName: z.string().optional(),
  phone: z.string().optional(),
  whatsapp: z.string().optional(),
  notes: z.string().optional(),
  linkedFlightId: z.uuid().optional(),
  // הורחב עבור עוזר-הצ'אט ("שילמתי בעצם 600") — לא נחשף בטופס-העריכה הרגיל
  // (edit-transport-booking-form.tsx), רק דרך הכלי update_transport.
  agreedPrice: z.number().nonnegative().optional(),
  agreedCurrencyCode: z.string().length(3).optional(),
});
export type UpdateTransportBookingInput = z.infer<typeof updateTransportBookingInputSchema>;

export const createCarRentalInputSchema = z
  .object({
    tripId: z.uuid(),
    vehicleType: rentalVehicleTypeSchema,
    companyName: z.string().trim().min(1, "שם חברת ההשכרה הוא שדה חובה"),
    model: z.string().optional(),
    licensePlate: z.string().optional(),
    pickupLocationText: z.string().optional(),
    pickupAt: z.iso.datetime("שעת איסוף לא תקינה"),
    pickupTimezone: z.string().min(1, "אזור זמן איסוף הוא שדה חובה"),
    dropoffLocationText: z.string().optional(),
    dropoffAt: z.iso.datetime("שעת החזרה לא תקינה").optional(),
    dropoffTimezone: z.string().optional(),
    driverRequirements: z.string().optional(),
    insuranceIncluded: z.boolean().optional(),
    depositAmount: z.number().nonnegative().optional(),
    depositCurrencyCode: z.string().length(3).optional(),
    agreedPrice: z.number().nonnegative().optional(),
    agreedCurrencyCode: z.string().length(3).optional(),
    externalBookingId: z.string().optional(),
    cancellationPolicy: z.string().optional(),
    phone: z.string().optional(),
    whatsapp: z.string().optional(),
    email: z.email().optional(),
    website: z.url().optional(),
    confirmationNumber: z.string().optional(),
    notes: z.string().optional(),
  })
  .refine((data) => data.dropoffAt === undefined || data.dropoffAt >= data.pickupAt, {
    message: "שעת ההחזרה חייבת להיות אחרי שעת האיסוף",
    path: ["dropoffAt"],
  });
export type CreateCarRentalInput = z.infer<typeof createCarRentalInputSchema>;

export const updateCarRentalInputSchema = z.object({
  carRentalId: z.uuid(),
  companyName: z.string().trim().min(1).optional(),
  pickupAt: z.iso.datetime("שעת איסוף לא תקינה").optional(),
  dropoffAt: z.iso.datetime("שעת החזרה לא תקינה").optional(),
  agreedPrice: z.number().nonnegative().optional(),
  agreedCurrencyCode: z.string().length(3).optional(),
  depositAmount: z.number().nonnegative().optional(),
  depositCurrencyCode: z.string().length(3).optional(),
});
export type UpdateCarRentalInput = z.infer<typeof updateCarRentalInputSchema>;

export const createInsuranceInputSchema = z
  .object({
    tripId: z.uuid(),
    company: z.string().trim().min(1, "שם חברת הביטוח הוא שדה חובה"),
    policyType: z.string().optional(),
    startDate: z.iso.date("תאריך תחילת הביטוח לא תקין"),
    endDate: z.iso.date("תאריך סיום הביטוח לא תקין"),
    policyNumber: z.string().optional(),
    insuredNumber: z.string().optional(),
    coverageNotes: z.string().optional(),
    extensions: z.string().optional(),
    deductible: z.number().nonnegative().optional(),
    emergencyPhone: z.string().optional(),
    emergencyWhatsapp: z.string().optional(),
    emergencyEmail: z.email().optional(),
    emergencyWebsite: z.url().optional(),
    emergencyInstructions: z.string().optional(),
    agreedPrice: z.number().nonnegative().optional(),
    agreedCurrencyCode: z.string().length(3).optional(),
    notes: z.string().optional(),
  })
  .refine((data) => data.endDate >= data.startDate, {
    message: "תאריך סיום חייב להיות אחרי תאריך תחילה",
    path: ["endDate"],
  });
export type CreateInsuranceInput = z.infer<typeof createInsuranceInputSchema>;

export const updateInsuranceInputSchema = z.object({
  insuranceId: z.uuid(),
  company: z.string().trim().min(1).optional(),
  startDate: z.iso.date("תאריך תחילת הביטוח לא תקין").optional(),
  endDate: z.iso.date("תאריך סיום הביטוח לא תקין").optional(),
  policyNumber: z.string().optional(),
  agreedPrice: z.number().nonnegative().optional(),
  agreedCurrencyCode: z.string().length(3).optional(),
});
export type UpdateInsuranceInput = z.infer<typeof updateInsuranceInputSchema>;

export const createActivityReservationInputSchema = z.object({
  tripId: z.uuid(),
  venueName: z.string().trim().min(1, "שם האתר/האטרקציה הוא שדה חובה"),
  activityDate: z.iso.date("תאריך האטרקציה לא תקין"),
  activityTime: z.string().optional(),
  ticketType: z.string().optional(),
  confirmationDetails: z.string().optional(),
  notes: z.string().optional(),
  agreedPrice: z.number().nonnegative().optional(),
  agreedCurrencyCode: z.string().length(3).optional(),
});
export type CreateActivityReservationInput = z.infer<typeof createActivityReservationInputSchema>;

export const updateActivityReservationInputSchema = z.object({
  activityReservationId: z.uuid(),
  venueName: z.string().trim().min(1).optional(),
  activityDate: z.iso.date("תאריך האטרקציה לא תקין").optional(),
  agreedPrice: z.number().nonnegative().optional(),
  agreedCurrencyCode: z.string().length(3).optional(),
});
export type UpdateActivityReservationInput = z.infer<typeof updateActivityReservationInputSchema>;

// --------------------------------------------------------------------------
// טיפוסי קריאה (Booking + פרטי הסוג, משוטח לנוחות שכבת ה-Data Layer).
// ב-Prisma האמיתי אלה שתי טבלאות מחוברות (Booking + HotelStay/Flight/
// TransportBooking) — ראה schema.prisma. השטחה כאן היא נוחות תצוגה בלבד.
// --------------------------------------------------------------------------

export const hotelStaySchema = z.object({
  id: z.uuid(),
  bookingId: z.uuid(),
  tripId: z.uuid(),
  hotelName: z.string(),
  address: z.string().nullable(),
  lat: z.number().nullable(),
  lng: z.number().nullable(),
  checkInDate: z.iso.date(),
  checkOutDate: z.iso.date(),
  checkInTime: z.string().nullable(),
  checkOutTime: z.string().nullable(),
  timezone: z.string().nullable(),
  roomType: z.string().nullable(),
  bedType: z.string().nullable(),
  floor: z.string().nullable(),
  view: z.string().nullable(),
  smoking: z.boolean().nullable(),
  guestsCount: z.number().int().nullable(),
  pricePerNight: z.number().nullable(),
  agreedPrice: z.number().nullable(),
  agreedCurrencyCode: z.string().nullable(),
  mealPlan: mealPlanSchema,
  breakfastPrice: z.number().nullable(),
  breakfastPriceUnit: breakfastPriceUnitSchema.nullable(),
  breakfastHours: z.string().nullable(),
  breakfastLocation: z.string().nullable(),
  earlyCheckIn: z.boolean(),
  lateCheckOut: z.boolean(),
  externalBookingId: z.string().nullable(),
  cancellationPolicy: z.string().nullable(),
  phone: z.string().nullable(),
  whatsapp: z.string().nullable(),
  email: z.string().nullable(),
  website: z.string().nullable(),
  confirmationNumber: z.string().nullable(),
  status: lifecycleStatusSchema,
  notes: z.string().nullable(),
  personalRating: z.number().int().min(1).max(5).nullable(),
  createdAt: z.iso.datetime(),
  deletedAt: z.iso.datetime().nullable(),
});
export type HotelStay = z.infer<typeof hotelStaySchema>;

export const updateHotelStayPersonalRatingInputSchema = z.object({
  hotelStayId: z.uuid(),
  personalRating: z.number().int().min(1).max(5).nullable(),
});
export type UpdateHotelStayPersonalRatingInput = z.infer<typeof updateHotelStayPersonalRatingInputSchema>;

export const flightSchema = z.object({
  id: z.uuid(),
  bookingId: z.uuid(),
  tripId: z.uuid(),
  airline: z.string(),
  flightNumber: z.string().nullable(),
  departureAirport: z.string(),
  arrivalAirport: z.string(),
  departureTerminal: z.string().nullable(),
  arrivalTerminal: z.string().nullable(),
  departureAt: z.iso.datetime(),
  departureTimezone: z.string(),
  arrivalAt: z.iso.datetime(),
  arrivalTimezone: z.string(),
  seat: z.string().nullable(),
  baggage: z.string().nullable(),
  legType: flightLegTypeSchema,
  agreedPrice: z.number().nullable(),
  agreedCurrencyCode: z.string().nullable(),
  externalBookingId: z.string().nullable(),
  cancellationPolicy: z.string().nullable(),
  phone: z.string().nullable(),
  whatsapp: z.string().nullable(),
  email: z.string().nullable(),
  website: z.string().nullable(),
  confirmationNumber: z.string().nullable(),
  status: lifecycleStatusSchema,
  notes: z.string().nullable(),
  airportArrivalLeadMinutes: z.number().int().nullable(),
  travelTimeToAirportMinutes: z.number().int().nullable(),
  checkInWindowHours: z.number().int().nullable(),
  liveStatus: flightLiveStatusSchema.nullable(),
  liveDelayMinutes: z.number().int().nullable(),
  liveStatusCheckedAt: z.iso.datetime().nullable(),
  createdAt: z.iso.datetime(),
  deletedAt: z.iso.datetime().nullable(),
});
export type Flight = z.infer<typeof flightSchema>;

export const setFlightAirportTimingInputSchema = z.object({
  flightId: z.uuid(),
  airportArrivalLeadMinutes: z.number().int().positive(),
  travelTimeToAirportMinutes: z.number().int().positive().nullable(),
});
export type SetFlightAirportTimingInput = z.infer<typeof setFlightAirportTimingInputSchema>;

// חלון-פתיחת-צ'ק-אין — אפשרויות אמיתיות ומוכרות (24/48/72 שעות, ר'
// check-in-window-picker.tsx), לא ברירת-מחדל מומצאת פר-חברת-תעופה.
export const setFlightCheckInWindowInputSchema = z.object({
  flightId: z.uuid(),
  checkInWindowHours: z.number().int().positive(),
});
export type SetFlightCheckInWindowInput = z.infer<typeof setFlightCheckInWindowInputSchema>;

// תוצאת בדיקת-סטטוס אמיתית מ-Aviationstack בלבד — לעולם לא ממציאים סטטוס.
// liveDelayMinutes null = אין מידע-עיכוב (לאו דווקא "בזמן").
export const setFlightLiveStatusInputSchema = z.object({
  flightId: z.uuid(),
  liveStatus: flightLiveStatusSchema,
  liveDelayMinutes: z.number().int().nullable(),
});
export type SetFlightLiveStatusInput = z.infer<typeof setFlightLiveStatusInputSchema>;

export const transportBookingSchema = z.object({
  id: z.uuid(),
  bookingId: z.uuid(),
  tripId: z.uuid(),
  mode: transportModeSchema,
  pickupText: z.string().nullable(),
  dropoffText: z.string().nullable(),
  pickupAt: z.iso.datetime(),
  pickupTimezone: z.string(),
  etaAt: z.iso.datetime().nullable(),
  etaTimezone: z.string().nullable(),
  vehicleType: vehicleTypeSchema.nullable(),
  driverName: z.string().nullable(),
  companyName: z.string().nullable(),
  vehicleOnBoard: z.string().nullable(),
  seat: z.string().nullable(),
  tollFees: z.number().nullable(),
  parkingFees: z.number().nullable(),
  agreedPrice: z.number().nullable(),
  agreedCurrencyCode: z.string().nullable(),
  externalBookingId: z.string().nullable(),
  cancellationPolicy: z.string().nullable(),
  phone: z.string().nullable(),
  whatsapp: z.string().nullable(),
  email: z.string().nullable(),
  website: z.string().nullable(),
  status: lifecycleStatusSchema,
  notes: z.string().nullable(),
  personalRating: z.number().int().min(1).max(5).nullable(),
  linkedFlightId: z.uuid().nullable(),
  createdAt: z.iso.datetime(),
  deletedAt: z.iso.datetime().nullable(),
});
export type TransportBooking = z.infer<typeof transportBookingSchema>;

export const updateTransportBookingPersonalRatingInputSchema = z.object({
  transportBookingId: z.uuid(),
  personalRating: z.number().int().min(1).max(5).nullable(),
});
export type UpdateTransportBookingPersonalRatingInput = z.infer<typeof updateTransportBookingPersonalRatingInputSchema>;

export const carRentalSchema = z.object({
  id: z.uuid(),
  bookingId: z.uuid(),
  tripId: z.uuid(),
  vehicleType: rentalVehicleTypeSchema,
  companyName: z.string(),
  model: z.string().nullable(),
  licensePlate: z.string().nullable(),
  pickupLocationText: z.string().nullable(),
  pickupAt: z.iso.datetime(),
  pickupTimezone: z.string(),
  dropoffLocationText: z.string().nullable(),
  dropoffAt: z.iso.datetime().nullable(),
  dropoffTimezone: z.string().nullable(),
  driverRequirements: z.string().nullable(),
  insuranceIncluded: z.boolean(),
  depositAmount: z.number().nullable(),
  depositCurrencyCode: z.string().nullable(),
  agreedPrice: z.number().nullable(),
  agreedCurrencyCode: z.string().nullable(),
  externalBookingId: z.string().nullable(),
  cancellationPolicy: z.string().nullable(),
  phone: z.string().nullable(),
  whatsapp: z.string().nullable(),
  email: z.string().nullable(),
  website: z.string().nullable(),
  confirmationNumber: z.string().nullable(),
  status: lifecycleStatusSchema,
  notes: z.string().nullable(),
  createdAt: z.iso.datetime(),
  deletedAt: z.iso.datetime().nullable(),
});
export type CarRental = z.infer<typeof carRentalSchema>;

export const insuranceSchema = z.object({
  id: z.uuid(),
  bookingId: z.uuid(),
  tripId: z.uuid(),
  company: z.string(),
  policyType: z.string().nullable(),
  startDate: z.iso.date(),
  endDate: z.iso.date(),
  policyNumber: z.string().nullable(),
  insuredNumber: z.string().nullable(),
  coverageNotes: z.string().nullable(),
  extensions: z.string().nullable(),
  deductible: z.number().nullable(),
  emergencyPhone: z.string().nullable(),
  emergencyWhatsapp: z.string().nullable(),
  emergencyEmail: z.string().nullable(),
  emergencyWebsite: z.string().nullable(),
  emergencyInstructions: z.string().nullable(),
  agreedPrice: z.number().nullable(),
  agreedCurrencyCode: z.string().nullable(),
  status: lifecycleStatusSchema,
  notes: z.string().nullable(),
  createdAt: z.iso.datetime(),
  deletedAt: z.iso.datetime().nullable(),
});
export type Insurance = z.infer<typeof insuranceSchema>;

export const activityReservationSchema = z.object({
  id: z.uuid(),
  bookingId: z.uuid(),
  tripId: z.uuid(),
  venueName: z.string(),
  activityDate: z.iso.date(),
  activityTime: z.string().nullable(),
  ticketType: z.string().nullable(),
  confirmationDetails: z.string().nullable(),
  notes: z.string().nullable(),
  agreedPrice: z.number().nullable(),
  agreedCurrencyCode: z.string().nullable(),
  status: lifecycleStatusSchema,
  createdAt: z.iso.datetime(),
  deletedAt: z.iso.datetime().nullable(),
});
export type ActivityReservation = z.infer<typeof activityReservationSchema>;
