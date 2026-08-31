import "server-only";
import { createClient } from "@supabase/supabase-js";
import { getSupabaseSecretKey, getSupabaseUrl } from "./env";

// אזהרה: הלקוח הזה עוקף Row Level Security לחלוטין (Secret key).
// שימוש רק לפעולות שרת מאובטחות שבאמת דורשות זאת (למשל: job רקע ללא הקשר משתמש).
// אף פעם לא ב-Client Component, Route Handler שמזרים תשובה ללקוח בלי בדיקת הרשאה
// משלו, או קוד שמריץ לוגיקה מטעם המשתמש — לזה יש להשתמש ב-createSupabaseServerClient.
export function createSupabaseAdminClient() {
  return createClient(getSupabaseUrl(), getSupabaseSecretKey(), {
    auth: { autoRefreshToken: false, persistSession: false },
  });
}
