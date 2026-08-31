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
import { BACKUP_FORMAT_VERSION, type BackupFile } from "@travel-app/shared-types";

/**
 * מרכיב גיבוי מלא לחשבון — כל הטיולים (כולל מחוקים-רכות, כדי שהגיבוי יהיה
 * שימושי גם לשחזור אחרי מחיקה בטעות) ומה שתלוי בהם, פלוס הישויות הגלובליות
 * (Place/Contact/PaymentCard). ר' backup.ts ל-#90 ולרשימת מה לא נכלל.
 */
export async function exportBackup(userId: string): Promise<BackupFile> {
  const [tripRepository, placeRepository, tripPlaceRepository, plannedActivityRepository, bookingRepository, financeRepository, documentRepository, contactRepository, paymentCardRepository, checklistItemRepository, tripGeographyRepository, tripDayRepository] =
    await Promise.all([
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

  const [trips, places, contacts, paymentCards] = await Promise.all([
    tripRepository.list({ userId, includeDeleted: true }),
    placeRepository.list({ userId, includeDeleted: true }),
    contactRepository.list({ userId, includeDeleted: true }),
    paymentCardRepository.list({ userId }),
  ]);

  // תמונות-מקום (Document עם entityType="place", tripId=null) — ישות
  // גלובלית, לא נתפסות ע"י הלולאה הפר-טיול למטה. נאספות פעם אחת כאן.
  const placePhotosPerPlace = await Promise.all(
    places.map((place) => documentRepository.listForEntity({ entityType: "place", entityId: place.id })),
  );
  const placePhotos = placePhotosPerPlace.flat();

  const backup: BackupFile = {
    formatVersion: BACKUP_FORMAT_VERSION,
    exportedAt: new Date().toISOString(),
    trips,
    places,
    tripPlaces: [],
    plannedActivities: [],
    hotelStays: [],
    flights: [],
    transportBookings: [],
    carRentals: [],
    insurances: [],
    bookingBenefits: [],
    transportQuotes: [],
    expenses: [],
    payments: [],
    wallets: [],
    walletTransactions: [],
    currencyExchanges: [],
    refunds: [],
    deposits: [],
    budgetCategoryLimits: [],
    documents: [],
    contacts,
    paymentCards,
    checklistItems: [],
    tripCountries: [],
    tripCities: [],
    tripDays: [],
  };

  for (const trip of trips) {
    const tripId = trip.id;

    const [tripPlaces, plannedActivities, hotelStays, flights, transportBookings, carRentals, insurances, transportQuotes] = await Promise.all([
      tripPlaceRepository.listForTrip({ userId, tripId }),
      plannedActivityRepository.listForTrip({ tripId, includeDeleted: true }),
      bookingRepository.listHotelStays({ tripId, includeDeleted: true }),
      bookingRepository.listFlights({ tripId, includeDeleted: true }),
      bookingRepository.listTransportBookings({ tripId, includeDeleted: true }),
      bookingRepository.listCarRentals({ tripId }),
      bookingRepository.listInsurances({ tripId, includeDeleted: true }),
      bookingRepository.listTransportQuotes({ tripId }),
    ]);

    backup.tripPlaces.push(...tripPlaces);
    backup.plannedActivities.push(...plannedActivities);
    backup.hotelStays.push(...hotelStays);
    backup.flights.push(...flights);
    backup.transportBookings.push(...transportBookings);
    backup.carRentals.push(...carRentals);
    backup.insurances.push(...insurances);
    backup.transportQuotes.push(...transportQuotes);

    const bookingIds = [...hotelStays, ...flights, ...transportBookings, ...carRentals, ...insurances].map((b) => b.bookingId);
    const benefitsPerBooking = await Promise.all(bookingIds.map((bookingId) => bookingRepository.listBookingBenefits({ bookingId })));
    backup.bookingBenefits.push(...benefitsPerBooking.flat());

    const [expenses, payments, wallets, walletTransactions, currencyExchanges, refunds, deposits, budgetCategoryLimits, documents] = await Promise.all([
      financeRepository.listExpenses({ tripId, includeDeleted: true }),
      financeRepository.listPaymentsByTrip({ tripId, includeDeleted: true }),
      financeRepository.listWallets({ tripId }),
      financeRepository.listWalletTransactions({ tripId }),
      financeRepository.listCurrencyExchanges({ tripId }),
      financeRepository.listRefunds({ tripId }),
      financeRepository.listDeposits({ tripId }),
      financeRepository.listBudgetCategoryLimits({ tripId }),
      documentRepository.listForTrip({ tripId }),
    ]);

    backup.expenses.push(...expenses);
    backup.payments.push(...payments);
    backup.wallets.push(...wallets);
    backup.walletTransactions.push(...walletTransactions);
    backup.currencyExchanges.push(...currencyExchanges);
    backup.refunds.push(...refunds);
    backup.deposits.push(...deposits);
    backup.budgetCategoryLimits.push(...budgetCategoryLimits);
    backup.documents.push(...documents);

    const [packingItems, beforeTripItems] = await Promise.all([
      checklistItemRepository.listForTrip({ tripId, listType: "packing" }),
      checklistItemRepository.listForTrip({ tripId, listType: "before_trip" }),
    ]);
    backup.checklistItems.push(...packingItems, ...beforeTripItems);

    const [tripCountries, tripCities] = await Promise.all([
      tripGeographyRepository.listCountries({ tripId }),
      tripGeographyRepository.listCities({ tripId }),
    ]);
    backup.tripCountries.push(...tripCountries);
    backup.tripCities.push(...tripCities);

    const tripDays = await tripDayRepository.listForTrip({ tripId });
    backup.tripDays.push(...tripDays);
  }

  backup.documents.push(...placePhotos);

  return backup;
}
