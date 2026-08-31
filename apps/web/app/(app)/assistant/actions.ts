"use server";

import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import {
  createExpenseInputSchema,
  createPaymentInputSchema,
  createWalletInputSchema,
  createHotelStayInputSchema,
  createFlightInputSchema,
  createTransportBookingInputSchema,
  updateExpenseInputSchema,
  updateHotelStayInputSchema,
  updateFlightInputSchema,
  updateTransportBookingInputSchema,
  updateInsuranceInputSchema,
  updateActivityReservationInputSchema,
  updateCarRentalInputSchema,
  createTripInputSchema,
  createPlaceInputSchema,
  createRouteStopInputSchema,
  poiSearchQuerySchema,
} from "@travel-app/shared-types";
import {
  getTripRepository,
  getFinanceRepository,
  getBookingRepository,
  getPlaceRepository,
  getRouteRepository,
  getPoiProvider,
} from "@travel-app/data-layer";
import { getCurrentUser } from "@/lib/auth/get-current-user";
import { logger } from "@/lib/logger";
import { isChatConfigured } from "@/lib/chat/config";
import { buildChatSystemPrompt } from "@/lib/chat/system-prompt";
import { sendChatTurn, type ChatHistoryMessage, type ChatToolCall } from "@/lib/chat/claude-chat-provider";
import { getRecommendationsProvider } from "@/lib/recommendations/get-recommendations-provider";
import { getOcrProvider } from "@/lib/ocr/get-ocr-provider";

// אין lookup אמיתי של אזור-זמן לפי שדה-תעופה/עיר (מחוץ להיקף) — כשה-AI לא
// בטוח, נופלים לברירת-מחדל הזאת ומציינים את זה למשתמש בתשובה, לא מעמידים פנים.
const DEFAULT_TIMEZONE = "Asia/Jerusalem";

export type ExecutedChatActionKind =
  | "expense"
  | "receive_money"
  | "hotel"
  | "transport"
  | "flight"
  | "update_expense"
  | "update_hotel"
  | "update_flight"
  | "update_transport"
  | "update_insurance"
  | "update_activity_reservation"
  | "update_car_rental"
  | "trip"
  | "plan_day";

export interface ExecutedChatAction {
  kind: ExecutedChatActionKind;
  summary: string;
  tripId: string;
  entityId: string;
  /** רק ל-4 סוגי-היצירה המקוריים (v1) יש זוג soft-delete/restore שאפשר לחבר
   * ל-"בטל". עדכון-שדה (update_*) אין לו כרגע נתיב-ביטול נקי — soft-delete
   * היה מוחק את כל הישות, לא מחזיר רק את הערך הישן; יצירת-טיול/plan_day
   * נשארו לא-הפיכים ב-v2 מאותה סיבת-פשטות. */
  undoable: boolean;
}

export interface ChatTurnActionResult {
  ok: boolean;
  reply: string;
  executedActions: ExecutedChatAction[];
  /** מולא רק כש-create_trip הצליח — הלקוח מחליף את הטיול-העובד שלו לזה. */
  newTripId?: string;
  error?: string;
}

function todayIso(): string {
  return new Date().toISOString().slice(0, 10);
}

function nowIso(): string {
  return new Date().toISOString();
}

type ToolExecutionResult = ExecutedChatAction | { info: string } | { error: string };

async function executeWriteToolCall(
  toolCall: ChatToolCall,
  tripId: string,
  userId: string,
): Promise<ToolExecutionResult> {
  const financeRepository = await getFinanceRepository();
  const bookingRepository = await getBookingRepository();
  const input = toolCall.input;

  switch (toolCall.name) {
    case "create_expense": {
      const parsed = createExpenseInputSchema.safeParse({
        tripId,
        category: input.category,
        description: input.description,
        amount: input.amount,
        currencyCode: input.currencyCode,
        expenseAt: nowIso(),
      });
      if (!parsed.success) return { error: "לא הצלחתי לפרש את פרטי ההוצאה." };

      const expense = await financeRepository.createExpense({ input: parsed.data });

      // מבטיח ארנק במטבע הנכון של ההוצאה הזו (upsert, initialAmount:0) *לפני*
      // createPayment — אחרת createPayment מנכה רק אם כבר יש ארנק בדיוק במטבע
      // הזה (findUnique, לא יוצר), ובלי זה ההוצאה נרשמת אבל שום ארנק לא זז.
      await financeRepository.topUpWallet({ input: { tripId, currencyCode: parsed.data.currencyCode, initialAmount: 0 } });

      const paymentParsed = createPaymentInputSchema.safeParse({
        expenseId: expense.id,
        amount: parsed.data.amount,
        currencyCode: parsed.data.currencyCode,
        paymentAt: nowIso(),
        paymentMethod: "cash",
      });
      if (paymentParsed.success) {
        await financeRepository.createPayment({ input: paymentParsed.data });
      }

      logger.info("chat assistant created expense", { expenseId: expense.id, tripId });
      return {
        kind: "expense",
        summary: `נרשמה הוצאה: ${parsed.data.description ?? parsed.data.category} — ${parsed.data.amount} ${parsed.data.currencyCode}`,
        tripId,
        entityId: expense.id,
        undoable: true,
      };
    }

    case "receive_money": {
      const parsed = createWalletInputSchema.safeParse({ tripId, currencyCode: input.currencyCode, initialAmount: input.amount });
      if (!parsed.success) return { error: "לא הצלחתי לפרש את פרטי הקבלה." };

      const wallet = await financeRepository.topUpWallet({ input: parsed.data });
      logger.info("chat assistant topped up wallet", { walletId: wallet.id, tripId });
      return {
        kind: "receive_money",
        summary: `נטען הארנק: +${parsed.data.initialAmount} ${parsed.data.currencyCode} (יתרה כעת ${wallet.currentBalance} ${wallet.currencyCode})`,
        tripId,
        entityId: wallet.id,
        undoable: false,
      };
    }

    case "book_hotel": {
      const parsed = createHotelStayInputSchema.safeParse({
        tripId,
        hotelName: input.hotelName,
        checkInDate: input.checkInDate,
        checkOutDate: input.checkOutDate,
        address: input.address,
        agreedPrice: input.agreedPrice,
        agreedCurrencyCode: input.agreedCurrencyCode,
      });
      if (!parsed.success) return { error: "לא הצלחתי לפרש את פרטי הזמנת המלון." };

      const hotelStay = await bookingRepository.createHotelStay({ input: parsed.data });
      logger.info("chat assistant created hotel stay", { hotelStayId: hotelStay.id, tripId });
      return {
        kind: "hotel",
        summary: `נרשמה הזמנת מלון: ${parsed.data.hotelName} (${parsed.data.checkInDate} – ${parsed.data.checkOutDate})`,
        tripId,
        entityId: hotelStay.id,
        undoable: true,
      };
    }

    case "book_transport": {
      const parsed = createTransportBookingInputSchema.safeParse({
        tripId,
        mode: input.mode,
        pickupText: input.pickupText,
        dropoffText: input.dropoffText,
        pickupAt: input.pickupAt,
        pickupTimezone: input.pickupTimezone || DEFAULT_TIMEZONE,
        agreedPrice: input.agreedPrice,
        agreedCurrencyCode: input.agreedCurrencyCode,
      });
      if (!parsed.success) return { error: "לא הצלחתי לפרש את פרטי ההסעה." };

      const transportBooking = await bookingRepository.createTransportBooking({ input: parsed.data });
      logger.info("chat assistant created transport booking", { transportBookingId: transportBooking.id, tripId });
      const tzNote = input.pickupTimezone ? "" : ` (הנחתי אזור-זמן ${DEFAULT_TIMEZONE} — אפשר לתקן ידנית)`;
      return {
        kind: "transport",
        summary: `נרשמה הסעה: ${parsed.data.pickupText ?? "?"} → ${parsed.data.dropoffText ?? "?"}${tzNote}`,
        tripId,
        entityId: transportBooking.id,
        undoable: true,
      };
    }

    case "book_flight": {
      const parsed = createFlightInputSchema.safeParse({
        tripId,
        airline: input.airline,
        flightNumber: input.flightNumber,
        departureAirport: input.departureAirport,
        arrivalAirport: input.arrivalAirport,
        departureAt: input.departureAt,
        departureTimezone: input.departureTimezone || DEFAULT_TIMEZONE,
        arrivalAt: input.arrivalAt,
        arrivalTimezone: input.arrivalTimezone || DEFAULT_TIMEZONE,
        agreedPrice: input.agreedPrice,
        agreedCurrencyCode: input.agreedCurrencyCode,
      });
      if (!parsed.success) return { error: "לא הצלחתי לפרש את פרטי הטיסה." };

      const flight = await bookingRepository.createFlight({ input: parsed.data });
      logger.info("chat assistant created flight", { flightId: flight.id, tripId });
      const tzNote = input.departureTimezone && input.arrivalTimezone ? "" : ` (הנחתי אזור-זמן ${DEFAULT_TIMEZONE} היכן שלא צוין — אפשר לתקן ידנית)`;
      return {
        kind: "flight",
        summary: `נרשמה טיסה: ${parsed.data.airline} ${parsed.data.departureAirport} → ${parsed.data.arrivalAirport}${tzNote}`,
        tripId,
        entityId: flight.id,
        undoable: true,
      };
    }

    case "update_expense": {
      const parsed = updateExpenseInputSchema.safeParse({
        expenseId: input.expenseId,
        category: input.category,
        description: input.description,
        amount: input.amount,
        currencyCode: input.currencyCode,
      });
      if (!parsed.success) return { error: "לא הצלחתי לפרש את פרטי העדכון להוצאה." };
      const expense = await financeRepository.updateExpense({ input: parsed.data });
      return {
        kind: "update_expense",
        summary: `עודכנה הוצאה: ${expense.description ?? expense.category} — ${expense.amount} ${expense.currencyCode}`,
        tripId,
        entityId: expense.id,
        undoable: false,
      };
    }

    case "update_hotel": {
      const parsed = updateHotelStayInputSchema.safeParse({
        hotelStayId: input.hotelStayId,
        hotelName: input.hotelName,
        checkInDate: input.checkInDate,
        checkOutDate: input.checkOutDate,
        agreedPrice: input.agreedPrice,
        agreedCurrencyCode: input.agreedCurrencyCode,
      });
      if (!parsed.success) return { error: "לא הצלחתי לפרש את פרטי העדכון למלון." };
      const hotelStay = await bookingRepository.updateHotelStay({ input: parsed.data });
      return {
        kind: "update_hotel",
        summary: `עודכנה הזמנת מלון: ${hotelStay.hotelName} (${hotelStay.checkInDate} – ${hotelStay.checkOutDate})`,
        tripId,
        entityId: hotelStay.id,
        undoable: false,
      };
    }

    case "update_flight": {
      const parsed = updateFlightInputSchema.safeParse({
        flightId: input.flightId,
        airline: input.airline,
        departureAt: input.departureAt,
        arrivalAt: input.arrivalAt,
        agreedPrice: input.agreedPrice,
        agreedCurrencyCode: input.agreedCurrencyCode,
      });
      if (!parsed.success) return { error: "לא הצלחתי לפרש את פרטי העדכון לטיסה." };
      const flight = await bookingRepository.updateFlight({ input: parsed.data });
      return {
        kind: "update_flight",
        summary: `עודכנה טיסה: ${flight.airline} ${flight.departureAirport} → ${flight.arrivalAirport}`,
        tripId,
        entityId: flight.id,
        undoable: false,
      };
    }

    case "update_transport": {
      const parsed = updateTransportBookingInputSchema.safeParse({
        transportBookingId: input.transportBookingId,
        pickupText: input.pickupText,
        dropoffText: input.dropoffText,
        pickupAt: input.pickupAt,
        agreedPrice: input.agreedPrice,
        agreedCurrencyCode: input.agreedCurrencyCode,
      });
      if (!parsed.success) return { error: "לא הצלחתי לפרש את פרטי העדכון להסעה." };
      const transportBooking = await bookingRepository.updateTransportBooking({ input: parsed.data });
      return {
        kind: "update_transport",
        summary: `עודכנה הסעה: ${transportBooking.pickupText ?? "?"} → ${transportBooking.dropoffText ?? "?"}`,
        tripId,
        entityId: transportBooking.id,
        undoable: false,
      };
    }

    case "update_insurance": {
      const parsed = updateInsuranceInputSchema.safeParse({
        insuranceId: input.insuranceId,
        company: input.company,
        startDate: input.startDate,
        endDate: input.endDate,
        agreedPrice: input.agreedPrice,
        agreedCurrencyCode: input.agreedCurrencyCode,
      });
      if (!parsed.success) return { error: "לא הצלחתי לפרש את פרטי העדכון לביטוח." };
      const insurance = await bookingRepository.updateInsurance({ input: parsed.data });
      return {
        kind: "update_insurance",
        summary: `עודכן ביטוח: ${insurance.company} (${insurance.startDate} – ${insurance.endDate})`,
        tripId,
        entityId: insurance.id,
        undoable: false,
      };
    }

    case "update_activity_reservation": {
      const parsed = updateActivityReservationInputSchema.safeParse({
        activityReservationId: input.activityReservationId,
        venueName: input.venueName,
        activityDate: input.activityDate,
        agreedPrice: input.agreedPrice,
        agreedCurrencyCode: input.agreedCurrencyCode,
      });
      if (!parsed.success) return { error: "לא הצלחתי לפרש את פרטי העדכון לאטרקציה." };
      const activityReservation = await bookingRepository.updateActivityReservation({ input: parsed.data });
      return {
        kind: "update_activity_reservation",
        summary: `עודכנה אטרקציה: ${activityReservation.venueName} (${activityReservation.activityDate})`,
        tripId,
        entityId: activityReservation.id,
        undoable: false,
      };
    }

    case "update_car_rental": {
      const parsed = updateCarRentalInputSchema.safeParse({
        carRentalId: input.carRentalId,
        companyName: input.companyName,
        pickupAt: input.pickupAt,
        dropoffAt: input.dropoffAt,
        agreedPrice: input.agreedPrice,
        agreedCurrencyCode: input.agreedCurrencyCode,
        depositAmount: input.depositAmount,
        depositCurrencyCode: input.depositCurrencyCode,
      });
      if (!parsed.success) return { error: "לא הצלחתי לפרש את פרטי העדכון להשכרת הרכב." };
      const carRental = await bookingRepository.updateCarRental({ input: parsed.data });
      return {
        kind: "update_car_rental",
        summary: `עודכנה השכרת רכב: ${carRental.companyName}`,
        tripId,
        entityId: carRental.id,
        undoable: false,
      };
    }

    case "plan_day": {
      const placeRepository = await getPlaceRepository();
      const routeRepository = await getRouteRepository();

      // מחפשים מקום קיים באותו שם (לא רגיש לרישיות) לפני שיוצרים חדש — לא
      // ממציאים כפילויות בכל פעם שהמשתמש מתכנן עוד יום באותו מקום.
      const existingPlaces = await placeRepository.list({ userId });
      const nameLower = typeof input.placeName === "string" ? input.placeName.trim().toLowerCase() : "";
      let place = existingPlaces.find((p) => p.name.trim().toLowerCase() === nameLower);

      if (!place) {
        const placeParsed = createPlaceInputSchema.safeParse({
          name: input.placeName,
          category: input.category,
          address: input.address,
        });
        if (!placeParsed.success) return { error: "לא הצלחתי לפרש את פרטי המקום לתכנון." };
        place = await placeRepository.create({ userId, input: placeParsed.data });
      }

      const stopParsed = createRouteStopInputSchema.safeParse({
        tripId,
        date: input.date,
        placeId: place.id,
        plannedArrivalAt: input.plannedArrivalAt,
      });
      if (!stopParsed.success) return { error: "לא הצלחתי לפרש את פרטי היום/השעה לתכנון." };
      const stop = await routeRepository.addStop({ input: stopParsed.data });

      logger.info("chat assistant planned day stop", { routeStopId: stop.id, tripId, date: stopParsed.data.date });
      return {
        kind: "plan_day",
        summary: `נוסף למסלול יום ${stopParsed.data.date}: ${place.name}`,
        tripId,
        entityId: stop.id,
        undoable: false,
      };
    }

    case "create_trip": {
      // create_trip מטופל בנפרד ב-runChatTurn (חייב userId אבל לא tripId —
      // לא עובר דרך executeWriteToolCall הרגיל שדורש tripId קיים).
      return { error: "כלי create_trip לא אמור להגיע לכאן." };
    }

    default:
      return { error: `כלי לא מוכר: ${toolCall.name}` };
  }
}

function formatPoiResults(results: Awaited<ReturnType<ReturnType<typeof getPoiProvider>["searchNearby"]>> | null): string {
  if (results === null) return "לא הצלחתי להביא תוצאות חיפוש-מקומות כרגע (שגיאת שירות-חיצוני) — נסה שוב בעוד רגע.";
  if (results.length === 0) return "לא נמצאו מקומות בטווח שביקשת.";
  return results
    .slice(0, 8)
    .map((r, i) => `${i + 1}. ${r.name} (${r.category})${r.address ? ` — ${r.address}` : ""}`)
    .join("\n");
}

function formatRecommendationResults(results: { name: string; category: string | null; address: string | null; rating: number | null }[]): string {
  if (results.length === 0) return "לא נמצאו המלצות לאזור הזה כרגע.";
  return results
    .slice(0, 8)
    .map((r, i) => `${i + 1}. ${r.name}${r.category ? ` (${r.category})` : ""}${r.rating ? ` ⭐${r.rating}` : ""}${r.address ? ` — ${r.address}` : ""}`)
    .join("\n");
}

async function executeReadToolCall(
  toolCall: ChatToolCall,
  location: { lat: number; lng: number } | null,
): Promise<{ info: string } | { error: string }> {
  const input = toolCall.input;

  if (toolCall.name === "find_nearby_places") {
    if (!location) return { info: "אין כרגע גישה למיקום שלך — צריך לאשר גישה למיקום בפאנל הצ'אט כדי לחפש מקומות קרובים." };
    const parsed = poiSearchQuerySchema.safeParse({
      lat: location.lat,
      lng: location.lng,
      radiusKm: typeof input.radiusKm === "number" ? input.radiusKm : 2,
      categories: Array.isArray(input.categories) && input.categories.length > 0 ? input.categories : ["attraction", "restaurant", "cafe"],
    });
    if (!parsed.success) return { error: "לא הצלחתי לפרש את בקשת החיפוש." };
    const results = await getPoiProvider().searchNearby(parsed.data);
    return { info: formatPoiResults(results) };
  }

  if (toolCall.name === "recommend_places") {
    const area = typeof input.area === "string" ? input.area : "";
    if (!area) return { error: "לא צוין אזור לחיפוש המלצות." };
    const category = typeof input.category === "string" ? input.category : "מסעדות ואטרקציות מומלצות";
    const results = await getRecommendationsProvider().searchRecommendations({ query: `${category} ב${area}` });
    return { info: formatRecommendationResults(results) };
  }

  return { error: `כלי-קריאה לא מוכר: ${toolCall.name}` };
}

const READ_ONLY_TOOLS = new Set(["find_nearby_places", "recommend_places"]);

async function runChatTurn({
  tripId,
  userId,
  history,
  message,
  location,
}: {
  tripId: string | null;
  userId: string;
  history: ChatHistoryMessage[];
  message: string;
  location: { lat: number; lng: number } | null;
}): Promise<ChatTurnActionResult> {
  const tripRepository = await getTripRepository();
  const financeRepository = await getFinanceRepository();
  const bookingRepository = await getBookingRepository();

  let trip = null;
  let wallets: Awaited<ReturnType<typeof financeRepository.listWallets>> = [];
  let hotelStays: Awaited<ReturnType<typeof bookingRepository.listHotelStays>> = [];
  let flights: Awaited<ReturnType<typeof bookingRepository.listFlights>> = [];
  let transportBookings: Awaited<ReturnType<typeof bookingRepository.listTransportBookings>> = [];
  let expenses: Awaited<ReturnType<typeof financeRepository.listExpenses>> = [];
  let insurances: Awaited<ReturnType<typeof bookingRepository.listInsurances>> = [];
  let carRentals: Awaited<ReturnType<typeof bookingRepository.listCarRentals>> = [];

  if (tripId) {
    trip = await tripRepository.getById({ userId, tripId });
    if (!trip) {
      return { ok: false, reply: "", executedActions: [], error: "הטיול לא נמצא או שאין לך הרשאה אליו." };
    }
    [wallets, hotelStays, flights, transportBookings, expenses, insurances, carRentals] = await Promise.all([
      financeRepository.listWallets({ tripId }),
      bookingRepository.listHotelStays({ tripId }),
      bookingRepository.listFlights({ tripId }),
      bookingRepository.listTransportBookings({ tripId }),
      financeRepository.listExpenses({ tripId }),
      bookingRepository.listInsurances({ tripId }),
      bookingRepository.listCarRentals({ tripId }),
    ]);
  }

  const systemPrompt = buildChatSystemPrompt({
    today: todayIso(),
    activeTrip: trip,
    wallets,
    hasLocation: location !== null,
    hotelStays,
    flights,
    transportBookings,
    expenses,
    insurances,
    carRentals,
  });
  const turn = await sendChatTurn({ systemPrompt, history, message });
  if (!turn.ok) {
    return { ok: false, reply: "", executedActions: [], error: turn.error };
  }

  const executedActions: ExecutedChatAction[] = [];
  const infos: string[] = [];
  const errors: string[] = [];
  let newTripId: string | undefined;

  for (const toolCall of turn.toolCalls) {
    if (READ_ONLY_TOOLS.has(toolCall.name)) {
      const result = await executeReadToolCall(toolCall, location);
      if ("error" in result) errors.push(result.error);
      else infos.push(result.info);
      continue;
    }

    if (toolCall.name === "create_trip") {
      const parsed = createTripInputSchema.safeParse({
        name: toolCall.input.name,
        startDate: toolCall.input.startDate,
        endDate: toolCall.input.endDate,
        baseCurrencyCode: toolCall.input.baseCurrencyCode,
      });
      if (!parsed.success) {
        errors.push("לא הצלחתי לפרש את פרטי הטיול החדש.");
        continue;
      }
      const newTrip = await tripRepository.create({ userId, input: parsed.data });
      logger.info("chat assistant created trip", { tripId: newTrip.id });
      newTripId = newTrip.id;
      executedActions.push({
        kind: "trip",
        summary: `נפתח טיול חדש: ${newTrip.name} (${newTrip.startDate} – ${newTrip.endDate})`,
        tripId: newTrip.id,
        entityId: newTrip.id,
        undoable: false,
      });
      continue;
    }

    // כל שאר הכלים דורשים טיול פעיל (או טיול שנוצר הרגע באותו סבב).
    const effectiveTripId = newTripId ?? tripId;
    if (!effectiveTripId) {
      errors.push("אין טיול פעיל לרשום אליו את הפעולה.");
      continue;
    }
    const result = await executeWriteToolCall(toolCall, effectiveTripId, userId);
    if ("error" in result) errors.push(result.error);
    else executedActions.push(result as ExecutedChatAction);
  }

  const effectiveTripId = newTripId ?? tripId;
  if (effectiveTripId && (executedActions.length > 0 || newTripId)) {
    revalidatePath(`/trips/${effectiveTripId}`);
    revalidatePath("/dashboard");
    revalidatePath("/trips");
  }

  const reply = [turn.reply, ...infos, ...errors].filter(Boolean).join("\n\n") || (executedActions.length > 0 ? "בוצע." : "");
  return { ok: true, reply, executedActions, newTripId };
}

export async function sendChatMessageAction(
  tripId: string | null,
  history: ChatHistoryMessage[],
  message: string,
  location: { lat: number; lng: number } | null = null,
): Promise<ChatTurnActionResult> {
  const user = await getCurrentUser();
  if (!user) redirect("/login");

  if (!isChatConfigured()) {
    return { ok: false, reply: "", executedActions: [], error: "עוזר ה-AI לא מוגדר עדיין (חסר מפתח API)." };
  }

  return runChatTurn({ tripId, userId: user.id, history, message, location });
}

/** צירוף קבלה כתמונה — משתמש באותו getOcrProvider().extractFields שכבר
 * מוכח בפיצ'ר-OCR הרגיל (lib/ocr/claude-provider.ts), בלי Document row (לא
 * צריך אחסון קבוע לזרימה הזו). התוצאה הופכת להודעת-משתמש סינתטית שעוברת
 * *לאותו* runChatTurn בדיוק כמו הודעה כתובה — Claude מחליט עם הכלים הרגילים. */
export async function sendChatImageAction(
  tripId: string | null,
  history: ChatHistoryMessage[],
  imageBase64: string,
  mimeType: string,
  location: { lat: number; lng: number } | null = null,
): Promise<ChatTurnActionResult> {
  const user = await getCurrentUser();
  if (!user) redirect("/login");

  if (!isChatConfigured()) {
    return { ok: false, reply: "", executedActions: [], error: "עוזר ה-AI לא מוגדר עדיין (חסר מפתח API)." };
  }

  const extraction = await getOcrProvider().extractFields({ imageBase64, mimeType });
  if (!extraction.ok) {
    return { ok: false, reply: "", executedActions: [], error: extraction.error ?? "לא הצלחתי לקרוא את התמונה." };
  }
  if (extraction.fields.length === 0) {
    return { ok: true, reply: "לא הצלחתי לזהות פרטים ברורים בתמונה — אפשר לכתוב לי את הפרטים ישירות.", executedActions: [] };
  }

  const fieldsText = extraction.fields
    .filter((f) => f.extractedValue)
    .map((f) => `${f.fieldName}: ${f.extractedValue}`)
    .join(", ");
  const syntheticMessage = `[המשתמש צירף תמונה של קבלה/מסמך. השדות שזוהו בה: ${fieldsText}]`;

  return runChatTurn({ tripId, userId: user.id, history, message: syntheticMessage, location });
}
