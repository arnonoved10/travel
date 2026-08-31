// עזרי אזור-זמן — Intl.DateTimeFormat המובנה בדפדפן/Node תומך ב-IANA timezone
// ישירות, אין צורך בספרייה חיצונית. עד עכשיו כל התאריכים הוצגו תמיד בזמן
// השרת/דפדפן המקומי (toLocaleString בלי timeZone) — גם כש-Flight/HotelStay
// שמרו אזור זמן אמיתי לכל רגל. ראה IMPLEMENTATION_GAPS.md P1 סעיף 1.

/** departureTimezone/pickupTimezone וכו' הם שדות טקסט-חופשי במסד-הנתונים
 * (הוזנו ידנית, למשל "Asia/Bangkok") — ערך לא-תקין (למשל "תאילנד", שם-מדינה
 * במקום IANA timezone) גורם ל-Intl.DateTimeFormat לזרוק RangeError שמפיל את
 * כל ה-render בצד-שרת (תקלה אמיתית שקרתה בפרודקשן — כל עמוד-הטיול קרס).
 * נופל בחזרה ל-UTC (תמיד תקין) במקום לתת לדף כולו לקרוס בגלל שדה-נתונים אחד. */
export function safeTimeZone(timeZone: string): string {
  try {
    new Intl.DateTimeFormat("en-US", { timeZone });
    return timeZone;
  } catch {
    return "UTC";
  }
}

export function formatTimeInZone(iso: string, timeZone: string): string {
  return new Intl.DateTimeFormat("he-IL", { hour: "2-digit", minute: "2-digit", timeZone: safeTimeZone(timeZone) }).format(new Date(iso));
}

export function formatDateTimeInZone(iso: string, timeZone: string): string {
  return new Intl.DateTimeFormat("he-IL", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
    timeZone: safeTimeZone(timeZone),
  }).format(new Date(iso));
}

/** לתצוגה כפולה — "14:30 (אזור יעד) · 09:30 (שעון ישראל)" — כדי שהמשתמש לא יצטרך לחשב הפרש שעות בעצמו. */
export function formatTimeWithIsraelReference(iso: string, timeZone: string): string {
  const local = formatTimeInZone(iso, timeZone);
  const israel = formatTimeInZone(iso, "Asia/Jerusalem");
  if (timeZone === "Asia/Jerusalem") return local;
  return `${local} (שעון מקומי) · ${israel} (שעון ישראל)`;
}
