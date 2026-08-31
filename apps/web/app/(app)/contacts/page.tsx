import { redirect } from "next/navigation";
import { getCurrentUser } from "@/lib/auth/get-current-user";
import {
  getContactRepository,
  getTripRepository,
  getPaymentCardRepository,
  getLoyaltyProgramRepository,
  getIntegrationAccountRepository,
} from "@travel-app/data-layer";
import { ReferenceHubTabs } from "./reference-hub-tabs";

export const dynamic = "force-dynamic";

/**
 * רכזת "אנשי קשר ופרטים" — מיזוג 2026-08-28 (בקשת משתמש: "מה צריך להוריד...
 * שיהיה מובן ומסודר") של 4 עמודים גלובליים כמעט-זהים (אנשי-קשר/כרטיסי-
 * תשלום/נקודות-מיילים/חשבונות-חיצוניים) לטאבים בתוך עמוד אחד, במקום 4 מקומות
 * נפרדים בניווט הראשי. `/payment-cards`, `/loyalty-programs`,
 * `/integration-accounts` הפכו ל-redirect לכאן עם `?tab=`.
 */
export default async function ContactsHubPage({
  searchParams,
}: {
  searchParams: Promise<{ tab?: string }>;
}) {
  const user = await getCurrentUser();
  if (!user) redirect("/login");

  const { tab } = await searchParams;

  const contactRepository = await getContactRepository();
  const tripRepository = await getTripRepository();
  const paymentCardRepository = await getPaymentCardRepository();
  const loyaltyProgramRepository = await getLoyaltyProgramRepository();
  const integrationAccountRepository = await getIntegrationAccountRepository();

  const [contacts, trips, paymentCards, loyaltyPrograms, integrationAccounts] = await Promise.all([
    contactRepository.list({ userId: user.id }),
    tripRepository.list({ userId: user.id }),
    paymentCardRepository.list({ userId: user.id }),
    loyaltyProgramRepository.list({ userId: user.id }),
    integrationAccountRepository.list({ userId: user.id }),
  ]);
  const tripNameById = new Map(trips.map((trip) => [trip.id, trip.name]));

  return (
    <ReferenceHubTabs
      initialTab={tab}
      contacts={contacts}
      tripNameById={Object.fromEntries(tripNameById)}
      paymentCards={paymentCards}
      loyaltyPrograms={loyaltyPrograms}
      integrationAccounts={integrationAccounts}
    />
  );
}
