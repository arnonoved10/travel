import type { CreatePushSubscriptionInput, PushSubscription } from "@travel-app/shared-types";

/** מנוי Web Push גלובלי-פר-משתמש (לא פר-טיול) — אותו עיקרון כמו LoyaltyProgram/
 * PaymentCard. אין soft-delete: ביטול-הרשמה הוא מחיקה סופית, לא "פח". */
export interface PushSubscriptionRepository {
  listForUser(params: { userId: string }): Promise<PushSubscription[]>;
  upsert(params: { userId: string; input: CreatePushSubscriptionInput }): Promise<PushSubscription>;
  /** נקרא גם כשהדפדפן עצמו מבטל מנוי (endpoint הפך ללא-תקף) — לא רק מפעולת-משתמש מפורשת. */
  deleteByEndpoint(params: { endpoint: string }): Promise<void>;
}
