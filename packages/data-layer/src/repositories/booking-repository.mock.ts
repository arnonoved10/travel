import { randomUUID } from "node:crypto";
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
import {
  createActivityReservationInputSchema,
  createBookingBenefitInputSchema,
  createCarRentalInputSchema,
  createFlightInputSchema,
  createHotelStayInputSchema,
  createInsuranceInputSchema,
  createTransportBookingInputSchema,
  createTransportQuoteInputSchema,
  setFlightAirportTimingInputSchema,
  setFlightCheckInWindowInputSchema,
  setFlightLiveStatusInputSchema,
  updateActivityReservationInputSchema,
  updateCarRentalInputSchema,
  updateFlightInputSchema,
  updateHotelStayInputSchema,
  updateHotelStayPersonalRatingInputSchema,
  updateInsuranceInputSchema,
  updateTransportBookingInputSchema,
  updateTransportBookingPersonalRatingInputSchema,
} from "@travel-app/shared-types";
import { BookingNotFoundError, type BookingRepository } from "./booking-repository";

const DEMO_TRIP_ID = "00000000-0000-4000-8000-000000000101"; // [דמו] טיול לתאילנד

export class MockBookingRepository implements BookingRepository {
  private hotelStays = new Map<string, HotelStay>();
  private flights = new Map<string, Flight>();
  private transportBookings = new Map<string, TransportBooking>();
  private insurances = new Map<string, Insurance>();
  private activityReservations = new Map<string, ActivityReservation>();
  private carRentals = new Map<string, CarRental>();
  private bookingBenefits = new Map<string, BookingBenefit>();
  private transportQuotes = new Map<string, TransportQuote>();

  constructor() {
    this.seed();
  }

  private seed(): void {
    const now = new Date().toISOString();

    const hotel: HotelStay = {
      id: randomUUID(),
      bookingId: randomUUID(),
      tripId: DEMO_TRIP_ID,
      hotelName: "[דמו] מלון סנטרל בנגקוק",
      address: null,
      lat: 13.7563,
      lng: 100.5018,
      checkInDate: "2026-12-01",
      checkOutDate: "2026-12-08",
      checkInTime: "14:00",
      checkOutTime: "11:00",
      timezone: "Asia/Bangkok",
      roomType: "Deluxe",
      bedType: "King",
      floor: null,
      view: null,
      smoking: false,
      guestsCount: 2,
      pricePerNight: 1200,
      agreedPrice: 8400,
      agreedCurrencyCode: "THB",
      mealPlan: "breakfast_included",
      breakfastPrice: null,
      breakfastPriceUnit: null,
      breakfastHours: null,
      breakfastLocation: null,
      earlyCheckIn: false,
      lateCheckOut: false,
      externalBookingId: null,
      cancellationPolicy: null,
      phone: null,
      whatsapp: null,
      email: null,
      website: null,
      confirmationNumber: "DEMO-HTL-001",
      status: "booked",
      notes: "נתוני דמה לצורך פיתוח UI בלבד.",
      personalRating: null,
      createdAt: now,
      deletedAt: null,
    };
    this.hotelStays.set(hotel.id, hotel);

    const flight: Flight = {
      id: randomUUID(),
      bookingId: randomUUID(),
      tripId: DEMO_TRIP_ID,
      airline: "[דמו] El Al",
      flightNumber: "LY83",
      departureAirport: "TLV",
      arrivalAirport: "BKK",
      departureTerminal: null,
      arrivalTerminal: null,
      departureAt: "2026-12-01T02:30:00.000Z",
      departureTimezone: "Asia/Jerusalem",
      arrivalAt: "2026-12-01T15:45:00.000Z",
      arrivalTimezone: "Asia/Bangkok",
      seat: "14A",
      baggage: null,
      legType: "outbound",
      agreedPrice: null,
      agreedCurrencyCode: null,
      externalBookingId: null,
      cancellationPolicy: null,
      phone: null,
      whatsapp: null,
      email: null,
      website: null,
      confirmationNumber: "DEMO-FLT-001",
      status: "booked",
      notes: "נתוני דמה לצורך פיתוח UI בלבד.",
      airportArrivalLeadMinutes: null,
      travelTimeToAirportMinutes: null,
      checkInWindowHours: null,
      liveStatus: null,
      liveDelayMinutes: null,
      liveStatusCheckedAt: null,
      createdAt: now,
      deletedAt: null,
    };
    this.flights.set(flight.id, flight);

    const quoteA: TransportQuote = {
      id: randomUUID(),
      tripId: DEMO_TRIP_ID,
      transportBookingId: null,
      provider: "[דמו] Bangkok Airport Transfer",
      price: 1200,
      currencyCode: "THB",
      vehicleType: "sedan",
      terms: "כולל המתנה של 60 דקות",
      notes: null,
      isSelected: false,
      createdAt: now,
    };
    this.transportQuotes.set(quoteA.id, quoteA);

    const quoteB: TransportQuote = {
      id: randomUUID(),
      tripId: DEMO_TRIP_ID,
      transportBookingId: null,
      provider: "[דמו] Grab",
      price: 850,
      currencyCode: "THB",
      vehicleType: "sedan",
      terms: null,
      notes: "מחיר משוער, תלוי בעומס תנועה",
      isSelected: false,
      createdAt: now,
    };
    this.transportQuotes.set(quoteB.id, quoteB);
  }

  async listHotelStays({ tripId, includeDeleted = false }: { tripId: string; includeDeleted?: boolean }): Promise<HotelStay[]> {
    return Array.from(this.hotelStays.values())
      .filter((h) => h.tripId === tripId && (includeDeleted || h.deletedAt === null))
      .sort((a, b) => a.checkInDate.localeCompare(b.checkInDate));
  }

  async createHotelStay({ input }: { input: CreateHotelStayInput }): Promise<HotelStay> {
    const parsed = createHotelStayInputSchema.parse(input);
    const hotel: HotelStay = {
      id: randomUUID(),
      bookingId: randomUUID(),
      tripId: parsed.tripId,
      hotelName: parsed.hotelName,
      address: parsed.address ?? null,
      lat: parsed.lat ?? null,
      lng: parsed.lng ?? null,
      checkInDate: parsed.checkInDate,
      checkOutDate: parsed.checkOutDate,
      checkInTime: parsed.checkInTime ?? null,
      checkOutTime: parsed.checkOutTime ?? null,
      timezone: parsed.timezone ?? null,
      roomType: parsed.roomType ?? null,
      bedType: parsed.bedType ?? null,
      floor: parsed.floor ?? null,
      view: parsed.view ?? null,
      smoking: parsed.smoking ?? null,
      guestsCount: parsed.guestsCount ?? null,
      pricePerNight: parsed.pricePerNight ?? null,
      agreedPrice: parsed.agreedPrice ?? null,
      agreedCurrencyCode: parsed.agreedCurrencyCode ?? null,
      mealPlan: parsed.mealPlan ?? "none",
      breakfastPrice: parsed.breakfastPrice ?? null,
      breakfastPriceUnit: parsed.breakfastPriceUnit ?? null,
      breakfastHours: parsed.breakfastHours ?? null,
      breakfastLocation: parsed.breakfastLocation ?? null,
      earlyCheckIn: parsed.earlyCheckIn ?? false,
      lateCheckOut: parsed.lateCheckOut ?? false,
      externalBookingId: parsed.externalBookingId ?? null,
      cancellationPolicy: parsed.cancellationPolicy ?? null,
      phone: parsed.phone ?? null,
      whatsapp: parsed.whatsapp ?? null,
      email: parsed.email ?? null,
      website: parsed.website ?? null,
      confirmationNumber: parsed.confirmationNumber ?? null,
      status: "booked",
      notes: parsed.notes ?? null,
      personalRating: null,
      createdAt: new Date().toISOString(),
      deletedAt: null,
    };
    this.hotelStays.set(hotel.id, hotel);
    return hotel;
  }

  async updateHotelStay({ input }: { input: UpdateHotelStayInput }): Promise<HotelStay> {
    const parsed = updateHotelStayInputSchema.parse(input);
    const existing = this.hotelStays.get(parsed.hotelStayId);
    if (!existing) throw new BookingNotFoundError(parsed.hotelStayId);
    const updated: HotelStay = {
      ...existing,
      hotelName: parsed.hotelName ?? existing.hotelName,
      checkInDate: parsed.checkInDate ?? existing.checkInDate,
      checkOutDate: parsed.checkOutDate ?? existing.checkOutDate,
      agreedPrice: parsed.agreedPrice ?? existing.agreedPrice,
      agreedCurrencyCode: parsed.agreedCurrencyCode ?? existing.agreedCurrencyCode,
    };
    this.hotelStays.set(parsed.hotelStayId, updated);
    return updated;
  }

  async softDeleteHotelStay({ hotelStayId }: { hotelStayId: string }): Promise<HotelStay> {
    const existing = this.hotelStays.get(hotelStayId);
    if (!existing) throw new BookingNotFoundError(hotelStayId);
    const updated: HotelStay = { ...existing, deletedAt: new Date().toISOString() };
    this.hotelStays.set(hotelStayId, updated);
    return updated;
  }

  async restoreHotelStay({ hotelStayId }: { hotelStayId: string }): Promise<HotelStay> {
    const existing = this.hotelStays.get(hotelStayId);
    if (!existing) throw new BookingNotFoundError(hotelStayId);
    const updated: HotelStay = { ...existing, deletedAt: null };
    this.hotelStays.set(hotelStayId, updated);
    return updated;
  }

  async updateHotelStayPersonalRating({ input }: { input: UpdateHotelStayPersonalRatingInput }): Promise<HotelStay> {
    const parsed = updateHotelStayPersonalRatingInputSchema.parse(input);
    const existing = this.hotelStays.get(parsed.hotelStayId);
    if (!existing) throw new BookingNotFoundError(parsed.hotelStayId);
    const updated: HotelStay = { ...existing, personalRating: parsed.personalRating };
    this.hotelStays.set(parsed.hotelStayId, updated);
    return updated;
  }

  async listFlights({ tripId, includeDeleted = false }: { tripId: string; includeDeleted?: boolean }): Promise<Flight[]> {
    return Array.from(this.flights.values())
      .filter((f) => f.tripId === tripId && (includeDeleted || f.deletedAt === null))
      .sort((a, b) => a.departureAt.localeCompare(b.departureAt));
  }

  async createFlight({ input }: { input: CreateFlightInput }): Promise<Flight> {
    const parsed = createFlightInputSchema.parse(input);
    const flight: Flight = {
      id: randomUUID(),
      bookingId: randomUUID(),
      tripId: parsed.tripId,
      airline: parsed.airline,
      flightNumber: parsed.flightNumber ?? null,
      departureAirport: parsed.departureAirport,
      arrivalAirport: parsed.arrivalAirport,
      departureTerminal: parsed.departureTerminal ?? null,
      arrivalTerminal: parsed.arrivalTerminal ?? null,
      departureAt: parsed.departureAt,
      departureTimezone: parsed.departureTimezone,
      arrivalAt: parsed.arrivalAt,
      arrivalTimezone: parsed.arrivalTimezone,
      seat: parsed.seat ?? null,
      baggage: parsed.baggage ?? null,
      legType: parsed.legType ?? "outbound",
      agreedPrice: parsed.agreedPrice ?? null,
      agreedCurrencyCode: parsed.agreedCurrencyCode ?? null,
      externalBookingId: parsed.externalBookingId ?? null,
      cancellationPolicy: parsed.cancellationPolicy ?? null,
      phone: parsed.phone ?? null,
      whatsapp: parsed.whatsapp ?? null,
      email: parsed.email ?? null,
      website: parsed.website ?? null,
      confirmationNumber: parsed.confirmationNumber ?? null,
      status: "booked",
      notes: parsed.notes ?? null,
      airportArrivalLeadMinutes: null,
      travelTimeToAirportMinutes: null,
      checkInWindowHours: null,
      liveStatus: null,
      liveDelayMinutes: null,
      liveStatusCheckedAt: null,
      createdAt: new Date().toISOString(),
      deletedAt: null,
    };
    this.flights.set(flight.id, flight);
    return flight;
  }

  async updateFlightAirportTiming({ input }: { input: SetFlightAirportTimingInput }): Promise<Flight> {
    const parsed = setFlightAirportTimingInputSchema.parse(input);
    const existing = this.flights.get(parsed.flightId);
    if (!existing) throw new BookingNotFoundError(parsed.flightId);
    const updated: Flight = {
      ...existing,
      airportArrivalLeadMinutes: parsed.airportArrivalLeadMinutes,
      travelTimeToAirportMinutes: parsed.travelTimeToAirportMinutes,
    };
    this.flights.set(parsed.flightId, updated);
    return updated;
  }

  async updateFlightCheckInWindow({ input }: { input: SetFlightCheckInWindowInput }): Promise<Flight> {
    const parsed = setFlightCheckInWindowInputSchema.parse(input);
    const existing = this.flights.get(parsed.flightId);
    if (!existing) throw new BookingNotFoundError(parsed.flightId);
    const updated: Flight = { ...existing, checkInWindowHours: parsed.checkInWindowHours };
    this.flights.set(parsed.flightId, updated);
    return updated;
  }

  async updateFlightLiveStatus({ input }: { input: SetFlightLiveStatusInput }): Promise<Flight> {
    const parsed = setFlightLiveStatusInputSchema.parse(input);
    const existing = this.flights.get(parsed.flightId);
    if (!existing) throw new BookingNotFoundError(parsed.flightId);
    const updated: Flight = {
      ...existing,
      liveStatus: parsed.liveStatus,
      liveDelayMinutes: parsed.liveDelayMinutes,
      liveStatusCheckedAt: new Date().toISOString(),
    };
    this.flights.set(parsed.flightId, updated);
    return updated;
  }

  async updateFlight({ input }: { input: UpdateFlightInput }): Promise<Flight> {
    const parsed = updateFlightInputSchema.parse(input);
    const existing = this.flights.get(parsed.flightId);
    if (!existing) throw new BookingNotFoundError(parsed.flightId);
    const updated: Flight = {
      ...existing,
      airline: parsed.airline ?? existing.airline,
      departureAt: parsed.departureAt ?? existing.departureAt,
      arrivalAt: parsed.arrivalAt ?? existing.arrivalAt,
      agreedPrice: parsed.agreedPrice ?? existing.agreedPrice,
      agreedCurrencyCode: parsed.agreedCurrencyCode ?? existing.agreedCurrencyCode,
    };
    this.flights.set(parsed.flightId, updated);
    return updated;
  }

  async softDeleteFlight({ flightId }: { flightId: string }): Promise<Flight> {
    const existing = this.flights.get(flightId);
    if (!existing) throw new BookingNotFoundError(flightId);
    const updated: Flight = { ...existing, deletedAt: new Date().toISOString() };
    this.flights.set(flightId, updated);
    return updated;
  }

  async restoreFlight({ flightId }: { flightId: string }): Promise<Flight> {
    const existing = this.flights.get(flightId);
    if (!existing) throw new BookingNotFoundError(flightId);
    const updated: Flight = { ...existing, deletedAt: null };
    this.flights.set(flightId, updated);
    return updated;
  }

  async listTransportBookings({ tripId, includeDeleted = false }: { tripId: string; includeDeleted?: boolean }): Promise<TransportBooking[]> {
    return Array.from(this.transportBookings.values())
      .filter((t) => t.tripId === tripId && (includeDeleted || t.deletedAt === null))
      .sort((a, b) => a.pickupAt.localeCompare(b.pickupAt));
  }

  async createTransportBooking({ input }: { input: CreateTransportBookingInput }): Promise<TransportBooking> {
    const parsed = createTransportBookingInputSchema.parse(input);
    const transportBooking: TransportBooking = {
      id: randomUUID(),
      bookingId: randomUUID(),
      tripId: parsed.tripId,
      mode: parsed.mode,
      pickupText: parsed.pickupText ?? null,
      dropoffText: parsed.dropoffText ?? null,
      pickupAt: parsed.pickupAt,
      pickupTimezone: parsed.pickupTimezone,
      etaAt: parsed.etaAt ?? null,
      etaTimezone: parsed.etaTimezone ?? null,
      vehicleType: parsed.vehicleType ?? null,
      driverName: parsed.driverName ?? null,
      companyName: parsed.companyName ?? null,
      vehicleOnBoard: parsed.vehicleOnBoard ?? null,
      seat: parsed.seat ?? null,
      tollFees: parsed.tollFees ?? null,
      parkingFees: parsed.parkingFees ?? null,
      agreedPrice: parsed.agreedPrice ?? null,
      agreedCurrencyCode: parsed.agreedCurrencyCode ?? null,
      externalBookingId: parsed.externalBookingId ?? null,
      cancellationPolicy: parsed.cancellationPolicy ?? null,
      phone: parsed.phone ?? null,
      whatsapp: parsed.whatsapp ?? null,
      email: parsed.email ?? null,
      website: parsed.website ?? null,
      status: "booked",
      notes: parsed.notes ?? null,
      personalRating: null,
      linkedFlightId: parsed.linkedFlightId ?? null,
      createdAt: new Date().toISOString(),
      deletedAt: null,
    };
    this.transportBookings.set(transportBooking.id, transportBooking);
    return transportBooking;
  }

  async updateTransportBooking({ input }: { input: UpdateTransportBookingInput }): Promise<TransportBooking> {
    const parsed = updateTransportBookingInputSchema.parse(input);
    const existing = this.transportBookings.get(parsed.transportBookingId);
    if (!existing) throw new BookingNotFoundError(parsed.transportBookingId);
    const updated: TransportBooking = {
      ...existing,
      pickupText: parsed.pickupText ?? existing.pickupText,
      dropoffText: parsed.dropoffText ?? existing.dropoffText,
      pickupAt: parsed.pickupAt ?? existing.pickupAt,
      pickupTimezone: parsed.pickupTimezone ?? existing.pickupTimezone,
      etaAt: parsed.etaAt ?? existing.etaAt,
      etaTimezone: parsed.etaTimezone ?? existing.etaTimezone,
      driverName: parsed.driverName ?? existing.driverName,
      companyName: parsed.companyName ?? existing.companyName,
      phone: parsed.phone ?? existing.phone,
      whatsapp: parsed.whatsapp ?? existing.whatsapp,
      notes: parsed.notes ?? existing.notes,
      linkedFlightId: parsed.linkedFlightId !== undefined ? parsed.linkedFlightId : existing.linkedFlightId,
      agreedPrice: parsed.agreedPrice ?? existing.agreedPrice,
      agreedCurrencyCode: parsed.agreedCurrencyCode ?? existing.agreedCurrencyCode,
    };
    this.transportBookings.set(parsed.transportBookingId, updated);
    return updated;
  }

  async softDeleteTransportBooking({ transportBookingId }: { transportBookingId: string }): Promise<TransportBooking> {
    const existing = this.transportBookings.get(transportBookingId);
    if (!existing) throw new BookingNotFoundError(transportBookingId);
    const updated: TransportBooking = { ...existing, deletedAt: new Date().toISOString() };
    this.transportBookings.set(transportBookingId, updated);
    return updated;
  }

  async restoreTransportBooking({ transportBookingId }: { transportBookingId: string }): Promise<TransportBooking> {
    const existing = this.transportBookings.get(transportBookingId);
    if (!existing) throw new BookingNotFoundError(transportBookingId);
    const updated: TransportBooking = { ...existing, deletedAt: null };
    this.transportBookings.set(transportBookingId, updated);
    return updated;
  }

  async updateTransportBookingPersonalRating({
    input,
  }: {
    input: UpdateTransportBookingPersonalRatingInput;
  }): Promise<TransportBooking> {
    const parsed = updateTransportBookingPersonalRatingInputSchema.parse(input);
    const existing = this.transportBookings.get(parsed.transportBookingId);
    if (!existing) throw new BookingNotFoundError(parsed.transportBookingId);
    const updated: TransportBooking = { ...existing, personalRating: parsed.personalRating };
    this.transportBookings.set(parsed.transportBookingId, updated);
    return updated;
  }

  async listInsurances({ tripId, includeDeleted = false }: { tripId: string; includeDeleted?: boolean }): Promise<Insurance[]> {
    return Array.from(this.insurances.values())
      .filter((i) => i.tripId === tripId && (includeDeleted || i.deletedAt === null))
      .sort((a, b) => a.startDate.localeCompare(b.startDate));
  }

  async createInsurance({ input }: { input: CreateInsuranceInput }): Promise<Insurance> {
    const parsed = createInsuranceInputSchema.parse(input);
    const insurance: Insurance = {
      id: randomUUID(),
      bookingId: randomUUID(),
      tripId: parsed.tripId,
      company: parsed.company,
      policyType: parsed.policyType ?? null,
      startDate: parsed.startDate,
      endDate: parsed.endDate,
      policyNumber: parsed.policyNumber ?? null,
      insuredNumber: parsed.insuredNumber ?? null,
      coverageNotes: parsed.coverageNotes ?? null,
      extensions: parsed.extensions ?? null,
      deductible: parsed.deductible ?? null,
      emergencyPhone: parsed.emergencyPhone ?? null,
      emergencyWhatsapp: parsed.emergencyWhatsapp ?? null,
      emergencyEmail: parsed.emergencyEmail ?? null,
      emergencyWebsite: parsed.emergencyWebsite ?? null,
      emergencyInstructions: parsed.emergencyInstructions ?? null,
      agreedPrice: parsed.agreedPrice ?? null,
      agreedCurrencyCode: parsed.agreedCurrencyCode ?? null,
      status: "booked",
      notes: parsed.notes ?? null,
      createdAt: new Date().toISOString(),
      deletedAt: null,
    };
    this.insurances.set(insurance.id, insurance);
    return insurance;
  }

  async updateInsurance({ input }: { input: UpdateInsuranceInput }): Promise<Insurance> {
    const parsed = updateInsuranceInputSchema.parse(input);
    const existing = this.insurances.get(parsed.insuranceId);
    if (!existing) throw new BookingNotFoundError(parsed.insuranceId);
    const updated: Insurance = {
      ...existing,
      company: parsed.company ?? existing.company,
      startDate: parsed.startDate ?? existing.startDate,
      endDate: parsed.endDate ?? existing.endDate,
      policyNumber: parsed.policyNumber ?? existing.policyNumber,
      agreedPrice: parsed.agreedPrice ?? existing.agreedPrice,
      agreedCurrencyCode: parsed.agreedCurrencyCode ?? existing.agreedCurrencyCode,
    };
    this.insurances.set(parsed.insuranceId, updated);
    return updated;
  }

  async softDeleteInsurance({ insuranceId }: { insuranceId: string }): Promise<Insurance> {
    const existing = this.insurances.get(insuranceId);
    if (!existing) throw new BookingNotFoundError(insuranceId);
    const updated: Insurance = { ...existing, deletedAt: new Date().toISOString() };
    this.insurances.set(insuranceId, updated);
    return updated;
  }

  async restoreInsurance({ insuranceId }: { insuranceId: string }): Promise<Insurance> {
    const existing = this.insurances.get(insuranceId);
    if (!existing) throw new BookingNotFoundError(insuranceId);
    const updated: Insurance = { ...existing, deletedAt: null };
    this.insurances.set(insuranceId, updated);
    return updated;
  }

  async listActivityReservations({
    tripId,
    includeDeleted = false,
  }: {
    tripId: string;
    includeDeleted?: boolean;
  }): Promise<ActivityReservation[]> {
    return Array.from(this.activityReservations.values())
      .filter((a) => a.tripId === tripId && (includeDeleted || a.deletedAt === null))
      .sort((a, b) => a.activityDate.localeCompare(b.activityDate));
  }

  async createActivityReservation({ input }: { input: CreateActivityReservationInput }): Promise<ActivityReservation> {
    const parsed = createActivityReservationInputSchema.parse(input);
    const activityReservation: ActivityReservation = {
      id: randomUUID(),
      bookingId: randomUUID(),
      tripId: parsed.tripId,
      venueName: parsed.venueName,
      activityDate: parsed.activityDate,
      activityTime: parsed.activityTime ?? null,
      ticketType: parsed.ticketType ?? null,
      confirmationDetails: parsed.confirmationDetails ?? null,
      agreedPrice: parsed.agreedPrice ?? null,
      agreedCurrencyCode: parsed.agreedCurrencyCode ?? null,
      status: "booked",
      notes: parsed.notes ?? null,
      createdAt: new Date().toISOString(),
      deletedAt: null,
    };
    this.activityReservations.set(activityReservation.id, activityReservation);
    return activityReservation;
  }

  async updateActivityReservation({ input }: { input: UpdateActivityReservationInput }): Promise<ActivityReservation> {
    const parsed = updateActivityReservationInputSchema.parse(input);
    const existing = this.activityReservations.get(parsed.activityReservationId);
    if (!existing) throw new BookingNotFoundError(parsed.activityReservationId);
    const updated: ActivityReservation = {
      ...existing,
      venueName: parsed.venueName ?? existing.venueName,
      activityDate: parsed.activityDate ?? existing.activityDate,
      agreedPrice: parsed.agreedPrice ?? existing.agreedPrice,
      agreedCurrencyCode: parsed.agreedCurrencyCode ?? existing.agreedCurrencyCode,
    };
    this.activityReservations.set(parsed.activityReservationId, updated);
    return updated;
  }

  async softDeleteActivityReservation({ activityReservationId }: { activityReservationId: string }): Promise<ActivityReservation> {
    const existing = this.activityReservations.get(activityReservationId);
    if (!existing) throw new BookingNotFoundError(activityReservationId);
    const updated: ActivityReservation = { ...existing, deletedAt: new Date().toISOString() };
    this.activityReservations.set(activityReservationId, updated);
    return updated;
  }

  async restoreActivityReservation({ activityReservationId }: { activityReservationId: string }): Promise<ActivityReservation> {
    const existing = this.activityReservations.get(activityReservationId);
    if (!existing) throw new BookingNotFoundError(activityReservationId);
    const updated: ActivityReservation = { ...existing, deletedAt: null };
    this.activityReservations.set(activityReservationId, updated);
    return updated;
  }

  async listCarRentals({ tripId, includeDeleted = false }: { tripId: string; includeDeleted?: boolean }): Promise<CarRental[]> {
    return Array.from(this.carRentals.values())
      .filter((c) => c.tripId === tripId && (includeDeleted || c.deletedAt === null))
      .sort((a, b) => a.pickupAt.localeCompare(b.pickupAt));
  }

  async createCarRental({ input }: { input: CreateCarRentalInput }): Promise<CarRental> {
    const parsed = createCarRentalInputSchema.parse(input);
    const carRental: CarRental = {
      id: randomUUID(),
      bookingId: randomUUID(),
      tripId: parsed.tripId,
      vehicleType: parsed.vehicleType,
      companyName: parsed.companyName,
      model: parsed.model ?? null,
      licensePlate: parsed.licensePlate ?? null,
      pickupLocationText: parsed.pickupLocationText ?? null,
      pickupAt: parsed.pickupAt,
      pickupTimezone: parsed.pickupTimezone,
      dropoffLocationText: parsed.dropoffLocationText ?? null,
      dropoffAt: parsed.dropoffAt ?? null,
      dropoffTimezone: parsed.dropoffTimezone ?? null,
      driverRequirements: parsed.driverRequirements ?? null,
      insuranceIncluded: parsed.insuranceIncluded ?? false,
      depositAmount: parsed.depositAmount ?? null,
      depositCurrencyCode: parsed.depositCurrencyCode ?? null,
      agreedPrice: parsed.agreedPrice ?? null,
      agreedCurrencyCode: parsed.agreedCurrencyCode ?? null,
      externalBookingId: parsed.externalBookingId ?? null,
      cancellationPolicy: parsed.cancellationPolicy ?? null,
      phone: parsed.phone ?? null,
      whatsapp: parsed.whatsapp ?? null,
      email: parsed.email ?? null,
      website: parsed.website ?? null,
      confirmationNumber: parsed.confirmationNumber ?? null,
      status: "booked",
      notes: parsed.notes ?? null,
      createdAt: new Date().toISOString(),
      deletedAt: null,
    };
    this.carRentals.set(carRental.id, carRental);
    return carRental;
  }

  async updateCarRental({ input }: { input: UpdateCarRentalInput }): Promise<CarRental> {
    const parsed = updateCarRentalInputSchema.parse(input);
    const existing = this.carRentals.get(parsed.carRentalId);
    if (!existing) throw new BookingNotFoundError(parsed.carRentalId);
    const updated: CarRental = {
      ...existing,
      companyName: parsed.companyName ?? existing.companyName,
      pickupAt: parsed.pickupAt ?? existing.pickupAt,
      dropoffAt: parsed.dropoffAt ?? existing.dropoffAt,
      agreedPrice: parsed.agreedPrice ?? existing.agreedPrice,
      agreedCurrencyCode: parsed.agreedCurrencyCode ?? existing.agreedCurrencyCode,
      depositAmount: parsed.depositAmount ?? existing.depositAmount,
      depositCurrencyCode: parsed.depositCurrencyCode ?? existing.depositCurrencyCode,
    };
    this.carRentals.set(parsed.carRentalId, updated);
    return updated;
  }

  async softDeleteCarRental({ carRentalId }: { carRentalId: string }): Promise<CarRental> {
    const existing = this.carRentals.get(carRentalId);
    if (!existing) throw new BookingNotFoundError(carRentalId);
    const updated: CarRental = { ...existing, deletedAt: new Date().toISOString() };
    this.carRentals.set(carRentalId, updated);
    return updated;
  }

  async restoreCarRental({ carRentalId }: { carRentalId: string }): Promise<CarRental> {
    const existing = this.carRentals.get(carRentalId);
    if (!existing) throw new BookingNotFoundError(carRentalId);
    const updated: CarRental = { ...existing, deletedAt: null };
    this.carRentals.set(carRentalId, updated);
    return updated;
  }

  async listBookingBenefits({ bookingId }: { bookingId: string }): Promise<BookingBenefit[]> {
    return Array.from(this.bookingBenefits.values()).filter((b) => b.bookingId === bookingId);
  }

  async listBookingBenefitsForBookingIds({ bookingIds }: { bookingIds: string[] }): Promise<BookingBenefit[]> {
    const idSet = new Set(bookingIds);
    return Array.from(this.bookingBenefits.values()).filter((b) => idSet.has(b.bookingId));
  }

  async createBookingBenefit({ input }: { input: CreateBookingBenefitInput }): Promise<BookingBenefit> {
    const parsed = createBookingBenefitInputSchema.parse(input);
    const benefit: BookingBenefit = {
      id: randomUUID(),
      bookingId: parsed.bookingId,
      benefitName: parsed.benefitName,
      benefitType: parsed.benefitType ?? null,
      notes: parsed.notes ?? null,
      valueAmount: parsed.valueAmount ?? null,
      valueCurrencyCode: parsed.valueCurrencyCode ?? null,
    };
    this.bookingBenefits.set(benefit.id, benefit);
    return benefit;
  }

  async deleteBookingBenefit({ benefitId }: { benefitId: string }): Promise<void> {
    this.bookingBenefits.delete(benefitId);
  }

  async listTransportQuotes({ tripId }: { tripId: string }): Promise<TransportQuote[]> {
    return Array.from(this.transportQuotes.values())
      .filter((q) => q.tripId === tripId)
      .sort((a, b) => a.price - b.price);
  }

  async createTransportQuote({ input }: { input: CreateTransportQuoteInput }): Promise<TransportQuote> {
    const parsed = createTransportQuoteInputSchema.parse(input);
    const quote: TransportQuote = {
      id: randomUUID(),
      tripId: parsed.tripId,
      transportBookingId: null,
      provider: parsed.provider,
      price: parsed.price,
      currencyCode: parsed.currencyCode,
      vehicleType: parsed.vehicleType ?? null,
      terms: parsed.terms ?? null,
      notes: parsed.notes ?? null,
      isSelected: false,
      createdAt: new Date().toISOString(),
    };
    this.transportQuotes.set(quote.id, quote);
    return quote;
  }

  async toggleTransportQuoteSelected({ quoteId }: { quoteId: string }): Promise<TransportQuote> {
    const existing = this.transportQuotes.get(quoteId);
    if (!existing) throw new BookingNotFoundError(quoteId);
    const updated: TransportQuote = { ...existing, isSelected: !existing.isSelected };
    this.transportQuotes.set(quoteId, updated);
    return updated;
  }

  async deleteTransportQuote({ quoteId }: { quoteId: string }): Promise<void> {
    this.transportQuotes.delete(quoteId);
  }

  async linkTransportQuoteToBooking({
    quoteId,
    transportBookingId,
  }: {
    quoteId: string;
    transportBookingId: string;
  }): Promise<TransportQuote> {
    const existing = this.transportQuotes.get(quoteId);
    if (!existing) throw new BookingNotFoundError(quoteId);
    const updated: TransportQuote = { ...existing, transportBookingId, isSelected: true };
    this.transportQuotes.set(quoteId, updated);
    return updated;
  }
}

export const mockBookingRepository = new MockBookingRepository();
