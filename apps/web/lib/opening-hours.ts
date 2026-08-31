import type { DayHours, OpeningHours } from "@travel-app/shared-types";

const DAY_KEYS: Array<keyof OpeningHours> = ["sun", "mon", "tue", "wed", "thu", "fri", "sat"];

function toMinutes(time: string): number {
  const parts = time.split(":");
  const hours = Number(parts[0]);
  const minutes = Number(parts[1]);
  return hours * 60 + minutes;
}

function isWithinTodayRange(day: DayHours, nowMinutes: number): boolean {
  if (!day) return false;
  const open = toMinutes(day.open);
  const close = toMinutes(day.close);
  if (close <= open) {
    // חוצה חצות (למשל 22:00–02:00) — מהיום הזה פתוח עד חצות בלבד, ההמשך נבדק דרך "אתמול".
    return nowMinutes >= open;
  }
  return nowMinutes >= open && nowMinutes < close;
}

/**
 * true/false רק כשיש נתוני שעות פתיחה אמיתיים ל-Place. מחזיר null כשאין
 * openingHours בכלל — לעולם לא מנחשים אם מקום פתוח בלי מידע אמיתי.
 */
export function isOpenNow(openingHours: OpeningHours | null, now: Date): boolean | null {
  if (!openingHours) return null;

  const nowMinutes = now.getHours() * 60 + now.getMinutes();
  const todayKey = DAY_KEYS[now.getDay()] as keyof OpeningHours;
  const today = openingHours[todayKey];
  if (isWithinTodayRange(today, nowMinutes)) return true;

  // ממשיכים לבדוק אם שעות "אתמול" חוצות חצות ועדיין פתוחות עכשיו.
  const yesterdayKey = DAY_KEYS[(now.getDay() + 6) % 7] as keyof OpeningHours;
  const yesterday = openingHours[yesterdayKey];
  if (yesterday && toMinutes(yesterday.close) <= toMinutes(yesterday.open) && nowMinutes < toMinutes(yesterday.close)) {
    return true;
  }

  return false;
}
