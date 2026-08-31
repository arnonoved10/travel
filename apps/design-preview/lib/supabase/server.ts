import { createServerClient, type CookieOptions } from "@supabase/ssr";
import { cookies } from "next/headers";
import { getSupabasePublishableKey, getSupabaseUrl } from "./env";

type CookieToSet = { name: string; value: string; options: CookieOptions };

// לשימוש ב-Server Components / Server Actions בלבד. קריאת ה-session מהעוגיות
// שה-proxy מרענן בכל בקשה.
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
          // נקרא גם מ-Server Component, שם אסור לכתוב עוגיות. תקין —
          // ה-proxy הוא זה שמרענן את העוגיות בפועל.
        }
      },
    },
  });
}
