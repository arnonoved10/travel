import { loadJSON, saveJSON, nextId, tripScopedKey, type PaymentMethod, type Expense } from "./wallet-data";
import { currentScopeTripId } from "./trips-data";

/**
 * הזמנות (מלונות/טיסות/תחבורה/רכבים/אטרקציות) למסכי "ההזמנות שלי" ו"פרטי
 * הזמנה" — נשמר ב-localStorage בלבד, מוזן ידנית ע"י המשתמש (אין באפליקציה
 * הזו שום שירות-הזמנות חי לחבר אליו). מתחיל ריק, בלי נתוני-דמו. תלוי-טיול
 * (ר' currentScopeTripId ב-trips-data.ts) — כל טיול מתחיל עם רשימת-הזמנות
 * נפרדת ומלאה משלו.
 */
export type BookingCategory = "hotel" | "flight" | "transport" | "car" | "attraction";

/** סוג-הרכב שהוזמן להסעה (category "transport" בלבד) — לפי בקשה מפורשת:
 * "שיהיה לי בחירה איזה סוג רכב הזמנתי". כל סוג מקבל תמונה אמיתית משלו
 * בדף הבית (ר' VEHICLE_PHOTO ב-mobile-home-mock.tsx). */
export type VehicleType = "taxi" | "van" | "suv" | "premium";

/** סטטוס-טיסה (category "flight" בלבד) — מוזן/מעודכן **ידנית** ע"י
 * המשתמש, לא חיבור-חי לשירות-מעקב-טיסות אמיתי (הוחלט במפורש: חיבור כזה
 * דורש שירות חיצוני עם מפתח-API, בדיוק כמו שאר האינטגרציות בהדגמה הזו
 * שלא קיימות — ר' התיעוד בראש הקובץ). */
export type FlightStatus = "on_time" | "delayed" | "boarding" | "landed" | "cancelled";
export const FLIGHT_STATUS_LABEL: Record<FlightStatus, string> = {
  on_time: "בזמן",
  delayed: "מתעכבת",
  boarding: "עלייה למטוס",
  landed: "נחתה",
  cancelled: "בוטלה",
};

export interface Booking {
  id: string;
  category: BookingCategory;
  title: string;
  confirmationNumber: string;
  status: "confirmed" | "pending" | "cancelled";
  checkIn: string;
  checkOut?: string;
  address?: string;
  guests?: number;
  totalPrice?: string;
  phone?: string;
  vehicleType?: VehicleType;
  /** שעת-איסוף אמיתית (HH:MM), category "transport" בלבד — מזינים אותה
   * כדי לקבל טיימר-אמיתי בדף הבית במקום ספירה-לאחור ברמת-יום בלבד. */
  pickupTime?: string;
  /** הזמנה הלוך-חזור (category "transport" בלבד) — לפי בקשה מפורשת:
   * "יש מצב שאנחנו מזמינים הלוך וחזור כבר באותה הזמנה". כשמופעל, checkOut
   * הוא תאריך-החזרה ו-returnPickupTime שעת-האיסוף שלה; דף הבית מציג תמיד
   * את הרגל הבאה-בזמן שעוד לא עברה (הלוך או חזור), לא רק את ההלוך. */
  isRoundTrip?: boolean;
  returnPickupTime?: string;
  /** מספר-טיסה, שעת-המראה (HH:MM) וסטטוס — category "flight" בלבד. */
  flightNumber?: string;
  departTime?: string;
  flightStatus?: FlightStatus;
  /** מחיר-מלון אמיתי (category "hotel" בלבד) — נפרד מ-totalPrice הכללי
   * (מחרוזת חופשית, כל הקטגוריות) כי זה חייב להיות סכום+מטבע+אמצעי-תשלום
   * אמיתיים כדי שיהיה אפשר לרשום אותו אוטומטית כהוצאה אמיתית בארנק (ר'
   * bookings/new ו-bookings/[id] — סנכרון עם Expense.bookingId). לפי בקשה
   * מפורשת: "לא משנה אם ארשום את זה בהוצאה או במלון, זה יכנס כהוצאה". */
  hotelPriceAmount?: number;
  hotelPriceCurrency?: string;
  hotelPriceMethod?: PaymentMethod;
}

export const CATEGORY_LABEL: Record<BookingCategory, string> = {
  hotel: "מלונות",
  flight: "טיסות",
  transport: "תחבורה",
  car: "רכבים",
  attraction: "אטרקציות",
};

const SK_BOOKINGS = "design-preview-bookings-v1";

export function loadBookings(): Booking[] {
  return loadJSON<Booking[]>(tripScopedKey(SK_BOOKINGS, currentScopeTripId()), []);
}
function saveBookings(bookings: Booking[]) {
  saveJSON(tripScopedKey(SK_BOOKINGS, currentScopeTripId()), bookings);
}
export function findBooking(id: string): Booking | null {
  return loadBookings().find((b) => b.id === id) ?? null;
}
export function createBooking(patch: Omit<Booking, "id">): Booking {
  const booking: Booking = { id: nextId("bk"), ...patch };
  saveBookings([booking, ...loadBookings()]);
  return booking;
}
/** מעדכן הזמנה קיימת (למשל ביטול) — לפני כן לא הייתה שום דרך לבטל הזמנה
 * בפועל, כפתור "ביטול הזמנה" רק ניווט אחורה בלי לשנות כלום. */
export function updateBooking(id: string, patch: Partial<Omit<Booking, "id">>): Booking | null {
  const bookings = loadBookings();
  const idx = bookings.findIndex((b) => b.id === id);
  if (idx === -1) return null;
  const updated = { ...bookings[idx]!, ...patch };
  const arr = [...bookings];
  arr[idx] = updated;
  saveBookings(arr);
  return updated;
}
/** מוחקת הזמנה לצמיתות — שונה מ"ביטול" (updateBooking עם status: "cancelled")
 * שרק מסמן את ההזמנה כמבוטלת אך משאיר אותה ברשימה. */
export function deleteBooking(id: string) {
  saveBookings(loadBookings().filter((b) => b.id !== id));
}
export function bookingsByCategory(): Record<BookingCategory, Booking[]> {
  const all = loadBookings();
  const result: Record<BookingCategory, Booking[]> = { hotel: [], flight: [], transport: [], car: [], attraction: [] };
  for (const b of all) result[b.category].push(b);
  return result;
}

/** מסנכרן את ההוצאה המקושרת (Expense.bookingId) עם מחיר-המלון של ההזמנה —
 * לפי בקשה מפורשת: "לא משנה אם ארשום את זה ישירות בהוצאה או בתאריך של
 * מלון, זה יכנס כהוצאה" (לא כפול). נקרא מ-bookings/new ומ-bookings/[id],
 * ששניהם כבר מחזיקים useWalletStore() משלהם — מקבל את הפעולות/המצב שלו
 * כפרמטרים (לא מייבא את ה-hook כאן, כדי לא ליצור תלות מעגלית/כפולה).
 * מחיר ריק/0 מוחק את ההוצאה המקושרת אם קיימת (המשתמש הסיר את המחיר).
 */
export function syncHotelExpense(
  booking: Booking,
  expenses: Expense[],
  saveExpense: (patch: Omit<Expense, "id">, receiptDataUrl: null, existingId?: string) => void,
  deleteExpense: (id: string) => void,
) {
  const linked = expenses.find((e) => e.bookingId === booking.id);
  const hasPrice = booking.category === "hotel" && booking.hotelPriceAmount != null && booking.hotelPriceAmount > 0 && !!booking.hotelPriceCurrency;
  if (!hasPrice) {
    if (linked) deleteExpense(linked.id);
    return;
  }
  saveExpense(
    {
      title: booking.title,
      category: "מלון",
      currency: booking.hotelPriceCurrency!,
      amount: booking.hotelPriceAmount!,
      date: booking.checkIn,
      paymentMethod: booking.hotelPriceMethod ?? "cash",
      bookingId: booking.id,
    },
    null,
    linked?.id,
  );
}
