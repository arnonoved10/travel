-- CreateEnum
CREATE TYPE "TripStatus" AS ENUM ('planning', 'upcoming', 'active', 'completed', 'archived');

-- CreateEnum
CREATE TYPE "LifecycleStatus" AS ENUM ('want_to_book', 'planned', 'need_to_book', 'booked', 'partially_paid', 'paid', 'done', 'not_done', 'postponed', 'cancelled');

-- CreateEnum
CREATE TYPE "TripPlaceStatus" AS ENUM ('want_to_go', 'planned', 'visited', 'not_visited', 'favorite', 'dont_return');

-- CreateEnum
CREATE TYPE "PlaceCategory" AS ENUM ('hotel', 'restaurant', 'cafe', 'bar', 'mall', 'shop', 'massage', 'attraction', 'beach', 'nature', 'waterfall', 'viewpoint', 'market', 'airport', 'port', 'train_station', 'hospital', 'pharmacy', 'chabad_house', 'car_rental_company', 'other');

-- CreateEnum
CREATE TYPE "BookingType" AS ENUM ('hotel_stay', 'flight', 'transport', 'car_rental', 'insurance', 'activity_reservation', 'other');

-- CreateEnum
CREATE TYPE "BookingSource" AS ENUM ('booking_com', 'agoda', 'hotels_com', 'expedia', 'hotel_website', 'direct', 'agent', 'bolt', 'grab', 'other');

-- CreateEnum
CREATE TYPE "MealPlan" AS ENUM ('none', 'breakfast_included', 'breakfast_paid', 'half_board', 'full_board', 'all_inclusive');

-- CreateEnum
CREATE TYPE "BreakfastPriceUnit" AS ENUM ('per_person', 'per_room', 'per_day', 'per_stay');

-- CreateEnum
CREATE TYPE "FlightLegType" AS ENUM ('outbound', 'return', 'internal', 'connecting');

-- CreateEnum
CREATE TYPE "TransportMode" AS ENUM ('taxi', 'private_transfer', 'ferry', 'train', 'bus', 'water_taxi', 'other');

-- CreateEnum
CREATE TYPE "VehicleType" AS ENUM ('small', 'sedan', 'large', 'suv', 'minivan', 'van', 'luxury', 'vip', 'other');

-- CreateEnum
CREATE TYPE "RentalVehicleType" AS ENUM ('car', 'motorbike', 'scooter', 'bicycle', 'jet_ski', 'other');

-- CreateEnum
CREATE TYPE "BenefitType" AS ENUM ('breakfast', 'airport_transfer', 'early_checkin', 'late_checkout', 'room_upgrade', 'lounge_access', 'parking', 'wifi', 'pool_access', 'gym', 'spa', 'hotel_credit', 'meals', 'drinks', 'free_cancellation', 'taxes_included', 'other');

-- CreateEnum
CREATE TYPE "ExpenseCategorySuggestion" AS ENUM ('hotel', 'flight', 'transport', 'car_rental', 'food', 'cafe', 'bar', 'massage', 'shopping', 'fruit', 'attraction', 'insurance', 'tip', 'other');

-- CreateEnum
CREATE TYPE "TipCategory" AS ENUM ('cleaner', 'bellboy', 'waiter', 'driver', 'masseur', 'guide', 'hotel_staff', 'other');

-- CreateEnum
CREATE TYPE "PaymentMethod" AS ENUM ('cash', 'credit_card', 'debit_card', 'digital_wallet', 'bank_transfer', 'other');

-- CreateEnum
CREATE TYPE "WalletTxType" AS ENUM ('cash_payment_out', 'top_up', 'exchange_out', 'exchange_in', 'refund_in', 'deposit_out', 'deposit_return_in', 'adjustment');

-- CreateEnum
CREATE TYPE "DocumentEntityType" AS ENUM ('booking', 'expense', 'payment', 'hotel_stay', 'flight', 'transport_booking', 'insurance', 'place', 'planned_activity', 'trip', 'other');

-- CreateEnum
CREATE TYPE "DocumentType" AS ENUM ('booking_confirmation', 'receipt', 'invoice', 'payment_confirmation', 'voucher', 'ticket', 'policy', 'contract', 'screenshot', 'image', 'pdf', 'other');

-- CreateEnum
CREATE TYPE "OcrStatus" AS ENUM ('pending', 'parsed', 'needs_confirmation', 'confirmed', 'failed');

-- CreateEnum
CREATE TYPE "ContactCategory" AS ENUM ('hotel', 'driver', 'taxi_company', 'insurance', 'rental_company', 'airline', 'ferry', 'guide', 'agent', 'attraction', 'other');

-- CreateEnum
CREATE TYPE "StatusHistoryEntityType" AS ENUM ('planned_activity', 'booking');

-- CreateEnum
CREATE TYPE "AuditAction" AS ENUM ('create', 'update', 'delete', 'status_change');

-- CreateEnum
CREATE TYPE "IntegrationService" AS ENUM ('booking_com', 'agoda', 'hotels_com', 'expedia', 'bolt', 'grab', 'airline', 'car_rental_company', 'insurance_company', 'other');

-- CreateEnum
CREATE TYPE "IntegrationType" AS ENUM ('manual_link', 'oauth_data_portability');

-- CreateEnum
CREATE TYPE "DataSource" AS ENUM ('manual', 'document', 'ocr', 'api', 'imported', 'ai_suggested');

-- CreateEnum
CREATE TYPE "NotificationEventType" AS ENUM ('flight_approaching', 'need_to_leave_for_airport', 'taxi_approaching', 'checkout_approaching', 'unpaid_booking', 'night_without_hotel', 'activity_not_booked', 'deposit_due_return', 'insurance_ending', 'overdue_not_marked_done');

-- CreateEnum
CREATE TYPE "TravelMode" AS ENUM ('walk', 'taxi', 'public_transport', 'rental_car', 'other');

-- CreateEnum
CREATE TYPE "ChecklistListType" AS ENUM ('packing', 'before_trip');

-- CreateTable
CREATE TABLE "currencies" (
    "code" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "symbol" TEXT NOT NULL,
    "decimalDigits" INTEGER NOT NULL DEFAULT 2,

    CONSTRAINT "currencies_pkey" PRIMARY KEY ("code")
);

-- CreateTable
CREATE TABLE "users" (
    "id" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "displayName" TEXT,
    "defaultCurrencyCode" TEXT,
    "locale" TEXT NOT NULL DEFAULT 'he',
    "legalConsentAcceptedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "users_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "trips" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "status" "TripStatus" NOT NULL DEFAULT 'planning',
    "startDate" DATE NOT NULL,
    "endDate" DATE NOT NULL,
    "baseCurrencyCode" TEXT,
    "primaryTimezone" TEXT,
    "coverImageUrl" TEXT,
    "notes" TEXT,
    "totalBudgetAmount" DECIMAL(12,2),
    "dailyBudgetAmount" DECIMAL(12,2),
    "deletedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "trips_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "trip_days" (
    "id" TEXT NOT NULL,
    "tripId" TEXT NOT NULL,
    "calendarDate" DATE NOT NULL,
    "dayIndex" INTEGER,
    "notes" TEXT,

    CONSTRAINT "trip_days_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "trip_countries" (
    "id" TEXT NOT NULL,
    "tripId" TEXT NOT NULL,
    "countryName" TEXT NOT NULL,
    "orderIndex" INTEGER NOT NULL DEFAULT 0,

    CONSTRAINT "trip_countries_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "trip_cities" (
    "id" TEXT NOT NULL,
    "tripId" TEXT NOT NULL,
    "countryId" TEXT,
    "cityName" TEXT NOT NULL,
    "orderIndex" INTEGER NOT NULL DEFAULT 0,

    CONSTRAINT "trip_cities_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "trip_date_change_logs" (
    "id" TEXT NOT NULL,
    "tripId" TEXT NOT NULL,
    "oldStartDate" DATE NOT NULL,
    "oldEndDate" DATE NOT NULL,
    "newStartDate" DATE NOT NULL,
    "newEndDate" DATE NOT NULL,
    "changedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "impactReport" JSONB,

    CONSTRAINT "trip_date_change_logs_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "trip_settings" (
    "id" TEXT NOT NULL,
    "tripId" TEXT NOT NULL,
    "airportLeadTimeInternationalMinutes" INTEGER NOT NULL DEFAULT 180,
    "airportLeadTimeDomesticMinutes" INTEGER NOT NULL DEFAULT 120,
    "statusColors" JSONB,
    "defaultCurrencyCode" TEXT,
    "nearMeDefaultRadiusM" INTEGER NOT NULL DEFAULT 1000,

    CONSTRAINT "trip_settings_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "budget_category_limits" (
    "id" TEXT NOT NULL,
    "tripId" TEXT NOT NULL,
    "category" TEXT NOT NULL,
    "limitAmount" DECIMAL(12,2) NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "budget_category_limits_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "trip_companions" (
    "id" TEXT NOT NULL,
    "tripId" TEXT NOT NULL,
    "displayName" TEXT NOT NULL,
    "relation" TEXT,
    "notes" TEXT,
    "deletedAt" TIMESTAMP(3),

    CONSTRAINT "trip_companions_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "checklist_items" (
    "id" TEXT NOT NULL,
    "tripId" TEXT NOT NULL,
    "listType" "ChecklistListType" NOT NULL,
    "name" TEXT NOT NULL,
    "category" TEXT,
    "quantity" INTEGER,
    "isDone" BOOLEAN NOT NULL DEFAULT false,
    "orderIndex" INTEGER NOT NULL DEFAULT 0,
    "deletedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "checklist_items_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "places" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "category" "PlaceCategory" NOT NULL,
    "address" TEXT,
    "country" TEXT,
    "city" TEXT,
    "lat" DOUBLE PRECISION,
    "lng" DOUBLE PRECISION,
    "officialWebsite" TEXT,
    "phone" TEXT,
    "whatsapp" TEXT,
    "email" TEXT,
    "openingHours" JSONB,
    "generalNotes" TEXT,
    "isFavorite" BOOLEAN NOT NULL DEFAULT false,
    "dontReturn" BOOLEAN NOT NULL DEFAULT false,
    "personalRating" INTEGER,
    "mapLink" TEXT,
    "websiteLink" TEXT,
    "extraLinks" JSONB,
    "deletedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "places_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "trip_places" (
    "id" TEXT NOT NULL,
    "tripId" TEXT NOT NULL,
    "placeId" TEXT NOT NULL,
    "status" "TripPlaceStatus" NOT NULL DEFAULT 'want_to_go',
    "notes" TEXT,
    "deletedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "trip_places_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "planned_activities" (
    "id" TEXT NOT NULL,
    "tripId" TEXT NOT NULL,
    "placeId" TEXT,
    "bookingId" TEXT,
    "name" TEXT NOT NULL,
    "activityType" TEXT,
    "plannedAt" TIMESTAMP(3),
    "plannedTimezone" TEXT,
    "estimatedDurationMinutes" INTEGER,
    "estimatedPrice" DECIMAL(12,2),
    "estimatedCurrencyCode" TEXT,
    "notes" TEXT,
    "link" TEXT,
    "status" "LifecycleStatus" NOT NULL DEFAULT 'want_to_book',
    "personalRating" INTEGER,
    "dataSource" "DataSource" NOT NULL DEFAULT 'manual',
    "isConfirmed" BOOLEAN NOT NULL DEFAULT true,
    "deletedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "planned_activities_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "bookings" (
    "id" TEXT NOT NULL,
    "tripId" TEXT NOT NULL,
    "placeId" TEXT,
    "bookingType" "BookingType" NOT NULL,
    "status" "LifecycleStatus" NOT NULL DEFAULT 'need_to_book',
    "agreedPrice" DECIMAL(12,2),
    "agreedCurrencyCode" TEXT,
    "source" "BookingSource",
    "sourceOther" TEXT,
    "providerName" TEXT,
    "externalBookingId" TEXT,
    "confirmationNumber" TEXT,
    "bookingLink" TEXT,
    "manageBookingLink" TEXT,
    "cancellationPolicy" TEXT,
    "phone" TEXT,
    "whatsapp" TEXT,
    "email" TEXT,
    "website" TEXT,
    "notes" TEXT,
    "dataSource" "DataSource" NOT NULL DEFAULT 'manual',
    "isConfirmed" BOOLEAN NOT NULL DEFAULT true,
    "deletedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "bookings_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "booking_participants" (
    "id" TEXT NOT NULL,
    "bookingId" TEXT NOT NULL,
    "companionId" TEXT NOT NULL,

    CONSTRAINT "booking_participants_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "hotel_stays" (
    "id" TEXT NOT NULL,
    "bookingId" TEXT NOT NULL,
    "hotelName" TEXT NOT NULL,
    "address" TEXT,
    "lat" DOUBLE PRECISION,
    "lng" DOUBLE PRECISION,
    "checkInDate" DATE NOT NULL,
    "checkOutDate" DATE NOT NULL,
    "nights" INTEGER,
    "checkInTime" TEXT,
    "checkOutTime" TEXT,
    "timezone" TEXT,
    "earlyCheckIn" BOOLEAN NOT NULL DEFAULT false,
    "earlyCheckInCost" DECIMAL(12,2),
    "lateCheckOut" BOOLEAN NOT NULL DEFAULT false,
    "lateCheckOutCost" DECIMAL(12,2),
    "roomType" TEXT,
    "bedType" TEXT,
    "floor" TEXT,
    "view" TEXT,
    "smoking" BOOLEAN,
    "guestsCount" INTEGER,
    "pricePerNight" DECIMAL(12,2),
    "mealPlan" "MealPlan" NOT NULL DEFAULT 'none',
    "breakfastPrice" DECIMAL(12,2),
    "breakfastPriceUnit" "BreakfastPriceUnit",
    "breakfastHours" TEXT,
    "breakfastLocation" TEXT,
    "personalRating" INTEGER,

    CONSTRAINT "hotel_stays_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "flights" (
    "id" TEXT NOT NULL,
    "bookingId" TEXT NOT NULL,
    "airline" TEXT NOT NULL,
    "flightNumber" TEXT,
    "departureAirport" TEXT NOT NULL,
    "arrivalAirport" TEXT NOT NULL,
    "departureTerminal" TEXT,
    "arrivalTerminal" TEXT,
    "departureAt" TIMESTAMP(3) NOT NULL,
    "departureTimezone" TEXT NOT NULL,
    "arrivalAt" TIMESTAMP(3) NOT NULL,
    "arrivalTimezone" TEXT NOT NULL,
    "durationMinutes" INTEGER,
    "seat" TEXT,
    "baggage" TEXT,
    "legType" "FlightLegType" NOT NULL DEFAULT 'outbound',

    CONSTRAINT "flights_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "transport_bookings" (
    "id" TEXT NOT NULL,
    "bookingId" TEXT NOT NULL,
    "mode" "TransportMode" NOT NULL,
    "pickupText" TEXT,
    "pickupLat" DOUBLE PRECISION,
    "pickupLng" DOUBLE PRECISION,
    "dropoffText" TEXT,
    "dropoffLat" DOUBLE PRECISION,
    "dropoffLng" DOUBLE PRECISION,
    "pickupAt" TIMESTAMP(3) NOT NULL,
    "pickupTimezone" TEXT NOT NULL,
    "etaAt" TIMESTAMP(3),
    "etaTimezone" TEXT,
    "estimatedDurationMinutes" INTEGER,
    "passengersCount" INTEGER,
    "luggageCount" INTEGER,
    "vehicleType" "VehicleType",
    "driverName" TEXT,
    "companyName" TEXT,
    "tollFees" DECIMAL(12,2),
    "parkingFees" DECIMAL(12,2),
    "personalRating" INTEGER,
    "selectedQuoteId" TEXT,

    CONSTRAINT "transport_bookings_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "transport_quotes" (
    "id" TEXT NOT NULL,
    "tripId" TEXT NOT NULL,
    "transportBookingId" TEXT,
    "provider" TEXT NOT NULL,
    "price" DECIMAL(12,2) NOT NULL,
    "currencyCode" TEXT NOT NULL,
    "vehicleType" "VehicleType",
    "terms" TEXT,
    "notes" TEXT,
    "isSelected" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "transport_quotes_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "car_rentals" (
    "id" TEXT NOT NULL,
    "bookingId" TEXT NOT NULL,
    "vehicleType" "RentalVehicleType" NOT NULL,
    "companyName" TEXT NOT NULL,
    "model" TEXT,
    "licensePlate" TEXT,
    "pickupLocationText" TEXT,
    "pickupAt" TIMESTAMP(3) NOT NULL,
    "pickupTimezone" TEXT NOT NULL,
    "dropoffLocationText" TEXT,
    "dropoffAt" TIMESTAMP(3),
    "dropoffTimezone" TEXT,
    "driverRequirements" TEXT,
    "insuranceIncluded" BOOLEAN NOT NULL DEFAULT false,
    "depositAmount" DECIMAL(12,2),
    "depositCurrencyCode" TEXT,

    CONSTRAINT "car_rentals_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "insurances" (
    "id" TEXT NOT NULL,
    "bookingId" TEXT NOT NULL,
    "company" TEXT NOT NULL,
    "policyType" TEXT,
    "startDate" DATE NOT NULL,
    "endDate" DATE NOT NULL,
    "policyNumber" TEXT,
    "insuredNumber" TEXT,
    "coverageNotes" TEXT,
    "extensions" TEXT,
    "deductible" DECIMAL(12,2),
    "emergencyPhone" TEXT,
    "emergencyWhatsapp" TEXT,
    "emergencyEmail" TEXT,
    "emergencyWebsite" TEXT,
    "emergencyInstructions" TEXT,

    CONSTRAINT "insurances_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "booking_benefits" (
    "id" TEXT NOT NULL,
    "bookingId" TEXT NOT NULL,
    "benefitName" TEXT NOT NULL,
    "benefitType" "BenefitType",
    "notes" TEXT,
    "valueAmount" DECIMAL(12,2),
    "valueCurrencyCode" TEXT,

    CONSTRAINT "booking_benefits_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "expenses" (
    "id" TEXT NOT NULL,
    "tripId" TEXT NOT NULL,
    "bookingId" TEXT,
    "plannedActivityId" TEXT,
    "placeId" TEXT,
    "category" TEXT NOT NULL,
    "description" TEXT,
    "itemName" TEXT,
    "quantity" INTEGER,
    "amount" DECIMAL(12,2) NOT NULL,
    "currencyCode" TEXT NOT NULL,
    "baseCurrencyAmount" DECIMAL(12,2),
    "baseCurrencyRateUsed" DECIMAL(18,8),
    "baseCurrencyRateFetchedAt" TIMESTAMP(3),
    "expenseAt" TIMESTAMP(3) NOT NULL,
    "timezone" TEXT,
    "personalRating" INTEGER,
    "tipRecipient" TEXT,
    "tipCategory" "TipCategory",
    "notes" TEXT,
    "dataSource" "DataSource" NOT NULL DEFAULT 'manual',
    "isConfirmed" BOOLEAN NOT NULL DEFAULT true,
    "deletedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "expenses_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "payments" (
    "id" TEXT NOT NULL,
    "expenseId" TEXT,
    "bookingId" TEXT,
    "amount" DECIMAL(12,2) NOT NULL,
    "currencyCode" TEXT NOT NULL,
    "baseCurrencyAmount" DECIMAL(12,2),
    "baseCurrencyRateUsed" DECIMAL(18,8),
    "paymentAt" TIMESTAMP(3) NOT NULL,
    "timezone" TEXT,
    "paymentMethod" "PaymentMethod" NOT NULL,
    "cardId" TEXT,
    "cardChargedAmount" DECIMAL(12,2),
    "cardChargedCurrencyCode" TEXT,
    "cardExchangeRate" DECIMAL(18,8),
    "cardFeeAmount" DECIMAL(12,2),
    "marketReferenceRate" DECIMAL(18,8),
    "marketRateSource" TEXT,
    "marketRateFetchedAt" TIMESTAMP(3),
    "paidByCompanionId" TEXT,
    "notes" TEXT,
    "dataSource" "DataSource" NOT NULL DEFAULT 'manual',
    "deletedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "payments_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "payment_cards" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "cardName" TEXT NOT NULL,
    "defaultCurrencyCode" TEXT,

    CONSTRAINT "payment_cards_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "wallets" (
    "id" TEXT NOT NULL,
    "tripId" TEXT NOT NULL,
    "currencyCode" TEXT NOT NULL,
    "initialAmount" DECIMAL(12,2) NOT NULL DEFAULT 0,
    "currentBalance" DECIMAL(12,2) NOT NULL DEFAULT 0,

    CONSTRAINT "wallets_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "wallet_transactions" (
    "id" TEXT NOT NULL,
    "walletId" TEXT NOT NULL,
    "type" "WalletTxType" NOT NULL,
    "amount" DECIMAL(12,2) NOT NULL,
    "relatedPaymentId" TEXT,
    "relatedExchangeId" TEXT,
    "relatedDepositId" TEXT,
    "txAt" TIMESTAMP(3) NOT NULL,
    "notes" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "wallet_transactions_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "currency_exchanges" (
    "id" TEXT NOT NULL,
    "tripId" TEXT NOT NULL,
    "givenAmount" DECIMAL(12,2) NOT NULL,
    "givenCurrencyCode" TEXT NOT NULL,
    "receivedAmount" DECIMAL(12,2) NOT NULL,
    "receivedCurrencyCode" TEXT NOT NULL,
    "actualRate" DECIMAL(18,8) NOT NULL,
    "feeAmount" DECIMAL(12,2),
    "locationName" TEXT,
    "locationLat" DOUBLE PRECISION,
    "locationLng" DOUBLE PRECISION,
    "exchangeAt" TIMESTAMP(3) NOT NULL,
    "timezone" TEXT,
    "notes" TEXT,
    "deletedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "currency_exchanges_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "deposits" (
    "id" TEXT NOT NULL,
    "tripId" TEXT NOT NULL,
    "bookingId" TEXT,
    "amount" DECIMAL(12,2) NOT NULL,
    "currencyCode" TEXT NOT NULL,
    "paidTo" TEXT,
    "reason" TEXT,
    "expectedReturnDate" DATE,
    "isReturned" BOOLEAN NOT NULL DEFAULT false,
    "returnedAmount" DECIMAL(12,2),
    "returnedDate" DATE,
    "deletedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "deposits_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "refunds" (
    "id" TEXT NOT NULL,
    "tripId" TEXT NOT NULL,
    "sourceExpenseId" TEXT NOT NULL,
    "sourcePaymentId" TEXT,
    "amount" DECIMAL(12,2) NOT NULL,
    "currencyCode" TEXT NOT NULL,
    "reason" TEXT,
    "refundAt" TIMESTAMP(3) NOT NULL,
    "notes" TEXT,
    "deletedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "refunds_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "documents" (
    "id" TEXT NOT NULL,
    "tripId" TEXT NOT NULL,
    "entityType" "DocumentEntityType" NOT NULL,
    "entityId" TEXT NOT NULL,
    "documentType" "DocumentType" NOT NULL,
    "fileUrl" TEXT NOT NULL,
    "fileName" TEXT,
    "mimeType" TEXT,
    "uploadedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "ocrStatus" "OcrStatus" NOT NULL DEFAULT 'pending',
    "notes" TEXT,
    "deletedAt" TIMESTAMP(3),

    CONSTRAINT "documents_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "document_extracted_fields" (
    "id" TEXT NOT NULL,
    "documentId" TEXT NOT NULL,
    "fieldName" TEXT NOT NULL,
    "extractedValue" TEXT,
    "confidenceScore" DOUBLE PRECISION,
    "dataSource" "DataSource" NOT NULL DEFAULT 'ocr',
    "isConfirmed" BOOLEAN NOT NULL DEFAULT false,
    "confirmedValue" TEXT,
    "confirmedAt" TIMESTAMP(3),

    CONSTRAINT "document_extracted_fields_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "contacts" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "tripId" TEXT,
    "name" TEXT NOT NULL,
    "company" TEXT,
    "role" TEXT,
    "phone" TEXT,
    "whatsapp" TEXT,
    "email" TEXT,
    "website" TEXT,
    "category" "ContactCategory",
    "notes" TEXT,
    "deletedAt" TIMESTAMP(3),

    CONSTRAINT "contacts_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "status_history" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "entityType" "StatusHistoryEntityType" NOT NULL,
    "entityId" TEXT NOT NULL,
    "oldStatus" TEXT,
    "newStatus" TEXT NOT NULL,
    "changedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "changedBy" TEXT,
    "reason" TEXT,
    "note" TEXT,

    CONSTRAINT "status_history_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "audit_log" (
    "id" TEXT NOT NULL,
    "userId" TEXT,
    "entityType" TEXT NOT NULL,
    "entityId" TEXT NOT NULL,
    "fieldName" TEXT NOT NULL,
    "oldValue" TEXT,
    "newValue" TEXT,
    "action" "AuditAction" NOT NULL,
    "changedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "audit_log_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "integration_accounts" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "serviceName" "IntegrationService" NOT NULL,
    "integrationType" "IntegrationType" NOT NULL DEFAULT 'manual_link',
    "appLink" TEXT,
    "websiteLink" TEXT,
    "accountLink" TEXT,
    "bookingsLink" TEXT,
    "emailOrUsername" TEXT,
    "oauthProvider" TEXT,
    "oauthSecretRef" TEXT,
    "oauthScope" TEXT,
    "oauthConnectedAt" TIMESTAMP(3),
    "oauthExpiresAt" TIMESTAMP(3),
    "notes" TEXT,
    "deletedAt" TIMESTAMP(3),

    CONSTRAINT "integration_accounts_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "routes" (
    "id" TEXT NOT NULL,
    "tripDayId" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "routes_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "route_stops" (
    "id" TEXT NOT NULL,
    "routeId" TEXT NOT NULL,
    "placeId" TEXT,
    "bookingId" TEXT,
    "plannedActivityId" TEXT,
    "orderIndex" INTEGER NOT NULL,
    "plannedDepartureAt" TIMESTAMP(3),
    "plannedArrivalAt" TIMESTAMP(3),
    "timezone" TEXT,
    "distanceKm" DECIMAL(8,2),
    "travelTimeMinutes" INTEGER,
    "travelMode" "TravelMode",

    CONSTRAINT "route_stops_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "notification_preferences" (
    "id" TEXT NOT NULL,
    "tripId" TEXT NOT NULL,
    "eventType" "NotificationEventType" NOT NULL,
    "leadTimeMinutes" INTEGER,
    "isEnabled" BOOLEAN NOT NULL DEFAULT true,

    CONSTRAINT "notification_preferences_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "weather_forecast_snapshots" (
    "id" TEXT NOT NULL,
    "latRounded" DOUBLE PRECISION NOT NULL,
    "lngRounded" DOUBLE PRECISION NOT NULL,
    "timezone" TEXT NOT NULL,
    "forecastAt" TIMESTAMP(3) NOT NULL,
    "retrievedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "provider" TEXT NOT NULL,
    "isCurrentConditions" BOOLEAN NOT NULL DEFAULT false,
    "temperatureC" DOUBLE PRECISION,
    "feelsLikeC" DOUBLE PRECISION,
    "minTemperatureC" DOUBLE PRECISION,
    "maxTemperatureC" DOUBLE PRECISION,
    "condition" TEXT,
    "conditionIcon" TEXT,
    "precipitationProbabilityPercent" DOUBLE PRECISION,
    "precipitationAmountMm" DOUBLE PRECISION,
    "humidityPercent" DOUBLE PRECISION,
    "windSpeedKph" DOUBLE PRECISION,
    "windDirectionDeg" DOUBLE PRECISION,
    "uvIndex" DOUBLE PRECISION,
    "visibilityKm" DOUBLE PRECISION,
    "sunrise" TIMESTAMP(3),
    "sunset" TIMESTAMP(3),
    "rawResponse" JSONB,

    CONSTRAINT "weather_forecast_snapshots_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "weather_alerts" (
    "id" TEXT NOT NULL,
    "latRounded" DOUBLE PRECISION NOT NULL,
    "lngRounded" DOUBLE PRECISION NOT NULL,
    "provider" TEXT NOT NULL,
    "severity" TEXT,
    "title" TEXT NOT NULL,
    "description" TEXT,
    "startsAt" TIMESTAMP(3) NOT NULL,
    "endsAt" TIMESTAMP(3),
    "retrievedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "weather_alerts_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "users_email_key" ON "users"("email");

-- CreateIndex
CREATE INDEX "trips_userId_status_idx" ON "trips"("userId", "status");

-- CreateIndex
CREATE UNIQUE INDEX "trip_days_tripId_calendarDate_key" ON "trip_days"("tripId", "calendarDate");

-- CreateIndex
CREATE UNIQUE INDEX "trip_settings_tripId_key" ON "trip_settings"("tripId");

-- CreateIndex
CREATE UNIQUE INDEX "budget_category_limits_tripId_category_key" ON "budget_category_limits"("tripId", "category");

-- CreateIndex
CREATE INDEX "places_userId_category_idx" ON "places"("userId", "category");

-- CreateIndex
CREATE UNIQUE INDEX "trip_places_tripId_placeId_key" ON "trip_places"("tripId", "placeId");

-- CreateIndex
CREATE UNIQUE INDEX "planned_activities_bookingId_key" ON "planned_activities"("bookingId");

-- CreateIndex
CREATE INDEX "planned_activities_tripId_status_idx" ON "planned_activities"("tripId", "status");

-- CreateIndex
CREATE INDEX "planned_activities_tripId_plannedAt_idx" ON "planned_activities"("tripId", "plannedAt");

-- CreateIndex
CREATE INDEX "bookings_tripId_bookingType_idx" ON "bookings"("tripId", "bookingType");

-- CreateIndex
CREATE INDEX "bookings_tripId_status_idx" ON "bookings"("tripId", "status");

-- CreateIndex
CREATE UNIQUE INDEX "booking_participants_bookingId_companionId_key" ON "booking_participants"("bookingId", "companionId");

-- CreateIndex
CREATE UNIQUE INDEX "hotel_stays_bookingId_key" ON "hotel_stays"("bookingId");

-- CreateIndex
CREATE INDEX "hotel_stays_checkInDate_checkOutDate_idx" ON "hotel_stays"("checkInDate", "checkOutDate");

-- CreateIndex
CREATE UNIQUE INDEX "flights_bookingId_key" ON "flights"("bookingId");

-- CreateIndex
CREATE INDEX "flights_departureAt_idx" ON "flights"("departureAt");

-- CreateIndex
CREATE UNIQUE INDEX "transport_bookings_bookingId_key" ON "transport_bookings"("bookingId");

-- CreateIndex
CREATE UNIQUE INDEX "transport_bookings_selectedQuoteId_key" ON "transport_bookings"("selectedQuoteId");

-- CreateIndex
CREATE INDEX "transport_bookings_pickupAt_idx" ON "transport_bookings"("pickupAt");

-- CreateIndex
CREATE UNIQUE INDEX "car_rentals_bookingId_key" ON "car_rentals"("bookingId");

-- CreateIndex
CREATE INDEX "car_rentals_pickupAt_idx" ON "car_rentals"("pickupAt");

-- CreateIndex
CREATE UNIQUE INDEX "insurances_bookingId_key" ON "insurances"("bookingId");

-- CreateIndex
CREATE INDEX "insurances_endDate_idx" ON "insurances"("endDate");

-- CreateIndex
CREATE INDEX "expenses_tripId_category_idx" ON "expenses"("tripId", "category");

-- CreateIndex
CREATE INDEX "expenses_tripId_expenseAt_idx" ON "expenses"("tripId", "expenseAt");

-- CreateIndex
CREATE INDEX "payments_expenseId_idx" ON "payments"("expenseId");

-- CreateIndex
CREATE INDEX "payments_bookingId_idx" ON "payments"("bookingId");

-- CreateIndex
CREATE UNIQUE INDEX "wallets_tripId_currencyCode_key" ON "wallets"("tripId", "currencyCode");

-- CreateIndex
CREATE INDEX "wallet_transactions_walletId_txAt_idx" ON "wallet_transactions"("walletId", "txAt");

-- CreateIndex
CREATE INDEX "currency_exchanges_tripId_exchangeAt_idx" ON "currency_exchanges"("tripId", "exchangeAt");

-- CreateIndex
CREATE INDEX "deposits_tripId_isReturned_idx" ON "deposits"("tripId", "isReturned");

-- CreateIndex
CREATE INDEX "refunds_tripId_idx" ON "refunds"("tripId");

-- CreateIndex
CREATE INDEX "documents_entityType_entityId_idx" ON "documents"("entityType", "entityId");

-- CreateIndex
CREATE INDEX "document_extracted_fields_documentId_idx" ON "document_extracted_fields"("documentId");

-- CreateIndex
CREATE INDEX "contacts_userId_tripId_category_idx" ON "contacts"("userId", "tripId", "category");

-- CreateIndex
CREATE INDEX "status_history_entityType_entityId_changedAt_idx" ON "status_history"("entityType", "entityId", "changedAt");

-- CreateIndex
CREATE INDEX "status_history_userId_idx" ON "status_history"("userId");

-- CreateIndex
CREATE INDEX "audit_log_entityType_entityId_changedAt_idx" ON "audit_log"("entityType", "entityId", "changedAt");

-- CreateIndex
CREATE INDEX "integration_accounts_userId_serviceName_idx" ON "integration_accounts"("userId", "serviceName");

-- CreateIndex
CREATE UNIQUE INDEX "routes_tripDayId_key" ON "routes"("tripDayId");

-- CreateIndex
CREATE INDEX "route_stops_routeId_orderIndex_idx" ON "route_stops"("routeId", "orderIndex");

-- CreateIndex
CREATE UNIQUE INDEX "notification_preferences_tripId_eventType_key" ON "notification_preferences"("tripId", "eventType");

-- CreateIndex
CREATE INDEX "weather_forecast_snapshots_latRounded_lngRounded_forecastAt_idx" ON "weather_forecast_snapshots"("latRounded", "lngRounded", "forecastAt");

-- CreateIndex
CREATE INDEX "weather_alerts_latRounded_lngRounded_startsAt_idx" ON "weather_alerts"("latRounded", "lngRounded", "startsAt");

-- AddForeignKey
ALTER TABLE "trips" ADD CONSTRAINT "trips_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "trips" ADD CONSTRAINT "trips_baseCurrencyCode_fkey" FOREIGN KEY ("baseCurrencyCode") REFERENCES "currencies"("code") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "trip_days" ADD CONSTRAINT "trip_days_tripId_fkey" FOREIGN KEY ("tripId") REFERENCES "trips"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "trip_countries" ADD CONSTRAINT "trip_countries_tripId_fkey" FOREIGN KEY ("tripId") REFERENCES "trips"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "trip_cities" ADD CONSTRAINT "trip_cities_tripId_fkey" FOREIGN KEY ("tripId") REFERENCES "trips"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "trip_cities" ADD CONSTRAINT "trip_cities_countryId_fkey" FOREIGN KEY ("countryId") REFERENCES "trip_countries"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "trip_date_change_logs" ADD CONSTRAINT "trip_date_change_logs_tripId_fkey" FOREIGN KEY ("tripId") REFERENCES "trips"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "trip_settings" ADD CONSTRAINT "trip_settings_tripId_fkey" FOREIGN KEY ("tripId") REFERENCES "trips"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "budget_category_limits" ADD CONSTRAINT "budget_category_limits_tripId_fkey" FOREIGN KEY ("tripId") REFERENCES "trips"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "trip_companions" ADD CONSTRAINT "trip_companions_tripId_fkey" FOREIGN KEY ("tripId") REFERENCES "trips"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "checklist_items" ADD CONSTRAINT "checklist_items_tripId_fkey" FOREIGN KEY ("tripId") REFERENCES "trips"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "places" ADD CONSTRAINT "places_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "trip_places" ADD CONSTRAINT "trip_places_tripId_fkey" FOREIGN KEY ("tripId") REFERENCES "trips"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "trip_places" ADD CONSTRAINT "trip_places_placeId_fkey" FOREIGN KEY ("placeId") REFERENCES "places"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "planned_activities" ADD CONSTRAINT "planned_activities_tripId_fkey" FOREIGN KEY ("tripId") REFERENCES "trips"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "planned_activities" ADD CONSTRAINT "planned_activities_placeId_fkey" FOREIGN KEY ("placeId") REFERENCES "places"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "planned_activities" ADD CONSTRAINT "planned_activities_bookingId_fkey" FOREIGN KEY ("bookingId") REFERENCES "bookings"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "bookings" ADD CONSTRAINT "bookings_tripId_fkey" FOREIGN KEY ("tripId") REFERENCES "trips"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "bookings" ADD CONSTRAINT "bookings_placeId_fkey" FOREIGN KEY ("placeId") REFERENCES "places"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "booking_participants" ADD CONSTRAINT "booking_participants_bookingId_fkey" FOREIGN KEY ("bookingId") REFERENCES "bookings"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "booking_participants" ADD CONSTRAINT "booking_participants_companionId_fkey" FOREIGN KEY ("companionId") REFERENCES "trip_companions"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "hotel_stays" ADD CONSTRAINT "hotel_stays_bookingId_fkey" FOREIGN KEY ("bookingId") REFERENCES "bookings"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "flights" ADD CONSTRAINT "flights_bookingId_fkey" FOREIGN KEY ("bookingId") REFERENCES "bookings"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "transport_bookings" ADD CONSTRAINT "transport_bookings_bookingId_fkey" FOREIGN KEY ("bookingId") REFERENCES "bookings"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "transport_bookings" ADD CONSTRAINT "transport_bookings_selectedQuoteId_fkey" FOREIGN KEY ("selectedQuoteId") REFERENCES "transport_quotes"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "transport_quotes" ADD CONSTRAINT "transport_quotes_transportBookingId_fkey" FOREIGN KEY ("transportBookingId") REFERENCES "transport_bookings"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "car_rentals" ADD CONSTRAINT "car_rentals_bookingId_fkey" FOREIGN KEY ("bookingId") REFERENCES "bookings"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "insurances" ADD CONSTRAINT "insurances_bookingId_fkey" FOREIGN KEY ("bookingId") REFERENCES "bookings"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "booking_benefits" ADD CONSTRAINT "booking_benefits_bookingId_fkey" FOREIGN KEY ("bookingId") REFERENCES "bookings"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "expenses" ADD CONSTRAINT "expenses_tripId_fkey" FOREIGN KEY ("tripId") REFERENCES "trips"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "expenses" ADD CONSTRAINT "expenses_bookingId_fkey" FOREIGN KEY ("bookingId") REFERENCES "bookings"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "expenses" ADD CONSTRAINT "expenses_plannedActivityId_fkey" FOREIGN KEY ("plannedActivityId") REFERENCES "planned_activities"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "expenses" ADD CONSTRAINT "expenses_placeId_fkey" FOREIGN KEY ("placeId") REFERENCES "places"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "payments" ADD CONSTRAINT "payments_expenseId_fkey" FOREIGN KEY ("expenseId") REFERENCES "expenses"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "payments" ADD CONSTRAINT "payments_bookingId_fkey" FOREIGN KEY ("bookingId") REFERENCES "bookings"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "payments" ADD CONSTRAINT "payments_cardId_fkey" FOREIGN KEY ("cardId") REFERENCES "payment_cards"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "payments" ADD CONSTRAINT "payments_paidByCompanionId_fkey" FOREIGN KEY ("paidByCompanionId") REFERENCES "trip_companions"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "payment_cards" ADD CONSTRAINT "payment_cards_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "wallets" ADD CONSTRAINT "wallets_tripId_fkey" FOREIGN KEY ("tripId") REFERENCES "trips"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "wallet_transactions" ADD CONSTRAINT "wallet_transactions_walletId_fkey" FOREIGN KEY ("walletId") REFERENCES "wallets"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "wallet_transactions" ADD CONSTRAINT "wallet_transactions_relatedPaymentId_fkey" FOREIGN KEY ("relatedPaymentId") REFERENCES "payments"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "wallet_transactions" ADD CONSTRAINT "wallet_transactions_relatedExchangeId_fkey" FOREIGN KEY ("relatedExchangeId") REFERENCES "currency_exchanges"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "wallet_transactions" ADD CONSTRAINT "wallet_transactions_relatedDepositId_fkey" FOREIGN KEY ("relatedDepositId") REFERENCES "deposits"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "currency_exchanges" ADD CONSTRAINT "currency_exchanges_tripId_fkey" FOREIGN KEY ("tripId") REFERENCES "trips"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "deposits" ADD CONSTRAINT "deposits_tripId_fkey" FOREIGN KEY ("tripId") REFERENCES "trips"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "deposits" ADD CONSTRAINT "deposits_bookingId_fkey" FOREIGN KEY ("bookingId") REFERENCES "bookings"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "refunds" ADD CONSTRAINT "refunds_tripId_fkey" FOREIGN KEY ("tripId") REFERENCES "trips"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "refunds" ADD CONSTRAINT "refunds_sourceExpenseId_fkey" FOREIGN KEY ("sourceExpenseId") REFERENCES "expenses"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "documents" ADD CONSTRAINT "documents_tripId_fkey" FOREIGN KEY ("tripId") REFERENCES "trips"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "documents" ADD CONSTRAINT "doc_booking_ref" FOREIGN KEY ("entityId") REFERENCES "bookings"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "documents" ADD CONSTRAINT "doc_expense_ref" FOREIGN KEY ("entityId") REFERENCES "expenses"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "document_extracted_fields" ADD CONSTRAINT "document_extracted_fields_documentId_fkey" FOREIGN KEY ("documentId") REFERENCES "documents"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "contacts" ADD CONSTRAINT "contacts_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "contacts" ADD CONSTRAINT "contacts_tripId_fkey" FOREIGN KEY ("tripId") REFERENCES "trips"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "integration_accounts" ADD CONSTRAINT "integration_accounts_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "routes" ADD CONSTRAINT "routes_tripDayId_fkey" FOREIGN KEY ("tripDayId") REFERENCES "trip_days"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "route_stops" ADD CONSTRAINT "route_stops_routeId_fkey" FOREIGN KEY ("routeId") REFERENCES "routes"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "route_stops" ADD CONSTRAINT "route_stops_placeId_fkey" FOREIGN KEY ("placeId") REFERENCES "places"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "route_stops" ADD CONSTRAINT "route_stops_bookingId_fkey" FOREIGN KEY ("bookingId") REFERENCES "bookings"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "route_stops" ADD CONSTRAINT "route_stops_plannedActivityId_fkey" FOREIGN KEY ("plannedActivityId") REFERENCES "planned_activities"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "notification_preferences" ADD CONSTRAINT "notification_preferences_tripId_fkey" FOREIGN KEY ("tripId") REFERENCES "trips"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
