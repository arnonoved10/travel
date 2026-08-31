import type { NotificationEventType } from "@travel-app/shared-types";

export const NOTIFICATION_EVENT_TYPE_LABELS: Record<NotificationEventType, string> = {
  flight_approaching: "טיסה מתקרבת",
  need_to_leave_for_airport: "זמן לצאת לשדה התעופה",
  taxi_approaching: "הסעה/מונית מתקרבת",
  checkout_approaching: "צ'ק-אאוט מתקרב",
  unpaid_booking: "הזמנה לא משולמת",
  night_without_hotel: "לילה בלי מלון רשום",
  activity_not_booked: "תכנית שצריך להזמין",
  deposit_due_return: "פיקדון שצריך לקבל בחזרה",
  insurance_ending: "ביטוח נסיעות מסתיים",
  overdue_not_marked_done: "תכנית עם תאריך שעבר",
  flight_checkin_open: "צ'ק-אין לטיסה נפתח",
};

/**
 * סוגי ההתראה שמחוברים למנוע ה-Reminders "לפני-אירוע" (dueReminders(), יש
 * להם timestamp אמיתי — לא רק תאריך — כדי לחשב "X דקות לפני" בלי להמציא
 * שעה). checkout_approaching מחושב רק כש-checkOutTime בפועל מוזן.
 * activity_not_booked מחושב רק לפריטים שעדיין לא "booked" ויש להם plannedAt
 * מוזן. need_to_leave_for_airport מחושב רק לטיסות שבהן המשתמש שמר בפועל
 * airportArrivalLeadMinutes+travelTimeToAirportMinutes דרך AirportTimingCalculator
 * (ר' Flight ב-schema.prisma) — ה-eventAt הוא recommendedLeaveAt האמיתי
 * מ-computeAirportTiming, לא זמן-הטיסה עצמו. flight_checkin_open מחושב רק
 * לטיסות שבהן המשתמש שמר בפועל checkInWindowHours (CheckInWindowPicker) —
 * ה-eventAt הוא departureAt פחות checkInWindowHours, כלומר "רגע-פתיחת
 * הצ'ק-אין" האמיתי, לא זמן-הטיסה עצמו.
 */
export const SUPPORTED_NOTIFICATION_EVENT_TYPES: readonly NotificationEventType[] = [
  "flight_approaching",
  "taxi_approaching",
  "checkout_approaching",
  "activity_not_booked",
  "need_to_leave_for_airport",
  "flight_checkin_open",
];

export const DEFAULT_LEAD_TIME_MINUTES: Partial<Record<NotificationEventType, number>> = {
  flight_approaching: 180,
  taxi_approaching: 30,
  checkout_approaching: 60,
  activity_not_booked: 1440,
  need_to_leave_for_airport: 30,
  flight_checkin_open: 60,
};

/**
 * סוגי התראה נוספים — לא "לפני אירוע עתידי עם שעה מדויקת" אלא מצב נוכחי
 * (true/false) שנבדק בכל טעינה של /now, בדיוק כמו אזהרת-התקציב הקיימת:
 * בלי dueReminders()/leadTimeMinutes/de-dup ב-localStorage, רק "אם המצב
 * הזה נכון עכשיו והמשתמש הפעיל את הטוגל — הצג כרטיס". night_without_hotel
 * ו-overdue_not_marked_done משתמשים באותה בדיקה בדיוק כמו gap-detection.ts
 * (לא כפילות-לוגיקה מקרית — זו אותה שאלה, רק מוצגת גם כהתראה אקטיבית ולא
 * רק כ"פער" פסיבי). deposit_due_return/insurance_ending משתמשים בסף-ימים
 * קבוע (3 ימים לפיקדון, 7 לביטוח) כי יש להם רק תאריך בלי שעה — לא ממציאים
 * דיוק-שעה שאין.
 */
// unpaid_booking הצטרף לכאן (ולא ל-SUPPORTED) כי אין לו timestamp עתידי —
// זו בדיקת-יתרה נוכחית (agreedPrice מול סכום Payment-ים עם bookingId תואם,
// באותו agreedCurrencyCode בלבד — לא ממירים בין מטבעות), בדיוק כמו שאר
// הבדיקות כאן.
export const STATE_BASED_NOTIFICATION_EVENT_TYPES: readonly NotificationEventType[] = [
  "night_without_hotel",
  "overdue_not_marked_done",
  "deposit_due_return",
  "insurance_ending",
  "unpaid_booking",
];

/** כל 11 הסוגים מחוברים כעת (6 SUPPORTED + 5 STATE_BASED). נשאר ריק בכוונה —
 * תיעוד שאין יותר סוגים לא-מחוברים, לא רשימת-TODO. */
export const UNSUPPORTED_NOTIFICATION_EVENT_TYPES: readonly NotificationEventType[] = [];
