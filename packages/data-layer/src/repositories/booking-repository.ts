import type {
  ActivityReservation,
  BookingBenefit,
  CarRental,
  CreateActivityReservationInput,
  CreateBookingBenefitInput,
  CreateCarRentalInput,
  CreateFlightInput,
  CreateHotelStayInput,
  CreateInsuranceInput,
  CreateTransportBookingInput,
  CreateTransportQuoteInput,
  Flight,
  HotelStay,
  Insurance,
  SetFlightAirportTimingInput,
  SetFlightCheckInWindowInput,
  SetFlightLiveStatusInput,
  TransportBooking,
  TransportQuote,
  UpdateActivityReservationInput,
  UpdateCarRentalInput,
  UpdateFlightInput,
  UpdateHotelStayInput,
  UpdateHotelStayPersonalRatingInput,
  UpdateInsuranceInput,
  UpdateTransportBookingInput,
  UpdateTransportBookingPersonalRatingInput,
} from "@travel-app/shared-types";

/**
 * ארבעת סוגי ההזמנות הראשונים (מלון/טיסה/תחבורה/ביטוח) תחת ריפוזיטורי אחד —
 * כולם "מתבגרים" מ-Booking גנרי באותו אופן (ראה 01_architecture_v2.md
 * סעיף 4). userId מוזרם מ-tripId שכבר אומת מול Trip.userId בשכבת ה-UI
 * (getTripRepository().getById) לפני שמגיעים לכאן.
 */
export interface BookingRepository {
  listHotelStays(params: { tripId: string; includeDeleted?: boolean }): Promise<HotelStay[]>;
  createHotelStay(params: { input: CreateHotelStayInput }): Promise<HotelStay>;
  /** עדכון-חלקי של שדות-ליבה (שם/תאריכים/מחיר) — ר' UpdateHotelStayInput. */
  updateHotelStay(params: { input: UpdateHotelStayInput }): Promise<HotelStay>;
  softDeleteHotelStay(params: { hotelStayId: string }): Promise<HotelStay>;
  restoreHotelStay(params: { hotelStayId: string }): Promise<HotelStay>;
  updateHotelStayPersonalRating(params: { input: UpdateHotelStayPersonalRatingInput }): Promise<HotelStay>;

  listFlights(params: { tripId: string; includeDeleted?: boolean }): Promise<Flight[]>;
  createFlight(params: { input: CreateFlightInput }): Promise<Flight>;
  /** עדכון-חלקי של שדות-ליבה (חברה/שעות/מחיר) — ר' UpdateFlightInput. */
  updateFlight(params: { input: UpdateFlightInput }): Promise<Flight>;
  updateFlightAirportTiming(params: { input: SetFlightAirportTimingInput }): Promise<Flight>;
  /** תוצאת בדיקת-סטטוס אמיתית מ-Aviationstack — ר' checkFlightStatusAction. */
  updateFlightLiveStatus(params: { input: SetFlightLiveStatusInput }): Promise<Flight>;
  updateFlightCheckInWindow(params: { input: SetFlightCheckInWindowInput }): Promise<Flight>;
  softDeleteFlight(params: { flightId: string }): Promise<Flight>;
  restoreFlight(params: { flightId: string }): Promise<Flight>;

  listTransportBookings(params: { tripId: string; includeDeleted?: boolean }): Promise<TransportBooking[]>;
  createTransportBooking(params: { input: CreateTransportBookingInput }): Promise<TransportBooking>;
  /** עריכת פרטי-איסוף (שעה/מקום/נהג) של הסעה קיימת — למשל לפני עדכון הנהג. */
  updateTransportBooking(params: { input: UpdateTransportBookingInput }): Promise<TransportBooking>;
  softDeleteTransportBooking(params: { transportBookingId: string }): Promise<TransportBooking>;
  restoreTransportBooking(params: { transportBookingId: string }): Promise<TransportBooking>;
  updateTransportBookingPersonalRating(params: { input: UpdateTransportBookingPersonalRatingInput }): Promise<TransportBooking>;

  listInsurances(params: { tripId: string; includeDeleted?: boolean }): Promise<Insurance[]>;
  createInsurance(params: { input: CreateInsuranceInput }): Promise<Insurance>;
  /** עדכון-חלקי של שדות-ליבה (חברה/תאריכים/מחיר) — ר' UpdateInsuranceInput. */
  updateInsurance(params: { input: UpdateInsuranceInput }): Promise<Insurance>;
  softDeleteInsurance(params: { insuranceId: string }): Promise<Insurance>;
  restoreInsurance(params: { insuranceId: string }): Promise<Insurance>;

  listActivityReservations(params: { tripId: string; includeDeleted?: boolean }): Promise<ActivityReservation[]>;
  createActivityReservation(params: { input: CreateActivityReservationInput }): Promise<ActivityReservation>;
  /** עדכון-חלקי של שדות-ליבה (שם/תאריך/מחיר) — ר' UpdateActivityReservationInput. */
  updateActivityReservation(params: { input: UpdateActivityReservationInput }): Promise<ActivityReservation>;
  softDeleteActivityReservation(params: { activityReservationId: string }): Promise<ActivityReservation>;
  restoreActivityReservation(params: { activityReservationId: string }): Promise<ActivityReservation>;

  listCarRentals(params: { tripId: string; includeDeleted?: boolean }): Promise<CarRental[]>;
  createCarRental(params: { input: CreateCarRentalInput }): Promise<CarRental>;
  /** עדכון-חלקי של שדות-ליבה (חברה/שעות/מחיר/פיקדון) — ר' UpdateCarRentalInput. */
  updateCarRental(params: { input: UpdateCarRentalInput }): Promise<CarRental>;
  softDeleteCarRental(params: { carRentalId: string }): Promise<CarRental>;
  restoreCarRental(params: { carRentalId: string }): Promise<CarRental>;

  listBookingBenefits(params: { bookingId: string }): Promise<BookingBenefit[]>;
  /** גרסה מקובצת של listBookingBenefits — שאילתה אחת ל-N הזמנות במקום N שאילתות. */
  listBookingBenefitsForBookingIds(params: { bookingIds: string[] }): Promise<BookingBenefit[]>;
  createBookingBenefit(params: { input: CreateBookingBenefitInput }): Promise<BookingBenefit>;
  deleteBookingBenefit(params: { benefitId: string }): Promise<void>;

  /** הצעות מחיר להשוואה בין ספקי תחבורה — לפני הזמנה בפועל, ר' ההערה ב-transport-quote.ts. */
  listTransportQuotes(params: { tripId: string }): Promise<TransportQuote[]>;
  createTransportQuote(params: { input: CreateTransportQuoteInput }): Promise<TransportQuote>;
  toggleTransportQuoteSelected(params: { quoteId: string }): Promise<TransportQuote>;
  deleteTransportQuote(params: { quoteId: string }): Promise<void>;
  /** מקשר הצעת-מחיר להזמנת-תחבורה קונקרטית שנוצרה ממנה (סעיף 90 באפיון). */
  linkTransportQuoteToBooking(params: { quoteId: string; transportBookingId: string }): Promise<TransportQuote>;
}

export class BookingNotFoundError extends Error {
  constructor(id: string) {
    super(`Booking ${id} not found`);
    this.name = "BookingNotFoundError";
  }
}
