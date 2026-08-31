import type { PaymentMethod } from "@travel-app/shared-types";

// כרטיס-אשראי ראשון — בקשת משתמש מפורשת: "...ולאחר מכן כרטיס אשראי..." בתוך
// סדר-העדיפות הכללי לתשלום. סדר-המפתחות כאן קובע את סדר ה-<option>-ים בכל
// מקום שמשתמש ב-Object.entries(PAYMENT_METHOD_LABELS) (למשל ExpenseCreateForm).
export const PAYMENT_METHOD_LABELS: Record<PaymentMethod, string> = {
  credit_card: "כרטיס אשראי",
  cash: "מזומן",
  debit_card: "כרטיס חיוב",
  digital_wallet: "ארנק דיגיטלי",
  bank_transfer: "העברה בנקאית",
  other: "אחר",
};
