// PENDING_INTEGRATION — ראה ההערה המקבילה ב-trip-repository.prisma.ts.
import { PrismaClient } from "@travel-app/db";
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

export class PrismaBookingRepository implements BookingRepository {
  constructor(private readonly prisma: PrismaClient) {}

  async listHotelStays({ tripId, includeDeleted = false }: { tripId: string; includeDeleted?: boolean }): Promise<HotelStay[]> {
    const rows = await this.prisma.hotelStay.findMany({
      where: { booking: { tripId, ...(includeDeleted ? {} : { deletedAt: null }) } },
      include: { booking: true },
      orderBy: { checkInDate: "asc" },
    });
    return rows.map((row) => ({
      id: row.id,
      bookingId: row.bookingId,
      tripId,
      hotelName: row.hotelName,
      address: row.address,
      lat: row.lat,
      lng: row.lng,
      checkInDate: row.checkInDate.toISOString().slice(0, 10),
      checkOutDate: row.checkOutDate.toISOString().slice(0, 10),
      checkInTime: row.checkInTime,
      checkOutTime: row.checkOutTime,
      timezone: row.timezone,
      roomType: row.roomType,
      bedType: row.bedType,
      floor: row.floor,
      view: row.view,
      smoking: row.smoking,
      guestsCount: row.guestsCount,
      pricePerNight: row.pricePerNight ? Number(row.pricePerNight) : null,
      personalRating: row.personalRating,
      agreedPrice: row.booking.agreedPrice ? Number(row.booking.agreedPrice) : null,
      agreedCurrencyCode: row.booking.agreedCurrencyCode,
      mealPlan: row.mealPlan,
      breakfastPrice: row.breakfastPrice ? Number(row.breakfastPrice) : null,
      breakfastPriceUnit: row.breakfastPriceUnit,
      breakfastHours: row.breakfastHours,
      breakfastLocation: row.breakfastLocation,
      earlyCheckIn: row.earlyCheckIn,
      lateCheckOut: row.lateCheckOut,
      externalBookingId: row.booking.externalBookingId,
      cancellationPolicy: row.booking.cancellationPolicy,
      phone: row.booking.phone,
      whatsapp: row.booking.whatsapp,
      email: row.booking.email,
      website: row.booking.website,
      confirmationNumber: row.booking.confirmationNumber,
      status: row.booking.status,
      notes: row.booking.notes,
      createdAt: row.booking.createdAt.toISOString(),
      deletedAt: row.booking.deletedAt ? row.booking.deletedAt.toISOString() : null,
    }));
  }

  async updateHotelStay({ input }: { input: UpdateHotelStayInput }): Promise<HotelStay> {
    const parsed = updateHotelStayInputSchema.parse(input);
    const existingRow = await this.prisma.hotelStay.findUnique({ where: { id: parsed.hotelStayId }, include: { booking: true } });
    if (!existingRow) throw new BookingNotFoundError(parsed.hotelStayId);

    const existing = await this.prisma.hotelStay.update({
      where: { id: parsed.hotelStayId },
      data: {
        hotelName: parsed.hotelName,
        checkInDate: parsed.checkInDate ? new Date(parsed.checkInDate) : undefined,
        checkOutDate: parsed.checkOutDate ? new Date(parsed.checkOutDate) : undefined,
      },
    });
    const booking =
      parsed.agreedPrice !== undefined || parsed.agreedCurrencyCode !== undefined
        ? await this.prisma.booking.update({
            where: { id: existingRow.bookingId },
            data: { agreedPrice: parsed.agreedPrice, agreedCurrencyCode: parsed.agreedCurrencyCode },
          })
        : existingRow.booking;

    return {
      id: existing.id,
      bookingId: existing.bookingId,
      tripId: booking.tripId,
      hotelName: existing.hotelName,
      address: existing.address,
      lat: existing.lat,
      lng: existing.lng,
      checkInDate: existing.checkInDate.toISOString().slice(0, 10),
      checkOutDate: existing.checkOutDate.toISOString().slice(0, 10),
      checkInTime: existing.checkInTime,
      checkOutTime: existing.checkOutTime,
      timezone: existing.timezone,
      roomType: existing.roomType,
      bedType: existing.bedType,
      floor: existing.floor,
      view: existing.view,
      smoking: existing.smoking,
      guestsCount: existing.guestsCount,
      pricePerNight: existing.pricePerNight ? Number(existing.pricePerNight) : null,
      personalRating: existing.personalRating,
      agreedPrice: booking.agreedPrice ? Number(booking.agreedPrice) : null,
      agreedCurrencyCode: booking.agreedCurrencyCode,
      mealPlan: existing.mealPlan,
      breakfastPrice: existing.breakfastPrice ? Number(existing.breakfastPrice) : null,
      breakfastPriceUnit: existing.breakfastPriceUnit,
      breakfastHours: existing.breakfastHours,
      breakfastLocation: existing.breakfastLocation,
      earlyCheckIn: existing.earlyCheckIn,
      lateCheckOut: existing.lateCheckOut,
      externalBookingId: booking.externalBookingId,
      cancellationPolicy: booking.cancellationPolicy,
      phone: booking.phone,
      whatsapp: booking.whatsapp,
      email: booking.email,
      website: booking.website,
      confirmationNumber: booking.confirmationNumber,
      status: booking.status,
      notes: booking.notes,
      createdAt: booking.createdAt.toISOString(),
      deletedAt: booking.deletedAt ? booking.deletedAt.toISOString() : null,
    };
  }

  async softDeleteHotelStay({ hotelStayId }: { hotelStayId: string }): Promise<HotelStay> {
    const existing = await this.prisma.hotelStay.findUnique({ where: { id: hotelStayId }, include: { booking: true } });
    if (!existing) throw new BookingNotFoundError(hotelStayId);
    const booking = await this.prisma.booking.update({ where: { id: existing.bookingId }, data: { deletedAt: new Date() } });
    return {
      id: existing.id,
      bookingId: existing.bookingId,
      tripId: booking.tripId,
      hotelName: existing.hotelName,
      address: existing.address,
      lat: existing.lat,
      lng: existing.lng,
      checkInDate: existing.checkInDate.toISOString().slice(0, 10),
      checkOutDate: existing.checkOutDate.toISOString().slice(0, 10),
      checkInTime: existing.checkInTime,
      checkOutTime: existing.checkOutTime,
      timezone: existing.timezone,
      roomType: existing.roomType,
      bedType: existing.bedType,
      floor: existing.floor,
      view: existing.view,
      smoking: existing.smoking,
      guestsCount: existing.guestsCount,
      pricePerNight: existing.pricePerNight ? Number(existing.pricePerNight) : null,
      personalRating: existing.personalRating,
      agreedPrice: booking.agreedPrice ? Number(booking.agreedPrice) : null,
      agreedCurrencyCode: booking.agreedCurrencyCode,
      mealPlan: existing.mealPlan,
      breakfastPrice: existing.breakfastPrice ? Number(existing.breakfastPrice) : null,
      breakfastPriceUnit: existing.breakfastPriceUnit,
      breakfastHours: existing.breakfastHours,
      breakfastLocation: existing.breakfastLocation,
      earlyCheckIn: existing.earlyCheckIn,
      lateCheckOut: existing.lateCheckOut,
      externalBookingId: booking.externalBookingId,
      cancellationPolicy: booking.cancellationPolicy,
      phone: booking.phone,
      whatsapp: booking.whatsapp,
      email: booking.email,
      website: booking.website,
      confirmationNumber: booking.confirmationNumber,
      status: booking.status,
      notes: booking.notes,
      createdAt: booking.createdAt.toISOString(),
      deletedAt: booking.deletedAt ? booking.deletedAt.toISOString() : null,
    };
  }

  async restoreHotelStay({ hotelStayId }: { hotelStayId: string }): Promise<HotelStay> {
    const existing = await this.prisma.hotelStay.findUnique({ where: { id: hotelStayId }, include: { booking: true } });
    if (!existing) throw new BookingNotFoundError(hotelStayId);
    const booking = await this.prisma.booking.update({ where: { id: existing.bookingId }, data: { deletedAt: null } });
    return {
      id: existing.id,
      bookingId: existing.bookingId,
      tripId: booking.tripId,
      hotelName: existing.hotelName,
      address: existing.address,
      lat: existing.lat,
      lng: existing.lng,
      checkInDate: existing.checkInDate.toISOString().slice(0, 10),
      checkOutDate: existing.checkOutDate.toISOString().slice(0, 10),
      checkInTime: existing.checkInTime,
      checkOutTime: existing.checkOutTime,
      timezone: existing.timezone,
      roomType: existing.roomType,
      bedType: existing.bedType,
      floor: existing.floor,
      view: existing.view,
      smoking: existing.smoking,
      guestsCount: existing.guestsCount,
      pricePerNight: existing.pricePerNight ? Number(existing.pricePerNight) : null,
      personalRating: existing.personalRating,
      agreedPrice: booking.agreedPrice ? Number(booking.agreedPrice) : null,
      agreedCurrencyCode: booking.agreedCurrencyCode,
      mealPlan: existing.mealPlan,
      breakfastPrice: existing.breakfastPrice ? Number(existing.breakfastPrice) : null,
      breakfastPriceUnit: existing.breakfastPriceUnit,
      breakfastHours: existing.breakfastHours,
      breakfastLocation: existing.breakfastLocation,
      earlyCheckIn: existing.earlyCheckIn,
      lateCheckOut: existing.lateCheckOut,
      externalBookingId: booking.externalBookingId,
      cancellationPolicy: booking.cancellationPolicy,
      phone: booking.phone,
      whatsapp: booking.whatsapp,
      email: booking.email,
      website: booking.website,
      confirmationNumber: booking.confirmationNumber,
      status: booking.status,
      notes: booking.notes,
      createdAt: booking.createdAt.toISOString(),
      deletedAt: booking.deletedAt ? booking.deletedAt.toISOString() : null,
    };
  }

  async updateHotelStayPersonalRating({ input }: { input: UpdateHotelStayPersonalRatingInput }): Promise<HotelStay> {
    const parsed = updateHotelStayPersonalRatingInputSchema.parse(input);
    const existing = await this.prisma.hotelStay.findUnique({ where: { id: parsed.hotelStayId }, include: { booking: true } });
    if (!existing) throw new BookingNotFoundError(parsed.hotelStayId);
    const updated = await this.prisma.hotelStay.update({
      where: { id: parsed.hotelStayId },
      data: { personalRating: parsed.personalRating },
    });
    const { booking } = existing;
    return {
      id: existing.id,
      bookingId: existing.bookingId,
      tripId: booking.tripId,
      hotelName: existing.hotelName,
      address: existing.address,
      lat: existing.lat,
      lng: existing.lng,
      checkInDate: existing.checkInDate.toISOString().slice(0, 10),
      checkOutDate: existing.checkOutDate.toISOString().slice(0, 10),
      checkInTime: existing.checkInTime,
      checkOutTime: existing.checkOutTime,
      timezone: existing.timezone,
      roomType: existing.roomType,
      bedType: existing.bedType,
      floor: existing.floor,
      view: existing.view,
      smoking: existing.smoking,
      guestsCount: existing.guestsCount,
      pricePerNight: existing.pricePerNight ? Number(existing.pricePerNight) : null,
      personalRating: updated.personalRating,
      agreedPrice: booking.agreedPrice ? Number(booking.agreedPrice) : null,
      agreedCurrencyCode: booking.agreedCurrencyCode,
      mealPlan: existing.mealPlan,
      breakfastPrice: existing.breakfastPrice ? Number(existing.breakfastPrice) : null,
      breakfastPriceUnit: existing.breakfastPriceUnit,
      breakfastHours: existing.breakfastHours,
      breakfastLocation: existing.breakfastLocation,
      earlyCheckIn: existing.earlyCheckIn,
      lateCheckOut: existing.lateCheckOut,
      externalBookingId: booking.externalBookingId,
      cancellationPolicy: booking.cancellationPolicy,
      phone: booking.phone,
      whatsapp: booking.whatsapp,
      email: booking.email,
      website: booking.website,
      confirmationNumber: booking.confirmationNumber,
      status: booking.status,
      notes: booking.notes,
      createdAt: booking.createdAt.toISOString(),
      deletedAt: booking.deletedAt ? booking.deletedAt.toISOString() : null,
    };
  }

  async createHotelStay({ input }: { input: CreateHotelStayInput }): Promise<HotelStay> {
    const parsed = createHotelStayInputSchema.parse(input);
    const booking = await this.prisma.booking.create({
      data: {
        tripId: parsed.tripId,
        bookingType: "hotel_stay",
        status: "booked",
        agreedPrice: parsed.agreedPrice,
        agreedCurrencyCode: parsed.agreedCurrencyCode,
        confirmationNumber: parsed.confirmationNumber,
        externalBookingId: parsed.externalBookingId,
        cancellationPolicy: parsed.cancellationPolicy,
        phone: parsed.phone,
        whatsapp: parsed.whatsapp,
        email: parsed.email,
        website: parsed.website,
        notes: parsed.notes,
        hotelStay: {
          create: {
            hotelName: parsed.hotelName,
            address: parsed.address,
            lat: parsed.lat,
            lng: parsed.lng,
            checkInDate: new Date(parsed.checkInDate),
            checkOutDate: new Date(parsed.checkOutDate),
            checkInTime: parsed.checkInTime,
            checkOutTime: parsed.checkOutTime,
            timezone: parsed.timezone,
            roomType: parsed.roomType,
            bedType: parsed.bedType,
            floor: parsed.floor,
            view: parsed.view,
            smoking: parsed.smoking,
            guestsCount: parsed.guestsCount,
            pricePerNight: parsed.pricePerNight,
            mealPlan: parsed.mealPlan ?? "none",
            breakfastPrice: parsed.breakfastPrice,
            breakfastPriceUnit: parsed.breakfastPriceUnit,
            breakfastHours: parsed.breakfastHours,
            breakfastLocation: parsed.breakfastLocation,
            earlyCheckIn: parsed.earlyCheckIn ?? false,
            lateCheckOut: parsed.lateCheckOut ?? false,
          },
        },
      },
      include: { hotelStay: true },
    });

    if (!booking.hotelStay) throw new Error("hotelStay was not created alongside the booking");
    const { hotelStay } = booking;
    return {
      id: hotelStay.id,
      bookingId: booking.id,
      tripId: parsed.tripId,
      hotelName: hotelStay.hotelName,
      address: hotelStay.address,
      lat: hotelStay.lat,
      lng: hotelStay.lng,
      checkInDate: hotelStay.checkInDate.toISOString().slice(0, 10),
      checkOutDate: hotelStay.checkOutDate.toISOString().slice(0, 10),
      checkInTime: hotelStay.checkInTime,
      checkOutTime: hotelStay.checkOutTime,
      timezone: hotelStay.timezone,
      roomType: hotelStay.roomType,
      bedType: hotelStay.bedType,
      floor: hotelStay.floor,
      view: hotelStay.view,
      smoking: hotelStay.smoking,
      guestsCount: hotelStay.guestsCount,
      pricePerNight: hotelStay.pricePerNight ? Number(hotelStay.pricePerNight) : null,
      personalRating: hotelStay.personalRating,
      agreedPrice: booking.agreedPrice ? Number(booking.agreedPrice) : null,
      agreedCurrencyCode: booking.agreedCurrencyCode,
      mealPlan: hotelStay.mealPlan,
      breakfastPrice: hotelStay.breakfastPrice ? Number(hotelStay.breakfastPrice) : null,
      breakfastPriceUnit: hotelStay.breakfastPriceUnit,
      breakfastHours: hotelStay.breakfastHours,
      breakfastLocation: hotelStay.breakfastLocation,
      earlyCheckIn: hotelStay.earlyCheckIn,
      lateCheckOut: hotelStay.lateCheckOut,
      externalBookingId: booking.externalBookingId,
      cancellationPolicy: booking.cancellationPolicy,
      phone: booking.phone,
      whatsapp: booking.whatsapp,
      email: booking.email,
      website: booking.website,
      confirmationNumber: booking.confirmationNumber,
      status: booking.status,
      notes: booking.notes,
      createdAt: booking.createdAt.toISOString(),
      deletedAt: null,
    };
  }

  async listFlights({ tripId, includeDeleted = false }: { tripId: string; includeDeleted?: boolean }): Promise<Flight[]> {
    const rows = await this.prisma.flight.findMany({
      where: { booking: { tripId, ...(includeDeleted ? {} : { deletedAt: null }) } },
      include: { booking: true },
      orderBy: { departureAt: "asc" },
    });
    return rows.map((row) => ({
      id: row.id,
      bookingId: row.bookingId,
      tripId,
      airline: row.airline,
      flightNumber: row.flightNumber,
      departureAirport: row.departureAirport,
      arrivalAirport: row.arrivalAirport,
      departureTerminal: row.departureTerminal,
      arrivalTerminal: row.arrivalTerminal,
      departureAt: row.departureAt.toISOString(),
      departureTimezone: row.departureTimezone,
      arrivalAt: row.arrivalAt.toISOString(),
      arrivalTimezone: row.arrivalTimezone,
      seat: row.seat,
      baggage: row.baggage,
      legType: row.legType,
      agreedPrice: row.booking.agreedPrice ? Number(row.booking.agreedPrice) : null,
      agreedCurrencyCode: row.booking.agreedCurrencyCode,
      externalBookingId: row.booking.externalBookingId,
      cancellationPolicy: row.booking.cancellationPolicy,
      phone: row.booking.phone,
      whatsapp: row.booking.whatsapp,
      email: row.booking.email,
      website: row.booking.website,
      confirmationNumber: row.booking.confirmationNumber,
      status: row.booking.status,
      notes: row.booking.notes,
      airportArrivalLeadMinutes: row.airportArrivalLeadMinutes,
      travelTimeToAirportMinutes: row.travelTimeToAirportMinutes,
      checkInWindowHours: row.checkInWindowHours,
      liveStatus: row.liveStatus as Flight["liveStatus"],
      liveDelayMinutes: row.liveDelayMinutes,
      liveStatusCheckedAt: row.liveStatusCheckedAt ? row.liveStatusCheckedAt.toISOString() : null,
      createdAt: row.booking.createdAt.toISOString(),
      deletedAt: row.booking.deletedAt ? row.booking.deletedAt.toISOString() : null,
    }));
  }

  async updateFlight({ input }: { input: UpdateFlightInput }): Promise<Flight> {
    const parsed = updateFlightInputSchema.parse(input);
    const existingRow = await this.prisma.flight.findUnique({ where: { id: parsed.flightId }, include: { booking: true } });
    if (!existingRow) throw new BookingNotFoundError(parsed.flightId);

    const existing = await this.prisma.flight.update({
      where: { id: parsed.flightId },
      data: {
        airline: parsed.airline,
        departureAt: parsed.departureAt ? new Date(parsed.departureAt) : undefined,
        arrivalAt: parsed.arrivalAt ? new Date(parsed.arrivalAt) : undefined,
      },
    });
    const booking =
      parsed.agreedPrice !== undefined || parsed.agreedCurrencyCode !== undefined
        ? await this.prisma.booking.update({
            where: { id: existingRow.bookingId },
            data: { agreedPrice: parsed.agreedPrice, agreedCurrencyCode: parsed.agreedCurrencyCode },
          })
        : existingRow.booking;

    return {
      id: existing.id,
      bookingId: existing.bookingId,
      tripId: booking.tripId,
      airline: existing.airline,
      flightNumber: existing.flightNumber,
      departureAirport: existing.departureAirport,
      arrivalAirport: existing.arrivalAirport,
      departureTerminal: existing.departureTerminal,
      arrivalTerminal: existing.arrivalTerminal,
      departureAt: existing.departureAt.toISOString(),
      departureTimezone: existing.departureTimezone,
      arrivalAt: existing.arrivalAt.toISOString(),
      arrivalTimezone: existing.arrivalTimezone,
      seat: existing.seat,
      baggage: existing.baggage,
      legType: existing.legType,
      agreedPrice: booking.agreedPrice ? Number(booking.agreedPrice) : null,
      agreedCurrencyCode: booking.agreedCurrencyCode,
      externalBookingId: booking.externalBookingId,
      cancellationPolicy: booking.cancellationPolicy,
      phone: booking.phone,
      whatsapp: booking.whatsapp,
      email: booking.email,
      website: booking.website,
      confirmationNumber: booking.confirmationNumber,
      status: booking.status,
      notes: booking.notes,
      airportArrivalLeadMinutes: existing.airportArrivalLeadMinutes,
      travelTimeToAirportMinutes: existing.travelTimeToAirportMinutes,
      checkInWindowHours: existing.checkInWindowHours,
      liveStatus: existing.liveStatus as Flight["liveStatus"],
      liveDelayMinutes: existing.liveDelayMinutes,
      liveStatusCheckedAt: existing.liveStatusCheckedAt ? existing.liveStatusCheckedAt.toISOString() : null,
      createdAt: booking.createdAt.toISOString(),
      deletedAt: booking.deletedAt ? booking.deletedAt.toISOString() : null,
    };
  }

  async softDeleteFlight({ flightId }: { flightId: string }): Promise<Flight> {
    const existing = await this.prisma.flight.findUnique({ where: { id: flightId }, include: { booking: true } });
    if (!existing) throw new BookingNotFoundError(flightId);
    const booking = await this.prisma.booking.update({ where: { id: existing.bookingId }, data: { deletedAt: new Date() } });
    return {
      id: existing.id,
      bookingId: existing.bookingId,
      tripId: booking.tripId,
      airline: existing.airline,
      flightNumber: existing.flightNumber,
      departureAirport: existing.departureAirport,
      arrivalAirport: existing.arrivalAirport,
      departureTerminal: existing.departureTerminal,
      arrivalTerminal: existing.arrivalTerminal,
      departureAt: existing.departureAt.toISOString(),
      departureTimezone: existing.departureTimezone,
      arrivalAt: existing.arrivalAt.toISOString(),
      arrivalTimezone: existing.arrivalTimezone,
      seat: existing.seat,
      baggage: existing.baggage,
      legType: existing.legType,
      agreedPrice: booking.agreedPrice ? Number(booking.agreedPrice) : null,
      agreedCurrencyCode: booking.agreedCurrencyCode,
      externalBookingId: booking.externalBookingId,
      cancellationPolicy: booking.cancellationPolicy,
      phone: booking.phone,
      whatsapp: booking.whatsapp,
      email: booking.email,
      website: booking.website,
      confirmationNumber: booking.confirmationNumber,
      status: booking.status,
      notes: booking.notes,
      airportArrivalLeadMinutes: existing.airportArrivalLeadMinutes,
      travelTimeToAirportMinutes: existing.travelTimeToAirportMinutes,
      checkInWindowHours: existing.checkInWindowHours,
      liveStatus: existing.liveStatus as Flight["liveStatus"],
      liveDelayMinutes: existing.liveDelayMinutes,
      liveStatusCheckedAt: existing.liveStatusCheckedAt ? existing.liveStatusCheckedAt.toISOString() : null,
      createdAt: booking.createdAt.toISOString(),
      deletedAt: booking.deletedAt ? booking.deletedAt.toISOString() : null,
    };
  }

  async restoreFlight({ flightId }: { flightId: string }): Promise<Flight> {
    const existing = await this.prisma.flight.findUnique({ where: { id: flightId }, include: { booking: true } });
    if (!existing) throw new BookingNotFoundError(flightId);
    const booking = await this.prisma.booking.update({ where: { id: existing.bookingId }, data: { deletedAt: null } });
    return {
      id: existing.id,
      bookingId: existing.bookingId,
      tripId: booking.tripId,
      airline: existing.airline,
      flightNumber: existing.flightNumber,
      departureAirport: existing.departureAirport,
      arrivalAirport: existing.arrivalAirport,
      departureTerminal: existing.departureTerminal,
      arrivalTerminal: existing.arrivalTerminal,
      departureAt: existing.departureAt.toISOString(),
      departureTimezone: existing.departureTimezone,
      arrivalAt: existing.arrivalAt.toISOString(),
      arrivalTimezone: existing.arrivalTimezone,
      seat: existing.seat,
      baggage: existing.baggage,
      legType: existing.legType,
      agreedPrice: booking.agreedPrice ? Number(booking.agreedPrice) : null,
      agreedCurrencyCode: booking.agreedCurrencyCode,
      externalBookingId: booking.externalBookingId,
      cancellationPolicy: booking.cancellationPolicy,
      phone: booking.phone,
      whatsapp: booking.whatsapp,
      email: booking.email,
      website: booking.website,
      confirmationNumber: booking.confirmationNumber,
      status: booking.status,
      notes: booking.notes,
      airportArrivalLeadMinutes: existing.airportArrivalLeadMinutes,
      travelTimeToAirportMinutes: existing.travelTimeToAirportMinutes,
      checkInWindowHours: existing.checkInWindowHours,
      liveStatus: existing.liveStatus as Flight["liveStatus"],
      liveDelayMinutes: existing.liveDelayMinutes,
      liveStatusCheckedAt: existing.liveStatusCheckedAt ? existing.liveStatusCheckedAt.toISOString() : null,
      createdAt: booking.createdAt.toISOString(),
      deletedAt: booking.deletedAt ? booking.deletedAt.toISOString() : null,
    };
  }

  async createFlight({ input }: { input: CreateFlightInput }): Promise<Flight> {
    const parsed = createFlightInputSchema.parse(input);
    const booking = await this.prisma.booking.create({
      data: {
        tripId: parsed.tripId,
        bookingType: "flight",
        status: "booked",
        agreedPrice: parsed.agreedPrice,
        agreedCurrencyCode: parsed.agreedCurrencyCode,
        confirmationNumber: parsed.confirmationNumber,
        externalBookingId: parsed.externalBookingId,
        cancellationPolicy: parsed.cancellationPolicy,
        phone: parsed.phone,
        whatsapp: parsed.whatsapp,
        email: parsed.email,
        website: parsed.website,
        notes: parsed.notes,
        flight: {
          create: {
            airline: parsed.airline,
            flightNumber: parsed.flightNumber,
            departureAirport: parsed.departureAirport,
            arrivalAirport: parsed.arrivalAirport,
            departureTerminal: parsed.departureTerminal,
            arrivalTerminal: parsed.arrivalTerminal,
            departureAt: new Date(parsed.departureAt),
            departureTimezone: parsed.departureTimezone,
            arrivalAt: new Date(parsed.arrivalAt),
            arrivalTimezone: parsed.arrivalTimezone,
            seat: parsed.seat,
            baggage: parsed.baggage,
            legType: parsed.legType ?? "outbound",
          },
        },
      },
      include: { flight: true },
    });

    if (!booking.flight) throw new Error("flight was not created alongside the booking");
    const { flight } = booking;
    return {
      id: flight.id,
      bookingId: booking.id,
      tripId: parsed.tripId,
      airline: flight.airline,
      flightNumber: flight.flightNumber,
      departureAirport: flight.departureAirport,
      arrivalAirport: flight.arrivalAirport,
      departureTerminal: flight.departureTerminal,
      arrivalTerminal: flight.arrivalTerminal,
      departureAt: flight.departureAt.toISOString(),
      departureTimezone: flight.departureTimezone,
      arrivalAt: flight.arrivalAt.toISOString(),
      arrivalTimezone: flight.arrivalTimezone,
      seat: flight.seat,
      baggage: flight.baggage,
      legType: flight.legType,
      agreedPrice: booking.agreedPrice ? Number(booking.agreedPrice) : null,
      agreedCurrencyCode: booking.agreedCurrencyCode,
      externalBookingId: booking.externalBookingId,
      cancellationPolicy: booking.cancellationPolicy,
      phone: booking.phone,
      whatsapp: booking.whatsapp,
      email: booking.email,
      website: booking.website,
      confirmationNumber: booking.confirmationNumber,
      status: booking.status,
      notes: booking.notes,
      airportArrivalLeadMinutes: flight.airportArrivalLeadMinutes,
      travelTimeToAirportMinutes: flight.travelTimeToAirportMinutes,
      checkInWindowHours: null,
      liveStatus: null,
      liveDelayMinutes: null,
      liveStatusCheckedAt: null,
      createdAt: booking.createdAt.toISOString(),
      deletedAt: null,
    };
  }

  async updateFlightAirportTiming({ input }: { input: SetFlightAirportTimingInput }): Promise<Flight> {
    const parsed = setFlightAirportTimingInputSchema.parse(input);
    const existing = await this.prisma.flight.findUnique({ where: { id: parsed.flightId }, include: { booking: true } });
    if (!existing) throw new BookingNotFoundError(parsed.flightId);

    const updated = await this.prisma.flight.update({
      where: { id: parsed.flightId },
      data: {
        airportArrivalLeadMinutes: parsed.airportArrivalLeadMinutes,
        travelTimeToAirportMinutes: parsed.travelTimeToAirportMinutes,
      },
    });
    const booking = existing.booking;
    return {
      id: updated.id,
      bookingId: updated.bookingId,
      tripId: booking.tripId,
      airline: updated.airline,
      flightNumber: updated.flightNumber,
      departureAirport: updated.departureAirport,
      arrivalAirport: updated.arrivalAirport,
      departureTerminal: updated.departureTerminal,
      arrivalTerminal: updated.arrivalTerminal,
      departureAt: updated.departureAt.toISOString(),
      departureTimezone: updated.departureTimezone,
      arrivalAt: updated.arrivalAt.toISOString(),
      arrivalTimezone: updated.arrivalTimezone,
      seat: updated.seat,
      baggage: updated.baggage,
      legType: updated.legType,
      agreedPrice: booking.agreedPrice ? Number(booking.agreedPrice) : null,
      agreedCurrencyCode: booking.agreedCurrencyCode,
      externalBookingId: booking.externalBookingId,
      cancellationPolicy: booking.cancellationPolicy,
      phone: booking.phone,
      whatsapp: booking.whatsapp,
      email: booking.email,
      website: booking.website,
      confirmationNumber: booking.confirmationNumber,
      status: booking.status,
      notes: booking.notes,
      airportArrivalLeadMinutes: updated.airportArrivalLeadMinutes,
      travelTimeToAirportMinutes: updated.travelTimeToAirportMinutes,
      checkInWindowHours: updated.checkInWindowHours,
      liveStatus: updated.liveStatus as Flight["liveStatus"],
      liveDelayMinutes: updated.liveDelayMinutes,
      liveStatusCheckedAt: updated.liveStatusCheckedAt ? updated.liveStatusCheckedAt.toISOString() : null,
      createdAt: booking.createdAt.toISOString(),
      deletedAt: booking.deletedAt ? booking.deletedAt.toISOString() : null,
    };
  }

  async updateFlightCheckInWindow({ input }: { input: SetFlightCheckInWindowInput }): Promise<Flight> {
    const parsed = setFlightCheckInWindowInputSchema.parse(input);
    const existing = await this.prisma.flight.findUnique({ where: { id: parsed.flightId }, include: { booking: true } });
    if (!existing) throw new BookingNotFoundError(parsed.flightId);

    const updated = await this.prisma.flight.update({
      where: { id: parsed.flightId },
      data: { checkInWindowHours: parsed.checkInWindowHours },
    });
    const booking = existing.booking;
    return {
      id: updated.id,
      bookingId: updated.bookingId,
      tripId: booking.tripId,
      airline: updated.airline,
      flightNumber: updated.flightNumber,
      departureAirport: updated.departureAirport,
      arrivalAirport: updated.arrivalAirport,
      departureTerminal: updated.departureTerminal,
      arrivalTerminal: updated.arrivalTerminal,
      departureAt: updated.departureAt.toISOString(),
      departureTimezone: updated.departureTimezone,
      arrivalAt: updated.arrivalAt.toISOString(),
      arrivalTimezone: updated.arrivalTimezone,
      seat: updated.seat,
      baggage: updated.baggage,
      legType: updated.legType,
      agreedPrice: booking.agreedPrice ? Number(booking.agreedPrice) : null,
      agreedCurrencyCode: booking.agreedCurrencyCode,
      externalBookingId: booking.externalBookingId,
      cancellationPolicy: booking.cancellationPolicy,
      phone: booking.phone,
      whatsapp: booking.whatsapp,
      email: booking.email,
      website: booking.website,
      confirmationNumber: booking.confirmationNumber,
      status: booking.status,
      notes: booking.notes,
      airportArrivalLeadMinutes: updated.airportArrivalLeadMinutes,
      travelTimeToAirportMinutes: updated.travelTimeToAirportMinutes,
      checkInWindowHours: updated.checkInWindowHours,
      liveStatus: updated.liveStatus as Flight["liveStatus"],
      liveDelayMinutes: updated.liveDelayMinutes,
      liveStatusCheckedAt: updated.liveStatusCheckedAt ? updated.liveStatusCheckedAt.toISOString() : null,
      createdAt: booking.createdAt.toISOString(),
      deletedAt: booking.deletedAt ? booking.deletedAt.toISOString() : null,
    };
  }

  async updateFlightLiveStatus({ input }: { input: SetFlightLiveStatusInput }): Promise<Flight> {
    const parsed = setFlightLiveStatusInputSchema.parse(input);
    const existing = await this.prisma.flight.findUnique({ where: { id: parsed.flightId }, include: { booking: true } });
    if (!existing) throw new BookingNotFoundError(parsed.flightId);

    const updated = await this.prisma.flight.update({
      where: { id: parsed.flightId },
      data: {
        liveStatus: parsed.liveStatus,
        liveDelayMinutes: parsed.liveDelayMinutes,
        liveStatusCheckedAt: new Date(),
      },
    });
    const booking = existing.booking;
    return {
      id: updated.id,
      bookingId: updated.bookingId,
      tripId: booking.tripId,
      airline: updated.airline,
      flightNumber: updated.flightNumber,
      departureAirport: updated.departureAirport,
      arrivalAirport: updated.arrivalAirport,
      departureTerminal: updated.departureTerminal,
      arrivalTerminal: updated.arrivalTerminal,
      departureAt: updated.departureAt.toISOString(),
      departureTimezone: updated.departureTimezone,
      arrivalAt: updated.arrivalAt.toISOString(),
      arrivalTimezone: updated.arrivalTimezone,
      seat: updated.seat,
      baggage: updated.baggage,
      legType: updated.legType,
      agreedPrice: booking.agreedPrice ? Number(booking.agreedPrice) : null,
      agreedCurrencyCode: booking.agreedCurrencyCode,
      externalBookingId: booking.externalBookingId,
      cancellationPolicy: booking.cancellationPolicy,
      phone: booking.phone,
      whatsapp: booking.whatsapp,
      email: booking.email,
      website: booking.website,
      confirmationNumber: booking.confirmationNumber,
      status: booking.status,
      notes: booking.notes,
      airportArrivalLeadMinutes: updated.airportArrivalLeadMinutes,
      travelTimeToAirportMinutes: updated.travelTimeToAirportMinutes,
      checkInWindowHours: updated.checkInWindowHours,
      liveStatus: updated.liveStatus as Flight["liveStatus"],
      liveDelayMinutes: updated.liveDelayMinutes,
      liveStatusCheckedAt: updated.liveStatusCheckedAt ? updated.liveStatusCheckedAt.toISOString() : null,
      createdAt: booking.createdAt.toISOString(),
      deletedAt: booking.deletedAt ? booking.deletedAt.toISOString() : null,
    };
  }

  async listTransportBookings({ tripId, includeDeleted = false }: { tripId: string; includeDeleted?: boolean }): Promise<TransportBooking[]> {
    const rows = await this.prisma.transportBooking.findMany({
      where: { booking: { tripId, ...(includeDeleted ? {} : { deletedAt: null }) } },
      include: { booking: true },
      orderBy: { pickupAt: "asc" },
    });
    return rows.map((row) => ({
      id: row.id,
      bookingId: row.bookingId,
      tripId,
      mode: row.mode,
      pickupText: row.pickupText,
      dropoffText: row.dropoffText,
      pickupAt: row.pickupAt.toISOString(),
      pickupTimezone: row.pickupTimezone,
      etaAt: row.etaAt ? row.etaAt.toISOString() : null,
      etaTimezone: row.etaTimezone,
      vehicleType: row.vehicleType,
      driverName: row.driverName,
      companyName: row.companyName,
      vehicleOnBoard: row.vehicleOnBoard,
      seat: row.seat,
      tollFees: row.tollFees ? Number(row.tollFees) : null,
      parkingFees: row.parkingFees ? Number(row.parkingFees) : null,
      personalRating: row.personalRating,
      agreedPrice: row.booking.agreedPrice ? Number(row.booking.agreedPrice) : null,
      agreedCurrencyCode: row.booking.agreedCurrencyCode,
      externalBookingId: row.booking.externalBookingId,
      cancellationPolicy: row.booking.cancellationPolicy,
      phone: row.booking.phone,
      whatsapp: row.booking.whatsapp,
      email: row.booking.email,
      website: row.booking.website,
      status: row.booking.status,
      notes: row.booking.notes,
      linkedFlightId: row.linkedFlightId,
      createdAt: row.booking.createdAt.toISOString(),
      deletedAt: row.booking.deletedAt ? row.booking.deletedAt.toISOString() : null,
    }));
  }

  async softDeleteTransportBooking({ transportBookingId }: { transportBookingId: string }): Promise<TransportBooking> {
    const existing = await this.prisma.transportBooking.findUnique({ where: { id: transportBookingId }, include: { booking: true } });
    if (!existing) throw new BookingNotFoundError(transportBookingId);
    const booking = await this.prisma.booking.update({ where: { id: existing.bookingId }, data: { deletedAt: new Date() } });
    return {
      id: existing.id,
      bookingId: existing.bookingId,
      tripId: booking.tripId,
      mode: existing.mode,
      pickupText: existing.pickupText,
      dropoffText: existing.dropoffText,
      pickupAt: existing.pickupAt.toISOString(),
      pickupTimezone: existing.pickupTimezone,
      etaAt: existing.etaAt ? existing.etaAt.toISOString() : null,
      etaTimezone: existing.etaTimezone,
      vehicleType: existing.vehicleType,
      driverName: existing.driverName,
      companyName: existing.companyName,
      vehicleOnBoard: existing.vehicleOnBoard,
      seat: existing.seat,
      tollFees: existing.tollFees ? Number(existing.tollFees) : null,
      parkingFees: existing.parkingFees ? Number(existing.parkingFees) : null,
      personalRating: existing.personalRating,
      agreedPrice: booking.agreedPrice ? Number(booking.agreedPrice) : null,
      agreedCurrencyCode: booking.agreedCurrencyCode,
      externalBookingId: booking.externalBookingId,
      cancellationPolicy: booking.cancellationPolicy,
      phone: booking.phone,
      whatsapp: booking.whatsapp,
      email: booking.email,
      website: booking.website,
      status: booking.status,
      notes: booking.notes,
      linkedFlightId: existing.linkedFlightId,
      createdAt: booking.createdAt.toISOString(),
      deletedAt: booking.deletedAt ? booking.deletedAt.toISOString() : null,
    };
  }

  async restoreTransportBooking({ transportBookingId }: { transportBookingId: string }): Promise<TransportBooking> {
    const existing = await this.prisma.transportBooking.findUnique({ where: { id: transportBookingId }, include: { booking: true } });
    if (!existing) throw new BookingNotFoundError(transportBookingId);
    const booking = await this.prisma.booking.update({ where: { id: existing.bookingId }, data: { deletedAt: null } });
    return {
      id: existing.id,
      bookingId: existing.bookingId,
      tripId: booking.tripId,
      mode: existing.mode,
      pickupText: existing.pickupText,
      dropoffText: existing.dropoffText,
      pickupAt: existing.pickupAt.toISOString(),
      pickupTimezone: existing.pickupTimezone,
      etaAt: existing.etaAt ? existing.etaAt.toISOString() : null,
      etaTimezone: existing.etaTimezone,
      vehicleType: existing.vehicleType,
      driverName: existing.driverName,
      companyName: existing.companyName,
      vehicleOnBoard: existing.vehicleOnBoard,
      seat: existing.seat,
      tollFees: existing.tollFees ? Number(existing.tollFees) : null,
      parkingFees: existing.parkingFees ? Number(existing.parkingFees) : null,
      personalRating: existing.personalRating,
      agreedPrice: booking.agreedPrice ? Number(booking.agreedPrice) : null,
      agreedCurrencyCode: booking.agreedCurrencyCode,
      externalBookingId: booking.externalBookingId,
      cancellationPolicy: booking.cancellationPolicy,
      phone: booking.phone,
      whatsapp: booking.whatsapp,
      email: booking.email,
      website: booking.website,
      status: booking.status,
      notes: booking.notes,
      linkedFlightId: existing.linkedFlightId,
      createdAt: booking.createdAt.toISOString(),
      deletedAt: booking.deletedAt ? booking.deletedAt.toISOString() : null,
    };
  }

  async updateTransportBookingPersonalRating({
    input,
  }: {
    input: UpdateTransportBookingPersonalRatingInput;
  }): Promise<TransportBooking> {
    const parsed = updateTransportBookingPersonalRatingInputSchema.parse(input);
    const existing = await this.prisma.transportBooking.findUnique({
      where: { id: parsed.transportBookingId },
      include: { booking: true },
    });
    if (!existing) throw new BookingNotFoundError(parsed.transportBookingId);
    const updated = await this.prisma.transportBooking.update({
      where: { id: parsed.transportBookingId },
      data: { personalRating: parsed.personalRating },
    });
    const { booking } = existing;
    return {
      id: existing.id,
      bookingId: existing.bookingId,
      tripId: booking.tripId,
      mode: existing.mode,
      pickupText: existing.pickupText,
      dropoffText: existing.dropoffText,
      pickupAt: existing.pickupAt.toISOString(),
      pickupTimezone: existing.pickupTimezone,
      etaAt: existing.etaAt ? existing.etaAt.toISOString() : null,
      etaTimezone: existing.etaTimezone,
      vehicleType: existing.vehicleType,
      driverName: existing.driverName,
      companyName: existing.companyName,
      vehicleOnBoard: existing.vehicleOnBoard,
      seat: existing.seat,
      tollFees: existing.tollFees ? Number(existing.tollFees) : null,
      parkingFees: existing.parkingFees ? Number(existing.parkingFees) : null,
      personalRating: updated.personalRating,
      agreedPrice: booking.agreedPrice ? Number(booking.agreedPrice) : null,
      agreedCurrencyCode: booking.agreedCurrencyCode,
      externalBookingId: booking.externalBookingId,
      cancellationPolicy: booking.cancellationPolicy,
      phone: booking.phone,
      whatsapp: booking.whatsapp,
      email: booking.email,
      website: booking.website,
      status: booking.status,
      notes: booking.notes,
      linkedFlightId: existing.linkedFlightId,
      createdAt: booking.createdAt.toISOString(),
      deletedAt: booking.deletedAt ? booking.deletedAt.toISOString() : null,
    };
  }

  async createTransportBooking({ input }: { input: CreateTransportBookingInput }): Promise<TransportBooking> {
    const parsed = createTransportBookingInputSchema.parse(input);
    const booking = await this.prisma.booking.create({
      data: {
        tripId: parsed.tripId,
        bookingType: "transport",
        status: "booked",
        agreedPrice: parsed.agreedPrice,
        agreedCurrencyCode: parsed.agreedCurrencyCode,
        externalBookingId: parsed.externalBookingId,
        cancellationPolicy: parsed.cancellationPolicy,
        phone: parsed.phone,
        whatsapp: parsed.whatsapp,
        email: parsed.email,
        website: parsed.website,
        notes: parsed.notes,
        transportBooking: {
          create: {
            mode: parsed.mode,
            pickupText: parsed.pickupText,
            pickupLat: parsed.pickupLat,
            pickupLng: parsed.pickupLng,
            dropoffText: parsed.dropoffText,
            dropoffLat: parsed.dropoffLat,
            dropoffLng: parsed.dropoffLng,
            pickupAt: new Date(parsed.pickupAt),
            pickupTimezone: parsed.pickupTimezone,
            etaAt: parsed.etaAt ? new Date(parsed.etaAt) : undefined,
            etaTimezone: parsed.etaTimezone,
            passengersCount: parsed.passengersCount,
            luggageCount: parsed.luggageCount,
            vehicleType: parsed.vehicleType,
            driverName: parsed.driverName,
            companyName: parsed.companyName,
            vehicleOnBoard: parsed.vehicleOnBoard,
            seat: parsed.seat,
            tollFees: parsed.tollFees,
            parkingFees: parsed.parkingFees,
            linkedFlightId: parsed.linkedFlightId,
          },
        },
      },
      include: { transportBooking: true },
    });

    if (!booking.transportBooking) throw new Error("transportBooking was not created alongside the booking");
    const { transportBooking } = booking;
    return {
      id: transportBooking.id,
      bookingId: booking.id,
      tripId: parsed.tripId,
      mode: transportBooking.mode,
      pickupText: transportBooking.pickupText,
      dropoffText: transportBooking.dropoffText,
      pickupAt: transportBooking.pickupAt.toISOString(),
      pickupTimezone: transportBooking.pickupTimezone,
      etaAt: transportBooking.etaAt ? transportBooking.etaAt.toISOString() : null,
      etaTimezone: transportBooking.etaTimezone,
      vehicleType: transportBooking.vehicleType,
      driverName: transportBooking.driverName,
      companyName: transportBooking.companyName,
      vehicleOnBoard: transportBooking.vehicleOnBoard,
      seat: transportBooking.seat,
      tollFees: transportBooking.tollFees ? Number(transportBooking.tollFees) : null,
      parkingFees: transportBooking.parkingFees ? Number(transportBooking.parkingFees) : null,
      personalRating: transportBooking.personalRating,
      agreedPrice: booking.agreedPrice ? Number(booking.agreedPrice) : null,
      agreedCurrencyCode: booking.agreedCurrencyCode,
      externalBookingId: booking.externalBookingId,
      cancellationPolicy: booking.cancellationPolicy,
      phone: booking.phone,
      whatsapp: booking.whatsapp,
      email: booking.email,
      website: booking.website,
      status: booking.status,
      notes: booking.notes,
      linkedFlightId: transportBooking.linkedFlightId,
      createdAt: booking.createdAt.toISOString(),
      deletedAt: null,
    };
  }

  async updateTransportBooking({ input }: { input: UpdateTransportBookingInput }): Promise<TransportBooking> {
    const parsed = updateTransportBookingInputSchema.parse(input);
    const existing = await this.prisma.transportBooking.findUnique({
      where: { id: parsed.transportBookingId },
      include: { booking: true },
    });
    if (!existing) throw new BookingNotFoundError(parsed.transportBookingId);

    const updated = await this.prisma.transportBooking.update({
      where: { id: parsed.transportBookingId },
      data: {
        pickupText: parsed.pickupText,
        dropoffText: parsed.dropoffText,
        pickupAt: parsed.pickupAt ? new Date(parsed.pickupAt) : undefined,
        pickupTimezone: parsed.pickupTimezone,
        etaAt: parsed.etaAt ? new Date(parsed.etaAt) : undefined,
        etaTimezone: parsed.etaTimezone,
        driverName: parsed.driverName,
        companyName: parsed.companyName,
        linkedFlightId: parsed.linkedFlightId,
      },
    });
    const booking =
      parsed.phone !== undefined || parsed.whatsapp !== undefined || parsed.notes !== undefined || parsed.agreedPrice !== undefined || parsed.agreedCurrencyCode !== undefined
        ? await this.prisma.booking.update({
            where: { id: existing.bookingId },
            data: {
              phone: parsed.phone,
              whatsapp: parsed.whatsapp,
              notes: parsed.notes,
              agreedPrice: parsed.agreedPrice,
              agreedCurrencyCode: parsed.agreedCurrencyCode,
            },
          })
        : existing.booking;

    return {
      id: updated.id,
      bookingId: updated.bookingId,
      tripId: booking.tripId,
      mode: updated.mode,
      pickupText: updated.pickupText,
      dropoffText: updated.dropoffText,
      pickupAt: updated.pickupAt.toISOString(),
      pickupTimezone: updated.pickupTimezone,
      etaAt: updated.etaAt ? updated.etaAt.toISOString() : null,
      etaTimezone: updated.etaTimezone,
      vehicleType: updated.vehicleType,
      driverName: updated.driverName,
      companyName: updated.companyName,
      vehicleOnBoard: updated.vehicleOnBoard,
      seat: updated.seat,
      tollFees: updated.tollFees ? Number(updated.tollFees) : null,
      parkingFees: updated.parkingFees ? Number(updated.parkingFees) : null,
      personalRating: updated.personalRating,
      agreedPrice: booking.agreedPrice ? Number(booking.agreedPrice) : null,
      agreedCurrencyCode: booking.agreedCurrencyCode,
      externalBookingId: booking.externalBookingId,
      cancellationPolicy: booking.cancellationPolicy,
      phone: booking.phone,
      whatsapp: booking.whatsapp,
      email: booking.email,
      website: booking.website,
      status: booking.status,
      notes: booking.notes,
      linkedFlightId: updated.linkedFlightId,
      createdAt: booking.createdAt.toISOString(),
      deletedAt: booking.deletedAt ? booking.deletedAt.toISOString() : null,
    };
  }

  async listInsurances({ tripId, includeDeleted = false }: { tripId: string; includeDeleted?: boolean }): Promise<Insurance[]> {
    const rows = await this.prisma.insurance.findMany({
      where: { booking: { tripId, ...(includeDeleted ? {} : { deletedAt: null }) } },
      include: { booking: true },
      orderBy: { startDate: "asc" },
    });
    return rows.map((row) => ({
      id: row.id,
      bookingId: row.bookingId,
      tripId,
      company: row.company,
      policyType: row.policyType,
      startDate: row.startDate.toISOString().slice(0, 10),
      endDate: row.endDate.toISOString().slice(0, 10),
      policyNumber: row.policyNumber,
      insuredNumber: row.insuredNumber,
      coverageNotes: row.coverageNotes,
      extensions: row.extensions,
      deductible: row.deductible ? Number(row.deductible) : null,
      emergencyPhone: row.emergencyPhone,
      emergencyWhatsapp: row.emergencyWhatsapp,
      emergencyEmail: row.emergencyEmail,
      emergencyWebsite: row.emergencyWebsite,
      emergencyInstructions: row.emergencyInstructions,
      agreedPrice: row.booking.agreedPrice ? Number(row.booking.agreedPrice) : null,
      agreedCurrencyCode: row.booking.agreedCurrencyCode,
      status: row.booking.status,
      notes: row.booking.notes,
      createdAt: row.booking.createdAt.toISOString(),
      deletedAt: row.booking.deletedAt ? row.booking.deletedAt.toISOString() : null,
    }));
  }

  async updateInsurance({ input }: { input: UpdateInsuranceInput }): Promise<Insurance> {
    const parsed = updateInsuranceInputSchema.parse(input);
    const existingRow = await this.prisma.insurance.findUnique({ where: { id: parsed.insuranceId }, include: { booking: true } });
    if (!existingRow) throw new BookingNotFoundError(parsed.insuranceId);

    const existing = await this.prisma.insurance.update({
      where: { id: parsed.insuranceId },
      data: {
        company: parsed.company,
        startDate: parsed.startDate ? new Date(parsed.startDate) : undefined,
        endDate: parsed.endDate ? new Date(parsed.endDate) : undefined,
        policyNumber: parsed.policyNumber,
      },
    });
    const booking =
      parsed.agreedPrice !== undefined || parsed.agreedCurrencyCode !== undefined
        ? await this.prisma.booking.update({
            where: { id: existingRow.bookingId },
            data: { agreedPrice: parsed.agreedPrice, agreedCurrencyCode: parsed.agreedCurrencyCode },
          })
        : existingRow.booking;

    return {
      id: existing.id,
      bookingId: existing.bookingId,
      tripId: booking.tripId,
      company: existing.company,
      policyType: existing.policyType,
      startDate: existing.startDate.toISOString().slice(0, 10),
      endDate: existing.endDate.toISOString().slice(0, 10),
      policyNumber: existing.policyNumber,
      insuredNumber: existing.insuredNumber,
      coverageNotes: existing.coverageNotes,
      extensions: existing.extensions,
      deductible: existing.deductible ? Number(existing.deductible) : null,
      emergencyPhone: existing.emergencyPhone,
      emergencyWhatsapp: existing.emergencyWhatsapp,
      emergencyEmail: existing.emergencyEmail,
      emergencyWebsite: existing.emergencyWebsite,
      emergencyInstructions: existing.emergencyInstructions,
      agreedPrice: booking.agreedPrice ? Number(booking.agreedPrice) : null,
      agreedCurrencyCode: booking.agreedCurrencyCode,
      status: booking.status,
      notes: booking.notes,
      createdAt: booking.createdAt.toISOString(),
      deletedAt: booking.deletedAt ? booking.deletedAt.toISOString() : null,
    };
  }

  async softDeleteInsurance({ insuranceId }: { insuranceId: string }): Promise<Insurance> {
    const existing = await this.prisma.insurance.findUnique({ where: { id: insuranceId }, include: { booking: true } });
    if (!existing) throw new BookingNotFoundError(insuranceId);
    const booking = await this.prisma.booking.update({ where: { id: existing.bookingId }, data: { deletedAt: new Date() } });
    return {
      id: existing.id,
      bookingId: existing.bookingId,
      tripId: booking.tripId,
      company: existing.company,
      policyType: existing.policyType,
      startDate: existing.startDate.toISOString().slice(0, 10),
      endDate: existing.endDate.toISOString().slice(0, 10),
      policyNumber: existing.policyNumber,
      insuredNumber: existing.insuredNumber,
      coverageNotes: existing.coverageNotes,
      extensions: existing.extensions,
      deductible: existing.deductible ? Number(existing.deductible) : null,
      emergencyPhone: existing.emergencyPhone,
      emergencyWhatsapp: existing.emergencyWhatsapp,
      emergencyEmail: existing.emergencyEmail,
      emergencyWebsite: existing.emergencyWebsite,
      emergencyInstructions: existing.emergencyInstructions,
      agreedPrice: booking.agreedPrice ? Number(booking.agreedPrice) : null,
      agreedCurrencyCode: booking.agreedCurrencyCode,
      status: booking.status,
      notes: booking.notes,
      createdAt: booking.createdAt.toISOString(),
      deletedAt: booking.deletedAt ? booking.deletedAt.toISOString() : null,
    };
  }

  async restoreInsurance({ insuranceId }: { insuranceId: string }): Promise<Insurance> {
    const existing = await this.prisma.insurance.findUnique({ where: { id: insuranceId }, include: { booking: true } });
    if (!existing) throw new BookingNotFoundError(insuranceId);
    const booking = await this.prisma.booking.update({ where: { id: existing.bookingId }, data: { deletedAt: null } });
    return {
      id: existing.id,
      bookingId: existing.bookingId,
      tripId: booking.tripId,
      company: existing.company,
      policyType: existing.policyType,
      startDate: existing.startDate.toISOString().slice(0, 10),
      endDate: existing.endDate.toISOString().slice(0, 10),
      policyNumber: existing.policyNumber,
      insuredNumber: existing.insuredNumber,
      coverageNotes: existing.coverageNotes,
      extensions: existing.extensions,
      deductible: existing.deductible ? Number(existing.deductible) : null,
      emergencyPhone: existing.emergencyPhone,
      emergencyWhatsapp: existing.emergencyWhatsapp,
      emergencyEmail: existing.emergencyEmail,
      emergencyWebsite: existing.emergencyWebsite,
      emergencyInstructions: existing.emergencyInstructions,
      agreedPrice: booking.agreedPrice ? Number(booking.agreedPrice) : null,
      agreedCurrencyCode: booking.agreedCurrencyCode,
      status: booking.status,
      notes: booking.notes,
      createdAt: booking.createdAt.toISOString(),
      deletedAt: booking.deletedAt ? booking.deletedAt.toISOString() : null,
    };
  }

  async listActivityReservations({
    tripId,
    includeDeleted = false,
  }: {
    tripId: string;
    includeDeleted?: boolean;
  }): Promise<ActivityReservation[]> {
    const rows = await this.prisma.activityReservation.findMany({
      where: { booking: { tripId, ...(includeDeleted ? {} : { deletedAt: null }) } },
      include: { booking: true },
      orderBy: { activityDate: "asc" },
    });
    return rows.map((row) => ({
      id: row.id,
      bookingId: row.bookingId,
      tripId,
      venueName: row.venueName,
      activityDate: row.activityDate.toISOString().slice(0, 10),
      activityTime: row.activityTime,
      ticketType: row.ticketType,
      confirmationDetails: row.confirmationDetails,
      agreedPrice: row.booking.agreedPrice ? Number(row.booking.agreedPrice) : null,
      agreedCurrencyCode: row.booking.agreedCurrencyCode,
      status: row.booking.status,
      notes: row.booking.notes,
      createdAt: row.booking.createdAt.toISOString(),
      deletedAt: row.booking.deletedAt ? row.booking.deletedAt.toISOString() : null,
    }));
  }

  async updateActivityReservation({ input }: { input: UpdateActivityReservationInput }): Promise<ActivityReservation> {
    const parsed = updateActivityReservationInputSchema.parse(input);
    const existingRow = await this.prisma.activityReservation.findUnique({ where: { id: parsed.activityReservationId }, include: { booking: true } });
    if (!existingRow) throw new BookingNotFoundError(parsed.activityReservationId);

    const existing = await this.prisma.activityReservation.update({
      where: { id: parsed.activityReservationId },
      data: {
        venueName: parsed.venueName,
        activityDate: parsed.activityDate ? new Date(parsed.activityDate) : undefined,
      },
    });
    const booking =
      parsed.agreedPrice !== undefined || parsed.agreedCurrencyCode !== undefined
        ? await this.prisma.booking.update({
            where: { id: existingRow.bookingId },
            data: { agreedPrice: parsed.agreedPrice, agreedCurrencyCode: parsed.agreedCurrencyCode },
          })
        : existingRow.booking;

    return {
      id: existing.id,
      bookingId: existing.bookingId,
      tripId: booking.tripId,
      venueName: existing.venueName,
      activityDate: existing.activityDate.toISOString().slice(0, 10),
      activityTime: existing.activityTime,
      ticketType: existing.ticketType,
      confirmationDetails: existing.confirmationDetails,
      agreedPrice: booking.agreedPrice ? Number(booking.agreedPrice) : null,
      agreedCurrencyCode: booking.agreedCurrencyCode,
      status: booking.status,
      notes: booking.notes,
      createdAt: booking.createdAt.toISOString(),
      deletedAt: booking.deletedAt ? booking.deletedAt.toISOString() : null,
    };
  }

  async softDeleteActivityReservation({ activityReservationId }: { activityReservationId: string }): Promise<ActivityReservation> {
    const existing = await this.prisma.activityReservation.findUnique({ where: { id: activityReservationId }, include: { booking: true } });
    if (!existing) throw new BookingNotFoundError(activityReservationId);
    const booking = await this.prisma.booking.update({ where: { id: existing.bookingId }, data: { deletedAt: new Date() } });
    return {
      id: existing.id,
      bookingId: existing.bookingId,
      tripId: booking.tripId,
      venueName: existing.venueName,
      activityDate: existing.activityDate.toISOString().slice(0, 10),
      activityTime: existing.activityTime,
      ticketType: existing.ticketType,
      confirmationDetails: existing.confirmationDetails,
      agreedPrice: booking.agreedPrice ? Number(booking.agreedPrice) : null,
      agreedCurrencyCode: booking.agreedCurrencyCode,
      status: booking.status,
      notes: booking.notes,
      createdAt: booking.createdAt.toISOString(),
      deletedAt: booking.deletedAt ? booking.deletedAt.toISOString() : null,
    };
  }

  async restoreActivityReservation({ activityReservationId }: { activityReservationId: string }): Promise<ActivityReservation> {
    const existing = await this.prisma.activityReservation.findUnique({ where: { id: activityReservationId }, include: { booking: true } });
    if (!existing) throw new BookingNotFoundError(activityReservationId);
    const booking = await this.prisma.booking.update({ where: { id: existing.bookingId }, data: { deletedAt: null } });
    return {
      id: existing.id,
      bookingId: existing.bookingId,
      tripId: booking.tripId,
      venueName: existing.venueName,
      activityDate: existing.activityDate.toISOString().slice(0, 10),
      activityTime: existing.activityTime,
      ticketType: existing.ticketType,
      confirmationDetails: existing.confirmationDetails,
      agreedPrice: booking.agreedPrice ? Number(booking.agreedPrice) : null,
      agreedCurrencyCode: booking.agreedCurrencyCode,
      status: booking.status,
      notes: booking.notes,
      createdAt: booking.createdAt.toISOString(),
      deletedAt: booking.deletedAt ? booking.deletedAt.toISOString() : null,
    };
  }

  async listCarRentals({ tripId, includeDeleted = false }: { tripId: string; includeDeleted?: boolean }): Promise<CarRental[]> {
    const rows = await this.prisma.carRental.findMany({
      where: { booking: { tripId, ...(includeDeleted ? {} : { deletedAt: null }) } },
      include: { booking: true },
      orderBy: { pickupAt: "asc" },
    });
    return rows.map((row) => ({
      id: row.id,
      bookingId: row.bookingId,
      tripId,
      vehicleType: row.vehicleType,
      companyName: row.companyName,
      model: row.model,
      licensePlate: row.licensePlate,
      pickupLocationText: row.pickupLocationText,
      pickupAt: row.pickupAt.toISOString(),
      pickupTimezone: row.pickupTimezone,
      dropoffLocationText: row.dropoffLocationText,
      dropoffAt: row.dropoffAt ? row.dropoffAt.toISOString() : null,
      dropoffTimezone: row.dropoffTimezone,
      driverRequirements: row.driverRequirements,
      insuranceIncluded: row.insuranceIncluded,
      depositAmount: row.depositAmount ? Number(row.depositAmount) : null,
      depositCurrencyCode: row.depositCurrencyCode,
      agreedPrice: row.booking.agreedPrice ? Number(row.booking.agreedPrice) : null,
      agreedCurrencyCode: row.booking.agreedCurrencyCode,
      externalBookingId: row.booking.externalBookingId,
      cancellationPolicy: row.booking.cancellationPolicy,
      phone: row.booking.phone,
      whatsapp: row.booking.whatsapp,
      email: row.booking.email,
      website: row.booking.website,
      confirmationNumber: row.booking.confirmationNumber,
      status: row.booking.status,
      notes: row.booking.notes,
      createdAt: row.booking.createdAt.toISOString(),
      deletedAt: row.booking.deletedAt ? row.booking.deletedAt.toISOString() : null,
    }));
  }

  async updateCarRental({ input }: { input: UpdateCarRentalInput }): Promise<CarRental> {
    const parsed = updateCarRentalInputSchema.parse(input);
    const existingRow = await this.prisma.carRental.findUnique({ where: { id: parsed.carRentalId }, include: { booking: true } });
    if (!existingRow) throw new BookingNotFoundError(parsed.carRentalId);

    const existing = await this.prisma.carRental.update({
      where: { id: parsed.carRentalId },
      data: {
        companyName: parsed.companyName,
        pickupAt: parsed.pickupAt ? new Date(parsed.pickupAt) : undefined,
        dropoffAt: parsed.dropoffAt ? new Date(parsed.dropoffAt) : undefined,
        depositAmount: parsed.depositAmount,
        depositCurrencyCode: parsed.depositCurrencyCode,
      },
    });
    const booking =
      parsed.agreedPrice !== undefined || parsed.agreedCurrencyCode !== undefined
        ? await this.prisma.booking.update({
            where: { id: existingRow.bookingId },
            data: { agreedPrice: parsed.agreedPrice, agreedCurrencyCode: parsed.agreedCurrencyCode },
          })
        : existingRow.booking;

    return {
      id: existing.id,
      bookingId: existing.bookingId,
      tripId: booking.tripId,
      vehicleType: existing.vehicleType,
      companyName: existing.companyName,
      model: existing.model,
      licensePlate: existing.licensePlate,
      pickupLocationText: existing.pickupLocationText,
      pickupAt: existing.pickupAt.toISOString(),
      pickupTimezone: existing.pickupTimezone,
      dropoffLocationText: existing.dropoffLocationText,
      dropoffAt: existing.dropoffAt ? existing.dropoffAt.toISOString() : null,
      dropoffTimezone: existing.dropoffTimezone,
      driverRequirements: existing.driverRequirements,
      insuranceIncluded: existing.insuranceIncluded,
      depositAmount: existing.depositAmount ? Number(existing.depositAmount) : null,
      depositCurrencyCode: existing.depositCurrencyCode,
      agreedPrice: booking.agreedPrice ? Number(booking.agreedPrice) : null,
      agreedCurrencyCode: booking.agreedCurrencyCode,
      externalBookingId: booking.externalBookingId,
      cancellationPolicy: booking.cancellationPolicy,
      phone: booking.phone,
      whatsapp: booking.whatsapp,
      email: booking.email,
      website: booking.website,
      confirmationNumber: booking.confirmationNumber,
      status: booking.status,
      notes: booking.notes,
      createdAt: booking.createdAt.toISOString(),
      deletedAt: booking.deletedAt ? booking.deletedAt.toISOString() : null,
    };
  }

  async softDeleteCarRental({ carRentalId }: { carRentalId: string }): Promise<CarRental> {
    const existing = await this.prisma.carRental.findUnique({ where: { id: carRentalId }, include: { booking: true } });
    if (!existing) throw new BookingNotFoundError(carRentalId);
    const booking = await this.prisma.booking.update({ where: { id: existing.bookingId }, data: { deletedAt: new Date() } });
    return {
      id: existing.id,
      bookingId: existing.bookingId,
      tripId: booking.tripId,
      vehicleType: existing.vehicleType,
      companyName: existing.companyName,
      model: existing.model,
      licensePlate: existing.licensePlate,
      pickupLocationText: existing.pickupLocationText,
      pickupAt: existing.pickupAt.toISOString(),
      pickupTimezone: existing.pickupTimezone,
      dropoffLocationText: existing.dropoffLocationText,
      dropoffAt: existing.dropoffAt ? existing.dropoffAt.toISOString() : null,
      dropoffTimezone: existing.dropoffTimezone,
      driverRequirements: existing.driverRequirements,
      insuranceIncluded: existing.insuranceIncluded,
      depositAmount: existing.depositAmount ? Number(existing.depositAmount) : null,
      depositCurrencyCode: existing.depositCurrencyCode,
      agreedPrice: booking.agreedPrice ? Number(booking.agreedPrice) : null,
      agreedCurrencyCode: booking.agreedCurrencyCode,
      externalBookingId: booking.externalBookingId,
      cancellationPolicy: booking.cancellationPolicy,
      phone: booking.phone,
      whatsapp: booking.whatsapp,
      email: booking.email,
      website: booking.website,
      confirmationNumber: booking.confirmationNumber,
      status: booking.status,
      notes: booking.notes,
      createdAt: booking.createdAt.toISOString(),
      deletedAt: booking.deletedAt ? booking.deletedAt.toISOString() : null,
    };
  }

  async restoreCarRental({ carRentalId }: { carRentalId: string }): Promise<CarRental> {
    const existing = await this.prisma.carRental.findUnique({ where: { id: carRentalId }, include: { booking: true } });
    if (!existing) throw new BookingNotFoundError(carRentalId);
    const booking = await this.prisma.booking.update({ where: { id: existing.bookingId }, data: { deletedAt: null } });
    return {
      id: existing.id,
      bookingId: existing.bookingId,
      tripId: booking.tripId,
      vehicleType: existing.vehicleType,
      companyName: existing.companyName,
      model: existing.model,
      licensePlate: existing.licensePlate,
      pickupLocationText: existing.pickupLocationText,
      pickupAt: existing.pickupAt.toISOString(),
      pickupTimezone: existing.pickupTimezone,
      dropoffLocationText: existing.dropoffLocationText,
      dropoffAt: existing.dropoffAt ? existing.dropoffAt.toISOString() : null,
      dropoffTimezone: existing.dropoffTimezone,
      driverRequirements: existing.driverRequirements,
      insuranceIncluded: existing.insuranceIncluded,
      depositAmount: existing.depositAmount ? Number(existing.depositAmount) : null,
      depositCurrencyCode: existing.depositCurrencyCode,
      agreedPrice: booking.agreedPrice ? Number(booking.agreedPrice) : null,
      agreedCurrencyCode: booking.agreedCurrencyCode,
      externalBookingId: booking.externalBookingId,
      cancellationPolicy: booking.cancellationPolicy,
      phone: booking.phone,
      whatsapp: booking.whatsapp,
      email: booking.email,
      website: booking.website,
      confirmationNumber: booking.confirmationNumber,
      status: booking.status,
      notes: booking.notes,
      createdAt: booking.createdAt.toISOString(),
      deletedAt: booking.deletedAt ? booking.deletedAt.toISOString() : null,
    };
  }

  async createCarRental({ input }: { input: CreateCarRentalInput }): Promise<CarRental> {
    const parsed = createCarRentalInputSchema.parse(input);
    const booking = await this.prisma.booking.create({
      data: {
        tripId: parsed.tripId,
        bookingType: "car_rental",
        status: "booked",
        agreedPrice: parsed.agreedPrice,
        agreedCurrencyCode: parsed.agreedCurrencyCode,
        externalBookingId: parsed.externalBookingId,
        cancellationPolicy: parsed.cancellationPolicy,
        phone: parsed.phone,
        whatsapp: parsed.whatsapp,
        email: parsed.email,
        website: parsed.website,
        confirmationNumber: parsed.confirmationNumber,
        notes: parsed.notes,
        carRental: {
          create: {
            vehicleType: parsed.vehicleType,
            companyName: parsed.companyName,
            model: parsed.model,
            licensePlate: parsed.licensePlate,
            pickupLocationText: parsed.pickupLocationText,
            pickupAt: new Date(parsed.pickupAt),
            pickupTimezone: parsed.pickupTimezone,
            dropoffLocationText: parsed.dropoffLocationText,
            dropoffAt: parsed.dropoffAt ? new Date(parsed.dropoffAt) : undefined,
            dropoffTimezone: parsed.dropoffTimezone,
            driverRequirements: parsed.driverRequirements,
            insuranceIncluded: parsed.insuranceIncluded ?? false,
            depositAmount: parsed.depositAmount,
            depositCurrencyCode: parsed.depositCurrencyCode,
          },
        },
      },
      include: { carRental: true },
    });

    if (!booking.carRental) throw new Error("carRental was not created alongside the booking");
    const { carRental } = booking;
    return {
      id: carRental.id,
      bookingId: booking.id,
      tripId: parsed.tripId,
      vehicleType: carRental.vehicleType,
      companyName: carRental.companyName,
      model: carRental.model,
      licensePlate: carRental.licensePlate,
      pickupLocationText: carRental.pickupLocationText,
      pickupAt: carRental.pickupAt.toISOString(),
      pickupTimezone: carRental.pickupTimezone,
      dropoffLocationText: carRental.dropoffLocationText,
      dropoffAt: carRental.dropoffAt ? carRental.dropoffAt.toISOString() : null,
      dropoffTimezone: carRental.dropoffTimezone,
      driverRequirements: carRental.driverRequirements,
      insuranceIncluded: carRental.insuranceIncluded,
      depositAmount: carRental.depositAmount ? Number(carRental.depositAmount) : null,
      depositCurrencyCode: carRental.depositCurrencyCode,
      agreedPrice: booking.agreedPrice ? Number(booking.agreedPrice) : null,
      agreedCurrencyCode: booking.agreedCurrencyCode,
      externalBookingId: booking.externalBookingId,
      cancellationPolicy: booking.cancellationPolicy,
      phone: booking.phone,
      whatsapp: booking.whatsapp,
      email: booking.email,
      website: booking.website,
      confirmationNumber: booking.confirmationNumber,
      status: booking.status,
      notes: booking.notes,
      createdAt: booking.createdAt.toISOString(),
      deletedAt: null,
    };
  }

  async createInsurance({ input }: { input: CreateInsuranceInput }): Promise<Insurance> {
    const parsed = createInsuranceInputSchema.parse(input);
    const booking = await this.prisma.booking.create({
      data: {
        tripId: parsed.tripId,
        bookingType: "insurance",
        status: "booked",
        agreedPrice: parsed.agreedPrice,
        agreedCurrencyCode: parsed.agreedCurrencyCode,
        notes: parsed.notes,
        insurance: {
          create: {
            company: parsed.company,
            policyType: parsed.policyType,
            startDate: new Date(parsed.startDate),
            endDate: new Date(parsed.endDate),
            policyNumber: parsed.policyNumber,
            insuredNumber: parsed.insuredNumber,
            coverageNotes: parsed.coverageNotes,
            extensions: parsed.extensions,
            deductible: parsed.deductible,
            emergencyPhone: parsed.emergencyPhone,
            emergencyWhatsapp: parsed.emergencyWhatsapp,
            emergencyEmail: parsed.emergencyEmail,
            emergencyWebsite: parsed.emergencyWebsite,
            emergencyInstructions: parsed.emergencyInstructions,
          },
        },
      },
      include: { insurance: true },
    });

    if (!booking.insurance) throw new Error("insurance was not created alongside the booking");
    const { insurance } = booking;
    return {
      id: insurance.id,
      bookingId: booking.id,
      tripId: parsed.tripId,
      company: insurance.company,
      policyType: insurance.policyType,
      startDate: insurance.startDate.toISOString().slice(0, 10),
      endDate: insurance.endDate.toISOString().slice(0, 10),
      policyNumber: insurance.policyNumber,
      insuredNumber: insurance.insuredNumber,
      coverageNotes: insurance.coverageNotes,
      extensions: insurance.extensions,
      deductible: insurance.deductible ? Number(insurance.deductible) : null,
      emergencyPhone: insurance.emergencyPhone,
      emergencyWhatsapp: insurance.emergencyWhatsapp,
      emergencyEmail: insurance.emergencyEmail,
      emergencyWebsite: insurance.emergencyWebsite,
      emergencyInstructions: insurance.emergencyInstructions,
      agreedPrice: booking.agreedPrice ? Number(booking.agreedPrice) : null,
      agreedCurrencyCode: booking.agreedCurrencyCode,
      status: booking.status,
      notes: booking.notes,
      createdAt: booking.createdAt.toISOString(),
      deletedAt: null,
    };
  }

  async createActivityReservation({ input }: { input: CreateActivityReservationInput }): Promise<ActivityReservation> {
    const parsed = createActivityReservationInputSchema.parse(input);
    const booking = await this.prisma.booking.create({
      data: {
        tripId: parsed.tripId,
        bookingType: "activity_reservation",
        status: "booked",
        agreedPrice: parsed.agreedPrice,
        agreedCurrencyCode: parsed.agreedCurrencyCode,
        notes: parsed.notes,
        activityReservation: {
          create: {
            venueName: parsed.venueName,
            activityDate: new Date(parsed.activityDate),
            activityTime: parsed.activityTime,
            ticketType: parsed.ticketType,
            confirmationDetails: parsed.confirmationDetails,
          },
        },
      },
      include: { activityReservation: true },
    });

    if (!booking.activityReservation) throw new Error("activity reservation was not created alongside the booking");
    const { activityReservation } = booking;
    return {
      id: activityReservation.id,
      bookingId: booking.id,
      tripId: parsed.tripId,
      venueName: activityReservation.venueName,
      activityDate: activityReservation.activityDate.toISOString().slice(0, 10),
      activityTime: activityReservation.activityTime,
      ticketType: activityReservation.ticketType,
      confirmationDetails: activityReservation.confirmationDetails,
      agreedPrice: booking.agreedPrice ? Number(booking.agreedPrice) : null,
      agreedCurrencyCode: booking.agreedCurrencyCode,
      status: booking.status,
      notes: booking.notes,
      createdAt: booking.createdAt.toISOString(),
      deletedAt: null,
    };
  }

  async listBookingBenefits({ bookingId }: { bookingId: string }): Promise<BookingBenefit[]> {
    const rows = await this.prisma.bookingBenefit.findMany({ where: { bookingId } });
    return rows.map((row) => ({
      id: row.id,
      bookingId: row.bookingId,
      benefitName: row.benefitName,
      benefitType: row.benefitType,
      notes: row.notes,
      valueAmount: row.valueAmount ? Number(row.valueAmount) : null,
      valueCurrencyCode: row.valueCurrencyCode,
    }));
  }

  async listBookingBenefitsForBookingIds({ bookingIds }: { bookingIds: string[] }): Promise<BookingBenefit[]> {
    if (bookingIds.length === 0) return [];
    const rows = await this.prisma.bookingBenefit.findMany({ where: { bookingId: { in: bookingIds } } });
    return rows.map((row) => ({
      id: row.id,
      bookingId: row.bookingId,
      benefitName: row.benefitName,
      benefitType: row.benefitType,
      notes: row.notes,
      valueAmount: row.valueAmount ? Number(row.valueAmount) : null,
      valueCurrencyCode: row.valueCurrencyCode,
    }));
  }

  async createBookingBenefit({ input }: { input: CreateBookingBenefitInput }): Promise<BookingBenefit> {
    const parsed = createBookingBenefitInputSchema.parse(input);
    const row = await this.prisma.bookingBenefit.create({
      data: {
        bookingId: parsed.bookingId,
        benefitName: parsed.benefitName,
        benefitType: parsed.benefitType,
        notes: parsed.notes,
        valueAmount: parsed.valueAmount,
        valueCurrencyCode: parsed.valueCurrencyCode,
      },
    });
    return {
      id: row.id,
      bookingId: row.bookingId,
      benefitName: row.benefitName,
      benefitType: row.benefitType,
      notes: row.notes,
      valueAmount: row.valueAmount ? Number(row.valueAmount) : null,
      valueCurrencyCode: row.valueCurrencyCode,
    };
  }

  async deleteBookingBenefit({ benefitId }: { benefitId: string }): Promise<void> {
    await this.prisma.bookingBenefit.delete({ where: { id: benefitId } });
  }

  async listTransportQuotes({ tripId }: { tripId: string }): Promise<TransportQuote[]> {
    const rows = await this.prisma.transportQuote.findMany({ where: { tripId }, orderBy: { price: "asc" } });
    return rows.map((row) => ({
      id: row.id,
      tripId: row.tripId,
      transportBookingId: row.transportBookingId,
      provider: row.provider,
      price: Number(row.price),
      currencyCode: row.currencyCode,
      vehicleType: row.vehicleType,
      terms: row.terms,
      notes: row.notes,
      isSelected: row.isSelected,
      createdAt: row.createdAt.toISOString(),
    }));
  }

  async createTransportQuote({ input }: { input: CreateTransportQuoteInput }): Promise<TransportQuote> {
    const parsed = createTransportQuoteInputSchema.parse(input);
    const row = await this.prisma.transportQuote.create({
      data: {
        tripId: parsed.tripId,
        provider: parsed.provider,
        price: parsed.price,
        currencyCode: parsed.currencyCode,
        vehicleType: parsed.vehicleType,
        terms: parsed.terms,
        notes: parsed.notes,
      },
    });
    return {
      id: row.id,
      tripId: row.tripId,
      transportBookingId: row.transportBookingId,
      provider: row.provider,
      price: Number(row.price),
      currencyCode: row.currencyCode,
      vehicleType: row.vehicleType,
      terms: row.terms,
      notes: row.notes,
      isSelected: row.isSelected,
      createdAt: row.createdAt.toISOString(),
    };
  }

  async toggleTransportQuoteSelected({ quoteId }: { quoteId: string }): Promise<TransportQuote> {
    const existing = await this.prisma.transportQuote.findUnique({ where: { id: quoteId } });
    if (!existing) throw new BookingNotFoundError(quoteId);
    const row = await this.prisma.transportQuote.update({ where: { id: quoteId }, data: { isSelected: !existing.isSelected } });
    return {
      id: row.id,
      tripId: row.tripId,
      transportBookingId: row.transportBookingId,
      provider: row.provider,
      price: Number(row.price),
      currencyCode: row.currencyCode,
      vehicleType: row.vehicleType,
      terms: row.terms,
      notes: row.notes,
      isSelected: row.isSelected,
      createdAt: row.createdAt.toISOString(),
    };
  }

  async deleteTransportQuote({ quoteId }: { quoteId: string }): Promise<void> {
    await this.prisma.transportQuote.delete({ where: { id: quoteId } });
  }

  async linkTransportQuoteToBooking({
    quoteId,
    transportBookingId,
  }: {
    quoteId: string;
    transportBookingId: string;
  }): Promise<TransportQuote> {
    const row = await this.prisma.transportQuote.update({
      where: { id: quoteId },
      data: { transportBookingId, isSelected: true },
    });
    return {
      id: row.id,
      tripId: row.tripId,
      transportBookingId: row.transportBookingId,
      provider: row.provider,
      price: Number(row.price),
      currencyCode: row.currencyCode,
      vehicleType: row.vehicleType,
      terms: row.terms,
      notes: row.notes,
      isSelected: row.isSelected,
      createdAt: row.createdAt.toISOString(),
    };
  }
}
