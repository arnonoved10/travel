-- ============================================================================
-- Row Level Security — travel-app
-- ============================================================================
-- סטטוס: הופעל בפועל מול DB חי ב-Supabase (2026-08-17, שלב E).
--
-- **תוקן 2026-08-17:** הגרסה המקורית של הקובץ הזה נכתבה לפני שהיה DB חי,
-- והניחה בטעות שמות עמודות snake_case (user_id, trip_id וכו'). בפועל
-- schema.prisma לא מגדיר @map ברמת שדה בשום מקום — Prisma יוצר את כל
-- העמודות בדיוק בשם ה-camelCase שבסכימה (userId, tripId, bookingId וכו'),
-- מצוטט (case-sensitive). הניסיון הראשון להריץ את המיגרציה נכשל עם
-- "column \"user_id\" does not exist" (P3018) — כל הפניה לעמודה כאן תוקנה
-- ל-camelCase מצוטט בהתאם לעמודות האמיתיות שנוצרו בפועל. שמות הטבלאות עצמם
-- (trips, places וכו') כן snake_case כי אלה מוגדרים דרך @@map ברמת המודל —
-- לא נגעו בהם, הם היו נכונים מההתחלה.
--
-- עקרון: userId בטבלת trips (ובטבלאות עם userId ישיר) חייב להיות שווה בדיוק
-- ל-auth.uid() של המשתמש המחובר ב-Supabase Auth. זה אומר שברגע שמשתמש נרשם,
-- השורה שלו ב-public.users חייבת להיווצר עם id = auth.uid() — לא UUID אקראי
-- שמייצר Prisma. הטריגר למטה (handle_new_auth_user) עושה את זה אוטומטית.
-- ============================================================================

-- ----------------------------------------------------------------------------
-- 1. טריגר: יצירת שורת public.users אוטומטית עם כל הרשמה ל-Supabase Auth
-- ----------------------------------------------------------------------------
create or replace function public.handle_new_auth_user()
returns trigger
language plpgsql
security definer set search_path = public
as $$
begin
  -- legalConsentAcceptedAt מגיע מ-user_metadata שנשלח ב-supabase.auth.signUp()
  -- (ראה apps/web/app/register/page.tsx) — לא אישור בדיעבד, אלא רגע ההרשמה עצמו.
  insert into public.users (id, email, locale, "createdAt", "legalConsentAcceptedAt")
  values (
    new.id::text,
    new.email,
    'he',
    now(),
    (new.raw_user_meta_data->>'legal_consent_accepted_at')::timestamptz
  )
  on conflict (id) do nothing;
  return new;
end;
$$;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_new_auth_user();

-- ----------------------------------------------------------------------------
-- 1ב. טריגר-מראה: מחיקת שורת public.users כשמוחקים משתמש מ-Supabase Auth
-- ----------------------------------------------------------------------------
-- **נוסף 2026-08-26** — נמצא בבדיקה חיה: מחיקת משתמש-בדיקה דרך
-- admin.deleteUser() הסירה את auth.users אבל השאירה orphan record ב-
-- public.users (אין FK/trigger שמצליב בכיוון ההפוך). זה מפר את העיקרון
-- "בלי יצירת orphan records" (PROJECT_REQUIREMENTS.md סעיף 0). אין
-- onDelete: Cascade על שום relation ב-schema.prisma (User.id←Trip.userId
-- וכו'), אז אם למשתמש יש עדיין טיולים/מקומות/וכו' המחיקה כאן תיכשל על
-- foreign-key violation — זו התנהגות בטוחה ומכוונת, לא מוגבלת בכוונה
-- ליותר מזה: היא מונעת מחיקה שקטה של נתוני-משתמש אמיתיים. מחיקת חשבון
-- עם נתונים קיימים דורשת זרימת-מחיקה ייעודית (לא קיימת עדיין).
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

-- ----------------------------------------------------------------------------
-- 2. פונקציות עזר לבדיקת בעלות (נמנעות מכפילות EXISTS בכל policy)
-- ----------------------------------------------------------------------------
create or replace function public.is_trip_owner(p_trip_id text)
returns boolean language sql security definer stable as $$
  select exists (select 1 from public.trips where id = p_trip_id and "userId" = auth.uid()::text);
$$;

create or replace function public.is_booking_owner(p_booking_id text)
returns boolean language sql security definer stable as $$
  select exists (
    select 1 from public.bookings b where b.id = p_booking_id and public.is_trip_owner(b."tripId")
  );
$$;

create or replace function public.is_expense_owner(p_expense_id text)
returns boolean language sql security definer stable as $$
  select exists (
    select 1 from public.expenses e where e.id = p_expense_id and public.is_trip_owner(e."tripId")
  );
$$;

create or replace function public.is_wallet_owner(p_wallet_id text)
returns boolean language sql security definer stable as $$
  select exists (
    select 1 from public.wallets w where w.id = p_wallet_id and public.is_trip_owner(w."tripId")
  );
$$;

create or replace function public.is_companion_poll_owner(p_poll_id text)
returns boolean language sql security definer stable as $$
  select exists (
    select 1 from public.companion_polls p where p.id = p_poll_id and public.is_trip_owner(p."tripId")
  );
$$;

-- "tripId" יכול להיות null כש-entityType='place' (ישות גלובלית, לא פר-טיול —
-- ר' ההערה המקבילה ב-schema.prisma). is_trip_owner(null) תמיד false, אז חייב
-- OR מפורש דרך בעלות-על-המקום, אחרת תמונות-מקום ייחסמו לגמרי ע"י RLS.
create or replace function public.is_place_owner(p_place_id text)
returns boolean language sql security definer stable as $$
  select exists (select 1 from public.places where id = p_place_id and "userId" = auth.uid()::text);
$$;

create or replace function public.is_document_owner(p_document_id text)
returns boolean language sql security definer stable as $$
  select exists (
    select 1 from public.documents d
    where d.id = p_document_id
      and (
        (d."tripId" is not null and public.is_trip_owner(d."tripId"))
        or (d."tripId" is null and d."entityType" = 'place' and public.is_place_owner(d."entityId"))
      )
  );
$$;

create or replace function public.is_route_owner(p_route_id text)
returns boolean language sql security definer stable as $$
  select exists (
    select 1 from public.routes r
    join public.trip_days td on td.id = r."tripDayId"
    where r.id = p_route_id and public.is_trip_owner(td."tripId")
  );
$$;

-- ----------------------------------------------------------------------------
-- 3. users — כל משתמש רואה/מעדכן רק את עצמו. אין insert/delete מהלקוח.
-- ----------------------------------------------------------------------------
alter table public.users enable row level security;
create policy "users_select_own" on public.users for select using (id = auth.uid()::text);
create policy "users_update_own" on public.users for update using (id = auth.uid()::text);

-- ----------------------------------------------------------------------------
-- 4. trips — הישות השורש. אין policy למחיקה קשיחה (Soft Delete בלבד = update).
-- ----------------------------------------------------------------------------
alter table public.trips enable row level security;
create policy "trips_select_own" on public.trips for select using ("userId" = auth.uid()::text);
create policy "trips_insert_own" on public.trips for insert with check ("userId" = auth.uid()::text);
create policy "trips_update_own" on public.trips for update using ("userId" = auth.uid()::text);

-- ----------------------------------------------------------------------------
-- 5. טבלאות עם tripId ישיר — פוליסה אחידה דרך is_trip_owner()
-- ----------------------------------------------------------------------------
do $$
declare
  t text;
  tables text[] := array[
    'trip_days', 'trip_countries', 'trip_cities', 'trip_date_change_logs',
    'trip_settings', 'trip_companions', 'trip_places', 'planned_activities',
    'bookings', 'expenses', 'wallets', 'currency_exchanges', 'deposits',
    'refunds', 'notification_preferences', 'transport_quotes', 'trip_share_links', 'companion_polls'
  ];
begin
  foreach t in array tables loop
    execute format('alter table public.%I enable row level security;', t);
    execute format(
      'create policy "%s_all_own" on public.%I for all using (public.is_trip_owner("tripId")) with check (public.is_trip_owner("tripId"));',
      t, t
    );
  end loop;
end $$;

-- documents יצא מהלולאה הגנרית למעלה כי "tripId" יכול להיות null (תמונות-
-- מקום, entityType='place') — צריך OR מפורש עם is_place_owner, ר' ההערה
-- ליד is_document_owner() למעלה.
alter table public.documents enable row level security;
create policy "documents_all_own" on public.documents for all using (
  ("tripId" is not null and public.is_trip_owner("tripId"))
  or ("tripId" is null and "entityType" = 'place' and public.is_place_owner("entityId"))
) with check (
  ("tripId" is not null and public.is_trip_owner("tripId"))
  or ("tripId" is null and "entityType" = 'place' and public.is_place_owner("entityId"))
);

-- ----------------------------------------------------------------------------
-- 6. טבלאות עם userId ישיר (לא דרך trip)
-- ----------------------------------------------------------------------------
alter table public.places enable row level security;
create policy "places_all_own" on public.places for all
  using ("userId" = auth.uid()::text) with check ("userId" = auth.uid()::text);

alter table public.contacts enable row level security;
create policy "contacts_all_own" on public.contacts for all
  using ("userId" = auth.uid()::text) with check ("userId" = auth.uid()::text);

alter table public.payment_cards enable row level security;
create policy "payment_cards_all_own" on public.payment_cards for all
  using ("userId" = auth.uid()::text) with check ("userId" = auth.uid()::text);

alter table public.integration_accounts enable row level security;
create policy "integration_accounts_all_own" on public.integration_accounts for all
  using ("userId" = auth.uid()::text) with check ("userId" = auth.uid()::text);

alter table public.loyalty_programs enable row level security;
create policy "loyalty_programs_all_own" on public.loyalty_programs for all
  using ("userId" = auth.uid()::text) with check ("userId" = auth.uid()::text);

alter table public.status_history enable row level security;
create policy "status_history_all_own" on public.status_history for all
  using ("userId" = auth.uid()::text) with check ("userId" = auth.uid()::text);

alter table public.audit_log enable row level security;
create policy "audit_log_select_own" on public.audit_log for select using ("userId" = auth.uid()::text);
create policy "audit_log_insert_own" on public.audit_log for insert with check ("userId" = auth.uid()::text);
-- אין update/delete על audit_log — append-only מכוון.

-- ----------------------------------------------------------------------------
-- 7. טבלאות מקוננות תחת Booking
-- ----------------------------------------------------------------------------
do $$
declare
  t text;
  tables text[] := array[
    'hotel_stays', 'flights', 'transport_bookings', 'insurances',
    'booking_benefits', 'booking_participants'
  ];
begin
  foreach t in array tables loop
    execute format('alter table public.%I enable row level security;', t);
    execute format(
      'create policy "%s_all_own" on public.%I for all using (public.is_booking_owner("bookingId")) with check (public.is_booking_owner("bookingId"));',
      t, t
    );
  end loop;
end $$;

-- ----------------------------------------------------------------------------
-- 8. payments — קשור ל-booking או ל-expense (אחד מהשניים, ראה schema.prisma)
-- ----------------------------------------------------------------------------
alter table public.payments enable row level security;
create policy "payments_all_own" on public.payments for all
  using (
    ("bookingId" is not null and public.is_booking_owner("bookingId"))
    or ("expenseId" is not null and public.is_expense_owner("expenseId"))
  )
  with check (
    ("bookingId" is not null and public.is_booking_owner("bookingId"))
    or ("expenseId" is not null and public.is_expense_owner("expenseId"))
  );

-- ----------------------------------------------------------------------------
-- 8b. expense_participants — מי משתתף בכל הוצאה (חלוקת-הוצאות/סגירת-חשבונות), דרך expenseId
-- ----------------------------------------------------------------------------
alter table public.expense_participants enable row level security;
create policy "expense_participants_all_own" on public.expense_participants for all
  using (public.is_expense_owner("expenseId"))
  with check (public.is_expense_owner("expenseId"));

-- ----------------------------------------------------------------------------
-- 8c. companion_poll_options / companion_poll_votes — דרך pollId (companion_polls עצמה כבר בלולאה הגנרית בסעיף 5)
-- ----------------------------------------------------------------------------
alter table public.companion_poll_options enable row level security;
create policy "companion_poll_options_all_own" on public.companion_poll_options for all
  using (public.is_companion_poll_owner("pollId"))
  with check (public.is_companion_poll_owner("pollId"));

alter table public.companion_poll_votes enable row level security;
create policy "companion_poll_votes_all_own" on public.companion_poll_votes for all
  using (public.is_companion_poll_owner("pollId"))
  with check (public.is_companion_poll_owner("pollId"));

-- ----------------------------------------------------------------------------
-- 9. wallet_transactions — דרך walletId
-- ----------------------------------------------------------------------------
alter table public.wallet_transactions enable row level security;
create policy "wallet_transactions_all_own" on public.wallet_transactions for all
  using (public.is_wallet_owner("walletId")) with check (public.is_wallet_owner("walletId"));

-- ----------------------------------------------------------------------------
-- 10. document_extracted_fields — דרך documentId
-- ----------------------------------------------------------------------------
alter table public.document_extracted_fields enable row level security;
create policy "document_extracted_fields_all_own" on public.document_extracted_fields for all
  using (public.is_document_owner("documentId")) with check (public.is_document_owner("documentId"));

-- ----------------------------------------------------------------------------
-- 11. routes / route_stops — דרך tripDay -> trip
-- ----------------------------------------------------------------------------
alter table public.routes enable row level security;
create policy "routes_all_own" on public.routes for all
  using (public.is_trip_owner((select "tripId" from public.trip_days where id = "tripDayId")))
  with check (public.is_trip_owner((select "tripId" from public.trip_days where id = "tripDayId")));

alter table public.route_stops enable row level security;
create policy "route_stops_all_own" on public.route_stops for all
  using (public.is_route_owner("routeId")) with check (public.is_route_owner("routeId"));

-- ----------------------------------------------------------------------------
-- 12. currencies — טבלת עזר גלובלית (לא נתוני משתמש) — קריאה לכולם, כתיבה לאף אחד מהלקוח
-- ----------------------------------------------------------------------------
alter table public.currencies enable row level security;
create policy "currencies_select_all" on public.currencies for select using (true);

-- ----------------------------------------------------------------------------
-- 13. weather_forecast_snapshots / weather_alerts — cache גלובלי לפי מיקום+זמן,
-- לא נתוני משתמש. קריאה פתוחה למחוברים; כתיבה רק דרך lib/supabase/admin.ts
-- (Secret key, עוקף RLS) בקוד שרת — לכן אין policy ל-insert/update/delete כאן בכוונה.
-- ----------------------------------------------------------------------------
alter table public.weather_forecast_snapshots enable row level security;
create policy "weather_forecast_snapshots_select_all" on public.weather_forecast_snapshots
  for select using (auth.role() = 'authenticated');

alter table public.weather_alerts enable row level security;
create policy "weather_alerts_select_all" on public.weather_alerts
  for select using (auth.role() = 'authenticated');
