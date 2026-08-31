/**
 * מפרק הפרש זמן (מילישניות, יכול להיות שלילי לאירוע שכבר עבר) לטקסט קריא
 * בעברית — משמש בכל טיימר חי באפליקציה (טיסות/מעבורות/צ'ק-אין/צ'ק-אאוט/
 * החזרת רכב שכור/פעילות מתוכננת) כדי שהפורמט יהיה עקבי בכל מקום.
 */
export function formatCountdown(ms: number): string {
  if (ms <= 0) return "עבר";

  const totalMinutes = Math.round(ms / 60_000);
  const days = Math.floor(totalMinutes / 1440);
  const hours = Math.floor((totalMinutes % 1440) / 60);
  const minutes = totalMinutes % 60;

  const parts: string[] = [];
  if (days > 0) parts.push(`${days} ${days === 1 ? "יום" : "ימים"}`);
  if (hours > 0) parts.push(`${hours} ${hours === 1 ? "שעה" : "שעות"}`);
  if (minutes > 0 || parts.length === 0) parts.push(`${minutes} ${minutes === 1 ? "דקה" : "דקות"}`);

  return `בעוד ${parts.join(" ו-")}`;
}

/** מספר הימים (יכול להיות שלילי) בין היום לתאריך נתון (YYYY-MM-DD), לפי תאריך לוח בלבד — לא שעה. */
export function daysUntil(dateStr: string, today: Date = new Date()): number {
  const target = new Date(`${dateStr.slice(0, 10)}T00:00:00.000Z`);
  const todayUtc = new Date(`${today.toISOString().slice(0, 10)}T00:00:00.000Z`);
  return Math.round((target.getTime() - todayUtc.getTime()) / 86_400_000);
}

/** גרסת ימים-בלבד — לנתונים שיש להם רק תאריך (לא שעה מדויקת), כמו תום ביטוח, כדי לא להמציא שעה. */
export function formatDaysRemaining(daysFromNow: number): string {
  if (daysFromNow < 0) return "הסתיים";
  if (daysFromNow === 0) return "מסתיים היום";
  if (daysFromNow === 1) return "נשאר יום אחד";
  return `נשארו ${daysFromNow} ימים`;
}
