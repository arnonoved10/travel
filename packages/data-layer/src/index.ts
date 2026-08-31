import fs from "node:fs";
import path from "node:path";

// Prisma Client מחפש את מנוע-השאילתות הבינארי רק ביחס ל-process.cwd() ובכמה
// נתיבים היוריסטיים קבועים-מראש — אף אחד מהם לא תואם את המבנה בפועל של
// Vercel Serverless Functions במונו-רפו הזה: process.cwd() הוא
// "/var/task/apps/web", אבל הקובץ עצמו נמצא ב-"/var/task/packages/db/
// generated/client" (אומת ישירות דרך endpoint-דיאגנוסטיקה זמני, 2026-08-26 —
// לא ניחוש). זה גורם ל-PrismaClientInitializationError אחרת. מחשבים את
// הנתיב האמיתי דינמית (לא hardcoded ל-"/var/task", כדי שזה יעבוד גם אם
// Vercel ישנה בעתיד את שורש ה-runtime) ומגדירים את משתנה-הסביבה שPrisma
// כן קורא באמת.
//
// **חייב** להיות מוגבל ל-Linux בלבד (process.platform): מאז ש-binaryTargets
// כולל גם "rhel-openssl-3.0.x" וגם "native", שני הקבצים נוצרים גם בפיתוח
// מקומי על Windows — בלי ההגבלה הזו הקוד היה "מוצא" את קובץ ה-Linux ומכריח
// את Prisma להשתמש בו גם ב-Windows, וגורם בדיוק לאותו
// PrismaClientInitializationError (הפעם "not a valid Win32 application") -
// נתפס בבדיקה חיה מקומית ב-2026-08-27, לא רק תיאורטית.
const ENGINE_FILENAME = "libquery_engine-rhel-openssl-3.0.x.so.node";
if (process.platform === "linux" && !process.env.PRISMA_QUERY_ENGINE_LIBRARY) {
  const candidatePath = path.join(process.cwd(), "..", "..", "packages", "db", "generated", "client", ENGINE_FILENAME);
  if (fs.existsSync(candidatePath)) {
    process.env.PRISMA_QUERY_ENGINE_LIBRARY = candidatePath;
  }
}

export * from "./config";
export { OpenMeteoWeatherProvider, openMeteoWeatherProvider } from "./weather/open-meteo-provider";
export { OsrmRoutingProvider, osrmRoutingProvider } from "./routing/osrm-provider";
export { findNearbyAtms, type AtmCandidate } from "./poi/atm-finder";
export {
  BoiFrankfurterCurrencyRateProvider,
  boiFrankfurterCurrencyRateProvider,
} from "./currency-rate/boi-frankfurter-provider";
export * from "./repositories/trip-repository";
export * from "./repositories/place-repository";
export * from "./repositories/booking-repository";
export * from "./repositories/finance-repository";
export * from "./repositories/trip-place-repository";
export * from "./repositories/contact-repository";
export * from "./repositories/planned-activity-repository";
export * from "./repositories/route-repository";
export * from "./repositories/trip-day-repository";
export * from "./repositories/document-repository";
export * from "./repositories/audit-log-repository";
export * from "./repositories/payment-card-repository";
export * from "./repositories/status-history-repository";
export * from "./repositories/notification-preference-repository";
export * from "./repositories/checklist-item-repository";
export * from "./repositories/trip-geography-repository";
export * from "./repositories/trip-companion-repository";
export * from "./repositories/trip-share-link-repository";
export * from "./repositories/loyalty-program-repository";
export * from "./repositories/integration-account-repository";
export * from "./repositories/companion-poll-repository";
export * from "./repositories/place-recommendation-repository";
export * from "./repositories/user-repository";
export { MockTripRepository, mockTripRepository } from "./repositories/trip-repository.mock";
export { MockPlaceRepository, mockPlaceRepository } from "./repositories/place-repository.mock";
export { MockBookingRepository, mockBookingRepository } from "./repositories/booking-repository.mock";
export { MockFinanceRepository, mockFinanceRepository } from "./repositories/finance-repository.mock";
export { MockTripPlaceRepository, mockTripPlaceRepository } from "./repositories/trip-place-repository.mock";
export { MockContactRepository, mockContactRepository } from "./repositories/contact-repository.mock";
export { MockPlannedActivityRepository, mockPlannedActivityRepository } from "./repositories/planned-activity-repository.mock";
export { MockRouteRepository, mockRouteRepository } from "./repositories/route-repository.mock";
export { MockTripDayRepository, mockTripDayRepository } from "./repositories/trip-day-repository.mock";
export { MockDocumentRepository, mockDocumentRepository } from "./repositories/document-repository.mock";
export { MockAuditLogRepository, mockAuditLogRepository } from "./repositories/audit-log-repository.mock";
export { MockPaymentCardRepository, mockPaymentCardRepository } from "./repositories/payment-card-repository.mock";
export { MockStatusHistoryRepository, mockStatusHistoryRepository } from "./repositories/status-history-repository.mock";
export {
  MockNotificationPreferenceRepository,
  mockNotificationPreferenceRepository,
} from "./repositories/notification-preference-repository.mock";
export { MockChecklistItemRepository, mockChecklistItemRepository } from "./repositories/checklist-item-repository.mock";
export { MockTripGeographyRepository, mockTripGeographyRepository } from "./repositories/trip-geography-repository.mock";
export { MockTripCompanionRepository, mockTripCompanionRepository } from "./repositories/trip-companion-repository.mock";
export { MockTripShareLinkRepository, mockTripShareLinkRepository } from "./repositories/trip-share-link-repository.mock";
export { MockLoyaltyProgramRepository, mockLoyaltyProgramRepository } from "./repositories/loyalty-program-repository.mock";
export {
  MockIntegrationAccountRepository,
  mockIntegrationAccountRepository,
} from "./repositories/integration-account-repository.mock";
export { MockCompanionPollRepository, mockCompanionPollRepository } from "./repositories/companion-poll-repository.mock";
export {
  MockPlaceRecommendationRepository,
  mockPlaceRecommendationRepository,
} from "./repositories/place-recommendation-repository.mock";
export { MockSharedInboxRepository, mockSharedInboxRepository } from "./repositories/shared-inbox-repository.mock";
export { MockPushSubscriptionRepository, mockPushSubscriptionRepository } from "./repositories/push-subscription-repository.mock";
export { MockUserRepository, mockUserRepository } from "./repositories/user-repository.mock";

import type { CurrencyRateProvider, PoiProvider, RoutingProvider, WeatherProvider } from "@travel-app/shared-types";
import { openMeteoWeatherProvider } from "./weather/open-meteo-provider";
import { osrmRoutingProvider } from "./routing/osrm-provider";
import { boiFrankfurterCurrencyRateProvider } from "./currency-rate/boi-frankfurter-provider";
import { overpassPoiProvider } from "./poi/overpass-provider";
import type { TripRepository } from "./repositories/trip-repository";
import type { PlaceRepository } from "./repositories/place-repository";
import type { BookingRepository } from "./repositories/booking-repository";
import type { FinanceRepository } from "./repositories/finance-repository";
import type { TripPlaceRepository } from "./repositories/trip-place-repository";
import type { ContactRepository } from "./repositories/contact-repository";
import type { PlannedActivityRepository } from "./repositories/planned-activity-repository";
import type { RouteRepository } from "./repositories/route-repository";
import type { TripDayRepository } from "./repositories/trip-day-repository";
import type { DocumentRepository } from "./repositories/document-repository";
import type { AuditLogRepository } from "./repositories/audit-log-repository";
import type { PaymentCardRepository } from "./repositories/payment-card-repository";
import type { StatusHistoryRepository } from "./repositories/status-history-repository";
import type { NotificationPreferenceRepository } from "./repositories/notification-preference-repository";
import type { ChecklistItemRepository } from "./repositories/checklist-item-repository";
import type { TripGeographyRepository } from "./repositories/trip-geography-repository";
import type { TripCompanionRepository } from "./repositories/trip-companion-repository";
import type { TripShareLinkRepository } from "./repositories/trip-share-link-repository";
import type { LoyaltyProgramRepository } from "./repositories/loyalty-program-repository";
import type { IntegrationAccountRepository } from "./repositories/integration-account-repository";
import type { CompanionPollRepository } from "./repositories/companion-poll-repository";
import type { PlaceRecommendationRepository } from "./repositories/place-recommendation-repository";
import type { SharedInboxRepository } from "./repositories/shared-inbox-repository";
import type { PushSubscriptionRepository } from "./repositories/push-subscription-repository";
import type { UserRepository } from "./repositories/user-repository";
import { mockTripRepository } from "./repositories/trip-repository.mock";
import { mockPlaceRepository } from "./repositories/place-repository.mock";
import { mockBookingRepository } from "./repositories/booking-repository.mock";
import { mockFinanceRepository } from "./repositories/finance-repository.mock";
import { mockTripPlaceRepository } from "./repositories/trip-place-repository.mock";
import { mockContactRepository } from "./repositories/contact-repository.mock";
import { mockPlannedActivityRepository } from "./repositories/planned-activity-repository.mock";
import { mockRouteRepository } from "./repositories/route-repository.mock";
import { mockTripDayRepository } from "./repositories/trip-day-repository.mock";
import { mockDocumentRepository } from "./repositories/document-repository.mock";
import { mockAuditLogRepository } from "./repositories/audit-log-repository.mock";
import { mockPaymentCardRepository } from "./repositories/payment-card-repository.mock";
import { mockStatusHistoryRepository } from "./repositories/status-history-repository.mock";
import { mockNotificationPreferenceRepository } from "./repositories/notification-preference-repository.mock";
import { mockChecklistItemRepository } from "./repositories/checklist-item-repository.mock";
import { mockTripGeographyRepository } from "./repositories/trip-geography-repository.mock";
import { mockTripCompanionRepository } from "./repositories/trip-companion-repository.mock";
import { mockTripShareLinkRepository } from "./repositories/trip-share-link-repository.mock";
import { mockLoyaltyProgramRepository } from "./repositories/loyalty-program-repository.mock";
import { mockIntegrationAccountRepository } from "./repositories/integration-account-repository.mock";
import { mockCompanionPollRepository } from "./repositories/companion-poll-repository.mock";
import { mockPlaceRecommendationRepository } from "./repositories/place-recommendation-repository.mock";
import { mockSharedInboxRepository } from "./repositories/shared-inbox-repository.mock";
import { mockPushSubscriptionRepository } from "./repositories/push-subscription-repository.mock";
import { mockUserRepository } from "./repositories/user-repository.mock";
import { getDataSource } from "./config";

let cachedPrismaTripRepository: TripRepository | undefined;
let cachedPrismaPlaceRepository: PlaceRepository | undefined;
let cachedPrismaBookingRepository: BookingRepository | undefined;
let cachedPrismaFinanceRepository: FinanceRepository | undefined;
let cachedPrismaTripPlaceRepository: TripPlaceRepository | undefined;
let cachedPrismaContactRepository: ContactRepository | undefined;
let cachedPrismaPlannedActivityRepository: PlannedActivityRepository | undefined;
let cachedPrismaRouteRepository: RouteRepository | undefined;
let cachedPrismaTripDayRepository: TripDayRepository | undefined;
let cachedPrismaDocumentRepository: DocumentRepository | undefined;
let cachedPrismaAuditLogRepository: AuditLogRepository | undefined;
let cachedPrismaPaymentCardRepository: PaymentCardRepository | undefined;
let cachedPrismaStatusHistoryRepository: StatusHistoryRepository | undefined;
let cachedPrismaNotificationPreferenceRepository: NotificationPreferenceRepository | undefined;
let cachedPrismaChecklistItemRepository: ChecklistItemRepository | undefined;
let cachedPrismaTripGeographyRepository: TripGeographyRepository | undefined;
let cachedPrismaTripCompanionRepository: TripCompanionRepository | undefined;
let cachedPrismaTripShareLinkRepository: TripShareLinkRepository | undefined;
let cachedPrismaLoyaltyProgramRepository: LoyaltyProgramRepository | undefined;
let cachedPrismaIntegrationAccountRepository: IntegrationAccountRepository | undefined;
let cachedPrismaCompanionPollRepository: CompanionPollRepository | undefined;
let cachedPrismaPlaceRecommendationRepository: PlaceRecommendationRepository | undefined;
let cachedPrismaSharedInboxRepository: SharedInboxRepository | undefined;
let cachedPrismaPushSubscriptionRepository: PushSubscriptionRepository | undefined;
let cachedPrismaUserRepository: UserRepository | undefined;

/**
 * נקודת הכניסה היחידה שקוד UI/business-logic אמור להשתמש בה — לעולם לא
 * לייבא Mock/Prisma Repository ישירות. כך המעבר בפועל ל-Supabase (שינוי
 * DATA_SOURCE=prisma) לא דורש לשנות שורת קוד אחת מעבר לכך.
 *
 * async בכוונה: טעינת @travel-app/db (ודרכו PrismaClient) נעשית ב-import()
 * דינמי, כדי שהיא לא תיטען כלל במצב דמו — מונע תלות ב-DATABASE_URL תקין
 * כשלא צריך אותו.
 */
export async function getTripRepository(): Promise<TripRepository> {
  if (getDataSource() === "mock") {
    return mockTripRepository;
  }

  if (!cachedPrismaTripRepository) {
    const { PrismaClient } = await import("@travel-app/db");
    const { PrismaTripRepository } = await import("./repositories/trip-repository.prisma");
    cachedPrismaTripRepository = new PrismaTripRepository(new PrismaClient());
  }
  return cachedPrismaTripRepository;
}

export async function getPlaceRepository(): Promise<PlaceRepository> {
  if (getDataSource() === "mock") {
    return mockPlaceRepository;
  }

  if (!cachedPrismaPlaceRepository) {
    const { PrismaClient } = await import("@travel-app/db");
    const { PrismaPlaceRepository } = await import("./repositories/place-repository.prisma");
    cachedPrismaPlaceRepository = new PrismaPlaceRepository(new PrismaClient());
  }
  return cachedPrismaPlaceRepository;
}

export async function getBookingRepository(): Promise<BookingRepository> {
  if (getDataSource() === "mock") {
    return mockBookingRepository;
  }

  if (!cachedPrismaBookingRepository) {
    const { PrismaClient } = await import("@travel-app/db");
    const { PrismaBookingRepository } = await import("./repositories/booking-repository.prisma");
    cachedPrismaBookingRepository = new PrismaBookingRepository(new PrismaClient());
  }
  return cachedPrismaBookingRepository;
}

export async function getFinanceRepository(): Promise<FinanceRepository> {
  if (getDataSource() === "mock") {
    return mockFinanceRepository;
  }

  if (!cachedPrismaFinanceRepository) {
    const { PrismaClient } = await import("@travel-app/db");
    const { PrismaFinanceRepository } = await import("./repositories/finance-repository.prisma");
    cachedPrismaFinanceRepository = new PrismaFinanceRepository(new PrismaClient());
  }
  return cachedPrismaFinanceRepository;
}

export async function getTripPlaceRepository(): Promise<TripPlaceRepository> {
  if (getDataSource() === "mock") {
    return mockTripPlaceRepository;
  }

  if (!cachedPrismaTripPlaceRepository) {
    const { PrismaClient } = await import("@travel-app/db");
    const { PrismaTripPlaceRepository } = await import("./repositories/trip-place-repository.prisma");
    cachedPrismaTripPlaceRepository = new PrismaTripPlaceRepository(new PrismaClient());
  }
  return cachedPrismaTripPlaceRepository;
}

export async function getContactRepository(): Promise<ContactRepository> {
  if (getDataSource() === "mock") {
    return mockContactRepository;
  }

  if (!cachedPrismaContactRepository) {
    const { PrismaClient } = await import("@travel-app/db");
    const { PrismaContactRepository } = await import("./repositories/contact-repository.prisma");
    cachedPrismaContactRepository = new PrismaContactRepository(new PrismaClient());
  }
  return cachedPrismaContactRepository;
}

export async function getPlannedActivityRepository(): Promise<PlannedActivityRepository> {
  if (getDataSource() === "mock") {
    return mockPlannedActivityRepository;
  }

  if (!cachedPrismaPlannedActivityRepository) {
    const { PrismaClient } = await import("@travel-app/db");
    const { PrismaPlannedActivityRepository } = await import("./repositories/planned-activity-repository.prisma");
    cachedPrismaPlannedActivityRepository = new PrismaPlannedActivityRepository(new PrismaClient());
  }
  return cachedPrismaPlannedActivityRepository;
}

export async function getRouteRepository(): Promise<RouteRepository> {
  if (getDataSource() === "mock") {
    return mockRouteRepository;
  }

  if (!cachedPrismaRouteRepository) {
    const { PrismaClient } = await import("@travel-app/db");
    const { PrismaRouteRepository } = await import("./repositories/route-repository.prisma");
    cachedPrismaRouteRepository = new PrismaRouteRepository(new PrismaClient());
  }
  return cachedPrismaRouteRepository;
}

export async function getTripDayRepository(): Promise<TripDayRepository> {
  if (getDataSource() === "mock") {
    return mockTripDayRepository;
  }

  if (!cachedPrismaTripDayRepository) {
    const { PrismaClient } = await import("@travel-app/db");
    const { PrismaTripDayRepository } = await import("./repositories/trip-day-repository.prisma");
    cachedPrismaTripDayRepository = new PrismaTripDayRepository(new PrismaClient());
  }
  return cachedPrismaTripDayRepository;
}

export async function getDocumentRepository(): Promise<DocumentRepository> {
  if (getDataSource() === "mock") {
    return mockDocumentRepository;
  }

  if (!cachedPrismaDocumentRepository) {
    const { PrismaClient } = await import("@travel-app/db");
    const { PrismaDocumentRepository } = await import("./repositories/document-repository.prisma");
    cachedPrismaDocumentRepository = new PrismaDocumentRepository(new PrismaClient());
  }
  return cachedPrismaDocumentRepository;
}

export async function getAuditLogRepository(): Promise<AuditLogRepository> {
  if (getDataSource() === "mock") {
    return mockAuditLogRepository;
  }

  if (!cachedPrismaAuditLogRepository) {
    const { PrismaClient } = await import("@travel-app/db");
    const { PrismaAuditLogRepository } = await import("./repositories/audit-log-repository.prisma");
    cachedPrismaAuditLogRepository = new PrismaAuditLogRepository(new PrismaClient());
  }
  return cachedPrismaAuditLogRepository;
}

export async function getPaymentCardRepository(): Promise<PaymentCardRepository> {
  if (getDataSource() === "mock") {
    return mockPaymentCardRepository;
  }

  if (!cachedPrismaPaymentCardRepository) {
    const { PrismaClient } = await import("@travel-app/db");
    const { PrismaPaymentCardRepository } = await import("./repositories/payment-card-repository.prisma");
    cachedPrismaPaymentCardRepository = new PrismaPaymentCardRepository(new PrismaClient());
  }
  return cachedPrismaPaymentCardRepository;
}

export async function getStatusHistoryRepository(): Promise<StatusHistoryRepository> {
  if (getDataSource() === "mock") {
    return mockStatusHistoryRepository;
  }

  if (!cachedPrismaStatusHistoryRepository) {
    const { PrismaClient } = await import("@travel-app/db");
    const { PrismaStatusHistoryRepository } = await import("./repositories/status-history-repository.prisma");
    cachedPrismaStatusHistoryRepository = new PrismaStatusHistoryRepository(new PrismaClient());
  }
  return cachedPrismaStatusHistoryRepository;
}

export async function getNotificationPreferenceRepository(): Promise<NotificationPreferenceRepository> {
  if (getDataSource() === "mock") {
    return mockNotificationPreferenceRepository;
  }

  if (!cachedPrismaNotificationPreferenceRepository) {
    const { PrismaClient } = await import("@travel-app/db");
    const { PrismaNotificationPreferenceRepository } = await import("./repositories/notification-preference-repository.prisma");
    cachedPrismaNotificationPreferenceRepository = new PrismaNotificationPreferenceRepository(new PrismaClient());
  }
  return cachedPrismaNotificationPreferenceRepository;
}

export async function getChecklistItemRepository(): Promise<ChecklistItemRepository> {
  if (getDataSource() === "mock") {
    return mockChecklistItemRepository;
  }

  if (!cachedPrismaChecklistItemRepository) {
    const { PrismaClient } = await import("@travel-app/db");
    const { PrismaChecklistItemRepository } = await import("./repositories/checklist-item-repository.prisma");
    cachedPrismaChecklistItemRepository = new PrismaChecklistItemRepository(new PrismaClient());
  }
  return cachedPrismaChecklistItemRepository;
}

export async function getTripGeographyRepository(): Promise<TripGeographyRepository> {
  if (getDataSource() === "mock") {
    return mockTripGeographyRepository;
  }

  if (!cachedPrismaTripGeographyRepository) {
    const { PrismaClient } = await import("@travel-app/db");
    const { PrismaTripGeographyRepository } = await import("./repositories/trip-geography-repository.prisma");
    cachedPrismaTripGeographyRepository = new PrismaTripGeographyRepository(new PrismaClient());
  }
  return cachedPrismaTripGeographyRepository;
}

export async function getTripCompanionRepository(): Promise<TripCompanionRepository> {
  if (getDataSource() === "mock") {
    return mockTripCompanionRepository;
  }

  if (!cachedPrismaTripCompanionRepository) {
    const { PrismaClient } = await import("@travel-app/db");
    const { PrismaTripCompanionRepository } = await import("./repositories/trip-companion-repository.prisma");
    cachedPrismaTripCompanionRepository = new PrismaTripCompanionRepository(new PrismaClient());
  }
  return cachedPrismaTripCompanionRepository;
}

export async function getTripShareLinkRepository(): Promise<TripShareLinkRepository> {
  if (getDataSource() === "mock") {
    return mockTripShareLinkRepository;
  }

  if (!cachedPrismaTripShareLinkRepository) {
    const { PrismaClient } = await import("@travel-app/db");
    const { PrismaTripShareLinkRepository } = await import("./repositories/trip-share-link-repository.prisma");
    cachedPrismaTripShareLinkRepository = new PrismaTripShareLinkRepository(new PrismaClient());
  }
  return cachedPrismaTripShareLinkRepository;
}

export async function getLoyaltyProgramRepository(): Promise<LoyaltyProgramRepository> {
  if (getDataSource() === "mock") {
    return mockLoyaltyProgramRepository;
  }

  if (!cachedPrismaLoyaltyProgramRepository) {
    const { PrismaClient } = await import("@travel-app/db");
    const { PrismaLoyaltyProgramRepository } = await import("./repositories/loyalty-program-repository.prisma");
    cachedPrismaLoyaltyProgramRepository = new PrismaLoyaltyProgramRepository(new PrismaClient());
  }
  return cachedPrismaLoyaltyProgramRepository;
}

export async function getIntegrationAccountRepository(): Promise<IntegrationAccountRepository> {
  if (getDataSource() === "mock") {
    return mockIntegrationAccountRepository;
  }

  if (!cachedPrismaIntegrationAccountRepository) {
    const { PrismaClient } = await import("@travel-app/db");
    const { PrismaIntegrationAccountRepository } = await import("./repositories/integration-account-repository.prisma");
    cachedPrismaIntegrationAccountRepository = new PrismaIntegrationAccountRepository(new PrismaClient());
  }
  return cachedPrismaIntegrationAccountRepository;
}

export async function getCompanionPollRepository(): Promise<CompanionPollRepository> {
  if (getDataSource() === "mock") {
    return mockCompanionPollRepository;
  }

  if (!cachedPrismaCompanionPollRepository) {
    const { PrismaClient } = await import("@travel-app/db");
    const { PrismaCompanionPollRepository } = await import("./repositories/companion-poll-repository.prisma");
    cachedPrismaCompanionPollRepository = new PrismaCompanionPollRepository(new PrismaClient());
  }
  return cachedPrismaCompanionPollRepository;
}

export async function getPlaceRecommendationRepository(): Promise<PlaceRecommendationRepository> {
  if (getDataSource() === "mock") {
    return mockPlaceRecommendationRepository;
  }

  if (!cachedPrismaPlaceRecommendationRepository) {
    const { PrismaClient } = await import("@travel-app/db");
    const { PrismaPlaceRecommendationRepository } = await import("./repositories/place-recommendation-repository.prisma");
    cachedPrismaPlaceRecommendationRepository = new PrismaPlaceRecommendationRepository(new PrismaClient());
  }
  return cachedPrismaPlaceRecommendationRepository;
}

export async function getSharedInboxRepository(): Promise<SharedInboxRepository> {
  if (getDataSource() === "mock") {
    return mockSharedInboxRepository;
  }

  if (!cachedPrismaSharedInboxRepository) {
    const { PrismaClient } = await import("@travel-app/db");
    const { PrismaSharedInboxRepository } = await import("./repositories/shared-inbox-repository.prisma");
    cachedPrismaSharedInboxRepository = new PrismaSharedInboxRepository(new PrismaClient());
  }
  return cachedPrismaSharedInboxRepository;
}

export async function getPushSubscriptionRepository(): Promise<PushSubscriptionRepository> {
  if (getDataSource() === "mock") {
    return mockPushSubscriptionRepository;
  }

  if (!cachedPrismaPushSubscriptionRepository) {
    const { PrismaClient } = await import("@travel-app/db");
    const { PrismaPushSubscriptionRepository } = await import("./repositories/push-subscription-repository.prisma");
    cachedPrismaPushSubscriptionRepository = new PrismaPushSubscriptionRepository(new PrismaClient());
  }
  return cachedPrismaPushSubscriptionRepository;
}

export async function getUserRepository(): Promise<UserRepository> {
  if (getDataSource() === "mock") {
    return mockUserRepository;
  }

  if (!cachedPrismaUserRepository) {
    const { PrismaClient } = await import("@travel-app/db");
    const { PrismaUserRepository } = await import("./repositories/user-repository.prisma");
    cachedPrismaUserRepository = new PrismaUserRepository(new PrismaClient());
  }
  return cachedPrismaUserRepository;
}

/**
 * מזג אוויר תמיד "אמיתי" (Open-Meteo, ספק חינמי) — לא תלוי ב-DATA_SOURCE
 * כמו שאר ה-Repositories, כי אין כאן נתוני משתמש שצריך לבודד ב-Demo.
 */
export function getWeatherProvider(): WeatherProvider {
  return openMeteoWeatherProvider;
}

/**
 * חישוב מרחק/זמן נסיעה — כמו Weather, תמיד "אמיתי" (OSRM, שרת דמו ציבורי
 * חינמי) ולא תלוי ב-DATA_SOURCE. ראה DECISIONS.md "מצב Routing".
 */
export function getRoutingProvider(): RoutingProvider {
  return osrmRoutingProvider;
}

/**
 * שער יציג — כמו Weather/Routing, תמיד "אמיתי" ולא תלוי ב-DATA_SOURCE (אין כאן
 * נתוני משתמש שצריך לבודד ב-Demo). ראה DECISIONS.md "CurrencyRateProvider".
 */
export function getCurrencyRateProvider(): CurrencyRateProvider {
  return boiFrankfurterCurrencyRateProvider;
}

/**
 * חיפוש מקומות אמיתיים (Overpass/OpenStreetMap, שרת ציבורי חינמי) — כמו
 * Weather/Routing/Currency, תמיד "אמיתי" ולא תלוי ב-DATA_SOURCE.
 */
export function getPoiProvider(): PoiProvider {
  return overpassPoiProvider;
}
