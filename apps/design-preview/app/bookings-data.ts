import { loadJSON, saveJSON, nextId } from "./wallet-data";

/**
 * הזמנות (מלונות/טיסות/תחבורה/רכבים/אטרקציות) למסכי "ההזמנות שלי" ו"פרטי
 * הזמנה" — נשמר ב-localStorage בלבד, מוזן ידנית ע"י המשתמש (אין באפליקציה
 * הזו שום שירות-הזמנות חי לחבר אליו). מתחיל ריק, בלי נתוני-דמו.
 */
export type BookingCategory = "hotel" | "flight" | "transport" | "car" | "attraction";

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
  return loadJSON<Booking[]>(SK_BOOKINGS, []);
}
export function findBooking(id: string): Booking | null {
  return loadBookings().find((b) => b.id === id) ?? null;
}
export function createBooking(patch: Omit<Booking, "id">): Booking {
  const booking: Booking = { id: nextId("bk"), ...patch };
  saveJSON(SK_BOOKINGS, [booking, ...loadBookings()]);
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
  saveJSON(SK_BOOKINGS, arr);
  return updated;
}
/** מוחקת הזמנה לצמיתות — שונה מ"ביטול" (updateBooking עם status: "cancelled")
 * שרק מסמן את ההזמנה כמבוטלת אך משאיר אותה ברשימה. */
export function deleteBooking(id: string) {
  saveJSON(SK_BOOKINGS, loadBookings().filter((b) => b.id !== id));
}
export function bookingsByCategory(): Record<BookingCategory, Booking[]> {
  const all = loadBookings();
  const result: Record<BookingCategory, Booking[]> = { hotel: [], flight: [], transport: [], car: [], attraction: [] };
  for (const b of all) result[b.category].push(b);
  return result;
}
