import type { TripShareLink } from "@travel-app/shared-types";

// המסך הציבורי (app/shared/[token]/) קורא רק ל-resolveToken — היחיד בלי
// אימות-בעלות, כי זו בדיוק נקודת-הכניסה הציבורית. שלוש השיטות האחרות
// מקבלות userId+tripId ומאמתות בעלות דרך TripRepository.getById בעצמן
// (לא רק בשכבת ה-Action, כמו שאר הריפוזיטוריים) — ר' plan, "חלק H":
// שכבת-הגנה נוספת במכוון, כי זו נקודת-הכתיבה שיוצרת גישה ציבורית לנתונים.
export interface TripShareLinkRepository {
  /** קריאה בלבד, לא יוצרת — לתצוגת "יש/אין קישור פעיל" בעמוד הטיול בלי ליצור קישור אגב-צפייה. tripId בלבד, כמו שאר הקריאות (בעלות כבר אומתה ב-UI). */
  getActiveForTrip(params: { tripId: string }): Promise<TripShareLink | null>;
  /** מחזיר קישור-שיתוף פעיל קיים לטיול, או יוצר חדש אם אין (או אם הקודם בוטל). */
  getOrCreateForTrip(params: { userId: string; tripId: string }): Promise<TripShareLink>;
  /** מבטל את קישור-השיתוף הפעיל הנוכחי (אם יש) — revokedAt בלבד, לא נמחק (audit trail). */
  revoke(params: { userId: string; tripId: string }): Promise<void>;
  /** מבטל את הקיים ויוצר טוקן חדש — לשימוש כש"הקישור דלף". */
  regenerate(params: { userId: string; tripId: string }): Promise<TripShareLink>;
  /** בלי אימות-בעלות בכוונה — מחזיר null אם הטוקן לא קיים או בוטל. */
  resolveToken(params: { token: string }): Promise<TripShareLink | null>;
}

export class TripNotFoundForShareLinkError extends Error {
  constructor(tripId: string) {
    super(`Trip ${tripId} not found or not owned by user`);
    this.name = "TripNotFoundForShareLinkError";
  }
}
