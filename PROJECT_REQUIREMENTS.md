# PROJECT_REQUIREMENTS.md — דרישות עסקיות ופונקציונליות

**קובץ זה מתאר מה האפליקציה אמורה לעשות בסופו של דבר — לא מה כבר בוצע.** למצב הפיתוח בפועל ראה `PROJECT_STATE.md`. סטטוס לכל דרישה: `Not Started` / `Planned` / `In Progress` / `Blocked` / `Completed`. אל תמחק דרישה כי היא עוד לא פותחה — רק עדכן סטטוס.

---

## 0. עקרונות עבודה קבועים (לא נתונים לשינוי)
- כל העבודה **רק** בתוך `C:\Users\ארנון\OneDrive\Desktop\קלוד קוד\טיולים`. אסור לגעת בתיקיית "אפליקציית ניהול מוניות" או כל פרויקט אחר.
- אין להתחיל שלב חדש בלי סיום ובדיקה של הקודם. אין לבנות הכל בבת אחת.
- אין קוד שרק "נראה כאילו עובד" — אין Placeholder שמתחזה ליכולת עובדת, אין Mock Data שנראה כמו נתון אמיתי, אין המצאת API.
- Soft Delete בלבד — לא מחיקה פיזית בלתי הפיכה, בלי יצירת orphan records.
- Git מקומי בלבד — בלי Remote, בלי Push (Status: **Completed**, ראה DECISIONS.md).
- Demo Data מותר רק ב-Development, מסומן `[דמו]` בבירור, לא מוצג כאילו הוא אמיתי (Status: **Completed**).
- לפני שימוש בכל Secret: לוודא שהוא בקובץ environment מתאים, מוחרג מ-Git, לא מגיע ל-Client Bundle.

---

## 1. Trip (טיול) — Status: **In Progress** (ליבה הושלמה, בדיקות live על Supabase חסרות)
- שם, מדינה/ות, עיר/ות, תאריך התחלה/סיום, מספר ימים, מטבע בסיס לדוחות, סטטוס, הערות, תמונה ראשית — Status: **Completed** (בלי תמונה/מדינות-ערים מובנות עדיין — Status: **Not Started** לחלק זה).
- הארכה/קיצור טיול (שינוי תאריכים) — Status: **Completed**.
- כאשר משנים תאריכים: בדיקת השפעה (לילות ללא מלון, מלונות מחוץ לטווח, חפיפת מלונות, פעילויות/טיסות מחוץ לטווח, ימים חדשים ללא תכנון) — Status: **Not Started** (הטיפוס `TripDateChangeImpactReport` קיים ב-shared-types, אבל מנוע הבדיקה בפועל לא נבנה; מתוכנן לשלב "מנוע חוסרים").
- Create/Read/List/Update/Soft Delete/Restore — Status: **Completed** (מול Mock; **לא נבדק live מול Supabase**).

## 2. Trip Day — Status: **In Progress**
- לכל יום: איפה ישן, מה מתוכנן/הוזמן/שולם, מה חסר להזמין/לשלם, טיסות/מוניות/הסעות/מעבורות/רכבות/אטרקציות/מסעדות/קפה/מסאז'ים/קניות/פעילויות/הוצאות/מסמכים/התראות של אותו יום — Status: **Not Started** (כרגע יש רק לוח ימים מחושב חי מהתאריכים, בלי תוכן פר-יום מפורט).
- כרגע: Trip Day מחושב באופן חי (`getTripDayDates`), לא ישות שמורה — Status: **Completed** לחלק הבסיסי.

## 3. Places — Status: **In Progress**
- ספרייה גלובלית אישית (לא לפי טיול) — Status: **Completed**.
- שדות: שם, קטגוריה, כתובת, מדינה, עיר, lat/lng, אתר, טלפון, WhatsApp, אימייל, קישור מפה, קישורים נוספים, שעות פתיחה (לפי יום), תמונות, הערות, דירוג אישי, ביקרתי/מועדף/רוצה להגיע/לא רוצה לחזור — Status: **In Progress** (שם/קטגוריה/כתובת/עיר/מדינה/מועדף קיימים; שעות פתיחה, תמונות, דירוג, lat/lng ב-UI — **Not Started**).
- "כמה פעמים הייתי, באילו טיולים, כמה הוצאתי שם" — Status: **Not Started**.
- TripPlace (קשר Trip↔Place עם סטטוס פר-טיול: רוצה להגיע/מתוכנן/בוצע/לא בוצע/מועדף/לא רוצה לחזור) — Status: **Completed** (קישור + סטטוס; אין UI לשינוי/הסרת קישור עדיין).

## 4. Planned Activity — Status: **In Progress**
- רצון/תוכנית בלי הזמנה. שדות: Trip, Place אופציונלי, שם, קטגוריה, תאריך/שעה מתוכננים, משך משוער, מחיר משוער, מטבע משוער, הערות, סטטוס (כל 10 ערכי LifecycleStatus) — **Completed** (2026-08-15), Repository (Mock+Prisma+7 בדיקות) + UI (רשימה/יצירה/שינוי סטטוס inline/הסרה) בתוך מסך הטיול, נבדק חי.
- Trip Day (קישור לפי יום ספציפי) — **Not Started** (כרגע ללא שיוך ליום; Trip Day עצמו מחושב חי, לא ישות שמורה).
- תצוגת קנבן אמיתית (גרירה בין עמודות סטטוס) — **Completed** (2026-08-16): טוגל בין רשימה לקנבן, HTML5 drag-and-drop native, נבדק חי כולל אימות שהשינוי נשמר בפועל אחרי רענון דף.
- הפיכה ל-Booking בלי לאבד מידע ובלי כפילות ביומן — **Completed** (Mock; Prisma implementation כתוב, לא נבדק live). עמוד `/trips/[tripId]/planned-activities/[id]/convert` — בחירת תת-סוג (מלון/טיסה/תחבורה/ביטוח/השכרת רכב) + טופס ממולא מראש משם/תאריך/מחיר התכנון. התכנון עצמו לא נמחק — מקבל `bookingId` אמיתי (FK ל-Booking.id) וסטטוס עובר ל-booked. נבדק חי: המרת "[דמו] סיור באי פי פי" להסעת מעבורת.

## 5. Booking — Status: **In Progress**
- שדות כלליים: Trip, Place, Planned Activity, ספק, סוג, תאריכי/שעות התחלה-סיום, מחיר מוסכם, מטבע, סטטוס הזמנה, סטטוס תשלום, מספר הזמנה, Confirmation Number, External Booking ID, מקור, קישורים, מסמכים, הערות — Status: **Completed** לשדות הליבה (מלון/טיסה/תחבורה); Insurance/Car Rental/Activity Reservation — **Not Started**.
- סטטוסי הזמנה/תשלום לפי המפרט — Status: **Completed** (enum מלא בסכימה).

### 5א. מלונות (Hotel Stay) — Status: **Completed** (Mock)
שם, Place, כתובת, מיקום, צ'ק אין/אאוט (תאריך+שעה), לילות, סוג חדר/מיטה, קומה, נוף, מס' אורחים, מחיר/לילה, מחיר כולל, מטבע, שולם/נשאר, סטטוס הזמנה/תשלום, מספר הזמנה, מקור, קישורים, טלפון/WhatsApp/מייל, מסמכים, הערות — שדות ליבה מומשו; שדה/נוף/מסמכים/קישורים חיצוניים — **Not Started**.
ארוחות: ללא/כלול/בתשלום נוסף/חצי פנסיון/פנסיון מלא/הכל כלול, שעות/מיקום/מחיר/יחידת מחיר — Status: **In Progress** (mealPlan נשמר; UI לפרטי ארוחת בוקר — **Not Started**).
Booking Benefits (ארוחת בוקר/הסעה/צ'ק אין מוקדם/וכו') — קיים בסכימה, **Not Started** ב-UI.

### 5ב. טיסות (Flight) — Status: **Completed** (Mock)
חברה, מספר טיסה, שדות יציאה/יעד, טרמינל, תאריך/שעות, משך, מושב, כבודה, מספר הזמנה, מחיר, מטבע, סטטוס תשלום, מסמכים, קישורים — שדות ליבה מומשו; טרמינל/כבודה/מסמכים — **Not Started** ב-UI. תמיכה במספר בלתי מוגבל של טיסות — Status: **Completed**.

### 5ג. מוניות/תחבורה (Transport Booking) — Status: **Completed** (Mock)
מקום/כתובת/lat-lng איסוף ויעד, תאריך/שעת איסוף, זמן נסיעה משוער, שעת הגעה משוערת, נוסעים, מזוודות, סוג רכב, נהג, חברה, מחיר/מקדמה/יתרה, כבישי אגרה/חניה/טיפ, מסמכים/קבלה — שדות ליבה מומשו; ETA/כבישי אגרה/טיפ/מסמכים — **Not Started** ב-UI.
הצעות מחיר (TransportQuote) — קיים בסכימה, **Not Started** ב-UI.

### 5ד. מעבורות, רכבת, אוטובוס — Status: **Completed** (כל 7 הערכים ב-TransportMode — מונית/הסעה פרטית/מעבורת/רכבת/אוטובוס/מונית מים/אחר — זמינים בטופס TransportBookingForm; לא ברור מתי בדיוק זה נבנה, תוקן פה כי סעיף זה היה מיושן ביחס לקוד בפועל)

### 5ה. השכרת רכב/אופנוע — Status: **Completed** (Mock; Prisma implementation כתוב, לא נבדק live)
נוסף `CarRental` כטבלה ייעודית ב-schema.prisma (bookingType=car_rental היה קיים כערך enum בלבד לפני כן) — סוג רכב (רכב/אופנוע/קטנוע/אופניים/אחר), חברה, דגם, מספר רישוי, איסוף/החזרה (מיקום+זמן+אזור זמן), דרישות נהג, ביטוח כלול, פיקדון. UI מלא (טופס+רשימה+מחיקה) במסך הטיול. נבדק חי.

### 5ו. ביטוח (Insurance) — Status: **Completed** (Mock; Prisma implementation כתוב, לא נבדק live)
כסוג Booking נוסף (כמו מלון/טיסה/תחבורה): חברה, סוג פוליסה, תאריכי תוקף, מספר פוליסה, טלפון חירום — נבדק חי בדפדפן. WhatsApp/אימייל/אתר חירום, השתתפות עצמית, הרחבות כיסוי — **Not Started** ב-UI (קיימים בסכימה/טיפוסים).

## 6. מסאז'ים, אוכל, פירות, קניות, אטרקציות — Status: **In Progress**
נרשמים כ-Expense עם קטגוריה מתאימה (כל קטגוריה כולל אלו — free text מאז שהקטגוריות הפכו לדינמיות). שדות ייעודיים: בחירת מקום מהטיול, דירוג אישי (1-5 כוכבים) — **Completed** (2026-08-15), נבדק חי. שם פריט + כמות (לקניות) — **Completed**. תמונה — **Not Started** (תלוי Storage אמיתי, כמו Documents). טיפ נפרד — לא נדרש כרכיב נוסף, כבר מכוסה ע"י category=tip הקיים.

## 7. Expense (הוצאה) — Status: **In Progress**
Trip, Booking (אופציונלי), Planned Activity (אופציונלי), Place (אופציונלי), קטגוריה, תיאור, כמות, סכום, מטבע, תאריך, דירוג אישי, הערות, מקור נתון — שדות ליבה מומשו (קטגוריה/תיאור/סכום/מטבע); קישור ל-Place/Booking/Planned Activity ב-UI, דירוג, מקור נתון — **Not Started** ב-UI (קיים בסכימה).
**עדכון 2026-08-15 (דרישה חדשה של המשתמש — "דינמי"):** קטגוריית הוצאה היא כעת **טקסט חופשי**, לא enum סגור ב-DB — אפשר להוסיף קטגוריה חדשה בכל רגע בלי migration. יש רשימת הצעות (datalist) עם 14 קטגוריות ברירת מחדל, אבל כל טקסט מתקבל. נבדק חי: קטגוריה חדשה "צלילה" (לא הייתה מוגדרת מראש) נשמרה והוצגה נכון בכל מקום.

## 8. Payment (תשלום) — Status: **In Progress**
סכום, מטבע, תאריך/שעה, אמצעי תשלום, כרטיס (אם רלוונטי), הערות, מסמכים — שדות ליבה מומשו; מסמכים, פירוט כרטיס אשראי (שער/עמלה) — **Not Started** ב-UI (קיים בסכימה).
**תשלום במזומן יוצר אוטומטית תנועת ארנק תואמת** — Status: **Completed** ונבדק חי בדפדפן (ירידת יתרה מדויקת).
תשלום הזמנה אחת במספר תשלומים (מקדמה+יתרה) — Status: **Completed** (נתמך מבנית, אין UI ל"יתרה לתשלום" מחושבת אוטומטית).

## 9. Deposit (פיקדון) — Status: **Completed** (Mock; Prisma implementation כתוב, לא נבדק live)
סכום, מטבע, למי שולם, סיבה, תאריך החזר צפוי — מפחית מהארנק המתאים ברגע התשלום (אותה סמנטיקה כמו Refund/Currency Exchange — יוצר ארנק אם לא קיים). כפתור "סמן כהוחזר" מזכה את הארנק בסכום שהוחזר בפועל (יכול להיות שונה מהמקורי) + תאריך החזר בפועל. נבדק חי בדפדפן: פיקדון 500 THB (19850→19350), החזר 450 THB (19350→19800).

## 10. Refund (החזר) — Status: **Completed** (Mock; Prisma implementation כתוב, לא נבדק live)
מקושר להוצאה מקורית (sourceExpenseId חובה), סכום, מטבע, סיבה. **מזכה אוטומטית את הארנק** במטבע ההחזר (יוצר אותו אם לא קיים — אותה סמנטיקה כמו Currency Exchange) — נבדק חי בדפדפן (בקשת המשתמש: "לפעמים מקבלים החזר מס על דברים שקנינו"). לא נרשם כהכנסה רגילה ולא כהוצאה שלילית, לפי הדרישה המקורית. קישור ל-sourcePaymentId ספציפי — קיים בסכימה, **Not Started** ב-UI (כרגע מקושר רק ל-Expense).

## 11. ארנק רב-מטבעי (Wallet) — Status: **Completed** (Mock; Prisma implementation כתוב, לא נבדק live)
יתרה נוכחית/פתיחה לכל מטבע, טעינה — Status: **Completed**.
כמה נכנס/יצא/הומר בכל רגע (דוח תנועות) — Status: **Completed**. כל פעולה שמשפיעה על יתרת ארנק (טעינה/מזומן/המרה/החזר/פיקדון) רושמת שורת WalletTransaction, מוצגת בסעיף "היסטוריית תנועות ארנק" במסך הטיול, ממוינת מהחדש לישן — נבדק חי.

## 12. המרת מטבע (Currency Exchange) — Status: **Completed** (Mock; Prisma implementation כתוב, לא נבדק live)
מטבע/סכום מקור, מטבע/סכום יעד, שער בפועל (נגזר אוטומטית מהסכומים), עמלה, תאריך/שעה, הערות; יצירת/עדכון שני ארנקים (יציאה ממטבע המקור, כניסה למטבע היעד) בלי להיחשב הוצאה — נבדק חי בדפדפן (19850→23050 THB, ארנק USD חדש נוצר אוטומטית ב-‎-100‎).

## 13. שערי מטבע (שוק/משוער/בפועל/כרטיס אשראי, עמלה) — Status: **Not Started**

## 14. אמצעי תשלום וכרטיסי אשראי (PaymentCard) — Status: **Not Started** ב-UI (קיים בסכימה)

## 15. טיפים (Tip) — Status: **In Progress**
שדות ייעודיים על Expense (רלוונטיים רק כש-category=tip): `tipRecipient` (למי ניתן, טקסט חופשי), `tipCategory` (מנקה/בל בוי/מלצר/נהג/מסאז'יסט/מדריך/עובד מלון/אחר) — **Completed**, נבדק חי בדפדפן. דוח טיפים בסוף טיול (סה"כ + פילוח לפי קטגוריה) — **Completed** בתוך מסך הטיול; דוח נפרד/מסכם על כל הטיולים — **Not Started**. קישור Place לטיפ — **Not Started** ב-UI (Expense.placeId קיים בסכימה).

## 16. Documents — Status: **In Progress** (שלב 4 — התחלה, 2026-08-15)
מנגנון כללי, קישור פולימורפי ל-Booking/Expense/Payment/HotelStay/Flight/TransportBooking/Insurance/Place/PlannedActivity. סוגים: אישור הזמנה/קבלה/חשבונית/אישור תשלום/Voucher/כרטיס/פוליסה/חוזה/צילום מסך/אחר.

**מומש בפועל:** `DocumentRepository` מלא (Mock+Prisma+6 בדיקות), UI להעלאת קבלה על הוצאה (entityType=expense בלבד) + הצגה/הורדה/הסרה — **Completed**, נבדק חי עם קובץ PNG אמיתי. שמירת קובץ מקורי — כן, אבל ב-Mock כ-`data:` URI בזיכרון (עד 3MB), **לא ב-Supabase Storage אמיתי** שעדיין לא מחובר (ראה DECISIONS.md). זו המגבלה האמיתית היחידה שנותרה כאן — בשונה ממפה/Weather, אין ספק חינמי חלופי להעלאת קבצים בענן.

**עדיין Not Started:** UI לסוגי ישות אחרים (Booking/HotelStay/Flight/TransportBooking/Insurance/Place/PlannedActivity — נתמכים במודל, אין טופס), כפתור "הצג אישור ותשלום" בפועל.
קריאת מסמכים (OCR) — **Not Started**, דורש Claude API key שטרם סופק; `ocrStatus` נשאר "pending" בכנות, לא מזויף (אין ניחוש נתון, אין הצגת ערך כאילו OCR רץ).

## 17. אנשי קשר (Contact) — Status: **Completed** (Mock; Prisma implementation כתוב, לא נבדק live)
מרכז גלובלי (לא לפי טיול — tripId אופציונלי, לא מנוצל עדיין ב-UI): שם, קטגוריה, חברה, תפקיד, טלפון, WhatsApp, אימייל, הערות. רשימה + יצירה + Soft Delete — נבדק חי בדפדפן. אתר (website), קישור איש קשר לטיול ספציפי — **Not Started** ב-UI (קיימים בסכימה/טיפוסים).

## 18. מפה מרכזית ותשתית מפות — Status: **In Progress**
Place.lat/lng + כתובת בטופס יצירה, ניווט בלחיצה (Google Maps/Waze deep-link, בלי API key) — **Completed** (2026-08-15), נבדק חי בספריית המקומות ובמקומות מקושרים לטיול. מסך מפה בסיסי (`/map`, Leaflet+OpenStreetMap) — **Completed** (2026-08-15): מציג את כל ה-Places עם קואורדינטות כ-markers, popup עם פרטים+ניווט, סינון קטגוריה (chips), מקומות בלי קואורדינטות ברשימה נפרדת. נבדק חי. סינון נוסף (סטטוס/תאריך/מרחק/עיר/מדינה/בוצע/מועדף), "מה קרוב אליי" (500מ'-10ק"מ+מותאם, דורש הרשאת מיקום) — **Not Started**. **הוחלט 2026-08-15 (ראה DECISIONS.md): Leaflet+OpenStreetMap במקום Google Maps Platform API, כדי לא להיתקע על מפתח בתשלום** — הניווט עצמו (Google Maps/Waze) לא דורש מפתח כי הוא deep-link חיצוני, לא embed.

## 19. מסלול יומי (Route) — Status: **In Progress**
בניית מסלול לפי יום (`/trips/[tripId]/days/[date]`, 2026-08-15): Place/סדר/שעות הגעה-יציאה מתוכננות, מרחק/זמן נסיעה/אמצעי תחבורה (קלט ידני), שינוי סדר (כפתורי ⬆️⬇️, לא גרירה) — **Completed**, נבדק חי. חישוב מרחק/זמן נסיעה אוטומטי — **Completed** (2026-08-16): `RoutingProvider`/`OsrmRoutingProvider` מול router.project-osrm.org (חינמי, בלי מפתח, ראה DECISIONS.md), כפתור "חשב אוטומטית" בטופס הוספת עצירה ממלא מרחק/זמן אמיתיים מהעצירה הקודמת ביום, המשתמש יכול לערוך ידנית. נבדק חי (בנגקוק: מלון→מסעדה, 4.9 ק"מ/9 דק', שרד רענון מלא). עצירה מקושרת ל-Booking/Planned Activity (לא רק Place), גרירה אמיתית לסידור מחדש, "מקומות בדרך" — **Not Started**.

## 20. מסך "עכשיו" — Status: **In Progress**
`/now` (2026-08-15) — איפה אני (מלון + באדג' צ'ק-אין/אאוט היום), האירוע הבא + ספירה לאחור חיה, מה מתוכנן להמשך היום, כמה הוצאתי היום, יתרות ארנק — **Completed**, נבדק חי. מקומות שמורים לידי — **Completed** (2026-08-16): Geolocation API של הדפדפן + Haversine, מציג מקומות מקושרים לטיול בטווח 30 ק"מ ממוינים מהקרוב לרחוק עם סטטוס (כולל "לא ביקרתי"/"רוצה להגיע" — מכסה גם את "מה עדיין לא ביצעתי באזור" בלי מנגנון נפרד). נבדק חי.

## 21. מסך "היום שלי" — Status: **In Progress**
מזג אוויר (**Completed** — תנאים נוכחיים + המלצת לבוש/גשם/UV), תחזית שעתית ויומית (**Completed**, ראה סעיף Weather למטה). התראה חשובה — **Not Started**.
**מה שכן קיים:** מסך חוצה-טיולים לפי תאריך אמיתי — מוצא טיול פעיל היום, מציג איפה ישן הלילה, טיסות/הסעות של היום, הוצאות של היום, מזג אוויר מלא (נוכחי+שעתי+יומי). מקרה "אין טיול פעיל" מטופל בכבוד. **Completed** לחלק הזה, נבדק חי בדפדפן.

## 22. המלצות לפי אזור (Places חיצוני) — Status: **Not Started**, תלוי בשירות Places חיצוני עתידי.

## 23. שעות פתיחה + "פתוח עכשיו" — Status: **Completed** (Mock; Prisma implementation כתוב, לא נבדק live)
שעות פתיחה/סגירה לכל יום בשבוע (או "סגור" מפורש) על Place, עורך ייעודי בטופס יצירת מקום. תג "🟢 פתוח עכשיו"/"🔴 סגור עכשיו" מחושב מנתונים אמיתיים בלבד (`isOpenNow()`, 5 בדיקות) — לא מציג כלום אם אין שעות מוגדרות. מוצג בעמוד המקומות ובמקומות המקושרים לטיול. תומך בשעות שחוצות חצות. נבדק חי.

## 24. חשבונות חיצוניים (Integration Account) — Status: **Not Started** ב-UI (קיים בסכימה: manual_link/oauth_data_portability).
Booking.com Data Portability API — נדחה במפורש לשלב 5 (אחרי שיש דומיין/פריסה יציבה). אין Scraping או עקיפת התחברות בשום מקרה.
שאר הספקים (Agoda/Hotels/Expedia/Bolt/Grab/חברות תעופה/ביטוח/השכרה) — קישור ידני בלבד עד שיימצא API רשמי ציבורי מתאים; לבדוק תיעוד עדכני ספק-ספק לפני החלטה.

## 25. תכנון מול ביצוע — Status: **Completed** (Mock; Prisma implementation כתוב, לא נבדק live)
StatusHistoryRepository חדש (record+listForEntities), מחובר לשינוי סטטוס PlannedActivity (Coverage חלקי בכוונה, כמו AuditLog — לא לכל Repository). כרטיס "תכנון מול ביצוע" בעמוד דוח הטיול מציג לכל פריט תכנון עתידי את שרשרת מעברי הסטטוס בפועל עם timestamps, לעומת הסטטוס הנוכחי — נבדק חי (want_to_book→planned→booked).

## 26. חיפוש וסינון לפי טווח תאריכים — Status: **Completed** (לרשימת הטיולים; סינון קטגוריה ב-Places קיים בנפרד)
עמוד `/trips` תומך ב-query params `?from=&to=` — מציג רק טיולים שחופפים לטווח (startDate<=to && endDate>=from), עם ספירה "X מתוך Y" וקישור לניקוי הסינון. טופס GET פשוט, בלי JavaScript צד לקוח. נבדק חי. סינון לפי טווח תאריכים לישויות אחרות (הוצאות, מסמכים וכו') — Not Started.

## 27. דוחות וגרפים — Status: **In Progress**
דוח טיול (`/trips/[tripId]/report`, 2026-08-15/16) — עלות כוללת/ממוצעת ליום לפי מטבע, פילוח קטגוריות, מזומן מול כרטיס, טיפים, כסף שנשאר בכל מטבע, מקומות לפי סטטוס, תכנון מול ביצוע — **Completed**, נבדק חי. **סינון לפי טווח תאריכים + גרפים ויזואליים (עמודות, לכל מטבע בנפרד) — Completed** (2026-08-16), נבדק חי. סינון לפי עיר/מדינה, השוואה בין טיולים — **Not Started**.

## 28. בדיקת חוסרים (Gap Detection Engine) — Status: **In Progress**
`apps/web/lib/gap-detection.ts` (2026-08-15), באנר "⚠️ בדיקת חוסרים" במסך הטיול — **Completed** ונבדק חי: יום/לילה ללא מלון, חפיפת מלונות, פעילות שצריך להזמין, אירוע שעבר ולא עודכן סטטוס, ביטוח חסר, טיסה בלי הסעה רשומה באותו יום. **Not Started**: מלון/הזמנה שלא שולמו (תלוי בחיבור סטטוס תשלום ברמת Booking, לא קיים עדיין ב-UI), מעבר בין יעדים בלי תחבורה (דורש רצף יעדים גיאוגרפי, לא מיוצג באפליקציה), מסמך חשוב חסר (תלוי Documents/Storage).

## 29. התראות (Notifications) — Status: **In Progress**
NotificationPreference קיים בסכימה (שלב 0) — **Completed** (2026-08-16): Repository מלא + מנגנון תזכורות client-side דרך Notification API של הדפדפן (לא Push אמיתי — ראה DECISIONS.md), מכסה 2 מתוך 10 סוגי אירוע (flight_approaching/taxi_approaching, היחידים עם timestamp מדויק בנתונים). נבדק חי מקצה לקצה. שאר 8 סוגי האירוע ו-Web Push אמיתי (VAPID+Service Worker+שרת) — **Not Started**, מתוכנן לשלב 6.

## 30. עבודה ללא אינטרנט (Offline) — Status: **In Progress** (שלב 5 — התחלה, 2026-08-15)
Service Worker (cache-first לנכסי build, נפילה לעותק אחרון של דף בניווט offline), manifest.json (PWA installable), באנר "לא מקוון" — **Completed**, נבדק חי (מעבר offline↔online של הבאנר; רישום ה-SW עצמו לא אומת בכלי הבדיקה האוטומטי, ראה PROJECT_STATE.md). **Dexie + תור סנכרון דו-כיווני אמיתי (בלי כפילויות בסנכרון חוזר) — Not Started בכוונה**, דורש שינוי ארכיטקטוני (כל האפליקציה בנויה על Server Components + Server Actions, לא client-first) — החלטה שדורשת אישור מפורש מהמשתמש, לא רק זמן פיתוח. ברשימת נושאים לסוף.

## 31. Audit Log — Status: **In Progress** (2026-08-16)
Repository גנרי (Mock+Prisma+5 בדיקות) + UI ("יומן שינויים" במסך הטיול) — **Completed** לשני מקומות: עדכון שדות Trip, שינוי סטטוס PlannedActivity. נבדק חי. **Coverage לשאר ה-Repositories (Booking/Expense/Payment/Place/וכו') — Not Started בכוונה**, ראה DECISIONS.md.

## 32. Soft Delete — Status: **In Progress**
Trip: **Completed** (מחיקה/שחזור מלאים, נבדק חי). Place: **Completed** (מחיקה, אין שחזור UI עדיין). PlannedActivity: **Completed** (הוסף עם הפיצ'ר עצמו). HotelStay/Flight/TransportBooking/Insurance/Expense: **Completed** (2026-08-16), נבדק חי. **Payment soft delete — Not Started בכוונה** — דורש עיצוב לתיקון יתרת ארנק, ראה DECISIONS.md. שחזור (Restore) קיים רק ל-Trip; לשאר הישויות יש רק מחיקה, אין UI שחזור עדיין.

## 33. תמיכה עתידית בריבוי משתתפים (Trip Companion) — Status: **Not Started** ב-UI (TripCompanion + BookingParticipant קיימים בסכימה כארכיטקטורה מוכנה מראש, לפי דרישה מפורשת שלא לחסום את זה).

## 34. מסכים מרכזיים נדרשים (רשימה מהמפרט)
דשבורד טיול — **In Progress** (שלד+מונים אמיתיים, בלי כרטיסי עלות/מה קרוב אליי). היום שלי — **In Progress**. עכשיו — **Not Started**. לוח שנה — **Not Started** (יש לוח ימים בסיסי בתוך מסך טיול, לא לוח שנה עצמאי). מפה — **Not Started**. מסלול — **Not Started**. תכנון עתידי — **Not Started**. הזמנות — **Completed** (כחלק ממסך טיול). מלונות/טיסות/תחבורה/פעילויות/מסאז'ים/אוכל/קניות — ראה סעיפים למעלה. ארנק/מטבעות — **In Progress**. הוצאות — **In Progress**. מסמכים — **Not Started**. ביטוח — **Not Started**. אנשי קשר — **Not Started**. החשבונות שלי — **Not Started**. דוחות — **Not Started**. הגדרות — **Not Started** (TripSettings קיים בסכימה).
טיולים (רשימה/יצירה/עריכה) — **Completed**. מקומות (ספרייה) — **Completed** לליבה.

## 35. ממשק טלפון — Status: **In Progress**
כפתורים גדולים, ניווט תחתון במובייל/סיידבר בדסקטופ — **Completed**. הוספת הוצאה מהירה, צילום קבלה, ניווט בלחיצה, גישה מהירה לארנק/מסמכי הזמנה, "האירוע הבא"/"מה קרוב אליי" — **Not Started**.

---

## 36. מערכת Weather — Status: **In Progress** (שלב 3.5 — התחלה, 2026-08-15)
דרישה מלאה (התווספה 2026-08-15):
- מזג אוויר במקום נוכחי (טמפ', Feels Like, מצב, מינ/מקס, סיכוי/כמות משקעים, לחות, רוח, ראות, UV, זריחה/שקיעה, התראות רשמיות) — דורש הרשאת Location.
- תחזית שעתית לפי פעילות מתוכננת.
- תחזית יומית ללוח השנה, לפי המיקום שבו המשתמש אמור להיות **באותו יום ספציפי** (לא תחזית אחידה לכל הטיול) — כולל תמיכה במספר אזורים באותו יום (בוקר בעיר א', ערב בעיר ב').
- מזג אוויר בכרטיס Place (כשיש תאריך/שעה מתוכננים).
- **טווח תחזית אמין בלבד** — אם מחוץ לטווח, להציג "עדיין לא זמין", לא להמציא. אין להציג נתון היסטורי כאילו הוא Forecast.
- המלצות לבוש לפי מזג אוויר+סוג פעילות (חוף/טבע/קניון/מסעדה/חיי לילה/אופנוע/פעילות ימית).
- **אזהרת נסיעה באופנוע** בגשם/רוח/סערה — מידע והמלצה בלבד, לא החלטה במקום המשתמש.
- פעילויות ימיות: להתחשב ברוח/גשם/התראות אם הספק מספק; אין קביעת "בטוח/לא בטוח" בלי הודעה רשמית.
- התראות: גשם לפני פעילות חוץ/נסיעת אופנוע, מזג אוויר בעייתי לפני מעבורת, רוח לפני פעילות ימית, חום קיצוני, שינוי משמעותי בתחזית, התראה רשמית במיקום נוכחי/עתידי.
- הצעות חלופה לתוכנית (למשל גשם→הצעת Place מקורה ברדיוס X מהספרייה) — **תמיד דורש אישור המשתמש**, אף פעם לא משנה את התוכנית לבד.
- "תיק ליום" עתידי — המלצות פרקטיות בוקר (מזג אוויר+מסלול+פעילויות+לבוש), כולל ציון מפורש של נסיעת אופנוע בגשם.
- עדכון אוטומטי בתדירות מאוזנת (עדכניות מול קריאות API/עלות/סוללה/דאטה).
- Offline: הצגת תחזית אחרונה מה-Cache עם ציון מתי עודכנה — לא כ-Live.
- שילוב עתידי עם מנוע המלצות (גשום→מקומות מקורים, יום נעים→טבע/חוף, חם מאוד→פעילות מקורה בשעות חמות).
- **WeatherProvider abstraction** — לא נעול לספק יחיד; ספק ייבחר בזמן המימוש לפי תיעוד רשמי עדכני, לא כעת.
- **אין להמציא API/endpoint. אין Mock/נתון מזויף שנראה אמיתי בפרודקשן.**

**מה כבר קיים (ארכיטקטורה):** טבלאות `WeatherForecastSnapshot`/`WeatherAlert` (schema.prisma), טיפוסי Zod + ממשק `WeatherProvider` (packages/shared-types/weather.ts).

**מה מומש בפועל (2026-08-15):** `OpenMeteoWeatherProvider` — ספק אמיתי, חינמי, בלי API key (WeatherProvider abstraction נשמר — ניתן להחלפה). תנאים נוכחיים במקום נוכחי (המקום הראשון עם lat/lng שמקושר לטיול) — **Completed**, נבדק חי עם נתונים אמיתיים לבנגקוק. המלצות לבוש + אזהרת נסיעה באופנוע בגשם + UV — **Completed** (`weather-advice.ts`), פונקציה טהורה על נתונים אמיתיים בלבד. "טווח תחזית אמין בלבד, אין להמציא" — **נאכף**: getAlerts() מחזיר [] בכנות, בקשה כושלת זורקת שגיאה ומוצג הודעה מפורשת, לא נתון מזויף.

**עדיין Not Started:** תחזית שעתית/יומית ב-UI (ה-Provider כבר תומך, לא מוצג עדיין), הרשאת מיקום GPS (המיקום נלקח מ-Place מקושר, לא ממיקום המשתמש בפועל), תחזית לפי Trip Day ספציפי/מספר אזורים באותו יום, מזג אוויר בכרטיס Place, פעילויות ימיות, התראות (Push), הצעות חלופה לתוכנית, "תיק ליום" מלא (יש המלצות בסיסיות, לא מסך ייעודי), Offline cache, שילוב עם מנוע המלצות.

---

## 37. אבטחה — דרישות קבועות (לא שלב, חלות תמיד)
- RLS מלא על כל טבלה שנחשפת דרך Supabase Data API — Status: **Completed** (2026-08-26): כל 26 המיגרציות (כולל 19 שהמתינו) הוחלו על ה-DB האמיתי דרך `prisma migrate deploy`, `DATA_SOURCE=prisma` הופעל בפועל.
- בדיקת RLS אמיתית מול שני משתמשי Test נפרדים לפני שנחשיב CRUD "מוכן" — Status: **Completed** (2026-08-26): נבדק חי עם שני משתמשי-Supabase-Auth אמיתיים (נוצרו/נמחקו לצורך הבדיקה) — אומת שהטריגר `handle_new_auth_user` יוצר שורת `public.users`, ש-userA יכול ליצור/לקרוא טיול משלו, וש-userB **לא** יכול לקרוא את הטיול של userA ו**לא** יכול להזריק טיול בזהות userA (`new row violates row-level security policy` — התנהגות נכונה).
- Secret Key/Service Role — שרתי בלבד, לעולם לא ב-NEXT_PUBLIC_/Client Bundle/Git/Logs — Status: **Completed** (אכיפה טכנית דרך `server-only` package).
- Migrations דרך Prisma בלבד, לא `db push`, לא שינויים ידניים לא מתועדים — Status: **Completed** (2026-08-26) — כל ההיסטוריה הוחלה דרך `prisma migrate deploy`.
- Supabase Security Advisor — בדיקה אחרי הפעלת Schema+RLS — Status: **Not Started** (Schema+RLS פעילים כעת בפועל — זו הבדיקה הבאה המומלצת, לא תלויה יותר בחיבור).

---

## 38. עיצוב Premium — Theme/Nav/Dashboard/Map 3D — Status: **In Progress** (2026-08-16, גל שני)
דרישה מפורטת (42 סעיפים) מהמשתמש להעלאת רמת העיצוב לממשק Premium כהה, אפקט זכוכית, אקסנטים סגול/כחול, כרטיסים גדולים, אייקונים מודרניים (לא Emoji), מפה תלת-ממדית אינטראקטיבית אמיתית כאלמנט מרכזי — לפי מוקאפ ייחוס שסופק. הסכימה שלב-אחר-שלב לפי בקשת המשתמש עצמו; מפורט מלא בתוכנית שאושרה ב-`C:\Users\ארנון\.claude\plans\glistening-knitting-scott.md`.
**עדכון 2026-08-16 (גל שני):** המשתמש קבע שהתוצאה של הגל הראשון (38א-ו למטה) עדיין נראית כמו Admin Panel רגיל, לא Premium מספיק. נדרש **Redesign יסודי** — Design System אמיתי מבוסס Tokens + ספריית UI Components משותפת, לא רק תיקוני CSS נקודתיים. ראה DECISIONS.md ("Redesign יסודי שני") לפירוט המלא. היקף השלב הנוכחי: **Dashboard בלבד (Desktop+Mobile), כ-Proof of Concept** — לא שאר המסכים, עד לאישור מפורש.
### 38ז. Design System v2 (Token-driven) — Status: **Completed** (2026-08-16)
טוקנים מלאים (background/surface/surface-elevated/glass-surface/border/text primary-secondary-muted/primary/secondary/success/warning/danger/info/accent-purple/accent-blue/gradient/shadow/glow/radius/spacing/typography/icon-sizes/animation-duration) — כולם ב-CSS custom properties, אין צבע ידני בתוך Component. פונט Rubik (Google Font, תמיכה עברית+לטינית מלאה).
### 38ח. ספריית UI Components (`apps/web/components/ui/`) — Status: **Completed** (POC על הדשבורד; שאר המסכים עדיין לא הועברו)
GlassCard, StatCard, Avatar, StatusBadge, SearchBar, NotificationButton, ThemeSwitcher, EmptyState, Sidebar, TopBar, BottomNavigation, AppShell, Timeline, QuickAction. **Not Started בכוונה בסבב הזה** (ייבנו כשיידרשו למסכים ספציפיים): Modal, Drawer, Tooltip, Toast, FilterChip, PlaceCard, BookingCard, PageHeader.

### 38א. מערכת Theme (Dark/Light/Auto + Accent + Brightness + Density) — Status: **In Progress**
CSS custom properties לפי `[data-theme]`/`[data-accent]`/`[data-density]` על `<html>` + React Context (`ThemeProvider`), נשמר ב-localStorage (ראה DECISIONS.md). מסך `/settings` חדש עם כל הבקרות, מתעדכן חי בלי כפתור שמירה. Dark = "Deep Navy/Premium" לא Cyberpunk; Light = פלטה עצמאית (לא רק היפוך צבעים).

### 38ב. מערכת אייקונים (Lucide) — Status: **In Progress**
`lucide-react` מחליף את כל ה-Emoji בניווט/קטגוריות/מפה (ראה DECISIONS.md לבחירת הספרייה). `PLACE_CATEGORY_ICONS`/`TRIP_PLACE_STATUS_ICONS` חדשים לצד קבצי ה-Labels הקיימים.

### 38ג. ניווט מחדש (Sidebar + Mobile) — Status: **In Progress**
סיידבר מקובץ (סקירה/טיולים/Settings), אייקוני Lucide, ניווט תחתון מובייל 5 פריטים (Home/Trips/Map/**Places**/More — Wallet הוחלף כי אין לו route עליון, ראה DECISIONS.md), Quick-Add FAB במובייל. פרטי הקיבוץ המלא ב-DECISIONS.md.

### 38ד. דשבורד מחדש — Status: **In Progress**
Current Trip Hero (תמונה אמיתית לפי מוקאפ הייחוס), Weather/Wallet/Expenses/Days/Bookings cards, Today's Plan timeline, Upcoming Plans, Quick Actions, Gap Alerts — כולם משתמשים בנתונים/Repositories קיימים בלבד (Weather Provider, gap-detection, trip-days וכו'), בלי לוגיקת שרת חדשה. שטח מפה שמור בלבד בשלב זה (בלי הטמעת Mapbox חי) — ראה 38ה-38ו.
**נוסף (2026-08-16, סגירת פערים מול המוקאפ):** כותרת דשבורד עם ברכה לפי שעה (בלי שם — אין שדה name במודל המשתמש) + חיפוש טיולים אמיתי (GET, שמות טיולים בלבד — למקומות אין עדיין דף פרטים) + קישורי פעמון/הגדרות; כרטיס "פילוח הוצאות" עם גרף Donut אמיתי (SVG טהור, בלי ספריית תרשימים) לפי קטגוריה; כרטיס "תובנות טיול" עם מספרים אמיתיים על כל הטיולים (טיולים/מקומות שביקרת/ימי טיול/הוצאות לפי מטבע — בלי המרת מטבע מומצאת) במקום ה-placeholder "בקרוב" הקודם.
**נוסף (2026-08-16, סבב שני):** Widget מפה בדשבורד (`map-widget-card.tsx`) — משתמש באותה הפשטת `MapProvider` בגרסה מצומצמת (בלי style switcher/nearby), עם קישור למסך המפה המלא; ללא Mapbox token מציג את אותה הודעת "לא מחובר" כמו `/map-demo`. כרטיס "טיפ של היום" — טיפ נסיעות אמיתי (לא מותאם-משתמש), נבחר דטרמיניסטית לפי יום-בשנה.

### 38ה. `MapProvider` abstraction — Status: **In Progress**
הפשטה חדשה ב-`apps/web/lib/map/` (Mapbox GL JS כמימוש ראשון, ראה DECISIONS.md לבחירת הספק). ממשק כולל style switching (3D/Satellite/Street/Terrain/Night), מרקרים מבוססי-קטגוריה/סטטוס, מיקום משתמש, אירועי click/move. **Clustering מוגדר בממשק אבל לא ממומש בשלב זה** — נדחה להרחבת `/map` המלאה בעתיד.

### 38ו. מסך Demo Map — Status: **In Progress**
`/map-demo` (לא ב-ניווט עדיין, לא מחליף את `/map` הקיים) — מוכיח מפה תלת-ממדית אינטראקטיבית אמיתית (tilt/rotate/zoom/style switch/מרקרים לפי קטגוריה/Place Card/מיקום נוכחי/Nearby בסיסי). ללא token של Mapbox מציג מצב "לא מחובר" כן, לא מפה מזויפת. **דורש `NEXT_PUBLIC_MAPBOX_TOKEN` אמיתי מהמשתמש** (ראה "תלויות חיצוניות שחסרות" ב-PROJECT_STATE.md) — עד שיסופק, נבדק רק במצב הלא-מחובר.

**מפורש Not Started בשלב זה** (מתועד כדי לא להישכח, לא מתוכנן להשלמה כרגע): Explore-this-area, ציור Route/RouteStop על המפה, Marker Clustering, Toggle Planned/Visited/All, Performance Quality Toggle (High/Balanced/Battery Saver), אפשרות ניווט Apple Maps, שכפול העיצוב החדש למסכי Trips/Places/Bookings/Contacts הקיימים, החלפת `/map` הקיים. (Widget מפה בדשבורד **הושלם** ב-2026-08-16 — ראה DECISIONS.md, זה בוטל מרשימת ה-Not Started.)

---

## 39. הרשמה והתחברות (Authentication UI) — Status: **In Progress** (2026-08-16)
- **התחברות (`/login`)** — אימייל+סיסמה מול Supabase Auth (`signInWithPassword`) — Status: **Completed** בקוד (קיים משלב מוקדם יותר של הפרויקט), **לא נבדק live** (תלוי בחיבור Supabase).
- **הרשמה (`/register`, חדש)** — אימייל+סיסמה+אימות סיסמה מול Supabase Auth (`signUp`) — Status: **Completed** בקוד, **לא נבדק live**. אין שדה "שם משתמש" נפרד — אימייל = שם משתמש.
- **אישור תקנון/הסכם/מדיניות פרטיות בהרשמה** — checkbox יחיד משותף לשלושת המסמכים (חובה לפני שליחה), עם קישורים לכל מסמך. הזמן נשמר כ-`User.legalConsentAcceptedAt` דרך `user_metadata`+טריגר `handle_new_auth_user` — Status: **Completed** בקוד, **לא נבדק live**.
- **3 מסמכים משפטיים סטטיים** (`/legal/terms`, `/legal/agreement`, `/legal/privacy`) — טיוטה סבירה שנכתבה על ידי Claude, מסומנת בבירור כ"לא ייעוץ משפטי, לא נבדקה משפטית" — Status: **Completed**. יש להחליף בנוסח שנבדק משפטית לפני שימוש מסחרי/משתמשים נוספים.
- **אימות אימייל (Email Confirmation)** — תלוי בהגדרות פרויקט Supabase בפועל (לא ידוע עדיין אם מופעל) — טופס ההרשמה מטפל בשני המקרים (session מיידי מול "בדוק אימייל לאישור"), **לא נבדק live**.
- **שחזור סיסמה (Forgot Password)** — Status: **Not Started**.

---

## 40. Audit מלא מול מסמך דרישות מאוחד (156 סעיפים) — 2026-08-16

המשתמש סיפק מסמך דרישות מאוחד ומפורט (156 סעיפים, "מקור האמת המרכזי") וביקש Audit מלא מולו. הפירוט המלא, סטטוס לכל דרישה בודדת, וקבצים רלוונטיים נמצאים ב-**`FEATURE_AUDIT.md`** (חדש) — לא משוכפל כאן כדי לא ליצור שני מקורות אמת סותרים; קובץ זה (PROJECT_REQUIREMENTS) ממשיך להיות התיאור הגבוה-רמה, `FEATURE_AUDIT.md` הוא הטבלה המפורטת-לפי-סעיף. רשימת פערים מתועדפת (P0-P3): **`IMPLEMENTATION_GAPS.md`** (חדש).

**דרישות חדשות שהתגלו ב-Audit ולא היו מתועדות כלל בקובץ הזה קודם** — Status: **Not Started** (0% בקוד, פרט למקרים שצוין אחרת):
- **Export/Print/Share/Backup** (Report Builder, Export ל-PDF/Excel/CSV, Print layout, Share Links מאובטחים, Documents Batch Export+ZIP, Backup+Restore) — אשכול שלם, 0% קיים, ראה `IMPLEMENTATION_GAPS.md` להערכת היקף.
- **Calendar** (תצוגת חודש/שבוע/יום) — 0% קיים, אין אפילו route.
- **Budget** (Trip/Daily/Category, Planned/Spent/Remaining/Projected) — 0% קיים, אין שדה בסכימה בכלל.
- **Packing List + Before Trip Checklist** — 0% קיים.
- **Emergency Screen** — 0% קיים (החלקים הגולמיים — Contact/Documents/Geolocation — כן קיימים בפיזור).
- **Trip Memories** (תמונות/הערות/ציר-זמן) — 0% קיים.
- **Wallet Reconciliation** (התאמת מזומן בפועל מול יתרה צפויה) — 0% קיים.
- **Tourist Tax / Fees ייעודי** — 0% קיים, רק Expense כללי.
- **Day Summary** (סיכום פר-יום: הוצאות/מקומות/עיסויים/טיפים) — 0% קיים; `trips/[tripId]/days/[date]` הוא מסלול-נסיעה בלבד, לא סיכום.
- **Global Places Library — סטטיסטיקות** ("כמה פעמים הייתי", "כמה הוצאתי שם") — 0% קיים.
- **Repeat Visit** (הצעות בעת חזרה לעיר) — 0% קיים.
- **Favorites כמסך גלובלי** (מעבר לסטטוס פר-TripPlace) — 0% קיים.
- **Localization מלא** (עברית+אנגלית, i18n) — 0% קיים, אין שום ספריית i18n; כל הטקסט קשיח בעברית.
- **Units** (°C/°F, ק"מ/מייל, 24/12 שעות כהעדפה) — 0% קיים.
- **Accessibility** (High Contrast, Large Text) — 0% קיים מעבר ל-aria-label נקודתי.
- **Preferences מלאות** (Default Language/Home Currency/Navigation App/Map Style/Weather Units) — 0% קיים; `/settings` מכיל רק Theme.
- **External Accounts / Booking Integration** — מודל `IntegrationAccount`+`IntegrationType` קיים ב-schema.prisma בלבד, 0% ב-shared-types/data-layer/UI.
- **Booking Benefits** — מודל `BookingBenefit`+`enum BenefitType` (12 ערכים) קיים ב-schema.prisma בלבד, 0% מומש.
- ~~**Multiple Quotes לתחבורה**~~ — הושלם 2026-08-17 (`a032f97`): `TransportQuote` מלא (Mock+Prisma+UI), ראה IMPLEMENTATION_GAPS.md.
- **Show Proof of Payment** (כפתור ריכוז) — 0% קיים.
- **Document Center — Filtering** — Repository תומך 8 סוגי entityType, ה-UI נעול ל-"expense" בלבד בקוד עצמו.
- **Massage/Fruit Tracker ייעודיים** — כרגע רק דרך Expense כללי; אפילו שם-פרי/כמות (שדות שכן קיימים בסכימה) לא מוצגים ב-UI לקטגוריית fruit — פער אמיתי, לא רק "לא נבנה". 0% דוחות צבירה (ספירה/סה"כ שעות/ממוצעים) לעיסויים.
- **Timers כמושג מאוחד** — קיים Ad-Hoc לכל מסך; רק 2 מתוך 9 סוגי טיימר עם ספירה חיה בפועל (טיסה, מונית/הסעה).
- **Time Zones בפועל** — שדות אזור-זמן נשמרים אך **אף פעם לא נקראים בחזרה לתצוגה**; כל שעה מוצגת בזמן שרת/דפדפן מקומי. תיקון עתידי דורש `apps/web/lib/dates.ts` חדש.
- **Alerts — 8 מתוך 15 סוגים** לא קיימים בכלל (Booking Missing/Low Cash Balance/Budget Alert/Rain During Activity/Document Missing/Refund Pending; +2 עם enum בלי חיווט: Check-out Soon/Payment Missing). פירוט מלא ב-`FEATURE_AUDIT.md` חלק י'.
- **Global Search** — מחפש כרגע **רק שמות טיולים**, לא Place/Booking/Expense/Document/Contact.
- **Component Library — 14 רכיבים חסרים** מתוך 30 שהתבקשו: Modal, Drawer, Tooltip, Toast, FilterChip, PageHeader, MapCard, WalletCard, ExpenseCard, BookingCard (ראה סעיף 38ח למעלה לרשימת מה שכן קיים).

**סטטוס:** תיעוד בלבד. אין אישור לבנייה — ממתין להנחיית המשתמש לפי `IMPLEMENTATION_GAPS.md`.

**עדכון — סבב 2 (אותו יום, מאוחר יותר):** המשתמש ביקש בדיקה מדויקת יותר מול רשימת בדיקה מפורשת בת 114 פריטים (לא מסמך 156 הסעיפים המקורי). `FEATURE_AUDIT.md`/`IMPLEMENTATION_GAPS.md` נכתבו מחדש במבנה שתואם 1:1 לרשימה הזו, עם מספרים מדויקים (Implemented=30 / Partial=43 / UI Only=1 / Mock Only=0 / Not Implemented=36 / Blocked=4 מתוך 114) ופירוט "מה בדיוק חסר" לכל פריט P0. שום דרישה חדשה לא התגלתה מעבר למה שכבר תועד בסבב הראשון — זה עידון/דיוק של אותו Audit, לא תוספת.
