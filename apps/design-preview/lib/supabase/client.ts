import { createBrowserClient } from "@supabase/ssr";
import { getSupabasePublishableKey, getSupabaseUrl } from "./env";

// לשימוש ב-Client Components בלבד — מסכי ההתחברות וההרשמה.
export function createSupabaseBrowserClient() {
  return createBrowserClient(getSupabaseUrl(), getSupabasePublishableKey());
}
