import { loadJSON, saveJSON } from "./wallet-data";

/**
 * נתוני-הזמנות דמו (מלונות/טיסות/תחבורה/רכבים/אטרקציות) למסכי "ההזמנות
 * שלי" (12) ו"פרטי הזמנה" (13). מוצהר-דמו במפורש (לא מחובר לספק-הזמנות
 * אמיתי) — אין באפליקציה הזו שום שירות-הזמנות חי לחבר אליו.
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

export const DEFAULT_BOOKINGS: Booking[] = [
  { id: "bk-hotel-1", category: "hotel", title: "מלון גריניר טוקיו שינג'וקו", confirmationNumber: "HTL-874621", status: "confirmed", checkIn: "2025-06-15", checkOut: "2025-06-17", address: "1-19-1 Kabukicho, Shinjuku City, Tokyo 160-0021", guests: 2, totalPrice: "₪2,340", phone: "0501234567" },
  { id: "bk-hotel-2", category: "hotel", title: "מלון בקיוטו", confirmationNumber: "HTL-551230", status: "confirmed", checkIn: "2025-06-18", checkOut: "2025-06-20", address: "Kyoto, Japan", guests: 2, totalPrice: "₪1,980" },
  { id: "bk-flight-1", category: "flight", title: "טיסה תל אביב - טוקיו", confirmationNumber: "FLT-102938", status: "confirmed", checkIn: "2025-06-15" },
  { id: "bk-transport-1", category: "transport", title: "הסעה משדה התעופה", confirmationNumber: "TRN-778812", status: "confirmed", checkIn: "2025-06-15" },
  { id: "bk-car-1", category: "car", title: "השכרת רכב - Hertz", confirmationNumber: "CAR-334455", status: "confirmed", checkIn: "2025-05-28", checkOut: "2025-06-04" },
  { id: "bk-attraction-1", category: "attraction", title: "כרטיסים למקדש פושימי אינרי", confirmationNumber: "ATT-991122", status: "pending", checkIn: "2025-06-18" },
];

const SK_BOOKINGS = "design-preview-bookings-v1";

export function loadBookings(): Booking[] {
  return loadJSON(SK_BOOKINGS, DEFAULT_BOOKINGS);
}
export function findBooking(id: string): Booking | null {
  return loadBookings().find((b) => b.id === id) ?? null;
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
