// שמות המפתחות לפי דוקומנטציית Supabase העדכנית: publishable (sb_publishable_...)
// החליף את anon, ושני הפורמטים תקינים כערך של אותו משתנה בתקופת המעבר.
// זהה במכוון ל-apps/web/lib/supabase/env.ts — אותו פרויקט Supabase, אותם שמות.

export function getSupabaseUrl(): string {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  if (!url) {
    throw new Error("NEXT_PUBLIC_SUPABASE_URL חסר. יש להגדיר אותו ב-.env.local ובמשתני הסביבה של פרויקט design-preview ב-Vercel.");
  }
  return url;
}

// מפתח בטוח לחשיפה בצד לקוח — נשען על Row Level Security, לעולם לא עוקף אותו.
export function getSupabasePublishableKey(): string {
  const key = process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY;
  if (!key) {
    throw new Error("NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY חסר. יש להגדיר אותו ב-.env.local ובמשתני הסביבה של פרויקט design-preview ב-Vercel.");
  }
  return key;
}
