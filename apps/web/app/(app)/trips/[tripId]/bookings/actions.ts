"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
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
  type SetFlightAirportTimingInput,
  setFlightCheckInWindowInputSchema,
  type SetFlightCheckInWindowInput,
  updateHotelStayPersonalRatingInputSchema,
  updateTransportBookingInputSchema,
  updateTransportBookingPersonalRatingInputSchema,
} from "@travel-app/shared-types";
import { getBookingRepository, getPlannedActivityRepository, getTripRepository } from "@travel-app/data-layer";
import { getCurrentUser } from "@/lib/auth/get-current-user";
import { getFlightStatusProvider } from "@/lib/flight-status/get-flight-status-provider";
import { isFlightStatusConfigured } from "@/lib/flight-status/config";
import { FLIGHT_LIVE_STATUS_LABELS } from "@/lib/flight-live-status-labels";
import { sendPushToUser } from "@/lib/push/send-push";
import { logger } from "@/lib/logger";

export interface BookingFormState {
  fieldErrors?: Record<string, string[]>;
  formError?: string;
  /** מזהה הישות שנוצרה — כדי שהוספה-מהירה (quick-add-panel-content.tsx) תוכל
   * להציע מיד "צרף מסמך/קבלה לזה" בלי לצאת מהפאנל. */
  createdId?: string;
}

async function assertTripOwnership(userId: string, tripId: string): Promise<void> {
  const tripRepository = await getTripRepository();
  const trip = await tripRepository.getById({ userId, tripId });
  if (!trip) {
    throw new Error("הטיול לא נמצא או שאין לך הרשאה אליו");
  }
}

function readOptionalString(formData: FormData, key: string): string | undefined {
  const value = formData.get(key);
  if (typeof value !== "string" || value.trim() === "") return undefined;
  return value;
}

function readOptionalNumber(formData: FormData, key: string): number | undefined {
  const value = formData.get(key);
  if (typeof value !== "string" || value.trim() === "") return undefined;
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : undefined;
}

// input type="datetime-local" מחזיר "YYYY-MM-DDTHH:mm" בלי אזור זמן. ממירים
// ל-ISO תקין כדי לעבור את ולידציית z.iso.datetime(). הערה: זו הנחה פשטנית
// שמתייחסת לערך כ-UTC — המרה מדויקת לפי departureTimezone/pickupTimezone
// (עם ספריית IANA אמיתית) היא עבודה שנדחית לשלב בו Time Zones נבנים במלואם.
function toIsoDateTime(localValue: FormDataEntryValue | null): string {
  if (typeof localValue !== "string" || localValue === "") return "";
  return localValue.length === 16 ? `${localValue}:00.000Z` : localValue;
}

// כשההזמנה נוצרת מהמרת "תכנון עתידי" (Planned Activity), מקשרים את
// bookingId האמיתי (לא id של תת-הטבלה) ל-Planned Activity ומעבירים אותה
// לסטטוס booked. לא מוחקים/משכפלים את הרשומה — היא נשארת כרשומת התכנון
// ההיסטורית, עם הפניה להזמנה האמיתית.
async function linkPlannedActivityIfNeeded(tripId: string, plannedActivityId: string | null, bookingId: string): Promise<void> {
  if (!plannedActivityId) return;
  const plannedActivityRepository = await getPlannedActivityRepository();
  await plannedActivityRepository.linkToBooking({ plannedActivityId, bookingId });
  logger.info("planned activity converted to booking", { plannedActivityId, bookingId, tripId });
  redirect(`/trips/${tripId}`);
}

export async function createHotelStayAction(
  tripId: string,
  plannedActivityId: string | null,
  _prevState: BookingFormState,
  formData: FormData,
): Promise<BookingFormState> {
  const user = await getCurrentUser();
  if (!user) redirect("/login");

  try {
    await assertTripOwnership(user.id, tripId);
  } catch {
    return { formError: "הטיול לא נמצא או שאין לך הרשאה אליו." };
  }

  const parsed = createHotelStayInputSchema.safeParse({
    tripId,
    hotelName: formData.get("hotelName"),
    checkInDate: formData.get("checkInDate"),
    checkOutDate: formData.get("checkOutDate"),
    checkInTime: readOptionalString(formData, "checkInTime"),
    checkOutTime: readOptionalString(formData, "checkOutTime"),
    address: readOptionalString(formData, "address"),
    lat: readOptionalNumber(formData, "lat"),
    lng: readOptionalNumber(formData, "lng"),
    roomType: readOptionalString(formData, "roomType"),
    floor: readOptionalString(formData, "floor"),
    view: readOptionalString(formData, "view"),
    bedType: readOptionalString(formData, "bedType"),
    guestsCount: readOptionalNumber(formData, "guestsCount"),
    breakfastHours: readOptionalString(formData, "breakfastHours"),
    breakfastLocation: readOptionalString(formData, "breakfastLocation"),
    breakfastPrice: readOptionalNumber(formData, "breakfastPrice"),
    breakfastPriceUnit: readOptionalString(formData, "breakfastPriceUnit"),
    earlyCheckIn: formData.get("earlyCheckIn") === "on",
    lateCheckOut: formData.get("lateCheckOut") === "on",
    smoking: formData.get("smoking") === "on",
    externalBookingId: readOptionalString(formData, "externalBookingId"),
    cancellationPolicy: readOptionalString(formData, "cancellationPolicy"),
    phone: readOptionalString(formData, "phone"),
    whatsapp: readOptionalString(formData, "whatsapp"),
    email: readOptionalString(formData, "email"),
    website: readOptionalString(formData, "website"),
    agreedCurrencyCode: readOptionalString(formData, "agreedCurrencyCode"),
    agreedPrice: readOptionalString(formData, "agreedPrice")
      ? Number(readOptionalString(formData, "agreedPrice"))
      : undefined,
    confirmationNumber: readOptionalString(formData, "confirmationNumber"),
  });

  if (!parsed.success) {
    return { fieldErrors: parsed.error.flatten().fieldErrors };
  }

  const bookingRepository = await getBookingRepository();
  const hotelStay = await bookingRepository.createHotelStay({ input: parsed.data });
  logger.info("hotel stay created", { hotelStayId: hotelStay.id, tripId });

  revalidatePath(`/trips/${tripId}`);
  await linkPlannedActivityIfNeeded(tripId, plannedActivityId, hotelStay.bookingId);
  return { createdId: hotelStay.id };
}

export async function createFlightAction(
  tripId: string,
  plannedActivityId: string | null,
  _prevState: BookingFormState,
  formData: FormData,
): Promise<BookingFormState> {
  const user = await getCurrentUser();
  if (!user) redirect("/login");

  try {
    await assertTripOwnership(user.id, tripId);
  } catch {
    return { formError: "הטיול לא נמצא או שאין לך הרשאה אליו." };
  }

  const parsed = createFlightInputSchema.safeParse({
    tripId,
    airline: formData.get("airline"),
    flightNumber: readOptionalString(formData, "flightNumber"),
    departureAirport: formData.get("departureAirport"),
    arrivalAirport: formData.get("arrivalAirport"),
    departureAt: toIsoDateTime(formData.get("departureAt")),
    departureTimezone: formData.get("departureTimezone"),
    arrivalAt: toIsoDateTime(formData.get("arrivalAt")),
    arrivalTimezone: formData.get("arrivalTimezone"),
    departureTerminal: readOptionalString(formData, "departureTerminal"),
    arrivalTerminal: readOptionalString(formData, "arrivalTerminal"),
    seat: readOptionalString(formData, "seat"),
    baggage: readOptionalString(formData, "baggage"),
    legType: readOptionalString(formData, "legType"),
    agreedPrice: readOptionalNumber(formData, "agreedPrice"),
    agreedCurrencyCode: readOptionalString(formData, "agreedCurrencyCode"),
    externalBookingId: readOptionalString(formData, "externalBookingId"),
    cancellationPolicy: readOptionalString(formData, "cancellationPolicy"),
    phone: readOptionalString(formData, "phone"),
    whatsapp: readOptionalString(formData, "whatsapp"),
    email: readOptionalString(formData, "email"),
    website: readOptionalString(formData, "website"),
    confirmationNumber: readOptionalString(formData, "confirmationNumber"),
  });

  if (!parsed.success) {
    return { fieldErrors: parsed.error.flatten().fieldErrors };
  }

  const bookingRepository = await getBookingRepository();
  const flight = await bookingRepository.createFlight({ input: parsed.data });
  logger.info("flight created", { flightId: flight.id, tripId });

  revalidatePath(`/trips/${tripId}`);
  await linkPlannedActivityIfNeeded(tripId, plannedActivityId, flight.bookingId);
  return { createdId: flight.id };
}

export async function createTransportBookingAction(
  tripId: string,
  plannedActivityId: string | null,
  sourceQuoteId: string | null,
  _prevState: BookingFormState,
  formData: FormData,
): Promise<BookingFormState> {
  const user = await getCurrentUser();
  if (!user) redirect("/login");

  try {
    await assertTripOwnership(user.id, tripId);
  } catch {
    return { formError: "הטיול לא נמצא או שאין לך הרשאה אליו." };
  }

  const parsed = createTransportBookingInputSchema.safeParse({
    tripId,
    mode: formData.get("mode"),
    pickupText: readOptionalString(formData, "pickupText"),
    dropoffText: readOptionalString(formData, "dropoffText"),
    pickupAt: toIsoDateTime(formData.get("pickupAt")),
    pickupTimezone: formData.get("pickupTimezone"),
    etaAt: formData.get("etaAt") ? toIsoDateTime(formData.get("etaAt")) : undefined,
    etaTimezone: readOptionalString(formData, "etaTimezone"),
    driverName: readOptionalString(formData, "driverName"),
    companyName: readOptionalString(formData, "companyName"),
    vehicleType: readOptionalString(formData, "vehicleType"),
    agreedPrice: readOptionalNumber(formData, "agreedPrice"),
    agreedCurrencyCode: readOptionalString(formData, "agreedCurrencyCode"),
    vehicleOnBoard: readOptionalString(formData, "vehicleOnBoard"),
    seat: readOptionalString(formData, "seat"),
    tollFees: readOptionalNumber(formData, "tollFees"),
    parkingFees: readOptionalNumber(formData, "parkingFees"),
    externalBookingId: readOptionalString(formData, "externalBookingId"),
    cancellationPolicy: readOptionalString(formData, "cancellationPolicy"),
    phone: readOptionalString(formData, "phone"),
    whatsapp: readOptionalString(formData, "whatsapp"),
    email: readOptionalString(formData, "email"),
    website: readOptionalString(formData, "website"),
    linkedFlightId: readOptionalString(formData, "linkedFlightId"),
  });

  if (!parsed.success) {
    return { fieldErrors: parsed.error.flatten().fieldErrors };
  }

  const bookingRepository = await getBookingRepository();
  const transportBooking = await bookingRepository.createTransportBooking({ input: parsed.data });
  logger.info("transport booking created", { transportBookingId: transportBooking.id, tripId });

  if (sourceQuoteId) {
    await bookingRepository.linkTransportQuoteToBooking({ quoteId: sourceQuoteId, transportBookingId: transportBooking.id });
    logger.info("transport quote linked to booking", { quoteId: sourceQuoteId, transportBookingId: transportBooking.id, tripId });
  }

  revalidatePath(`/trips/${tripId}`);
  await linkPlannedActivityIfNeeded(tripId, plannedActivityId, transportBooking.bookingId);
  return { createdId: transportBooking.id };
}

export async function createInsuranceAction(
  tripId: string,
  plannedActivityId: string | null,
  _prevState: BookingFormState,
  formData: FormData,
): Promise<BookingFormState> {
  const user = await getCurrentUser();
  if (!user) redirect("/login");

  try {
    await assertTripOwnership(user.id, tripId);
  } catch {
    return { formError: "הטיול לא נמצא או שאין לך הרשאה אליו." };
  }

  const parsed = createInsuranceInputSchema.safeParse({
    tripId,
    company: formData.get("company"),
    policyType: readOptionalString(formData, "policyType"),
    startDate: formData.get("startDate"),
    endDate: formData.get("endDate"),
    policyNumber: readOptionalString(formData, "policyNumber"),
    insuredNumber: readOptionalString(formData, "insuredNumber"),
    extensions: readOptionalString(formData, "extensions"),
    coverageNotes: readOptionalString(formData, "coverageNotes"),
    deductible: readOptionalNumber(formData, "deductible"),
    emergencyPhone: readOptionalString(formData, "emergencyPhone"),
    emergencyWhatsapp: readOptionalString(formData, "emergencyWhatsapp"),
    emergencyEmail: readOptionalString(formData, "emergencyEmail"),
    emergencyWebsite: readOptionalString(formData, "emergencyWebsite"),
    emergencyInstructions: readOptionalString(formData, "emergencyInstructions"),
  });

  if (!parsed.success) {
    return { fieldErrors: parsed.error.flatten().fieldErrors };
  }

  const bookingRepository = await getBookingRepository();
  const insurance = await bookingRepository.createInsurance({ input: parsed.data });
  logger.info("insurance created", { insuranceId: insurance.id, tripId });

  revalidatePath(`/trips/${tripId}`);
  await linkPlannedActivityIfNeeded(tripId, plannedActivityId, insurance.bookingId);
  return {};
}

export async function createActivityReservationAction(
  tripId: string,
  plannedActivityId: string | null,
  _prevState: BookingFormState,
  formData: FormData,
): Promise<BookingFormState> {
  const user = await getCurrentUser();
  if (!user) redirect("/login");

  try {
    await assertTripOwnership(user.id, tripId);
  } catch {
    return { formError: "הטיול לא נמצא או שאין לך הרשאה אליו." };
  }

  const parsed = createActivityReservationInputSchema.safeParse({
    tripId,
    venueName: formData.get("venueName"),
    activityDate: formData.get("activityDate"),
    activityTime: readOptionalString(formData, "activityTime"),
    ticketType: readOptionalString(formData, "ticketType"),
    confirmationDetails: readOptionalString(formData, "confirmationDetails"),
    notes: readOptionalString(formData, "notes"),
    agreedPrice: readOptionalNumber(formData, "agreedPrice"),
    agreedCurrencyCode: readOptionalString(formData, "agreedCurrencyCode"),
  });

  if (!parsed.success) {
    return { fieldErrors: parsed.error.flatten().fieldErrors };
  }

  const bookingRepository = await getBookingRepository();
  const activityReservation = await bookingRepository.createActivityReservation({ input: parsed.data });
  logger.info("activity reservation created", { activityReservationId: activityReservation.id, tripId });

  revalidatePath(`/trips/${tripId}`);
  await linkPlannedActivityIfNeeded(tripId, plannedActivityId, activityReservation.bookingId);
  return {};
}

export async function createCarRentalAction(
  tripId: string,
  plannedActivityId: string | null,
  _prevState: BookingFormState,
  formData: FormData,
): Promise<BookingFormState> {
  const user = await getCurrentUser();
  if (!user) redirect("/login");

  try {
    await assertTripOwnership(user.id, tripId);
  } catch {
    return { formError: "הטיול לא נמצא או שאין לך הרשאה אליו." };
  }

  const parsed = createCarRentalInputSchema.safeParse({
    tripId,
    vehicleType: formData.get("vehicleType"),
    companyName: formData.get("companyName"),
    model: readOptionalString(formData, "model"),
    licensePlate: readOptionalString(formData, "licensePlate"),
    pickupAt: toIsoDateTime(formData.get("pickupAt")),
    pickupTimezone: formData.get("pickupTimezone"),
    dropoffAt: formData.get("dropoffAt") ? toIsoDateTime(formData.get("dropoffAt")) : undefined,
    depositAmount: readOptionalNumber(formData, "depositAmount"),
    depositCurrencyCode: readOptionalString(formData, "depositCurrencyCode"),
    insuranceIncluded: formData.get("insuranceIncluded") === "true",
    confirmationNumber: readOptionalString(formData, "confirmationNumber"),
    externalBookingId: readOptionalString(formData, "externalBookingId"),
    cancellationPolicy: readOptionalString(formData, "cancellationPolicy"),
    phone: readOptionalString(formData, "phone"),
    whatsapp: readOptionalString(formData, "whatsapp"),
    email: readOptionalString(formData, "email"),
    website: readOptionalString(formData, "website"),
  });

  if (!parsed.success) {
    return { fieldErrors: parsed.error.flatten().fieldErrors };
  }

  const bookingRepository = await getBookingRepository();
  const carRental = await bookingRepository.createCarRental({ input: parsed.data });
  logger.info("car rental created", { carRentalId: carRental.id, tripId });

  revalidatePath(`/trips/${tripId}`);
  await linkPlannedActivityIfNeeded(tripId, plannedActivityId, carRental.bookingId);
  return {};
}

export async function softDeleteHotelStayAction(tripId: string, hotelStayId: string): Promise<void> {
  const user = await getCurrentUser();
  if (!user) redirect("/login");
  await assertTripOwnership(user.id, tripId);

  const bookingRepository = await getBookingRepository();
  await bookingRepository.softDeleteHotelStay({ hotelStayId });
  logger.info("hotel stay soft-deleted", { hotelStayId, tripId });

  revalidatePath(`/trips/${tripId}`);
}

export async function setHotelStayPersonalRatingAction(
  tripId: string,
  hotelStayId: string,
  personalRating: number | null,
): Promise<void> {
  const user = await getCurrentUser();
  if (!user) redirect("/login");
  await assertTripOwnership(user.id, tripId);

  const parsed = updateHotelStayPersonalRatingInputSchema.parse({ hotelStayId, personalRating });
  const bookingRepository = await getBookingRepository();
  await bookingRepository.updateHotelStayPersonalRating({ input: parsed });
  logger.info("hotel stay personal rating set", { hotelStayId, personalRating, tripId });
  // בכוונה בלי revalidatePath: PersonalRatingSelect כבר מעדכן אופטימית, והדירוג
  // לא נכנס ל-gap-detection/budget/settle-up — revalidate כאן רק מכריח את
  // טעינת דף הטיול הבאה (25+ שאילתות) בלי שום תועלת.
}

export interface SetFlightAirportTimingResult {
  ok: boolean;
  error?: string;
}

export async function setFlightAirportTimingAction(
  tripId: string,
  input: SetFlightAirportTimingInput,
): Promise<SetFlightAirportTimingResult> {
  const user = await getCurrentUser();
  if (!user) redirect("/login");

  try {
    await assertTripOwnership(user.id, tripId);
  } catch {
    return { ok: false, error: "הטיול לא נמצא או שאין לך הרשאה אליו." };
  }

  const parsed = setFlightAirportTimingInputSchema.safeParse(input);
  if (!parsed.success) {
    return { ok: false, error: "ערכים לא תקינים." };
  }

  const bookingRepository = await getBookingRepository();
  await bookingRepository.updateFlightAirportTiming({ input: parsed.data });
  logger.info("flight airport timing set", { flightId: parsed.data.flightId, tripId });

  revalidatePath(`/trips/${tripId}`);
  return { ok: true };
}

export interface SetFlightCheckInWindowResult {
  ok: boolean;
  error?: string;
}

export async function setFlightCheckInWindowAction(tripId: string, input: SetFlightCheckInWindowInput): Promise<SetFlightCheckInWindowResult> {
  const user = await getCurrentUser();
  if (!user) redirect("/login");

  try {
    await assertTripOwnership(user.id, tripId);
  } catch {
    return { ok: false, error: "הטיול לא נמצא או שאין לך הרשאה אליו." };
  }

  const parsed = setFlightCheckInWindowInputSchema.safeParse(input);
  if (!parsed.success) {
    return { ok: false, error: "ערכים לא תקינים." };
  }

  const bookingRepository = await getBookingRepository();
  await bookingRepository.updateFlightCheckInWindow({ input: parsed.data });
  logger.info("flight check-in window set", { flightId: parsed.data.flightId, tripId });

  revalidatePath(`/trips/${tripId}`);
  return { ok: true };
}

export interface CheckFlightStatusResult {
  ok: boolean;
  error?: string;
}

/** בדיקה מפורשת בלבד (כפתור, לא polling אוטומטי) — Aviationstack Free הוא 100
 * קריאות/חודש, לא רוצים לבזבז אותן בלי שהמשתמש ביקש בפועל. תוצאה אמיתית
 * בלבד: אם ה-API נכשל, מוחזרת שגיאה למשתמש, לעולם לא סטטוס מומצא. */
export async function checkFlightStatusAction(tripId: string, flightId: string, flightNumber: string, flightDate: string): Promise<CheckFlightStatusResult> {
  const user = await getCurrentUser();
  if (!user) redirect("/login");

  try {
    await assertTripOwnership(user.id, tripId);
  } catch {
    return { ok: false, error: "הטיול לא נמצא או שאין לך הרשאה אליו." };
  }

  if (!isFlightStatusConfigured()) {
    return { ok: false, error: "בדיקת סטטוס-טיסה חיה לא מחוברת." };
  }
  if (!flightNumber.trim()) {
    return { ok: false, error: "יש להזין מספר טיסה כדי לבדוק סטטוס." };
  }

  try {
    const provider = getFlightStatusProvider();
    const result = await provider.checkFlightStatus({ flightNumber, flightDate });

    const bookingRepository = await getBookingRepository();
    const updatedFlight = await bookingRepository.updateFlightLiveStatus({
      input: { flightId, liveStatus: result.liveStatus, liveDelayMinutes: result.liveDelayMinutes },
    });
    logger.info("flight live status checked", { flightId, tripId, liveStatus: result.liveStatus });

    // Push אמיתי רק כשיש בעיה בפועל — לא על כל בדיקה (סטטוס "מתוכננת/נחתה"
    // תקין לא צריך להטריד). זה ה-trigger האמין היחיד היום (ר' ההערה
    // ב-push-notification-setup.tsx) — בלי cron, אין דרך אמינה לדעת מראש
    // מתי לבדוק שוב בלי שהמשתמש לחץ בעצמו.
    const CONCERNING_PUSH_STATUSES = new Set<typeof result.liveStatus>(["cancelled", "diverted", "incident"]);
    const MEANINGFUL_PUSH_DELAY_MINUTES = 15;
    if (CONCERNING_PUSH_STATUSES.has(result.liveStatus) || (result.liveDelayMinutes !== null && result.liveDelayMinutes >= MEANINGFUL_PUSH_DELAY_MINUTES)) {
      const flightLabel = `${updatedFlight.airline} ${updatedFlight.flightNumber ?? ""}`.trim();
      const delayText = result.liveDelayMinutes ? ` (עיכוב ${result.liveDelayMinutes} דק')` : "";
      await sendPushToUser(user.id, {
        title: `⚠️ ${FLIGHT_LIVE_STATUS_LABELS[result.liveStatus]}: ${flightLabel}`,
        body: `${updatedFlight.departureAirport} → ${updatedFlight.arrivalAirport}${delayText}`,
        url: `/trips/${tripId}`,
      });
    }

    revalidatePath(`/trips/${tripId}`);
    return { ok: true };
  } catch (error) {
    logger.error("flight live status check failed", { flightId, tripId, error: error instanceof Error ? error.message : String(error) });
    return { ok: false, error: error instanceof Error ? error.message : "בדיקת הסטטוס נכשלה." };
  }
}

export async function softDeleteFlightAction(tripId: string, flightId: string): Promise<void> {
  const user = await getCurrentUser();
  if (!user) redirect("/login");
  await assertTripOwnership(user.id, tripId);

  const bookingRepository = await getBookingRepository();
  await bookingRepository.softDeleteFlight({ flightId });
  logger.info("flight soft-deleted", { flightId, tripId });

  revalidatePath(`/trips/${tripId}`);
}

export async function softDeleteTransportBookingAction(tripId: string, transportBookingId: string): Promise<void> {
  const user = await getCurrentUser();
  if (!user) redirect("/login");
  await assertTripOwnership(user.id, tripId);

  const bookingRepository = await getBookingRepository();
  await bookingRepository.softDeleteTransportBooking({ transportBookingId });
  logger.info("transport booking soft-deleted", { transportBookingId, tripId });

  revalidatePath(`/trips/${tripId}`);
}

/** עריכת פרטי-איסוף (שעה/מקום/נהג/טיסה-מקושרת) של הסעה קיימת — נדרש כדי
 * שאפשר יהיה לעדכן את הנהג בפועל אחרי שינוי (הקדמה/איחור), ולא רק ליצור. */
export async function updateTransportBookingAction(
  tripId: string,
  transportBookingId: string,
  _prevState: BookingFormState,
  formData: FormData,
): Promise<BookingFormState> {
  const user = await getCurrentUser();
  if (!user) redirect("/login");
  await assertTripOwnership(user.id, tripId);

  const linkedFlightId = readOptionalString(formData, "linkedFlightId");
  const parsed = updateTransportBookingInputSchema.safeParse({
    transportBookingId,
    pickupText: readOptionalString(formData, "pickupText"),
    dropoffText: readOptionalString(formData, "dropoffText"),
    pickupAt: toIsoDateTime(formData.get("pickupAt")),
    pickupTimezone: formData.get("pickupTimezone"),
    etaAt: formData.get("etaAt") ? toIsoDateTime(formData.get("etaAt")) : undefined,
    etaTimezone: readOptionalString(formData, "etaTimezone"),
    driverName: readOptionalString(formData, "driverName"),
    companyName: readOptionalString(formData, "companyName"),
    phone: readOptionalString(formData, "phone"),
    whatsapp: readOptionalString(formData, "whatsapp"),
    notes: readOptionalString(formData, "notes"),
    linkedFlightId,
  });

  if (!parsed.success) {
    return { fieldErrors: parsed.error.flatten().fieldErrors };
  }

  const bookingRepository = await getBookingRepository();
  await bookingRepository.updateTransportBooking({ input: parsed.data });
  logger.info("transport booking updated", { transportBookingId, tripId });

  revalidatePath(`/trips/${tripId}`);
  return {};
}

export async function setTransportBookingPersonalRatingAction(
  tripId: string,
  transportBookingId: string,
  personalRating: number | null,
): Promise<void> {
  const user = await getCurrentUser();
  if (!user) redirect("/login");
  await assertTripOwnership(user.id, tripId);

  const parsed = updateTransportBookingPersonalRatingInputSchema.parse({ transportBookingId, personalRating });
  const bookingRepository = await getBookingRepository();
  await bookingRepository.updateTransportBookingPersonalRating({ input: parsed });
  logger.info("transport booking personal rating set", { transportBookingId, personalRating, tripId });
  // בכוונה בלי revalidatePath — ראו הערה ב-setHotelStayPersonalRatingAction.
}

export async function softDeleteInsuranceAction(tripId: string, insuranceId: string): Promise<void> {
  const user = await getCurrentUser();
  if (!user) redirect("/login");
  await assertTripOwnership(user.id, tripId);

  const bookingRepository = await getBookingRepository();
  await bookingRepository.softDeleteInsurance({ insuranceId });
  logger.info("insurance soft-deleted", { insuranceId, tripId });

  revalidatePath(`/trips/${tripId}`);
}

export async function softDeleteActivityReservationAction(tripId: string, activityReservationId: string): Promise<void> {
  const user = await getCurrentUser();
  if (!user) redirect("/login");
  await assertTripOwnership(user.id, tripId);

  const bookingRepository = await getBookingRepository();
  await bookingRepository.softDeleteActivityReservation({ activityReservationId });
  logger.info("activity reservation soft-deleted", { activityReservationId, tripId });

  revalidatePath(`/trips/${tripId}`);
}

export async function softDeleteCarRentalAction(tripId: string, carRentalId: string): Promise<void> {
  const user = await getCurrentUser();
  if (!user) redirect("/login");
  await assertTripOwnership(user.id, tripId);

  const bookingRepository = await getBookingRepository();
  await bookingRepository.softDeleteCarRental({ carRentalId });
  logger.info("car rental soft-deleted", { carRentalId, tripId });

  revalidatePath(`/trips/${tripId}`);
}

export async function createBookingBenefitAction(
  tripId: string,
  bookingId: string,
  _prevState: BookingFormState,
  formData: FormData,
): Promise<BookingFormState> {
  const user = await getCurrentUser();
  if (!user) redirect("/login");
  await assertTripOwnership(user.id, tripId);

  const parsed = createBookingBenefitInputSchema.safeParse({
    bookingId,
    benefitName: formData.get("benefitName"),
    benefitType: readOptionalString(formData, "benefitType"),
    notes: readOptionalString(formData, "notes"),
    valueAmount: readOptionalNumber(formData, "valueAmount"),
    valueCurrencyCode: readOptionalString(formData, "valueCurrencyCode"),
  });

  if (!parsed.success) {
    return { fieldErrors: parsed.error.flatten().fieldErrors };
  }

  const bookingRepository = await getBookingRepository();
  const benefit = await bookingRepository.createBookingBenefit({ input: parsed.data });
  logger.info("booking benefit created", { benefitId: benefit.id, bookingId, tripId });

  revalidatePath(`/trips/${tripId}`);
  return {};
}

export async function deleteBookingBenefitAction(tripId: string, benefitId: string): Promise<void> {
  const user = await getCurrentUser();
  if (!user) redirect("/login");
  await assertTripOwnership(user.id, tripId);

  const bookingRepository = await getBookingRepository();
  await bookingRepository.deleteBookingBenefit({ benefitId });
  logger.info("booking benefit deleted", { benefitId, tripId });

  revalidatePath(`/trips/${tripId}`);
}

export async function createTransportQuoteAction(
  tripId: string,
  _prevState: BookingFormState,
  formData: FormData,
): Promise<BookingFormState> {
  const user = await getCurrentUser();
  if (!user) redirect("/login");
  await assertTripOwnership(user.id, tripId);

  const parsed = createTransportQuoteInputSchema.safeParse({
    tripId,
    provider: formData.get("provider"),
    price: Number(formData.get("price")),
    currencyCode: formData.get("currencyCode"),
    vehicleType: readOptionalString(formData, "vehicleType"),
    terms: readOptionalString(formData, "terms"),
    notes: readOptionalString(formData, "notes"),
  });

  if (!parsed.success) {
    return { fieldErrors: parsed.error.flatten().fieldErrors };
  }

  const bookingRepository = await getBookingRepository();
  const quote = await bookingRepository.createTransportQuote({ input: parsed.data });
  logger.info("transport quote created", { quoteId: quote.id, tripId });

  revalidatePath(`/trips/${tripId}`);
  return {};
}

export async function toggleTransportQuoteSelectedAction(tripId: string, quoteId: string): Promise<void> {
  const user = await getCurrentUser();
  if (!user) redirect("/login");
  await assertTripOwnership(user.id, tripId);

  const bookingRepository = await getBookingRepository();
  await bookingRepository.toggleTransportQuoteSelected({ quoteId });
  logger.info("transport quote selection toggled", { quoteId, tripId });

  revalidatePath(`/trips/${tripId}`);
}

export async function deleteTransportQuoteAction(tripId: string, quoteId: string): Promise<void> {
  const user = await getCurrentUser();
  if (!user) redirect("/login");
  await assertTripOwnership(user.id, tripId);

  const bookingRepository = await getBookingRepository();
  await bookingRepository.deleteTransportQuote({ quoteId });
  logger.info("transport quote deleted", { quoteId, tripId });

  revalidatePath(`/trips/${tripId}`);
}
