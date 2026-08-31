import type { LifecycleStatus } from "@travel-app/shared-types";
import type { StatusBadgeTone } from "@/components/ui/StatusBadge";

/** גוון-תצוגה לכל סטטוס-מחזור-חיים — נגזר מהמשמעות (עוד לא בוצע/הוזמן/שולם/בוטל), לא שרירותי. */
export const LIFECYCLE_STATUS_TONE: Record<LifecycleStatus, StatusBadgeTone> = {
  want_to_book: "neutral",
  planned: "info",
  need_to_book: "warning",
  booked: "brand",
  partially_paid: "warning",
  paid: "success",
  done: "success",
  not_done: "neutral",
  postponed: "warning",
  cancelled: "danger",
};
