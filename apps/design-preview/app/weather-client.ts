import type { DemoWeatherResult } from "./actions";

/**
 * שולפת מזג-אוויר אמיתי דרך /api/weather (Route Handler רגיל) — לא server
 * action. ראו ההערה המפורטת ב-app/actions.ts: אותה קריאה בדיוק נכשלה
 * לעיתים קרובות (מוחזר null בלי חריגה) כשנקראה כ-server action מרכיב-
 * לקוח על production, אך הצליחה תמיד כ-Route Handler רגיל שנקרא ב-fetch
 * ישיר. כל שלושת מסכי מזג-האוויר (דף-הבית/יומן/מזג-אוויר) קוראים לכאן,
 * לא ל-actions.ts.
 */
export async function fetchWeather(location?: { lat: number; lng: number }): Promise<DemoWeatherResult | null> {
  try {
    const params = location ? `?lat=${location.lat}&lng=${location.lng}` : "";
    const res = await fetch(`/api/weather${params}`);
    if (!res.ok) return null;
    return (await res.json()) as DemoWeatherResult | null;
  } catch {
    return null;
  }
}
