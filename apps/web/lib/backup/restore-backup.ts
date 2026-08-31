import {
  getBookingRepository,
  getChecklistItemRepository,
  getContactRepository,
  getDocumentRepository,
  getFinanceRepository,
  getPaymentCardRepository,
  getPlaceRepository,
  getPlannedActivityRepository,
  getTripDayRepository,
  getTripGeographyRepository,
  getTripPlaceRepository,
  getTripRepository,
} from "@travel-app/data-layer";
import type { BackupFile, DocumentEntityType, RestoreSummary } from "@travel-app/shared-types";

/**
 * שחזור מגיבוי (#90) — יוצר הכול מחדש כישויות חדשות (IDs חדשים לגמרי, לא
 * דריסה של נתונים קיימים) ומתקן מזהים צולבים (FK) לפי מיפוי ישן→חדש בזמן
 * ריצה, כי create() בכל Repository מייצר UUID חדש ולא מקבל id קבוע מבחוץ.
 *
 * **מגבלות מתועדות בכוונה (לא ניחוש/לא בנייה שקטה מעל מה שהמערכת תומכת בו):**
 * - WalletTransaction: אין create() ישיר (רק תוצר לוואי של פעולות אחרות) —
 *   הארנקים נוצרים מחדש דרך topUpWallet(initialAmount) ואז מתואמים בסוף
 *   ל-currentBalance המקורי דרך reconcileWallet, אחרי שכל הפעולות שמשפיעות
 *   על יתרה (תשלומים/המרות/החזרים/פיקדונות) שוחזרו — כך היתרה הסופית מדויקת
 *   גם אם סדר הביניים לא תואם היסטורית בדיוק.
 * - Document עם entityType="other" או "booking": אין מיפוי id יחיד וברור
 *   (booking הוא גנרי, other לא מזוהה) — מדולג עם רישום ב-summary.skipped.
 *
 * TransportQuote.transportBookingId **כן** משוחזר בפועל (linkTransportQuoteToBooking,
 * ר' הלולאה למטה) — ההערה הקודמת כאן הייתה לא מעודכנת מאז שהפיצ'ר נבנה.
 * TripDay.notes משוחזר דרך getOrCreate+updateNotes (get-or-create שקוף לפי
 * תאריך, אותו דפוס בדיוק כמו Route — ר' trip-day-repository.ts).
 * Document עם entityType="place" (tripId=null, ר' schema.prisma) משוחזר דרך
 * placeIdMap בלבד — לא דורש tripIdMap כי תמונות-מקום הן ישות גלובלית.
 */
export async function restoreBackup(userId: string, backup: BackupFile): Promise<RestoreSummary> {
  const [
    tripRepository,
    placeRepository,
    tripPlaceRepository,
    plannedActivityRepository,
    bookingRepository,
    financeRepository,
    documentRepository,
    contactRepository,
    paymentCardRepository,
    checklistItemRepository,
    tripGeographyRepository,
    tripDayRepository,
  ] = await Promise.all([
    getTripRepository(),
    getPlaceRepository(),
    getTripPlaceRepository(),
    getPlannedActivityRepository(),
    getBookingRepository(),
    getFinanceRepository(),
    getDocumentRepository(),
    getContactRepository(),
    getPaymentCardRepository(),
    getChecklistItemRepository(),
    getTripGeographyRepository(),
    getTripDayRepository(),
  ]);

  const restoredCounts: Record<string, number> = {};
  const skipped: Array<{ entity: string; reason: string }> = [];
  const inc = (key: string, by = 1) => (restoredCounts[key] = (restoredCounts[key] ?? 0) + by);

  const tripIdMap = new Map<string, string>();
  const placeIdMap = new Map<string, string>();
  const cardIdMap = new Map<string, string>();
  const countryIdMap = new Map<string, string>();
  const hotelStayIdMap = new Map<string, string>();
  const flightIdMap = new Map<string, string>();
  const transportBookingIdMap = new Map<string, string>();
  const carRentalIdMap = new Map<string, string>();
  const insuranceIdMap = new Map<string, string>();
  // מפתח לפי bookingId המקורי (לא לפי id הישות עצמה) — כי זה מה ש-Expense/
  // Payment/PlannedActivity/BookingBenefit/Deposit מצביעים אליו.
  const bookingIdByOldBookingId = new Map<string, string>();
  const plannedActivityIdMap = new Map<string, string>();
  const expenseIdMap = new Map<string, string>();
  const paymentIdMap = new Map<string, string>();
  const walletIdMap = new Map<string, string>();

  // 1. Trips
  for (const trip of backup.trips) {
    const created = await tripRepository.create({
      userId,
      input: {
        name: trip.name,
        startDate: trip.startDate,
        endDate: trip.endDate,
        baseCurrencyCode: trip.baseCurrencyCode ?? undefined,
        primaryTimezone: trip.primaryTimezone ?? undefined,
        notes: trip.notes ?? undefined,
        totalBudgetAmount: trip.totalBudgetAmount ?? undefined,
        dailyBudgetAmount: trip.dailyBudgetAmount ?? undefined,
      },
    });
    tripIdMap.set(trip.id, created.id);
    if (trip.deletedAt) await tripRepository.softDelete({ userId, tripId: created.id });
    inc("trips");
  }

  // 2. Places (ספרייה גלובלית)
  for (const place of backup.places) {
    const created = await placeRepository.create({
      userId,
      input: {
        name: place.name,
        category: place.category,
        address: place.address ?? undefined,
        country: place.country ?? undefined,
        city: place.city ?? undefined,
        lat: place.lat ?? undefined,
        lng: place.lng ?? undefined,
        officialWebsite: place.officialWebsite ?? undefined,
        phone: place.phone ?? undefined,
        whatsapp: place.whatsapp ?? undefined,
        email: place.email ?? undefined,
        openingHours: place.openingHours ?? undefined,
        generalNotes: place.generalNotes ?? undefined,
      },
    });
    placeIdMap.set(place.id, created.id);
    if (place.isFavorite) await placeRepository.toggleFavorite({ userId, placeId: created.id });
    if (place.dontReturn) await placeRepository.toggleDontReturn({ userId, placeId: created.id });
    if (place.personalRating !== null) {
      await placeRepository.setPersonalRating({ userId, placeId: created.id, personalRating: place.personalRating });
    }
    if (place.deletedAt) await placeRepository.softDelete({ userId, placeId: created.id });
    inc("places");
  }

  // 3. PaymentCards
  for (const card of backup.paymentCards) {
    const created = await paymentCardRepository.create({
      userId,
      input: { cardName: card.cardName, defaultCurrencyCode: card.defaultCurrencyCode ?? undefined },
    });
    cardIdMap.set(card.id, created.id);
    inc("paymentCards");
  }

  // 4. Contacts
  for (const contact of backup.contacts) {
    const newTripId = contact.tripId ? tripIdMap.get(contact.tripId) : undefined;
    await contactRepository.create({
      userId,
      input: {
        tripId: newTripId,
        name: contact.name,
        company: contact.company ?? undefined,
        role: contact.role ?? undefined,
        phone: contact.phone ?? undefined,
        whatsapp: contact.whatsapp ?? undefined,
        email: contact.email ?? undefined,
        website: contact.website ?? undefined,
        category: contact.category ?? undefined,
        notes: contact.notes ?? undefined,
      },
    });
    inc("contacts");
  }

  // 5. TripCountries
  for (const country of backup.tripCountries) {
    const newTripId = tripIdMap.get(country.tripId);
    if (!newTripId) continue;
    const created = await tripGeographyRepository.addCountry({ input: { tripId: newTripId, countryName: country.countryName } });
    countryIdMap.set(country.id, created.id);
    inc("tripCountries");
  }

  // 6. TripCities
  for (const city of backup.tripCities) {
    const newTripId = tripIdMap.get(city.tripId);
    if (!newTripId) continue;
    await tripGeographyRepository.addCity({
      input: { tripId: newTripId, cityName: city.cityName, countryId: city.countryId ? countryIdMap.get(city.countryId) : undefined },
    });
    inc("tripCities");
  }

  // 6.5 TripDays (הערות-יום בלבד — get-or-create שקוף לפי (tripId,date), אותו דפוס כמו Route)
  for (const tripDay of backup.tripDays) {
    const newTripId = tripIdMap.get(tripDay.tripId);
    if (!newTripId) continue;
    const created = await tripDayRepository.getOrCreate({ tripId: newTripId, date: tripDay.date });
    await tripDayRepository.updateNotes({ tripDayId: created.id, notes: tripDay.notes });
    inc("tripDays");
  }

  // 7. TripPlaces (Trip↔Place)
  for (const tp of backup.tripPlaces) {
    const newTripId = tripIdMap.get(tp.tripId);
    const newPlaceId = placeIdMap.get(tp.placeId);
    if (!newTripId || !newPlaceId) continue;
    await tripPlaceRepository.linkPlaceToTrip({ userId, tripId: newTripId, placeId: newPlaceId, status: tp.status });
    inc("tripPlaces");
  }

  // 8. Wallets — לפני כל מה שמשפיע על יתרה, כדי שתשלומים/המרות ימצאו ארנק קיים.
  for (const wallet of backup.wallets) {
    const newTripId = tripIdMap.get(wallet.tripId);
    if (!newTripId) continue;
    const created = await financeRepository.topUpWallet({
      input: { tripId: newTripId, currencyCode: wallet.currencyCode, initialAmount: wallet.initialAmount },
    });
    walletIdMap.set(wallet.id, created.id);
    inc("wallets");
  }

  // 9. Booking subtypes
  for (const h of backup.hotelStays) {
    const newTripId = tripIdMap.get(h.tripId);
    if (!newTripId) continue;
    const created = await bookingRepository.createHotelStay({
      input: {
        tripId: newTripId,
        placeId: undefined,
        hotelName: h.hotelName,
        address: h.address ?? undefined,
        lat: h.lat ?? undefined,
        lng: h.lng ?? undefined,
        checkInDate: h.checkInDate,
        checkOutDate: h.checkOutDate,
        checkInTime: h.checkInTime ?? undefined,
        checkOutTime: h.checkOutTime ?? undefined,
        roomType: h.roomType ?? undefined,
        floor: h.floor ?? undefined,
        view: h.view ?? undefined,
        bedType: h.bedType ?? undefined,
        guestsCount: h.guestsCount ?? undefined,
        smoking: h.smoking ?? undefined,
        pricePerNight: h.pricePerNight ?? undefined,
        agreedPrice: h.agreedPrice ?? undefined,
        agreedCurrencyCode: h.agreedCurrencyCode ?? undefined,
        mealPlan: h.mealPlan,
        breakfastPrice: h.breakfastPrice ?? undefined,
        breakfastPriceUnit: h.breakfastPriceUnit ?? undefined,
        breakfastHours: h.breakfastHours ?? undefined,
        breakfastLocation: h.breakfastLocation ?? undefined,
        earlyCheckIn: h.earlyCheckIn,
        lateCheckOut: h.lateCheckOut,
        externalBookingId: h.externalBookingId ?? undefined,
        cancellationPolicy: h.cancellationPolicy ?? undefined,
        phone: h.phone ?? undefined,
        whatsapp: h.whatsapp ?? undefined,
        email: h.email ?? undefined,
        website: h.website ?? undefined,
        confirmationNumber: h.confirmationNumber ?? undefined,
        notes: h.notes ?? undefined,
      },
    });
    hotelStayIdMap.set(h.id, created.id);
    bookingIdByOldBookingId.set(h.bookingId, created.bookingId);
    if (h.personalRating !== null) await bookingRepository.updateHotelStayPersonalRating({ input: { hotelStayId: created.id, personalRating: h.personalRating } });
    if (h.deletedAt) await bookingRepository.softDeleteHotelStay({ hotelStayId: created.id });
    inc("hotelStays");
  }

  for (const f of backup.flights) {
    const newTripId = tripIdMap.get(f.tripId);
    if (!newTripId) continue;
    const created = await bookingRepository.createFlight({
      input: {
        tripId: newTripId,
        airline: f.airline,
        flightNumber: f.flightNumber ?? undefined,
        departureAirport: f.departureAirport,
        arrivalAirport: f.arrivalAirport,
        departureTerminal: f.departureTerminal ?? undefined,
        arrivalTerminal: f.arrivalTerminal ?? undefined,
        departureAt: f.departureAt,
        departureTimezone: f.departureTimezone,
        arrivalAt: f.arrivalAt,
        arrivalTimezone: f.arrivalTimezone,
        seat: f.seat ?? undefined,
        baggage: f.baggage ?? undefined,
        legType: f.legType,
        agreedPrice: f.agreedPrice ?? undefined,
        agreedCurrencyCode: f.agreedCurrencyCode ?? undefined,
        externalBookingId: f.externalBookingId ?? undefined,
        cancellationPolicy: f.cancellationPolicy ?? undefined,
        phone: f.phone ?? undefined,
        whatsapp: f.whatsapp ?? undefined,
        email: f.email ?? undefined,
        website: f.website ?? undefined,
        confirmationNumber: f.confirmationNumber ?? undefined,
        notes: f.notes ?? undefined,
      },
    });
    flightIdMap.set(f.id, created.id);
    bookingIdByOldBookingId.set(f.bookingId, created.bookingId);
    if (f.deletedAt) await bookingRepository.softDeleteFlight({ flightId: created.id });
    inc("flights");
  }

  for (const t of backup.transportBookings) {
    const newTripId = tripIdMap.get(t.tripId);
    if (!newTripId) continue;
    const created = await bookingRepository.createTransportBooking({
      input: {
        tripId: newTripId,
        mode: t.mode,
        pickupText: t.pickupText ?? undefined,
        dropoffText: t.dropoffText ?? undefined,
        pickupAt: t.pickupAt,
        pickupTimezone: t.pickupTimezone,
        etaAt: t.etaAt ?? undefined,
        etaTimezone: t.etaTimezone ?? undefined,
        vehicleType: t.vehicleType ?? undefined,
        driverName: t.driverName ?? undefined,
        companyName: t.companyName ?? undefined,
        vehicleOnBoard: t.vehicleOnBoard ?? undefined,
        seat: t.seat ?? undefined,
        tollFees: t.tollFees ?? undefined,
        parkingFees: t.parkingFees ?? undefined,
        agreedPrice: t.agreedPrice ?? undefined,
        agreedCurrencyCode: t.agreedCurrencyCode ?? undefined,
        externalBookingId: t.externalBookingId ?? undefined,
        cancellationPolicy: t.cancellationPolicy ?? undefined,
        phone: t.phone ?? undefined,
        whatsapp: t.whatsapp ?? undefined,
        email: t.email ?? undefined,
        website: t.website ?? undefined,
        notes: t.notes ?? undefined,
      },
    });
    transportBookingIdMap.set(t.id, created.id);
    bookingIdByOldBookingId.set(t.bookingId, created.bookingId);
    if (t.personalRating !== null) await bookingRepository.updateTransportBookingPersonalRating({ input: { transportBookingId: created.id, personalRating: t.personalRating } });
    if (t.deletedAt) await bookingRepository.softDeleteTransportBooking({ transportBookingId: created.id });
    inc("transportBookings");
  }

  for (const c of backup.carRentals) {
    const newTripId = tripIdMap.get(c.tripId);
    if (!newTripId) continue;
    const created = await bookingRepository.createCarRental({
      input: {
        tripId: newTripId,
        vehicleType: c.vehicleType,
        companyName: c.companyName,
        model: c.model ?? undefined,
        licensePlate: c.licensePlate ?? undefined,
        pickupLocationText: c.pickupLocationText ?? undefined,
        pickupAt: c.pickupAt,
        pickupTimezone: c.pickupTimezone,
        dropoffLocationText: c.dropoffLocationText ?? undefined,
        dropoffAt: c.dropoffAt ?? undefined,
        dropoffTimezone: c.dropoffTimezone ?? undefined,
        driverRequirements: c.driverRequirements ?? undefined,
        insuranceIncluded: c.insuranceIncluded,
        depositAmount: c.depositAmount ?? undefined,
        depositCurrencyCode: c.depositCurrencyCode ?? undefined,
        agreedPrice: c.agreedPrice ?? undefined,
        agreedCurrencyCode: c.agreedCurrencyCode ?? undefined,
        externalBookingId: c.externalBookingId ?? undefined,
        cancellationPolicy: c.cancellationPolicy ?? undefined,
        phone: c.phone ?? undefined,
        whatsapp: c.whatsapp ?? undefined,
        email: c.email ?? undefined,
        website: c.website ?? undefined,
        confirmationNumber: c.confirmationNumber ?? undefined,
        notes: c.notes ?? undefined,
      },
    });
    carRentalIdMap.set(c.id, created.id);
    bookingIdByOldBookingId.set(c.bookingId, created.bookingId);
    if (c.deletedAt) await bookingRepository.softDeleteCarRental({ carRentalId: created.id });
    inc("carRentals");
  }

  for (const i of backup.insurances) {
    const newTripId = tripIdMap.get(i.tripId);
    if (!newTripId) continue;
    const created = await bookingRepository.createInsurance({
      input: {
        tripId: newTripId,
        company: i.company,
        policyType: i.policyType ?? undefined,
        startDate: i.startDate,
        endDate: i.endDate,
        policyNumber: i.policyNumber ?? undefined,
        insuredNumber: i.insuredNumber ?? undefined,
        coverageNotes: i.coverageNotes ?? undefined,
        extensions: i.extensions ?? undefined,
        deductible: i.deductible ?? undefined,
        emergencyPhone: i.emergencyPhone ?? undefined,
        emergencyWhatsapp: i.emergencyWhatsapp ?? undefined,
        emergencyEmail: i.emergencyEmail ?? undefined,
        emergencyWebsite: i.emergencyWebsite ?? undefined,
        emergencyInstructions: i.emergencyInstructions ?? undefined,
        agreedPrice: i.agreedPrice ?? undefined,
        agreedCurrencyCode: i.agreedCurrencyCode ?? undefined,
        notes: i.notes ?? undefined,
      },
    });
    insuranceIdMap.set(i.id, created.id);
    bookingIdByOldBookingId.set(i.bookingId, created.bookingId);
    if (i.deletedAt) await bookingRepository.softDeleteInsurance({ insuranceId: created.id });
    inc("insurances");
  }

  // 10. BookingBenefits
  for (const benefit of backup.bookingBenefits) {
    const newBookingId = bookingIdByOldBookingId.get(benefit.bookingId);
    if (!newBookingId) continue;
    await bookingRepository.createBookingBenefit({
      input: {
        bookingId: newBookingId,
        benefitName: benefit.benefitName,
        benefitType: benefit.benefitType ?? undefined,
        notes: benefit.notes ?? undefined,
        valueAmount: benefit.valueAmount ?? undefined,
        valueCurrencyCode: benefit.valueCurrencyCode ?? undefined,
      },
    });
    inc("bookingBenefits");
  }

  // 11. TransportQuotes — transportBookingId לא ניתן לשחזור (אין setter חשוף).
  for (const quote of backup.transportQuotes) {
    const newTripId = tripIdMap.get(quote.tripId);
    if (!newTripId) continue;
    const created = await bookingRepository.createTransportQuote({
      input: {
        tripId: newTripId,
        provider: quote.provider,
        price: quote.price,
        currencyCode: quote.currencyCode,
        vehicleType: quote.vehicleType ?? undefined,
        terms: quote.terms ?? undefined,
        notes: quote.notes ?? undefined,
      },
    });
    const linkedBookingId = quote.transportBookingId ? transportBookingIdMap.get(quote.transportBookingId) : undefined;
    if (linkedBookingId) {
      await bookingRepository.linkTransportQuoteToBooking({ quoteId: created.id, transportBookingId: linkedBookingId });
    } else if (quote.isSelected) {
      await bookingRepository.toggleTransportQuoteSelected({ quoteId: created.id });
    }
    inc("transportQuotes");
  }

  // 12. PlannedActivities
  for (const activity of backup.plannedActivities) {
    const newTripId = tripIdMap.get(activity.tripId);
    if (!newTripId) continue;
    const created = await plannedActivityRepository.create({
      input: {
        tripId: newTripId,
        placeId: activity.placeId ? placeIdMap.get(activity.placeId) : undefined,
        name: activity.name,
        activityType: activity.activityType ?? undefined,
        plannedAt: activity.plannedAt ?? undefined,
        estimatedDurationMinutes: activity.estimatedDurationMinutes ?? undefined,
        estimatedPrice: activity.estimatedPrice ?? undefined,
        estimatedCurrencyCode: activity.estimatedCurrencyCode ?? undefined,
        notes: activity.notes ?? undefined,
        status: activity.status,
      },
    });
    plannedActivityIdMap.set(activity.id, created.id);
    const newBookingId = activity.bookingId ? bookingIdByOldBookingId.get(activity.bookingId) : undefined;
    if (newBookingId) await plannedActivityRepository.linkToBooking({ plannedActivityId: created.id, bookingId: newBookingId });
    if (activity.personalRating !== null) {
      await plannedActivityRepository.updatePersonalRating({ input: { plannedActivityId: created.id, personalRating: activity.personalRating } });
    }
    if (activity.deletedAt) await plannedActivityRepository.softDelete({ plannedActivityId: created.id });
    inc("plannedActivities");
  }

  // 13. Expenses
  for (const expense of backup.expenses) {
    const newTripId = tripIdMap.get(expense.tripId);
    if (!newTripId) continue;
    const created = await financeRepository.createExpense({
      input: {
        tripId: newTripId,
        bookingId: expense.bookingId ? bookingIdByOldBookingId.get(expense.bookingId) : undefined,
        placeId: expense.placeId ? placeIdMap.get(expense.placeId) : undefined,
        category: expense.category,
        description: expense.description ?? undefined,
        itemName: expense.itemName ?? undefined,
        quantity: expense.quantity ?? undefined,
        amount: expense.amount,
        currencyCode: expense.currencyCode,
        expenseAt: expense.expenseAt,
        timezone: expense.timezone ?? undefined,
        personalRating: expense.personalRating ?? undefined,
        tipRecipient: expense.tipRecipient ?? undefined,
        tipCategory: expense.tipCategory ?? undefined,
        notes: expense.notes ?? undefined,
      },
    });
    expenseIdMap.set(expense.id, created.id);
    if (expense.deletedAt) await financeRepository.softDeleteExpense({ expenseId: created.id });
    inc("expenses");
  }

  // 14. Payments
  for (const payment of backup.payments) {
    const newExpenseId = payment.expenseId ? expenseIdMap.get(payment.expenseId) : undefined;
    const newBookingId = payment.bookingId ? bookingIdByOldBookingId.get(payment.bookingId) : undefined;
    if (!newExpenseId && !newBookingId) continue;
    const created = await financeRepository.createPayment({
      input: {
        expenseId: newExpenseId,
        bookingId: newBookingId,
        amount: payment.amount,
        currencyCode: payment.currencyCode,
        paymentAt: payment.paymentAt,
        paymentMethod: payment.paymentMethod,
        cardId: payment.cardId ? cardIdMap.get(payment.cardId) : undefined,
        notes: payment.notes ?? undefined,
      },
    });
    paymentIdMap.set(payment.id, created.id);
    if (payment.deletedAt) await financeRepository.softDeletePayment({ paymentId: created.id });
    inc("payments");
  }

  // 15. CurrencyExchanges
  for (const exchange of backup.currencyExchanges) {
    const newTripId = tripIdMap.get(exchange.tripId);
    if (!newTripId) continue;
    await financeRepository.createCurrencyExchange({
      input: {
        tripId: newTripId,
        givenAmount: exchange.givenAmount,
        givenCurrencyCode: exchange.givenCurrencyCode,
        receivedAmount: exchange.receivedAmount,
        receivedCurrencyCode: exchange.receivedCurrencyCode,
        actualRate: exchange.actualRate,
        feeAmount: exchange.feeAmount ?? undefined,
        exchangeAt: exchange.exchangeAt,
        notes: exchange.notes ?? undefined,
      },
    });
    inc("currencyExchanges");
  }

  // 16. Refunds
  for (const refund of backup.refunds) {
    const newTripId = tripIdMap.get(refund.tripId);
    const newSourceExpenseId = expenseIdMap.get(refund.sourceExpenseId);
    if (!newTripId || !newSourceExpenseId) continue;
    await financeRepository.createRefund({
      input: {
        tripId: newTripId,
        sourceExpenseId: newSourceExpenseId,
        sourcePaymentId: refund.sourcePaymentId ? paymentIdMap.get(refund.sourcePaymentId) : undefined,
        amount: refund.amount,
        currencyCode: refund.currencyCode,
        reason: refund.reason ?? undefined,
        refundAt: refund.refundAt,
        isReceived: refund.isReceived,
        notes: refund.notes ?? undefined,
      },
    });
    inc("refunds");
  }

  // 17. Deposits
  for (const deposit of backup.deposits) {
    const newTripId = tripIdMap.get(deposit.tripId);
    if (!newTripId) continue;
    const created = await financeRepository.createDeposit({
      input: {
        tripId: newTripId,
        bookingId: deposit.bookingId ? bookingIdByOldBookingId.get(deposit.bookingId) : undefined,
        amount: deposit.amount,
        currencyCode: deposit.currencyCode,
        paidTo: deposit.paidTo ?? undefined,
        reason: deposit.reason ?? undefined,
        expectedReturnDate: deposit.expectedReturnDate ?? undefined,
      },
    });
    if (deposit.isReturned && deposit.returnedAmount !== null && deposit.returnedDate) {
      await financeRepository.markDepositReturned({
        input: { depositId: created.id, returnedAmount: deposit.returnedAmount, returnedDate: deposit.returnedDate },
      });
    }
    inc("deposits");
  }

  // 18. BudgetCategoryLimits
  for (const limit of backup.budgetCategoryLimits) {
    const newTripId = tripIdMap.get(limit.tripId);
    if (!newTripId) continue;
    await financeRepository.upsertBudgetCategoryLimit({ input: { tripId: newTripId, category: limit.category, limitAmount: limit.limitAmount } });
    inc("budgetCategoryLimits");
  }

  // 19. תיאום סופי של יתרות הארנקים — אחרי שכל התשלומים/המרות/החזרים/פיקדונות
  // כבר השפיעו על היתרה כתוצר-לוואי, זה מבטיח שהיתרה הסופית תואמת בדיוק את
  // המקור, גם אם סדר-הביניים לא זהה היסטורית.
  for (const wallet of backup.wallets) {
    const newWalletId = walletIdMap.get(wallet.id);
    if (!newWalletId) continue;
    await financeRepository.reconcileWallet({
      input: { walletId: newWalletId, actualBalance: wallet.currentBalance, reason: "שחזור מגיבוי" },
    });
  }

  // 20. Documents — entityId פוליאמורפי, ממופה לפי entityType.
  const idMapByEntityType: Partial<Record<DocumentEntityType, Map<string, string>>> = {
    trip: tripIdMap,
    place: placeIdMap,
    hotel_stay: hotelStayIdMap,
    flight: flightIdMap,
    transport_booking: transportBookingIdMap,
    car_rental: carRentalIdMap,
    insurance: insuranceIdMap,
    planned_activity: plannedActivityIdMap,
    expense: expenseIdMap,
    payment: paymentIdMap,
  };
  for (const doc of backup.documents) {
    // tripId=null אצל entityType="place" בכוונה (ישות גלובלית, ר' schema.prisma) —
    // לא צריך מיפוי tripId בשחזור עבור אלה, רק מיפוי entityId (placeIdMap).
    const newTripId = doc.tripId ? tripIdMap.get(doc.tripId) : undefined;
    const entityIdMap = idMapByEntityType[doc.entityType];
    const newEntityId = entityIdMap?.get(doc.entityId);
    if ((doc.tripId && !newTripId) || !newEntityId) {
      skipped.push({ entity: `document:${doc.id}`, reason: `אין מיפוי id עבור entityType="${doc.entityType}"` });
      continue;
    }
    await documentRepository.create({
      input: {
        tripId: newTripId,
        entityType: doc.entityType,
        entityId: newEntityId,
        documentType: doc.documentType,
        fileUrl: doc.fileUrl,
        fileName: doc.fileName ?? undefined,
        mimeType: doc.mimeType ?? undefined,
        notes: doc.notes ?? undefined,
      },
    });
    inc("documents");
  }

  // 21. ChecklistItems
  for (const item of backup.checklistItems) {
    const newTripId = tripIdMap.get(item.tripId);
    if (!newTripId) continue;
    const created = await checklistItemRepository.create({
      input: { tripId: newTripId, listType: item.listType, name: item.name, category: item.category ?? undefined, quantity: item.quantity ?? undefined },
    });
    if (item.isDone) await checklistItemRepository.toggleDone({ itemId: created.id });
    inc("checklistItems");
  }

  if (backup.walletTransactions.length > 0) {
    skipped.push({
      entity: "walletTransactions",
      reason: `${backup.walletTransactions.length} תנועות ארנק לא שוחזרו כתנועות נפרדות — אין create() ישיר עבורן; היתרה הסופית תואמת בכל זאת (ר' סעיף 19)`,
    });
  }

  return { restoredCounts, skipped };
}
