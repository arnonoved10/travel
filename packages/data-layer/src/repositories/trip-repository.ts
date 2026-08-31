import type { CreateTripInput, Trip, UpdateTripInput } from "@travel-app/shared-types";

/**
 * חוזה אחיד לגישה לנתוני Trip, בלי תלות במקור הנתונים בפועל (Mock היום,
 * Prisma+Supabase בעתיד). כל מתודה מקבלת userId במפורש כדי לשקף את אותה
 * סמנטיקת בידוד-לפי-משתמש ש-RLS יאכוף בפועל (packages/db/prisma/rls_policies.sql)
 * — כך שהחלפת המימוש לא תדרוש לשנות איך קוראים לו מה-UI/business-logic.
 */
export interface TripRepository {
  list(params: { userId: string; includeDeleted?: boolean }): Promise<Trip[]>;
  getById(params: { userId: string; tripId: string }): Promise<Trip | null>;
  /**
   * בלי userId בכוונה — נקודת-הגישה היחידה לטיול שלא דרך getById. לשימוש
   * *רק* מהמסך הציבורי app/shared/[token]/, אחרי ש-TripShareLinkRepository.
   * resolveToken כבר אימת שיש קישור-שיתוף פעיל ל-tripId הזה — זו נקודת-
   * האימות החלופית שם, במקום getById. אל תשתמשו בזה מנתיב לא-מאומת אחר.
   */
  getByIdForShareView(params: { tripId: string }): Promise<Trip | null>;
  create(params: { userId: string; input: CreateTripInput }): Promise<Trip>;
  update(params: { userId: string; tripId: string; input: UpdateTripInput }): Promise<Trip>;
  softDelete(params: { userId: string; tripId: string }): Promise<Trip>;
  restore(params: { userId: string; tripId: string }): Promise<Trip>;
}

export class TripNotFoundError extends Error {
  constructor(tripId: string) {
    super(`Trip ${tripId} not found`);
    this.name = "TripNotFoundError";
  }
}
