import type { CarRental, Deposit, Flight, HotelStay, Insurance, PlannedActivity, Refund, TransportBooking, Wallet } from "@travel-app/shared-types";
import type { BudgetProgress } from "./budget";
import { getExpenseCategoryLabel } from "./expense-labels";
import { FLIGHT_LIVE_STATUS_LABELS } from "./flight-live-status-labels";

export interface Gap {
  id: string;
  title: string;
  detail: string;
  /** תאריך ISO (YYYY-MM-DD) שאליו הפער קשור, כשידוע — מאפשר סינון לתצוגת-יום ספציפית.
   * לא מוגדר עבור בדיקות ברמת-כל-הטיול (ביטוח/ארנק/תקציב/פיקדון/החזר/מסמך). */
  date?: string;
}

/**
 * מנוע בדיקת חוסרים — היוריסטי בכוונה: כל בדיקה כאן מבוססת רק על נתונים
 * שכבר הוזנו בפועל (לא ממציא נתונים חסרים), ומטרתה להפנות תשומת לב, לא
 * לקבוע עובדה. "בדיקות" שדורשות מידע שעדיין לא קיים באפליקציה (מסמכים,
 * סטטוס תשלום ברמת Booking, רצף יעדים גיאוגרפי) לא נכללות — ראה
 * PROJECT_REQUIREMENTS.md סעיף 28 לרשימת הבדיקות שנותרו Not Started.
 */
export function detectGaps(params: {
  now: Date;
  dayDates: string[];
  hotelStays: HotelStay[];
  flights: Flight[];
  transportBookings: TransportBooking[];
  insurances: Insurance[];
  plannedActivities: PlannedActivity[];
  /** אופציונליים — כשלא מועברים, הבדיקות שתלויות בהם פשוט מדולגות. */
  wallets?: Wallet[];
  deposits?: Deposit[];
  refunds?: Refund[];
  /** מפתחות "entityType:entityId" שכבר יש להם לפחות מסמך אחד. */
  documentedEntityKeys?: Set<string>;
  /** תוצאת computeBudgetProgress (lib/budget.ts) — מדולג אם לא הועבר או שאין תקציב מוגדר בכלל. */
  budgetProgress?: BudgetProgress;
  /** שדות-מסמכי-הטיול — כל בדיקה מדולגת בנפרד אם לא הועבר trip או שהשדה הרלוונטי ריק/כברירת-מחדל. */
  trip?: {
    endDate: string;
    passportExpiryDate: string | null;
    internationalDrivingPermitExpiryDate: string | null;
    israeliDrivingLicenseExpiryDate: string | null;
    visaRequirementsChecked: boolean;
  };
  /** רק להחלטה אם בדיקות-רישיון-נהיגה בכלל רלוונטיות (יש השכרת-רכב בטיול). */
  carRentals?: CarRental[];
  /** שמות-המדינות שנרשמו לטיול — רק להחלטה אם תזכורת-ויזה בכלל רלוונטית (יש לפחות מדינה אחת). */
  countryNames?: string[];
}): Gap[] {
  const {
    now,
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
    trip,
    carRentals,
    countryNames,
  } = params;
  const gaps: Gap[] = [];

  // 1. לילות בלי מלון רשום (היום האחרון של הטיול לא נבדק — בדרך כלל יום עזיבה)
  const nightsToCheck = dayDates.slice(0, -1);
  for (const night of nightsToCheck) {
    const hasHotel = hotelStays.some((h) => h.checkInDate <= night && night < h.checkOutDate);
    if (!hasHotel) {
      gaps.push({ id: `no-hotel-${night}`, title: "לילה בלי מלון רשום", detail: `הלילה של ${night} — לא נמצא מלון שמכסה את התאריך הזה.`, date: night });
    }
  }

  // 2. חפיפת מלונות
  for (let i = 0; i < hotelStays.length; i++) {
    for (let j = i + 1; j < hotelStays.length; j++) {
      const a = hotelStays[i]!;
      const b = hotelStays[j]!;
      const overlap = a.checkInDate < b.checkOutDate && b.checkInDate < a.checkOutDate;
      if (overlap) {
        gaps.push({
          id: `hotel-overlap-${a.id}-${b.id}`,
          title: "חפיפה בין שני מלונות",
          detail: `"${a.hotelName}" (${a.checkInDate}–${a.checkOutDate}) חופף ל-"${b.hotelName}" (${b.checkInDate}–${b.checkOutDate}).`,
        });
      }
    }
  }

  // 3. תכניות שסומנו "צריך להזמין"
  for (const activity of plannedActivities) {
    if (activity.status === "need_to_book") {
      gaps.push({
        id: `need-to-book-${activity.id}`,
        title: "תכנית שצריך להזמין",
        detail: `"${activity.name}" עדיין מסומנת "צריך להזמין".`,
        date: activity.plannedAt ? activity.plannedAt.slice(0, 10) : undefined,
      });
    }
  }

  // 4. תכניות שהתאריך שלהן עבר בלי לסמן בוצע/לא בוצע/נדחה/בוטל
  const terminalStatuses = new Set(["done", "not_done", "postponed", "cancelled"]);
  for (const activity of plannedActivities) {
    if (activity.plannedAt && new Date(activity.plannedAt) < now && !terminalStatuses.has(activity.status)) {
      gaps.push({
        id: `overdue-${activity.id}`,
        title: "תכנית עם תאריך שעבר",
        detail: `"${activity.name}" תוכננה ל-${new Date(activity.plannedAt).toLocaleString("he-IL")} וטרם עודכן סטטוס סופי.`,
        date: activity.plannedAt.slice(0, 10),
      });
    }
  }

  // 5. אין ביטוח נסיעות רשום בכלל לטיול (מידע בלבד, לא כל טיול דורש ביטוח)
  if (insurances.length === 0) {
    gaps.push({ id: "no-insurance", title: "אין ביטוח נסיעות רשום", detail: "כדאי לבדוק אם צריך להוסיף ביטוח לטיול הזה." });
  }

  // 6. יום טיסה בלי הסעה רשומה — היוריסטי: בודק רק אם קיימת הסעה כלשהי באותו תאריך
  for (const flight of flights) {
    const flightDate = flight.departureAt.slice(0, 10);
    const hasTransportSameDay = transportBookings.some((t) => t.pickupAt.slice(0, 10) === flightDate);
    if (!hasTransportSameDay) {
      gaps.push({
        id: `flight-no-transport-${flight.id}`,
        title: "טיסה בלי הסעה רשומה",
        detail: `הטיסה ב-${flightDate} (${flight.airline} ${flight.flightNumber ?? ""}) — לא נמצאה הסעה רשומה לאותו יום.`,
        date: flightDate,
      });
    }
  }

  // 7. יתרת מזומן נמוכה — פחות מ-10% מיתרת הפתיחה (רק לארנקים שהופקדה בהם יתרת פתיחה חיובית)
  const LOW_BALANCE_RATIO = 0.1;
  if (wallets) {
    for (const wallet of wallets) {
      if (wallet.initialAmount > 0 && wallet.currentBalance > 0 && wallet.currentBalance < wallet.initialAmount * LOW_BALANCE_RATIO) {
        gaps.push({
          id: `low-balance-${wallet.id}`,
          title: "יתרת מזומן נמוכה",
          detail: `נותרו רק ${wallet.currentBalance} ${wallet.currencyCode} מתוך ${wallet.initialAmount} שהופקדו.`,
        });
      }
    }
  }

  // 8. פיקדון שעבר תאריך ההחזר הצפוי וטרם סומן כהוחזר
  if (deposits) {
    for (const deposit of deposits) {
      if (!deposit.isReturned && deposit.expectedReturnDate && deposit.expectedReturnDate < now.toISOString().slice(0, 10)) {
        gaps.push({
          id: `deposit-overdue-${deposit.id}`,
          title: "פיקדון שצריך לקבל בחזרה",
          detail: `${deposit.amount} ${deposit.currencyCode}${deposit.paidTo ? ` ל-${deposit.paidTo}` : ""} — תאריך ההחזר הצפוי (${deposit.expectedReturnDate}) כבר עבר.`,
        });
      }
    }
  }

  // 8b. החזר צפוי שתאריך הקבלה הצפוי שלו כבר עבר וטרם סומן כהתקבל
  if (refunds) {
    for (const refund of refunds) {
      if (!refund.isReceived && refund.refundAt.slice(0, 10) < now.toISOString().slice(0, 10)) {
        gaps.push({
          id: `refund-pending-overdue-${refund.id}`,
          title: "החזר שצריך לקבל",
          detail: `${refund.amount} ${refund.currencyCode}${refund.reason ? ` (${refund.reason})` : ""} — התאריך הצפוי (${refund.refundAt.slice(0, 10)}) כבר עבר.`,
        });
      }
    }
  }

  // 9. מסמך חסר על מלון/טיסה שכבר הוזמנו (סטטוס booked/confirmed ומחיר מוסכם)
  if (documentedEntityKeys) {
    for (const hotel of hotelStays) {
      if (hotel.status !== "want_to_book" && hotel.status !== "cancelled" && !documentedEntityKeys.has(`hotel_stay:${hotel.id}`)) {
        gaps.push({ id: `doc-missing-hotel-${hotel.id}`, title: "מסמך חסר", detail: `אין עדיין מסמך/אישור מצורף למלון "${hotel.hotelName}".` });
      }
    }
    for (const flight of flights) {
      if (flight.status !== "want_to_book" && flight.status !== "cancelled" && !documentedEntityKeys.has(`flight:${flight.id}`)) {
        gaps.push({
          id: `doc-missing-flight-${flight.id}`,
          title: "מסמך חסר",
          detail: `אין עדיין מסמך/כרטיס מצורף לטיסת ${flight.airline} ${flight.flightNumber ?? ""}.`,
        });
      }
    }
  }

  // 10. תקציב — קרוב לחריגה (90%+) או חריגה בפועל, כולל/כולל (סה"כ הטיול וגם לפי קטגוריה)
  const NEAR_BUDGET_RATIO = 0.9;
  if (budgetProgress) {
    if (budgetProgress.totalBudgetAmount !== null) {
      const ratio = budgetProgress.totalSpentAmount / budgetProgress.totalBudgetAmount;
      if (ratio >= 1) {
        gaps.push({
          id: "budget-total-exceeded",
          title: "חריגה מהתקציב הכולל",
          detail: `הוצאו כ-₪${Math.round(budgetProgress.totalSpentAmount)} מתוך תקציב של ₪${Math.round(budgetProgress.totalBudgetAmount)}.`,
        });
      } else if (ratio >= NEAR_BUDGET_RATIO) {
        gaps.push({
          id: "budget-total-near",
          title: "מתקרב לתקציב הכולל",
          detail: `הוצאו כ-₪${Math.round(budgetProgress.totalSpentAmount)} מתוך תקציב של ₪${Math.round(budgetProgress.totalBudgetAmount)} (${Math.round(ratio * 100)}%).`,
        });
      }
    }
    for (const category of budgetProgress.categories) {
      if (category.limitAmount <= 0) continue;
      const ratio = category.spentAmount / category.limitAmount;
      if (ratio >= 1) {
        gaps.push({
          id: `budget-category-exceeded-${category.category}`,
          title: "חריגה מתקציב קטגוריה",
          detail: `הקטגוריה "${getExpenseCategoryLabel(category.category)}" — הוצאו כ-₪${Math.round(category.spentAmount)} מתוך תקציב של ₪${Math.round(category.limitAmount)}.`,
        });
      }
    }
  }

  // 11. סטטוס-טיסה חי מדאיג (עוכבה/בוטלה/הוסטה/אירוע חריג) — רק תוצאת בדיקה אמיתית
  // שהמשתמש הפעיל בעצמו (checkFlightStatusAction), לא ניחוש. liveStatus=null = עדיין
  // לא נבדק בכלל, לא נחשב "בעיה" — פשוט מדולג, בלי להמציא הנחה.
  const CONCERNING_FLIGHT_STATUSES = new Set<Flight["liveStatus"]>(["cancelled", "diverted", "incident"]);
  const MEANINGFUL_DELAY_MINUTES = 15;
  for (const flight of flights) {
    if (!flight.liveStatus) continue;
    const flightDate = flight.departureAt.slice(0, 10);
    const flightLabel = `${flight.airline} ${flight.flightNumber ?? ""}`.trim();
    if (CONCERNING_FLIGHT_STATUSES.has(flight.liveStatus)) {
      gaps.push({
        id: `flight-status-${flight.id}`,
        title: "סטטוס טיסה מדאיג",
        detail: `הטיסה ${flightLabel} מסומנת "${FLIGHT_LIVE_STATUS_LABELS[flight.liveStatus]}".`,
        date: flightDate,
      });
    } else if (flight.liveDelayMinutes !== null && flight.liveDelayMinutes >= MEANINGFUL_DELAY_MINUTES) {
      gaps.push({
        id: `flight-delay-${flight.id}`,
        title: "עיכוב בטיסה",
        detail: `הטיסה ${flightLabel} מעוכבת בכ-${flight.liveDelayMinutes} דקות.`,
        date: flightDate,
      });
    }
  }

  // 12. תוקף-דרכון קרוב לפוג — כלל 6-החודשים הנפוץ (הרבה מדינות דורשות
  // שהדרכון יהיה בתוקף לפחות 6 חודשים מתאריך הנסיעה) — כלל נפוץ, לא אכיפה
  // אחידה בכל יעד/מדינה, ולכן מוצג כ"כדאי לבדוק", לא כעובדה קבועה. מדולג
  // לגמרי אם המשתמש לא הזין תוקף-דרכון בכלל.
  if (trip?.passportExpiryDate) {
    const PASSPORT_VALIDITY_MONTHS = 6;
    const requiredValidUntil = new Date(trip.endDate);
    requiredValidUntil.setMonth(requiredValidUntil.getMonth() + PASSPORT_VALIDITY_MONTHS);
    if (new Date(trip.passportExpiryDate) < requiredValidUntil) {
      gaps.push({
        id: "passport-expiry-soon",
        title: "תוקף הדרכון קרוב לפוג",
        detail: `הדרכון בתוקף עד ${trip.passportExpiryDate} — הרבה מדינות דורשות תוקף של לפחות 6 חודשים מתאריך הנסיעה (${trip.endDate}). כדאי לבדוק את הדרישה הספציפית ליעד.`,
      });
    }
  }

  // 13. תוקף רישיון-נהיגה בינלאומי — רלוונטי רק כשיש השכרת-רכב בטיול (אם אין
  // השכרת-רכב, אין מה לבדוק — לא מציגים אזהרה שלא רלוונטית).
  if (trip?.internationalDrivingPermitExpiryDate && carRentals && carRentals.length > 0 && new Date(trip.internationalDrivingPermitExpiryDate) < new Date(trip.endDate)) {
    gaps.push({
      id: "idp-expiry-soon",
      title: "תוקף רישיון-הנהיגה הבינלאומי קרוב לפוג",
      detail: `הרישיון בתוקף עד ${trip.internationalDrivingPermitExpiryDate}, לפני סיום הטיול (${trip.endDate}) — יש בטיול הזה השכרת-רכב.`,
    });
  }

  // 14. תוקף רישיון-הנהיגה הישראלי — אותה רלוונטיות בדיוק כמו הבינלאומי (רק
  // כשיש השכרת-רכב בטיול); שני הרישיונות נדרשים יחד, לא רק אחד מהם.
  if (trip?.israeliDrivingLicenseExpiryDate && carRentals && carRentals.length > 0 && new Date(trip.israeliDrivingLicenseExpiryDate) < new Date(trip.endDate)) {
    gaps.push({
      id: "israeli-license-expiry-soon",
      title: "תוקף רישיון-הנהיגה הישראלי קרוב לפוג",
      detail: `הרישיון בתוקף עד ${trip.israeliDrivingLicenseExpiryDate}, לפני סיום הטיול (${trip.endDate}) — יש בטיול הזה השכרת-רכב. נדרש רישיון ישראלי בתוקף לצד הבינלאומי.`,
    });
  }

  // 15. תזכורת לבדוק דרישות-ויזה — בכוונה לא קביעה אוטומטית: אין מקור-מידע
  // רשמי אמין לדעת אם צריך ויזה/יש פטור-לתקופה למדינה ספציפית (אימות שנעשה
  // מול המשתמש), אז זו רק תזכורת לבדוק בעצמו, לא תשובה. נעלמת ברגע שהמשתמש
  // מסמן "בדקתי" (Trip.visaRequirementsChecked).
  if (trip && !trip.visaRequirementsChecked && countryNames && countryNames.length > 0) {
    gaps.push({
      id: "visa-requirements-not-checked",
      title: "לא סימנת שבדקת דרישות ויזה",
      detail: `יעדים בטיול: ${countryNames.join(", ")}. יש לבדוק לכל יעד האם נדרשת ויזה, האם יש פטור לתקופה מסוימת (למשל 30 יום), או שצריך להוציא ויזה מראש — מומלץ לבדוק באתר הקונסולרי הרשמי של משרד החוץ (govextra.gov.il/foreign-affairs/consular-affairs/travel) ולסמן "בדקתי" בעריכת הטיול.`,
    });
  }

  return gaps;
}
