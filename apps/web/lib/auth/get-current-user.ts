import { isDemoMode } from "@travel-app/data-layer";
import { createSupabaseServerClient } from "@/lib/supabase/server";

export interface CurrentUser {
  id: string;
  email: string;
}

// חייב להתאים בדיוק ל-userId של הטיולים המדומים ב-
// packages/data-layer/src/repositories/trip-repository.mock.ts.
const DEMO_USER: CurrentUser = {
  id: "00000000-0000-4000-8000-000000000001",
  email: "demo@travel-app.local",
};

/**
 * מקור אמת יחיד ל"מי המשתמש הנוכחי" — משמש בכל מסך שדורש משתמש מחובר.
 * במצב דמו (DATA_SOURCE=mock, ברירת המחדל כל עוד אין Supabase חי) מחזיר
 * משתמש דמו קבוע בלי בדיקת session אמיתית. ברגע ש-DATA_SOURCE=prisma,
 * עובר אוטומטית לבדיקת session אמיתית מול Supabase — בלי לשנות קוד קורא.
 */
export async function getCurrentUser(): Promise<CurrentUser | null> {
  if (isDemoMode()) {
    return DEMO_USER;
  }

  const supabase = await createSupabaseServerClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user?.email) return null;
  return { id: user.id, email: user.email };
}
