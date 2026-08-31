import { describe, expect, it } from "vitest";
import { detectGaps } from "./gap-detection";
import type { CarRental, Deposit, Flight, HotelStay, Insurance, PlannedActivity, Refund, TransportBooking, Wallet } from "@travel-app/shared-types";

function makeWallet(overrides: Partial<Wallet> = {}): Wallet {
  return { id: "wallet-1", tripId: "trip-1", currencyCode: "THB", openingBalance: 1000, initialAmount: 1000, currentBalance: 1000, ...overrides };
}

function makeDeposit(overrides: Partial<Deposit> = {}): Deposit {
  return {
    id: "deposit-1",
    tripId: "trip-1",
    bookingId: null,
    amount: 500,
    currencyCode: "THB",
    paidTo: "בעל הדירה",
    reason: null,
    expectedReturnDate: null,
    isReturned: false,
    returnedAmount: null,
    returnedDate: null,
    deletedAt: null,
    createdAt: "2026-01-01T00:00:00.000Z",
    ...overrides,
  };
}

function makeRefund(overrides: Partial<Refund> = {}): Refund {
  return {
    id: "refund-1",
    tripId: "trip-1",
    sourceExpenseId: "expense-1",
    sourcePaymentId: null,
    amount: 300,
    currencyCode: "THB",
    reason: null,
    refundAt: "2026-05-01T00:00:00.000Z",
    isReceived: false,
    notes: null,
    ...overrides,
  };
}

const now = new Date("2026-06-01T00:00:00.000Z");

function makeHotelStay(overrides: Partial<HotelStay> = {}): HotelStay {
  return {
    id: "hotel-1",
    bookingId: "booking-1",
    tripId: "trip-1",
    placeId: null,
    hotelName: "מלון לדוגמה",
    address: null,
    lat: null,
    lng: null,
    checkInDate: "2026-06-01",
    checkOutDate: "2026-06-03",
    nights: 2,
    ...overrides,
  } as HotelStay;
}

function makePlannedActivity(overrides: Partial<PlannedActivity> = {}): PlannedActivity {
  return {
    id: "activity-1",
    tripId: "trip-1",
    placeId: null,
    bookingId: null,
    name: "פעילות לדוגמה",
    activityType: null,
    plannedAt: null,
    plannedTimezone: null,
    estimatedDurationMinutes: null,
    estimatedPrice: null,
    estimatedCurrencyCode: null,
    notes: null,
    status: "want_to_book",
    personalRating: null,
    deletedAt: null,
    createdAt: "2026-01-01T00:00:00.000Z",
    updatedAt: "2026-01-01T00:00:00.000Z",
    ...overrides,
  };
}

function makeFlight(overrides: Partial<Flight> = {}): Flight {
  return {
    id: "flight-1",
    bookingId: "booking-2",
    tripId: "trip-1",
    airline: "El Al",
    flightNumber: "LY001",
    departureAirport: "TLV",
    arrivalAirport: "BKK",
    departureAt: "2026-06-01T10:00:00.000Z",
    arrivalAt: "2026-06-01T20:00:00.000Z",
    ...overrides,
  } as Flight;
}

function makeCarRental(overrides: Partial<CarRental> = {}): CarRental {
  return {
    id: "car-rental-1",
    bookingId: "booking-4",
    tripId: "trip-1",
    companyName: "Hertz",
    pickupAt: "2026-06-02T08:00:00.000Z",
    ...overrides,
  } as CarRental;
}

function makeTransportBooking(overrides: Partial<TransportBooking> = {}): TransportBooking {
  return {
    id: "transport-1",
    bookingId: "booking-3",
    tripId: "trip-1",
    mode: "taxi",
    pickupText: "מלון",
    dropoffText: "שדה תעופה",
    pickupAt: "2026-06-01T06:00:00.000Z",
    ...overrides,
  } as TransportBooking;
}

describe("detectGaps", () => {
  it("flags a night with no hotel covering it", () => {
    const gaps = detectGaps({
      now,
      dayDates: ["2026-06-01", "2026-06-02", "2026-06-03"],
      hotelStays: [makeHotelStay({ checkInDate: "2026-06-01", checkOutDate: "2026-06-02" })],
      flights: [],
      transportBookings: [],
      insurances: [],
      plannedActivities: [],
    });

    expect(gaps.some((g) => g.id === "no-hotel-2026-06-02")).toBe(true);
  });

  it("does not flag the last day of the trip as a missing night", () => {
    const gaps = detectGaps({
      now,
      dayDates: ["2026-06-01", "2026-06-02"],
      hotelStays: [makeHotelStay({ checkInDate: "2026-06-01", checkOutDate: "2026-06-02" })],
      flights: [],
      transportBookings: [],
      insurances: [],
      plannedActivities: [],
    });

    expect(gaps.some((g) => g.id.startsWith("no-hotel"))).toBe(false);
  });

  it("flags two overlapping hotel stays", () => {
    const gaps = detectGaps({
      now,
      dayDates: ["2026-06-01", "2026-06-02", "2026-06-03"],
      hotelStays: [
        makeHotelStay({ id: "a", checkInDate: "2026-06-01", checkOutDate: "2026-06-03" }),
        makeHotelStay({ id: "b", checkInDate: "2026-06-02", checkOutDate: "2026-06-04" }),
      ],
      flights: [],
      transportBookings: [],
      insurances: [],
      plannedActivities: [],
    });

    expect(gaps.some((g) => g.title === "חפיפה בין שני מלונות")).toBe(true);
  });

  it("does not flag two back-to-back (non-overlapping) hotel stays", () => {
    const gaps = detectGaps({
      now,
      dayDates: ["2026-06-01", "2026-06-02", "2026-06-03"],
      hotelStays: [
        makeHotelStay({ id: "a", checkInDate: "2026-06-01", checkOutDate: "2026-06-02" }),
        makeHotelStay({ id: "b", checkInDate: "2026-06-02", checkOutDate: "2026-06-03" }),
      ],
      flights: [],
      transportBookings: [],
      insurances: [],
      plannedActivities: [],
    });

    expect(gaps.some((g) => g.title === "חפיפה בין שני מלונות")).toBe(false);
  });

  it("flags a planned activity marked need_to_book", () => {
    const gaps = detectGaps({
      now,
      dayDates: [],
      hotelStays: [],
      flights: [],
      transportBookings: [],
      insurances: [],
      plannedActivities: [makePlannedActivity({ status: "need_to_book" })],
    });

    expect(gaps.some((g) => g.title === "תכנית שצריך להזמין")).toBe(true);
  });

  it("flags an overdue planned activity without a terminal status", () => {
    const gaps = detectGaps({
      now,
      dayDates: [],
      hotelStays: [],
      flights: [],
      transportBookings: [],
      insurances: [],
      plannedActivities: [makePlannedActivity({ plannedAt: "2026-01-01T00:00:00.000Z", status: "planned" })],
    });

    expect(gaps.some((g) => g.title === "תכנית עם תאריך שעבר")).toBe(true);
  });

  it("does not flag an overdue activity already marked done", () => {
    const gaps = detectGaps({
      now,
      dayDates: [],
      hotelStays: [],
      flights: [],
      transportBookings: [],
      insurances: [],
      plannedActivities: [makePlannedActivity({ plannedAt: "2026-01-01T00:00:00.000Z", status: "done" })],
    });

    expect(gaps.some((g) => g.title === "תכנית עם תאריך שעבר")).toBe(false);
  });

  it("flags a trip with zero insurance entries", () => {
    const gaps = detectGaps({
      now,
      dayDates: [],
      hotelStays: [],
      flights: [],
      transportBookings: [],
      insurances: [],
      plannedActivities: [],
    });

    expect(gaps.some((g) => g.id === "no-insurance")).toBe(true);
  });

  it("does not flag missing insurance when at least one is registered", () => {
    const gaps = detectGaps({
      now,
      dayDates: [],
      hotelStays: [],
      flights: [],
      transportBookings: [],
      insurances: [{} as Insurance],
      plannedActivities: [],
    });

    expect(gaps.some((g) => g.id === "no-insurance")).toBe(false);
  });

  it("flags a flight with no transport booking on the same day", () => {
    const gaps = detectGaps({
      now,
      dayDates: [],
      hotelStays: [],
      flights: [makeFlight({ departureAt: "2026-06-01T10:00:00.000Z" })],
      transportBookings: [],
      insurances: [],
      plannedActivities: [],
    });

    expect(gaps.some((g) => g.title === "טיסה בלי הסעה רשומה")).toBe(true);
  });

  it("does not flag a flight when a transport booking exists that same day", () => {
    const gaps = detectGaps({
      now,
      dayDates: [],
      hotelStays: [],
      flights: [makeFlight({ departureAt: "2026-06-01T10:00:00.000Z" })],
      transportBookings: [makeTransportBooking({ pickupAt: "2026-06-01T06:00:00.000Z" })],
      insurances: [],
      plannedActivities: [],
    });

    expect(gaps.some((g) => g.title === "טיסה בלי הסעה רשומה")).toBe(false);
  });

  it("returns an empty array when everything is covered", () => {
    const gaps = detectGaps({
      now,
      dayDates: ["2026-06-01"],
      hotelStays: [makeHotelStay({ checkInDate: "2026-06-01", checkOutDate: "2026-06-02" })],
      flights: [],
      transportBookings: [],
      insurances: [{} as Insurance],
      plannedActivities: [],
    });

    expect(gaps).toEqual([]);
  });

  it("flags a wallet below 10% of its opening balance", () => {
    const gaps = detectGaps({
      now,
      dayDates: [],
      hotelStays: [],
      flights: [],
      transportBookings: [],
      insurances: [],
      plannedActivities: [],
      wallets: [makeWallet({ initialAmount: 1000, currentBalance: 50 })],
    });

    expect(gaps.some((g) => g.title === "יתרת מזומן נמוכה")).toBe(true);
  });

  it("does not flag a wallet with plenty of balance left", () => {
    const gaps = detectGaps({
      now,
      dayDates: [],
      hotelStays: [],
      flights: [],
      transportBookings: [],
      insurances: [],
      plannedActivities: [],
      wallets: [makeWallet({ initialAmount: 1000, currentBalance: 500 })],
    });

    expect(gaps.some((g) => g.title === "יתרת מזומן נמוכה")).toBe(false);
  });

  it("flags a deposit past its expected return date that hasn't been marked returned", () => {
    const gaps = detectGaps({
      now,
      dayDates: [],
      hotelStays: [],
      flights: [],
      transportBookings: [],
      insurances: [],
      plannedActivities: [],
      deposits: [makeDeposit({ expectedReturnDate: "2026-05-01", isReturned: false })],
    });

    expect(gaps.some((g) => g.title === "פיקדון שצריך לקבל בחזרה")).toBe(true);
  });

  it("does not flag a deposit already marked returned", () => {
    const gaps = detectGaps({
      now,
      dayDates: [],
      hotelStays: [],
      flights: [],
      transportBookings: [],
      insurances: [],
      plannedActivities: [],
      deposits: [makeDeposit({ expectedReturnDate: "2026-05-01", isReturned: true })],
    });

    expect(gaps.some((g) => g.title === "פיקדון שצריך לקבל בחזרה")).toBe(false);
  });

  it("flags a pending refund whose expected date has passed", () => {
    const gaps = detectGaps({
      now,
      dayDates: [],
      hotelStays: [],
      flights: [],
      transportBookings: [],
      insurances: [],
      plannedActivities: [],
      refunds: [makeRefund({ refundAt: "2026-05-01T00:00:00.000Z", isReceived: false })],
    });

    expect(gaps.some((g) => g.title === "החזר שצריך לקבל")).toBe(true);
  });

  it("does not flag a refund already marked received", () => {
    const gaps = detectGaps({
      now,
      dayDates: [],
      hotelStays: [],
      flights: [],
      transportBookings: [],
      insurances: [],
      plannedActivities: [],
      refunds: [makeRefund({ refundAt: "2026-05-01T00:00:00.000Z", isReceived: true })],
    });

    expect(gaps.some((g) => g.title === "החזר שצריך לקבל")).toBe(false);
  });

  it("flags a booked hotel with no attached document", () => {
    const gaps = detectGaps({
      now,
      dayDates: [],
      hotelStays: [makeHotelStay({ id: "hotel-x", status: "booked" })],
      flights: [],
      transportBookings: [],
      insurances: [],
      plannedActivities: [],
      documentedEntityKeys: new Set(),
    });

    expect(gaps.some((g) => g.title === "מסמך חסר")).toBe(true);
  });

  it("does not flag a hotel that already has a document attached", () => {
    const gaps = detectGaps({
      now,
      dayDates: [],
      hotelStays: [makeHotelStay({ id: "hotel-x", status: "booked" })],
      flights: [],
      transportBookings: [],
      insurances: [],
      plannedActivities: [],
      documentedEntityKeys: new Set(["hotel_stay:hotel-x"]),
    });

    expect(gaps.some((g) => g.title === "מסמך חסר")).toBe(false);
  });

  it("does not flag documents when the entity key set is not provided at all", () => {
    const gaps = detectGaps({
      now,
      dayDates: [],
      hotelStays: [makeHotelStay({ id: "hotel-x", status: "booked" })],
      flights: [],
      transportBookings: [],
      insurances: [],
      plannedActivities: [],
    });

    expect(gaps.some((g) => g.title === "מסמך חסר")).toBe(false);
  });

  it("flags exceeding the total trip budget", () => {
    const gaps = detectGaps({
      now,
      dayDates: [],
      hotelStays: [],
      flights: [],
      transportBookings: [],
      insurances: [],
      plannedActivities: [],
      budgetProgress: { totalBudgetAmount: 1000, dailyBudgetAmount: null, totalSpentAmount: 1200, categories: [], unconvertedCurrencyCodes: [] },
    });

    expect(gaps.some((g) => g.title === "חריגה מהתקציב הכולל")).toBe(true);
  });

  it("flags approaching (90%+) the total trip budget without exceeding it", () => {
    const gaps = detectGaps({
      now,
      dayDates: [],
      hotelStays: [],
      flights: [],
      transportBookings: [],
      insurances: [],
      plannedActivities: [],
      budgetProgress: { totalBudgetAmount: 1000, dailyBudgetAmount: null, totalSpentAmount: 950, categories: [], unconvertedCurrencyCodes: [] },
    });

    expect(gaps.some((g) => g.title === "מתקרב לתקציב הכולל")).toBe(true);
    expect(gaps.some((g) => g.title === "חריגה מהתקציב הכולל")).toBe(false);
  });

  it("does not flag a total budget well under the near-threshold", () => {
    const gaps = detectGaps({
      now,
      dayDates: [],
      hotelStays: [],
      flights: [],
      transportBookings: [],
      insurances: [],
      plannedActivities: [],
      budgetProgress: { totalBudgetAmount: 1000, dailyBudgetAmount: null, totalSpentAmount: 400, categories: [], unconvertedCurrencyCodes: [] },
    });

    expect(gaps.some((g) => g.title.includes("תקציב הכולל"))).toBe(false);
  });

  it("flags exceeding a category budget limit", () => {
    const gaps = detectGaps({
      now,
      dayDates: [],
      hotelStays: [],
      flights: [],
      transportBookings: [],
      insurances: [],
      plannedActivities: [],
      budgetProgress: {
        totalBudgetAmount: null,
        dailyBudgetAmount: null,
        totalSpentAmount: 0,
        categories: [{ category: "food", limitAmount: 200, spentAmount: 250 }],
        unconvertedCurrencyCodes: [],
      },
    });

    expect(gaps.some((g) => g.title === "חריגה מתקציב קטגוריה")).toBe(true);
  });

  it("does not flag a category budget that is not yet exceeded", () => {
    const gaps = detectGaps({
      now,
      dayDates: [],
      hotelStays: [],
      flights: [],
      transportBookings: [],
      insurances: [],
      plannedActivities: [],
      budgetProgress: {
        totalBudgetAmount: null,
        dailyBudgetAmount: null,
        totalSpentAmount: 0,
        categories: [{ category: "food", limitAmount: 200, spentAmount: 100 }],
        unconvertedCurrencyCodes: [],
      },
    });

    expect(gaps.some((g) => g.title === "חריגה מתקציב קטגוריה")).toBe(false);
  });

  it("flags a cancelled flight (real liveStatus, not a guess)", () => {
    const gaps = detectGaps({
      now,
      dayDates: [],
      hotelStays: [],
      flights: [makeFlight({ liveStatus: "cancelled", liveDelayMinutes: null })],
      transportBookings: [makeTransportBooking()],
      insurances: [],
      plannedActivities: [],
    });

    expect(gaps.some((g) => g.title === "סטטוס טיסה מדאיג")).toBe(true);
  });

  it("flags a flight delayed by 15 minutes or more", () => {
    const gaps = detectGaps({
      now,
      dayDates: [],
      hotelStays: [],
      flights: [makeFlight({ liveStatus: "active", liveDelayMinutes: 30 })],
      transportBookings: [makeTransportBooking()],
      insurances: [],
      plannedActivities: [],
    });

    expect(gaps.some((g) => g.title === "עיכוב בטיסה")).toBe(true);
  });

  it("does not flag a flight delayed by only a few minutes", () => {
    const gaps = detectGaps({
      now,
      dayDates: [],
      hotelStays: [],
      flights: [makeFlight({ liveStatus: "active", liveDelayMinutes: 5 })],
      transportBookings: [makeTransportBooking()],
      insurances: [],
      plannedActivities: [],
    });

    expect(gaps.some((g) => g.title === "עיכוב בטיסה")).toBe(false);
  });

  it("does not flag a flight whose live status was never checked", () => {
    const gaps = detectGaps({
      now,
      dayDates: [],
      hotelStays: [],
      flights: [makeFlight({ liveStatus: null, liveDelayMinutes: null })],
      transportBookings: [makeTransportBooking()],
      insurances: [],
      plannedActivities: [],
    });

    expect(gaps.some((g) => g.title === "סטטוס טיסה מדאיג" || g.title === "עיכוב בטיסה")).toBe(false);
  });

  it("does not flag a flight that is on schedule with no delay", () => {
    const gaps = detectGaps({
      now,
      dayDates: [],
      hotelStays: [],
      flights: [makeFlight({ liveStatus: "scheduled", liveDelayMinutes: null })],
      transportBookings: [makeTransportBooking()],
      insurances: [],
      plannedActivities: [],
    });

    expect(gaps.some((g) => g.title === "סטטוס טיסה מדאיג" || g.title === "עיכוב בטיסה")).toBe(false);
  });

  it("flags a passport expiring within 6 months of the trip's end date", () => {
    const gaps = detectGaps({
      now,
      dayDates: [],
      hotelStays: [],
      flights: [],
      transportBookings: [],
      insurances: [],
      plannedActivities: [],
      trip: { endDate: "2026-06-10", passportExpiryDate: "2026-08-01", internationalDrivingPermitExpiryDate: null, israeliDrivingLicenseExpiryDate: null, visaRequirementsChecked: true },
    });

    expect(gaps.some((g) => g.title === "תוקף הדרכון קרוב לפוג")).toBe(true);
  });

  it("does not flag a passport valid well beyond 6 months after the trip", () => {
    const gaps = detectGaps({
      now,
      dayDates: [],
      hotelStays: [],
      flights: [],
      transportBookings: [],
      insurances: [],
      plannedActivities: [],
      trip: { endDate: "2026-06-10", passportExpiryDate: "2029-01-01", internationalDrivingPermitExpiryDate: null, israeliDrivingLicenseExpiryDate: null, visaRequirementsChecked: true },
    });

    expect(gaps.some((g) => g.title === "תוקף הדרכון קרוב לפוג")).toBe(false);
  });

  it("does not flag a passport when no expiry date was entered at all", () => {
    const gaps = detectGaps({
      now,
      dayDates: [],
      hotelStays: [],
      flights: [],
      transportBookings: [],
      insurances: [],
      plannedActivities: [],
      trip: { endDate: "2026-06-10", passportExpiryDate: null, internationalDrivingPermitExpiryDate: null, israeliDrivingLicenseExpiryDate: null, visaRequirementsChecked: true },
    });

    expect(gaps.some((g) => g.title === "תוקף הדרכון קרוב לפוג")).toBe(false);
  });

  it("flags an international driving permit expiring before the trip ends, when a car rental exists", () => {
    const gaps = detectGaps({
      now,
      dayDates: [],
      hotelStays: [],
      flights: [],
      transportBookings: [],
      insurances: [],
      plannedActivities: [],
      carRentals: [makeCarRental()],
      trip: { endDate: "2026-06-10", passportExpiryDate: null, internationalDrivingPermitExpiryDate: "2026-06-05", israeliDrivingLicenseExpiryDate: null, visaRequirementsChecked: true },
    });

    expect(gaps.some((g) => g.title === "תוקף רישיון-הנהיגה הבינלאומי קרוב לפוג")).toBe(true);
  });

  it("does not flag an expiring international driving permit when there is no car rental in the trip", () => {
    const gaps = detectGaps({
      now,
      dayDates: [],
      hotelStays: [],
      flights: [],
      transportBookings: [],
      insurances: [],
      plannedActivities: [],
      carRentals: [],
      trip: { endDate: "2026-06-10", passportExpiryDate: null, internationalDrivingPermitExpiryDate: "2026-06-05", israeliDrivingLicenseExpiryDate: null, visaRequirementsChecked: true },
    });

    expect(gaps.some((g) => g.title === "תוקף רישיון-הנהיגה הבינלאומי קרוב לפוג")).toBe(false);
  });

  it("does not flag an international driving permit that stays valid through the trip", () => {
    const gaps = detectGaps({
      now,
      dayDates: [],
      hotelStays: [],
      flights: [],
      transportBookings: [],
      insurances: [],
      plannedActivities: [],
      carRentals: [makeCarRental()],
      trip: { endDate: "2026-06-10", passportExpiryDate: null, internationalDrivingPermitExpiryDate: "2030-01-01", israeliDrivingLicenseExpiryDate: null, visaRequirementsChecked: true },
    });

    expect(gaps.some((g) => g.title === "תוקף רישיון-הנהיגה הבינלאומי קרוב לפוג")).toBe(false);
  });

  it("flags an expiring Israeli driving license when a car rental exists", () => {
    const gaps = detectGaps({
      now,
      dayDates: [],
      hotelStays: [],
      flights: [],
      transportBookings: [],
      insurances: [],
      plannedActivities: [],
      carRentals: [makeCarRental()],
      trip: { endDate: "2026-06-10", passportExpiryDate: null, internationalDrivingPermitExpiryDate: null, israeliDrivingLicenseExpiryDate: "2026-06-05", visaRequirementsChecked: true },
    });

    expect(gaps.some((g) => g.title === "תוקף רישיון-הנהיגה הישראלי קרוב לפוג")).toBe(true);
  });

  it("does not flag an expiring Israeli license when there is no car rental in the trip", () => {
    const gaps = detectGaps({
      now,
      dayDates: [],
      hotelStays: [],
      flights: [],
      transportBookings: [],
      insurances: [],
      plannedActivities: [],
      carRentals: [],
      trip: { endDate: "2026-06-10", passportExpiryDate: null, internationalDrivingPermitExpiryDate: null, israeliDrivingLicenseExpiryDate: "2026-06-05", visaRequirementsChecked: true },
    });

    expect(gaps.some((g) => g.title === "תוקף רישיון-הנהיגה הישראלי קרוב לפוג")).toBe(false);
  });

  it("flags an unchecked visa requirement when the trip has registered countries", () => {
    const gaps = detectGaps({
      now,
      dayDates: [],
      hotelStays: [],
      flights: [],
      transportBookings: [],
      insurances: [],
      plannedActivities: [],
      countryNames: ["תאילנד"],
      trip: { endDate: "2026-06-10", passportExpiryDate: null, internationalDrivingPermitExpiryDate: null, israeliDrivingLicenseExpiryDate: null, visaRequirementsChecked: false },
    });

    expect(gaps.some((g) => g.title === "לא סימנת שבדקת דרישות ויזה")).toBe(true);
  });

  it("does not flag the visa reminder once the user marks it as checked", () => {
    const gaps = detectGaps({
      now,
      dayDates: [],
      hotelStays: [],
      flights: [],
      transportBookings: [],
      insurances: [],
      plannedActivities: [],
      countryNames: ["תאילנד"],
      trip: { endDate: "2026-06-10", passportExpiryDate: null, internationalDrivingPermitExpiryDate: null, israeliDrivingLicenseExpiryDate: null, visaRequirementsChecked: true },
    });

    expect(gaps.some((g) => g.title === "לא סימנת שבדקת דרישות ויזה")).toBe(false);
  });

  it("does not flag the visa reminder when the trip has no registered countries", () => {
    const gaps = detectGaps({
      now,
      dayDates: [],
      hotelStays: [],
      flights: [],
      transportBookings: [],
      insurances: [],
      plannedActivities: [],
      countryNames: [],
      trip: { endDate: "2026-06-10", passportExpiryDate: null, internationalDrivingPermitExpiryDate: null, israeliDrivingLicenseExpiryDate: null, visaRequirementsChecked: false },
    });

    expect(gaps.some((g) => g.title === "לא סימנת שבדקת דרישות ויזה")).toBe(false);
  });

  it("skips budget checks entirely when budgetProgress is not provided", () => {
    const gaps = detectGaps({
      now,
      dayDates: [],
      hotelStays: [],
      flights: [],
      transportBookings: [],
      insurances: [],
      plannedActivities: [],
    });

    expect(gaps.some((g) => g.title.includes("תקציב"))).toBe(false);
  });
});
