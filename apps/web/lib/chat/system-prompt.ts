import type { ActivityReservation, CarRental, Expense, Flight, HotelStay, Insurance, TransportBooking, Trip, Wallet } from "@travel-app/shared-types";

const CURRENCY_HINTS = [
  "שקל / שקלים / ש\"ח / ₪ / NIS → ILS",
  "באט / בהט / THB → THB",
  "דולר / $ / USD → USD",
  "יורו / € / EUR → EUR",
].join("\n");

const RECENT_ITEMS_LIMIT = 10;

function summarizeRecentEntities({
  hotelStays,
  flights,
  transportBookings,
  expenses,
  insurances,
  carRentals,
}: {
  hotelStays: HotelStay[];
  flights: Flight[];
  transportBookings: TransportBooking[];
  expenses: Expense[];
  insurances: Insurance[];
  carRentals: CarRental[];
}): string {
  const lines: string[] = [];
  for (const h of hotelStays.slice(0, RECENT_ITEMS_LIMIT)) {
    lines.push(`מלון: "${h.hotelName}", ${h.checkInDate}–${h.checkOutDate}, hotelStayId=${h.id}`);
  }
  for (const f of flights.slice(0, RECENT_ITEMS_LIMIT)) {
    lines.push(`טיסה: ${f.airline} ${f.departureAirport}→${f.arrivalAirport}, ${f.departureAt.slice(0, 10)}, flightId=${f.id}`);
  }
  for (const t of transportBookings.slice(0, RECENT_ITEMS_LIMIT)) {
    lines.push(`הסעה: ${t.pickupText ?? "?"} → ${t.dropoffText ?? "?"}, ${t.pickupAt.slice(0, 10)}, transportBookingId=${t.id}`);
  }
  for (const e of expenses.slice(0, RECENT_ITEMS_LIMIT)) {
    lines.push(`הוצאה: ${e.description ?? e.category}, ${e.amount} ${e.currencyCode}, ${e.expenseAt.slice(0, 10)}, expenseId=${e.id}`);
  }
  for (const ins of insurances.slice(0, RECENT_ITEMS_LIMIT)) {
    lines.push(`ביטוח: ${ins.company}, ${ins.startDate}–${ins.endDate}, insuranceId=${ins.id}`);
  }
  for (const c of carRentals.slice(0, RECENT_ITEMS_LIMIT)) {
    lines.push(`השכרת רכב: ${c.companyName}, ${c.pickupAt.slice(0, 10)}, carRentalId=${c.id}`);
  }
  return lines.length > 0 ? lines.join("\n") : "אין עדיין שום הזמנה/הוצאה רשומה בטיול הזה.";
}

/** בונה פרומפט-מערכת עם הקשר חי — טיול פעיל, ארנקים קיימים, והפריטים
 * האחרונים מכל סוג (עם ה-ID האמיתי שלהם). בלי הרשימה הזו שום כלי update_*
 * לא בר-הפעלה כלל — למודל אין שום דרך אחרת לדעת לאיזה ID "המלון שהזמנתי"
 * מתייחס. */
export function buildChatSystemPrompt({
  today,
  activeTrip,
  wallets,
  hasLocation,
  hotelStays,
  flights,
  transportBookings,
  expenses,
  insurances,
  carRentals,
}: {
  today: string;
  activeTrip: Trip | null;
  wallets: Wallet[];
  hasLocation: boolean;
  hotelStays: HotelStay[];
  flights: Flight[];
  transportBookings: TransportBooking[];
  expenses: Expense[];
  insurances: Insurance[];
  carRentals: CarRental[];
}): string {
  const tripContext = activeTrip
    ? `הטיול הפעיל כרגע: "${activeTrip.name}" (${activeTrip.startDate} עד ${activeTrip.endDate}, מזהה ${activeTrip.id}).`
    : "אין טיול פעיל כרגע. הכלים היחידים שאפשר להפעיל בלי טיול פעיל הם create_trip, find_nearby_places, ו-recommend_places (כלי-קריאה). לכל שאר הכלים (הוצאה/הזמנה/עדכון) — אם המשתמש לא פתח טיול חדש קודם, שאל אותו האם לפתוח טיול חדש או שיש טיול קיים שהוא מתכוון אליו.";

  const walletContext =
    wallets.length > 0
      ? `הארנקים הקיימים בטיול הזה: ${wallets.map((w) => `${w.currencyCode} (יתרה ${w.currentBalance})`).join(", ")}.`
      : "אין עדיין אף ארנק בטיול הזה — כל פעולה עם מטבע חדש תיצור ארנק חדש באותו מטבע בדיוק.";

  const entitiesContext = activeTrip
    ? `הפריטים האחרונים בטיול הזה (עד ${RECENT_ITEMS_LIMIT} מכל סוג) — כשהמשתמש מתייחס ל"המלון"/"ההוצאה האחרונה"/"הטיסה" בלי לפרט, תמצא את ה-ID המתאים כאן ותשתמש בו בכלי update_*. אם יש כמה פריטים מתאימים ולא ברור לאיזה הוא מתכוון — שאל, אל תנחש:\n${summarizeRecentEntities({ hotelStays, flights, transportBookings, expenses, insurances, carRentals })}`
    : "";

  const locationContext = hasLocation
    ? "יש למערכת גישה למיקום ה-GPS הנוכחי של המשתמש — find_nearby_places זמין."
    : "אין כרגע גישה למיקום המשתמש (לא אישר/הדפדפן לא תמך) — אם המשתמש מבקש \"קרוב אליי\", תגיד לו שצריך לאשר גישה למיקום בפאנל הצ'אט, אל תפעיל את find_nearby_places בלי מיקום אמיתי.";

  return [
    "אתה העוזר האישי בתוך אפליקציית ניהול-טיולים בשם Trip Master. אתה עונה תמיד בעברית, בקצרה וברורות.",
    "המשתמש כותב לך בשפה חופשית על מה שקרה בטיול, מבקש המלצות/חיפוש מקומות, מתכנן ימים, פותח טיולים חדשים, ומבקש לתקן פרטים שכבר נרשמו — ואתה קורא לכלי המתאים כדי לבצע את זה בפועל במערכת, בדיוק כמו שהיית עושה דרך המסכים הרגילים.",
    "",
    `היום: ${today}.`,
    tripContext,
    walletContext,
    locationContext,
    "",
    entitiesContext,
    "",
    "כללי מטבע — קריטי: תמיד תחזיר currencyCode כקוד ISO-4217 בן 3 אותיות, לפי הטבלה הבאה:",
    CURRENCY_HINTS,
    "אם המשתמש לא ציין מטבע במפורש, ואי-אפשר להסיק אותו בבטחון מהקשר (למשל ממטבע-הבסיס של הטיול), אל תנחש — שאל אותו.",
    "",
    "הבחנה חשובה: find_nearby_places ו-recommend_places הם כלי-קריאה בלבד — משתמשים בהם כשהמשתמש שואל/מחפש/רוצה המלצות, ולעולם לא כותבים איתם שום דבר. plan_day/book_*/create_expense/update_* הם כלי-כתיבה — משתמשים בהם רק כשהמשתמש אומר במפורש לבצע/לרשום/להוסיף/לתכנן, לא רק שואל שאלה. אם המשתמש רק שואל \"מה יש לראות ליד המלון\" — תענה עם recommend_places/find_nearby_places, אל תוסיף שום דבר למסלול בעצמך; רק אם הוא אומר \"תוסיף את זה ליום 3\" תשתמש ב-plan_day.",
    "אם ההודעה לא מתארת שום פעולה שיש לה כלי מתאים, אל תפעיל שום כלי — פשוט ענה בטקסט.",
    "אם אתה לא בטוח לאיזה טיול/מטבע/תאריך/ישות-קיימת הפעולה מתייחסת — אל תפעיל כלי, שאל שאלה מבהירה קצרה במקום. עדיף לשאול מאשר לבצע פעולה שגויה.",
    "אחרי כל כלי-כתיבה שהפעלת, כתוב תשובה קצרה וידידותית שמסכמת מה נרשם (כמו קבלה) — לא רק \"בוצע\".",
  ].join("\n");
}
