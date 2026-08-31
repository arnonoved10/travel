-- ============================================================================
-- אימות ידני של המודל היחסי מול Postgres אמיתי (psql), ללא תלות ב-npm/Prisma
-- CLI, כי סביבת ה-Sandbox הזו חוסמת גישה לרשם npm (ראה דוח שלב 0).
-- קובץ זה משקף את packages/db/prisma/schema.prisma טבלה-טבלה כדי לוודא
-- שהמבנה היחסי בפועל (טיפוסים, מפתחות זרים, ייחודיות, כולל היחס המעגלי
-- TransportBooking <-> TransportQuote) אכן נבנה בהצלחה על Postgres אמיתי.
-- ============================================================================

BEGIN;

-- ---------------------------------------------------------------------------
-- ENUMS
-- ---------------------------------------------------------------------------
CREATE TYPE trip_status AS ENUM ('planning','upcoming','active','completed','archived');
CREATE TYPE lifecycle_status AS ENUM ('want_to_book','planned','need_to_book','booked','partially_paid','paid','done','not_done','postponed','cancelled');
CREATE TYPE trip_place_status AS ENUM ('want_to_go','planned','visited','not_visited','favorite','dont_return');
CREATE TYPE place_category AS ENUM ('hotel','restaurant','cafe','bar','mall','shop','massage','attraction','beach','nature','waterfall','viewpoint','market','airport','port','train_station','hospital','pharmacy','chabad_house','car_rental_company','other');
CREATE TYPE booking_type AS ENUM ('hotel_stay','flight','transport','car_rental','insurance','activity_reservation','other');
CREATE TYPE booking_source AS ENUM ('booking_com','agoda','hotels_com','expedia','hotel_website','direct','agent','bolt','grab','other');
CREATE TYPE meal_plan AS ENUM ('none','breakfast_included','breakfast_paid','half_board','full_board','all_inclusive');
CREATE TYPE breakfast_price_unit AS ENUM ('per_person','per_room','per_day','per_stay');
CREATE TYPE flight_leg_type AS ENUM ('outbound','return','internal','connecting');
CREATE TYPE transport_mode AS ENUM ('taxi','private_transfer','ferry','train','bus','water_taxi','other');
CREATE TYPE vehicle_type AS ENUM ('small','sedan','large','suv','minivan','van','luxury','vip','other');
CREATE TYPE benefit_type AS ENUM ('breakfast','airport_transfer','early_checkin','late_checkout','room_upgrade','lounge_access','parking','wifi','pool_access','gym','spa','hotel_credit','other');
CREATE TYPE expense_category AS ENUM ('hotel','flight','transport','car_rental','food','cafe','bar','massage','shopping','fruit','attraction','insurance','tip','other');
CREATE TYPE payment_method AS ENUM ('cash','credit_card','digital_wallet','bank_transfer','other');
CREATE TYPE wallet_tx_type AS ENUM ('cash_payment_out','top_up','exchange_out','exchange_in','refund_in','deposit_out','deposit_return_in');
CREATE TYPE document_entity_type AS ENUM ('booking','expense','payment','hotel_stay','flight','transport_booking','insurance','place','planned_activity','other');
CREATE TYPE document_type AS ENUM ('booking_confirmation','receipt','invoice','payment_confirmation','voucher','ticket','policy','contract','screenshot','image','pdf','other');
CREATE TYPE ocr_status AS ENUM ('pending','parsed','needs_confirmation','confirmed','failed');
CREATE TYPE contact_category AS ENUM ('hotel','driver','taxi_company','insurance','rental_company','airline','ferry','guide','agent','attraction','other');
CREATE TYPE status_history_entity_type AS ENUM ('planned_activity','booking');
CREATE TYPE audit_action AS ENUM ('create','update','delete','status_change');
CREATE TYPE integration_service AS ENUM ('booking_com','agoda','hotels_com','expedia','bolt','grab','airline','car_rental_company','insurance_company','other');
CREATE TYPE integration_type AS ENUM ('manual_link','oauth_data_portability');
CREATE TYPE data_source AS ENUM ('manual','document','ocr','api','imported','ai_suggested');
CREATE TYPE notification_event_type AS ENUM ('flight_approaching','need_to_leave_for_airport','taxi_approaching','checkout_approaching','unpaid_booking','night_without_hotel','activity_not_booked','deposit_due_return','insurance_ending','overdue_not_marked_done');
CREATE TYPE travel_mode AS ENUM ('walk','taxi','public_transport','rental_car','other');

-- ---------------------------------------------------------------------------
-- Currency, User
-- ---------------------------------------------------------------------------
CREATE TABLE currencies (
  code TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  symbol TEXT NOT NULL,
  decimal_digits INT NOT NULL DEFAULT 2
);

CREATE TABLE users (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  email TEXT NOT NULL UNIQUE,
  display_name TEXT,
  default_currency_code TEXT,
  locale TEXT NOT NULL DEFAULT 'he',
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- ---------------------------------------------------------------------------
-- Trip + companions/settings/date-change-log/countries/cities/days
-- ---------------------------------------------------------------------------
CREATE TABLE trips (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES users(id),
  name TEXT NOT NULL,
  status trip_status NOT NULL DEFAULT 'planning',
  start_date DATE NOT NULL,
  end_date DATE NOT NULL,
  base_currency_code TEXT REFERENCES currencies(code),
  primary_timezone TEXT,
  cover_image_url TEXT,
  notes TEXT,
  deleted_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE INDEX idx_trips_user_status ON trips(user_id, status);

CREATE TABLE trip_days (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  trip_id UUID NOT NULL REFERENCES trips(id),
  calendar_date DATE NOT NULL,
  day_index INT,
  notes TEXT,
  UNIQUE (trip_id, calendar_date)
);

CREATE TABLE trip_countries (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  trip_id UUID NOT NULL REFERENCES trips(id),
  country_name TEXT NOT NULL,
  order_index INT NOT NULL DEFAULT 0
);

CREATE TABLE trip_cities (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  trip_id UUID NOT NULL REFERENCES trips(id),
  country_id UUID REFERENCES trip_countries(id),
  city_name TEXT NOT NULL,
  order_index INT NOT NULL DEFAULT 0
);

CREATE TABLE trip_date_change_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  trip_id UUID NOT NULL REFERENCES trips(id),
  old_start_date DATE NOT NULL,
  old_end_date DATE NOT NULL,
  new_start_date DATE NOT NULL,
  new_end_date DATE NOT NULL,
  changed_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  impact_report JSONB
);

CREATE TABLE trip_settings (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  trip_id UUID NOT NULL UNIQUE REFERENCES trips(id),
  airport_lead_time_international_minutes INT NOT NULL DEFAULT 180,
  airport_lead_time_domestic_minutes INT NOT NULL DEFAULT 120,
  status_colors JSONB,
  default_currency_code TEXT,
  near_me_default_radius_m INT NOT NULL DEFAULT 1000
);

CREATE TABLE trip_companions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  trip_id UUID NOT NULL REFERENCES trips(id),
  display_name TEXT NOT NULL,
  relation TEXT,
  notes TEXT,
  deleted_at TIMESTAMPTZ
);

-- ---------------------------------------------------------------------------
-- Place (גלובלי) + TripPlace
-- ---------------------------------------------------------------------------
CREATE TABLE places (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  category place_category NOT NULL,
  address TEXT,
  country TEXT,
  city TEXT,
  lat DOUBLE PRECISION,
  lng DOUBLE PRECISION,
  official_website TEXT,
  phone TEXT,
  whatsapp TEXT,
  email TEXT,
  opening_hours JSONB,
  general_notes TEXT,
  is_favorite BOOLEAN NOT NULL DEFAULT false,
  dont_return BOOLEAN NOT NULL DEFAULT false,
  map_link TEXT,
  website_link TEXT,
  extra_links JSONB,
  deleted_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE INDEX idx_places_category ON places(category);

CREATE TABLE trip_places (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  trip_id UUID NOT NULL REFERENCES trips(id),
  place_id UUID NOT NULL REFERENCES places(id),
  status trip_place_status NOT NULL DEFAULT 'want_to_go',
  notes TEXT,
  deleted_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE (trip_id, place_id)
);

-- ---------------------------------------------------------------------------
-- Booking (ליבה) — נוצר לפני PlannedActivity כדי לפתור את הקשר ההדדי (0/1)
-- ---------------------------------------------------------------------------
CREATE TABLE bookings (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  trip_id UUID NOT NULL REFERENCES trips(id),
  place_id UUID REFERENCES places(id),
  booking_type booking_type NOT NULL,
  status lifecycle_status NOT NULL DEFAULT 'need_to_book',
  agreed_price NUMERIC(12,2),
  agreed_currency_code TEXT,
  source booking_source,
  source_other TEXT,
  provider_name TEXT,
  external_booking_id TEXT,
  confirmation_number TEXT,
  booking_link TEXT,
  manage_booking_link TEXT,
  phone TEXT,
  whatsapp TEXT,
  email TEXT,
  website TEXT,
  notes TEXT,
  data_source data_source NOT NULL DEFAULT 'manual',
  is_confirmed BOOLEAN NOT NULL DEFAULT true,
  deleted_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE INDEX idx_bookings_trip_type ON bookings(trip_id, booking_type);
CREATE INDEX idx_bookings_trip_status ON bookings(trip_id, status);

-- ---------------------------------------------------------------------------
-- Planned Activity — 0/1 עם Booking (bookingId ייחודי, nullable)
-- ---------------------------------------------------------------------------
CREATE TABLE planned_activities (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  trip_id UUID NOT NULL REFERENCES trips(id),
  place_id UUID REFERENCES places(id),
  booking_id UUID UNIQUE REFERENCES bookings(id),
  name TEXT NOT NULL,
  activity_type TEXT,
  planned_at TIMESTAMPTZ,
  planned_timezone TEXT,
  estimated_duration_minutes INT,
  estimated_price NUMERIC(12,2),
  estimated_currency_code TEXT,
  notes TEXT,
  link TEXT,
  status lifecycle_status NOT NULL DEFAULT 'want_to_book',
  data_source data_source NOT NULL DEFAULT 'manual',
  is_confirmed BOOLEAN NOT NULL DEFAULT true,
  deleted_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE INDEX idx_pa_trip_status ON planned_activities(trip_id, status);
CREATE INDEX idx_pa_trip_planned_at ON planned_activities(trip_id, planned_at);

CREATE TABLE booking_participants (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  booking_id UUID NOT NULL REFERENCES bookings(id),
  companion_id UUID NOT NULL REFERENCES trip_companions(id),
  UNIQUE (booking_id, companion_id)
);

-- ---------------------------------------------------------------------------
-- פירוט הזמנה לפי סוג (1-על-1 עם bookings)
-- ---------------------------------------------------------------------------
CREATE TABLE hotel_stays (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  booking_id UUID NOT NULL UNIQUE REFERENCES bookings(id),
  hotel_name TEXT NOT NULL,
  address TEXT,
  lat DOUBLE PRECISION,
  lng DOUBLE PRECISION,
  check_in_date DATE NOT NULL,
  check_out_date DATE NOT NULL,
  nights INT,
  check_in_time TEXT,
  check_out_time TEXT,
  timezone TEXT,
  early_check_in BOOLEAN NOT NULL DEFAULT false,
  early_check_in_cost NUMERIC(12,2),
  late_check_out BOOLEAN NOT NULL DEFAULT false,
  late_check_out_cost NUMERIC(12,2),
  room_type TEXT,
  bed_type TEXT,
  floor TEXT,
  view TEXT,
  smoking BOOLEAN,
  guests_count INT,
  price_per_night NUMERIC(12,2),
  meal_plan meal_plan NOT NULL DEFAULT 'none',
  breakfast_price NUMERIC(12,2),
  breakfast_price_unit breakfast_price_unit,
  breakfast_hours TEXT,
  breakfast_location TEXT
);
CREATE INDEX idx_hotel_stays_dates ON hotel_stays(check_in_date, check_out_date);

CREATE TABLE flights (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  booking_id UUID NOT NULL UNIQUE REFERENCES bookings(id),
  airline TEXT NOT NULL,
  flight_number TEXT,
  departure_airport TEXT NOT NULL,
  arrival_airport TEXT NOT NULL,
  departure_terminal TEXT,
  arrival_terminal TEXT,
  departure_at TIMESTAMPTZ NOT NULL,
  departure_timezone TEXT NOT NULL,
  arrival_at TIMESTAMPTZ NOT NULL,
  arrival_timezone TEXT NOT NULL,
  duration_minutes INT,
  seat TEXT,
  baggage TEXT,
  leg_type flight_leg_type NOT NULL DEFAULT 'outbound'
);
CREATE INDEX idx_flights_departure ON flights(departure_at);

-- transport_bookings <-> transport_quotes: קשר מעגלי מכוון (בדיוק כמו בפריזמה)
CREATE TABLE transport_bookings (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  booking_id UUID NOT NULL UNIQUE REFERENCES bookings(id),
  mode transport_mode NOT NULL,
  pickup_text TEXT,
  pickup_lat DOUBLE PRECISION,
  pickup_lng DOUBLE PRECISION,
  dropoff_text TEXT,
  dropoff_lat DOUBLE PRECISION,
  dropoff_lng DOUBLE PRECISION,
  pickup_at TIMESTAMPTZ NOT NULL,
  pickup_timezone TEXT NOT NULL,
  eta_at TIMESTAMPTZ,
  eta_timezone TEXT,
  estimated_duration_minutes INT,
  passengers_count INT,
  luggage_count INT,
  vehicle_type vehicle_type,
  driver_name TEXT,
  company_name TEXT,
  toll_fees NUMERIC(12,2),
  parking_fees NUMERIC(12,2),
  selected_quote_id UUID UNIQUE -- FK מתווסף אחרי יצירת transport_quotes
);
CREATE INDEX idx_transport_bookings_pickup ON transport_bookings(pickup_at);

CREATE TABLE transport_quotes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  trip_id UUID NOT NULL REFERENCES trips(id),
  transport_booking_id UUID REFERENCES transport_bookings(id),
  provider TEXT NOT NULL,
  price NUMERIC(12,2) NOT NULL,
  currency_code TEXT NOT NULL,
  vehicle_type vehicle_type,
  terms TEXT,
  notes TEXT,
  is_selected BOOLEAN NOT NULL DEFAULT false,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE transport_bookings
  ADD CONSTRAINT fk_transport_bookings_selected_quote
  FOREIGN KEY (selected_quote_id) REFERENCES transport_quotes(id);

CREATE TABLE insurances (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  booking_id UUID NOT NULL UNIQUE REFERENCES bookings(id),
  company TEXT NOT NULL,
  policy_type TEXT,
  start_date DATE NOT NULL,
  end_date DATE NOT NULL,
  policy_number TEXT,
  insured_number TEXT,
  coverage_notes TEXT,
  extensions TEXT,
  deductible NUMERIC(12,2),
  emergency_phone TEXT,
  emergency_whatsapp TEXT,
  emergency_email TEXT,
  emergency_website TEXT,
  emergency_instructions TEXT
);
CREATE INDEX idx_insurances_end_date ON insurances(end_date);

CREATE TABLE booking_benefits (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  booking_id UUID NOT NULL REFERENCES bookings(id),
  benefit_name TEXT NOT NULL,
  benefit_type benefit_type,
  notes TEXT,
  value_amount NUMERIC(12,2),
  value_currency_code TEXT
);

-- ---------------------------------------------------------------------------
-- Expense / Payment / PaymentCard
-- ---------------------------------------------------------------------------
CREATE TABLE payment_cards (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES users(id),
  card_name TEXT NOT NULL,
  default_currency_code TEXT
);

CREATE TABLE expenses (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  trip_id UUID NOT NULL REFERENCES trips(id),
  booking_id UUID REFERENCES bookings(id),
  planned_activity_id UUID REFERENCES planned_activities(id),
  place_id UUID REFERENCES places(id),
  category expense_category NOT NULL,
  description TEXT,
  item_name TEXT,
  quantity INT,
  amount NUMERIC(12,2) NOT NULL,
  currency_code TEXT NOT NULL,
  base_currency_amount NUMERIC(12,2),
  base_currency_rate_used NUMERIC(18,8),
  base_currency_rate_fetched_at TIMESTAMPTZ,
  expense_at TIMESTAMPTZ NOT NULL,
  timezone TEXT,
  personal_rating INT,
  notes TEXT,
  data_source data_source NOT NULL DEFAULT 'manual',
  is_confirmed BOOLEAN NOT NULL DEFAULT true,
  deleted_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE INDEX idx_expenses_trip_category ON expenses(trip_id, category);
CREATE INDEX idx_expenses_trip_at ON expenses(trip_id, expense_at);

CREATE TABLE payments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  expense_id UUID REFERENCES expenses(id),
  booking_id UUID REFERENCES bookings(id),
  amount NUMERIC(12,2) NOT NULL,
  currency_code TEXT NOT NULL,
  base_currency_amount NUMERIC(12,2),
  base_currency_rate_used NUMERIC(18,8),
  payment_at TIMESTAMPTZ NOT NULL,
  timezone TEXT,
  payment_method payment_method NOT NULL,
  card_id UUID REFERENCES payment_cards(id),
  card_charged_amount NUMERIC(12,2),
  card_charged_currency_code TEXT,
  card_exchange_rate NUMERIC(18,8),
  card_fee_amount NUMERIC(12,2),
  market_reference_rate NUMERIC(18,8),
  market_rate_source TEXT,
  market_rate_fetched_at TIMESTAMPTZ,
  paid_by_companion_id UUID REFERENCES trip_companions(id),
  notes TEXT,
  data_source data_source NOT NULL DEFAULT 'manual',
  deleted_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE INDEX idx_payments_expense ON payments(expense_id);
CREATE INDEX idx_payments_booking ON payments(booking_id);

-- ---------------------------------------------------------------------------
-- Wallet / Wallet Transaction / Currency Exchange / Deposit / Refund
-- ---------------------------------------------------------------------------
CREATE TABLE wallets (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  trip_id UUID NOT NULL REFERENCES trips(id),
  currency_code TEXT NOT NULL,
  initial_amount NUMERIC(12,2) NOT NULL DEFAULT 0,
  current_balance NUMERIC(12,2) NOT NULL DEFAULT 0,
  UNIQUE (trip_id, currency_code)
);

CREATE TABLE currency_exchanges (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  trip_id UUID NOT NULL REFERENCES trips(id),
  given_amount NUMERIC(12,2) NOT NULL,
  given_currency_code TEXT NOT NULL,
  received_amount NUMERIC(12,2) NOT NULL,
  received_currency_code TEXT NOT NULL,
  actual_rate NUMERIC(18,8) NOT NULL,
  fee_amount NUMERIC(12,2),
  location_name TEXT,
  location_lat DOUBLE PRECISION,
  location_lng DOUBLE PRECISION,
  exchange_at TIMESTAMPTZ NOT NULL,
  timezone TEXT,
  notes TEXT,
  deleted_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE INDEX idx_currency_exchanges_trip_at ON currency_exchanges(trip_id, exchange_at);

CREATE TABLE deposits (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  trip_id UUID NOT NULL REFERENCES trips(id),
  booking_id UUID REFERENCES bookings(id),
  amount NUMERIC(12,2) NOT NULL,
  currency_code TEXT NOT NULL,
  paid_to TEXT,
  reason TEXT,
  expected_return_date DATE,
  is_returned BOOLEAN NOT NULL DEFAULT false,
  returned_amount NUMERIC(12,2),
  returned_date DATE,
  deleted_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE INDEX idx_deposits_trip_returned ON deposits(trip_id, is_returned);

CREATE TABLE refunds (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  trip_id UUID NOT NULL REFERENCES trips(id),
  source_expense_id UUID NOT NULL REFERENCES expenses(id),
  source_payment_id UUID REFERENCES payments(id),
  amount NUMERIC(12,2) NOT NULL,
  currency_code TEXT NOT NULL,
  reason TEXT,
  refund_at TIMESTAMPTZ NOT NULL,
  notes TEXT,
  deleted_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE INDEX idx_refunds_trip ON refunds(trip_id);

CREATE TABLE wallet_transactions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  wallet_id UUID NOT NULL REFERENCES wallets(id),
  type wallet_tx_type NOT NULL,
  amount NUMERIC(12,2) NOT NULL,
  related_payment_id UUID REFERENCES payments(id),
  related_exchange_id UUID REFERENCES currency_exchanges(id),
  related_deposit_id UUID REFERENCES deposits(id),
  tx_at TIMESTAMPTZ NOT NULL,
  notes TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE INDEX idx_wallet_tx_wallet_at ON wallet_transactions(wallet_id, tx_at);

-- ---------------------------------------------------------------------------
-- Document (פולימורפי) + Document Extracted Field
-- ---------------------------------------------------------------------------
CREATE TABLE documents (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  trip_id UUID NOT NULL REFERENCES trips(id),
  entity_type document_entity_type NOT NULL,
  entity_id UUID NOT NULL,
  document_type document_type NOT NULL,
  file_url TEXT NOT NULL,
  file_name TEXT,
  mime_type TEXT,
  uploaded_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  ocr_status ocr_status NOT NULL DEFAULT 'pending',
  notes TEXT,
  deleted_at TIMESTAMPTZ
);
CREATE INDEX idx_documents_entity ON documents(entity_type, entity_id);

CREATE TABLE document_extracted_fields (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  document_id UUID NOT NULL REFERENCES documents(id),
  field_name TEXT NOT NULL,
  extracted_value TEXT,
  confidence_score DOUBLE PRECISION,
  data_source data_source NOT NULL DEFAULT 'ocr',
  is_confirmed BOOLEAN NOT NULL DEFAULT false,
  confirmed_value TEXT,
  confirmed_at TIMESTAMPTZ
);
CREATE INDEX idx_def_document ON document_extracted_fields(document_id);

-- ---------------------------------------------------------------------------
-- Contact / Status History / Audit Log
-- ---------------------------------------------------------------------------
CREATE TABLE contacts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  trip_id UUID REFERENCES trips(id),
  name TEXT NOT NULL,
  company TEXT,
  role TEXT,
  phone TEXT,
  whatsapp TEXT,
  email TEXT,
  website TEXT,
  category contact_category,
  notes TEXT,
  deleted_at TIMESTAMPTZ
);
CREATE INDEX idx_contacts_trip_category ON contacts(trip_id, category);

CREATE TABLE status_history (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  entity_type status_history_entity_type NOT NULL,
  entity_id UUID NOT NULL,
  old_status TEXT,
  new_status TEXT NOT NULL,
  changed_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  changed_by TEXT,
  reason TEXT,
  note TEXT
);
CREATE INDEX idx_status_history_entity ON status_history(entity_type, entity_id, changed_at);

CREATE TABLE audit_log (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID,
  entity_type TEXT NOT NULL,
  entity_id UUID NOT NULL,
  field_name TEXT NOT NULL,
  old_value TEXT,
  new_value TEXT,
  action audit_action NOT NULL,
  changed_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE INDEX idx_audit_log_entity ON audit_log(entity_type, entity_id, changed_at);

-- ---------------------------------------------------------------------------
-- Integration Account
-- ---------------------------------------------------------------------------
CREATE TABLE integration_accounts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES users(id),
  service_name integration_service NOT NULL,
  integration_type integration_type NOT NULL DEFAULT 'manual_link',
  app_link TEXT,
  website_link TEXT,
  account_link TEXT,
  bookings_link TEXT,
  email_or_username TEXT,
  oauth_provider TEXT,
  oauth_secret_ref TEXT,
  oauth_scope TEXT,
  oauth_connected_at TIMESTAMPTZ,
  oauth_expires_at TIMESTAMPTZ,
  notes TEXT,
  deleted_at TIMESTAMPTZ
);
CREATE INDEX idx_integration_accounts_user_service ON integration_accounts(user_id, service_name);

-- ---------------------------------------------------------------------------
-- Route / Route Stop
-- ---------------------------------------------------------------------------
CREATE TABLE routes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  trip_day_id UUID NOT NULL UNIQUE REFERENCES trip_days(id),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE route_stops (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  route_id UUID NOT NULL REFERENCES routes(id),
  place_id UUID REFERENCES places(id),
  booking_id UUID REFERENCES bookings(id),
  planned_activity_id UUID REFERENCES planned_activities(id),
  order_index INT NOT NULL,
  planned_departure_at TIMESTAMPTZ,
  planned_arrival_at TIMESTAMPTZ,
  timezone TEXT,
  distance_km NUMERIC(8,2),
  travel_time_minutes INT,
  travel_mode travel_mode
);
CREATE INDEX idx_route_stops_route_order ON route_stops(route_id, order_index);

-- ---------------------------------------------------------------------------
-- Notification Preference
-- ---------------------------------------------------------------------------
CREATE TABLE notification_preferences (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  trip_id UUID NOT NULL REFERENCES trips(id),
  event_type notification_event_type NOT NULL,
  lead_time_minutes INT,
  is_enabled BOOLEAN NOT NULL DEFAULT true,
  UNIQUE (trip_id, event_type)
);

COMMIT;
