import Link from "next/link";
import { Suspense } from "react";
import { notFound, redirect } from "next/navigation";
import type { Expense } from "@travel-app/shared-types";
import { getCurrentUser } from "@/lib/auth/get-current-user";
import {
  getAuditLogRepository,
  getBookingRepository,
  getCurrencyRateProvider,
  getDocumentRepository,
  getFinanceRepository,
  getNotificationPreferenceRepository,
  getPaymentCardRepository,
  getPlaceRepository,
  getCompanionPollRepository,
  getPlannedActivityRepository,
  getTripCompanionRepository,
  getTripGeographyRepository,
  getTripPlaceRepository,
  getTripRepository,
  getTripShareLinkRepository,
} from "@travel-app/data-layer";
import { getTripDayDates } from "@/lib/trip-days";
import { detectGaps } from "@/lib/gap-detection";
import { NoHotelNightsList } from "@/components/no-hotel-nights";
import { computeBudgetProgress, computeSpendingPace } from "@/lib/budget";
import { computeSettleUp } from "@/lib/settle-up";
import { getExpenseCategoryLabel } from "@/lib/expense-labels";
import { TIP_CATEGORY_LABELS } from "@/lib/tip-labels";
import { PLACE_CATEGORY_LABELS } from "@/lib/place-labels";
import { TRIP_PLACE_STATUS_LABELS } from "@/lib/trip-place-labels";
import { LIFECYCLE_STATUS_LABELS } from "@/lib/lifecycle-status-labels";
import { LIFECYCLE_STATUS_TONE } from "@/lib/lifecycle-status-tone";
import { StatusBadge } from "@/components/ui/StatusBadge";
import { StatCard } from "@/components/ui/StatCard";
import { ProgressRing } from "@/components/ui/ProgressRing";
import { Wallet as WalletIcon, Receipt, CalendarBlank, Gift, CheckCircle } from "@phosphor-icons/react/ssr";
import { Avatar } from "@/components/ui/Avatar";
import { MapWidgetCard } from "@/app/(app)/dashboard/map-widget-card";
import { DOCUMENT_TYPE_LABELS, DOCUMENT_ENTITY_TYPE_LABELS } from "@/lib/document-labels";
import { AUDIT_ACTION_LABELS, AUDIT_ENTITY_TYPE_LABELS, AUDIT_FIELD_LABELS } from "@/lib/audit-log-labels";
import { NavigateButtons } from "@/components/navigate-buttons";
import { HotelPriceLinks } from "@/components/hotel-price-links";
import { CurrencyQuickConverter } from "@/components/currency-quick-converter";
import { AtmFinderWidget } from "./finances/atm-finder-widget";
import { FlightPriceLinks } from "@/components/flight-price-links";
import { OpenNowBadge } from "@/components/open-now-badge";
import { LiveTimer } from "@/components/live-timer";
import { AirportTimingCalculator } from "@/components/airport-timing-calculator";
import { CheckInWindowPicker } from "@/components/check-in-window-picker";
import { FlightStatusCheck } from "@/components/flight-status-check";
import { isFlightStatusConfigured } from "@/lib/flight-status/config";
import { SendDriverWhatsAppLink } from "@/components/send-driver-whatsapp-link";
import { FLIGHT_LEG_TYPE_LABELS } from "@/lib/flight-leg-type-labels";
import { TRANSPORT_MODE_LABELS } from "@/lib/transport-mode-labels";
import { breakfastPriceUnitLabel } from "@/lib/breakfast-price-unit-labels";
import { VEHICLE_TYPE_LABELS } from "@/lib/vehicle-type-labels";
import { daysUntil, formatDaysRemaining } from "@/lib/format-countdown";
import { TripEditForm } from "../trip-edit-form";
import { DeleteTripButton } from "../delete-trip-button";
import { HotelStayForm } from "./bookings/hotel-stay-form";
import { FlightForm } from "./bookings/flight-form";
import { TransportBookingForm } from "./bookings/transport-booking-form";
import { EditTransportBookingForm } from "./bookings/edit-transport-booking-form";
import { TransportQuotesSection } from "./bookings/transport-quotes-section";
import { InsuranceForm } from "./bookings/insurance-form";
import { ActivityReservationForm } from "./bookings/activity-reservation-form";
import { CarRentalForm } from "./bookings/car-rental-form";
import {
  DeleteActivityReservationButton,
  DeleteCarRentalButton,
  DeleteFlightButton,
  DeleteHotelStayButton,
  DeleteInsuranceButton,
  DeleteTransportBookingButton,
} from "./bookings/delete-booking-buttons";
import { setHotelStayPersonalRatingAction, setTransportBookingPersonalRatingAction } from "./bookings/actions";
import { PersonalRatingSelect } from "@/components/personal-rating-select";
import { Select } from "@/components/ui/Select";
import { DatePicker } from "@/components/ui/DatePicker";
import { RENTAL_VEHICLE_TYPE_LABELS } from "@/lib/rental-vehicle-type-labels";
import { BookingBenefitsSection } from "./bookings/booking-benefits-section";
import { WalletTopUpForm } from "./finances/wallet-top-up-form";
import { WalletSpendChart } from "./finances/wallet-spend-chart";
import { TripCompanionForm } from "./companions/companion-form";
import { TripCompanionList } from "./companions/companion-list";
import { SettleUpSection } from "./companions/settle-up-section";
import { CompanionPollsSection } from "./companions/polls-section";
import { ShareLinkPanel } from "./sharing/share-link-panel";
import { ReconcileWalletForm } from "./finances/reconcile-wallet-form";
import { CorrectWalletTopUpForm } from "./finances/correct-wallet-top-up-form";
import { ExpenseCreateForm } from "./finances/expense-create-form";
import { PaymentCreateForm } from "./finances/payment-create-form";
import { CurrencyExchangeForm } from "./finances/currency-exchange-form";
import { CorrectCurrencyExchangeForm } from "./finances/correct-currency-exchange-form";
import { computePreferredCurrencyCodes } from "@/lib/preferred-currencies";
import { ExchangeRatesCard } from "@/components/exchange-rates-card";
import { TripSectionNavDesktop, TripSectionNavMobile } from "./trip-section-nav";
import { RefundForm } from "./finances/refund-form";
import { MarkRefundReceivedForm } from "./finances/mark-refund-received-form";
import { DeletePaymentButton } from "./finances/delete-payment-button";
import { DeleteExpenseButton } from "./finances/delete-expense-button";
import { DepositCreateForm } from "./finances/deposit-create-form";
import { MarkDepositReturnedForm } from "./finances/mark-deposit-returned-form";
import { CreditCardSummary } from "./finances/credit-card-summary";
import { BudgetSection } from "./budget-section";
import { GeographySection } from "./geography/geography-section";
import { WALLET_TX_TYPE_LABELS } from "@/lib/wallet-tx-labels";
import { formatMoney } from "@/lib/currency-format";
import { buildCsv } from "@/lib/csv-export";
import { formatTimeWithIsraelReference } from "@/lib/dates";
import { PAYMENT_METHOD_LABELS } from "@/lib/payment-method-labels";
import { LinkPlaceForm } from "./trip-places/link-place-form";
import { RepeatVisitsSection } from "./repeat-visits-section";
import { computeRepeatVisitSuggestions } from "@/lib/repeat-visits";
import { PlannedActivityCreateForm } from "./planned-activities/planned-activity-create-form";
import { PlannedActivitiesView } from "./planned-activities/planned-activities-view";
import { DocumentUploadForm } from "./documents/document-upload-form";
import { DeleteDocumentButton } from "./documents/delete-document-button";
import { EntityDocumentSection } from "./documents/entity-document-section";
import { DocumentOcrPanel } from "./documents/document-ocr-panel";
import { EntityPhotoGallery } from "./documents/entity-photo-gallery";
import { TripMemoriesGallery } from "./documents/trip-memories-gallery";
import { NotificationPreferencesSection } from "./notifications/notification-preferences-section";
import { PrintButton } from "@/components/print-button";
import { OpenDetailsFromHash } from "@/components/open-details-from-hash";
import { ExportCsvButton } from "@/components/export-csv-button";
import { ExportXlsxButton } from "@/components/export-xlsx-button";
import { ExportPdfButton } from "@/components/export-pdf-button";
import type { XlsxSheetData } from "@/lib/xlsx-export";

export const dynamic = "force-dynamic";

export default async function TripDetailPage({
  params,
  searchParams,
}: {
  params: Promise<{ tripId: string }>;
  searchParams: Promise<{
    docType?: string;
    docEntityType?: string;
    docFrom?: string;
    docTo?: string;
    expenseFrom?: string;
    expenseTo?: string;
    fromQuote?: string;
  }>;
}) {
  const user = await getCurrentUser();
  if (!user) redirect("/login");

  const { tripId } = await params;
  const {
    docType: docTypeFilter,
    docEntityType: docEntityTypeFilter,
    docFrom,
    docTo,
    expenseFrom,
    expenseTo,
    fromQuote: fromQuoteId,
  } = await searchParams;
  const tripRepository = await getTripRepository();
  const trip = await tripRepository.getById({ userId: user.id, tripId });

  if (!trip) {
    notFound();
  }

  const dayDates = getTripDayDates(trip.startDate, trip.endDate);

  // כל אחת מ-25 השאילתות למטה עצמאית לגמרי מהאחרות (כולן צריכות רק tripId/
  // user.id שכבר בידינו) — Promise.all אחד גדול, לא כמה קבוצות-רצף נפרדות,
  // כדי שכולן יירו במקביל במקום שכל קבוצה תחכה לקודמתה (round-trip נוסף
  // לשרת-ה-DB המרוחק בכל המתנה מיותרת).
  const bookingRepository = await getBookingRepository();
  const tripGeographyRepository = await getTripGeographyRepository();
  const tripCompanionRepository = await getTripCompanionRepository();
  const companionPollRepository = await getCompanionPollRepository();
  const tripShareLinkRepository = await getTripShareLinkRepository();
  const financeRepository = await getFinanceRepository();
  const plannedActivityRepository = await getPlannedActivityRepository();
  const paymentCardRepository = await getPaymentCardRepository();
  const documentRepository = await getDocumentRepository();
  const notificationPreferenceRepository = await getNotificationPreferenceRepository();

  const [
    hotelStays,
    flights,
    transportBookings,
    insurances,
    activityReservations,
    carRentals,
    transportQuotes,
    tripCountries,
    tripCities,
    tripCompanions,
    companionPolls,
    activeShareLink,
    wallets,
    expenses,
    currencyExchanges,
    refunds,
    deposits,
    walletTransactions,
    tripPayments,
    budgetCategoryLimits,
    expenseParticipants,
    plannedActivities,
    paymentCards,
    tripDocuments,
    notificationPreferences,
  ] = await Promise.all([
    bookingRepository.listHotelStays({ tripId }),
    bookingRepository.listFlights({ tripId }),
    bookingRepository.listTransportBookings({ tripId }),
    bookingRepository.listInsurances({ tripId }),
    bookingRepository.listActivityReservations({ tripId }),
    bookingRepository.listCarRentals({ tripId }),
    bookingRepository.listTransportQuotes({ tripId }),
    tripGeographyRepository.listCountries({ tripId }),
    tripGeographyRepository.listCities({ tripId }),
    tripCompanionRepository.listForTrip({ tripId }),
    companionPollRepository.listForTrip({ tripId }),
    tripShareLinkRepository.getActiveForTrip({ tripId }),
    financeRepository.listWallets({ tripId }),
    financeRepository.listExpenses({ tripId }),
    financeRepository.listCurrencyExchanges({ tripId }),
    financeRepository.listRefunds({ tripId }),
    financeRepository.listDeposits({ tripId }),
    financeRepository.listWalletTransactions({ tripId }),
    financeRepository.listPaymentsByTrip({ tripId }),
    financeRepository.listBudgetCategoryLimits({ tripId }),
    financeRepository.listExpenseParticipants({ tripId }),
    plannedActivityRepository.listForTrip({ tripId }),
    paymentCardRepository.list({ userId: user.id }),
    documentRepository.listForTrip({ tripId }),
    notificationPreferenceRepository.listForTrip({ tripId }),
  ]);
  const sourceQuote = fromQuoteId ? (transportQuotes.find((q) => q.id === fromQuoteId && !q.transportBookingId) ?? null) : null;
  const preferredCurrencyCodes = computePreferredCurrencyCodes(tripCountries);

  // שער יציג חי לכל מטבע שיש לו ארנק **או** הוצאה (גם תקציב צריך אותו) —
  // לא ממציאים שער אם שני המקורות נכשלו, ראה DECISIONS.md ("CurrencyRateProvider").
  const currencyRateProvider = getCurrencyRateProvider();
  const walletCurrencyCodes = Array.from(new Set([...wallets.map((w) => w.currencyCode), ...expenses.map((e) => e.currencyCode)]));
  const currencyRates = await currencyRateProvider.getRatesToILS(walletCurrencyCodes);
  const rateByCurrency = new Map(currencyRates.map((r) => [r.currencyCode, r]));
  const rateToILSByCurrency = new Map(currencyRates.map((r) => [r.currencyCode, r.rateToILS]));

  const expenseParticipantsByExpenseId = new Map<string, string[]>();
  for (const participant of expenseParticipants) {
    const list = expenseParticipantsByExpenseId.get(participant.expenseId) ?? [];
    list.push(participant.companionId);
    expenseParticipantsByExpenseId.set(participant.expenseId, list);
  }
  const settleUp = computeSettleUp({
    expenses,
    expenseParticipantsByExpenseId,
    payments: tripPayments,
    companions: tripCompanions,
    rateToILSByCurrency,
  });

  const budgetProgress = computeBudgetProgress({
    expenses,
    categoryLimits: budgetCategoryLimits,
    totalBudgetAmount: trip.totalBudgetAmount,
    dailyBudgetAmount: trip.dailyBudgetAmount,
    rateToILSByCurrency,
  });

  const today = new Date().toISOString().slice(0, 10);
  const spendingPace = computeSpendingPace({
    dayDates,
    today,
    totalSpentAmount: budgetProgress.totalSpentAmount,
  });

  // אותו חישוב בדיוק כמו כרטיסי-הסיכום בדשבורד (dashboard/page.tsx) — כאן
  // מוצג עבור הטיול הספציפי שנצפה, לא רק ה"טיול הפעיל".
  const bookingsCount =
    hotelStays.length + flights.length + transportBookings.length + insurances.length + activityReservations.length + carRentals.length;
  const primaryWallet = wallets[0] ?? null;
  const primaryCurrencyExpenseTotal = primaryWallet
    ? expenses.filter((e) => e.currencyCode === primaryWallet.currencyCode).reduce((sum, e) => sum + e.amount, 0)
    : null;

  // "ימים עם פעילות מתועדת" — נבדל בכוונה מ"ימים בטיול" (ימים-שחלפו בלוח-שנה,
  // למטה): סופר ימים שיש בהם בפועל הוצאה רשומה, לא רק ימים שכבר עברו.
  const expenseDates = new Set(expenses.map((e) => e.expenseAt.slice(0, 10)));
  const activeDaysCount = dayDates.filter((d) => expenseDates.has(d)).length;

  // "בוצעו X מתוך Y" לתכנון עתידי — בלי מבוטלות במכנה (הן מעולם לא היו אמורות לקרות).
  const plannedActivitiesCountable = plannedActivities.filter((a) => a.status !== "cancelled");
  const plannedActivitiesDoneCount = plannedActivitiesCountable.filter((a) => a.status === "done").length;

  // שאילתה מקובצת אחת במקום N (אחת לכל מלון) — ר' listBookingBenefitsForBookingIds.
  const allHotelBenefits = await bookingRepository.listBookingBenefitsForBookingIds({
    bookingIds: hotelStays.map((h) => h.bookingId),
  });
  const hotelBenefitsByBookingId = new Map<string, typeof allHotelBenefits>();
  for (const benefit of allHotelBenefits) {
    const list = hotelBenefitsByBookingId.get(benefit.bookingId) ?? [];
    list.push(benefit);
    hotelBenefitsByBookingId.set(benefit.bookingId, list);
  }

  // שדות-OCR נשלפים רק למסמכים שכבר נקראו (pending לא צריך) — נמנע מ-N שאילתות
  // מיותרות ברוב-המקרים (רוב המסמכים בדמו עדיין לא נקראו). שאילתה מקובצת אחת
  // במקום N (אחת לכל מסמך) — ר' listExtractedFieldsForDocumentIds.
  const nonPendingDocuments = tripDocuments.filter((d) => d.ocrStatus !== "pending");
  const allExtractedFields = await documentRepository.listExtractedFieldsForDocumentIds({
    documentIds: nonPendingDocuments.map((d) => d.id),
  });
  const extractedFieldsByDocumentId = new Map<string, typeof allExtractedFields>();
  for (const field of allExtractedFields) {
    const list = extractedFieldsByDocumentId.get(field.documentId) ?? [];
    list.push(field);
    extractedFieldsByDocumentId.set(field.documentId, list);
  }

  function documentsByEntity(entityType: (typeof tripDocuments)[number]["entityType"]): Map<string, typeof tripDocuments> {
    const map = new Map<string, typeof tripDocuments>();
    for (const doc of tripDocuments) {
      if (doc.entityType !== entityType) continue;
      const list = map.get(doc.entityId) ?? [];
      list.push(doc);
      map.set(doc.entityId, list);
    }
    return map;
  }

  const filteredDocuments = tripDocuments
    .filter((doc) => !docEntityTypeFilter || doc.entityType === docEntityTypeFilter)
    .filter((doc) => !docTypeFilter || doc.documentType === docTypeFilter)
    .filter((doc) => !docFrom || doc.uploadedAt.slice(0, 10) >= docFrom)
    .filter((doc) => !docTo || doc.uploadedAt.slice(0, 10) <= docTo)
    .sort((a, b) => b.uploadedAt.localeCompare(a.uploadedAt));

  const documentsByExpenseId = documentsByEntity("expense");
  const documentsByHotelStayId = documentsByEntity("hotel_stay");
  const documentsByFlightId = documentsByEntity("flight");
  const documentsByTransportBookingId = documentsByEntity("transport_booking");
  const documentsByInsuranceId = documentsByEntity("insurance");
  const documentsByActivityReservationId = documentsByEntity("activity_reservation");
  const documentsByCarRentalId = documentsByEntity("car_rental");
  const documentsByPlaceId = documentsByEntity("place");
  const documentsByPlannedActivityId = documentsByEntity("planned_activity");
  const documentsByPaymentId = documentsByEntity("payment");
  const tripMemoryDocuments = documentsByEntity("trip").get(tripId) ?? [];

  const auditLogRepository = await getAuditLogRepository();
  const auditLogEntries = await auditLogRepository.listForEntities({
    refs: [{ entityType: "trip", entityId: tripId }, ...plannedActivities.map((a) => ({ entityType: "planned_activity", entityId: a.id }))],
  });

  const documentedEntityKeys = new Set(tripDocuments.map((d) => `${d.entityType}:${d.entityId}`));
  const gaps = detectGaps({
    now: new Date(),
    dayDates,
    hotelStays,
    flights,
    transportBookings,
    insurances,
    plannedActivities,
    wallets,
    deposits,
    refunds,
    documentedEntityKeys,
    budgetProgress,
    carRentals,
    countryNames: tripCountries.map((c) => c.countryName),
    trip: {
      endDate: trip.endDate,
      passportExpiryDate: trip.passportExpiryDate,
      internationalDrivingPermitExpiryDate: trip.internationalDrivingPermitExpiryDate,
      israeliDrivingLicenseExpiryDate: trip.israeliDrivingLicenseExpiryDate,
      visaRequirementsChecked: trip.visaRequirementsChecked,
    },
  });
  // "לילות בלי מלון" מוצג בנפרד, כצ'יפים לחיצים (ר' NoHotelNightsList) — לא
  // עוד שורת-טקסט שטוחה בתוך רשימת-החוסרים הכללית.
  const noHotelNights = gaps.filter((g) => g.id.startsWith("no-hotel-")).map((g) => g.date!);
  const otherGaps = gaps.filter((g) => !g.id.startsWith("no-hotel-"));
  // מקבצים מתוך tripPayments שכבר נשלף למעלה (שורה 194) — לא שולפים שוב פר-הוצאה.
  // tripPayments כבר מכיל את כל התשלומים המקושרים-להוצאה של הטיול; זה היה N
  // שאילתות מיותרות לגמרי (אחת לכל הוצאה) על מידע שכבר בזיכרון.
  const paymentsByExpenseId = new Map<string, typeof tripPayments>();
  for (const payment of tripPayments) {
    if (!payment.expenseId) continue;
    const list = paymentsByExpenseId.get(payment.expenseId) ?? [];
    list.push(payment);
    paymentsByExpenseId.set(payment.expenseId, list);
  }
  const expensesWithPayments = expenses.map((expense) => ({
    expense,
    payments: paymentsByExpenseId.get(expense.id) ?? [],
  }));
  const expenseDateFilterActive = Boolean(expenseFrom || expenseTo);
  const visibleExpensesWithPayments = expensesWithPayments.filter(({ expense }) => {
    const date = expense.expenseAt.slice(0, 10);
    if (expenseFrom && date < expenseFrom) return false;
    if (expenseTo && date > expenseTo) return false;
    return true;
  });

  const placeRepository = await getPlaceRepository();
  const tripPlaceRepository = await getTripPlaceRepository();
  const [allPlaces, tripPlaces] = await Promise.all([
    placeRepository.list({ userId: user.id }),
    tripPlaceRepository.listForTrip({ userId: user.id, tripId }),
  ]);
  const linkedPlaceIds = new Set(tripPlaces.map((tp) => tp.placeId));
  const availablePlaces = allPlaces.filter((p) => !linkedPlaceIds.has(p.id));
  const placesById = new Map(allPlaces.map((p) => [p.id, p]));

  const otherTrips = (await tripRepository.list({ userId: user.id })).filter((t) => t.id !== tripId);
  // שאילתה מקובצת אחת במקום N (אחת לכל טיול-אחר) — ר' listForTrips.
  const otherTripPlaces = await tripPlaceRepository.listForTrips({ userId: user.id, tripIds: otherTrips.map((t) => t.id) });
  const repeatVisitSuggestions = computeRepeatVisitSuggestions({
    currentTrip: trip,
    currentTripPlaces: tripPlaces,
    otherTrips,
    otherTripPlaces,
  });

  const expensesCsv = buildCsv(
    ["תאריך", "קטגוריה", "תיאור", "סכום", "מטבע"],
    expenses.map((e) => [e.expenseAt.slice(0, 10), getExpenseCategoryLabel(e.category), e.description ?? "", e.amount, e.currencyCode]),
  );
  const walletTransactionsCsv = buildCsv(
    ["תאריך", "סוג", "סכום", "הערות"],
    walletTransactions.map((t) => [new Date(t.txAt).toLocaleString("he-IL"), WALLET_TX_TYPE_LABELS[t.type] ?? t.type, t.amount, t.notes ?? ""]),
  );
  const hotelStaysCsv = buildCsv(
    ["מלון", "צ'ק-אין", "צ'ק-אאוט", "מחיר", "מטבע"],
    hotelStays.map((h) => [h.hotelName, h.checkInDate, h.checkOutDate, h.agreedPrice ?? "", h.agreedCurrencyCode ?? ""]),
  );
  const flightsCsv = buildCsv(
    ["חברה", "מספר טיסה", "מוצא", "יעד", "המראה", "נחיתה"],
    flights.map((f) => [f.airline, f.flightNumber ?? "", f.departureAirport, f.arrivalAirport, f.departureAt, f.arrivalAt]),
  );
  const transportBookingsCsv = buildCsv(
    ["סוג", "מוצא", "יעד", "איסוף"],
    transportBookings.map((t) => [TRANSPORT_MODE_LABELS[t.mode] ?? t.mode, t.pickupText ?? "", t.dropoffText ?? "", t.pickupAt]),
  );
  const insurancesCsv = buildCsv(
    ["חברה", "מתאריך", "עד תאריך", "מספר פוליסה"],
    insurances.map((i) => [i.company, i.startDate, i.endDate, i.policyNumber ?? ""]),
  );
  const activityReservationsCsv = buildCsv(
    ["שם האתר", "תאריך", "שעה", "סוג כרטיס"],
    activityReservations.map((a) => [a.venueName, a.activityDate, a.activityTime ?? "", a.ticketType ?? ""]),
  );
  const carRentalsCsv = buildCsv(
    ["סוג רכב", "חברה", "איסוף", "החזרה"],
    carRentals.map((c) => [RENTAL_VEHICLE_TYPE_LABELS[c.vehicleType], c.companyName, c.pickupAt, c.dropoffAt ?? ""]),
  );

  // אותם headers/rows בדיוק כמו ה-CSV-ים למעלה, מקובצים לקובץ Excel אחד
  // אמיתי (כמה sheets) — לא ניחוש מחדש של הנתונים, אותה מקור-אמת.
  const tripExportSheets: XlsxSheetData[] = [
    { name: "הוצאות", headers: ["תאריך", "קטגוריה", "תיאור", "סכום", "מטבע"], rows: expenses.map((e) => [e.expenseAt.slice(0, 10), getExpenseCategoryLabel(e.category), e.description ?? "", e.amount, e.currencyCode]) },
    { name: "תנועות ארנק", headers: ["תאריך", "סוג", "סכום", "הערות"], rows: walletTransactions.map((t) => [new Date(t.txAt).toLocaleString("he-IL"), WALLET_TX_TYPE_LABELS[t.type] ?? t.type, t.amount, t.notes ?? ""]) },
    { name: "מלונות", headers: ["מלון", "צ'ק-אין", "צ'ק-אאוט", "מחיר", "מטבע"], rows: hotelStays.map((h) => [h.hotelName, h.checkInDate, h.checkOutDate, h.agreedPrice ?? "", h.agreedCurrencyCode ?? ""]) },
    { name: "טיסות", headers: ["חברה", "מספר טיסה", "מוצא", "יעד", "המראה", "נחיתה"], rows: flights.map((f) => [f.airline, f.flightNumber ?? "", f.departureAirport, f.arrivalAirport, f.departureAt, f.arrivalAt]) },
    { name: "תחבורה", headers: ["סוג", "מוצא", "יעד", "איסוף"], rows: transportBookings.map((t) => [TRANSPORT_MODE_LABELS[t.mode] ?? t.mode, t.pickupText ?? "", t.dropoffText ?? "", t.pickupAt]) },
    { name: "ביטוחים", headers: ["חברה", "מתאריך", "עד תאריך", "מספר פוליסה"], rows: insurances.map((i) => [i.company, i.startDate, i.endDate, i.policyNumber ?? ""]) },
    { name: "אטרקציות", headers: ["שם האתר", "תאריך", "שעה", "סוג כרטיס"], rows: activityReservations.map((a) => [a.venueName, a.activityDate, a.activityTime ?? "", a.ticketType ?? ""]) },
    { name: "השכרות רכב", headers: ["סוג רכב", "חברה", "איסוף", "החזרה"], rows: carRentals.map((c) => [RENTAL_VEHICLE_TYPE_LABELS[c.vehicleType], c.companyName, c.pickupAt, c.dropoffAt ?? ""]) },
  ].filter((sheet) => sheet.rows.length > 0);

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: "1.5rem" }}>
      <OpenDetailsFromHash />
      <div>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", flexWrap: "wrap", gap: "0.75rem" }}>
          <div>
            <h1 style={{ font: "var(--text-h1)", margin: 0 }}>{trip.name}</h1>
            <div style={{ display: "flex", alignItems: "center", gap: "0.625rem", marginTop: "0.375rem" }}>
              <span style={mutedStyle}>
                {trip.startDate} – {trip.endDate}
              </span>
              {tripCompanions.length > 0 ? (
                <div style={{ display: "flex" }}>
                  {tripCompanions.slice(0, 4).map((companion, index) => (
                    <div key={companion.id} style={{ marginInlineStart: index === 0 ? 0 : "-0.5rem" }}>
                      <Avatar label={companion.displayName} size={26} />
                    </div>
                  ))}
                  {tripCompanions.length > 4 ? (
                    <div
                      style={{
                        marginInlineStart: "-0.5rem",
                        width: 26,
                        height: 26,
                        borderRadius: "50%",
                        background: "var(--color-surface-elevated)",
                        border: "1px solid var(--color-border)",
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "center",
                        fontSize: "0.6875rem",
                        fontWeight: 700,
                        color: "var(--color-text-muted)",
                      }}
                    >
                      +{tripCompanions.length - 4}
                    </div>
                  ) : null}
                </div>
              ) : null}
            </div>
          </div>
          <div style={{ display: "flex", gap: "0.375rem", alignItems: "center", flexWrap: "wrap" }}>
            <Link href={`/trips/${tripId}/calendar`} style={headerLinkStyle}>
              📅 לוח שנה
            </Link>
            <Link href={`/trips/${tripId}/packing`} style={headerLinkStyle}>
              🧳 רשימת אריזה
            </Link>
            <Link href={`/trips/${tripId}/report`} style={headerLinkStyle}>
              📊 דוח טיול
            </Link>
            <Link href={`/trips/${tripId}/recommendations`} style={headerLinkStyle}>
              ✨ המלצות מקומות
            </Link>
            <PrintButton />
            <ExportCsvButton csv={expensesCsv} fileName={`הוצאות-${trip.name}.csv`} label="⬇️ ייצוא הוצאות (CSV)" />
            <ExportCsvButton csv={walletTransactionsCsv} fileName={`תנועות-ארנק-${trip.name}.csv`} label="⬇️ ייצוא ארנק (CSV)" />
            {tripExportSheets.length > 0 ? (
              <>
                <ExportXlsxButton sheets={tripExportSheets} fileName={`${trip.name}.xlsx`} label="📗 ייצוא Excel מלא" />
                <ExportPdfButton sheets={tripExportSheets} title={trip.name} fileName={`${trip.name}.pdf`} label="📄 ייצוא PDF מלא" />
              </>
            ) : null}
          </div>
        </div>
        {trip.deletedAt ? (
          <p style={{ color: "var(--color-danger)" }}>הטיול נמחק (Soft Delete) — ניתן לשחזר מרשימת הטיולים.</p>
        ) : null}
      </div>

      <MapWidgetCard trip={trip} tripPlaces={tripPlaces} />

      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(160px, 1fr))", gap: "var(--space-4)" }}>
        <StatCard
          label="יתרת ארנק"
          value={primaryWallet ? primaryWallet.currentBalance.toLocaleString("he-IL") : "—"}
          hint={primaryWallet?.currencyCode}
          icon={WalletIcon}
          href="#wallet"
        />
        <StatCard
          label="הוצאות הטיול"
          value={primaryCurrencyExpenseTotal !== null ? primaryCurrencyExpenseTotal.toLocaleString("he-IL") : "—"}
          hint={primaryWallet?.currencyCode}
          icon={Receipt}
          ringPercent={
            primaryWallet && primaryWallet.initialAmount > 0 && primaryCurrencyExpenseTotal !== null
              ? (primaryCurrencyExpenseTotal / primaryWallet.initialAmount) * 100
              : undefined
          }
          href="#expenses"
        />
        <StatCard
          label="ימים בטיול"
          value={`${Math.min(dayDates.filter((d) => d <= today).length, dayDates.length)} מתוך ${dayDates.length}`}
          hint={dayDates.length > 0 ? `${Math.round((Math.min(dayDates.filter((d) => d <= today).length, dayDates.length) / dayDates.length) * 100)}% הושלם` : undefined}
          icon={CalendarBlank}
          href="#days"
        />
        <StatCard
          label="ימים עם פעילות מתועדת"
          value={`${activeDaysCount} מתוך ${dayDates.length}`}
          hint={dayDates.length > 0 ? `${Math.round((activeDaysCount / dayDates.length) * 100)}%` : undefined}
          icon={CheckCircle}
          href="#days"
        />
        <StatCard
          label="הזמנות"
          value={bookingsCount}
          hint={bookingsCount > 0 ? [hotelStays.length && `${hotelStays.length} מלונות`, flights.length && `${flights.length} טיסות`].filter(Boolean).join(" · ") || undefined : undefined}
          icon={Gift}
          href="#bookings"
        />
      </div>

      <TripSectionNavMobile tripId={tripId} hasSettleUp={settleUp.balances.length > 0} hasRepeatVisits={repeatVisitSuggestions.length > 0} />

      <div style={{ display: "flex", gap: "1rem", alignItems: "flex-start" }}>
        <TripSectionNavDesktop tripId={tripId} hasSettleUp={settleUp.balances.length > 0} hasRepeatVisits={repeatVisitSuggestions.length > 0} />
        <div style={{ display: "flex", flexDirection: "column", gap: "1.5rem", flex: 1, minWidth: 0 }}>

      {gaps.length > 0 ? (
        <section
          style={{
            padding: "var(--space-4)",
            borderRadius: "var(--radius-lg)",
            border: "1px solid color-mix(in srgb, var(--color-warning) 35%, transparent)",
            background: "color-mix(in srgb, var(--color-warning) 12%, transparent)",
          }}
        >
          <h2 style={{ ...sectionTitleStyle, color: "var(--color-warning)" }}>⚠️ בדיקת חוסרים ({gaps.length})</h2>
          {noHotelNights.length > 0 ? (
            <div style={{ marginBottom: otherGaps.length > 0 ? "var(--space-3)" : 0 }}>
              <NoHotelNightsList tripId={tripId} nights={noHotelNights} />
            </div>
          ) : null}
          {otherGaps.length > 0 ? (
            <ul style={{ listStyle: "none", padding: 0, display: "flex", flexDirection: "column", gap: "0.5rem", margin: 0 }}>
              {otherGaps.map((gap) => (
                <li key={gap.id} style={{ font: "var(--text-body)" }}>
                  <span style={{ fontWeight: 600, color: "var(--color-warning)" }}>{gap.title}</span>
                  <span style={{ color: "var(--color-text-muted)" }}> — {gap.detail}</span>
                </li>
              ))}
            </ul>
          ) : null}
        </section>
      ) : null}

      <section id="trip-profile" style={sectionCardStyle}>
        <h2 style={sectionTitleStyle}>עריכת טיול</h2>
        <TripEditForm trip={trip} />
      </section>

      <section id="geography" style={sectionCardStyle}>
        <h2 style={sectionTitleStyle}>מדינות וערים בטיול</h2>
        <GeographySection tripId={tripId} countries={tripCountries} cities={tripCities} />
      </section>

      <section id="memories" style={sectionCardStyle}>
        <h2 style={sectionTitleStyle}>זכרונות מהטיול ({tripMemoryDocuments.length})</h2>
        <TripMemoriesGallery tripId={tripId} documents={tripMemoryDocuments} />
      </section>

      <section id="days" style={sectionCardStyle}>
        <h2 style={sectionTitleStyle}>לוח ימי הטיול ({dayDates.length} ימים)</h2>
        <div
          style={{
            display: "grid",
            gridTemplateColumns: "repeat(auto-fill, minmax(110px, 1fr))",
            gap: "0.5rem",
          }}
        >
          {dayDates.map((date, index) => (
            <Link
              key={date}
              href={`/trips/${tripId}/days/${date}`}
              style={{
                padding: "0.75rem",
                border: "1px solid var(--color-border)",
                borderRadius: "var(--radius-md)",
                background: "var(--color-surface)",
                color: "var(--color-text-primary)",
                textDecoration: "none",
                display: "block",
              }}
            >
              <div style={{ fontSize: "0.75rem", color: "var(--color-text-muted)" }}>יום {index + 1}</div>
              <div>{date}</div>
              <div style={{ fontSize: "0.75rem", color: "var(--color-primary)" }}>מסלול →</div>
            </Link>
          ))}
        </div>
      </section>

      <section id="planning" style={sectionCardStyle}>
        <h2 style={sectionTitleStyle}>תכנון עתידי ({plannedActivities.length})</h2>
        {plannedActivitiesCountable.length > 0 ? (
          <p style={mutedStyle}>
            בוצעו {plannedActivitiesDoneCount} מתוך {plannedActivitiesCountable.length} ({Math.round((plannedActivitiesDoneCount / plannedActivitiesCountable.length) * 100)}%)
          </p>
        ) : null}
        <PlannedActivitiesView
          tripId={tripId}
          activities={plannedActivities}
          documentsByPlannedActivityId={Object.fromEntries(documentsByPlannedActivityId)}
          placesById={Object.fromEntries(placesById)}
        />
        <div style={{ marginTop: "0.75rem" }}>
          <PlannedActivityCreateForm tripId={tripId} />
        </div>
      </section>

      <RepeatVisitsSection tripId={tripId} suggestions={repeatVisitSuggestions} />

      <section id="places" style={sectionCardStyle}>
        <h2 style={sectionTitleStyle}>מקומות בטיול ({tripPlaces.length})</h2>
        <ul style={listStyle}>
          {tripPlaces.map((tp) => (
            <li key={tp.id} style={{ ...itemStyle, display: "flex", justifyContent: "space-between", alignItems: "center", flexWrap: "wrap", gap: "0.5rem" }}>
              <div style={{ minWidth: 0, flex: "1 1 200px" }}>
                <div style={{ fontWeight: 600 }}>{tp.place.name}</div>
                <div style={mutedStyle}>
                  {PLACE_CATEGORY_LABELS[tp.place.category]} · {TRIP_PLACE_STATUS_LABELS[tp.status]}
                </div>
                <OpenNowBadge openingHours={tp.place.openingHours} />
                <EntityDocumentSection tripId={tripId} entityType="place" entityId={tp.place.id} documents={documentsByPlaceId.get(tp.place.id) ?? []} />
              </div>
              <NavigateButtons lat={tp.place.lat} lng={tp.place.lng} address={tp.place.address} />
            </li>
          ))}
          {tripPlaces.length === 0 ? <p style={mutedStyle}>עוד לא הוספת מקומות לטיול הזה.</p> : null}
        </ul>
        <LinkPlaceForm tripId={tripId} availablePlaces={availablePlaces} />
        <Link href={`/map?tripId=${tripId}`} style={{ display: "inline-block", marginTop: "0.5rem", fontSize: "0.8125rem", color: "var(--color-primary)" }}>
          🗺️ חפש והוסף מקום חדש במפה
        </Link>
      </section>

      <section id="bookings" style={sectionCardStyle}>
        <h2 style={sectionTitleStyle}>הזמנות</h2>
        <div style={{ display: "flex", flexDirection: "column", gap: "1rem" }}>
          <BookingGroup id="hotels" title={`מלונות (${hotelStays.length})`}>
            <ul style={listStyle}>
              {hotelStays.map((h) => (
                <li key={h.id} style={{ ...itemStyle, display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                  <div style={{ flex: 1 }}>
                    <div style={{ display: "flex", alignItems: "center", gap: "0.5rem", flexWrap: "wrap" }}>
                      <span style={{ fontWeight: 600 }}>{h.hotelName}</span>
                      <StatusBadge label={LIFECYCLE_STATUS_LABELS[h.status]} tone={LIFECYCLE_STATUS_TONE[h.status]} />
                    </div>
                    <div style={mutedStyle}>
                      {h.checkInDate} — {h.checkOutDate}
                      {h.agreedPrice ? ` · ${h.agreedPrice} ${h.agreedCurrencyCode ?? ""}` : ""}
                      {h.floor ? ` · קומה ${h.floor}` : ""}
                      {h.view ? ` · נוף ${h.view}` : ""}
                      {h.bedType ? ` · ${h.bedType}` : ""}
                      {h.guestsCount ? ` · ${h.guestsCount} אורחים` : ""}
                      {h.smoking ? " · מעשנים" : ""}
                      {h.breakfastHours ? ` · ארוחת בוקר ${h.breakfastHours}` : ""}
                      {h.breakfastPrice ? ` · ${h.breakfastPrice}${breakfastPriceUnitLabel(h.breakfastPriceUnit)}` : ""}
                      {h.earlyCheckIn ? " · צ'ק-אין מוקדם" : ""}
                      {h.lateCheckOut ? " · צ'ק-אאוט מאוחר" : ""}
                      {h.externalBookingId ? ` · הזמנה חיצונית ${h.externalBookingId}` : ""}
                    </div>
                    {h.status === "want_to_book" || h.status === "need_to_book" ? (
                      <HotelPriceLinks hotelName={h.hotelName} address={h.address} checkInDate={h.checkInDate} checkOutDate={h.checkOutDate} />
                    ) : null}
                    {h.checkInTime ? (
                      <LiveTimer label="צ'ק-אין" eventAt={`${h.checkInDate}T${h.checkInTime}:00.000Z`} timezone={h.timezone ?? "UTC"} />
                    ) : null}
                    {h.checkOutTime ? (
                      <LiveTimer label="צ'ק-אאוט" eventAt={`${h.checkOutDate}T${h.checkOutTime}:00.000Z`} timezone={h.timezone ?? "UTC"} />
                    ) : null}
                    <BookingBenefitsSection tripId={tripId} bookingId={h.bookingId} benefits={hotelBenefitsByBookingId.get(h.bookingId) ?? []} />
                    <EntityPhotoGallery
                      tripId={tripId}
                      entityType="hotel_stay"
                      entityId={h.id}
                      documents={documentsByHotelStayId.get(h.id) ?? []}
                      emptyLabel="עוד לא הועלו תמונות מהמלון."
                    />
                    <EntityDocumentSection
                      tripId={tripId}
                      entityType="hotel_stay"
                      entityId={h.id}
                      documents={(documentsByHotelStayId.get(h.id) ?? []).filter((doc) => doc.documentType !== "image")}
                    />
                  </div>
                  <div style={{ display: "flex", alignItems: "center", gap: "0.5rem" }}>
                    <PersonalRatingSelect value={h.personalRating} onRate={setHotelStayPersonalRatingAction.bind(null, tripId, h.id)} />
                    <DeleteHotelStayButton tripId={tripId} hotelStayId={h.id} />
                  </div>
                </li>
              ))}
            </ul>
            {hotelStays.length > 0 ? <ExportCsvButton csv={hotelStaysCsv} fileName={`מלונות-${trip.name}.csv`} label="⬇️ ייצוא מלונות (CSV)" /> : null}
            <HotelStayForm tripId={tripId} preferredCurrencyCodes={preferredCurrencyCodes} />
          </BookingGroup>

          <BookingGroup id="flights" title={`טיסות (${flights.length})`}>
            <ul style={listStyle}>
              {flights.map((f) => (
                <li key={f.id} style={{ ...itemStyle, display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                  <div style={{ flex: 1 }}>
                    <div style={{ display: "flex", alignItems: "center", gap: "0.5rem", flexWrap: "wrap" }}>
                      <span style={{ fontWeight: 600 }}>
                        {FLIGHT_LEG_TYPE_LABELS[f.legType]} · {f.airline} {f.flightNumber ?? ""}
                      </span>
                      <StatusBadge label={LIFECYCLE_STATUS_LABELS[f.status]} tone={LIFECYCLE_STATUS_TONE[f.status]} />
                      <FlightStatusCheck
                        tripId={tripId}
                        flightId={f.id}
                        flightNumber={f.flightNumber}
                        flightDate={f.departureAt.slice(0, 10)}
                        liveStatus={f.liveStatus}
                        liveDelayMinutes={f.liveDelayMinutes}
                        liveStatusCheckedAt={f.liveStatusCheckedAt}
                        isConfigured={isFlightStatusConfigured()}
                      />
                    </div>
                    <div style={mutedStyle}>
                      {f.departureAirport} → {f.arrivalAirport} · {f.departureAt.slice(0, 10)}{" "}
                      {formatTimeWithIsraelReference(f.departureAt, f.departureTimezone)}
                      {f.departureTerminal ? ` · טרמינל יציאה ${f.departureTerminal}` : ""}
                      {f.arrivalTerminal ? ` · טרמינל נחיתה ${f.arrivalTerminal}` : ""}
                      {" · נחיתה "}
                      {formatTimeWithIsraelReference(f.arrivalAt, f.arrivalTimezone)}
                      {f.seat ? ` · מושב ${f.seat}` : ""}
                      {f.baggage ? ` · כבודה ${f.baggage}` : ""}
                      {f.agreedPrice ? ` · ${f.agreedPrice} ${f.agreedCurrencyCode ?? ""}` : ""}
                      {f.confirmationNumber ? ` · מספר אישור ${f.confirmationNumber}` : ""}
                      {f.externalBookingId ? ` · הזמנה חיצונית ${f.externalBookingId}` : ""}
                      {f.cancellationPolicy ? ` · ביטול: ${f.cancellationPolicy}` : ""}
                      {f.phone ? ` · טלפון ${f.phone}` : ""}
                      {f.website ? ` · ${f.website}` : ""}
                    </div>
                    {f.status === "want_to_book" || f.status === "need_to_book" ? (
                      <FlightPriceLinks departureAirport={f.departureAirport} arrivalAirport={f.arrivalAirport} departureDate={f.departureAt.slice(0, 10)} />
                    ) : null}
                    <LiveTimer label={FLIGHT_LEG_TYPE_LABELS[f.legType]} eventAt={f.departureAt} timezone={f.departureTimezone} />
                    <AirportTimingCalculator
                      tripId={tripId}
                      flightId={f.id}
                      departureAt={f.departureAt}
                      timezone={f.departureTimezone}
                      initialLeadMinutes={f.airportArrivalLeadMinutes}
                      initialTravelMinutes={f.travelTimeToAirportMinutes}
                    />
                    <CheckInWindowPicker tripId={tripId} flightId={f.id} departureAt={f.departureAt} timezone={f.departureTimezone} initialWindowHours={f.checkInWindowHours} />
                    <EntityDocumentSection tripId={tripId} entityType="flight" entityId={f.id} documents={documentsByFlightId.get(f.id) ?? []} />
                  </div>
                  <DeleteFlightButton tripId={tripId} flightId={f.id} />
                </li>
              ))}
            </ul>
            {flights.length > 0 ? <ExportCsvButton csv={flightsCsv} fileName={`טיסות-${trip.name}.csv`} label="⬇️ ייצוא טיסות (CSV)" /> : null}
            <FlightForm tripId={tripId} preferredCurrencyCodes={preferredCurrencyCodes} />
          </BookingGroup>

          <BookingGroup id="transport" title={`תחבורה (${transportBookings.length})`}>
            <ul style={listStyle}>
              {transportBookings.map((t) => (
                <li key={t.id} style={{ ...itemStyle, display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                  <div style={{ flex: 1 }}>
                    <div style={{ display: "flex", alignItems: "center", gap: "0.5rem", flexWrap: "wrap" }}>
                      <span style={{ fontWeight: 600 }}>
                        {TRANSPORT_MODE_LABELS[t.mode] ?? t.mode} · {t.pickupText ?? "?"} → {t.dropoffText ?? "?"}
                      </span>
                      <StatusBadge label={LIFECYCLE_STATUS_LABELS[t.status]} tone={LIFECYCLE_STATUS_TONE[t.status]} />
                    </div>
                    <div style={mutedStyle}>
                      {new Date(t.pickupAt).toLocaleString("he-IL")}
                      {t.etaAt ? ` · הגעה משוערת ${new Date(t.etaAt).toLocaleString("he-IL")}` : ""}
                      {t.agreedPrice ? ` · ${t.agreedPrice} ${t.agreedCurrencyCode ?? ""}` : ""}
                      {t.vehicleType ? ` · ${VEHICLE_TYPE_LABELS[t.vehicleType] ?? t.vehicleType}` : ""}
                      {t.tollFees ? ` · אגרות ${t.tollFees}` : ""}
                      {t.parkingFees ? ` · חניה ${t.parkingFees}` : ""}
                      {t.vehicleOnBoard ? ` · על הסיפון: ${t.vehicleOnBoard}` : ""}
                      {t.seat ? ` · מושב ${t.seat}` : ""}
                      {t.phone ? ` · טלפון ${t.phone}` : ""}
                      {t.website ? ` · ${t.website}` : ""}
                    </div>
                    <LiveTimer label={TRANSPORT_MODE_LABELS[t.mode] ?? t.mode} eventAt={t.pickupAt} timezone={t.pickupTimezone} />
                    <SendDriverWhatsAppLink transportBooking={t} linkedFlight={flights.find((f) => f.id === t.linkedFlightId) ?? null} />
                    <EditTransportBookingForm tripId={tripId} transportBooking={t} flights={flights} />
                    <EntityDocumentSection tripId={tripId} entityType="transport_booking" entityId={t.id} documents={documentsByTransportBookingId.get(t.id) ?? []} />
                  </div>
                  <div style={{ display: "flex", alignItems: "center", gap: "0.5rem" }}>
                    <PersonalRatingSelect value={t.personalRating} onRate={setTransportBookingPersonalRatingAction.bind(null, tripId, t.id)} />
                    <DeleteTransportBookingButton tripId={tripId} transportBookingId={t.id} />
                  </div>
                </li>
              ))}
            </ul>
            {transportBookings.length > 0 ? (
              <ExportCsvButton csv={transportBookingsCsv} fileName={`תחבורה-${trip.name}.csv`} label="⬇️ ייצוא תחבורה (CSV)" />
            ) : null}
            <div id="book-transport">
              <TransportBookingForm
                tripId={tripId}
                sourceQuoteId={sourceQuote?.id ?? null}
                preferredCurrencyCodes={preferredCurrencyCodes}
                flights={flights}
                defaultValues={
                  sourceQuote
                    ? {
                        companyName: sourceQuote.provider,
                        vehicleType: sourceQuote.vehicleType ?? undefined,
                        agreedPrice: sourceQuote.price,
                        agreedCurrencyCode: sourceQuote.currencyCode,
                      }
                    : undefined
                }
              />
            </div>
            <div style={{ marginTop: "0.75rem" }}>
              <div style={{ fontWeight: 600, fontSize: "0.875rem", marginBottom: "0.5rem" }}>הצעות מחיר להשוואה</div>
              <TransportQuotesSection tripId={tripId} quotes={transportQuotes} preferredCurrencyCodes={preferredCurrencyCodes} />
            </div>
          </BookingGroup>

          <BookingGroup id="insurance" title={`ביטוח (${insurances.length})`}>
            <ul style={listStyle}>
              {insurances.map((ins) => (
                <li key={ins.id} style={{ ...itemStyle, display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                  <div style={{ flex: 1 }}>
                    <div style={{ display: "flex", alignItems: "center", gap: "0.5rem", flexWrap: "wrap" }}>
                      <span style={{ fontWeight: 600 }}>{ins.company}</span>
                      <StatusBadge label={LIFECYCLE_STATUS_LABELS[ins.status]} tone={LIFECYCLE_STATUS_TONE[ins.status]} />
                    </div>
                    <div style={mutedStyle}>
                      {ins.startDate} — {ins.endDate}
                      {ins.policyNumber ? ` · פוליסה ${ins.policyNumber}` : ""}
                      {ins.emergencyPhone ? ` · חירום: ${ins.emergencyPhone}` : ""}
                      {ins.extensions ? ` · הרחבות: ${ins.extensions}` : ""}
                      {ins.coverageNotes ? ` · כיסוי: ${ins.coverageNotes}` : ""}
                      {ins.deductible != null ? ` · השתתפות עצמית: ${ins.deductible}` : ""}
                    </div>
                    <div style={{ ...mutedStyle, marginTop: "0.25rem" }}>⏱ {formatDaysRemaining(daysUntil(ins.endDate))}</div>
                    <EntityDocumentSection tripId={tripId} entityType="insurance" entityId={ins.id} documents={documentsByInsuranceId.get(ins.id) ?? []} />
                  </div>
                  <DeleteInsuranceButton tripId={tripId} insuranceId={ins.id} />
                </li>
              ))}
            </ul>
            {insurances.length > 0 ? <ExportCsvButton csv={insurancesCsv} fileName={`ביטוחים-${trip.name}.csv`} label="⬇️ ייצוא ביטוחים (CSV)" /> : null}
            <InsuranceForm tripId={tripId} />
          </BookingGroup>

          <BookingGroup id="activities" title={`אטרקציות וכרטיסים (${activityReservations.length})`}>
            <ul style={listStyle}>
              {activityReservations.map((a) => (
                <li key={a.id} style={{ ...itemStyle, display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                  <div style={{ flex: 1 }}>
                    <div style={{ display: "flex", alignItems: "center", gap: "0.5rem", flexWrap: "wrap" }}>
                      <span style={{ fontWeight: 600 }}>{a.venueName}</span>
                      <StatusBadge label={LIFECYCLE_STATUS_LABELS[a.status]} tone={LIFECYCLE_STATUS_TONE[a.status]} />
                    </div>
                    <div style={mutedStyle}>
                      {a.activityDate}
                      {a.activityTime ? ` · ${a.activityTime}` : ""}
                      {a.ticketType ? ` · ${a.ticketType}` : ""}
                      {a.confirmationDetails ? ` · אישור: ${a.confirmationDetails}` : ""}
                      {a.agreedPrice != null ? ` · ${a.agreedPrice} ${a.agreedCurrencyCode ?? ""}` : ""}
                    </div>
                    <div style={{ ...mutedStyle, marginTop: "0.25rem" }}>⏱ {formatDaysRemaining(daysUntil(a.activityDate))}</div>
                    <EntityDocumentSection
                      tripId={tripId}
                      entityType="activity_reservation"
                      entityId={a.id}
                      documents={documentsByActivityReservationId.get(a.id) ?? []}
                    />
                  </div>
                  <DeleteActivityReservationButton tripId={tripId} activityReservationId={a.id} />
                </li>
              ))}
            </ul>
            {activityReservations.length > 0 ? (
              <ExportCsvButton csv={activityReservationsCsv} fileName={`אטרקציות-${trip.name}.csv`} label="⬇️ ייצוא אטרקציות (CSV)" />
            ) : null}
            <ActivityReservationForm tripId={tripId} preferredCurrencyCodes={preferredCurrencyCodes} />
          </BookingGroup>

          <BookingGroup id="car-rentals" title={`השכרת רכב/אופנוע (${carRentals.length})`}>
            <ul style={listStyle}>
              {carRentals.map((rental) => (
                <li key={rental.id} style={{ ...itemStyle, display: "flex", justifyContent: "space-between", alignItems: "center", flexWrap: "wrap", gap: "0.5rem" }}>
                  <div style={{ minWidth: 0, flex: "1 1 200px" }}>
                    <div style={{ display: "flex", alignItems: "center", gap: "0.5rem", flexWrap: "wrap" }}>
                      <span style={{ fontWeight: 600 }}>
                        {RENTAL_VEHICLE_TYPE_LABELS[rental.vehicleType]} · {rental.companyName}
                      </span>
                      <StatusBadge label={LIFECYCLE_STATUS_LABELS[rental.status]} tone={LIFECYCLE_STATUS_TONE[rental.status]} />
                    </div>
                    <div style={mutedStyle}>
                      איסוף {new Date(rental.pickupAt).toLocaleString("he-IL")}
                      {rental.dropoffAt ? ` · החזרה ${new Date(rental.dropoffAt).toLocaleString("he-IL")}` : ""}
                      {rental.model ? ` · ${rental.model}` : ""}
                      {rental.insuranceIncluded ? " · ביטוח כלול" : ""}
                      {rental.depositAmount !== null ? ` · פיקדון ${rental.depositAmount} ${rental.depositCurrencyCode ?? ""}` : ""}
                      {rental.confirmationNumber ? ` · מספר אישור ${rental.confirmationNumber}` : ""}
                      {rental.phone ? ` · טלפון ${rental.phone}` : ""}
                      {rental.website ? ` · ${rental.website}` : ""}
                    </div>
                    {rental.dropoffAt ? (
                      <LiveTimer label="החזרת רכב" eventAt={rental.dropoffAt} timezone={rental.dropoffTimezone ?? rental.pickupTimezone} />
                    ) : null}
                    <EntityPhotoGallery
                      tripId={tripId}
                      entityType="car_rental"
                      entityId={rental.id}
                      documents={documentsByCarRentalId.get(rental.id) ?? []}
                      emptyLabel="עוד לא הועלו תמונות לפני/אחרי מהרכב."
                    />
                    <EntityDocumentSection
                      tripId={tripId}
                      entityType="car_rental"
                      entityId={rental.id}
                      documents={(documentsByCarRentalId.get(rental.id) ?? []).filter((doc) => doc.documentType !== "image")}
                    />
                  </div>
                  <DeleteCarRentalButton tripId={tripId} carRentalId={rental.id} />
                </li>
              ))}
            </ul>
            {carRentals.length > 0 ? <ExportCsvButton csv={carRentalsCsv} fileName={`השכרות-רכב-${trip.name}.csv`} label="⬇️ ייצוא השכרות (CSV)" /> : null}
            <CarRentalForm tripId={tripId} preferredCurrencyCodes={preferredCurrencyCodes} />
          </BookingGroup>
        </div>
      </section>

      <BudgetSection trip={trip} progress={budgetProgress} categoryLimits={budgetCategoryLimits} spendingPace={spendingPace} />

      <SettleUpSection balances={settleUp.balances} unconvertedCurrencyCodes={settleUp.unconvertedCurrencyCodes} />

      <section id="finances" style={sectionCardStyle}>
        <h2 style={sectionTitleStyle}>כספים</h2>
        <div style={{ display: "flex", flexDirection: "column", gap: "1rem" }}>
          <BookingGroup id="exchange-rates" title="💱 שערי חליפין חיים">
            <Suspense fallback={<p style={{ color: "var(--color-text-muted)", fontSize: "0.8125rem", margin: 0 }}>טוען שערי חליפין…</p>}>
              <ExchangeRatesCard currencyCodes={preferredCurrencyCodes} />
            </Suspense>
          </BookingGroup>

          <BookingGroup id="wallet" title="ארנק">
            {wallets.length > 1 ? <WalletSpendChart wallets={wallets} expenses={expenses} /> : null}
            <div style={{ display: "flex", gap: "0.5rem", flexWrap: "wrap" }}>
              {wallets.map((wallet) => {
                const rate = rateByCurrency.get(wallet.currencyCode);
                const walletTxHistory = walletTransactions.filter((tx) => tx.walletId === wallet.id).slice(0, 5);
                const spentInCurrency = expenses.filter((e) => e.currencyCode === wallet.currencyCode).reduce((sum, e) => sum + e.amount, 0);
                const percentUsed = wallet.initialAmount > 0 ? (spentInCurrency / wallet.initialAmount) * 100 : 0;
                return (
                  <div key={wallet.id} style={{ ...itemStyle, minWidth: "200px" }}>
                    <div style={{ fontWeight: 600 }}>
                      {wallet.currentBalance} {wallet.currencyCode}
                    </div>
                    <div style={mutedStyle}>
                      התחלתי עם {wallet.openingBalance} {wallet.currencyCode}
                      {wallet.initialAmount !== wallet.openingBalance ? ` · הופקד בסה"כ ${wallet.initialAmount}` : ""}
                    </div>
                    {wallet.initialAmount > 0 ? (
                      <div style={{ display: "flex", alignItems: "center", gap: "0.5rem", marginTop: "0.375rem" }}>
                        <ProgressRing percent={percentUsed} size={32} strokeWidth={4} />
                        <div style={mutedStyle}>
                          הוצאתי {spentInCurrency} מתוך {wallet.initialAmount} {wallet.currencyCode}
                          <br />
                          נותר {wallet.currentBalance} {wallet.currencyCode}
                        </div>
                      </div>
                    ) : null}
                    {rate ? (
                      <div style={{ ...mutedStyle, marginTop: "0.25rem" }}>
                        שער יציג: 1 {wallet.currencyCode} = {formatMoney(rate.rateToILS, "ILS")}
                        <br />
                        שווי מוערך: {formatMoney(wallet.currentBalance * rate.rateToILS, "ILS")}
                        <br />
                        מקור: {rate.source === "boi" ? "בנק ישראל" : "ECB (Frankfurter)"} · {rate.asOf}
                      </div>
                    ) : (
                      <div style={{ ...mutedStyle, marginTop: "0.25rem" }}>אין שער זמין למטבע זה כרגע.</div>
                    )}
                    {walletTxHistory.length > 0 ? (
                      <details style={{ marginTop: "0.375rem" }}>
                        <summary style={{ fontSize: "0.75rem", color: "var(--color-primary)", cursor: "pointer" }}>
                          תנועות אחרונות ({walletTxHistory.length})
                        </summary>
                        <div style={{ marginTop: "0.25rem", display: "flex", flexDirection: "column", gap: "0.25rem" }}>
                          {walletTxHistory.map((tx) => (
                            <div key={tx.id}>
                              <div style={{ fontSize: "0.75rem", color: "var(--color-text-muted)" }}>
                                {tx.amount > 0 ? "+" : ""}
                                {tx.amount} · {WALLET_TX_TYPE_LABELS[tx.type] ?? tx.type} ·{" "}
                                {new Date(tx.txAt).toLocaleDateString("he-IL")}
                              </div>
                              {tx.type === "top_up" ? (
                                <CorrectWalletTopUpForm tripId={tripId} transactionId={tx.id} amount={tx.amount} />
                              ) : null}
                            </div>
                          ))}
                        </div>
                      </details>
                    ) : null}
                    <ReconcileWalletForm tripId={tripId} walletId={wallet.id} currencyCode={wallet.currencyCode} />
                  </div>
                );
              })}
              {wallets.length === 0 ? <p style={mutedStyle}>אין עדיין ארנק לטיול הזה.</p> : null}
            </div>
            <WalletTopUpForm tripId={tripId} preferredCurrencyCodes={preferredCurrencyCodes} />

            {/* המרת-מטבע כאן, בתוך "ארנק" עצמו — לא בסקשן נפרד-ורחוק — לבקשת
                משתמש מפורשת: "בארנק אני אוכל לבצע פעילות המרה ממטבע למטבע".
                זו הפעולה שבפועל מורידה/מוסיפה לארנקים (financeRepository.
                createCurrencyExchange), לא ה"ממיר מטבע מהיר" למטה שהוא רק
                מחשבון בלי שמירה. */}
            {currencyExchanges.length > 0 ? (
              <div>
                <div style={{ fontWeight: 600, fontSize: "0.875rem", marginBottom: "0.375rem" }}>המרות קודמות ({currencyExchanges.length})</div>
                <ul style={listStyle}>
                  {currencyExchanges.map((exchange) => (
                    <li key={exchange.id} style={itemStyle}>
                      <div style={{ fontWeight: 600 }}>
                        {exchange.givenAmount} {exchange.givenCurrencyCode} → {exchange.receivedAmount}{" "}
                        {exchange.receivedCurrencyCode}
                      </div>
                      <div style={mutedStyle}>שער {exchange.actualRate.toFixed(4)}</div>
                      <CorrectCurrencyExchangeForm
                        tripId={tripId}
                        exchangeId={exchange.id}
                        givenAmount={exchange.givenAmount}
                        receivedAmount={exchange.receivedAmount}
                      />
                    </li>
                  ))}
                </ul>
              </div>
            ) : null}
            <CurrencyExchangeForm tripId={tripId} preferredCurrencyCodes={preferredCurrencyCodes} />
          </BookingGroup>

          <BookingGroup id="currency-converter" title="ממיר מטבע מהיר">
            <CurrencyQuickConverter />
          </BookingGroup>

          <BookingGroup id="atm-finder" title="כספומט קרוב">
            <AtmFinderWidget tripId={tripId} preferredCurrencyCodes={preferredCurrencyCodes} />
          </BookingGroup>

          <BookingGroup id="companions" title={`מלווים בטיול (${tripCompanions.length})`}>
            <TripCompanionList tripId={tripId} companions={tripCompanions} />
            <TripCompanionForm tripId={tripId} />
          </BookingGroup>

          <BookingGroup id="companion-polls" title="🗳️ הצבעות בין המלווים">
            <CompanionPollsSection tripId={tripId} polls={companionPolls} companions={tripCompanions} />
          </BookingGroup>

          <BookingGroup id="share-link" title="שיתוף מסלול">
            <ShareLinkPanel tripId={tripId} token={activeShareLink?.token ?? null} />
          </BookingGroup>

          <BookingGroup
            id="expenses"
            title={
              expenseDateFilterActive
                ? `הוצאות (${visibleExpensesWithPayments.length} מתוך ${expenses.length})`
                : `הוצאות (${expenses.length})`
            }
          >
            <form method="get" style={{ display: "flex", gap: "0.5rem", flexWrap: "wrap", alignItems: "center", marginBottom: "0.75rem" }}>
              <label style={{ display: "flex", flexDirection: "column", gap: "0.125rem", fontSize: "0.75rem", color: "var(--color-text-muted)" }}>
                מתאריך
                <DatePicker name="expenseFrom" defaultValue={expenseFrom} />
              </label>
              <label style={{ display: "flex", flexDirection: "column", gap: "0.125rem", fontSize: "0.75rem", color: "var(--color-text-muted)" }}>
                עד תאריך
                <DatePicker name="expenseTo" defaultValue={expenseTo} />
              </label>
              <button type="submit" style={submitFilterButtonStyle}>
                סנן
              </button>
              {expenseDateFilterActive ? (
                <Link href={`/trips/${tripId}#expenses`} style={{ fontSize: "0.8125rem", color: "var(--color-primary)", alignSelf: "flex-end" }}>
                  נקה סינון
                </Link>
              ) : null}
            </form>
            <ul style={listStyle}>
              {visibleExpensesWithPayments.map(({ expense, payments }) => {
                const paid = payments.reduce((sum, p) => sum + p.amount, 0);
                const expenseDocuments = documentsByExpenseId.get(expense.id) ?? [];
                return (
                  <li key={expense.id} style={{ ...itemStyle, display: "flex", justifyContent: "space-between", alignItems: "flex-start" }}>
                    <div style={{ flex: 1 }}>
                    <div style={{ fontWeight: 600 }}>
                      {expense.description ?? getExpenseCategoryLabel(expense.category)}
                    </div>
                    <div style={mutedStyle}>
                      {getExpenseCategoryLabel(expense.category)} · {expense.amount} {expense.currencyCode} ·{" "}
                      {expense.timezone
                        ? formatTimeWithIsraelReference(expense.expenseAt, expense.timezone)
                        : new Date(expense.expenseAt).toLocaleString("he-IL")}
                      {" · שולם "}
                      {paid} מתוך {expense.amount}
                      {expense.category === "tip" && expense.tipRecipient
                        ? ` · ל${expense.tipRecipient}${expense.tipCategory ? ` (${TIP_CATEGORY_LABELS[expense.tipCategory]})` : ""}`
                        : ""}
                      {expense.placeId && placesById.has(expense.placeId) ? ` · ${placesById.get(expense.placeId)?.name}` : ""}
                      {expense.personalRating ? ` · ${"★".repeat(expense.personalRating)}` : ""}
                      {expense.itemName ? ` · ${expense.itemName}${expense.quantity ? ` (x${expense.quantity})` : ""}` : ""}
                    </div>
                    {payments.length > 0 || expenseDocuments.length > 0 ? (
                      <details style={{ marginTop: "0.375rem" }}>
                        <summary style={{ fontSize: "0.75rem", color: "var(--color-primary)", cursor: "pointer" }}>הצג הוכחת תשלום</summary>
                        <div style={{ marginTop: "0.375rem", display: "flex", flexDirection: "column", gap: "0.25rem" }}>
                          {payments.map((p) => (
                            <div key={p.id} style={{ fontSize: "0.75rem", color: "var(--color-text-muted)", display: "flex", alignItems: "center", gap: "0.375rem", flexWrap: "wrap" }}>
                              <span>
                                {formatMoney(p.amount, p.currencyCode)} · {PAYMENT_METHOD_LABELS[p.paymentMethod] ?? p.paymentMethod}
                                {p.cardId ? ` (${paymentCards.find((c) => c.id === p.cardId)?.cardName ?? "כרטיס"})` : ""} ·{" "}
                                {new Date(p.paymentAt).toLocaleDateString("he-IL")}
                              </span>
                              <EntityDocumentSection tripId={tripId} entityType="payment" entityId={p.id} documents={documentsByPaymentId.get(p.id) ?? []} />
                              <DeletePaymentButton tripId={tripId} paymentId={p.id} />
                            </div>
                          ))}
                          {expenseDocuments.length > 0 ? (
                            <div style={{ display: "flex", flexWrap: "wrap", gap: "0.5rem" }}>
                              {expenseDocuments.map((doc) => (
                                <div key={doc.id} style={{ display: "flex", alignItems: "center", gap: "0.375rem" }}>
                                  <a href={doc.fileUrl} target="_blank" rel="noopener noreferrer" style={{ fontSize: "0.75rem" }}>
                                    📎 {DOCUMENT_TYPE_LABELS[doc.documentType] ?? doc.documentType}
                                    {doc.fileName ? `: ${doc.fileName}` : ""}
                                  </a>
                                  <DeleteDocumentButton tripId={tripId} documentId={doc.id} />
                                </div>
                              ))}
                            </div>
                          ) : (
                            <p style={{ margin: 0, fontSize: "0.75rem", color: "var(--color-text-muted)" }}>אין עדיין קבלה/מסמך מצורף.</p>
                          )}
                        </div>
                      </details>
                    ) : null}
                    </div>
                    <DeleteExpenseButton tripId={tripId} expenseId={expense.id} />
                  </li>
                );
              })}
              {visibleExpensesWithPayments.length === 0 ? (
                <p style={mutedStyle}>
                  {expenseDateFilterActive ? "אין הוצאות בטווח התאריכים הזה." : "אין עדיין הוצאות בטיול הזה."}
                </p>
              ) : null}
            </ul>
            <ExpenseCreateForm
              tripId={tripId}
              linkedPlaces={tripPlaces.map((tp) => tp.place)}
              companions={tripCompanions}
              preferredCurrencyCodes={preferredCurrencyCodes}
            />
          </BookingGroup>

          <BookingGroup id="expense-documents" title={`מסמכים על הוצאות (${tripDocuments.filter((d) => d.entityType === "expense").length})`}>
            <DocumentUploadForm tripId={tripId} expenses={expenses} />
          </BookingGroup>

          <BookingGroup id="payments" title="תשלומים">
            <div>
              <div style={{ fontWeight: 600, fontSize: "0.875rem", marginBottom: "0.375rem" }}>סיכום כרטיסי אשראי</div>
              <CreditCardSummary payments={tripPayments} cards={paymentCards} />
            </div>
            <PaymentCreateForm tripId={tripId} expenses={expenses} cards={paymentCards} preferredCurrencyCodes={preferredCurrencyCodes} />
          </BookingGroup>

          <TipsReportGroup expenses={expenses} />

          <BookingGroup id="refunds" title={`החזרים (${refunds.length})`}>
            <ul style={listStyle}>
              {refunds.map((refund) => (
                <li key={refund.id} style={itemStyle}>
                  <div style={{ display: "flex", alignItems: "center", gap: "0.5rem", flexWrap: "wrap" }}>
                    <span style={{ fontWeight: 600 }}>
                      +{refund.amount} {refund.currencyCode}
                    </span>
                    <StatusBadge label={refund.isReceived ? "התקבל" : "טרם התקבל"} tone={refund.isReceived ? "success" : "warning"} />
                  </div>
                  <div style={mutedStyle}>
                    {refund.reason ?? "החזר"}
                    {refund.isReceived
                      ? ` · התקבל: ${new Date(refund.refundAt).toLocaleDateString("he-IL")}`
                      : ` · צפוי: ${new Date(refund.refundAt).toLocaleDateString("he-IL")}`}
                  </div>
                  {!refund.isReceived ? <MarkRefundReceivedForm tripId={tripId} refundId={refund.id} /> : null}
                </li>
              ))}
            </ul>
            <RefundForm tripId={tripId} expenses={expenses} preferredCurrencyCodes={preferredCurrencyCodes} />
          </BookingGroup>

          <BookingGroup id="deposits" title={`פיקדונות (${deposits.length})`}>
            <ul style={listStyle}>
              {deposits.map((deposit) => (
                <li key={deposit.id} style={itemStyle}>
                  <div style={{ display: "flex", alignItems: "center", gap: "0.5rem", flexWrap: "wrap" }}>
                    <span style={{ fontWeight: 600 }}>
                      {deposit.amount} {deposit.currencyCode}
                      {deposit.paidTo ? ` · ${deposit.paidTo}` : ""}
                    </span>
                    <StatusBadge label={deposit.isReturned ? "הוחזר" : "טרם הוחזר"} tone={deposit.isReturned ? "success" : "warning"} />
                  </div>
                  <div style={mutedStyle}>
                    {deposit.reason ?? "פיקדון"}
                    {deposit.expectedReturnDate ? ` · החזר צפוי: ${deposit.expectedReturnDate}` : ""}
                    {deposit.isReturned ? ` · הוחזר: ${deposit.returnedAmount} ${deposit.currencyCode} (${deposit.returnedDate})` : ""}
                  </div>
                  {!deposit.isReturned ? (
                    <MarkDepositReturnedForm tripId={tripId} depositId={deposit.id} defaultAmount={deposit.amount} />
                  ) : null}
                </li>
              ))}
              {deposits.length === 0 ? <p style={mutedStyle}>אין עדיין פיקדונות רשומים.</p> : null}
            </ul>
            <DepositCreateForm tripId={tripId} preferredCurrencyCodes={preferredCurrencyCodes} />
          </BookingGroup>

          <BookingGroup id="wallet-tx-history" title={`היסטוריית תנועות ארנק (${walletTransactions.length})`}>
            <ul style={listStyle}>
              {walletTransactions.map((tx) => (
                <li key={tx.id} style={itemStyle}>
                  <div style={{ fontWeight: 600 }}>
                    {tx.amount > 0 ? "+" : ""}
                    {tx.amount} · {WALLET_TX_TYPE_LABELS[tx.type] ?? tx.type}
                  </div>
                  <div style={mutedStyle}>
                    {new Date(tx.txAt).toLocaleString("he-IL")}
                    {tx.notes ? ` · ${tx.notes}` : ""}
                  </div>
                </li>
              ))}
              {walletTransactions.length === 0 ? <p style={mutedStyle}>אין עדיין תנועות ארנק.</p> : null}
            </ul>
          </BookingGroup>
        </div>
      </section>

      <section id="document-center" style={sectionCardStyle}>
        <h2 style={sectionTitleStyle}>מרכז מסמכים ({filteredDocuments.length} מתוך {tripDocuments.length})</h2>
        <form method="GET" style={{ display: "flex", gap: "0.5rem", flexWrap: "wrap", marginBottom: "0.75rem" }}>
          <Select
            name="docEntityType"
            defaultValue={docEntityTypeFilter ?? ""}
            style={inputStyleForFilters}
            placeholder="כל הסוגים"
            options={Object.entries(DOCUMENT_ENTITY_TYPE_LABELS).map(([value, label]) => ({ value, label }))}
          />
          <Select
            name="docType"
            defaultValue={docTypeFilter ?? ""}
            style={inputStyleForFilters}
            placeholder="כל סוגי המסמך"
            options={Object.entries(DOCUMENT_TYPE_LABELS).map(([value, label]) => ({ value, label }))}
          />
          <DatePicker name="docFrom" defaultValue={docFrom} />
          <DatePicker name="docTo" defaultValue={docTo} />
          <button type="submit" style={submitFilterButtonStyle}>
            סנן
          </button>
          {docTypeFilter || docEntityTypeFilter || docFrom || docTo ? (
            <Link href={`/trips/${tripId}#document-center`} style={{ alignSelf: "center", fontSize: "0.8125rem", color: "var(--color-primary)" }}>
              נקה סינון
            </Link>
          ) : null}
        </form>
        <ul style={listStyle}>
          {filteredDocuments.map((doc) => (
            <li key={doc.id} style={{ ...itemStyle, display: "flex", justifyContent: "space-between", alignItems: "center" }}>
              <div>
                <a href={doc.fileUrl} target="_blank" rel="noopener noreferrer" style={{ fontWeight: 600 }}>
                  📎 {DOCUMENT_TYPE_LABELS[doc.documentType] ?? doc.documentType}
                  {doc.fileName ? `: ${doc.fileName}` : ""}
                </a>
                <div style={mutedStyle}>
                  {DOCUMENT_ENTITY_TYPE_LABELS[doc.entityType] ?? doc.entityType} · הועלה{" "}
                  {new Date(doc.uploadedAt).toLocaleDateString("he-IL")}
                  {doc.notes ? ` · ${doc.notes}` : ""}
                </div>
                <DocumentOcrPanel
                  tripId={tripId}
                  documentId={doc.id}
                  ocrStatus={doc.ocrStatus}
                  fields={extractedFieldsByDocumentId.get(doc.id) ?? []}
                />
              </div>
              <DeleteDocumentButton tripId={tripId} documentId={doc.id} />
            </li>
          ))}
          {filteredDocuments.length === 0 ? <p style={mutedStyle}>אין מסמכים התואמים לסינון.</p> : null}
        </ul>
      </section>

      <section id="notification-prefs" style={sectionCardStyle}>
        <h2 style={sectionTitleStyle}>התראות</h2>
        <NotificationPreferencesSection tripId={tripId} preferences={notificationPreferences} />
      </section>

      <section id="audit-log" style={sectionCardStyle}>
        <h2 style={sectionTitleStyle}>יומן שינויים ({auditLogEntries.length})</h2>
        <p style={{ ...mutedStyle, marginTop: 0 }}>
          מכסה כרגע רק שינויי שדות בטיול ושינויי סטטוס בתכנון עתידי — לא כל פעולה באפליקציה.
        </p>
        <ul style={listStyle}>
          {auditLogEntries.map((entry) => (
            <li key={entry.id} style={itemStyle}>
              <div style={{ fontWeight: 600 }}>
                {AUDIT_ENTITY_TYPE_LABELS[entry.entityType] ?? entry.entityType} · {AUDIT_FIELD_LABELS[entry.fieldName] ?? entry.fieldName} ·{" "}
                {AUDIT_ACTION_LABELS[entry.action]}
              </div>
              <div style={mutedStyle}>
                {entry.oldValue ?? "—"} → {entry.newValue ?? "—"} · {new Date(entry.changedAt).toLocaleString("he-IL")}
              </div>
            </li>
          ))}
          {auditLogEntries.length === 0 ? <p style={mutedStyle}>אין עדיין שינויים רשומים.</p> : null}
        </ul>
      </section>

      {!trip.deletedAt ? (
        <section style={{ display: "flex", gap: "0.75rem", alignItems: "center" }}>
          <Link
            href={`/trips/${trip.id}/duplicate`}
            style={{
              padding: "0.5rem 1rem",
              borderRadius: "var(--radius-full)",
              border: "1px solid var(--color-border)",
              background: "var(--color-surface)",
              color: "var(--color-text-primary)",
              textDecoration: "none",
              fontSize: "0.875rem",
              fontWeight: 600,
            }}
          >
            📋 שכפל טיול
          </Link>
          <DeleteTripButton tripId={trip.id} />
        </section>
      ) : null}
        </div>
      </div>
    </div>
  );
}

function TipsReportGroup({ expenses }: { expenses: Expense[] }) {
  const tips = expenses.filter((e) => e.category === "tip");
  const total = tips.reduce((sum, t) => sum + t.amount, 0);
  const byCategory = new Map<string, number>();
  for (const tip of tips) {
    const key = tip.tipCategory ? TIP_CATEGORY_LABELS[tip.tipCategory] : "לא צוין";
    byCategory.set(key, (byCategory.get(key) ?? 0) + tip.amount);
  }

  return (
    <BookingGroup id="tips" title={`דוח טיפים (${tips.length})`}>
      {tips.length === 0 ? (
        <p style={mutedStyle}>אין עדיין טיפים רשומים בטיול הזה.</p>
      ) : (
        <>
          <p style={{ fontWeight: 600, fontSize: "1.125rem", margin: 0 }}>סה״כ: {total}</p>
          <ul style={listStyle}>
            {Array.from(byCategory.entries()).map(([label, amount]) => (
              <li key={label} style={itemStyle}>
                {label}: {amount}
              </li>
            ))}
          </ul>
        </>
      )}
    </BookingGroup>
  );
}

function BookingGroup({ id, title, children }: { id?: string; title: string; children: React.ReactNode }) {
  return (
    <details
      id={id}
      // name משותף → "אקורדיון בלעדי" טבעי של הדפדפן: פתיחת סקשן אחד סוגרת
      // אוטומטית את כל השאר (נתמך בכל דפדפן מודרני, בלי JS משלנו) — בקשת
      // משתמש מפורשת: "כל מה שאני בוחר צריך להראות אך ורק את אותו נושא
      // שפתחתי", אחרי שהבחין שסקשנים קודמים שנפתחו (למשל דרך OpenDetailsFromHash)
      // נשארו פתוחים כשנפתח סקשן חדש, והצטברו אחד מעל השני.
      name="trip-section"
      className="ui-card-interactive"
      style={{
        border: "1px solid var(--color-border)",
        borderRadius: "var(--radius-lg)",
        padding: "var(--space-4)",
        background: "var(--color-glass)",
        backdropFilter: "blur(12px)",
        WebkitBackdropFilter: "blur(12px)",
        boxShadow: "var(--shadow-sm)",
      }}
    >
      <summary style={{ cursor: "pointer", font: "var(--text-card-title)" }}>{title}</summary>
      <div style={{ marginTop: "var(--space-3)", display: "flex", flexDirection: "column", gap: "var(--space-4)" }}>{children}</div>
    </details>
  );
}

const listStyle: React.CSSProperties = { listStyle: "none", padding: 0, display: "flex", flexDirection: "column", gap: "0.5rem" };
const itemStyle: React.CSSProperties = {
  padding: "var(--space-3)",
  borderRadius: "var(--radius-md)",
  background: "var(--color-surface-elevated)",
  border: "1px solid var(--color-border)",
};
const mutedStyle: React.CSSProperties = { color: "var(--color-text-muted)", font: "var(--text-caption)" };
const sectionCardStyle: React.CSSProperties = {
  background: "var(--color-glass)",
  backdropFilter: "blur(12px)",
  WebkitBackdropFilter: "blur(12px)",
  border: "1px solid var(--color-border)",
  borderRadius: "var(--radius-lg)",
  boxShadow: "var(--shadow-md)",
  padding: "var(--space-5)",
};
const sectionTitleStyle: React.CSSProperties = { font: "var(--text-h3)", marginTop: 0 };
const headerLinkStyle: React.CSSProperties = {
  display: "inline-flex",
  alignItems: "center",
  gap: "0.375rem",
  padding: "0.5rem 0.875rem",
  borderRadius: "var(--radius-full)",
  border: "1px solid var(--color-border)",
  background: "var(--color-surface)",
  color: "var(--color-text-primary)",
  textDecoration: "none",
  font: "var(--text-caption)",
  fontWeight: 600,
};
const inputStyleForFilters: React.CSSProperties = {
  padding: "0.5rem",
  borderRadius: "var(--radius-md)",
  border: "1px solid var(--color-border)",
  background: "var(--color-surface-elevated)",
  color: "var(--color-text-primary)",
};
const submitFilterButtonStyle: React.CSSProperties = {
  padding: "0.5rem 1rem",
  borderRadius: "var(--radius-full)",
  border: "1px solid var(--color-border)",
  background: "var(--color-surface)",
  color: "var(--color-text-primary)",
  cursor: "pointer",
};
