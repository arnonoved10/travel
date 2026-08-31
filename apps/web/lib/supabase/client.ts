import { createBrowserClient } from "@supabase/ssr";
import { getSupabasePublishableKey, getSupabaseUrl } from "./env";

// לשימוש ב-Client Components בלבד. פועל מול Supabase Auth (עוגיות בדפדפן).
// המפתח כאן הוא Publishable key בלבד — בטוח לחשיפה, נסמך על RLS.
export function createSupabaseBrowserClient() {
  return createBrowserClient(getSupabaseUrl(), getSupabasePublishableKey());
}
