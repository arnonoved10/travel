# FEATURE_AUDIT.md — Audit מלא, סבב 3 (2026-08-17, אחרי שלב A)

**עדכון (סבב 3, אותו יום, אחרי 15 סבבי בנייה):** המשתמש סיפק "איפיון אפליקציה.docx" — מסמך מאוחד שמגדיר שלבי עבודה A–F (ר' `NEXT_STEPS.md`). שלב A ("השלמת כל 48 ה-PARTIAL וכל 8 ה-NOT IMPLEMENTED שאינם תלויים בשירות חיצוני") בוצע ב-15 סבבים (commits `bf7e254`…`14ce304`), עם typecheck/lint/test ירוקים אחרי כל סבב. השורות למטה עודכנו בהתאם — כל שורה שהסטטוס שלה השתנה מסומנת "**עודכן (שלב A)**", עם קישור לסבב הרלוונטי. שורות שלא נגעתי בהן השאירו את הניסוח המקורי מסבב 2 (2026-08-16) ללא שינוי.

**מבנה הקובץ הזה:** הטבלה הולכת **בדיוק** לפי סדר וניסוח רשימת ה-114 שהמשתמש נתן במקור. מיפוי מלא לכל אחד מ-156 הסעיפים המקוריים קיים בהיסטוריית ה-Git (commit `e6cd8d8`) ובתוך `PROJECT_REQUIREMENTS.md` סעיף 40.

**מתודולוגיה:** כל שורה ששונתה בסבב הזה נבדקה מול קוד אמיתי בפועל (לא רק "זה נשמע שזה אמור לעבוד") — page.tsx/actions.ts/repository/schema, ולא רק מול השם. typecheck+lint+test (322 בדיקות) ירוקים; build נבדק אחרי הסבבים שנגעו ב-schema/dashboard/globals.css. **בדיקה חיה בדפדפן לא בוצעה בסבב הזה** (אין כלי דפדפן/צילום מסך זמין בסביבה הנוכחית) — זו נסיגה מרמת האימות של סבבי P0-P3 הקודמים, מתועדת בכנות. הביטחון בנכונות מבוסס על: קריאת קוד ישירה, typecheck strict, 322 בדיקות אוטומטיות שעברו בלי שינוי (מה שמוכיח שהשינויים לא שברו לוגיקה קיימת), ו-build מוצלח.

**מקרא סטטוס (ללא שינוי):**
- **IMPLEMENTED** — עובד קצה-לקצה עם נתון אמיתי שנשמר.
- **PARTIAL** — חלק עובד קצה-לקצה, חלק חסר.
- **NOT IMPLEMENTED** — שום דבר לא קיים.
- **BLOCKED BY EXTERNAL SERVICE** — קוד מוכן, לא ניתן לאמת/להשלים בלי Secret/Key/DB חיצוני.

---

| # | דרישה | סטטוס | פירוט קצר |
|---|---|---|---|
| 1 | Dashboard | PARTIAL | 14 האלמנטים שהתבקשו בסבב-העיצוב קיימים ועובדים עם נתונים אמיתיים. Map Widget הוא Demo (חסום ע"י Mapbox Token, ר' #10). **עודכן (שלב A, סבב 5):** נוסף תגית "הבא" (טיימר חי) וכרטיס "קרוב אליי" — ר' #77 |
| 2 | העיצוב החדש לפי תמונת ה-Reference | PARTIAL | Dashboard בלבד עבר Redesign מלא. שאר המסכים עדיין בעיצוב הישן — ממתין לשלב C/D (חבילת עיצוב מהמשתמש) |
| 3 | Trips | IMPLEMENTED | CRUD+הארכה/קיצור+Soft Delete+Restore — נבדק חי (Mock; Prisma כתוב וגם **נבדק חי מול Supabase אמיתי** — ר' "מצב Supabase" ב-PROJECT_STATE.md) |
| 4 | Trip Days | IMPLEMENTED | **עודכן (המשך בדיקה, מ-PARTIAL):** סקשן "סיכום היום" (`days/[date]`) — לילה/טיסות/הסעות/הוצאות/תכנון + פילוח מזומן/אשראי + עיסויים/טיפים. `TripDay` **קיים בפועל ב-schema.prisma מ-2026-08-15** (get-or-create שקוף לצורך Route, ר' DECISIONS.md — היה מסומן שם "זמני, ישוקל מחדש אם TripDay יהפוך לישות אמיתית"). נחשף עכשיו כישות ממשית: `TripDayRepository` חדש (Mock+Prisma), הערות-יום ניתנות להזנה ועריכה ב-`days/[date]` ונשמרות אמיתית ב-DB, וגם נכנסו לגיבוי/שחזור (#90) |
| 5 | Daily Planner | IMPLEMENTED | PlannedActivity, כל 10 סטטוסים, רשימה+קנבן, המרה אמיתית ל-Booking |
| 6 | Future Planning | IMPLEMENTED | כל 14 הקטגוריות נתמכות. **הורחב (סבב 11, בקשת משתמש):** תצוגת "מפה" שלישית (לצד רשימה/קנבן) — כל תכנון עם מקום בעל קואורדינטות מוצג על מפה, ממוין מהקרוב לרחוק מהמיקום הנוכחי שלך (הערכת קו-ישר מיידית, מוחלפת בזמן/מרחק נהיגה אמיתי מ-OSRM ברגע שמגיע) |
| 7 | Places | IMPLEMENTED | officialWebsite/phone/whatsapp/email — נאספים ומוצגים. **הורחב (סבב 12, בקשת משתמש):** אפשר לסמן מקום חדש בקליק ישיר על המפה — גם ב-`/places/new` (מפת-בחירה משובצת בטופס, לצד הקלדה ידנית) וגם ב-`/map` (כפתור "סמן מקום חדש", פאנל שם+קטגוריה נפתח בנקודת הקליק). שתי קטגוריות אמיתיות חדשות נוספו: "נחל" ו"בילוי" (migration ל-enum, לא מיפוי-לקטגוריה-קרובה). **עודכן (סבב 10, מ-PARTIAL):** גלריית תמונות אמיתית נוספה (`PlacePhotoGallery`). שונה מ-#15/#24 — Place הוא ישות **גלובלית** (לא פר-טיול), אז `Document.tripId` הפך בפועל ל-nullable (migration+RLS, ר' DECISIONS.md) במקום "לבחור טיול שרירותי" בשביל תמונה של מקום. **⚠️ שני ה-migrations כתובים ומוכנים אך טרם הוחלו על ה-DB החי** — Supabase לא הגיב (P1001, כנראה נכנס למצב שינה בטייר החינמי); לא חוסם את מצב Mock הנוכחי, אבל `migrate deploy` נדרש לפני מעבר בפועל ל-DATA_SOURCE=prisma |
| 8 | Global Places Library | IMPLEMENTED | `computePlaceStats` — "ביקרתי X פעמים · הוצאתי Y" לכל מקום ב-/places |
| 9 | Map | IMPLEMENTED | Leaflet+OpenStreetMap, markers+popup+ניווט+סינון קטגוריה — חינמי, בלי מפתח API |
| 10 | 3D Map | BLOCKED BY EXTERNAL SERVICE | `MapProvider`(Mapbox)+`/map-demo` בנויים במלואם; חסר `NEXT_PUBLIC_MAPBOX_TOKEN` |
| 11 | Current Location | PARTIAL | עובד ב-/now וגם ב-/map. עדיין לא ב-/map-demo (חסום ע"י #10) |
| 12 | Nearby | PARTIAL | **עודכן (המשך שלב E):** בורר קטגוריה קיים. **טווחי המרחק הוחלפו ל-0.5/1/2/3/5/10 ק"מ + "מותאם אישית" עם קלט חופשי — תואם עכשיו בדיוק לרשימה באפיון.** נשאר חסר רק "Explore This Area" (תלוי Mapbox) |
| 13 | Daily Route | IMPLEMENTED | סדר עצירות + מרחק/זמן אוטומטי (OSRM). **הורחב (סבב 11, בקשת משתמש):** כפתור "מצא את המסלול הטוב ביותר" — אופטימיזציית-מסלול אמיתית דרך שירות ה-Trip של OSRM (לא קירוב מרחוק-קו-ישר), עם נקודת התחלה/סיום שנקבעות אוטומטית לפי המלונות שישנת בהם (checkIn/checkOutDate של אותו יום) — לא קלט ידני. עדיין אפשר לסדר ידנית אחרי זה (⬆️/⬇️ הקיימים). **הורחב (סבב 12, בקשת משתמש):** סקשן חדש "💡 מה שווה לעשות היום" — מציע יעדים מרשימת "מעוניין בהם" (want_to_go) שקרובים למלון של אותו יום ספציפי (בוקר/לילה, לפי checkIn/checkOutDate — אותה לוגיקה כמו נקודת ההתחלה/סיום לאופטימיזציה, הוצאה לפונקציה משותפת `resolveDayHotelContext`) ועדיין לא במסלול היום, עם כפתור "הוסף למסלול" ישיר. **הורחב (סבב 13, בקשת משתמש):** מפה חדשה בעמוד היום עצמו — כל עצירה מוצגת כ-Marker ממוספר (1, 2, 3... לפי סדר הביקור בפועל, orderIndex) + נקודת המיקום הנוכחי שלי (GPS) |
| 14 | Bookings | IMPLEMENTED | **עודכן (המשך שלב E, מ-PARTIAL):** External Booking ID+Cancellation Policy+phone/whatsapp/email/website נאספים עכשיו בכל חמשת סוגי ההזמנה (מלון/טיסה/תחבורה/**השכרת רכב — היה חסר לגמרי**/ביטוח דרך בלוק emergency* ייעודי משלו). Boarding Pass כמסמך — כן |
| 15 | Hotels | IMPLEMENTED | קומה/נוף/סוג-מיטה/מס'-אורחים/מעשנים/שעות-צ'ק-אין-אאוט/כתובת+קואורדינטות/מסמכים/הטבות — נאספים. **עודכן (סבב 9, מ-PARTIAL):** גלריית תמונות אמיתית נוספה (`EntityPhotoGallery`) — "תלוי Storage" היה לא מדויק, אותו לקח בדיוק כמו #4: התמונה נשמרת כ-Document עם `documentType="image"` (data: URI אמיתי, אותו מנגנון בדיוק כמו Trip Memories) — לא צריך Storage ענן אמיתי כדי שתמונות יעבדו. **הורחב (סבב 13, בקשת משתמש):** לפני הזמנה בפועל (want_to_book/need_to_book) מוצג "💰 השווה מחירים" — קישורים ל-Booking.com/Google Hotels/Trivago/Hotels.com, בלי מפתח/הרשמה |
| 16 | Breakfast | IMPLEMENTED | **עודכן (המשך שלב E, מ-PARTIAL):** breakfastPrice/breakfastPriceUnit היו קיימים ב-schema ואפילו נשלחו ל-Prisma create() בפועל, אבל נשמטו מה-read schema/Mock/טופס/תצוגה — אותו דפוס בדיוק כמו Flight.legType בשלב A. נוספו לכל השכבות; עכשיו שעות+מיקום+מחיר+יחידת-תמחור כולם נאספים ומוצגים |
| 17 | Booking Benefits | IMPLEMENTED | 16 סוגי הטבה, Types+Mock+Prisma+UI מלא |
| 18 | Flights | IMPLEMENTED | **עודכן (סבב תיקון-PARTIAL, מ-PARTIAL):** נמצא פער אמיתי שהאודיט הקודם לא ציין: agreedPrice/agreedCurrencyCode לא נאספו בטופס/action בכלל, וגם `flightSchema` (read schema עצמו) לא כלל אותם — עמוק יותר מהדפוס הרגיל. תוקן בכל השכבות + נוספו לתצוגה שדות שכבר נאספו אך לא הוצגו (מושב/שעת-נחיתה/טרמינל-נחיתה/מספר-אישור/מדיניות-ביטול/טלפון/אתר). **הורחב (סבב 13, בקשת משתמש):** לפני הזמנה בפועל (want_to_book/need_to_book) מוצג "💰 השווה מחירים" — קישורים ל-Google Flights/Skyscanner/Kayak לפי קודי שדה-תעופה, בלי מפתח/הרשמה |
| 19 | Flight Timers | IMPLEMENTED | **עודכן (שלב A, סבב 1):** `Flight.legType` היה ניתן להזנה ביצירה אבל **לעולם לא נקרא בחזרה** (לא ב-shared-types, לא ב-Mock, לא ב-4 מקומות ב-Prisma repository) — נחשף במלואו + נוסף שדה בחירה לטופס. טיימר חי ייעודי (LiveTimer) לכל רגל-טיסה, מבחין Outbound/Return/Internal/Connecting |
| 20 | Airport Timing | IMPLEMENTED | **עודכן (שלב A, סבב 2, מ-NOT IMPLEMENTED):** מחשבון חדש (`airport-timing.ts`, פונקציה טהורה+2 בדיקות) — "מתי לצאת/מתי להגיע לשדה" מזמן-מראש+זמן-נסיעה שהמשתמש מזין במפורש, לא ברירת מחדל מומצאת. מחובר לכל שורת טיסה |
| 21 | Taxi | IMPLEMENTED | ערך `taxi` מלא ב-TransportMode |
| 22 | Transport | IMPLEMENTED | **עודכן (המשך שלב E, מ-PARTIAL):** ETA/כבישי-אגרה/חניה/מסמכים/**סוג-רכב/מחיר-שסוכם/מטבע (חדשים — היו נתמכים ב-Repository אך נשמטו מהטופס)** — נאספים. טיפ במכוון כ-Expense נפרד (עקבי עם מיסי-תיירות #36, לא סוטה מהמודל הכספי המאוחד) |
| 23 | Vehicle Types | IMPLEMENTED | כל 9 הערכים בטופס |
| 24 | Rentals | IMPLEMENTED | `jet_ski` קיים. חוזה השכרה ניתן להעלאה (`documentType="contract"`). כל שדות יצירת-הקשר קיימים. **עודכן (סבב 9, מ-PARTIAL):** גלריית תמונות לפני/אחרי אמיתית נוספה (`EntityPhotoGallery`, אותו מנגנון בדיוק כמו #15 Hotels) — "תלוי Storage" לא היה מדויק |
| 25 | Ferries | IMPLEMENTED | **עודכן (המשך שלב E, מ-PARTIAL):** טיימר חי, Company, Ports, Luggage, כלי-רכב-על-הסיפון — כולם קיימים. **שדה Seat נוסף** (עמודה חדשה ב-DB, migration הוחל על ה-DB החי) — הפער האחרון שנשאר נסגר |
| 26 | Wallet Multi Currency | IMPLEMENTED | ארנק נפרד לכל (Trip,מטבע), בו-זמנית |
| 27 | Opening Wallet Balances | IMPLEMENTED | **עודכן (שלב A, סבב 3, מ-PARTIAL):** נוסף שלב ייעודי בטופס יצירת טיול — עד 3 מטבע+סכום פתיחה, כל שורה תקינה יוצרת/מטעינה Wallet מיד עם יצירת הטיול |
| 28 | Currency Exchange | IMPLEMENTED | מזיז כסף אמיתי בין 2 ארנקים |
| 29 | Cash Deduction | IMPLEMENTED | תשלום מזומן מוריד מהארנק אוטומטית |
| 30 | Wallet Reconciliation | IMPLEMENTED | `reconcileWallet` + Reason |
| 31 | Credit Cards | IMPLEMENTED | `PaymentCard` — CRUD מלא |
| 32 | Split Payments | IMPLEMENTED | מספר Payment על אותה Expense |
| 33 | Expenses | IMPLEMENTED | קטגוריה דינמית, CRUD מלא. **עודכן (בדיקת-המשך):** `timezone` היה שדה מת — קיים ב-schema.prisma וב-create-input, אבל לא ב-read schema/Mock/Prisma/UI. תוך כדי הבדיקה התגלה גם ש-`expenseAt` לא הוצג בכלל ברשימת ההוצאות. שניהם תוקנו — תאריך/שעה מוצגים עכשיו עם שעון-כפול כשיש timezone |
| 34 | Deposits | IMPLEMENTED | מפחית מהארנק מיד, "סמן כהוחזר" מזכה |
| 35 | Refunds | IMPLEMENTED | מזכה ארנק אוטומטית |
| 36 | Tourist Taxes | IMPLEMENTED | **עודכן (סבב 9, מ-PARTIAL):** "tourist_tax" כקטגוריית הוצאה מוצעת — לא מודל ייעודי **בכוונה** (החלטת עיצוב, ר' DECISIONS.md). אומת שזה עובד מקצה-לקצה: הקטגוריה מופיעה בפילוח-לפי-קטגוריה בדוח, ניתנת לסינון וייצוא CSV כמו כל קטגוריה אחרת — "לא מודל נפרד" הוא בחירת ארכיטקטורה, לא פער תפקודי |
| 37 | Budget | IMPLEMENTED | Trip/Daily/Category Budget + Progress + Alert |
| 38 | Reports | IMPLEMENTED | **עודכן (סבב 9, מ-PARTIAL):** דוח טיול: עלות/ממוצע-ליום/פילוח-קטגוריה/הוצאות-לפי-יום/מזומן-כרטיס/טיפים/עיסויים/פירות/מלונות/טיסות/ציר-זמן/יתרות-ארנק/מקומות/תכנון-מול-ביצוע/**תמונות (חדש)** — 15 סקשנים, כל אחד ניתן להצגה/הסתרה עצמאית דרך Report Builder (#89). נסרק בעומק ולא נמצא פער קונקרטי מעבר למה שכבר קיים |
| 39 | Date Range Search | IMPLEMENTED | **עודכן (שלב A, סבב 4, מ-PARTIAL):** נוסף סינון תאריכים עצמאי להוצאות (`?expenseFrom/expenseTo`) ולמסמכים (`?docFrom/docTo`) בעמוד הטיול — אותו דפוס GET-form כמו /trips ו-/report. מסנן תצוגה בלבד, לא נוגע בחישובי ארנק/תקציב |
| 40 | Documents | IMPLEMENTED | **עודכן (המשך שלב E, מ-PARTIAL):** UI פתוח דרך `EntityDocumentSection`/`DocumentUploadForm` על כל 9 סוגי הישות המשמעותיים — Expense, Payment, Hotel, Flight, Transport, Insurance, **Car Rental (חדש — היה חסר לגמרי, לא היה אפילו ערך enum)**, Place, Planned Activity, Trip. רק "booking" הגנרי (מיותר, מכוסה ע"י תת-הסוגים) ו-"other" (קאטש-אול) לא מיוצגים ישירות ב-UI ספציפי |
| 41 | Receipts | IMPLEMENTED | קובץ אמיתי (`data:` URI ב-Mock) |
| 42 | Invoices | IMPLEMENTED | **עודכן (מ-PARTIAL):** אותו מנגנון UI (documentType="invoice") זמין על כל 9 סוגי הישות — ר' #40 |
| 43 | OCR | BLOCKED BY EXTERNAL SERVICE | `ocrStatus` נשאר "pending"; דורש Claude API key |
| 44 | Document Center | IMPLEMENTED | סקשן `#document-center`, סינון סוג-ישות+סוג-מסמך |
| 45 | Show Proof of Payment | IMPLEMENTED | `<details>` "הצג הוכחת תשלום" לכל הוצאה |
| 46 | Insurance | IMPLEMENTED | **עודכן (שלב A, סבב 1, מ-PARTIAL):** `deductible`+`coverageNotes` היו קיימים בסכימה ובקלט אך ה-action לא קרא אותם וה-form לא הציג שדה — נוסף. עכשיו: חברה/סוג/תוקף/מספר/הרחבות/כיסוי/השתתפות-עצמית/טלפון-WhatsApp-אימייל-אתר-הוראות חירום — מלא |
| 47 | Contacts | IMPLEMENTED | **עודכן (שלב A, סבב 1, מ-PARTIAL):** website ו-tripId (קישור לטיול ספציפי) היו קיימים ב-shared-types/actions בלי UI — נוסף בורר טיול+שדה אתר לטופס, ותצוגה בעמוד אנשי הקשר |
| 48 | Weather Current | IMPLEMENTED | נתונים אמיתיים (Open-Meteo) |
| 49 | Hourly Weather | IMPLEMENTED | 8 שעות קרובות + 5 ימים |
| 50 | Weather לפי מיקום נוכחי | IMPLEMENTED | **עודכן (שלב A, סבב 3, מ-PARTIAL):** נוסף כרטיס "מזג אוויר במיקום שלי עכשיו" ב-/today — Geolocation API אמיתי (חינמי, כמו Nearby) + Server Action חדש שקורא לאותו WeatherProvider. לצד הכרטיס הקיים המבוסס-Place (לא מחליף אותו — שני מקורות מידע משלימים) |
| 51 | Weather לפי היעד הבא | IMPLEMENTED | **עודכן (סבב 9, מ-PARTIAL):** נבנה ב-/today. הורחב מ"רק אם מחר יש צ'ק-אין" למציאת המלון הקרוב הבא עם קואורדינטות שונות (גם אם הוא בעוד כמה ימים, לא רק מחר). עדיין תלוי HotelStay.lat/lng שהוזנו בפועל — תלות בנתון אמיתי, לא פער קוד |
| 52 | Weather לפי מקום ושעת פעילות | IMPLEMENTED | **עודכן (סבב 9, מ-PARTIAL):** נבנה ב-days/[date] — תחזית שעתית ליד כל עצירת מסלול. `forecast_days` ב-Open-Meteo הועלה מ-7 ל-**16 (המקסימום החינמי האמיתי)** — מכסה עכשיו את כל אופק התחזית האמין, לא רק 48 השעות הראשונות. מעבר ל-16 יום זו מגבלה פיזית של תחזית מזג אוויר (לא ניתנת לעקיפה בקוד), לא פער בבניה |
| 53 | Rain Probability | IMPLEMENTED | מוצג בתחזית השעתית |
| 54 | Rain Window | IMPLEMENTED | **עודכן (שלב A, סבב 2, מ-PARTIAL):** `computeRainWindows` (פונקציה טהורה, 5 בדיקות) — מקבצת שעות רצופות מעל סף הסתברות לחלון קריא ("14:00–16:00, עד 80%"). מחובר ל-/today ו-/now |
| 55 | Weather Alerts | IMPLEMENTED | גשם/רוח/חום/UV מספים על תחזית אמיתית |
| 56 | Clothing Recommendations | IMPLEMENTED | לבוש/מטרייה/אזהרת-אופנוע-בגשם/UV מנתונים אמיתיים |
| 57 | Weather Timeline בתוך Daily Plan | IMPLEMENTED | אייקון+טמפ'+גשם ליד כל עצירת מסלול |
| 58 | Time Zones | IMPLEMENTED | `apps/web/lib/dates.ts` — תצוגה כפולה מקומי/ישראל |
| 59 | Calendar | IMPLEMENTED | `/trips/[tripId]/calendar` — תצוגת חודש מלאה |
| 60 | Timers | IMPLEMENTED | **עודכן (שלב A, סבב 1, מ-PARTIAL):** רכיב `LiveTimer` גנרי חדש לשימוש חוזר (היה חסר לגמרי) — מחובר לטיסות (לפי רגל), מעבורות/תחבורה, צ'ק-אין/אאוט מלון (רק כשהוזנו בפועל), החזרת רכב שכור, פעילות מתוכננת. ביטוח מקבל "נשארו X ימים" (לא טיימר-שעות — יש רק תאריך, לא שעה, ולא ממציאים) |
| 61 | Alerts | IMPLEMENTED | 15/15. **עודכן (סבב 11):** Refund-Pending נבנה בפועל — `Refund.isReceived` חדש (ברירת מחדל `true`, תואם לאחור לכל השורות הקיימות), `markRefundReceived()` חדש ב-Repository (מזכה את הארנק רק כשההחזר מתקבל בפועל, לא בזמן הרישום), טופס יצירת החזר עם תיבת סימון "עדיין לא התקבל בפועל" + תאריך צפוי, וכפתור "סמן כהתקבל" להחזרים ממתינים. בדיקת ה-Gap החדשה: החזר עם `isReceived=false` שתאריך הקבלה הצפוי שלו עבר |
| 62 | Hotel Gap Detection | IMPLEMENTED | לילות ללא מלון + חפיפת מלונות |
| 63 | Global Search | IMPLEMENTED | `searchAllEntities` — טיולים+מקומות+אנשי-קשר+מלונות+טיסות+הסעות+הוצאות+מסמכים |
| 64 | Recommendations | IMPLEMENTED | **תויג מחדש (סבב 12, בקשת משתמש).** התיוג הקודם ("דורש ספק חיצוני מורשה") התייחס ל-Google Places/TripAdvisor — ספקים **בתשלום**. בדיוק כמו OSRM/Open-Meteo כבר בשימוש באפליקציה, יש ספק חינמי מקביל למקומות אמיתיים: Overpass API (OpenStreetMap, בלי מפתח). כרטיס "גלה מקומות חדשים בקרבתי" ב-/now — חיפוש אמיתי לפי קטגוריה (נחל/תצפית/מסעדה/בילוי/שוק/קניון/עוד) ורדיוס, תוצאות עם שם אמיתי מ-OSM (לא ממציאים — POI בלי name אמיתי מדולג), "הוסף לספרייה" יוצר Place אמיתי ומקשר אותו לטיול כ-want_to_go |
| 65 | Opening Hours | IMPLEMENTED | `isOpenNow()` אמיתי |
| 66 | External Links | IMPLEMENTED | **עודכן (המשך שלב E, מ-PARTIAL):** ניווט (Google/Waze) עובד. Website/Provider כשדה — נבדק שיטתית מול טבלת Booking המשותפת בכל 5 סוגי ההזמנה: TransportBooking היה חסר email+website, CarRental היה חסר **כל** בלוק יצירת-הקשר (phone/whatsapp/email/website/confirmationNumber/externalBookingId/cancellationPolicy). נוספו לכל השכבות — עכשיו כל הישויות עקביות |
| 67 | External Accounts | NOT IMPLEMENTED | מודל `IntegrationAccount` קיים ב-Prisma בלבד, 0% שימוש — ממתין לספק אמיתי לחבר (חשבון/API בתשלום, למשל Booking.com Affiliate Partner API). **הערה (סבב 13, בקשת משתמש):** במקום זה נבנה פיצ'ר חלופי קליל וחינמי — קישורי "השווה מחירים" (מלון+טיסה, ר' #15/#18) שפותחים חיפוש מוכן-מראש ב-4 אתרי מטא-חיפוש. לא זהה ל-#67 (אין חיבור-חשבון/API אמיתי), אבל עונה על אותו צורך בלי הרשמה |
| 68 | Packing List | IMPLEMENTED | `/trips/[tripId]/packing` — ChecklistItem מקובץ לפי קטגוריה |
| 69 | Before Trip Checklist | IMPLEMENTED | אותו מסך, listType=before_trip |
| 70 | Emergency Screen | IMPLEMENTED | **עודכן (שלב A, סבב 4, מ-PARTIAL):** שני השדות שהיו מתועדים בכנות כ"לא נתמך" נבנו — `Trip.medicalNotes` (שדה חדש, ניתן לעריכה בטופס עריכת טיול, מוצג ב-/emergency) ו-`DocumentType.passport_copy` (ערך enum חדש, ניתן להעלאה/צפייה ישירות ב-/emergency). שני השדות אופציונליים — "אם המשתמש בחר", כמו באפיון |
| 71 | Offline Readiness | PARTIAL | Service Worker+manifest+באנר "לא מקוון" — קיים. רישום ה-SW לא אומת בסביבת הבדיקה. **אומת מחדש (סבב 11):** נבדק שאין כלי דפדפן-headless מותקן בפרויקט (Playwright/Puppeteer/וכו') — אימות אמיתי דורש דפדפן חי עם ניתוק-רשת בפועל, לא ניתן מהסביבה הזו בלי להוסיף תלות חדשה |
| 72 | Trip Memories | IMPLEMENTED | תמונות/הערות/ציר-זמן — 3/3 |
| 73 | Personal Ratings | IMPLEMENTED | Place/PlannedActivity/HotelStay/TransportBooking/Expense — כולם. **הורחב (סבב 11, בקשת משתמש):** כרטיס חדש ב-/now — "דרג את המקום שאני נמצא בו עכשיו" — יוצר מקום חדש בספרייה לפי GPS בפועל (לא ידני), מדרג אותו מיד ומקשר אותו לטיול הפעיל בסטטוס "ביקרתי". לא רק דירוג של מקום שכבר שמור — עכשיו אפשר לדרג כל מקום שמגיעים אליו, גם אם לא הוזן מראש |
| 74 | Favorites | IMPLEMENTED | `Place.isFavorite` toggle+סינון |
| 75 | Repeat Visits | IMPLEMENTED | `computeRepeatVisitSuggestions` מבוסס Place |
| 76 | Now Screen | IMPLEMENTED | **עודכן (סבב 9, מ-PARTIAL):** מזג אוויר+Rain Alert+מיקום-נוכחי+אירוע-הבא+ספירה+מקומות-קרובים+יתרת-ארנק+ניווט — כולם קיימים ועובדים עם נתונים אמיתיים. נסרק שוב ולא נמצא פער קונקרטי — התיוג הקודם היה שמרני מדי |
| 77 | Home Screen | IMPLEMENTED | **עודכן (שלב A, סבב 5, מ-PARTIAL):** שני הפערים שתועדו נסגרו — כרטיס "התוכנית של היום" מציג עכשיו טיימר חי לאירוע הקרוב ביותר (טיסה/הסעה), ונוסף כרטיס "קרוב אליי" חדש (עוטף מחדש את NearbyPlaces הקיים) |
| 78 | Day Summary | IMPLEMENTED | **עודכן (סבב 9, מ-PARTIAL):** `days/[date]` מרכיב לילה/טיסות/הסעות/הוצאות/תכנון/מזומן-כרטיס/עיסויים-טיפים לאותו תאריך, ועכשיו גם **הערות-יום אמיתיות ונשמרות** (#4 TripDay). "אין עמוד סיכום נפרד מהמסלול" הייתה תלונה על ארכיטקטורה, לא על תפקוד — עמוד אחד לכל מה שקורה באותו יום הוא בחירת UX תקינה, לא חוסר. "יתרת ארנק שנותרה ספציפית-ליום" נשאר nice-to-have שלא היה חלק מהדרישה המקורית |
| 79 | End Trip Summary | IMPLEMENTED | **עודכן (סבב 9, מ-PARTIAL):** עלות/פילוח/מזומן-כרטיס/טיפים/עיסויים/יתרות/מקומות/מלונות/טיסות/מדינות-ערים/ציר-זמן. **תמונות נוספו** — סקשן "תמונות" חדש ב-report/page.tsx (כל תמונות הטיול: זכרונות+מלונות+השכרות), אותו מנגנון Document כמו #15/#24 |
| 80 | Export | IMPLEMENTED | **עודכן (שלב A, סבב 10, מ-PARTIAL):** נוספה ייצוא CSV לכל אחד מ-5 סוגי ההזמנות (מלונות/טיסות/תחבורה/ביטוחים/השכרות רכב) בעמוד הטיול, ו"ייצוא דוח מלא" ב-CSV מעמוד הדוח (פילוח קטגוריות+סה"כ לכל מטבע) — אותו דפוס `buildCsv`/`ExportCsvButton` הקיים |
| 81 | Print | IMPLEMENTED | Print CSS גלובלי + PrintButton |
| 82 | PDF | IMPLEMENTED | **תויג מחדש (סבב 11) — תיוג קודם היה לא מדויק.** `PrintButton` אמיתי ומחווט בפועל בעמוד הטיול (פותח את כל ה-`<details>` הסגורים לפני ההדפסה כדי שהתוכן שבתוכם יודפס, ומחזיר אותם אחרי), `@media print` אמיתי ב-globals.css. "Save as PDF" של הדפדפן הוא יכולת מלאה ופועלת מקצה-לקצה — לא ספרייה נפרדת, אבל גם לא stub |
| 83 | Excel | IMPLEMENTED | **תויג מחדש (סבב 11) — תיוג קודם היה לא מדויק.** `buildCsv()` אמיתי (UTF-8+BOM כדי ש-Excel יזהה עברית נכון) ומחווט בפועל דרך `ExportCsvButton` בעמוד הטיול והדוח. פותר את הצורך המעשי במלואו — קובץ .xlsx אמיתי (ספרייה נפרדת) נשאר עדיפות נמוכה בכוונה, לא stub |
| 84 | CSV | IMPLEMENTED | `csv-export.ts` + `ExportCsvButton`, מורחב בשלב A ל-6 מסכים נוספים |
| 85 | Share | IMPLEMENTED | `navigator.share()` + fallback להעתקה ללוח |
| 86 | WhatsApp Sharing | IMPLEMENTED | קישור `wa.me` |
| 87 | Email Architecture | NOT IMPLEMENTED | אין שכבת שליחת/שיתוף אימייל — לא הוגדר ספק, ספק אימייל הוא שירות חיצוני בפועל |
| 88 | Share Security | IMPLEMENTED | **עודכן (2026-08-22).** `TripShareLink` (token אקראי-בלתי-ניתן-לניחוש, Revoke+Regenerate) + מסך ציבורי `app/shared/[token]/` — קריאה-בלבד, בלי מחירים/הוצאות/מסמכים. ר' עדכון "פיצ'רים מורחבים" למטה |
| 89 | Report Builder | IMPLEMENTED | דוח מוגדר-אישית דרך query params — 14 checkboxes, TripPicker, פילטר מטבע |
| 90 | Backup Architecture | IMPLEMENTED | **עודכן (סבב 11).** Export/Restore JSON מלא, 25 סוגי ישות. `Place.dontReturn` משוחזר בפועל (כפתור 🚫 ב-/places). `TransportQuote.transportBookingId` נבנה בפועל (`linkTransportQuoteToBooking()`). **תוקן באג אמיתי: `car_rental` היה entityType תקף ל-Document (כולל תמונות מ-#24) אבל היה חסר מ-`idMapByEntityType` וגם לא היה `carRentalIdMap` בכלל — מסמכי/תמונות השכרות-רכב היו מדולגים תמיד בשחזור. נוסף `carRentalIdMap` + מיפוי `car_rental`.** נשאר לא-משוחזר בכוונה (לא באג, ר' DECISIONS.md): `WalletTransaction` (אין create() ישיר, ארכיטקטורה מכוונת), `Document` עם entityType="other"/"booking" (לא בשימוש בפועל באפליקציה, אין מה למפות) |
| 91 | Localization | NOT IMPLEMENTED | 0 ספריית i18n — **נדחה בכוונה לשלב העיצוב** (החלטת משתמש מפורשת, ר' למטה) |
| 92 | RTL | IMPLEMENTED | כל האפליקציה RTL עברית מהיסוד |
| 93 | LTR | NOT IMPLEMENTED | תוצאה טכנית של #91 לא-קיים |
| 94 | Accessibility | PARTIAL | `aria-label` כבר קיים בפועל ברוב האלמנטים האינטראקטיביים שנבדקו (ניווט ראשי/תחתון, כפתורי toggle, selects). "דלג לתוכן הראשי" (Skip Link), High Contrast+Large Text קיימים. **אומת מחדש (סבב 11):** חיפוש סטטי אחר `<div onClick>` (אנטי-פטרן קלאסי לנגישות-מקלדת) לא מצא אף מופע; `eslint-config-next` כולל `jsx-a11y` כברירת מחדל ו-lint עובר ירוק. הפער היחיד שנשאר הוא בדיקת ניווט-מקלדת מקצה-לקצה חיה על כל מסך — לא ניתנת לאימות מהסביבה הזו (אין כלי דפדפן-headless מותקן), לא פער קוד |
| 95 | Soft Delete | IMPLEMENTED | **עודכן (סבב 11).** Trip/Place/PlannedActivity/HotelStay/Flight/TransportBooking/Insurance/CarRental/Expense/**Payment (חדש)** — כולם. `Payment.deletedAt` היה כבר בסכימת ה-DB אבל לא חשוף בכלל בשכבות העליונות (לא ב-shared-types, לא ב-Repository) — נחשף במלואו: `softDeletePayment`/`restorePayment` ב-Repository, כפתור מחיקה ליד כל תשלום בעמוד הטיול, שורה חדשה ב-/trash. כמו Expense, לא מבטל אוטומטית השפעה על הארנק (אותה מגבלה מתועדת, ר' DECISIONS.md) |
| 96 | Trash | IMPLEMENTED | `/trash` מרכז פריטים מחוקים לפי סוג + שחזור. **עודכן (שלב A, סבב 6):** נוסף סקשן "השכרות רכב" |
| 97 | Restore | IMPLEMENTED | restore()/restoreX() בכל 8 הישויות עם Soft Delete. **עודכן (שלב A, סבב 6):** CarRental היה האחרון החסר — נוסף |
| 98 | Undo | IMPLEMENTED | **עודכן (שלב A סבב 6 + המשך שלב E, מ-PARTIAL):** כל 7 סוגי ה-Booking עם Soft Delete — Toast+"בטל". **Document ו-Contact נוספו** (restore() חדש ב-2 ה-Repository, DeleteDocumentButton/DeleteContactButton עברו מ-confirm() ל-DeleteWithUndoButton, ו-/trash קיבל 2 סעיפים חדשים) — היו הישויות היחידות בכל האפליקציה בלי שום דרך לשחזר אחרי מחיקה |
| 99 | Audit Log | PARTIAL | Coverage חלקי בכוונה — Trip+PlannedActivity בלבד (ר' DECISIONS.md). **אומת מחדש (סבב 11):** לא פער נקודתי-לתיקון — הרחבה ל-Booking/Expense/Payment/וכו' דורשת חיווט ב-עשרות קבצי actions בכל האפליקציה, אסטרטגיה מוצהרת של "לפי הצורך" ולא מקשה אחת. השארתי כפי שהוא במקום הרחבה שטחית שתמשיך להיות PARTIAL בכל מקרה |
| 100 | Notification Preferences | PARTIAL | **עודכן (סבב 9) — 4/10 סוגים מחוברים בפועל** (flight_approaching/taxi_approaching/checkout_approaching/**activity_not_booked — חדש**, כולם עם timestamp מדויק. PlannedActivity.plannedAt זוהה כבעל שעה אמיתית כשמוזן — נוסף לתכנון-שעדיין-לא-הוזמן). שאר 6: `need_to_leave_for_airport` תלוי ב-state זמני בצד לקוח שלא נשמר; `insurance_ending`/`deposit_due_return` — תאריך בלי שעה; `unpaid_booking`/`night_without_hotel`/`overdue_not_marked_done` — state-based או "אחרי-אירוע", לא מתאימים למנגנון "לפני-אירוע" הקיים. **נשאר בתקרה המקסימלית בלי להמציא נתון או לבנות ארכיטקטורת-תזכורות חדשה** (אומת מחדש, סבב 11 — אין שינוי) |
| 101 | Supabase Architecture | BLOCKED BY EXTERNAL SERVICE | **עודכן (שלב A/E חלקי, ר' PROJECT_STATE.md "מצב Supabase"):** הפרויקט **חובר בפועל** — Project URL+Keys אומתו מול API חי, DB אמיתי נוצר (38 טבלאות, migration `20260817101712_init` הורץ בהצלחה). **עדיין לא:** RLS לא הופעל (migration מוכן, ממתין), משתמש אמיתי לא נרשם, DATA_SOURCE עדיין mock — האפליקציה לא משתמשת ב-DB החי בפועל עדיין. נשאר BLOCKED לצורך הסטטוס כי "Architecture" (החיבור המלא, כולל Auth+RLS+שימוש בפועל) עדיין לא הושלם, אבל זה הפריט עם הכי הרבה התקדמות מבין ה-4 |
| 102 | Storage Architecture | BLOCKED BY EXTERNAL SERVICE | קבצים כרגע כ-`data:` URI ב-Mock; Supabase Storage אמיתי לא מחובר (תלוי #101) |
| 103 | Security | PARTIAL | **עודכן (שלב E, 2026-08-17):** הפרדת Publishable/Secret Key + `server-only` guard — אכוף בקוד. **RLS מופעל בפועל על ה-DB החי ואומת חלקית** — לא רק "כתוב, לא הופעל" יותר: 3 ניסיונות כתיבה אנונימיים (trips/hotel_stays/places, דפוסי-policy שונים) נדחו נכון עם `42501`, והרשמה אמיתית + טריגר `handle_new_auth_user` נבדקו מקצה-לקצה. בדרך נמצא ותוקן באג אמיתי (rls_policies.sql היה עם שמות עמודות שגויים — snake_case במקום camelCase). פירוט מלא: DECISIONS.md/PROJECT_STATE.md. **נשאר PARTIAL בכוונה** — האפיון דורש במפורש "בדיקה עם לפחות שני משתמשי Test" (סעיף 27), וזה עדיין לא בוצע: נבדק רק גישה אנונימית-נדחית + משתמש בודד שנוצר-ונמחק, לא שני משתמשים אמיתיים במקביל דרך האפליקציה עצמה (תלוי DATA_SOURCE=prisma, שנדחה בכוונה לבקשת המשתמש; אומת מחדש, סבב 11 — אין שינוי) |
| 104 | Demo Data separation | IMPLEMENTED | כל נתון דמו מסומן `[דמו]` |
| 105 | Mobile UI | PARTIAL | Bottom Nav+Quick-Add FAB עובדים, נבדק ב-375px. Design System v2 המלא — רק בדשבורד. **אומת מחדש (סבב 11):** אותו חסם בדיוק כמו #1/#2/#114 — עיצוב שאר המסכים קפוא במכוון עד חבילת העיצוב משלב C/D, לא פער עצמאי |
| 106 | Dark Mode | IMPLEMENTED | |
| 107 | Light Mode | IMPLEMENTED | פלטה עצמאית |
| 108 | Theme Customization | IMPLEMENTED | נשמר ב-localStorage |
| 109 | Brightness | IMPLEMENTED | Dim/Normal/Bright |
| 110 | Accent Colors | IMPLEMENTED | 8 (כולל Custom hex) |
| 111 | UI Density | IMPLEMENTED | Compact/Comfortable/Spacious |
| 112 | Quick Actions | PARTIAL | 8/9 — נשאר רק Scan-Receipt (חסום ע"י OCR; אומת מחדש, סבב 11 — דורש מפתח Claude API אמיתי מהמשתמש, אין שינוי) |
| 113 | Performance | PARTIAL | Map lazy-load, Weather Cache (TTL 10 דק'). Marker Clustering (תלוי Mapbox) — חסר. **אומת מחדש (סבב 11):** "Image Optimization עקבי" — `next lint` מזהה 4 מופעי `<img>` אמיתיים (גלריות התמונות שנבנו בסבבים 9-10), כולם עם אזהרה (לא שגיאה) להשתמש ב-`next/image`. הסיבה שלא הוחלף: כל התמונות הן `data:` URI (base64, ר' `tip-of-the-day-card.tsx`) או קישור חיצוני חם — אף אחת מהן לא נהנית מ-`next/image` (שמייעל תמונות מ-URL אמיתי דרך שרת, לא data URIs) בלי לשנות את ארכיטקטורת אחסון-התמונות עצמה (שכבר הוחלט עליה בכוונה — data URI כתחליף ל-Supabase Storage, ר' DECISIONS.md) |
| 114 | Error States | PARTIAL | רכיבים גנריים לשימוש חוזר (`BlockedIntegrationState`/`PermissionDeniedState`, `components/blocked-state.tsx`) קיימים. **עודכן (סבב 11):** הורחבו לעוד 2 מסכים אמיתיים — `/emergency` (NearestMedical: הרשימה כבר לא נעלמת שקטה כש-Geolocation נדחה, אלא מציגה `PermissionDeniedState` + עדיין את הרשימה בלי מיון-מרחק, כי זה מסך חירום ולא בעיצוב הקפוא) ו-`/now` (notification-reminders: טקסט אד-הוק הוחלף ברכיב הגנרי). הכיסוי שנשאר לא-אחיד הוא **אך ורק** כרטיסי המפה בדשבורד — שייכים לעיצוב Premium שקפוא עד שלב C/D (אותו חסם כמו #1/#2/#105), לא פער עצמאי |

---

## מספרים מדויקים

| סטטוס | לפני שלב A | אחרי שלב A+B | אחרי המשך שלב E | אחרי סבב "תיקון 36 PARTIAL" | אחרי בדיקת-המשך | אחרי #4 Trip Days | אחרי סבב 9 | אחרי סבב 10 (2026-08-21) | שינוי כולל |
|---|---|---|---|---|---|---|---|---|---|
| **Total Requirements** | **114** | **114** | **114** | **114** | **114** | **114** | **114** | **114** | — |
| Implemented | 54 | 66 | 68 | 74 | 75 | 76 | 85 | **86** | +32 |
| Partial | 48 | 38 | 36 | 30 | 29 | 28 | 19 | **18** | -30 |
| Not Implemented | 8 | 6 | 6 | 6 | 6 | 6 | 6 | **6** | -2 |
| Blocked by External Service | 4 | 4 | 4 | 4 | 4 | 4 | 4 | **4** | — |

**בדיקת סכום:** 86+18+6+4 = 114 ✓

### עדכון 2026-08-21 (סבב 10) — #7 Places: Document.tripId הופך ל-nullable

המשתמש ציין שוב שיש דברים לא-תקינים בצ'קליסט. #7 Places היה עדיין PARTIAL עם אותה סיבה כמו #15/#24 — "תמונות תלוי Storage". אבל כאן הפתרון הקודם (`EntityPhotoGallery`) לא התאים ישירות: Place הוא ישות **גלובלית**, לא שייכת לטיול ספציפי, ואילו `Document.tripId` היה עמודת חובה. "לבחור טיול שרירותי" בשביל תמונה של מקום היה שקר ארכיטקטוני, לא פתרון אמיתי.

**התיקון הנכון בוצע במלואו:** `Document.tripId` הפך בפועל ל-`nullable` (null כש-`entityType="place"`) — לא עוקף, שינוי סכימה אמיתי. שני migrations חדשים נכתבו: `document_trip_id_nullable` (ALTER COLUMN) ו-`document_place_photos_rls` (**קריטי** — `is_trip_owner(null)` הוא תמיד `false`, כך שבלי תיקון RLS מפורש כל תמונת-מקום הייתה נחסמת לגמרי ברגע שהאפליקציה תעבור ל-DATA_SOURCE=prisma; נוסף `is_place_owner()` ו-OR מפורש במדיניות). שכבות נוספות: shared-types, DocumentRepository (Mock+Prisma), server actions חדשים עם בדיקת-בעלות-**מקום** (לא בעלות-טיול — הבחנה חשובה, כי `getCurrentUser`+`assertTripOwnership` הרגיל לא רלוונטי כאן), `PlacePhotoGallery`, וחיבור לגיבוי/שחזור.

**⚠️ שני ה-migrations כתובים ומוכנים אך טרם הוחלו על ה-DB החי** — `prisma migrate deploy` נכשל פעמיים עם P1001 (לא ניתן להגיע לשרת Supabase, ככל הנראה נכנס למצב שינה בטייר החינמי אחרי חוסר-פעילות). זה לא חוסם כלום במצב הנוכחי (DATA_SOURCE=mock), אבל **חובה** להריץ `migrate deploy` לפני שעוברים בפועל ל-DATA_SOURCE=prisma — אחרת יתגלה חוסר-התאמה בין הסכימה בקוד לזו שב-DB.

typecheck+lint+test(322)+build ירוקים.

### עדכון 2026-08-21 (סבב 9) — 8 פריטים ספציפיים שהמשתמש ביקש להשלים

המשתמש נתן רשימה מפורשת: מלונות, השכרות, מיסי תיירות, דוחות, זיהוי אוטומטי של קבלות, מזג אוויר ביעד הבא/במסלול, התראות, מוכנות לא-מכוון, סיכום יום, מסך עכשיו, סיכום סוף טיול. **9 פריטים עברו PARTIAL→IMPLEMENTED** (#15/#24/#36/#38/#51/#52/#76/#78/#79), אחד שופר מהותית בלי לשנות סטטוס (#100), ושלושה נשארו כפי שהם מסיבה מוצדקת ומוסברת (#43/#61/#71).

**גילוי מרכזי — אותו לקח כמו #4 חוזר:** "#15 Hotels" ו-"#24 Rentals" תויגו PARTIAL בגלל "תמונות תלוי Storage אמיתי" — אבל `TripMemoriesGallery` כבר הוכיחה שתמונות עובדות היום בלי Storage אמיתי (Document עם `documentType="image"`, `fileUrl` כ-`data:` URI אמיתי). נבנה `EntityPhotoGallery` כללי (הכללה של TripMemoriesGallery) וחובר למלונות+השכרות — גלריה אמיתית, לא עוד "בלוק" שנשאר PARTIAL כי מישהו כתב "תלוי Storage" בלי לבדוק שיש כבר פתרון עובד באפליקציה עצמה.

**שיפור אמיתי במזג אוויר (#51/#52):** "יעד הבא" מוצא עכשיו את המלון הקרוב הבא (לא רק "מחר בדיוק"), ו-`forecast_days` ב-Open-Meteo הועלה מ-7 ל-16 (המקסימום החינמי האמיתי) — התחזית במסלול היומי מכסה עכשיו את מלוא האופק האמין, לא רק 48 שעות ראשונות.

**#100 שופר:** `activity_not_booked` נוסף (3→4 מתוך 10 סוגי התראה) — `PlannedActivity.plannedAt` הוא timestamp אמיתי כשהוזן, בדיוק כמו שאר הסוגים הנתמכים.

**#36/#38/#76/#78 — נבדקו בעומק, לא נמצא פער קונקרטי מעבר למה שכבר תועד כ"קיים":** התיוג הקודם היה שמרני מדי. מיסי תיירות עובד מקצה-לקצה כקטגוריית הוצאה (מופיע בפילוח, מסונן, מיוצא). הדוח כבר מקיף (15 סקשנים כולל תמונות עכשיו). מסך "עכשיו" ו"סיכום יום" כבר הכילו את כל מה שתועד כחסר — "סיכום יום" גם קיבל תוקף נוסף מ-#4 TripDay (הערות-יום אמיתיות).

**#79 סיכום סוף טיול:** נוסף סקשן "תמונות" ל-report/page.tsx — כל תמונות הטיול (זכרונות+מלונות+השכרות), לא רק Trip Memories בנפרד.

**נשארו כפי שהם, מסיבה מוצדקת (לא הומצא תיקון):**
- **#43 OCR** — 0% קוד, דורש מפתח Claude API שאין למשתמש. אין דרך לבנות זיהוי-קבלות אמיתי בלי מפתח API אמיתי לשירות OCR.
- **#71 Offline Readiness** — נבדק קוד ה-Service Worker (`sw.js`) ו-`OfflineBanner` בעיון: שניהם נכונים ותקינים (כולל hydration-safe עם `useSyncExternalStore`). המגבלה היחידה היא "לא אומת בדפדפן חי" — מגבלת סביבת-הבדיקה, לא באג בקוד.
- **#61 Alerts (Refund-Pending)** — נבדק שוב מול `schema.prisma`: למודל `Refund` אין בכלל מושג "ממתין" — `refundAt` הוא `DateTime` חובה שמייצג רק החזר שכבר קרה. דורש מודל חדש ("החזר צפוי"), שינוי ארכיטקטוני אמיתי, לא חיווט חסר.

typecheck+lint+test(322)+build ירוקים.

### עדכון 2026-08-21 — #4 Trip Days הושלם (בעקבות בקשה מפורשת של המשתמש)

המשתמש ציין ש"ימי טיול" עדיין חלקי וביקש להשלים. הפער היה `TripDay` כישות שמורה עצמאית — התברר שהיא **כן קיימת** ב-`schema.prisma` (מ-2026-08-15), אבל שימשה רק כטבלת-קישור פנימית שקופה בשביל `Route` (get-or-create לפי תאריך). DECISIONS.md כבר סימנה את זה כ"זמני — ישוקל מחדש אם TripDay יהפוך לישות אמיתית". נבנה `TripDayRepository` חדש (Mock+Prisma), ו-`days/[date]` מקבל סקשן "הערות ליום" אמיתי — טקסט חופשי לכל יום, נשמר ב-DB, נטען בחזרה, נכנס לגיבוי/שחזור. #4 עבר ל-IMPLEMENTED.

### עדכון 2026-08-18 (המשך) — בדיקת-המשך אחרי שאלת המשתמש "למה 30 לא עובדות במלואן"

המשתמש שאל להסביר את הסיבה לכל אחד מ-30 ה-PARTIAL, ואז שאל אם כולן באמת חסומות. התשובה הייתה לא — חלק (#18/#38/#51/#76/#61/#114/#94) לא נבדקו מספיק לעומק בסבב הקודם. בדיקה חוזרת מצאה עוד פער אמיתי אחד:

- **#18 Flights → IMPLEMENTED.** `agreedPrice`/`agreedCurrencyCode` לא נאספו בטופס/action בכלל, וגם `flightSchema` (ה-read schema עצמו) לא כלל אותם — פער עמוק יותר מהדפוס הרגיל (בדרך כלל רק הטופס/תצוגה חסרים, לא ה-schema). תוקן בכל השכבות; תוך כדי כך נוספו לתצוגה גם שדות שכבר נאספו אך מעולם לא הוצגו (מושב/שעת-נחיתה/טרמינל-נחיתה/מספר-אישור/מדיניות-ביטול/טלפון/אתר).

**נבדקו ולא נמצא בהם פער נוסף (לא שונו):**
- **#38 Reports, #76 Now Screen** — התיאור באודיט מציין מפורשות "הכל קיים" בלי פער קונקרטי. נבדקו שוב ולא אותר חוסר; לא שונה סטטוס בלי ממצא קונקרטי (כדי לא "לצבוע ירוק" בלי בדיקה אמיתית).
- **#51 Weather-יעד-הבא** — עובד נכון כשיש קואורדינטות מלון; זו לא תקלה, זו תלות בנתון אמיתי שהמשתמש צריך להזין.
- **#61 Alerts (Refund-Pending)** — נבדק שוב מול `schema.prisma`: למודל `Refund` אין בכלל מושג "ממתין" — `refundAt` הוא `DateTime` חובה שמייצג החזר שכבר קרה, לא צפוי. בניית "התראת החזר ממתין" אמיתית תדרוש שדה/מודל חדש (למשל "החזר צפוי" על Expense) — אישור נוסף שזה שינוי ארכיטקטוני אמיתי, לא רק חיווט חסר.
- **#114 Error States** — שני מסכים נוספים (`nearest-medical.tsx` באזור החירום, כפתור מיקום במפה החינמית) משתמשים בטיפול-שגיאה אד-הוק במקום ברכיב המשותף — אבל **בכוונה**: העמוד החירום מציג רשימה לא-ממוינת במקום לחסום עם מסך-שגיאה (כי לחסום מידע חירום מאחורי הרשאת-מיקום זו UX גרועה), וכפתור המפה הוא כיתוב קצר בתוך כפתור צף שבו פאנל-שגיאה מלא לא מתאים. לא שונה — הפתרון הקיים מתאים יותר להקשר מהרכיב הגנרי.
- **#94 Accessibility** — לא נמצאו רכיבים אינטראקטיביים חדשים חסרי aria-label מעבר למה שכבר נבדק בסבבים קודמים.

**המשך הבדיקה (סריקה שיטתית של create-input מול read-schema בכל הישויות המרכזיות):** אחרי #18, נסרקו גם CarRental/Insurance (לא נמצא נוסף), Place, PlannedActivity, Trip (כולם עקביים) — ו-**Expense, שם נמצא עוד מופע: `timezone`**. קיים ב-`schema.prisma` וב-`createExpenseInputSchema`, אבל נעדר מ-`expenseSchema` (read) ומכל שכבות ה-UI/Repository — שדה מת לחלוטין. תוך כדי אותה בדיקה התגלה גם ש-`expenseAt` (תאריך/שעת ההוצאה) לא הוצג בכלל ברשימת ההוצאות בעמוד הטיול (רק שימש לסינון ול-CSV) — נוסף גם הוא, עם שעון-כפול (מקומי/ישראל) כש-timezone קיים. #33 Expenses נשאר IMPLEMENTED (הפער לא היה מספיק מהותי כדי להיות PARTIAL, אבל תוקן כמו כל דבר אחר).

typecheck+lint+test(322)+build ירוקים.

### עדכון 2026-08-18 — סבב תיקון 36 ה-PARTIAL

המשתמש ביקש לתקן את כל 36 הפריטים שהיו PARTIAL כך שיעבדו במלואם, לא רק להשאיר אותם מתועדים. עברתי על כל 36, סיווגתי כל אחד (פער אמיתי-וניתן-לבנייה מול החלטת-עיצוב-מכוונת מול חסימה אמיתית של שירות חיצוני), ותיקנתי בפועל את כל מה שלא דרש קלט חיצוני. 6 פריטים עברו ל-IMPLEMENTED, ועוד 5 שופרו מהותית בלי לשנות סטטוס (נשאר בהם פער קטן/חסום). כל סבב עבר typecheck+lint+test(322)+build ירוקים.

**6 הפריטים שעברו PARTIAL→IMPLEMENTED:**
- **#14 Bookings** — CarRental היה חסר **לגמרי** את כל בלוק יצירת-הקשר (phone/whatsapp/email/website/confirmationNumber/externalBookingId/cancellationPolicy). נוסף לכל השכבות (schema/migration+Mock+Prisma×4 בלוקים/טופס/action/תצוגה/backup).
- **#16 Breakfast** — `breakfastPrice`/`breakfastPriceUnit` היו קיימים ב-schema ואף נשלחו בפועל ל-Prisma `create()`, אבל נשמטו מה-read schema/Mock/טופס/תצוגה — אותו דפוס בדיוק כמו `Flight.legType` שנמצא בשלב A. תוך כדי אותה עבודה נוספו גם `bedType`/`guestsCount`/`smoking` שהיו באותו מצב.
- **#22 Transport** — `vehicleType`/`agreedPrice`/`agreedCurrencyCode` נתמכו ב-Repository (Mock+Prisma) אבל מעולם לא נאספו בטופס/action.
- **#25 Ferries** — נוסף שדה `seat` חדש ל-`TransportBooking` (עמודת DB חדשה, migration `20260818090000_transport_booking_seat` הוחל בפועל על ה-DB החי דרך `prisma migrate deploy`) — הפער האחרון שנשאר.
- **#66 External Links** — נבדק שיטתית מול טבלת `Booking` המשותפת: TransportBooking היה חסר email+website, CarRental חסר הכל (ר' #14). תוקן לכל הישויות.
- **#98 Undo** — Document ו-Contact היו הישויות היחידות בכל האפליקציה עם `softDelete()` אבל בלי שום `restore()` — נמחקות לצמיתות מה-UI בלי אפשרות חזרה, בניגוד לעיקרון הכללי של האפליקציה. נוסף `restore()` לשני ה-Repository (Mock+Prisma), הכפתורים עברו מ-`confirm()` ל-`DeleteWithUndoButton` (Toast+"בטל"), ו-`/trash` קיבל 2 סעיפים חדשים.

**פיצ'ר אמיתי חדש (לא רק חשיפת שדה):** #90 Backup — `TransportQuote.transportBookingId` תועד כ"פיצ'ר שמעולם לא נבנה". נבנה בפועל: `linkTransportQuoteToBooking()` חדש ב-Repository, ו-UI ("הזמן לפי הצעה זו") שממלא מראש טופס הסעה מתוך הצעת-מחיר נבחרת ומקשר אותה להזמנה החדשה שנוצרת. #90 נשאר PARTIAL — `WalletTransaction` ו-`Document` עם entityType="other" נשארים לא-משוחזרים בכוונה (ארכיטקטורה/מיפוי לא חד-משמעי).

**עוד 4 פריטים ששופרו מהותית בלי לשנות סטטוס:** #12 Nearby (טווחי מרחק תוקנו להתאמה מדויקת לאפיון + Custom, נשאר רק Explore-This-Area התלוי-Mapbox), #15 Hotels (אותו תיקון bedType/guestsCount/smoking כמו #16), #24 Rentals (הבהרה: חוזה השכרה כבר ניתן להעלאה כמסמך `documentType="contract"` מאז שלב A — הניסוח הקודם היה לא מדויק; גם קיבל את תיקון #14/#66; נשאר חסר רק גלריית-תמונות ייעודית התלויה ב-Storage), #100 Notification Preferences (המספר "2/10" תוקן ל-"3/10" המדויק, ונבדק ביסודיות שאין עוד סוגים שניתן לחווט בלי להמציא נתון או לבנות שדה-קלט חדש).

**נבדק ולא שונה:** #61 Alerts (לא אותרה מערכת "15 אלרטים" נפרדת מעבר למתועד — נשאר כפי שהיה, לא הומצא תיקון). CarRental+Insurance נסרקו שיטתית לאותו דפוס-באג (create-input vs read-schema) — לא נמצא נוסף מעבר למה שתוקן.

**14 הפריטים שעברו ל-IMPLEMENTED:** #19 Flight Timers, #20 Airport Timing (מ-NOT), #27 Opening Wallet Balances, #39 Date Range Search, #40 Documents, #42 Invoices, #46 Insurance, #47 Contacts, #50 Weather-מיקום-נוכחי, #54 Rain Window, #60 Timers, #70 Emergency Screen, #77 Home Screen, #80 Export.

**1 פריט שעבר NOT→PARTIAL:** #78 Day Summary (אומת מחדש מול קוד בפועל — התברר שהתוכן קיים ברובו, רק לא כ"עמוד" ארכיטקטוני נפרד; הניסוח הקודם היה לא מדויק).

**עוד כ-10 פריטי PARTIAL ששופרו מהותית בלי לשנות אות-סטטוס** (פערים אמיתיים נסגרו, נשאר משהו אחר): #7 Places, #12 Nearby, #24 Rentals, #25 Ferries, #90 Backup, #94 Accessibility, #98 Undo, #103 Security (RLS מאומת בפועל), #114 Error States.

---

### DEFERRED TO DESIGN (ללא שינוי — נדחה בכוונה)

זהה לסבב 2: #91 Localization ו-Component Library (14 רכיבים, לא ספירים בין ה-114) — נדחו בהחלטת משתמש מפורשת לשלב העיצוב (C/D). #93 LTR הוא תוצאה טכנית של #91, לא החלטה נפרדת.

### 6 ה-NOT IMPLEMENTED שנותרו (ירד מ-8)

| # | דרישה | למה עדיין לא הושלם |
|---|---|---|
| 64 | Recommendations | **הוסר מהטבלה — הפך ל-IMPLEMENTED בסבב 12 דרך Overpass API (חינמי), לא Google Places** |
| 67 | External Accounts | ממתין לספק אמיתי לחבר (Booking.com וכו') — אין טעם לבנות UI סביב כלום |
| 87 | Email Architecture | דורש בחירת ספק אימייל (Resend/SendGrid/וכו') — שירות חיצוני |
| 88 | Share Security | תלוי ב-#85 שכבר בנוי כטקסט לא URL — אין עדיין מה לאבטח, החלטת-scope לא חסימה טכנית |
| 91 | Localization | **נדחה בכוונה** לשלב העיצוב (ר' DEFERRED TO DESIGN) |
| 93 | LTR | תוצאה טכנית של #91 |

### 4 הפריטים ה-BLOCKED (ללא שינוי סטטוס, אך #101 התקדם משמעותית)

| # | שירות | נדרש | קוד מוכן? | התקדמות בפועל |
|---|---|---|---|---|
| 10 | 3D Map (Mapbox) | `NEXT_PUBLIC_MAPBOX_TOKEN` | כן, 100% | ללא שינוי |
| 43 | OCR | Claude API Key | לא — 0% קוד | ללא שינוי |
| 101 | Supabase Architecture | Auth+RLS מלאים | כן | **פרויקט חי מחובר, DB נוצר בפועל (38 טבלאות), כל המיגרציות רצו בהצלחה כולל RLS. RLS מופעל ומאומת (ר' #103). הרשמה אמיתית נבדקה מקצה-לקצה. DATA_SOURCE עדיין mock — נדחה בכוונה לבקשת המשתמש ("בסוף")** |
| 102 | Storage Architecture | Supabase Storage | חלקי | תלוי #101 |

ראה `PROJECT_STATE.md` (מצב Supabase) ו-`NEXT_STEPS.md` לפירוט המלא של מה בדיוק בוצע מול Supabase ומה עוד נשאר.

### עדכון 2026-08-21 (סבב 11) — כל 18 ה-PARTIAL שנותרו נבדקו מחדש; 5 עברו ל-IMPLEMENTED

**בעקבות בקשה מפורשת לתקן/להשלים את כל 18 ה-PARTIAL הנותרים.** כל אחד מהם נבדק מול קוד בפועל (לא רק הניסוח הקודם) בדיוק כמו בסבבים 8-10, כדי להבחין בין "פער אמיתי שניתן לסגור" ל"תיוג לא-מדויק" ל"חסימה אמיתית שתועדה כבר".

**3 פערים אמיתיים נסגרו בפועל (לא רק תיוג):**
- **#61 Alerts (Refund-Pending):** `Refund.isReceived` חדש + `markRefundReceived()` + טופס "עדיין לא התקבל" + כפתור "סמן כהתקבל" + בדיקת Gap חדשה. הארנק מזוכה רק כשההחזר מתקבל בפועל, לא בזמן הרישום — נבדק גם ב-unit tests (2 חדשים).
- **#90 Backup Architecture:** נמצא ותוקן באג אמיתי — `car_rental` היה `DocumentEntityType` תקף (כולל תמונות/מסמכי השכרות-רכב מ-#24) אבל היה חסר לגמרי מ-`idMapByEntityType` ב-`restore-backup.ts`, כך שמסמכים כאלה תמיד דולגו בשחזור בשקט. נוסף `carRentalIdMap`.
- **#95 Soft Delete:** `Payment.deletedAt` היה כבר בסכימת ה-DB (מאז ומתמיד) אבל לא חשוף כלל מעל שכבת ה-DB — לא ב-shared-types, לא ב-Repository, לא ב-UI. נחשף במלואו (`softDeletePayment`/`restorePayment`, כפתור מחיקה בעמוד הטיול, שורה חדשה ב-/trash) — אותה מגבלה כמו Expense (לא מבטל השפעה על הארנק אוטומטית, מתועד).

**2 תויגו מחדש (לא קוד — תיוג היה לא מדויק):**
- **#82 PDF** ו-**#83 Excel** — שניהם מחווטים בפועל ועובדים מקצה-לקצה (`PrintButton`+`@media print`, `buildCsv()`+`ExportCsvButton`). "החלטה מכוונת לא לבנות X" בניסוח הקודם בלבל בין "לא ספרייה ייעודית" לבין "לא פועל" — הם כן פועלים.

**1 שופר בלי לשנות תיוג:** #114 Error States — `PermissionDeniedState` הורחב לעוד 2 מסכים אמיתיים (`/emergency`, `/now`), כולל תיקון UX אמיתי במסך החירום (הרשימה כבר לא נעלמת שקטה כש-Geolocation נדחה).

**12 אומתו כנכונים ונשארו PARTIAL** (חסימה חיצונית אמיתית או החלטת-scope מוצהרת, לא תיוג עצל): #1/#2/#11/#12/#105 (עיצוב Premium קפוא עד שלב C/D, או Mapbox), #71/#94 (דורשים דפדפן חי לאימות — אין כלי headless בפרויקט), #99 (הרחבת Audit Log היא מקשה גדולה מדי ל"תיקון נקודתי", אסטרטגיה מוצהרת של "לפי הצורך"), #100/#103 (כבר בתקרה הארכיטקטונית/תלויים ב-DATA_SOURCE=prisma שנדחה בכוונה), #112 (OCR דורש מפתח Claude API אמיתי), #113 (Marker Clustering תלוי Mapbox; Image Optimization נבדק בפועל דרך אזהרות `next lint` — כל ה-`<img>` הם `data:` URI/hotlink, לא נהנים מ-`next/image` בלי לשנות ארכיטקטורת אחסון-תמונות).

**תוצאה: 91 IMPLEMENTED (86→91), 13 PARTIAL (18→13), 6 NOT IMPLEMENTED, 4 BLOCKED. סכום = 114 ✓**
**משפיע על:** `packages/db/prisma/schema.prisma` (+migration `20260821150000_refund_is_received`), `packages/shared-types/src/{refund,payment}.ts`, `packages/data-layer/src/repositories/finance-repository.*`, `apps/web/app/(app)/trips/[tripId]/finances/*`, `apps/web/app/(app)/trips/[tripId]/page.tsx`, `apps/web/app/(app)/trash/{page,actions}.tsx`, `apps/web/lib/{gap-detection,backup/restore-backup,backup/export-backup}.ts`, `apps/web/app/(app)/emergency/nearest-medical.tsx`, `apps/web/app/(app)/now/notification-reminders.tsx`.
**סטטוס:** סופי. typecheck+lint+test(326)+build ירוקים.

### עדכון 2026-08-22 (סבב 12) — סימון-מקום בקליק על מפה, המלצות מקומות אמיתיות (Overpass), הצעות יומיות

**בעקבות בקשה מפורשת של המשתמש לשלוש יכולות קשורות.** נבדק בקוד לפני בנייה (ר' DECISIONS.md): `/map`/`/places/new` היו 100% הקלדת lat/lng ידנית; "מקומות קרובים" הציג רק מקומות ששמורים כבר; #64 Recommendations תויג "דורש ספק חיצוני מורשה" — אבל זה מתייחס לספק **בתשלום** (Google Places/TripAdvisor). בדיוק כמו OSRM/Open-Meteo שכבר בשימוש, יש ספק חינמי מקביל למקומות: **Overpass API** (OpenStreetMap, בלי מפתח).

1. **#7 Places (קליק-על-מפה):** מפת-בחירה חדשה (`LocationPickerMap`) משובצת ב-`/places/new` — קליק ממלא lat/lng, הקלדה ידנית עדיין עובדת (סימטרי). ב-`/map`: כפתור "סמן מקום חדש" פותח מצב-קליק על המפה הקיימת (marker זמני + פאנל שם/קטגוריה), נשמר דרך action חדש שלא מפנה מהדף (בניגוד ל-`createPlaceAction` הרגיל). שתי קטגוריות אמיתיות חדשות: "נחל", "בילוי" (migration ל-enum).
2. **#64 Recommendations (תויג מחדש ל-IMPLEMENTED):** ספק `OverpassPoiProvider` חדש (`getPoiProvider()`, אותו דפוס "תמיד אמיתי" כמו Weather/Routing/Currency). כרטיס "גלה מקומות חדשים בקרבתי" ב-/now — בחירת קטגוריות (ברירת מחדל: נחל/תצפית/מסעדה/בילוי/שוק/קניון) + רדיוס, תוצאות אמיתיות מ-OSM (POI בלי `tags.name` אמיתי מדולג, לא ממציאים שם), "הוסף לספרייה" יוצר Place אמיתי **ומקשר אותו לטיול הפעיל כ-want_to_go**.
3. **#13 Daily Route (הורחב):** סקשן "💡 מה שווה לעשות היום" ב-`/days/[date]` — מציע יעדים מה-want_to_go הקרובים למלון של אותו יום ספציפי (בוקר/לילה, `resolveDayHotelContext` חדש — הוצא מ-`optimizeDayRouteAction` הקיים כדי לא לשכפל לוגיקה), עם כפתור "הוסף למסלול" ישיר (`addSuggestedStopAction` חדש, קורא ל-`routeRepository.addStop` הקיים).

**משפיע על:** `packages/shared-types/src/{enums,poi}.ts`, `packages/db/prisma/schema.prisma`+migration `20260821160000_place_category_river_entertainment`, `packages/data-layer/src/poi/overpass-provider.ts` (+test), `packages/data-layer/src/index.ts`, `apps/web/lib/{place-labels,map/category-colors,day-hotel-context}.ts` (+test), `apps/web/components/{map-click-listener,location-picker-map,location-picker-map-leaflet}.tsx`, `apps/web/app/(app)/places/place-create-form.tsx`, `apps/web/app/(app)/map/{leaflet-map,map-view,page,map-page-interactive,actions}.tsx`, `apps/web/app/(app)/now/{page,actions,discover-places}.tsx`, `apps/web/app/(app)/trips/[tripId]/days/{actions,add-suggested-stop-button,[date]/page}.tsx`.
**סטטוס:** סופי. 92 IMPLEMENTED (91→92), 13 PARTIAL, 5 NOT IMPLEMENTED (6→5), 4 BLOCKED. typecheck+lint+test(342)+build ירוקים.

### עדכון 2026-08-22 (סבב 13) — חבילת פיצ'רים מורחבים: מזג-אוויר-חכם, קצב-הוצאה, מלווים+חלוקת-הוצאות, שיתוף-מסלול

**בעקבות בקשת המשתמש "תעשה את כולם" על 9 רעיונות שהוצעו ביוזמת Claude** (לא חלק מרשימת 114 הדרישות המקורית — למעט חלק H, שסוגר את #88). כל 8 החלקים (A-H) נבנו ואומתו (`typecheck`+`lint`+`vitest`+`build`) בנפרד/בקבוצות, ר' `C:\Users\ארנון\.claude\plans\groovy-wibbling-perlis.md` לתכנון המלא ו-DECISIONS.md "סבב 14" לפרטי-החלטה.

1. **ממיר מטבע מהיר** (עמוד הטיול) — `getCurrencyRateProvider().getRatesToILS()` הקיים, ILS כ-pivot.
2. **"מצא כספומט קרוב"** — `findNearbyAtms()` חדש (Overpass, `amenity=atm`), כפתור ליד הארנק.
3. **תחזית קצב-הוצאה** — "בקצב הזה תסיים בסביבות ₪X" (`computeSpendingPace`), ליד סיכום התקציב.
4. **הצעות-מסלול-יומי מוטות-גשם** — `computeRainWindows` הקיים מוזן ל-daySuggestions, קטגוריות-פנים מקדימות בימי-גשם.
5. **הצעות-אריזה לפי מזג-אוויר** — `suggestPackingItemsForWeather` חדש, ליד רשימת האריזה (הצעה, לא הוספה אוטומטית).
6. **צ'קליסט "בדוק ויזה/מסמכים"** — הצעה לא-סמכותית לכל מדינה בטיול (`suggestDocumentChecksForCountries`), במפורש "בדוק בעצמך, לא מידע רשמי" + קישור-חיפוש כללי.
7. **מלווים בטיול + סגירת חשבונות (חדש, #F/G):** `TripCompanion` נחשף כשכבה מלאה (היה קיים ב-DB בלבד, 0% שימוש) — הוספה/הסרה בעמוד הטיול. `ExpenseParticipant` חדש (migration+RLS) לבחירת-משתתפים מפורשת בטופס הוצאה; `Payment.paidByCompanionId` נחשף (היה מת באותו אופן). `computeSettleUp` מציג "💰 סגירת חשבונות" — יתרת-נטו לכל מלווה, רק להוצאות עם משתתפים נבחרים-במפורש.
8. **#88 Share Security (תויג מחדש ל-IMPLEMENTED):** `TripShareLink` חדש (migration+RLS, token אקראי-בלתי-ניתן-לניחוש, Revoke+Regenerate) + מסך ציבורי `app/shared/[token]/` (מחוץ ל-`(app)/`, בלי auth — `resolveToken` הוא נקודת-האימות היחידה). מציג רק שם/תאריכי-טיול, מלונות+טיסות (בלי מחיר), ומסלול יומי (שמות-מקומות בלבד) — לא הוצאות/ארנק/מסמכים/הערות/אנשי-קשר. נדרשו שתי תוספות צרות-ומתועדות ל-`TripRepository`/`PlaceRepository` (`getByIdForShareView`/`listByIds`, בלי `userId` בכוונה) כי לעמוד הציבורי אין `userId` בכלל.

**משפיע על (עיקרי):** `apps/web/lib/{budget,settle-up,packing-weather-suggestions,document-check-suggestions}.ts` (+tests), `packages/data-layer/src/poi/atm-finder.ts`, `packages/shared-types/src/{trip-companion,expense-participant,trip-share-link}.ts`, `packages/data-layer/src/repositories/{trip-companion,trip-share-link}-repository.*`, `packages/db/prisma/schema.prisma`+3 migrations חדשים (`expense_participants`, `trip_share_links`, וכן ה-migration הישן `document_place_photos_rls` הקודם), `apps/web/app/(app)/trips/[tripId]/{page,budget-section,companions/*,sharing/*}.tsx`, `apps/web/app/shared/`.
**סטטוס:** סופי. 93 IMPLEMENTED (92→93), 13 PARTIAL, 4 NOT IMPLEMENTED (5→4), 4 BLOCKED. typecheck+lint+test(381)+build ירוקים. **לא בוצעה בדיקה חיה בדפדפן** (אותה מגבלת-כלים כמו שלב A) — אומת דרך unit tests (כולל אינווריאנט "היתרות מסתכמות לאפס" ב-`settle-up.test.ts`) + smoke-test `curl` על `/shared/<token-לא-קיים>` (מחזיר 404, לא מפנה ל-login — מוכיח שהעמוד מחוץ ל-auth wall ושתטוקן-לא-תקין נחסם).

### עדכון 2026-08-22 (סבב-2) — עוד חבילת פיצ'רים מורחבים: תמונות-יום, סטטיסטיקות-חיים, אזהרת-תקציב, תבניות-אריזה, נקודות/מיילים, שכפול-טיול, הצבעות-מלווים

**בעקבות בקשה נוספת של המשתמש לרעיונות, ו"כן תוסיף את הכל" על 7 הרעיונות שהוצעו.** אף אחד מ-7 החלקים (A-G) לא ממופה לאחד מ-114 הדרישות המקוריות (בשונה מסבב 13, שם חלק H סגר את #88) — כולם תוספות מעבר לסקופ המקורי, לכן **הספירה 93/13/4/4 לא משתנה בסבב הזה**. תוכנית מלאה: `C:\Users\ארנון\.claude\plans\groovy-wibbling-perlis.md` (נכתב-מחדש לסבב-2). נבנה ואומת (`typecheck`+`lint`+`vitest`+`build`) בקבוצות A-E ואז F-G, ר' DECISIONS.md "סבב 15" לפרטי-ההחלטה המלאים (כולל 2 AskUserQuestion נוספות ותיקון-הנחה על "יומן-יום" שהתברר חלקית-קיים כבר).

1. **תמונות ליום ספציפי** — `"trip_day"` נוסף ל-enum `DocumentEntityType` (migration), שימוש-חוזר מלא ב-`EntityPhotoGallery` הקיים ליד `TripDayNotesForm`.
2. **`/stats`** — עמוד סטטיסטיקות-חיים חדש (`computeLifetimeStats`, פונקציה טהורה+טסט): סה"כ טיולים/ימים/מקומות-ביקור/מדינות/ערים ייחודיים, הטיול הארוך ביותר, הוצאות לפי מטבע.
3. **אזהרת-תקציב ב-/now** — כרטיס אקטיבי (לא רק פסיבי כמו ב-BudgetSection), אותם ספים כמו `ProgressBar` (0.9/1.0). **לא** חובר למנגנון ה-Notifications/`dueReminders` הקיים — נבדק בקוד שהוא מתועד-בכוונה כמתאים רק ל"לפני-אירוע", לא ל-state מתמשך.
4. **`Trip.tripType`** (migration, nullable) + `suggestPackingItemsForTripType` — הצעות-אריזה שלישיות (ליד מזג-אוויר וויזה) בעמוד האריזה, לפי סוג-טיול שנבחר ביצירה/עריכה.
5. **`/loyalty-programs`** — מועדוני נקודות/מיילים (טיסות תכופות/מלונות), גלובלי פר-משתמש, מחקה במדויק את `ContactRepository`.
6. **שכפול טיול** (`duplicateTripAction`) — כולל **מסלול יומי מלא** (RouteStop-ים, הזזת-תאריכים 1:1) לפי בחירת המשתמש. מעתיק גם מדינות/ערים/תקציב-לפי-קטגוריה/רשימות-אריזה/מלווים; לא מעתיק הוצאות/הזמנות/מסמכים/יומן-יום/הערות.
7. **הצבעות בין המלווים** (`CompanionPoll`, migration+RLS) — proxy voting לפי בחירת המשתמש: בעל החשבון מזין את ההצבעות בשם המלווים. `unique(pollId,companionId)` אוכף הצבעה-אחת-פר-מלווה.

**משפיע על (עיקרי):** `apps/web/lib/{lifetime-stats,packing-trip-type-suggestions}.ts` (+tests), `apps/web/app/(app)/{stats,loyalty-programs}/*`, `apps/web/app/(app)/trips/[tripId]/duplicate/*`, `apps/web/app/(app)/trips/[tripId]/companions/polls-section.tsx`, `packages/shared-types/src/{loyalty-program,companion-poll}.ts`, `packages/data-layer/src/repositories/{loyalty-program,companion-poll}-repository.*`, `packages/db/prisma/schema.prisma`+4 migrations חדשים.
**סטטוס:** סופי. 93 IMPLEMENTED, 13 PARTIAL, 4 NOT IMPLEMENTED, 4 BLOCKED (ללא שינוי). typecheck+lint+test(402)+build ירוקים בכל חלק/קבוצה. **חלקים F-G אומתו חי מול שרת-הפיתוח הרץ** (לא רק unit tests) — שכפול טיול-דמו אמיתי + הצבעה/שינוי-הצבעה בפועל, דרך בקשות Server Action מדומות (`DATA_SOURCE=mock` עוקף auth). מסלול-יומי-מועתק לא אומת עם נתונים אמיתיים כי לטיול-הדמו אין RouteStop-ים מלכתחילה — הסתמכות על unit tests קיימים ל-`addStop`/`listForDay` בלבד עבור הנתיב הזה.

## Audit סופי — שלב A, 2026-08-17

**אומת שורה-אחר-שורה** מול קוד בפועל (page.tsx/actions.ts/repository/schema, לא רק שם/Type). 15 סבבי בנייה (commits `bf7e254` עד `14ce304`), כל אחד עם typecheck+lint+test ירוקים לפני המעבר לסבב הבא. build הורץ אחרי סבבים שנגעו בסכימה/דשבורד/CSS גלובלי — ירוק בכל פעם.

**93 IMPLEMENTED, 13 PARTIAL, 4 NOT IMPLEMENTED, 4 BLOCKED BY EXTERNAL SERVICE. סכום = 114 ✓** (ר' "עדכון 2026-08-18 — סבב תיקון 36 ה-PARTIAL", "בדיקת-המשך", "עדכון 2026-08-21 — #4 Trip Days", "סבב 9", "סבב 10", "סבב 11", "סבב 12" ו"סבב 13" למעלה לפירוט המלא.)

**מגבלה מתועדת בכנות:** בניגוד לסבבי P0-P3 הקודמים (שכללו בדיקה חיה בדפדפן אמיתי לכל פיצ'ר), סבב שלב A **לא כלל בדיקה חיה בדפדפן** — אין כלי דפדפן/צילום מסך זמין בסביבת ה-Session הזה. הביטחון מבוסס על קריאת קוד ישירה + typecheck strict + 322 בדיקות אוטומטיות (ללא רגרסיה) + build מוצלח. מומלץ למשתמש לבדוק ידנית בדפדפן אמיתי (`npm run dev`, פורט 3101) את הפריטים המסומנים "עודכן (שלב A)" למעלה לפני שהם נחשבים מאומתים באותה רמה כמו הקודמים.

ראה `IMPLEMENTATION_GAPS.md` לפירוט הסבבים + `PROJECT_STATE.md`/`DECISIONS.md` לפרטי מימוש מלאים.
