"use client";

import { useEffect, useState } from "react";
import { createSupabaseBrowserClient } from "@/lib/supabase/client";

export type CurrentUser = { email: string; displayName: string };

/**
 * שם לתצוגה מתוך פרטי המשתמש. אין עדיין שדה "שם מלא" בטופס ההרשמה, ולכן
 * ברירת המחדל נגזרת מהחלק שלפני ה-@ באימייל. אם ייווסף שדה שם בעתיד הוא
 * יגיע ב-user_metadata ויגבר אוטומטית.
 */
function toDisplayName(email: string, metadataName: unknown): string {
  if (typeof metadataName === "string" && metadataName.trim()) return metadataName.trim();
  const localPart = email.split("@")[0] ?? "";
  const cleaned = localPart.replace(/[._-]+/g, " ").trim();
  return cleaned || email;
}

/**
 * המשתמש המחובר, לשימוש רכיבי לקוח. מחזיר null כל עוד לא ידוע מי מחובר
 * (טעינה ראשונית או משתמש אנונימי) — הקורא אחראי לא להציג שם ריק.
 */
export function useCurrentUser(): CurrentUser | null {
  const [user, setUser] = useState<CurrentUser | null>(null);

  useEffect(() => {
    let isActive = true;
    let unsubscribe: (() => void) | undefined;

    try {
      const supabase = createSupabaseBrowserClient();

      supabase.auth.getUser().then(({ data }) => {
        if (!isActive) return;
        const email = data.user?.email;
        setUser(email ? { email, displayName: toDisplayName(email, data.user?.user_metadata?.full_name) } : null);
      });

      const { data } = supabase.auth.onAuthStateChange((_event, session) => {
        if (!isActive) return;
        const email = session?.user?.email;
        setUser(email ? { email, displayName: toDisplayName(email, session?.user?.user_metadata?.full_name) } : null);
      });
      unsubscribe = () => data.subscription.unsubscribe();
    } catch {
      if (isActive) setUser(null);
    }

    return () => {
      isActive = false;
      unsubscribe?.();
    };
  }, []);

  return user;
}

/**
 * התנתקות. מחזיר הודעת שגיאה אם נכשלה, או null בהצלחה — כדי שכל כפתור
 * יוכל להציג את הכישלון בדרך שלו במקום לבלוע אותו.
 */
export async function signOutCurrentUser(): Promise<string | null> {
  try {
    const { error } = await createSupabaseBrowserClient().auth.signOut();
    return error ? error.message : null;
  } catch (error) {
    return error instanceof Error ? error.message : "שגיאה לא צפויה בהתנתקות";
  }
}
