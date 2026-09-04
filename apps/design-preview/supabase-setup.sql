-- ============================================================================
-- design-preview — הקמת טבלאות במסד-הנתונים (חד-פעמי)
-- ============================================================================
-- להריץ פעם אחת בלוח הבקרה של Supabase: Dashboard → SQL Editor → New query
-- → הדבקת כל הקובץ הזה → Run.
--
-- כל הטבלאות מתחילות ב-dp_ בכוונה, כדי שלא יהיה שום סיכוי להתנגשות עם
-- הטבלאות האמיתיות של apps/web (trips, bookings, users, flights וכו') שכבר
-- קיימות באותו מסד-נתונים בדיוק.
--
-- בדיקת-תקינות אחרי ההרצה: select count(*) from dp_trips; אמור להחזיר 0
-- בלי שגיאה.
-- ============================================================================

create extension if not exists pgcrypto;

-- ============================== טיולים ==============================

create table dp_trips (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  name text not null,
  country_code text not null,
  status text not null check (status in ('upcoming', 'active', 'completed')),
  start_date date not null,
  end_date date not null,
  nights integer not null,
  travelers integer not null default 1,
  created_at timestamptz not null default now()
);
-- לכל משתמש יכול להיות רק טיול "פעיל" אחד בו-זמנית
create unique index dp_trips_one_active_per_user on dp_trips (user_id) where status = 'active';
create index dp_trips_user_id on dp_trips (user_id);

alter table dp_trips enable row level security;
create policy dp_trips_select on dp_trips for select using (user_id = auth.uid());
create policy dp_trips_insert on dp_trips for insert with check (user_id = auth.uid());
create policy dp_trips_update on dp_trips for update using (user_id = auth.uid()) with check (user_id = auth.uid());
create policy dp_trips_delete on dp_trips for delete using (user_id = auth.uid());

-- ============================== ארנק ==============================

create table dp_wallet_settings (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  trip_id uuid not null unique references dp_trips(id) on delete cascade,
  base_currency text not null default 'ILS',
  manual_country_code text,
  geo_country_code text,
  last_backup_at timestamptz
);

create table dp_wallet_balances (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  trip_id uuid not null references dp_trips(id) on delete cascade,
  code text not null,
  balance numeric not null default 0,
  spent numeric not null default 0,
  last_updated date not null,
  position integer not null default 0,
  unique (trip_id, code)
);

create table dp_wallet_cards (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  trip_id uuid not null references dp_trips(id) on delete cascade,
  nickname text not null,
  issuer text not null,
  last4 text not null,
  currency text not null,
  fee_percent numeric,
  color text not null,
  is_primary boolean not null default false
);
create unique index dp_wallet_cards_one_primary_per_trip on dp_wallet_cards (trip_id) where is_primary;

create table dp_wallet_expenses (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  trip_id uuid not null references dp_trips(id) on delete cascade,
  title text not null,
  merchant text,
  category text not null,
  currency text not null,
  amount numeric not null,
  tip_amount numeric,
  date date not null,
  time text,
  payment_method text not null,
  card_id uuid references dp_wallet_cards(id) on delete set null,
  receipt_path text,
  notes text
);

create table dp_wallet_additions (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  trip_id uuid not null references dp_trips(id) on delete cascade,
  currency text not null,
  amount numeric not null,
  source text not null,
  date date not null,
  note text
);

create table dp_wallet_conversions (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  trip_id uuid not null references dp_trips(id) on delete cascade,
  from_currency text not null,
  from_amount numeric not null,
  to_currency text not null,
  to_amount numeric not null,
  fee numeric,
  location text,
  date_time timestamptz not null,
  effective_rate numeric not null,
  market_rate_at_time numeric
);

create table dp_wallet_deposits (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  trip_id uuid not null references dp_trips(id) on delete cascade,
  title text not null,
  amount numeric not null,
  currency text not null,
  payment_method text not null,
  card_id uuid references dp_wallet_cards(id) on delete set null,
  booking_id uuid,
  date_given date not null,
  expected_return_date date,
  expected_return_time text,
  status text not null check (status in ('pending', 'returned')),
  returned_date date,
  notes text
);

-- ============================== מסלול ==============================

create table dp_trip_stops (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  trip_id uuid not null references dp_trips(id) on delete cascade,
  city text not null,
  country_code text not null,
  start_date date not null,
  end_date date not null,
  transport_to_next text,
  status text,
  hotel text,
  attractions text[],
  restaurants text[],
  lat double precision,
  lon double precision
);

create table dp_trip_activities (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  trip_id uuid not null references dp_trips(id) on delete cascade,
  date date not null,
  time text not null,
  duration_label text,
  title text not null,
  category text not null,
  location text,
  notes text,
  lat double precision,
  lon double precision
);

-- ============================== הזמנות ==============================

create table dp_bookings (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  trip_id uuid not null references dp_trips(id) on delete cascade,
  category text not null,
  title text not null,
  confirmation_number text,
  status text not null check (status in ('confirmed', 'pending', 'cancelled')),
  check_in date not null,
  check_out date,
  address text,
  guests integer,
  total_price text,
  phone text
);

alter table dp_wallet_deposits add constraint dp_wallet_deposits_booking_fk
  foreign key (booking_id) references dp_bookings(id) on delete set null;

-- ============================== אריזה + מעקב אישי ==============================

create table dp_packing_lists (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  trip_id uuid not null unique references dp_trips(id) on delete cascade,
  categories jsonb not null default '[]',
  updated_at timestamptz not null default now()
);

create table dp_tracker_lists (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  trip_id uuid not null unique references dp_trips(id) on delete cascade,
  massages jsonb not null default '[]',
  tips jsonb not null default '[]',
  fruits jsonb not null default '[]',
  updated_at timestamptz not null default now()
);

-- ============================== מסמכים / פרופיל / הגדרות (גלובלי, לא לפי טיול) ==============================

create table dp_documents (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  kind text not null check (kind in ('insurance', 'passport', 'flight', 'hotel', 'other')),
  title text not null,
  storage_path text not null,
  created_at timestamptz not null default now()
);

create table dp_profile (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null unique references auth.users(id) on delete cascade,
  name text not null default '',
  phone text not null default '',
  email text not null default '',
  country_code text not null default 'IL',
  language text not null default 'he',
  base_currency text not null default 'ILS',
  emergency_contact_name text not null default '',
  emergency_contact_phone text not null default '',
  photo_storage_path text
);

create table dp_settings (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null unique references auth.users(id) on delete cascade,
  temperature_unit text not null default 'C' check (temperature_unit in ('C', 'F'))
);

create table dp_custom_categories (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  name text not null,
  unique (user_id, name)
);

create table dp_import_log (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null unique references auth.users(id) on delete cascade,
  imported_at timestamptz not null default now()
);

-- ============================================================================
-- אינדקסים לפי trip_id (לביצועים — כל מסך קורא "כל השורות של הטיול הזה")
-- ============================================================================

create index dp_wallet_settings_trip_id on dp_wallet_settings (trip_id);
create index dp_wallet_balances_trip_id on dp_wallet_balances (trip_id);
create index dp_wallet_cards_trip_id on dp_wallet_cards (trip_id);
create index dp_wallet_expenses_trip_id on dp_wallet_expenses (trip_id);
create index dp_wallet_additions_trip_id on dp_wallet_additions (trip_id);
create index dp_wallet_conversions_trip_id on dp_wallet_conversions (trip_id);
create index dp_wallet_deposits_trip_id on dp_wallet_deposits (trip_id);
create index dp_trip_stops_trip_id on dp_trip_stops (trip_id);
create index dp_trip_activities_trip_id on dp_trip_activities (trip_id);
create index dp_bookings_trip_id on dp_bookings (trip_id);

-- ============================================================================
-- הגנת-פרטיות (RLS): כל משתמש רואה ויכול לערוך רק את השורות שלו.
-- לטבלאות ששייכות לטיול, ה-insert/update גם מוודאים שהטיול עצמו שייך
-- לאותו משתמש (לא ניתן "לתלות" שורה על טיול של מישהו אחר).
-- ============================================================================

do $$
declare
  trip_scoped_tables text[] := array[
    'dp_wallet_settings', 'dp_wallet_balances', 'dp_wallet_cards',
    'dp_wallet_expenses', 'dp_wallet_additions', 'dp_wallet_conversions',
    'dp_wallet_deposits', 'dp_trip_stops', 'dp_trip_activities', 'dp_bookings'
  ];
  global_tables text[] := array[
    'dp_documents', 'dp_profile', 'dp_settings', 'dp_custom_categories', 'dp_import_log'
  ];
  t text;
begin
  foreach t in array trip_scoped_tables loop
    execute format('alter table %I enable row level security', t);
    execute format('create policy %I_select on %I for select using (user_id = auth.uid())', t, t);
    execute format(
      'create policy %I_insert on %I for insert with check (user_id = auth.uid() and trip_id in (select id from dp_trips where user_id = auth.uid()))',
      t, t
    );
    execute format(
      'create policy %I_update on %I for update using (user_id = auth.uid()) with check (user_id = auth.uid() and trip_id in (select id from dp_trips where user_id = auth.uid()))',
      t, t
    );
    execute format('create policy %I_delete on %I for delete using (user_id = auth.uid())', t, t);
  end loop;

  foreach t in array global_tables loop
    execute format('alter table %I enable row level security', t);
    execute format('create policy %I_select on %I for select using (user_id = auth.uid())', t, t);
    execute format('create policy %I_insert on %I for insert with check (user_id = auth.uid())', t, t);
    execute format('create policy %I_update on %I for update using (user_id = auth.uid()) with check (user_id = auth.uid())', t, t);
    execute format('create policy %I_delete on %I for delete using (user_id = auth.uid())', t, t);
  end loop;
end $$;

-- ============================================================================
-- אחסון תמונות: 3 "תיקיות" פרטיות. כל קובץ נשמר תחת נתיב שמתחיל במזהה
-- המשתמש עצמו (למשל <user_id>/<file>), וה-policy מוודאת שרק הבעלים יכול
-- לגשת אליו.
-- ============================================================================

insert into storage.buckets (id, name, public)
values ('dp-receipts', 'dp-receipts', false),
       ('dp-documents', 'dp-documents', false),
       ('dp-profile-photos', 'dp-profile-photos', false)
on conflict (id) do nothing;

create policy dp_receipts_owner on storage.objects for all
  using (bucket_id = 'dp-receipts' and (storage.foldername(name))[1] = auth.uid()::text)
  with check (bucket_id = 'dp-receipts' and (storage.foldername(name))[1] = auth.uid()::text);

create policy dp_documents_owner on storage.objects for all
  using (bucket_id = 'dp-documents' and (storage.foldername(name))[1] = auth.uid()::text)
  with check (bucket_id = 'dp-documents' and (storage.foldername(name))[1] = auth.uid()::text);

create policy dp_profile_photos_owner on storage.objects for all
  using (bucket_id = 'dp-profile-photos' and (storage.foldername(name))[1] = auth.uid()::text)
  with check (bucket_id = 'dp-profile-photos' and (storage.foldername(name))[1] = auth.uid()::text);

-- ============================================================================
-- סוף. אחרי ההרצה: select count(*) from dp_trips; אמור להחזיר 0 בלי שגיאה.
-- ============================================================================
