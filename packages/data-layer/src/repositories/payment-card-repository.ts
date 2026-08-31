import type { CreatePaymentCardInput, PaymentCard } from "@travel-app/shared-types";

/** אמצעי תשלום גלובלי של המשתמש (לא לפי טיול) — אין deletedAt בסכימה, אין Soft Delete. */
export interface PaymentCardRepository {
  list(params: { userId: string }): Promise<PaymentCard[]>;
  create(params: { userId: string; input: CreatePaymentCardInput }): Promise<PaymentCard>;
}
