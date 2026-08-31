// שמות המפתחות עודכנו לפי דוקומנטציית Supabase העדכנית (אוגוסט 2026):
// המפתחות הישנים anon/service_role יוצאים משימוש עד סוף 2026, במקומם
// publishable (sb_publishable_...) ו-secret (sb_secret_...).
// שני הפורמטים תקינים כערך של אותם משתני סביבה בתקופת המעבר —
// ראה https://supabase.com/docs/guides/getting-started/migrating-to-new-api-keys

export function getSupabaseUrl(): string {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  if (!url) {
    throw new Error(
      "NEXT_PUBLIC_SUPABASE_URL חסר. יש ליצור פרויקט Supabase ולהגדיר את משתני הסביבה ב-.env.local (ראה .env.example).",
    );
  }
  return url;
}

// מפתח בטוח לחשיפה בצד לקוח (Publishable key בדשבורד החדש, או Anon key בישן).
// נשען על Row Level Security — לעולם לא עוקף אותו.
export function getSupabasePublishableKey(): string {
  const key = process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY;
  if (!key) {
    throw new Error(
      "NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY חסר. יש ליצור פרויקט Supabase ולהגדיר את משתני הסביבה ב-.env.local (ראה .env.example).",
    );
  }
  return key;
}

// מפתח שרתי בלבד (Secret key בדשבורד החדש, או Service role key בישן) —
// עוקף Row Level Security. שימוש רק בקוד שרת, אף פעם לא ב-NEXT_PUBLIC_/client bundle.
export function getSupabaseSecretKey(): string {
  const key = process.env.SUPABASE_SECRET_KEY;
  if (!key) {
    throw new Error("SUPABASE_SECRET_KEY חסר. משתנה זה שרתי בלבד — אסור לחשוף אותו ל-client.");
  }
  return key;
}
