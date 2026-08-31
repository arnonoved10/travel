-- ----------------------------------------------------------------------------
-- טריגר-מראה: מחיקת שורת public.users כשמוחקים משתמש מ-Supabase Auth
-- ----------------------------------------------------------------------------
-- נמצא בבדיקה חיה: מחיקת משתמש-בדיקה דרך admin.deleteUser() הסירה את
-- auth.users אבל השאירה orphan record ב-public.users (אין FK/trigger שמצליב
-- בכיוון ההפוך — קיים רק on_auth_user_created לכיוון היצירה). זה מפר את
-- העיקרון "בלי יצירת orphan records" (PROJECT_REQUIREMENTS.md סעיף 0).
--
-- אין onDelete: Cascade על שום relation ב-schema.prisma (User.id ← Trip.userId
-- וכו'), אז אם למשתמש יש עדיין טיולים/מקומות/וכו' המחיקה כאן תיכשל על
-- foreign-key violation — זו התנהגות בטוחה ומכוונת: מונעת מחיקה שקטה של
-- נתוני-משתמש אמיתיים. מחיקת חשבון עם נתונים קיימים דורשת זרימת-מחיקה
-- ייעודית שלא נבנתה עדיין (לא בסקופ התיקון הזה).
create or replace function public.handle_deleted_auth_user()
returns trigger
language plpgsql
security definer set search_path = public
as $$
begin
  delete from public.users where id = old.id::text;
  return old;
end;
$$;

drop trigger if exists on_auth_user_deleted on auth.users;
create trigger on_auth_user_deleted
  after delete on auth.users
  for each row execute function public.handle_deleted_auth_user();
