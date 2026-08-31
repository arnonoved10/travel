import type { OpeningHours } from "@travel-app/shared-types";
import { isOpenNow } from "@/lib/opening-hours";

/** לא מציג כלום אם אין נתוני שעות פתיחה אמיתיים — לעולם לא מנחשים. */
export function OpenNowBadge({ openingHours }: { openingHours: OpeningHours | null }) {
  const open = isOpenNow(openingHours, new Date());
  if (open === null) return null;

  return open ? (
    <span style={{ color: "#4ade80", fontSize: "0.8125rem", fontWeight: 600 }}>🟢 פתוח עכשיו</span>
  ) : (
    <span style={{ color: "#f87171", fontSize: "0.8125rem", fontWeight: 600 }}>🔴 סגור עכשיו</span>
  );
}
