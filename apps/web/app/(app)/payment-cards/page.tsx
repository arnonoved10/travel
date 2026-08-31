import { redirect } from "next/navigation";

// מוזג לתוך /contacts (טאב) ב-2026-08-28 (בקשת משתמש: "מה צריך להוריד...
// שיהיה מובן ומסודר") — 4 עמודי-רשימה גלובליים כמעט-זהים הפכו לרכזת אחת.
// נשאר כ-redirect כדי לא לשבור סימניות/קישורים ישנים.
export default function PaymentCardsPage() {
  redirect("/contacts?tab=payment-cards");
}
