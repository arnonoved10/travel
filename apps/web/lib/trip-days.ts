/**
 * מייצר את רשימת התאריכים (ISO, YYYY-MM-DD) בטווח טיול, כולל שני הקצוות.
 * מחושב באופן חי מ-startDate/endDate — לא נשמר כישות נפרדת בשלב הזה, כך
 * שהוא תמיד נכון אחרי הארכה/קיצור בלי צורך בסנכרון ידני. כשייבנו ישויות
 * שמקושרות ליום ספציפי (Booking/PlannedActivity per day), Trip Day יהפוך
 * לישות אמיתית ב-Prisma (כבר קיימת בסכימה) — ראה 01_architecture_v2.md.
 */
export function getTripDayDates(startDate: string, endDate: string): string[] {
  const dates: string[] = [];
  let current = new Date(`${startDate}T00:00:00Z`);
  const end = new Date(`${endDate}T00:00:00Z`);

  if (Number.isNaN(current.getTime()) || Number.isNaN(end.getTime()) || current > end) {
    return dates;
  }

  while (current <= end) {
    dates.push(current.toISOString().slice(0, 10));
    current = new Date(current.getTime() + 24 * 60 * 60 * 1000);
  }
  return dates;
}
