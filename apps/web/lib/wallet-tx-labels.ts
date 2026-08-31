import type { WalletTransaction } from "@travel-app/shared-types";

export const WALLET_TX_TYPE_LABELS: Record<WalletTransaction["type"], string> = {
  top_up: "טעינה",
  cash_payment_out: "תשלום במזומן",
  exchange_out: "המרה (יצא)",
  exchange_in: "המרה (נכנס)",
  refund_in: "החזר",
  deposit_out: "פיקדון (שולם)",
  deposit_return_in: "פיקדון (הוחזר)",
  adjustment: "התאמת יתרה",
};
