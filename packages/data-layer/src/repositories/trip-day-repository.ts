import type { TripDay } from "@travel-app/shared-types";

/**
 * TripDay — get-or-create לפי (tripId, date), אותו דפוס בדיוק כמו שכבר
 * קיים פנימית ב-RouteRepository (ר' route-repository.ts/.prisma.ts). כאן
 * נחשף כישות עצמאית כדי לתמוך בהערות-יום (סעיף 4 באפיון) בלי לשכפל מידע
 * שכבר מחושב חי במקומות אחרים (lib/trip-days.ts).
 */
export interface TripDayRepository {
  getOrCreate(params: { tripId: string; date: string }): Promise<TripDay>;
  updateNotes(params: { tripDayId: string; notes: string | null }): Promise<TripDay>;
  /** לגיבוי (#90) — רק ימים עם notes בפועל, לא כל השורות השקופות שנוצרו ל-Route. */
  listForTrip(params: { tripId: string }): Promise<TripDay[]>;
}

export class TripDayNotFoundError extends Error {
  constructor(tripDayId: string) {
    super(`TripDay ${tripDayId} not found`);
    this.name = "TripDayNotFoundError";
  }
}
