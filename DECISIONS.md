# DECISIONS.md — החלטות ארכיטקטוניות ועסקיות

מסמך זה שומר החלטות משמעותיות שהתקבלו במהלך הפיתוח, כדי שלא יאבדו ב-Compact/Session חדש. עדכן אותו בכל פעם שמתקבלת החלטה חדשה — אל תמחק החלטות ישנות, רק סמן אם הן בוטלו/שונו והוסף החלטה חדשה שמפנה אליהן.

---

### 2026-08-15 — מודל הליבה: Place → Planned Activity → Booking → Expense → Payment כשרשרת נפרדת
**החלטה:** כל שכבה היא ישות נפרדת שיכולה להתקיים בלי השכבה שמעליה. Place גלובלי (לא קשור לטיול). Planned Activity הוא רצון/תוכנית בלי כסף. Booking הוא מחויבות מסחרית אמיתית. Expense הוא "כמה זה עלה בפועל". Payment הוא "מתי ואיך שולם בפועל" — אפשר כמה Payment לאותה Expense.
**למה:** מונע כפילות וסתירות בין תכנון לביצוע בפועל; מאפשר "שולם חלקית" נגזר מ-Payment אמיתי במקום דגל שיכול לסתור את עצמו.
**משפיע על:** כל הסכימה (schema.prisma), כל שכבת ה-Data Layer, כל ה-UI.
**סטטוס:** סופי.

### 2026-08-15 — Planned Activity לא מחזיקה partially_paid/paid
**החלטה:** סטטוסי תשלום קיימים רק על Booking/Expense (נגזרים מ-Payment), לא על Planned Activity.
**למה:** אושר במפורש ע"י המשתמש; מונע כפילות מקור אמת לתשלום.
**משפיע על:** enum LifecycleStatus, מודל PlannedActivity.
**סטטוס:** סופי.

### 2026-08-15 — Place הוא ישות גלובלית (ספרייה אישית, לא לפי טיול)
**החלטה:** Place לא שייך לטיול ספציפי; TripPlace הוא טבלת קשר עם סטטוס פר-טיול.
**למה:** מאפשר לראות היסטוריית ביקורים חוצת-טיולים באותו מקום.
**משפיע על:** schema.prisma (Place.userId, TripPlace), packages/data-layer PlaceRepository + TripPlaceRepository.
**סטטוס:** סופי.

### 2026-08-15 — 4 ההמלצות הנוספות אושרו: Currency table, Soft Delete, Notification Preference, ספריות גלובליות
**החלטה:** כל ארבעתן מיושמות בסכימה.
**למה:** אושרו במפורש ותואמות את המפרט המפורט של המשתמש.
**משפיע על:** schema.prisma.
**סטטוס:** סופי.

### 2026-08-15 — Supabase: מפתחות publishable/secret (לא anon/service_role)
**החלטה:** להשתמש בפורמט המפתחות העדכני (`sb_publishable_...`/`sb_secret_...`) כפי שמתועד רשמית ע"י Supabase, לא בפורמט הישן.
**למה:** anon/service_role יוצאים משימוש עד סוף 2026; המפתחות הישנים עדיין תקינים באותם משתני סביבה בתקופת המעבר, כך שאין עלות מעבר.
**משפיע על:** apps/web/lib/supabase/{env,client,server,admin}.ts, .env.example.
**מקור:** https://supabase.com/docs/guides/getting-started/migrating-to-new-api-keys
**סטטוס:** סופי (עד שיוחלט אחרת).

### 2026-08-15 — RLS: פונקציות עזר + טריגר ליצירת משתמש, User.id = auth.uid() חובה
**החלטה:** כל בדיקת בעלות ב-RLS עוברת דרך פונקציות `is_trip_owner`/`is_booking_owner` וכו' (לא כפילות SQL). טריגר `handle_new_auth_user` יוצר את שורת `public.users` עם `id = auth.uid()::text` אוטומטית בהרשמה.
**למה:** בלי ש-User.id יהיה זהה בדיוק ל-auth.uid(), אף policy לא יכול לעבוד נכון.
**משפיע על:** packages/db/prisma/rls_policies.sql (מוכן, טרם הופעל).
**סטטוס:** סופי בעיצוב, **ממתין להפעלה בפועל** (תלוי בחיבור Supabase).

### 2026-08-15 — תוקן: Place/Contact/StatusHistory היו חסרות userId (פרצת אבטחה בפוטנציה)
**החלטה:** נוסף `userId` חובה לשלוש הטבלאות.
**למה:** בלעדיו, ברגע שיהיה יותר ממשתמש אחד, הנתונים האלה היו גלויים/ניתנים לעריכה לכל משתמש — RLS לא יכול לבודד בלי עמודת בעלות.
**משפיע על:** schema.prisma, rls_policies.sql, packages/shared-types (place.ts).
**סטטוס:** סופי.

### 2026-08-15 — Weather: ארכיטקטורה בלבד עכשיו, מומש בשלב 3.5 (אחרי מפה, לפני OCR)
**החלטה:** נבנו טבלאות Cache (WeatherForecastSnapshot/WeatherAlert, לפי מיקום+זמן לא לפי ישות) וממשק WeatherProvider — בלי לחבר ספק אמיתי ובלי לבחור ספק.
**למה:** רק אחרי שיש PostGIS ומיקום אמיתי ומסלול יומי אמיתי (שלב 3) יש טעם לבנות Weather אמיתי — לפני זה זה יהיה מול מיקומים מדומים. בחירת ספק תלויה בבדיקת תיעוד רשמי עדכני בזמנו.
**משפיע על:** schema.prisma, packages/shared-types/weather.ts, 01_architecture_v2.md.
**סטטוס:** סופי (תזמון), **ממתין למימוש**.

### 2026-08-15 — Git: ריפו מקומי בלבד, בלי Remote, בלי Push
**החלטה:** `git init` בוצע רק בתוך תיקיית טיולים; אין ואסור להגדיר remote או לבצע push.
**למה:** הוראה מפורשת של המשתמש.
**משפיע על:** כל תהליך העבודה.
**סטטוס:** סופי, קבוע לכל המשך הפרויקט.

### 2026-08-15 — חיבור Supabase חי נדחה; ממשיכים לבנות UI מול Mock Data Layer
**החלטה:** לפי בקשת המשתמש, לא לחכות לפרטי Supabase כדי להמשיך לפתח. נבנתה שכבת Data Layer (Repository pattern) עם מימוש Mock (in-memory, נתוני דמו מסומנים `[דמו]`) ומימוש Prisma מקביל (קוד אמיתי, מסומן PENDING_INTEGRATION, לא נבדק live).
**למה:** לאפשר פיתוח והדגמה חיה בדפדפן בלי להיתקע על תלות חיצונית.
**משפיע על:** packages/data-layer (כל הריפוזיטוריז), apps/web (getCurrentUser עם מצב דמו).
**סטטוס:** **זמני במפורש** — יוחלף בחיבור Prisma אמיתי כשיסופקו פרטי Supabase. הארכיטקטורה נבנתה כך שההחלפה היא שינוי env var אחד (`DATA_SOURCE=prisma`), לא כתיבה מחדש.

### 2026-08-15 — Demo Data מותר רק ב-Development, מסומן בבירור
**החלטה:** כל נתון דמו נושא תווית `[דמו]` בשם, ויש באנר "מצב פיתוח" גלוי בכל מסכי האפליקציה כשפעיל מצב Mock.
**למה:** דרישה מפורשת — אסור שנתוני דמו ייראו כאילו הם נתונים אמיתיים.
**משפיע על:** packages/data-layer (seed data), apps/web/app/(app)/layout.tsx (הבאנר).
**סטטוס:** סופי, כלל קבוע.

### 2026-08-15 — תיקון באג: Prisma generator חייב output מפורש
**החלטה:** נוסף `output = "../generated/client"` לבלוק ה-generator ב-schema.prisma.
**למה:** בלעדיו Prisma Client נוצר במקום שלא תואם ל-`package.json` של `@travel-app/db`, ו-`require('@travel-app/db')` נכשל לגמרי.
**משפיע על:** schema.prisma, .gitignore (הוספת `/packages/db/generated/`).
**סטטוס:** סופי.

### 2026-08-15 — פשטנות זמנית: שדות datetime-local מטופלים כ-UTC ישירות
**החלטה:** בטפסי טיסה/הסעה, הערך מה-input מומר ל-ISO ע"י הוספת `Z` בלבד, בלי המרה אמיתית לפי אזור הזמן שנבחר.
**למה:** המרה מדויקת דורשת ספריית IANA timezone אמיתית — נדחה לשלב Time Zones המלא, כדי לא לבנות פתרון חצי-אפוי.
**משפיע על:** apps/web/app/(app)/trips/[tripId]/bookings/actions.ts (מתועד בקוד עם הערה).
**סטטוס:** זמני, מתועד בבירור בקוד ובקובץ הזה.

### 2026-08-15 — מנגנון קבצי המשכיות (PROJECT_STATE/REQUIREMENTS/DECISIONS) הוקם ומנוהל אוטומטית
**החלטה:** שלושת הקבצים האלה מתעדכנים אחרי כל רכיב משמעותי, לפני פעולות גדולות, וכשיש סיכון לאובדן הקשר — לא רק לפי בקשה מפורשת בכל פעם. אין לי גישה אמינה לאחוז ניצול Context בזמן אמת ואין לי יכולת להפעיל Compact ביוזמתי — אלה מוגבלים לטריגרים החלופיים (סיום שלב, לפני פעולה גדולה).
**למה:** דרישה מפורשת למנוע אובדן מידע/החלטות/דרישות ב-Compact או Session חדש; המשתמש הבהיר שלא להמציא אחוז מדויק אם אין גישה אליו.
**משפיע על:** תהליך העבודה השוטף לכל המשך הפרויקט.
**סטטוס:** סופי, קבוע.

### 2026-08-15 — טיפים: שדות ייעודיים על Expense, לא טבלה נפרדת
**החלטה:** נוספו `tipRecipient` (טקסט) ו-`tipCategory` (enum חדש) ישירות ל-`Expense`, רלוונטיים רק כש-`category = tip`. לא נוצרה טבלת `Tip` נפרדת.
**למה:** זה בסך הכל שני שדות אופציונליים שרלוונטיים לקטגוריה אחת — טבלה נפרדת + JOIN הייתה over-engineering ביחס לצורך בפועל. תואם את העיקרון "בלי הפשטה מוקדמת".
**משפיע על:** schema.prisma (Expense + enum TipCategory חדש), packages/shared-types/expense.ts, packages/data-layer FinanceRepository, UI טופס ההוצאה (שדות מותנים כש-category=tip).
**סטטוס:** סופי.

### 2026-08-15 — Refund מזכה אוטומטית את הארנק, כמו Currency Exchange
**החלטה:** כל Refund מוסיף את הסכום לארנק המתאים למטבע (יוצר ארנק חדש אם צריך), לא נרשם כהוצאה שלילית או הכנסה כללית.
**למה:** ביקשת "החזר של כסף... לפעמים מקבלים החזר מס" — מבחינה מעשית זה כסף שחוזר לתקציב הטיול, בדיוק כמו הצד ה"מקבל" של Currency Exchange. הסכימה כבר תמכה בזה (WalletTxType.refund_in).
**משפיע על:** packages/data-layer FinanceRepository (Mock+Prisma).
**סטטוס:** סופי.

### 2026-08-15 — המשך פיתוח "עד הסוף" בלי לעצור לשאלות, עם חריגה ל-API בתשלום
**החלטה:** לפי בקשת המשתמש להמשיך את כל הפרויקט ברצף ולהשאיר שאלות לסוף — ממשיכים לבנות פיצ'רים ברצף. בכל מקום שדורש תלות חיצונית שאסור לי ליצור בעצמי (Supabase live, Google Maps API בתשלום, ספק Weather, Claude API ל-OCR) — לא עוצרים, אלא בונים כל מה שניתן בלי התלות (למשל: מפה עם Leaflet+OpenStreetMap במקום Google Maps, כי הוא חינמי ולא דורש מפתח), ומרכזים את כל הבלוקרים לדיווח מרוכז בסוף.
**למה:** בקשה מפורשת של המשתמש.
**משפיע על:** סדר העבודה וההחלטות הטכניות להמשך (למשל בחירת Leaflet על פני Google Maps).
**סטטוס:** סופי, עד הודעה חדשה.

### 2026-08-15 — Expense.category הפך לטקסט חופשי (לא enum)
**החלטה:** `Expense.category` ב-schema.prisma עבר מ-enum סגור ל-`String`. שמות ה-enum הישן נשמרו כ-`ExpenseCategorySuggestion` (לא אכוף ב-DB) עבור 14 ברירות מחדל שמוצגות ב-UI כ-datalist. המשתמש יכול תמיד להקליד קטגוריה חדשה לגמרי.
**למה:** דרישה מפורשת: "חשוב שיהיה דינמי אם נחליט להוסיף הוצאות נוספות". enum קשיח היה דורש migration בכל פעם שרוצים קטגוריה חדשה.
**משפיע על:** schema.prisma, packages/shared-types (enums.ts, expense.ts), apps/web/lib/expense-labels.ts (fallback ל-getExpenseCategoryLabel), טופס ההוצאה (input+datalist במקום select).
**הערה:** "tip" נשאר מפתח יציב ומזוהה בקוד (משפיע על הצגת שדות טיפ) כי הוא ה-value שנשמר כשבוחרים את ההצעה "טיפ" מה-datalist — קטגוריות חדשות שהמשתמש מקליד חופשי לגמרי ולא משפיעות על שום לוגיקה מיוחדת.
**סטטוס:** סופי.

### 2026-08-15 — RouteStop API עובד לפי (tripId, date) ישירות, לא tripDayId
**החלטה:** ה-`RouteRepository` (API ל-UI/business-logic) מזהה "יום" ע"י `(tripId, date)` ישירות, ולא דורש ישות `TripDay` אמיתית בשום מקום אחר באפליקציה. בפועל, סכימת Prisma עדיין דורשת `Route.tripDayId → TripDay` (עם `@@unique([tripId, calendarDate])`) — ה-`PrismaRouteRepository` עושה `upsert` שקוף של שורת `TripDay`+`Route` בפעם הראשונה שנוצרת עצירת מסלול ליום מסוים, בלי לחשוף את זה כלפי חוץ.
**למה:** Trip Day כבר מחושב חי בכל שאר האפליקציה (`getTripDayDates`, מסך "היום שלי"/"עכשיו", לוח השנה) ולא נשמר כישות — לבנות UI/Repository מלא ל-TripDay רק כדי לתמוך ב-Route היה עבודה נוספת לא נחוצה כרגע. ה-upsert השקוף נותן התנהגות נכונה (get-or-create) בלי לדרוש שינוי בשום קוד קיים.
**משפיע על:** packages/shared-types/src/route.ts (RouteStop.date, לא tripDayId), packages/data-layer/src/repositories/route-repository.prisma.ts.
**סטטוס:** **מומש חלקית ב-2026-08-21** — ר' "TripDay נחשף כישות אמיתית" למטה. RouteStop API עדיין עובד לפי (tripId,date) ולא tripDayId (זה נשאר כפי שהיה — לא היה צריך לשנות), אבל TripDay עצמו עכשיו נגיש כישות עם notes אמיתיים דרך TripDayRepository. PlannedActivity-לפי-יום-ספציפי עדיין Not Started, לא היה חלק מהבקשה.

### 2026-08-15 — Weather מחובר ל-Open-Meteo (חינמי, בלי API key)
**החלטה:** `OpenMeteoWeatherProvider` (packages/data-layer/src/weather/) הוא המימוש הראשון של ה-`WeatherProvider` interface שהיה קיים רק כארכיטקטורה. Open-Meteo נבחר כי הוא חינמי לגמרי וללא מפתח API — אין תלות בהמתנה למפתח בתשלום מהמשתמש.
**למה:** אותה סיבה בדיוק כמו ההחלטה על Leaflet+OpenStreetMap במקום Google Maps — למנוע חסימה על שירות חיצוני בתשלום. חשוב לא פחות: זה שומר על הכלל "אף פעם לא ממציאים תחזית" בלי צורך להמתין לספק בתשלום — הנתונים תמיד אמיתיים מ-API אמיתי.
**מגבלה ידועה:** ל-Open-Meteo (בטייר החינמי) אין API אזהרות מזג אוויר גלובלי אמין — `getAlerts()` מחזיר `[]` תמיד באופן כן, לא ממציא התראה. אם בעתיד יידרשו התראות אמיתיות, יהיה צריך ספק נוסף/אחר לפונקציה הזו בלבד.
**משפיע על:** packages/data-layer/src/weather/*, apps/web/app/(app)/today/page.tsx, apps/web/lib/weather-advice.ts.
**סטטוס:** סופי לשלב זה (ניתן להחלפה בעתיד דרך אותו WeatherProvider interface בלי לשנות UI).

### 2026-08-15 — Documents ב-Mock: fileUrl הוא data: URI אמיתי, לא כתובת מזויפת
**החלטה:** ב-`MockDocumentRepository`, קובץ שהועלה (עד 3MB) מומר ל-base64 ונשמר כ-`fileUrl` בפורמט `data:<mime>;base64,<...>` — זה הקובץ האמיתי בזיכרון השרת, לא Placeholder. ה-Prisma repository (PENDING_INTEGRATION) מניח ש-fileUrl כבר מצביע על אובייקט אמיתי ב-Supabase Storage; שלב ה-upload בפועל לענן לא ממומש כי Storage לא מחובר.
**למה:** מאפשר לבדוק זרימת "העלה קובץ → הצג/הורד אותו" מקצה לקצה בלי לחכות ל-Storage אמיתי, ובלי להמציא נתון — הקובץ שהועלה באמת נשמר ובאמת ניתן לצפייה. עקבי עם "no fabricated data that looks real."
**מגבלה:** לא בר-קנה-מידה לפרודקשן (זיכרון שרת, לא Storage מתמשך/מבוזר) — יוחלף מיידית כשמתחברים ל-Storage אמיתי, בלי לשנות UI (מאחורי אותו DocumentRepository interface).
**משפיע על:** packages/data-layer/src/repositories/document-repository.*, apps/web/app/(app)/trips/[tripId]/documents/actions.ts (הגבלת 3MB).
**סטטוס:** זמני במובהק — יוחלף כש-Supabase Storage מחובר.

### 2026-08-15 — Offline מוגבל ל-PWA shell caching; סנכרון דו-כיווני נדחה
**החלטה:** לא נבנה תור סנכרון offline מלא (Dexie + מנגנון replay ללא כפילויות) בסבב הזה. מה שכן נבנה: Service Worker ל-cache-first על נכסי build סטטיים + נפילה לעותק אחרון של דף שביקרו בו, manifest.json (PWA installable), ובאנר "לא מקוון" (`useSyncExternalStore` על navigator.onLine).
**למה:** כל האפליקציה בנויה על Server Components (כל השליפה בצד שרת) ו-Server Actions (כל הכתיבה כ-POST לשרת) — אף אחד מהם לא יכול לעבוד באמת בלי רשת. סנכרון offline אמיתי דורש ארכיטקטורה שונה (שליפה/כתיבה client-first עם cache מקומי) — זה שינוי ארכיטקטוני משמעותי שמשפיע על כל שכבת ה-UI, לא תוספת נקודתית כמו כל שאר הפיצ'רים בסבב הזה. Service Worker לא נוגע בבקשות שאינן GET, כך שאין "הצלחה מזויפת" לפעולת כתיבה שלא באמת הגיעה לשרת.
**מגבלה שהתגלתה:** רישום ה-Service Worker לא הצליח להיבדק בפועל בתוך כלי הדפדפן הממוחשג (headless) של הסביבה הזו — נכשל עם שגיאה גנרית למרות שהקובץ מוגש נכון (200, content-type תקין, secure context). ייתכן שזו מגבלת סביבה (בדומה ל-timeout הידוע על computer clicks), לא באג בקוד — כדאי בדיקה בדפדפן אמיתי.
**משפיע על:** apps/web/public/{sw.js,manifest.json}, apps/web/components/{service-worker-registration,offline-banner}.tsx.
**סטטוס:** זמני — סנכרון דו-כיווני אמיתי נשאר Not Started, ברשימת הנושאים לדיון עם המשתמש בסוף (החלטת ארכיטקטורה, לא רק "יעשה כשיהיה זמן").

### 2026-08-16 — Audit Log: Coverage חלקי בכוונה (Trip + PlannedActivity בלבד)
**החלטה:** `AuditLogRepository` נבנה גנרי ומוכן לשימוש בכל מקום, אבל בפועל מחובר רק לשני מקומות: עדכון שדות ב-Trip (דיף מלא מול הרשומה לפני העדכון) ושינוי סטטוס ב-PlannedActivity.
**למה:** חיבור Audit Log לכל create/update בכל Repository באפליקציה (עשרות פונקציות) הוא עבודה גדולה שלא פרופורציונלית לתועלת בשלב הזה — במקום זאת נבחרו שני מקומות מייצגים כדי להוכיח שהמנגנון עובד מקצה לקצה (Repository→UI) ואפשר להרחיב בהמשך לכל Repository אחר באותו דפוס בדיוק.
**משפיע על:** packages/data-layer/src/repositories/audit-log-repository.*, apps/web/app/(app)/trips/actions.ts, apps/web/app/(app)/trips/[tripId]/planned-activities/actions.ts.
**סטטוס:** זמני — הרחבה לשאר ה-Repositories (Booking/Expense/Payment/וכו') תתבצע לפי הצורך, לא תוכננה לכל האפליקציה בבת אחת.

### 2026-08-16 — Soft Delete ל-Expense ולארבעת סוגי ה-Booking; Payment הושאר בחוץ בכוונה
**החלטה:** נוסף `deletedAt`+`softDelete` ל-HotelStay/Flight/TransportBooking/Insurance ול-Expense. **Payment לא קיבל Soft Delete בסבב הזה.**
**למה:** תשלום במזומן כבר הפחית בפועל מיתרת הארנק ברגע שנוצר (סעיף "כספים" בארכיטקטורה). מחיקת Payment בלי לתקן בחזרה את יתרת הארנק הייתה משאירה את הארנק לא עקבי עם המציאות — זו שאלת לוגיקה עסקית (האם להחזיר את הכסף לארנק? מה אם הארנק כבר נמחק/שונה בינתיים?) שדורשת עיצוב משלה, לא רק העתקה מכנית של הדפוס שבו השתמשתי ל-4 סוגי ה-Booking ול-Expense (שאין להם effect צדדי דומה על נתון אחר). גם מחיקת Expense עצמה לא מתקנת תשלומים/הפחתות ארנק שכבר נרשמו עליה — זה מתועד בכנות (בהודעת האישור ובהערת קוד), לא מוסתר.
**משפיע על:** packages/shared-types/src/{booking,expense}.ts, packages/data-layer/src/repositories/{booking,finance}-repository.*.
**סטטוס:** סופי לגבי ה-4 Booking types + Expense; Payment soft delete נשאר Not Started, ידרוש עיצוב נפרד.

### 2026-08-16 — Deposit מטופל כ-`adjustWallet` שלילי/חיובי סימטרי ל-Refund, לא כישות תשלום נפרדת
**החלטה:** תשלום פיקדון (`createDeposit`) קורא ל-`adjustWallet(..., -amount, "deposit_out")`, וסימון "הוחזר" (`markDepositReturned`) קורא ל-`adjustWallet(..., returnedAmount, "deposit_return_in")` — אותו helper בדיוק שכבר משמש Currency Exchange ו-Refund (כולל יצירת ארנק אוטומטית אם המטבע לא קיים עדיין). כל פעולה על הארנק (טעינה/מזומן/המרה/החזר/פיקדון) עוברת עכשיו דרך `recordWalletTx`, שרושמת שורת `WalletTransaction` — נקודת כניסה יחידה לכל שינוי יתרה, כדי שהיסטוריית התנועות תהיה שלמה ולא תפספס אף מקור שינוי.
**למה:** מנע כפילות לוגיקה ובאג של "שכחתי לעדכן גם את הארנק" בעתיד — כל קוד עתידי שמשנה יתרת ארנק *חייב* לעבור דרך `adjustWallet`/`recordWalletTx` כדי שההיסטוריה תישאר אמינה. סכום ההחזר בפועל (`returnedAmount`) יכול להיות שונה מהסכום המקורי (למשל ניכוי על נזק) — נתמך במפורש, לא רק מקרה של החזר מלא.
**משפיע על:** packages/shared-types/src/deposit.ts (חדש), packages/data-layer/src/repositories/finance-repository.{ts,mock.ts,prisma.ts}.
**סטטוס:** סופי.

### 2026-08-16 — StatusHistory ו-AuditLog כותבים במקביל על אותו שינוי סטטוס, לא מאוחדים למנגנון אחד
**החלטה:** כששינוי סטטוס PlannedActivity קורה, הקוד כותב פעמיים: פעם ל-AuditLog (fieldName="status", oldValue/newValue כטקסט מתורגם לעברית — "יומן שינויים" כללי) ופעם ל-StatusHistory (oldStatus/newStatus כערכי enum גולמיים — ייעודי לדוח "תכנון מול ביצוע"). לא נבנה מנגנון אחד משותף.
**למה:** לשני המנגנונים תפקיד שונה ופורמט נתונים שונה — AuditLog הוא יומן טקסטואלי גנרי לכל שדה (מיועד לקריאה אנושית "מה השתנה"), StatusHistory הוא נתון מובנה ייעודי למעברי סטטוס (מיועד לניתוח/דוח "כמה זמן היה כל פריט בכל שלב"). איחוד שלהם היה דורש להפוך את AuditLog לפולימורפי-טיפוסים או את StatusHistory לגנרי-שדות, ומאבד את הפשטות של כל אחד. כפילות הכתיבה זולה (שתי שורות DB) ומפורשת יותר מהפשטה מוקדמת.
**משפיע על:** apps/web/app/(app)/trips/[tripId]/planned-activities/actions.ts, packages/data-layer/src/repositories/status-history-repository.*.
**סטטוס:** סופי.

### 2026-08-16 — נחשף Booking.id אמיתי מ-5 טיפוסי ה-Booking המשוטחים, כדי לתמוך בהמרת Planned Activity
**החלטה:** נוסף שדה `bookingId` (ה-id האמיתי של שורת `Booking`) ל-HotelStay/Flight/TransportBooking/Insurance/CarRental בכל השכבות (shared-types/Mock/Prisma) — בנוסף ל-`id` הקיים (שממשיך להיות ה-id של שורת תת-הטבלה, למשל HotelStay.id).
**למה:** `PlannedActivity.bookingId` בסכימה הוא FK אמיתי ל-`Booking.id`, לא לשורת תת-הטבלה. עד עכשיו אף קוד לא חשף את Booking.id בכלל (ראה הערת הקוד המקורית: "השטחה כאן היא נוחות תצוגה בלבד") כי שום פיצ'ר לא היה זקוק לו. תכונת "המרת Planned Activity ל-Booking" היא הפיצ'ר הראשון שבאמת צריך להצביע על Booking.id אמיתי — ולכן זה הזמן לחשוף אותו, במקום לעשות קיצור דרך (למשל להשתמש ב-id של תת-הטבלה בטעות) שהיה סותר את הסכימה בשקט.
**משפיע על:** packages/shared-types/src/booking.ts, packages/data-layer/src/repositories/booking-repository.{mock,prisma}.ts, packages/data-layer/src/repositories/planned-activity-repository.*.
**סטטוס:** סופי.

### 2026-08-16 — חישוב מרחק/זמן נסיעה אוטומטי במסלול דרך OSRM — שרת דמו ציבורי, לא SLA לפרודקשן
**החלטה:** נוסף `RoutingProvider` (ממשק, כמו `WeatherProvider`) עם מימוש יחיד `OsrmRoutingProvider` שקורא ל-`router.project-osrm.org` — שרת ה-Demo הציבורי החינמי של פרויקט OSRM (Open Source Routing Machine), בלי מפתח API. בטופס הוספת עצירה למסלול נוסף כפתור "חשב מרחק וזמן אוטומטית" שמופיע רק כשיש עצירה קודמת באותו יום עם קואורדינטות, קורא ל-Server Action שמפעיל את ה-Provider, וממלא את שדות המרחק/זמן — המשתמש עדיין יכול לערוך ידנית לפני השמירה. אם OSRM לא מוצא מסלול או שהבקשה נכשלת, מוצגת הודעת שגיאה כנה ("אפשר להזין ידנית") ולא נכתב ערך מומצא.
**למה:** אותו דפוס "מעדיפים שירות חיצוני חינמי/בלי מפתח על פני נתון מומצא" ששימש כבר ל-Leaflet+OpenStreetMap (מפה) ו-Open-Meteo (מזג אוויר). `router.project-osrm.org` הוא שרת Demo של קהילת OSRM — מתועד במפורש כלא מיועד לעומס פרודקשן (אין הסכם SLA, יכול להיות איטי/לא זמין), בדיוק כמו שתועדו בעבר מגבלות דומות (רישום Service Worker בסביבת הבדיקה, גבולות ה-OpenStreetMap tile server). זה סביר לחלוטין לאפליקציה אישית בהיקף הזה, אבל לא מתאים כפי שהוא לשירות בקנה מידה גדול — אם זה יקרה, יש להחליף לשירות מסחרי (OSRM self-hosted / Mapbox / Google Directions) באותה נקודת חיבור יחידה (`getRoutingProvider()`).
**משפיע על:** packages/shared-types/src/routing.ts (חדש), packages/data-layer/src/routing/osrm-provider.ts (חדש), packages/data-layer/src/index.ts (`getRoutingProvider()`), apps/web/app/(app)/trips/[tripId]/days/actions.ts (`calculateRouteDistanceAction`), apps/web/app/(app)/trips/[tripId]/days/route-stop-create-form.tsx, apps/web/app/(app)/trips/[tripId]/days/[date]/page.tsx.
**סטטוס:** סופי לגבי העיצוב (ממשק Provider + Server Action + UI); שדרוג ל-OSRM עצמי/שירות מסחרי הוא שינוי טרנספרנטי דרך אותה נקודת כניסה, לא ידרוש שינוי בקוד הקורא.

### 2026-08-16 — התראות מקומיות (Notification API) בזמן שהדף פתוח, לא Web Push אמיתי
**החלטה:** נוסף `NotificationPreference` Repository (Mock+Prisma, מול המודל שכבר קיים ב-schema.prisma משלב 0 — `NotificationPreference`/`NotificationEventType`) + מנוע תזכורות client-side טהור (`dueReminders()` ב-`apps/web/lib/notification-reminders.ts`, 4 בדיקות). המימוש בפועל מכסה רק 2 מתוך 10 סוגי ההתראה שבמודל: `flight_approaching` ו-`taxi_approaching` — שני הסוגים היחידים שיש להם timestamp מדויק (ISO datetime) בנתונים הקיימים. שאר 8 הסוגים (checkout_approaching/insurance_ending/deposit_due_return/וכו') מוגדרים ב-enum ומתועדים בתווית, אבל **לא מחוברים לזיהוי בפועל** — הנתונים שלהם הם תאריך בלבד בלי שעה, וחישוב "X דקות לפני" עבורם היה מצריך להמציא שעה שרירותית (למשל "צ'ק-אאוט הוא תמיד ב-11:00") — זה סוג הבדיה שהפרויקט אוסר על עצמו במפורש. UI: טופס הפעלה/דקות-מראש לכל אחד מ-2 הסוגים הנתמכים במסך הטיול ("התראות"), ורכיב client במסך "עכשיו" שמבקש הרשאת Notification API של הדפדפן ומריץ בדיקה כל 30 שניות (רק כשהדף פתוח) מול הנתונים האמיתיים (טיסות/הסעות של הטיול הפעיל), עם דה-דופ ב-localStorage כדי לא לשלוח את אותה תזכורת פעמיים.
**למה:** "Web Push" אמיתי (התראה שמגיעה גם כשהאפליקציה/הטאב סגורים) דורש Service Worker עם Push Subscription + מפתחות VAPID + שרת שיודע לשלוח Push בזמן האמיתי (למשל job שרץ ברקע כל כמה דקות ובודק אירועים קרובים) — תשתית משמעותית שלא מתאימה למבנה הנוכחי (Next.js Server Actions, בלי job queue/cron אמיתי), ובנוסף כבר תועד שרישום Service Worker נכשל בדפדפן הבדיקה הממוחשג של הסביבה הזו (ראה PROJECT_STATE.md "בעיות שהתגלו" #7). לכן, במקום לבנות תשתית Push מלאה שלא ניתן לאמת בסביבה הזו, וגם לא לוותר על הפיצ'ר לגמרי, נבחר Notification API רגיל (עובד גם בלי Service Worker, כל עוד הדף פתוח בדפדפן) — פחות "אמיתי" מ-Push, אבל אמיתי ומאומת בפועל בתחום שהוא כן פועל בו, ומתועד בכנות ב-UI עצמו ("לא Push אמיתי — ראה DECISIONS.md") שזה המצב.
**איך נבדק:** ב-Notification API כמו Geolocation, הדפדפן הממוחשג של הסביבה דוחה הרשאות כברירת מחדל — אושר קודם שמצב "denied" האמיתי מוצג בכנות ("הרשאת התראות נדחתה"). לבדיקת מסלול ה-"granted", נעשה monkey-patch זהה בטכניקה למה שנעשה בעבר ל-Geolocation (Object.defineProperty על window.Notification עם spy על הבנאי) + ניווט client-side (לא reload מלא, כדי שה-patch ישרוד). נוצרה טיסת בדיקה אמיתית דרך הטופס הרגיל (לא נתון מומצא בקוד) עם departureAt כ-80 דקות מהרגע האמיתי, הועדפה tripId פעיל זמנית (תאריכי טיול הוזזו זמנית, הוחזרו בסוף), הופעלה העדפת flight_approaching — ואומת ש-`new Notification(...)` נקרא בפועל עם הכותרת/תוכן הנכונים מהנתון האמיתי, ושדה-דופ ה-localStorage מונע ירי כפול בטעינה חוזרת של הרכיב. נתוני הבדיקה (הטיסה, הזזת התאריכים, ההעדפה) הוחזרו/נמחקו בסוף הבדיקה.
**משפיע על:** packages/db/prisma/schema.prisma (`NotificationPreference`, קיים מראש), packages/shared-types/src/{enums,notification-preference}.ts, packages/data-layer/src/repositories/notification-preference-repository.*, apps/web/lib/notification-reminders.ts, apps/web/lib/notification-event-type-labels.ts, apps/web/app/(app)/trips/[tripId]/notifications/*, apps/web/app/(app)/now/notification-reminders.tsx, apps/web/app/(app)/now/page.tsx.
**סטטוס:** סופי לגבי 2 הסוגים הנתמכים. הרחבה ל-8 הסוגים הנוספים ול-Push אמיתי (VAPID+SW+שרת) — Not Started, תלוי בין השאר בפתרון מגבלת ה-Service Worker בסביבת הבדיקה ובתשתית שרת אמיתית (מעבר לדמו).

### 2026-08-16 — סינון דוח לפי עיר/מדינה מבוסס Expense.placeId, לא טקסט חופשי
**החלטה:** בדוח הטיול נוספו dropdown-ים לעיר/מדינה שהאפשרויות בהם נגזרות מ-`Place.city`/`Place.country` של המקומות המקושרים לטיול (`TripPlace`) בפועל — לא שדה טקסט חופשי. הסינון עצמו משווה את `Expense.placeId` (שדה שכבר קיים בסכימה, משמש היום למסאז'ים/אוכל/קניות/אטרקציות) מול המקום שנבחר. הוצאה בלי `placeId` מקושר לא נכללת כשסינון עיר/מדינה פעיל — מוצגת הודעה מפורשת על כך.
**למה:** טקסט חופשי לעיר/מדינה היה מאפשר למשתמש להקליד ערך שלא קיים בפועל באף הוצאה ("לא נמצא כלום" בלי הסבר), ומחייב היגיון fuzzy-matching על מחרוזות (למשל "בנגקוק" מול "Bangkok"). גזירת האפשרויות מנתונים אמיתיים מבטיחה שכל אפשרות בתפריט תמיד תניב תוצאה, ושהסינון עקבי עם איך שהמיקום כבר מקושר להוצאות במקומות אחרים באפליקציה (כפתורי ניווט, "פתוח עכשיו" וכו').
**משפיע על:** apps/web/app/(app)/trips/[tripId]/report/page.tsx.
**סטטוס:** סופי. שיפור עתידי אפשרי: לאפשר סינון גם לפי עיר/מדינה של הזמנות (Booking) לא רק Expense — לא מומש, ההזמנות לא נושאות placeId היום.

### 2026-08-16 — השוואה בין טיולים בלי המרת מטבע, כמו בדוח היחיד
**החלטה:** עמוד חדש `/trips/compare` מציג טבלה של כל הטיולים הפעילים (לא Soft-Deleted) עם עלות כוללת/ממוצע ליום, מקובצים לפי מטבע (Map<currency, amount> לכל טיול, בלי לסכם בין מטבעות). קישור "📊 השווה טיולים" נוסף לעמוד רשימת הטיולים.
**למה:** אותו עיקרון בדיוק כמו בדוח הטיול הבודד (`categoryChartByCurrency`/`totalByCurrency`) — המרת מטבע דורשת שער חליפין אמיתי בזמן אמת, שאין לו מקור נתונים מחובר כרגע (ראה DECISIONS.md על Weather/Routing — אותו דפוס "לא להמציא נתון חסר"). טיול בתאילנד (THB) וטיול בפראג (EUR/CZK) מוצגים זה לצד זה כשתי עמודות טקסט נפרדות, לא כמספר משותף מזויף.
**משפיע על:** apps/web/app/(app)/trips/compare/page.tsx (חדש), apps/web/app/(app)/trips/page.tsx (קישור).
**סטטוס:** סופי.

### 2026-08-16 — תיקון גלישה אופקית במסך מובייל: ניווט תחתון + זוגות שדות תאריך/שעה
**החלטה:** נמצאו ותוקנו שני מקורות גלישה אופקית אמיתית במובייל (375 פיקסל): (1) הניווט התחתון (7 קישורים) לא כיווץ נכון — נוסף `flex: "1 1 0"` + `minWidth: 0` לכל קישור (`components/nav-link.tsx`), טקסט התווית מקבל קיצור בשלוש נקודות (`text-overflow: ellipsis`) כשאין מקום, ולמיכל הניווט עצמו נוסף `width: "100%"`/`maxWidth: "100vw"`/`overflowX: "hidden"` כגיבוי מפורש (`app/(app)/layout.tsx`). (2) בכל טופס שמציג שדה תאריך/שעה (`type="date"`/`datetime-local`) לצד שדה נוסף באותה שורה — שדות תאריך/שעה בדפדפן לא מתכווצים מתחת לרוחב מינימלי מסוים (חלק מה-UA styling הפנימי שלהם), אז בזוג צמוד ברוחב מובייל השורה נדחסה מעבר לגבול המסך. נוסף `flexWrap: "wrap"` (וב-2 מקרים `minWidth`) לכל שורה כזו — 9 טפסים: flight/hotel-stay/insurance/car-rental/transport-booking-form, route-stop-create-form, planned-activity-create-form, trip-edit-form, trip-create-form.
**למה:** המשתמש ציין דרישה מפורשת שהמערכת תעבוד גם במובייל וגם בדסקטופ. הניווט התחתון קיים כבר משלב 0 (סעיף App Shell) אבל מעולם לא נבדק בפועל ברוחב מסך צר אמיתי — הבדיקה החדשה חשפה שהוא לא כיווץ נכון. אותו דבר לגבי זוגות שדות התאריך/שעה, שהתווספו לאורך כל הפרויקט בלי בדיקת רוחב מסך צר. שני התיקונים הם התאמת CSS גרידא (flexWrap/flex-basis/minWidth), בלי שינוי בהתנהגות/נתונים.
**איך נבדק:** נבדק חי בדפדפן הבדיקה בסימולציית מובייל (375 פיקסל) לפני ואחרי — נמצאו אלמנטים עם `scrollWidth` גדול מרוחב המסך (עד 416 פיקסל בתוך 335 פיקסל זמינים) בטפסי הזמנות, ותוקן. אומת ויזואלית בצילום מסך שאין עוד חיתוך/הצטופפות של שדות, וגם בדסקטופ (1280 פיקסל) שהעיצוב לא נפגע. הערה טכנית: כלי הבדיקה הממוחשג הזה הראה לפרקים מדדי `window.innerWidth`/`scrollWidth` לא עקביים ברוחב מובייל ספציפי (תלוי כלי, לא שוחזר בדסקטופ) — לכן ההסתמכות הסופית הייתה על צילומי מסך ויזואליים בפועל, לא רק על מדידות JS.
**משפיע על:** apps/web/components/nav-link.tsx, apps/web/app/(app)/layout.tsx, ו-9 קבצי טופס תחת apps/web/app/(app)/trips/[tripId]/{bookings,days,planned-activities}/ ו-apps/web/app/(app)/trips/.
**סטטוס:** סופי לגבי המקרים שנבדקו. אם יתגלו עוד שורות שדות-לצד-שדה שלא נבדקו (טפסים עתידיים), להחיל את אותו דפוס (`flexWrap: "wrap"`) מראש.

### 2026-08-16 — עיצוב Premium: ספריית אייקונים Lucide (`lucide-react`)
**החלטה:** כל האייקונים באפליקציה (ניווט, קטגוריות מקום, מרקרים במפה, UI כללי) עוברים מ-Emoji גולמי לספריית `lucide-react`.
**למה:** 1,500+ אייקונים על גריד stroke עקבי, tree-shaking מעולה (יבוא N אייקונים עולה בודדות KB אחרי gzip), עובד בלי Tailwind (קומפוננטות React רגילות עם prop של `color`/`size`/`className`, ברירת מחדל `currentColor` שמתאים אוטומטית לכל ערכת נושא), מכסה כמעט את כל קטגוריות ה-Place הקיימות. Phosphor Icons נבדקה כאלטרנטיבה (יותר אייקונים/משקלים) אבל עם overhead גדול משמעותית ב-bundle לפי benchmark שנבדק — לא מתאים לפרויקט שמקפיד על ביצועים בלי ספריית קומפוננטות קיימת שכבר "משלמת" את המחיר.
**הערה:** לקטגוריית `chabad_house` אין אייקון דתי-ספציפי בספרייה חילונית כמו Lucide — נבחר placeholder סביר (Star/אייקון דומה) עד שתתקבל הכרעה סופית מהמשתמש אם נדרש.
**משפיע על:** apps/web/package.json, apps/web/lib/place-labels.ts, apps/web/lib/trip-place-labels.ts, apps/web/components/nav-icons.ts, apps/web/app/(app)/layout.tsx, apps/web/components/nav-link.tsx.
**סטטוס:** סופי לבחירת הספרייה; מיפוי אייקון-לקטגוריה ימשיך להתרחב עם הזמן.

### 2026-08-16 — עיצוב Premium: ספק מפה Mapbox GL JS (Standard style) לשלב 1, לא Google Photorealistic 3D Tiles
**החלטה:** שכבת המפה החדשה (`MapProvider` abstraction + Demo Map) בנויה על Mapbox GL JS עם ה-Style הסטנדרטי (`mapbox://styles/mapbox/standard`), לא על Google Maps Platform Photorealistic 3D Tiles.
**למה:** נבדק תיעוד רשמי עדכני משני הצדדים. Google Photorealistic 3D Tiles: (1) אין רנדרר JS רשמי לדפדפן — Google דורשת "תביא רנדרר תואם OGC-3D-Tiles משלך" (למשל CesiumJS, מנוע 3D כבד ומורכב) — לא אינטגרציה קלה; (2) כיסוי לא גלובלי, רק "אזורים מאוכלסים" שגוגל סרקה, בלי ערובה לכיסוי יעדי הטיול בפועל; (3) הגבלת תוכן למשתמשי אזור כלכלי אירופי מיולי 2025; (4) חיוב לפי SKU נפרד ("Root Tile"/session), אטום יותר לתכנון תקציב מראש. מקורות: https://developers.google.com/maps/documentation/tile/3d-tiles-overview , https://developers.google.com/maps/documentation/tile/usage-and-billing . לעומת זאת Mapbox Standard כולל בנייני 3D/טופוגרפיה/Landmarks/תאורה/Satellite **בתוך טעינת מפה רגילה בלי עלות נוספת**, רץ ישירות ב-WebGL בלי מנוע חיצוני כבד, כיסוי גלובלי (עושר הבניינים משתנה לפי עיר, אבל אין "אזור לא נתמך בכלל"), טייר חינמי עד 50,000 טעינות/חודש ואז תמחור מדורג שקוף. מקורות: https://www.mapbox.com/pricing , https://docs.mapbox.com/map-styles/guides/standard-styles/ . זה תואם את ההנחיה המפורשת של המשתמש: "אם אין כיסוי Photorealistic 3D מתאים, הכן Fallback כמו Mapbox" — במקרה הזה ה-Fallback הוא בפועל הבחירה הראשונה, כי החסמים של Google אמיתיים ולא רק עניין של כיסוי אזורי.
**חשוב:** בשונה מ-Leaflet+OpenStreetMap/Open-Meteo/OSRM (שנבחרו עד כה תמיד כי הם חינמיים וללא מפתח), Mapbox **דורש** `NEXT_PUBLIC_MAPBOX_TOKEN` (חינמי עד המכסה, אבל לא ללא הרשמה). זו התלות החיצונית הראשונה בתחום המפות שדורשת פעולה מהמשתמש.
**עתיד:** Google Photorealistic 3D Tiles נשאר אופציה מתועדת מאחורי אותה הפשטת `MapProvider` — לא נחסם, רק לא נבחר לשלב הראשון.
**משפיע על:** apps/web/lib/map/*, apps/web/package.json, apps/web/.env.local.
**סטטוס:** סופי לשלב 1; ניתן להרחבה/שינוי דרך אותה הפשטה בלי שינוי קורא.

### 2026-08-16 — עיצוב Premium: העדפות Theme נשמרות ב-localStorage
**החלטה:** מצב Theme (Light/Dark/Auto, Accent, Brightness, Density, Rounded Corners, Animations) נשמר ב-`localStorage` בדפדפן, לא בטבלת DB/עוגייה בצד שרת.
**למה:** אין באפליקציה היום שום מנגנון קיים לשמירת העדפת משתמש בצד שרת (`getCurrentUser()` הוא override קבוע למצב Mock) — זה דפוס חדש, לא סטייה מדפוס קיים. localStorage מתאים כי זו העדפת תצוגה טהורה בצד client, לא נתון עסקי שצריך לחיות מול DATA_SOURCE=mock/prisma.
**משפיע על:** apps/web/components/theme-provider.tsx, apps/web/lib/theme/*.
**סטטוס:** סופי לשלב זה; אם/כשיהיה משתמש אמיתי מרובה-מכשירים מול Supabase, ניתן לשקול העברה ל-DB בלי לשנות את ה-Context API הציבורי.

### 2026-08-16 — `MapProvider` חי ב-apps/web/lib/map/, לא ב-packages משותפים כמו WeatherProvider/RoutingProvider
**החלטה:** למרות שההפשטה מחקה את הדפוס של `WeatherProvider`/`RoutingProvider` (ממשק + מימושים מתחלפים + factory), היא **לא** יושבת ב-`packages/shared-types`/`packages/data-layer` כמותם.
**למה:** Weather/Routing הם `fetch()` טהור בלי תלות ב-DOM — קריאים גם מ-Server Components. `mapbox-gl`, בדיוק כמו `leaflet` שכבר בקוד, נוגע ישירות ב-`window`/`document`/`canvas` וחייב להיות client-only, מבודד ע"י `next/dynamic(..., {ssr:false})` — בדיוק כמו ש-`map-view.tsx` כבר עושה היום ל-Leaflet. אי אפשר לייבא קוד כזה מ-package משותף שרכיבי שרת עשויים לייבא ממנו בטעות.
**משפיע על:** apps/web/lib/map/*.
**סטטוס:** סופי.

### 2026-08-16 — ניווט: קיבוץ מסכים לפי מה שקיים בפועל, לא לפי כל פריט שהמשתמש ביקש
**החלטה:** בבקשת העיצוב המחודש ביקש המשתמש פריטי ניווט כמו Bookings/Hotels/Flights/Transport/Wallet/Expenses/Documents/Insurance/Reports/Calendar/Plan Future/Profile כפריטים עצמאיים. בפועל, ל-8 route-ים עליונים בלבד יש דף היום (dashboard/now/today/trips/places/map/contacts/payment-cards) — כל שאר הפריטים חיים כטאבים בתוך מסך טיול ספציפי (`/trips/[tripId]/...`). הוחלט **לא** להמציא קישורי ניווט עליונים לדפים ריקים/לא קיימים. הסיידבר מקובץ ל"סקירה" (Dashboard/Now/Today) ו"טיולים" (Trips/Map/Places/Payment Cards/Contacts) + Settings בנפרד. הגישה ל-Bookings/Wallet/וכו' נשארת דרך מסך הטיול הספציפי, כמו היום. Calendar/Plan Future/Profile נדחו (אין להם route עצמאי ואין להם data model של פרופיל משתמש אמיתי היום).
**למה:** בניית ניווט לדפים שלא קיימים הייתה יוצרת "נראה כאילו עובד" — בדיוק מה שהעיקרון "0" ב-PROJECT_REQUIREMENTS.md אוסר. אם/כשייבנו מסכי צבירה חוצי-טיולים אמיתיים (למשל יתרת ארנק מצטברת על כל הטיולים), הם יקודמו לניווט העליון אז.
**משפיע על:** apps/web/app/(app)/layout.tsx, apps/web/components/nav-link.tsx, apps/web/components/{nav-icons,quick-add-fab,mobile-more-sheet}.tsx.
**סטטוס:** סופי לשלב 1; ניתן להרחבה כשייבנו מסכי צבירה חדשים.

### 2026-08-16 — עיצוב Premium (שלבים a-f): Commit יחיד בסוף, לא Commit-per-step
**החלטה:** בניגוד למוסכמת ה-commit-per-step הרגילה של הפרויקט (ראה ההחלטה מ-2026-08-15 על קבצי המשכיות), עבודת העיצוב המחודש (Theme/Nav/Dashboard/MapProvider/Demo Map) לא תקבל commit אחרי כל תת-שלב. כל העבודה תישאר ב-working tree, ותקבל **commit מקומי אחד** רק אחרי שהמשתמש יבדוק את התוצאה הסופית ויאשר במפורש.
**למה:** בקשה מפורשת של המשתמש לשלב עבודה גדול וממוקד-עיצוב שהוא רוצה לבדוק כמכלול אחד לפני שהוא נכנס להיסטוריית ה-git, ולא כ-95+ commits בודדים כמו שאר הפרויקט.
**משפיע על:** תהליך העבודה לשלבים a-f בלבד (הבקשה "עיצוב Premium").
**סטטוס:** סופי לעבודה הזו בלבד; המוסכמה הרגילה (commit-per-step) חוזרת אחרי שהמשתמש יאשר ויבוצע ה-commit הזה.

### 2026-08-16 — סגירת פערים מול מוקאפ הייחוס: גרף הוצאות, כותרת דשבורד, תובנות טיול, חיפוש
**החלטה:** אחרי commit ראשון של עיצוב ה-Premium (`0ee5b50`), המשתמש ביקש לסגור פערים ספציפיים מול תמונת הייחוס: (1) גרף עוגה (Donut) לפילוח הוצאות לפי קטגוריה — קומפוננטת SVG טהורה חדשה (`components/donut-chart.tsx`), בלי ספריית תרשימים, באותו דפוס בדיוק כמו ה-BarChart הקיים בדוח הטיול. (2) כותרת דשבורד (`dashboard-header.tsx`) עם ברכה, פעמון (מקשר ל-`/now`, **בלי מספר התראות מומצא** — אין מנגנון ספירה אמיתי), וקישור הגדרות. (3) כרטיס "תובנות טיול" עם מספרים אמיתיים בלבד (טיולים/מקומות שביקרת/ימי טיול, מחושבים על כל הטיולים) במקום placeholder "בקרוב". (4) חיפוש טיולים אמיתי (GET, בלי JS) בכותרת הדשבורד.
**למה שלוש בחירות ספציפיות:** (א) הברכה **לא** כוללת שם משתמש — ל-`getCurrentUser()` אין שדה name (רק id+email), אז ברכה היא לפי שעה בלבד ("בוקר טוב"/"ערב טוב" וכו') כדי לא להמציא שם. (ב) "סה״כ הוצאה" בתובנות הטיול מוצג **לפי מטבע בנפרד**, לא מספר אחד ממוצע — בדיוק אותו עיקרון "בלי המרת מטבע מומצאת" שכבר קיים ב-`trips/compare` ובדוח הטיול הבודד. (ג) החיפוש מכסה **רק טיולים**, לא מקומות — למקומות אין עדיין דף פרטים ייעודי (`/places/[id]`), רק רשימה כללית (`/places`), אז חיפוש שהיה "מוצא" מקום בלי לינק אמיתי אליו היה בדיוק סוג ה-"נראה כאילו עובד" שאסור.
**באג אמיתי שנתפס ותוקן:** קומפוננטת ה-DonutChart בנתה את קשתות ה-SVG עם משתנה `let offset` שמתעדכן תוך כדי `.map()` — ESLint (`react-hooks/immutability`) תפס את זה כ"reassign אחרי render" ונכשל ה-build. תוקן ל-`.reduce()` טהור בלי mutation.
**משפיע על:** apps/web/components/donut-chart.tsx (חדש), apps/web/app/(app)/dashboard/{dashboard-header,expenses-overview-card,trip-insights-card,page}.tsx.
**סטטוס:** סופי.

### 2026-08-16 — Widget מפה בדשבורד + "טיפ של היום"
**החלטה:** בהמשך לסגירת הפערים מול המוקאפ, נבנו שני אלמנטים נוספים: (1) Widget מפה בדשבורד (`map-widget-card.tsx` + `map-widget-view.tsx` + `map-widget-canvas.tsx`) — גרסה מצומצמת של Demo Map (בלי style switcher/nearby/מיקום נוכחי), שמשתמשת **באותה** הפשטת `MapProvider` בדיוק. זה סותר החלטה קודמת ("שטח מפה שמור בלבד, בלי הטמעת Mapbox חי... מתוכנן לשלב הבא") — ההחלטה הזו בוטלה במפורש כי המשתמש ביקש להמשיך אחרי ששלבי e-f (MapProvider + Demo Map) כבר הושלמו ונבדקו, כך שההטמעה כבר לא "קופצת קדימה" על תשתית שלא קיימת. בלי Mapbox token (המצב הנוכחי), ה-Widget מציג את אותה הודעת "לא מחובר" הכנה כמו ב-`/map-demo`, לא מפה מזויפת. (2) "טיפ של היום" (`lib/travel-tips.ts` + `tip-of-the-day-card.tsx`) — רשימת טיפים כלליים ואמיתיים לנסיעות (לא מותאמים-משתמש, לא תובנה מומצאת), נבחר באופן דטרמיניסטי לפי יום-בשנה (לא `Math.random`) כדי שהתוצאה עקבית ובת-בדיקה.
**למה:** המשתמש ביקש במפורש "תמשיך" אחרי שהוצגו לו שני הפערים האלה כפריטים שנותרו מול המוקאפ.
**משפיע על:** apps/web/app/(app)/dashboard/{map-widget-card,map-widget-view,map-widget-canvas,tip-of-the-day-card,page}.tsx, apps/web/lib/travel-tips.ts (+test).
**סטטוס:** סופי.

### 2026-08-16 — הרשמה: אימייל=שם משתמש, אישור אחד משותף ל-3 מסמכים משפטיים, תוכן טיוטה
**החלטה:** נוספו `/register` (הרשמה אמיתית מול Supabase Auth, `supabase.auth.signUp()` — אותו דפוס בדיוק כמו `/login` הקיים שכבר קורא ל-`signInWithPassword()`), ושלושה מסמכים משפטיים סטטיים: `/legal/terms` (תקנון), `/legal/agreement` (הסכם שימוש), `/legal/privacy` (מדיניות פרטיות). כל שלושת המסמכים מאושרים ב-**checkbox יחיד משותף** (לא שלושה checkbox-ים נפרדים), עם קישורים לכל מסמך שנפתחים בכרטיסייה חדשה כדי לא לאבד את מצב הטופס. אין שדה "שם משתמש" נפרד — האימייל הוא שם המשתמש, כמו ב-`/login` הקיים.
**תוכן המסמכים:** טיוטה סבירה למוצר אישי בשלב פיתוח, שנכתבה על ידי Claude — **לא** ייעוץ משפטי ולא נבדקה משפטית, מתועד ככה בבירור בראש כל מסמך (עם אזהרה מפורשת). התוכן משקף בכנות את הארכיטקטורה האמיתית של המערכת (Open-Meteo/OSRM/OpenStreetMap/Mapbox כשירותי צד ג', מצב Mock הנוכחי, Soft Delete, localStorage לעדכוני Theme בלבד) ולא טקסט משפטי גנרי מנותק מהמציאות.
**מעקב אישור:** נוסף שדה `User.legalConsentAcceptedAt` (DateTime, nullable) לסכימה — **אישור אחד משותף** לשלושת המסמכים (לא ניהול-גרסאות/אישור נפרד לכל מסמך). הזמן נשלח כ-`user_metadata` דרך `supabase.auth.signUp({options:{data:{legal_consent_accepted_at}}})`, והטריגר `handle_new_auth_user` (`rls_policies.sql`) קורא אותו מ-`raw_user_meta_data` וכותב לעמודה בפעם הראשונה ש-`public.users` נוצרת — לא נדרש UserRepository נפרד, לא Server Action, כי כל הזרימה כבר קיימת דרך ה-trigger הקיים. שדה זה עדיין לא בשימוש בפועל (Supabase לא מחובר) — ייבדק חי כשיסופקו פרטי Supabase, כמו כל שאר תשתית ה-Auth.
**למה checkbox יחיד ולא שלושה:** אושר מפורשות עם המשתמש בשאלת הבהרה — פשוט יותר ל-UX, והמשמעות המשפטית זהה (הסכמה לכל שלושת המסמכים יחד).
**משפיע על:** packages/db/prisma/{schema.prisma,rls_policies.sql}, apps/web/app/{register,login,legal/*}/page.tsx, apps/web/app/legal/legal-page-layout.tsx (חדש).
**סטטוס:** סופי לעיצוב; **בדיקה חיה מול Supabase אמיתי טרם בוצעה** (תלוי בחיבור Supabase, כמו שאר תשתית ה-Auth).

### 2026-08-16 — Redesign יסודי שני: המשתמש לא היה מרוצה מהתוצאה של שלבי a-f, מתחילים Design System אמיתי
**החלטה:** אחרי שהמשתמש בדק את התוצאה של עיצוב ה-Premium הראשון (commits `0ee5b50`…`fa8e41c`), הוא קבע במפורש שזה עדיין נראה כמו Admin Panel רגיל ולא כמו "Travel Premium ברמה מסחרית". הוא סיפק בריף מפורט מאוד (42+ נקודות) וצירף שוב את תמונת הייחוס (הפעם נקלטה בפועל — לפני כן רק תואר לי). הוחלט לעצור זמנית פיתוח פיצ'רים ולבנות **Design System אמיתי מהיסוד** (Token-driven, לא צבעים ידניים ב-Components) + **ספריית UI Components משותפת** לפני שממשיכים למסכים נוספים. היקף מוגדר במפורש ל-Proof of Concept אחד (Dashboard בלבד, Desktop+Mobile) — לא לכל האפליקציה בבת אחת. עצירה חובה לאישור המשתמש בסוף לפני שממשיכים למסכים אחרים.
**החלטות עיצוב קונקרטיות מתוך ניתוח תמונת הייחוס (TripMaster mockup):**
- רקע כמעט-שחור/נייבי עמוק מאוד (לא #0b1220 הקודם — כהה יותר), כרטיסים בגוון נייבי מעט בהיר יותר עם border עדין (rgba לבן ~8-10%), לא שחור-לבן שטוח.
- Accent: גרדיאנט סגול→כחול (לא צבע יחיד שטוח) על כפתורים/מצב פעיל/progress bars.
- Marker-ים על המפה: badge עגול עם גרדיאנט + אייקון לבן + "זנב" משולש קטן — בדיוק כמו בתמונה (לא Pin ברירת מחדל) — **כבר קיים** מ-DECISIONS.md הקודם (`marker-style.ts`), לא צריך לבנות מחדש.
- Avatar: בתמונה יש תמונות פנים אמיתיות של אנשים — **לא ניתן להשתמש בתמונות של בני אדם אמיתיים בלי רשות** (גם לא כ-Demo) — הוחלט להשתמש ב-Avatar מבוסס-אותיות (ראשי תיבות על רקע גרדיאנט), לא תמונה מזויפת של אדם שלא קיים/לא ניתן רישיון לו.
- Font: נבחר **Rubik** (Google Font, `next/font/google`) — יש לו תמיכה מלאה בעברית ולטינית, מראה גאומטרי-מודרני קרוב לפונט בתמונה (דומה ל-Poppins/Inter אבל עם עברית אמיתית, קריטי כי האפליקציה RTL בעברית). Poppins/Inter הקלאסיים לא כוללים Glyphs עבריים.
- תמונת Hero לטיול: תמונת הייחוס משתמשת בתמונת נוף אמיתית של רומא. **אין ל-Trip.coverImageUrl ערך בנתוני הדמו** (שדה קיים בסכימה, לא הוגדר UI למילוי עדיין) — לא בוצע חיפוש/הבאה של תמונת סטוק חיצונית (המשתמש לא אישר את זה, וגם אין ערוץ בטוח מאומת לתמונה חיצונית יציבה בסביבה הזו). נבנה רקע גרדיאנט/מש דמוי-שקיעה עשיר יותר מהגרסה הקודמת (טונים חמים) כתחליף כן — כשיסופק `coverImageUrl` אמיתי, הוא יוצג במקום זה אוטומטית.
- מפה גדולה: אזור המפה בדשבורד מקבל כ-60% מרוחב השורה העליונה (לצד ה-Hero הקטן יותר, כמו בתמונה), לא Widget קטן.
**Component Library:** נבנתה תחת `apps/web/components/ui/` — GlassCard, StatCard, Avatar, StatusBadge, SearchBar, NotificationButton, ThemeSwitcher (קומפקטי), EmptyState, Sidebar, TopBar, BottomNavigation, AppShell, Timeline, QuickAction. **לא נבנו בסבב הזה** (יבנו כשנרחיב למסכים שבאמת צריכים אותם): Modal, Drawer, Tooltip, Toast, FilterChip, PlaceCard, BookingCard, PageHeader — נשמרים ברשימת TODO מתועדת, לא נשכחו.
**משפיע על:** apps/web/app/globals.css (Token overhaul), apps/web/components/ui/* (חדש), apps/web/app/(app)/layout.tsx, apps/web/app/(app)/dashboard/*.
**סטטוס:** סופי לכיוון; ממתין לאישור המשתמש על ה-POC לפני הרחבה לשאר המסכים.

### 2026-08-16 — Redesign — התאמה מדויקת לתמונת הייחוס (לא עוד פרשנות עצמאית)
**החלטה:** המשתמש קבע במפורש שה-POC הקודם (commit `ea29cff`) "אינו בכיוון" של תמונת הייחוס, וביקש **לא** לפרש "Premium" מחדש לבד אלא לנתח את התמונה בפועל ולהתאים אליה במדויק. בוצע ניתוח שיטתי של התמונה (מבנה/יחסי רוחב/סדר תוכן/צבעים/טיפוגרפיה) ותועד למשתמש לפני כתיבת קוד, כמבוקש. השינויים הקונקרטיים:
- **יחס Hero:Map** שונה מ-1:1.5 ל-**~1:2.35** (`0.85fr 2fr`) — במוקאפ המפה דומיננטית משמעותית יותר מהכרטיס הראשי.
- **סדר תוכן ב-Hero** תוקן: תווית → שם → תאריכים+מיקום → **שורת מזג אוויר** (הוספה, לא הייתה קודם — נגזרת מאותו מקום ששימש כבר לכרטיס Weather, לא נתון כפול) → כפתור CTA (עכשיו עם רקע גרדיאנט מלא, לא שקוף) → progress bar בתחתית. לפני כן ה-CTA היה אחרי ה-progress, הפוך מהמוקאפ.
- **מיקום**: אין שדה עיר/מדינה על Trip עצמו — מוצג בכנות רק כשיש מקום מקושר עם קואורדינטות (`weatherPlace.city/country`), לא מומצא.
- **Placeholder המפה** גדל ל-420px (כגובה ה-Hero), קיבל תווית **"Demo — לא מחובר"** מפורשת בפינה (לפי דרישת המשתמש: "מותר Placeholder איכותי אבל חייב סימון Demo בקוד, לא מפה מזויפת שנראית Online") — בלי טאבים/כפתורי זום מזויפים שנראים אינטראקטיביים אבל לא עושים כלום.
- **טוקנים**: רקע כהה משמעותית יותר (`#05060c`), glass עדין יותר (blur 20px→12px, אטימות surface גבוהה יותר כך שכרטיסים נראים solid ולא "שטופים"), גרדיאנט המותג הפך **סגול-דומיננטי** (לא 50/50 סגול-כחול) — כחול נשאר אקסנט משני קטן.
- **טיפוגרפיית מספרים**: `--text-metric` גדל מ-1.875rem/700 ל-2.25rem/800.
- **4 כרטיסי הסטטיסטיקה** קיבלו רמזים משניים אמיתיים ומגוונים (לא "hint" גנרי אחיד): אחוז ימים שהושלמו, פירוט הזמנות (X מלונות · Y טיסות) — מנתונים שכבר קיימים, בלי המצאה.
- **שורה 3** עודכנה ל-5 כרטיסים (כמו במוקאפ): נוסף כרטיס "מפה אינטראקטיבית" משני (`interactive-map-preview-card.tsx`) — **תווית "Demo" מפורשת גם בו**, שונה במפורש מהמפה הגדולה למעלה.
- **שורה 4** אורגנה מחדש: Quick Actions + Tip of the Day + Trip Insights כשלושה כרטיסים באותה שורה (כמו במוקאפ) במקום Quick Actions כשורה נפרדת ורחבה.
**פער כן שנותר, לא הוסתר:** המוקאפ שם את רשימת המטבעות ("My Wallet") ב-Sidebar, לא בתוכן הראשי. לא בוצע מעבר מבני הזה (WalletSummaryCard/ExpensesSummaryCard נשארו בתוכן הראשי) — זה שינוי גדול יותר (דורש הבאת נתוני ארנק ל-Layout/Sidebar) שלא בוצע בלי הנחיה מפורשת. **פער כן נוסף:** המפה עצמה עדיין Placeholder, לא תמונת/רינדור 3D אמיתי — תלוי ב-Mapbox token שטרם סופק, בלתי ניתן לצמצום מצד ה-UI בלבד.
**Checkpoint:** working tree היה נקי ותואם ל-`ea29cff` לפני תחילת השינויים האלה — זו נקודת החזרה אם נדרש.
**משפיע על:** apps/web/app/globals.css, apps/web/components/ui/GlassCard.tsx, apps/web/app/(app)/dashboard/{trip-hero-card,map-widget-card,page}.tsx, apps/web/app/(app)/dashboard/interactive-map-preview-card.tsx (חדש).
**סטטוס:** סופי לסבב הזה; ממתין לאישור המשתמש בדפדפן.

### 2026-08-16 — "עדיין נראה כמו Admin Panel": תמונות אמיתיות + Ambient Glow, לא עוד Token-tuning
**החלטה:** למרות סבב ההתאמה המדויקת הקודם (`30b1978`), המשתמש חזר עם אותה תמונת ייחוס וקבע שהתוצאה "נראית פונקציונלית ופשוטה מדי, כמו מערכת ניהול בסיסית". הניתוח: שני האלמנטים הכי דומיננטים ויזואלית בתמונת הייחוס — תמונת ה-Hero האמיתית ורינדור המפה התלת-ממדי — **שניהם היו ריקים** אצלנו (גרדיאנט/Placeholder בלבד), כך שהמסך הורכב כמעט כולו מכרטיסי זכוכית עם טקסט על רקע כהה אחיד — בדיוק המראה של "Admin Panel" בלי קשר לאיכות ה-Tokens עצמם. בנוסף, ל-`backdrop-filter: blur()` של כרטיסי הזכוכית לא היה שום דבר צבעוני מאחוריהם לטשטש (רקע `--color-bg` שטוח אחיד), כך שאפקט ה-Glass לא היה נראה בפועל.
**מה נפתר:**
1. **תמונות אמיתיות** (`lib/destination-photos.ts`, חדש) — תמונות נוף אמיתיות מ-Wikimedia Commons (רישוי חופשי, לא AI/Stock מזויף), נבחרות לפי מילות מפתח בשם/הערות הטיול (בדיוק כמו העיר בפועל — "תאילנד"/"בנגקוק" עבור טיול הדמו, "פראג" לטיול השני) — **לעולם לא מנוחשות עבור יעד לא מזוהה** (מוחזר `null`, נופל חזרה לגרדיאנט הכן הקודם). כל ה-URLs אומתו בפועל (HTTP 200) לפני השימוש, לא הומצאו. `Trip.coverImageUrl` (שדה סכימה אמיתי) ממשיך לקבל עדיפות מוחלטת כשהוא מוגדר. שימוש ב-3 מקומות: Hero הגדול, ה-"Demo" Placeholder של המפה הגדולה, thumbnail ב-"טיפ של היום" (תואם ל-Colosseum thumbnail בתמונת הייחוס). קרדיט "תמונה: Wikimedia Commons" מוצג בכל מקום שמשתמש בתמונה כזו — נדרש ע"י רישיון CC-BY-SA וגם עניין של כנות (לא מוצג כאילו זו תמונה של המשתמש).
2. **Ambient Background Glow** — נוסף `.app-ambient-glow` (globals.css) — שכבת רקע `position:fixed` עם 3 גרדיאנטים רדיאליים מטושטשים גדולים (סגול/כחול/סגול-כהה) מאחורי כל התוכן, כדי שלכרטיסי ה-Glass יהיה משהו צבעוני לטשטש בפועל — בלי זה, ה-blur לא נראה חזותית על רקע שטוח.
**למה לא עוד Token-tuning:** שני הסבבים הקודמים כבר כיוונו Tokens (רקע/blur/גרדיאנטים/טיפוגרפיה) בהתאם לניתוח מדויק של התמונה, ועדיין "לא הרגיש נכון" — המסקנה היא שהפער לא היה בכיוונון הטוקנים אלא בהיעדר תוכן ויזואלי (תמונות) שהטוקנים אמורים לעטוף. תיקון טוקנים נוסף בלי תמונות היה צפוי להיכשל שוב באותה צורה.
**משפיע על:** apps/web/lib/destination-photos.ts (+test, חדש), apps/web/app/(app)/dashboard/{trip-hero-card,map-widget-card,interactive-map-preview-card,tip-of-the-day-card,page}.tsx, apps/web/components/ui/AppShell.tsx, apps/web/app/globals.css.
**סטטוס:** סופי לסבב הזה; ממתין לאישור המשתמש בדפדפן.

### 2026-08-16 — שינוי שיטת עבודה: המשתמש שולח Screenshot, לא אני — Reconstruction פרטני לפי תמונה מעודכנת
**החלטה:** המשתמש חזר שוב עם אותה תמונת ייחוס (וגרסה שנייה, מעודכנת, שלה) וביקש "Visual Reconstruction", לא עוד "עיצוב בהשראת". במקביל דרש Definition of Done שכולל Screenshot והשוואה ויזואלית בפועל — דבר שאין לי יכולת לבצע (**אין כלי דפדפן/צילום מסך בסביבה הזו**, נבדק ותועד כבר מספר פעמים בשיחה הזו). **הוחלט במפורש מול המשתמש**: מכאן והלאה, *הוא* יצלם את `localhost:3101/dashboard` בעצמו וישלח לי את התמונה בצ'אט (כמו שהוא כבר שולח את תמונת הייחוס) — כך שאני יכול לבצע השוואה אמיתית מהתמונה שהוא שולח, במקום לנחש בעיוורון סבב נוסף. זה משנה את מחזור העבודה: כל סבב מעכשיו מבוסס על תמונה אמיתית של המצב הנוכחי, לא רק על ניתוח קוד/HTTP.
**שיפורים קונקרטיים לפי הגרסה השנייה של תמונת הייחוס (כוללת פרטים שלא היו בגרסה הראשונה):**
- **Progress Ring** (`components/ui/ProgressRing.tsx`, חדש) — טבעת SVG קטנה בכרטיס "הוצאות הטיול" מציגה % **אמיתי** (הוצאות ביחס ל-`Wallet.initialAmount`, לא "% מתקציב" מומצא — אין שדה תקציב על Trip).
- **Demo Markers על המפה** — 5 badge-ים דקורטיביים (גרדיאנט+אייקון, אותה שפה עיצובית כמו ה-Markers האמיתיים ב-`marker-style.ts`) במיקומים קבועים מראש על גבי תמונת ה-Demo — **לא קואורדינטות אמיתיות**, מוצג רק בתוך האזור שכבר מתויג "Demo — לא מחובר".
- **בלוק Profile ב-Sidebar** — Avatar+אימייל המשתמש + מתג "מצב כהה" (בינארי, אמיתי — קורא/כותב ל-ThemeProvider) + קישור הגדרות, מחליף קישור הגדרות בודד.
- **Quick Actions עודכן ל-5 פריטים** (הוצאה/הזמנה/מקום/**סרוק קבלה**/**נווט**) — "סרוק קבלה" מקשר לעמוד המסמכים האמיתי של הטיול (אין OCR עדיין, לא הובטח), "נווט" מקשר ל-Google Maps האמיתי של המקום ששימש כבר למזג האוויר (`buildNavigateLinks`, לא Placeholder).
- **חיפוש: קיצור מקלדת ⌘K/Ctrl+K אמיתי** — לא רק תג ויזואלי; `SearchBar` הפך ל-Client Component קטן עם listener אמיתי שממקד את שדה החיפוש.
- **"+ הוסף פעילות"** בתחתית Today's Plan — מקשר לעמוד התכנון האמיתי של הטיול.
**באג build אמיתי שנתפס ותוקן:** ייבוא `CATEGORY_GRADIENTS` מ-`marker-style.ts` (בתוך `map-widget-card.tsx`, Server Component) שבר את ה-build — `marker-style.ts` מייבא `react-dom/server` (עבור בניית Marker DOM אמיתי במפה), וזה לא ניתן ל-bundle לצד ה-client כש-`marker-style.ts` גם מגיע דרך שרשרת client (`mapbox-provider.ts`). תוקן ע"י חילוץ `CATEGORY_GRADIENTS` למודול נפרד וללא-תלויות (`lib/map/category-colors.ts`) שבטוח לייבוא גם משרת וגם מ-client. **תפס רק ב-build, לא ב-typecheck/lint** — סיבה נוספת למה `npm run build` חובה בכל סבב, לא רק typecheck.
**משפיע על:** apps/web/components/ui/{ProgressRing,StatCard,Sidebar,AppShell,QuickAction,SearchBar}.tsx, apps/web/app/(app)/dashboard/{map-widget-card,quick-actions-row,today-timeline-card,page}.tsx, apps/web/lib/map/category-colors.ts (חדש), apps/web/lib/map/marker-style.ts, apps/web/components/nav-icons.ts, apps/web/app/(app)/layout.tsx.
**סטטוס:** סופי לסבב הזה; ממתין לצילום מסך מהמשתמש כדי לבצע השוואה אמיתית.

### 2026-08-16 — CurrencyRateProvider: שער יציג חי (בנק ישראל + Frankfurter), וגילוי שמסך ה-Finances לא היה חסר בכלל
**החלטה:** המשתמש ביקש לדעת בכל רגע כמה יש לו מכל מטבע בארנק רב-מטבעי (למשל €/$/₪/฿ בו-זמנית), שהמרה בין מטבעות (למשל $100→3200฿) תזיז כסף מקושר בין הארנקים, ושיוצג שער יציג חי לכל מטבע מול מה שיש בארנק — כולל נראות לתשלומים בכרטיס אשראי.
**גילוי משמעותי לפני הקוד:** בדיקה של סוכן חקירה קודמת טענה בטעות ש"אין page.tsx בתיקיית finances/ אז המסך לא נגיש בפועל" — זו הייתה מסקנה שגויה: `apps/web/app/(app)/trips/[tripId]/page.tsx` (26KB, עמוד טיול יחיד) כבר מרכיב את **כל** רכיבי ה-finances (Wallet/Expense/Payment/CurrencyExchange/Refund/Deposit forms + רשימות + `WalletTransaction` history) inline בסקשן "כספים" הקיים, לגמרי מתפקד — בדיוק כמו ש-`bookings/` ו-`documents/` מורכבים inline באותו עמוד ולא כ-routes עצמאיים. **לכן לא נבנה page.tsx נפרד** (זה היה יוצר route כפול/מיותם, מנותק מזרימת הנתונים האמיתית) — התוכנית המקורית תוקנה תוך כדי יישום לשיפור ה-section הקיים במקום.
**מה כן היה חסר בפועל וטופל:**
1. **`CurrencyRateProvider`** (`packages/shared-types/src/currency-rate.ts` + `packages/data-layer/src/currency-rate/boi-frankfurter-provider.ts`) — מקור ראשי: API הציבורי החינמי-בלי-מפתח של בנק ישראל (`boi.org.il/PublicApi/GetExchangeRates`, "שער יציג" רשמי, מנורמל לפי `unit`) — מכסה כ-14 מטבעות (USD/EUR/GBP/CHF ועוד) **אך לא THB**. עבור כל מטבע שבנק ישראל לא מפרסם, Fallback ל-Frankfurter (`api.frankfurter.dev`, מבוסס ECB, גם חינמי-בלי-מפתח, מכסה THB). מטבע שנכשל בשני המקורות פשוט לא מופיע בתוצאה — **לעולם לא שער מומצא/0**, אותו עיקרון בדיוק כמו WeatherProvider/RoutingProvider. תמיד "אמיתי" (`getCurrencyRateProvider()`, לא תלוי ב-DATA_SOURCE), כמו Weather/Routing.
   **שני באגים אמיתיים נתפסו בבדיקה חיה מול ה-APIs עצמם (לא בקוד שנוחש מראש):** (א) תגובת בנק ישראל בפועל עטופה ב-`{"exchangeRates": [...]}` עם שדות **lowercase** (`key`/`currentExchangeRate`/`unit`/`lastUpdate`) — לא מערך שטוח עם שדות PascalCase כפי שהונח בהתחלה מתוך תיעוד משני. (ב) הנתיב הנכון ל-Frankfurter הוא **`/v1/latest`**, לא `/v2/latest` (`/v2/` קיים רק ל-`/currencies`) — `/v2/latest` מחזיר 404 עקבי. שני התיקונים אומתו ב-`curl` ישיר מול שני ה-APIs וב-`grep` מול תוצג ה-render החי (`שער יציג: 1 THB = \u200F0.09 \u200F₪ · מקור: ECB (Frankfurter)` הופיע נכון בעמוד הטיול האמיתי אחרי התיקון). תזכורת לעצמי: תיעוד/מחקר משני על API חיצוני חייב אימות `curl` ישיר לפני שנחשב אמין, לא רק ל"האם ה-API קיים" אלא גם ל"האם הצורה בפועל תואמת."
2. **הרחבת `FinanceRepository`**: `listPaymentsByTrip({ tripId })` (Mock+Prisma) — עד כה `listPayments` היה זמין רק לפי `expenseId` בודד, ולא הייתה דרך לרכז את כל תשלומי כרטיס האשראי של טיול שלם. **מגבלה מתועדת:** מכסה רק תשלומים המקושרים ל-Expense; תשלום שמקושר ישירות ל-Booking בלי Expense לא נכלל (Payment לא מחזיק tripId ישירות, ואין עדיין join ל-Booking בממשק הזה).
3. **תצוגה משופרת בסקשן "כספים" הקיים**: לכל כרטיס ארנק נוסף שער יציג חי + שווי מוערך בש"ח (`יתרה × שער`) + תג מקור ("בנק ישראל"/"ECB") ותאריך עדכון, או "אין שער זמין" כשלא נפתר. נוסף `credit-card-summary.tsx` (חדש) בקבוצת "תשלומים" — סיכום תשלומי כרטיס אשראי מקובץ לפי כרטיס+מטבע.
4. **תוקנו 5 קישורים מתים** ל-`/trips/[tripId]/finances` (route שמעולם לא היה קיים — התגלה תוך כדי) ב-`quick-add-fab.tsx`, `quick-actions-row.tsx`, ו-3 כרטיסי דשבורד (`wallet-summary-card`, `expenses-summary-card`, `expenses-overview-card`) — הוחלפו ל-`/trips/[tripId]#finances` (נוסף `id="finances"` לסקשן בעמוד הטיול). **לא תוקן (מחוץ להיקף הסבב הזה, אך תועד):** אותה מחלקת באג בדיוק קיימת גם ב-`/trips/[tripId]/bookings` ו-`/trips/[tripId]/documents` (גם הן מורכבות inline, לא routes עצמאיים) — קישורים ל-hrefs האלה ב-`quick-add-fab.tsx`/`quick-actions-row.tsx` עדיין מובילים ל-404.
**משפיע על:** packages/shared-types/src/currency-rate.ts (חדש), packages/data-layer/src/currency-rate/boi-frankfurter-provider.ts(+test, חדש), packages/data-layer/src/index.ts, packages/data-layer/src/repositories/finance-repository.{ts,mock,prisma,mock.test}.ts, apps/web/lib/currency-format.ts (חדש), apps/web/app/(app)/trips/[tripId]/finances/credit-card-summary.tsx (חדש), apps/web/app/(app)/trips/[tripId]/page.tsx, apps/web/components/quick-add-fab.tsx, apps/web/app/(app)/dashboard/{quick-actions-row,wallet-summary-card,expenses-summary-card,expenses-overview-card}.tsx.
**סטטוס:** סופי לגבי הבנייה עצמה; קישורי bookings/documents המתים נשארים כפריט פתוח מתועד, לא טופלו.

---

### 2026-08-16 — Audit מלא מול מסמך דרישות מאוחד (156 סעיפים) — 4 סוכני חקירה מקבילים
**החלטה:** המשתמש סיפק מסמך דרישות מאוחד ומפורט (156 סעיפים, מוצהר כ"מקור האמת המרכזי") וביקש Audit מלא — ללא בנייה — מול הקוד בפועל, עם דרישה מפורשת: "אם קיים רק UI/Type/Schema/Mock/Route ריק, אל תסמן אותו כ-Implemented." בוצע Audit בפועל (לא רק תמלול PROJECT_REQUIREMENTS.md הקיים): קריאה ישירה של page.tsx/actions.ts/repository/schema בפועל, `curl` חי מול 13 routes מרכזיים, הרצת typecheck/lint/test/build. עבור אזורים לא-ודאיים (Export/Print/Share, Packing/Checklist/Emergency/Memories, Global Search, Massage/Fruit-ייעודי, Budget, Calendar/Timers/Alerts, Localization/Units/Accessibility) הופעלו **4 סוכני Explore מקבילים (read-only)**, כל אחד עם קטע רלוונטי מהמסמך המקורי + הנחיה מפורשת "אל תסמן Implemented בלי הוכחה אמיתית בקוד."
**תוצר:** `FEATURE_AUDIT.md` (חדש, ~150 שורות דרישה בודדת עם סטטוס/קבצים/עדות/חסר/Priority) ו-`IMPLEMENTATION_GAPS.md` (חדש, רשימה מתועדפת P0-P3). `PROJECT_REQUIREMENTS.md` קיבל סעיף 40 חדש עם קישור לשני הקבצים ורשימת הדרישות שהתגלו כלא-מתועדות בכלל קודם.
**ממצא מרכזי:** הליבה התפקודית (Trip→Days→Bookings→Wallet-רב-מטבעי→Expenses→Weather→Gap-Detection) עובדת קצה-לקצה ונבדקה חי. שלוש קטגוריות שלמות כמעט ולא קיימות: **Export/Print/Share/Backup** (0%, אומת ע"י סוכן חקירה — 0 ספריות PDF/Excel/CSV/ZIP בכל package.json), **Calendar+Timers-מאוחדים+Alerts-מלאים** (מפוזר Ad-Hoc, 8/15 סוגי Alert לא קיימים כלל), **Localization+Units+Preferences-מלאות+Accessibility** (רק Theme קיים מתוך כל האשכול, 0 ספריית i18n).
**ממצא משני חשוב (באג אמיתי, לא רק "לא נבנה"):** לקטגוריית Fruit ב-Expense, שדות `itemName`/`quantity` **קיימים בסכימה** אבל מוצגים ב-UI רק כש-`category==="shopping"` — כלומר שם הפרי וכמות לא ניתנים להזנה בפועל למרות שהתשתית מוכנה. תוקן רק בתיעוד (IMPLEMENTATION_GAPS.md #27), לא בקוד — ממתין לאישור.
**למה 4 סוכנים ולא בדיקה ידנית מלאה שלי:** ~150 דרישות פרטניות מול קוד אמיתי הוא היקף גדול מדי לבדיקה ידנית יעילה בזמן סביר; במקביל, כ-40% מהדרישות (הליבה: Trip/Bookings/Wallet/Weather/Map/Design-System/Dashboard) כבר היו מתועדות ברמת דיוק גבוהה ב-PROJECT_REQUIREMENTS.md/PROJECT_STATE.md הקיימים (כולל "נבדק חי" מפורש לאורך הפרויקט) — אלו הועתקו/עובדו ישירות בלי להטריח סוכן, וה-4 סוכנים יועדו רק לאזורים שהיו לא-ודאיים או חדשים לגמרי במסמך.
**סטטוס:** דיווח בלבד הושלם. **לא בוצעה שום בנייה** — לפי בקשת המשתמש המפורשת "עדיין אל תתחיל לבנות את כל החוסרים", ה-Session נעצר אחרי מסירת ה-Audit וממתין להנחיה לגבי אשכול הפערים הבא.

### 2026-08-16 — Audit סבב 2: רשימת בדיקה מפורשת של המשתמש (114 פריטים) + בירור "Remote Control initialization failed"
**החלטה:** אחרי הסבב הראשון (ראה הרשומה הקודמת), המשתמש ביקש דיוק גבוה יותר — לא מסמך 156 הסעיפים המקורי, אלא רשימת בדיקה מפורשת בת 114 פריטים שהוא ניסח בעצמו, עם דרישה למספרים מדויקים (לא הערכות) ולפירוט "מה בדיוק חסר" לכל P0. `FEATURE_AUDIT.md`+`IMPLEMENTATION_GAPS.md` **נכתבו מחדש במלואם** (לא Edit חלקי) כדי להתאים 1:1 למבנה/סדר של הרשימה שהמשתמש נתן — כולל פיצול שורות שהיו מאוחדות בסבב הראשון (Taxi מ-Transport, Vehicle Types מ-Rentals, Credit Cards כשורה עצמאית, Trash/Restore/Undo כ-3 שורות נפרדות).
**בדיקות נוספות שבוצעו רק בסבב הזה** (לא היו בסבב 1): `grep` מלא ל-Trash/Restore/Undo (נמצא: Restore קיים **רק ל-Trip**, לא לשאר 7 הישויות עם Soft Delete; Trash/Undo לא קיימים בכלל), אימות `TransportMode` (7 ערכים כולל taxi, כולם נתמכים בטופס) ו-`VehicleType` (כל 9 הערכים נתמכים), אימות `PaymentCard` (CRUD מלא + סיכום כרטיסי אשראי מהסבב הקודם).
**"Remote Control initialization failed":** המשתמש שאל אם זו תקלה בקוד האפליקציה. בדקתי — `grep -rli "remote.control"` על כל `apps/web`+`packages/*` החזיר **0 תוצאות**. זו לא תקלה בקוד הטיולים. הערכתי (לא יכולתי לאמת ישירות, כי אין לי גישה לשכבת ה-Tooling של Claude Code עצמה): כנראה קשור ליכולת שליטת-דפדפן-מרחוק של הכלי שכבר תועדה בשיחה כבלתי-זמינה בסביבה הזו. **הוכחה אמפירית שזה לא חוסם עבודה מקומית:** קריאה/כתיבה/עריכה של קבצים, `git commit`, `npm run typecheck/lint/test/build`, ו-`curl` מול שרת ה-dev — כולם עבדו נורמלית לאורך כל הסבב הזה בלי שום הפרעה.
**משפיע על:** `FEATURE_AUDIT.md` (נכתב מחדש), `IMPLEMENTATION_GAPS.md` (נכתב מחדש, עם סעיף "מה בדיוק חסר" לכל P0 שאינו IMPLEMENTED), `PROJECT_STATE.md`, `PROJECT_REQUIREMENTS.md` (סעיף 40 — הערת עדכון).
**סטטוס:** דיווח בלבד הושלם. שום שורת קוד לא שונתה. ממתין לאישור המשתמש לפני תחילת בנייה.

### 2026-08-17 — אימוץ "איפיון אפליקציה.docx" כמקור-אמת לתהליך העבודה, סדר שלבים A–F
**החלטה:** המשתמש סיפק מסמך Word מאוחד (`איפיון אפליקציה.docx`) שמגדיר גם את כל 114 הדרישות וגם תהליך עבודה מחייב עם 6 שלבים: A=השלמה פנימית, B=Audit חוזר, C=שילוב עיצוב, D=עיצוב על כל המסכים, E=חיבורים חיצוניים, F=בדיקות סופיות. אומץ במלואו כמסגרת העבודה מכאן והלאה, במקום למידת-רשימה אד-הוק.
**למה:** בקשה מפורשת ("תעקוב אחרי האפיון"). המסמך גם ביקש בעצמו בדיוק את שני השלבים שהמשתמש ציין בנפרד (עיצוב + חיבורים) — אין סתירה, רק אימוץ ישיר.
**משפיע על:** `NEXT_STEPS.md` (מבנה מחדש סביב A-F), `FEATURE_AUDIT.md`/`PROJECT_STATE.md` (התייחסות לשלב A/B).
**סטטוס:** סופי, קבוע לכל המשך הפרויקט (עד שהמשתמש יחליט אחרת).

### 2026-08-17 — מפת דרכים כ-Artifact מפורסם, מתעדכן באותו לינק
**החלטה:** לבקשת המשתמש ("לינק שהוא מפת הפרויקט — אבני דרך"), נוצר דף HTML מפורסם (Claude Artifact) שמציג את 6 שלבי A-F, מה בעבודה עכשיו, ומה נבנה/נשאר בכל שלב. מתעדכן **באותו URL** (לא לינק חדש) עם כל התקדמות משמעותית.
**למה:** בקשה מפורשת לכלי מעקב חזותי, נפרד מקבצי ה-Markdown הטכניים.
**מגבלה:** URL של Artifact הוא per-conversation — לא נשמר בקובצי הפרויקט (רק המשתמש רואה אותו בשיחה). אם המשתמש מבקש לעדכן אותו ב-Session עתידי, יש לבקש ממנו את הלינק (או להשתמש ב-`action: "list"` של כלי ה-Artifact כדי לאתר אותו).
**משפיע על:** תהליך התקשורת עם המשתמש, לא על קוד האפליקציה.
**סטטוס:** סופי, ימשיך להתעדכן לכל אורך שלבי A-F.

### 2026-08-17 — Supabase חובר חלקית *לפני* סיום שלב A, לבקשת המשתמש; RLS נשאר ממתין בכוונה
**החלטה:** המשתמש ביקש לחבר Supabase (חלק משלב E) לפני שסיימנו שלב A/B. סופקו Project URL+Publishable Key+Secret Key+סיסמת DB (בצ'אט). אומתו מול API חי, `prisma migrate dev --name init` רץ בהצלחה מול DB אמיתי — 38 טבלאות נוצרו בפועל, אומת גם בשאילתת REST ישירה. כשהמשתמש ביקש לעצור ("בשלב הזה אנחנו נעצור עם החיבורים") — **הופסקה העבודה מיד**, כולל מיגרציית RLS שכבר הייתה בהכנה (`prisma migrate dev --create-only --name enable_rls` רץ, תוכן `rls_policies.sql` הועתק ל-migration.sql, אך **לא הורץ** מול ה-DB). `DATA_SOURCE` נשאר `mock` — האפליקציה לא נוגעת ב-DB החי בפועל.
**גילוי טכני חשוב:** אחרי שמיגרציית ה-RLS (שמפנה ל-`auth.users`, סכימה שקיימת רק ב-Supabase) נכנסה להיסטוריית המיגרציות הממתינות, **`prisma migrate dev` מפסיק לעבוד לגמרי** מול ה-DB הזה — הוא תמיד מריץ Shadow Database (Postgres זמני ריק) לאימות, ושם `auth` לא קיים → `P3006`. הפתרון: להשתמש אך ורק ב-`prisma migrate deploy` מעכשיו והלאה מול ה-DB האמיתי הזה (לא יוצר/לא צריך Shadow DB). מיגרציה נוספת שנוצרה אחרי הגילוי הזה (`trip_medical_notes_and_passport_document_type`) **נוצרה ידנית** (תיקיה+migration.sql בכתב-יד, לפי הפורמט המדויק שראיתי ב-migration הקודם) ו**לא הורצה** בכוונה — כדי לא "לעקוף" את הבקשה לעצור, למרות שטכנית `db execute` היה יכול להריץ רק אותה בלי לגעת ב-RLS.
**למה לא סתם להריץ הכול עכשיו:** כיבוד מפורש של "בשלב הזה אנחנו נעצור" — גם אם טכנית אפשרי ובטוח (DB ריק, אין סיכון לנתונים).
**משפיע על:** `packages/db/prisma/migrations/*` (2 מיגרציות ממתינות), `PROJECT_STATE.md` ("מצב Supabase"/"מצב Database"), `NEXT_STEPS.md`.
**סטטוס:** זמני — ימשיך כשהמשתמש יבקש להמשיך בשלב E. הוראת ההפעלה המדויקת (`migrate deploy`, לא `migrate dev`) מתועדת ב-NEXT_STEPS.md כדי לא ליפול על אותה מלכודת שוב.

### 2026-08-17 — LiveTimer ו-BlockedIntegrationState/PermissionDeniedState כרכיבים גנריים חדשים
**החלטה:** נבנו שני רכיבי client לשימוש חוזר שהיו חסרים: `components/live-timer.tsx` (טיימר חי — countdown לאירוע, מתעדכן כל 30 שניות, `now` מתחיל `null` וממולא רק ב-`useEffect` אחרי mount כדי למנוע Hydration Mismatch מול זמן השרת) ו-`components/blocked-state.tsx` (`BlockedIntegrationState` לשירות חיצוני לא-מחובר, `PermissionDeniedState` להרשאת דפדפן שנדחתה).
**למה:** #60 (Timers) ו-#114 (Error States) דרשו בדיוק את זה — "רכיב גנרי לשימוש חוזר", לא עוד מופע אד-הוק. נבנו פעם אחת, הוחלו במספר מקומות מיד (טיסות/מעבורות/צ'ק-אין-אאוט/רכב-שכור/פעילות-מתוכננת עבור הראשון; Mapbox panel+4 מצבי Geolocation עבור השני) כדי להוכיח שהם באמת שימושיים, לא רק "type קיים בלי usage".
**הערה טכנית:** ניסיון ראשון להשתמש ב-`onFocus`/`onBlur` ל-Skip Link נכשל כי `AppShell.tsx` הוא Server Component (אי אפשר event handlers על DOM element בתוכו) — תוקן לפתרון CSS-only (`.skip-link:focus` ב-globals.css) שלא דורש JS בכלל.
**משפיע על:** `apps/web/components/{live-timer,blocked-state}.tsx` (חדשים), משולבים ב-9 קבצים לפחות.
**סטטוס:** סופי. הרחבה עתידית (עוד סוגי timer/blocked-state) תשתמש באותם רכיבים, לא תמציא חדשים.

### 2026-08-17 — TransportQuote.transportBookingId ו-(לשעבר) Place.dontReturn: פערי-גיבוי שהתבררו כפערי-אפליקציה-חיה
**החלטה:** בבדיקת מגבלות `restore-backup.ts` (#90) התברר ששתי המגבלות המתועדות לא היו רק "אין Setter בשכבת ה-Repository לצורך שחזור" — הן שיקפו שדות שאין להם **שום דרך להיקבע גם באפליקציה החיה עצמה**. `Place.dontReturn` תוקן (נוסף `toggleDontReturn`+UI ב-#90 שלב A). `TransportQuote.transportBookingId` **נשאר לא-תוקן במכוון** — לתקן אותו באמת דורש לבנות פיצ'ר חדש (קישור הצעת-מחיר-שנבחרה להזמנה קונקרטית), לא רק setter טכני, וזה מחוץ להיקף "תיקון גיבוי".
**למה:** ההבחנה חשובה להמשך: כשמגבלת Backup נראית "טכנית וקטנה", כדאי לבדוק קודם אם היא בעצם מסתירה פער-פיצ'ר גדול יותר לפני שמתקנים רק את שכבת ה-Repository.
**משפיע על:** `apps/web/lib/backup/restore-backup.ts` (תיעוד מעודכן), `packages/data-layer/src/repositories/place-repository.*`.
**סטטוס:** **בוטל חלקית ב-2026-08-18** — ר' "סבב תיקון 36 ה-PARTIAL" למטה. המשתמש ביקש לתקן את כל ה-PARTIAL כולל זה; הפיצ'ר נבנה בפועל (UI מינימלי אבל אמיתי: "הזמן לפי הצעה זו"), לא רק ה-setter הטכני.

### 2026-08-17 — RLS הופעל בפועל; נמצא ותוקן באג אמיתי (snake_case מול camelCase); auth.users→public.users לא Cascade
**החלטה:** בהמשך שלב E, הורצה `prisma migrate deploy` להפעלת RLS. הניסיון הראשון **נכשל** (P3018/42703: `column "user_id" does not exist`) — `rls_policies.sql` נכתב בשלב התכנון המוקדם (לפני שהיה DB חי) בהנחה שגויה ששמות העמודות הם snake_case (`user_id`, `trip_id` וכו'). בפועל `schema.prisma` לא מגדיר `@map` ברמת שדה בשום מקום, אז Prisma יוצר את כל העמודות בדיוק בשם ה-camelCase שבסכימה (`userId`, `tripId` וכו', מצוטט). **זה לא נתפס קודם כי זו הפעם הראשונה שהמיגרציה רצה בכלל מול DB אמיתי.** הקובץ נכתב מחדש במלואו עם כל הפניה לעמודה מתוקנת ל-camelCase מצוטט; אומת ש-Transaction ה-Postgres התגלגל אחורה נקי (`is_trip_owner` RPC החזיר 404 לפני התיקון), כך שלא נדרש ניקוי נתונים — רק `prisma migrate resolve --rolled-back` ואז `migrate deploy` מחדש.
**אימות אמיתי בפועל (לא רק "המיגרציה רצה בלי שגיאה"):** (1) ניסיון INSERT אנונימי (Publishable Key, בלי session) לשלוש טבלאות בדפוסי-policy שונים (trips — ישיר, hotel_stays — דרך is_booking_owner, places — userId ישיר) — כל השלושה נדחו נכון עם `42501 row-level security policy`. (2) הרשמה אמיתית דרך `/auth/v1/signup` (אותו endpoint בדיוק ש-`/register` קורא לו) — נבדק שה-Trigger `handle_new_auth_user` יצר שורת `public.users` נכונה (id תואם ל-auth.uid, email, locale="he", legalConsentAcceptedAt מפוענח נכון מה-metadata). (3) ניסיון Login לפני אישור אימייל נדחה כראוי (`email_not_confirmed`) — מאשר שהגדרת "אישור אימייל חובה" של הפרויקט פעילה כברירת מחדל תקינה. משתמש הבדיקה נמחק בסוף (Admin API + מחיקה ידנית של שורת `public.users`, ר' הבאג הבא).
**באג נוסף שהתגלה (לא תוקן, מתועד לטיפול עתידי):** מחיקת משתמש מ-`auth.users` (Admin API) **לא** מוחקת אוטומטית את שורת `public.users` המתאימה — אין Trigger/Cascade לכיוון ההוא, רק ל-INSERT. זה השאיר שורת `public.users` יתומה אחרי מחיקת משתמש-הבדיקה, שהצריכה ניקוי ידני נפרד. לא דחוף לתקן כרגע (מחיקת משתמשים היא לא פיצ'ר בנוי באפליקציה עדיין), אבל צריך לזכור את זה אם/כשיתווסף "מחק את החשבון שלי".
**למה זה חשוב לתעד:** תזכורת כללית — קובץ SQL/מיגרציה שנכתב "נכון על הנייר" לפני שיש DB אמיתי לבדוק מולו הוא בגדר ניחוש עד שהוא באמת רץ. "כתוב ומוכן, לא נבדק live" (איך ש-`rls_policies.sql` תואר במשך ימים) לא שווה לאותה רמת ביטחון כמו קוד שנבדק — התברר כאן במלואו.
**משפיע על:** `packages/db/prisma/rls_policies.sql`, `packages/db/prisma/migrations/20260817102045_enable_rls/migration.sql`, DB חי ב-Supabase (RLS פעיל בפועל על כל הטבלאות מעכשיו).
**סטטוס:** סופי — RLS פעיל ומאומת. הבאג ב-auth.users→public.users cascade נשאר פתוח, לא חוסם.

### 2026-08-18 — סבב תיקון 36 ה-PARTIAL: מתודולוגיית סיווג + פיצ'ר TransportQuote↔Booking + גילוי דפוס-באג חוזר
**החלטה:** המשתמש ביקש במפורש לתקן את כל 36 הפריטים ש-FEATURE_AUDIT.md סימן PARTIAL כך שיעבדו במלואם ("אתה תתקן שגם הן יעבדו באופן מלא ותקין"), לא רק להשאיר אותם מתועדים. במקום לנחש, כל 36 עברו סיווג ראשוני לשלוש קבוצות: (1) פער אמיתי-ניתן-לבנייה-בלי-שירות-חיצוני — תוקן בפועל; (2) החלטת-עיצוב-מכוונת-מתועדת (PDF/Excel/Tourist-Tax-כ-Expense/Audit-Log-scope/וכו') — הושאר כפי שהוא, לא "תוקן" מלאכותית רק כדי לשנות סטטוס; (3) חסימת שירות-חיצוני-בפועל (Storage/Mapbox/DATA_SOURCE) — הושאר, מתועד למה. 6 פריטים עברו ל-IMPLEMENTED, פיצ'ר אמיתי אחד נבנה (לא רק חשיפת שדה — ר' למטה), ועוד 4 שופרו מהותית.
**גילוי מרכזי — דפדוק שיטתי חשף דפוס-באג חוזר:** בדיקה ממוקדת של כל create-input-schema מול ה-read-schema המקביל שלו (HotelStay/TransportBooking/CarRental) מצאה 3 מופעים נוספים של אותו דפוס שכבר נמצא בשלב A עם `Flight.legType` — שדה שקיים ב-`schema.prisma`, מתקבל ב-create-input, ואף נשלח בפועל ל-Prisma `create()`, אבל לא נחשף באף שכבת קריאה (read schema/Mock/טופס/תצוגה). המופעים: `HotelStay.breakfastPrice/breakfastPriceUnit/bedType/guestsCount/smoking`, `TransportBooking.vehicleType/agreedPrice/agreedCurrencyCode/email/website`, ו-`CarRental` שהיה חסר **את כל בלוק יצירת-הקשר** (7 שדות) בכל השכבות כולל create-input עצמו. המסקנה: בכל פעם שמתגלה מופע אחד של הדפוס הזה, שווה לבדוק את שאר הישויות הדומות באותו קובץ באופן שיטתי — לא להניח שזה מקרה בודד.
**פיצ'ר אמיתי, לא רק חשיפת שדה — TransportQuote↔TransportBooking:** ר' ההחלטה למעלה (2026-08-17, "TransportQuote.transportBookingId"). נוסף `linkTransportQuoteToBooking()` ל-Repository, ו-UI: קישור "הזמן לפי הצעה זו" ליד כל הצעה לא-מקושרת, מעביר `?fromQuote=<id>` ל-query params של עמוד הטיול, שממלא מראש את טופס יצירת ההסעה (ספק/מחיר/מטבע/סוג-רכב) ומקשר את ההצעה להזמנה שנוצרת ב-action.
**מה נבדק ולא שונה (ולמה זה בסדר):** #61 Alerts — לא אותרה מערכת "15-אלרטים" נפרדת מהמתועד, לא הומצא "תיקון". #100 Notification Preferences — נבדק שכל 7 הסוגים הלא-מחוברים באמת לא ניתנים לחיווט בלי להמציא נתון (need_to_leave_for_airport תלוי ב-state זמני בצד לקוח שלא נשמר בשום Repository; insurance_ending יש לו רק תאריך בלי שעה) או בלי לבנות שדה-קלט חדש (מחוץ להיקף "תיקון PARTIAL קיים"). #24 Rentals — התברר שחוזה השכרה כבר ניתן להעלאה כמסמך (`documentType="contract"`, `EntityDocumentSection` על CarRental מאז שלב A) — הניסוח הקודם היה לא מדויק, לא קוד חסר.
**למה זה חשוב לתעד:** "לתקן PARTIAL" לא אומר "לשנות סטטוס בכל מחיר" — חלק מהעבודה האמיתית הייתה **לוודא** שהניסוח מדויק (ולתקן ניסוח, לא קוד, כש-#24 התברר כבר-עובד) ו**לאמת** שאין עוד מה לתקן בלי להמציא נתון (#100/#61), לא רק לצבוע דגלים ירוקים.
**משפיע על:** `packages/shared-types/src/booking.ts`, `packages/data-layer/src/repositories/{booking,document,contact}-repository.{ts,mock.ts,prisma.ts}`, `packages/db/prisma/schema.prisma`+migration חדש (`TransportBooking.seat`), טפסי/action/תצוגת ההזמנות ב-`apps/web/app/(app)/trips/[tripId]/`, `/trash`, `apps/web/lib/backup/restore-backup.ts`.
**סטטוס:** סופי. 74/114 IMPLEMENTED, 30/114 PARTIAL (מוצדקות — ר' FEATURE_AUDIT.md), 6/114 NOT IMPLEMENTED, 4/114 BLOCKED. typecheck+lint+test(322)+build ירוקים אחרי כל סבב.

### 2026-08-21 — TripDay נחשף כישות אמיתית (הערות-יום) — #4 הושלם לבקשת המשתמש
**החלטה:** המשתמש ציין ש"ימי טיול" (#4 באודיט) עדיין חלקי וביקש להשלים. הפער היה "אין ישות TripDay שמורה עצמאית". בבדיקה התברר ש-`TripDay` כן קיים ב-`schema.prisma` (ר' ההחלטה מ-2026-08-15 למעלה) — היא רק שימשה כטבלת-קישור פנימית שקופה בשביל `Route`, מסומנת שם במפורש כ"זמני, ישוקל מחדש". נבנה `TripDayRepository` חדש (getOrCreate/updateNotes/listForTrip, Mock+Prisma, אותו דפוס get-or-create בדיוק כמו RouteRepository) וסקשן "הערות ליום" ב-`days/[date]` — טקסט חופשי שמור אמיתית, לא רק תצוגה מחושבת-חי. נוסף גם לגיבוי/שחזור (#90).
**למה לא בנוי כטבלת מטא-דאטה עשירה יותר (כותרת/תמה/תמונות/תקציב-פר-יום):** המשתמש ביקש להשלים את "ימי טיול" הספציפי, לא ביקש פיצ'רים נוספים. הערות-יום הן ה-gap שהאודיט תיאר במפורש ("אין ישות שמורה"); שאר סיכום היום (לילה/טיסות/הוצאות/תכנון) כבר מחושב חי ועובד נכון — אין טעם לשכפל אותו לתוך TripDay רק כי אפשר.
**משפיע על:** `packages/shared-types/src/trip-day.ts` (חדש), `packages/data-layer/src/repositories/trip-day-repository.*` (חדש), `apps/web/app/(app)/trips/[tripId]/days/[date]/page.tsx`, `apps/web/lib/backup/{export,restore}-backup.ts`.
**סטטוס:** סופי.

### 2026-08-21 (סבב 9) — EntityPhotoGallery: "תלוי Storage" היה תיוג שגוי חוזר על עצמו
**החלטה:** המשתמש נתן רשימה מפורשת של 11 פריטים להשלים. שניים מהם (#15 Hotels, #24 Rentals) היו מתויגים PARTIAL בגלל "תמונות תלוי Storage אמיתי" — אבל `TripMemoriesGallery` (שכבר קיימת ועובדת) מוכיחה שזה לא נכון: תמונות כבר עובדות היום דרך Document עם `documentType="image"`, כש-`fileUrl` הוא `data:` URI אמיתי (base64, לא Placeholder) גם ב-Mock. נבנה `EntityPhotoGallery` — הכללה פרמטרית של אותו מנגנון (tripId/entityType/entityId) — וחובר ל-HotelStay ו-CarRental. אותו דבר בדיוק נעשה ל-#79 (End Trip Summary): סקשן "תמונות" חדש ב-report/page.tsx מציג את כל תמונות הטיול.
**למה זה קרה פעמיים (גם ב-#4 TripDay):** כשמישהו כותב "PARTIAL, תלוי X חיצוני" בלי לבדוק אם X כבר נפתר במקום אחר באפליקציה, התיוג נדבק ולא מתעדכן גם אחרי שהפתרון כבר קיים. הלקח הכללי: **לפני שמקבלים "תלוי שירות חיצוני" כעובדה, לבדוק אם יש כבר מנגנון עובד לאותו צורך במקום אחר באפליקציה** — לא להניח, לבדוק בקוד.
**גם בסבב הזה — שיפור מזג-אוויר אמיתי (#51/#52):** "יעד הבא" הורחב מ"מחר בדיוק" למלון-הקרוב-הבא-עם-קואורדינטות-שונות (get-or-find, לא get-or-create — פשוט חיפוש רחב יותר). `forecast_days` ב-Open-Meteo הועלה מ-7 ל-16 (המקסימום החינמי התיעודי של הספק) — לא "תיקון קוד" במובן הרגיל, אלא ניצול מלא של מה שה-API החינמי כבר נותן בלי תשלום/מפתח.
**מה לא תוקן ולמה זה נכון:** #43 OCR (0% קוד, צריך מפתח Claude API אמיתי), #61 Refund-Pending (Refund.refundAt הוא DateTime חובה — אין בכלל מושג "ממתין" במודל, דורש טבלה/שדה חדש), #71 Offline (קוד נבדק ותקין, המגבלה היא רק "לא אומת בדפדפן חי" — לא ניתנת לתיקון מהסביבה הזו).
**משפיע על:** `apps/web/app/(app)/trips/[tripId]/documents/entity-photo-gallery.tsx` (חדש), `apps/web/app/(app)/trips/[tripId]/page.tsx`, `apps/web/app/(app)/trips/[tripId]/report/page.tsx`, `apps/web/app/(app)/today/page.tsx`, `apps/web/app/(app)/now/page.tsx`, `packages/data-layer/src/weather/open-meteo-provider.ts`, `apps/web/lib/notification-event-type-labels.ts`.
**סטטוס:** סופי. 85/114 IMPLEMENTED, 19/114 PARTIAL (מוצדקות), 6/114 NOT IMPLEMENTED, 4/114 BLOCKED. typecheck+lint+test(322)+build ירוקים.

### 2026-08-21 (סבב 10) — Document.tripId הופך ל-nullable כדי לתמוך בתמונות-מקום
**החלטה:** #7 Places נשאר PARTIAL עם "תמונות תלוי Storage" — אותה סיבה כמו #15/#24 שכבר תוקנו עם `EntityPhotoGallery`. אבל Place הוא ישות **גלובלית** (לא שייכת לטיול ספציפי, ר' ההחלטה מ-2026-08-15), ואילו `Document.tripId` היה עמודת חובה. הפתרון היחיד שהוא לא "רמאות ארכיטקטונית" (לבחור טיול שרירותי כדי לספק FK) הוא לעשות את tripId `nullable` בפועל — null כש-`entityType="place"`.
**מה זה דרש בפועל:** schema.prisma+migration (`ALTER COLUMN DROP NOT NULL`), **ותיקון RLS** — `is_trip_owner(null)` הוא תמיד `false`, אז בלי `is_place_owner()` + OR מפורש במדיניות, כל תמונת-מקום הייתה נחסמת לגמרי ברגע שהאפליקציה תעבור ל-DATA_SOURCE=prisma (זה לא היה מתגלה עכשיו במצב Mock — רק בפרודקשן, במקום הכי גרוע לגלות דבר כזה). shared-types+DocumentRepository (Mock+Prisma)+listForEntity עם tripId אופציונלי. ואז server actions **חדשים** (לא שימוש חוזר ב-uploadDocumentAction) כי בדיקת-ההרשאה שונה מהותית: בעלות-על-מקום (`place.userId`) ולא בעלות-על-טיול (`assertTripOwnership`).
**⚠️ טרם הוחל על ה-DB החי:** `prisma migrate deploy` נכשל פעמיים עם P1001 — Supabase לא הגיב (כנראה נכנס למצב שינה בטייר החינמי). המיגרציות כתובות, בדוקות מבחינה לוגית, ומוכנות — פשוט ממתינות שה-DB יהיה זמין. ר' PROJECT_STATE.md "מצב Database" להוראה המפורשת: **אסור** לעבור ל-DATA_SOURCE=prisma לפני שה-deploy הזה רץ בהצלחה.
**הלקח הכללי (שלישית ברציפות):** "PARTIAL, תלוי X" נבדק תמיד קודם מול הקוד בפועל, לא מתקבל כעובדה — אבל הפעם התברר שגם "יש פתרון דומה במקום אחר" (הלקח מ-#15/#24) לא תמיד מספיק; לפעמים ההבדל הארכיטקטוני בין שני מקרים הוא בדיוק הסיבה שהתיוג נשאר PARTIAL, וצריך לפתור אותו נכון (migration+RLS), לא לעקוף.
**משפיע על:** `packages/db/prisma/schema.prisma`+2 migrations חדשים, `packages/db/prisma/rls_policies.sql`, `packages/shared-types/src/document.ts`, `packages/data-layer/src/repositories/document-repository.*`, `apps/web/app/(app)/places/{actions.ts,page.tsx,place-photo-gallery.tsx}`, `apps/web/lib/{global-search.ts,backup/export-backup.ts,backup/restore-backup.ts}`.
**סטטוס:** סופי בקוד. ממתין ל-`migrate deploy` נגד ה-DB החי (חסימת-זמינות זמנית, לא באג).

### 2026-08-21 (סבב 11) — כל 18 ה-PARTIAL הנותרים נבדקו; Refund-Pending נבנה, 2 באגים אמיתיים נמצאו ותוקנו
**החלטה:** המשתמש ביקש במפורש "את כל ה-18 הנותרים חלקי תשלים וותקן למצב מושלם". כל פריט נבדק מחדש מול קוד בפועל, לא התיוג הקודם בלבד:
1. **#61 Refund-Pending — נבנה במלואו** (היה מתועד כ"דורש שינוי ארכיטקטוני" ב-סבב 9). נוסף `Refund.isReceived: Boolean @default(true)` (ברירת מחדל שומרת תאימות-לאחור מלאה לכל שורה קיימת ולזרימת היצירה הקיימת). `createRefund` מזכה את הארנק רק כש-`isReceived!==false`; `markRefundReceived()` חדש מזכה בפועל כשההחזר מתקבל. תבנית זהה ל-Deposit (expectedReturnDate/isReturned/returnedAmount/returnedDate) אך בלי `receivedAmount` נפרד — נשמר מכוון-לצורך (לא reconciliation מלא) כדי לא להרחיב scope מעבר למה שהתבקש.
2. **#90 — נמצא ותוקן באג אמיתי, לא רק תיוג.** `car_rental` הוא `DocumentEntityType` תקף (תמונות/מסמכי השכרות-רכב מ-#24, שנבנו בסבב 9!) אבל `restore-backup.ts` מעולם לא בנה `carRentalIdMap` וגם לא מיפה `car_rental` ב-`idMapByEntityType` — כלומר כל מסמך/תמונה של השכרת-רכב היה תמיד מדולג בשקט בשחזור-מגיבוי, בלי שום שגיאה גלויה. תוקן.
3. **#95 Soft Delete — `Payment.deletedAt` נחשף.** השדה היה קיים בסכימת ה-DB **מאז ומתמיד** (ר' `schema.prisma` מקורי) אבל אף שכבה עליונה לא חשפה אותו — לא ב-`paymentSchema`, לא ב-`FinanceRepository`. זה בדיוק אותו דפוס כמו Flight.agreedPrice ו-Expense.timezone שנמצאו קודם: שדה-DB אמיתי, מוכן, פשוט לא מחווט. נחשף במלואו (softDeletePayment/restorePayment, כפתור מחיקה, שורה ב-/trash) — עם אותה מגבלה מתועדת כמו Expense (לא מבטל השפעה על ארנק אוטומטית, כי זה דורש "עיצוב נפרד" שלא נתבקש כאן).
4. **#82/#83 תויגו מחדש (לא קוד).** `PrintButton`+`@media print` ו-`buildCsv()`+`ExportCsvButton` שניהם מחווטים ועובדים מקצה-לקצה בפועל (נבדק ב-import chains, לא רק קיום הקובץ). התיוג הקודם ("החלטה מכוונת לא לבנות X") בלבל "לא ספרייה ייעודית" עם "לא פועל" — הפריטים כן פועלים במלואם.
5. **#114 שופר.** `PermissionDeniedState` (שכבר נבנה בסבב 8) הורחב ל-2 מסכים נוספים: `/now/notification-reminders.tsx` (טקסט אד-הוק→רכיב גנרי) ו-`/emergency/nearest-medical.tsx` — כאן היה גם תיקון UX אמיתי, לא רק קוסמטי: כש-Geolocation נדחה, הרשימה הייתה נעלמת בשקט בלי הסבר; עכשיו מוצג `PermissionDeniedState` **וגם** הרשימה (בלי מיון-לפי-מרחק) — כי זה מסך חירום (בתי חולים/מרקחות) וחסימת מידע קריטי מאחורי הרשאת מיקום הייתה רגרסיית-בטיחות, לא שיפור-consistency.
6. **12 הפריטים הנותרים אומתו כנכונים ונשארו PARTIAL** — כל אחד נבדק בפועל (לא רק נקרא) ונמצא חסום/מוגבל-בכוונה כהלכה: #1/#2/#11/#12/#105 (עיצוב Premium קפוא עד C/D או Mapbox — כולל בדיקה מפורשת שה-`MapProvider` היחיד מלבד Mapbox הוא `UnconfiguredMapProvider`, אין Leaflet-Provider חלופי בממשק הזה, ובניית אחד הייתה סותרת את הקפאת-העיצוב המתועדת), #71/#94 (דורשים דפדפן חי לאימות; נבדק בפועל שאין Playwright/Puppeteer/jsdom מותקן בפרויקט), #99 (הרחבת Audit Log לכל ה-Repositories היא עשרות קבצים, אסטרטגיה מוצהרת "לפי הצורך" — לא "תיקון נקודתי" כמו שאר הפריטים בסבב הזה), #100/#103 (כבר בתקרה הארכיטקטונית המתועדת/תלויים ב-DATA_SOURCE=prisma), #112 (OCR — 0% קוד, דורש מפתח Claude API), #113 (Marker Clustering תלוי Mapbox; "Image Optimization" נבדק בפועל דרך `next lint` — 4 אזהרות `no-img-element` אמיתיות, כולן על `data:` URI/hotlink שלא נהנות מ-`next/image` בלי לשנות ארכיטקטורת-אחסון-תמונות שכבר הוחלטה בכוונה).
**למה זה שונה מסבבים קודמים:** בסבבים 9-10 כל תיקון היה תגובה לרמז ספציפי מהמשתמש (רשימה מפורשת, או "עדיין רואה דברים לא תקינים"). כאן הייתה בקשה גורפת ל-18 פריטים בבת אחת — מה שדרש למיין אותם בעצמי לפי אותה שיטה (בדיקת-קוד לפני קבלת התיוג), ולפעול אחרת בכל קטגוריה: לתקן פערים אמיתיים (3), לתקן תיוג שגוי (2), לשפר בלי לשנות תיוג (1), ולהסביר בפירוט למה 12 אחרים באמת חסומים — בלי "לספור" אותם כאילו טופלו רק כי נבדקו.
**משפיע על:** `packages/db/prisma/schema.prisma`+migration `20260821150000_refund_is_received`, `packages/shared-types/src/{refund,payment}.ts`, `packages/data-layer/src/repositories/finance-repository.{ts,mock.ts,prisma.ts}`, `apps/web/app/(app)/trips/[tripId]/finances/{actions.ts,refund-form.tsx,mark-refund-received-form.tsx,delete-payment-button.tsx}`, `apps/web/app/(app)/trips/[tripId]/page.tsx`, `apps/web/app/(app)/trash/{page.tsx,actions.ts}`, `apps/web/lib/{gap-detection.ts,backup/restore-backup.ts,backup/export-backup.ts}`, `apps/web/app/(app)/emergency/nearest-medical.tsx`, `apps/web/app/(app)/now/notification-reminders.tsx`.
**סטטוס:** סופי. 91/114 IMPLEMENTED, 13/114 PARTIAL (כולן מוצדקות, ר' FEATURE_AUDIT.md), 6/114 NOT IMPLEMENTED, 4/114 BLOCKED. typecheck+lint+test(326)+build ירוקים.

### 2026-08-22 (סבב 13) — סירוב מכוון לבנות scraper למחירי-מלון/טיסה; קישורי-השוואה חינמיים במקום
**החלטה:** המשתמש ביקש מפורשות "שיכנס לכל האתרים וימצא לי את אותו מלון במחיר הכי טוב" (וגם טיסות). **סורב במפורש לבנות אוטומציה שנכנסת ל-Booking.com/Expedia/Google Hotels וכו' וקוראת מחירים** — כל האתרים האלה אוסרים scraping אוטומטי בתנאי השימוש שלהם, חוסמים בוטים בפועל (CAPTCHA/חסימת-IP/מחירים דינמיים תלויי-session), וזה שונה מהותית מ-Overpass/OSRM (שירותי נתונים **פתוחים** שנועדו לשאילתות תכנותיות) — נתוני מחיר-מלון/טיסה הם מלאי מסחרי קנייני, לא נתונים פתוחים. אין "Overpass של מחירים" חינמי.
**הוסבר למשתמש הדרך הלגיטימית:** תוכניות שותפים רשמיות (Booking.com Affiliate Partner API, Expedia Rapid API, Skyscanner Travel API, Amadeus for Developers) נותנות גישה אמיתית למחירים חיים **וגם** עמלה על הזמנות — בדיוק מה שהמשתמש שאל עליו ("איך גם להרוויח כסף"), אבל דורשות הרשמה/אימות-עסקי מצד המשתמש עצמו, לא משהו שניתן להפעיל בשמו.
**מה נבנה בפועל:** פאנל "💰 השווה מחירים" למלון (`hotel-search-links.ts`) וטיסה (`flight-search-links.ts`) — בונה URL-י חיפוש רגילים (לא scraping, לא API) ל-4 אתרי מטא-חיפוש למלונות ו-3 לטיסות, מוצג רק לפני הזמנה בפועל (status `want_to_book`/`need_to_book`). אותו עיקרון בדיוק כמו `navigate-links.ts` הקיים (Google Maps/Waze) — קישור-חיפוש חיצוני, לא קריאת-נתונים. משודרג בקלות לקישורי-שותפים אמיתיים (עם עמלה) אם/כשהמשתמש ירשם לאחת התוכניות — רק פרמטר URL משתנה, לא ארכיטקטורה.
**משפיע על:** `apps/web/lib/{hotel-search-links,flight-search-links}.ts` (+test), `apps/web/components/{hotel-price-links,flight-price-links}.tsx`, `apps/web/app/(app)/trips/[tripId]/page.tsx`.
**סטטוס:** סופי. typecheck+lint+test(345)+build ירוקים.

### 2026-08-22 (סבב 14) — חבילת פיצ'רים מורחבים: מלווים+חלוקת-הוצאות, שיתוף-מסלול ציבורי, ועוד

**החלטה:** המשתמש ביקש "תעשה את כולם" על חבילת רעיונות שהוצעו ביוזמת Claude אחרי שהמשתמש ביקש להשהות את מערכת תוכניות-השותפים (סבב 13). לפני בנייה, שני עקרונות נבדקו במפורש מול המשתמש דרך AskUserQuestion (לא הונחו):
1. **חלוקת-הוצאות:** "רק הוצאות עם משתתפים נבחרים-במפורש נכללות" (לא כל הוצאה מתחלקת אוטומטית) — המשתמש בחר "להוסיף בחירת 'מי משתתף' לכל הוצאה" על פני "חלוקה שווה אוטומטית לכולם". חלוקה שווה-בלבד (לא אחוזים מותאמים) נשארה מגבלת-v1 מכוונת ומתועדת.
2. **שיתוף-מסלול:** "רק למי שאתה רוצה שיוכל לעקוב" — פורש כ-token-based link שהמשתמש שולט בהפצתו (לא auth מבוסס-חשבון), עם יכולת ביטול מיידית.

**למה (החלטה טכנית חדשה — פרצה מתועדת בכוונה לדפוס "כל repository method מקבל userId"):** המסך הציבורי `app/shared/[token]/` לא מחזיק session/userId בכלל (זו בדיוק הנקודה שלו). כל שאר האפליקציה בנויה סביב `TripRepository.getById({userId,tripId})` כ"נקודת-האימות היחידה", וכל repository-method אחר מקבל `tripId` בלבד וסומך שהוא כבר אומת למעלה. כדי לתמוך בעמוד-הציבורי בלי לשבור את העיקרון הזה, נוספו **שתי חריגות צרות ומתועדות בקוד עצמו**, לא הרחבה כללית:
- `TripRepository.getByIdForShareView({tripId})` — בלי `userId`, לשימוש **רק** אחרי ש-`TripShareLinkRepository.resolveToken({token})` כבר אימת שיש קישור-שיתוף פעיל ל-`tripId` הזה (זו נקודת-האימות החלופית).
- `PlaceRepository.listByIds({placeIds})` — בלי `userId`, לשימוש **רק** על `placeId`-ים שכבר נאספו דרך `RouteStop` של אותו `tripId` מאומת.
כל אחת מתועדת ב-doc-comment בקוד שמסביר מפורשות שאסור להשתמש בה מנתיב לא-מאומת אחר. שתי החריגות בלבד, לא שינוי גורף — התאמה מדויקת ל"אין דרך קיימת לפתור token→tripId בלי לבדוק בעלות" שזוהתה במחקר לפני הבנייה.

**מה נבנה בפועל (8 חלקים, A-H):** ממיר מטבע מהיר, "מצא כספומט קרוב" (Overpass), תחזית קצב-הוצאה, הצעות-מסלול-יומי מוטות-גשם, הצעות-אריזה לפי מזג-אוויר, צ'קליסט-ויזה לא-סמכותי, `TripCompanion`+`ExpenseParticipant`+`computeSettleUp` ("💰 סגירת חשבונות"), ו-`TripShareLink`+מסך ציבורי (סוגר #88 Share Security — ר' FEATURE_AUDIT.md "סבב 13"). פירוט מלא בתוכנית: `C:\Users\ארנון\.claude\plans\groovy-wibbling-perlis.md`.

**משפיע על:** ר' רשימת "משפיע על" המלאה ב-FEATURE_AUDIT.md "עדכון 2026-08-22 (סבב 13)".
**סטטוס:** סופי. typecheck+lint+test(381)+build ירוקים בכל חלק/קבוצת-חלקים בנפרד. 2 migrations חדשים (`expense_participants`, `trip_share_links`) לא הוחלו על ה-DB החי — מצטרפים ל-4 הממתינים כבר (סה"כ 6, ר' PROJECT_STATE.md).

### 2026-08-22 (סבב 15) — סבב-2 של חבילת-הפיצ'רים המורחבת: שכפול-טיול-עם-מסלול, הצבעות-מלווים (proxy voting), ועוד

**החלטה:** אחרי סיום סבב 14 (חלקים A-H) המשתמש ביקש עוד רעיונות, קיבל 7, וענה "כן תוסיף את הכל". לפני בנייה נבדק בקוד בפועל (2 סבבי מחקר מקבילים) ונשאלו שוב שתי שאלות מכריעות דרך AskUserQuestion:
1. **הצבעות בין המלווים:** TripCompanion הן רשומות קלות בלי חשבון/התחברות משלהן. המשתמש בחר **"אתה מזין את ההצבעות בעצמך"** (proxy voting) על פני הצבעה אינטראקטיבית של כל מלווה — נמנע מלפתוח מחדש את גבולות-האבטחה שנקבעו בקפידה למסך-השיתוף הציבורי (סבב 14, חלק H, שנשאר Read-Only בהחלט).
2. **שכפול טיול:** המשתמש בחר **"גם המסלול היומי המלא"** (לא רק הגדרות/מלווים/תקציב) — RouteStop-ים מועתקים בפועל, עם הזזת-תאריכים יחסית לתאריך-התחלה חדש שהמשתמש מזין.

**ממצא-מחקר שתיקן הנחת-יסוד של התוכנית:** "יומן-יום עם תמונות" (אחד מ-7 הרעיונות) התברר כחצי-כבר-קיים — `TripDay.notes`+`TripDayNotesForm` כבר בנוי ועובד במלואו; מה שבאמת חסר זה רק תמונות. הסתכם בהוספת `"trip_day"` ל-enum `DocumentEntityType` הקיים ושימוש-חוזר מלא ב-`EntityPhotoGallery` — לא פיצ'ר-יומן חדש.

**החלטה טכנית נוספת:** "התראת חריגת-תקציב" (אחד מ-7) לא חוברה למנגנון `NotificationPreference`/`dueReminders` הקיים — נבדק בקוד (`notification-event-type-labels.ts`) שהמנגנון הזה **מתועד בכוונה** כמתאים רק ל"לפני-אירוע-עתידי-עם-timestamp", לא ל-state מתמשך כמו "התקציב חרג כרגע" (אותה סיבה בדיוק שכבר מנעה חיבור unpaid_booking/night_without_hotel). נבנתה כרטיס-אזהרה רגיל ב-/now במקום, גם באותם ספים (0.9/1.0) שכבר קיימים ב-`ProgressBar`.

**אימות חי (לא רק unit tests):** חלקים F ו-G (שכפול-טיול והצבעות) הכי מורכבים — נבדקו בפועל מול שרת ה-dev הרץ (מצב `DATA_SOURCE=mock` עוקף auth, מה שאפשר לדמות בקשות Server Action אמיתיות דרך curl): שכפול טיול-דמו יצר טיול חדש עם שם+"(עותק)" ותאריכים נכונים; הצבעה+שינוי-הצבעה לאותו מלווה עודכנו נכון בלי כפילות (`voterCompanionIds` זז נקי בין אפשרויות). מסלול-יומי-מועתק לא אומת עם נתונים אמיתיים כי לטיול-הדמו הקיים אין RouteStop-ים מלכתחילה (0% seed data) — הלוגיקה נסמכת במקום זה על 10 בדיקות-unit קיימות ל-`addStop`/`listForDay`.

**מה נבנה בפועל (7 חלקים, A-G):** תמונות ליום ספציפי, עמוד `/stats` (סטטיסטיקות-חיים חוצות-כל-הטיולים), אזהרת-תקציב אקטיבית ב-/now, `Trip.tripType`+הצעות-אריזה-לפי-סוג-טיול, `/loyalty-programs` (מועדוני נקודות/מיילים, מחקה את Contact), שכפול-טיול-כולל-מסלול, `CompanionPoll` (הצבעות proxy). פירוט מלא: `C:\Users\ארנון\.claude\plans\groovy-wibbling-perlis.md`.

**משפיע על:** ר' FEATURE_AUDIT.md "עדכון 2026-08-22 (סבב-2)" לרשימת "משפיע על" המלאה.
**סטטוס:** סופי. typecheck+lint+test(402)+build ירוקים בכל חלק/קבוצת-חלקים בנפרד. 4 migrations חדשים (`document_entity_type_trip_day`, `trip_type`, `loyalty_programs`, `companion_polls`) לא הוחלו על ה-DB החי — מצטרפים ל-6 הממתינים כבר (סה"כ 10, ר' PROJECT_STATE.md).

## איך להוסיף החלטה חדשה
העתק את התבנית:
```
### YYYY-MM-DD — כותרת קצרה
**החלטה:** ...
**למה:** ...
**משפיע על:** ...
**סטטוס:** סופי / זמני (+מה יגרום לשנות אותה)
```
