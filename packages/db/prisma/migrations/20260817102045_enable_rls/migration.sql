-- ============================================================================
-- Row Level Security — travel-app
-- ============================================================================
-- הועתק מ-packages/db/prisma/rls_policies.sql (ראה שם לתיעוד המלא של כל סעיף,
-- כולל הערה על התיקון מ-2026-08-17: כל שם עמודה תוקן מ-snake_case שגוי
-- ל-camelCase מצוטט, אחרי שהניסיון הראשון נכשל עם P3018/42703).
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

create or replace function public.is_document_owner(p_document_id text)
returns boolean language sql security definer stable as $$
  select exists (
    select 1 from public.documents d where d.id = p_document_id and public.is_trip_owner(d."tripId")
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
    'refunds', 'documents', 'notification_preferences', 'transport_quotes'
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
