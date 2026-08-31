import type { HotelStay } from "@travel-app/shared-types";

export interface DayHotelContext {
  /** המלון שישנת בו הלילה שלפני היום הזה — מאיפה יוצאים בבוקר. */
  morningHotel: HotelStay | null;
  /** המלון שישנת בו בלילה של היום הזה — לאן חוזרים בערב. */
  nightHotel: HotelStay | null;
}

/**
 * מזהה את מלון-הבוקר/מלון-הלילה של יום ספציפי לפי checkIn/checkOutDate —
 * לא קלט ידני. באותו יום "רגיל" (לא יום-מעבר בין מלונות) שני השדות
 * מצביעים על אותו מלון. הוצא מ-optimizeDayRouteAction (days/actions.ts)
 * כדי שאפשר יהיה להשתמש באותה לוגיקה גם ל"מה שווה לעשות היום".
 */
export function resolveDayHotelContext(hotelStays: HotelStay[], date: string): DayHotelContext {
  const morningHotel =
    hotelStays.find((h) => h.checkOutDate === date) ?? hotelStays.find((h) => h.checkInDate < date && date < h.checkOutDate) ?? null;
  const nightHotel =
    hotelStays.find((h) => h.checkInDate === date) ?? hotelStays.find((h) => h.checkInDate < date && date < h.checkOutDate) ?? null;
  return { morningHotel, nightHotel };
}
