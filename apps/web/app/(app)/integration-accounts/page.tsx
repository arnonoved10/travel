import { redirect } from "next/navigation";

// מוזג לתוך /contacts (טאב) ב-2026-08-28 — ר' ההערה המקבילה ב-payment-cards/page.tsx.
export default function IntegrationAccountsPage() {
  redirect("/contacts?tab=integration-accounts");
}
