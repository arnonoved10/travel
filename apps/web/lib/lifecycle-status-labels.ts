import type { LifecycleStatus } from "@travel-app/shared-types";

export const LIFECYCLE_STATUS_LABELS: Record<LifecycleStatus, string> = {
  want_to_book: "רוצה להזמין",
  planned: "מתוכנן",
  need_to_book: "צריך להזמין",
  booked: "הוזמן",
  partially_paid: "שולם חלקית",
  paid: "שולם",
  done: "בוצע",
  not_done: "לא בוצע",
  postponed: "נדחה",
  cancelled: "בוטל",
};

export const LIFECYCLE_STATUS_ORDER: LifecycleStatus[] = [
  "want_to_book",
  "planned",
  "need_to_book",
  "booked",
  "partially_paid",
  "paid",
  "done",
  "not_done",
  "postponed",
  "cancelled",
];
