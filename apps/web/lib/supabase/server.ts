import { createServerClient, type CookieOptions } from "@supabase/ssr";
import { cookies } from "next/headers";
import { getSupabasePublishableKey, getSupabaseUrl } from "./env";

type CookieToSet = { name: string; value: string; options: CookieOptions };

// לשימוש ב-Server Components / Server Actions / Route Handlers בלבד.
// קורא/כותב עוגיות session דרך next/headers — לא ניתן להשתמש בזה ב-Client Component.
// פועל בהקשר המשתמש המחובר (JWT מהעוגיות) + Publishable key — Row Level Security
// עדיין חל במלואו. לפעולות שדורשות עקיפת RLS בפועל, ראה admin.ts.
export async function createSupabaseServerClient() {
  const cookieStore = await cookies();

  return createServerClient(getSupabaseUrl(), getSupabasePublishableKey(), {
    cookies: {
      getAll() {
        return cookieStore.getAll();
      },
      setAll(cookiesToSet: CookieToSet[]) {
        try {
          for (const { name, value, options } of cookiesToSet) {
            cookieStore.set(name, value, options);
          }
        } catch {
          // setAll נקרא גם מ-Server Component; שם אי אפשר לכתוב עוגיות.
          // זה תקין כל עוד יש middleware שמרענן את ה-session (יתווסף בשלב האימות המלא).
        }
      },
    },
  });
}
