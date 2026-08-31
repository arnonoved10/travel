# IMPLEMENTATION_GAPS.md — סבב 3 (2026-08-16, אחרי בניית P0 מלאה)

נגזר מ-`FEATURE_AUDIT.md` (114 פריטים). **P0 הושלם** — 9 קבוצות עבודה, commits `a60061f`...`25b3978` (רשימה מלאה למטה). המסמך המקורי שתיאר "מה חסר ב-P0" נשמר בהיסטוריית Git (commit `25cb9e2` ולפניו) למי שרוצה את הפירוט המקורי לפני הבנייה.

## P0 — כל 9 הקבוצות הושלמו

| # | קבוצה | Commit | מה נבנה |
|---|---|---|---|
| 1 | שדות משניים להזמנות + Booking Benefits | `a60061f` | floor/view/breakfast למלון, terminal/baggage לטיסה, ETA/tolls/parking לתחבורה, cancellationPolicy חדש ב-Booking, Booking Benefits מלא (Types+Repository+UI) |
| 2 | מסמכים לכל סוגי הזמנה + מרכז מסמכים | `4b16a34` | EntityDocumentSection (5 סוגי ישות במקום Expense בלבד), סקשן #document-center עם סינון |
| 3 | סיכום יום (Day Summary) | `c944b9b` | סקשן חדש ב-days/[date] — לילה/טיסות/הסעות/הוצאות/תכנון לאותו תאריך |
| 4 | Weather Alerts + Timeline + יעד הבא | `f7f78c8` | weather-alerts.ts, תחזית ליד כל עצירת מסלול, תחזית ליעד-הבא ב-/today, HotelStay.lat/lng+address נוספו |
| 5 | מזג אוויר + Rain Alert ב-/now | `4f4c19a` | כרטיס חדש, אותו קוד כמו /today |
| 6 | 5/8 סוגי Alert חסרים + checkInTime/checkOutTime | `d46bc60` | Low-Cash-Balance, Deposit-Return-Overdue, Document-Missing ב-gap-detection.ts; checkout_approaching מחובר לתזכורות |
| 7 | כפתור "המיקום שלי" ב-/map | `6676871` | Geolocation+flyTo+נקודה כחולה, Leaflet (חינמי) |
| 8 | מסך חירום (/emergency) | `62a14e6` | מספרי חירום לפי מדינה, פרטי ביטוח, טלפון מלון, אנשי קשר, בית חולים/מרקחת קרובים |
| 9 | Print/PDF (דרך הדפדפן) + CSV | `25b3978` | Print CSS גלובלי, PrintButton, csv-export.ts, ExportCsvButton |

**מה נשאר לא-פתור בכוונה מתוך P0 המקורי (תועד בכל commit רלוונטי, לא נשכח):**
- ~~Budget Alert (סוג Alert #12/15)~~ — **נבנה ב-P1 סעיף 2** (`faf92d3`).
- ~~Rain During Planned Activity (סוג Alert #13/15)~~ — **נבנה ב-P2** (`b71347c`, `detectRainDuringActivities`).
- Refund Pending (סוג Alert #15/15) — היה דורש לשנות את המשמעות הקיימת של Refund (היום תמיד "כבר התקבל") — שינוי ארכיטקטוני, לא רק חיווט Alert; לא בוצע בלי דיון נפרד. **היחיד מ-15 סוגי ה-Alert שנשאר לא-קיים בכוונה.**
- ~~Show Proof of Payment (#45)~~ — **נבנה ב-P1 סעיף 7** (`35dda62`).
- 3D Map, OCR, Supabase/Storage — **עדיין BLOCKED BY EXTERNAL SERVICE**, כצפוי.

---

## P1 — הושלם (11/11, 2026-08-17)

| # | פריט | Commit | מה נבנה |
|---|---|---|---|
| 1 | Time Zones בפועל | `d2c88f9` | `apps/web/lib/dates.ts` חדש (`Intl.DateTimeFormat`), שולב בתצוגת טיסות ב-3 מסכים |
| 2 | Budget (Trip/Daily/Category) | `faf92d3` | `Trip.totalBudgetAmount`/`dailyBudgetAmount` + `BudgetCategoryLimit` חדשים (תמיד ב-₪), UI progress bar חי, Budget Alert (מתקרב/חריגה) מחובר ל-detectGaps — סוגר גם את ה-Budget Alert שנדחה בכוונה מ-P0 |
| 3 | Calendar | `056e5ce` | `/trips/[tripId]/calendar` — תצוגת חודש עם כל סוגי האירועים, כל יום מקושר לסיכום היום הקיים (days/[date]) |
| 4 | Wallet Reconciliation | `9796fe9` | `reconcileWallet` (Mock+Prisma) + `WalletTxType.adjustment` + טופס בכל כרטיס ארנק |
| 5 | Global Search מורחב | `6064a28` | `searchAllEntities` — Place/Contact/HotelStay/Flight/TransportBooking/Expense/Document, תוצאות מקובצות לפי סוג עם קישור ישיר |
| 6 | Packing List + Before Trip Checklist | `9468f58` | `ChecklistItem` חדש (listType=packing/before_trip) + `/trips/[tripId]/packing` — checkbox אוטומטי, קיבוץ לפי קטגוריה לרשימת אריזה |
| 7 | Show Proof of Payment (#45) | `35dda62` | `<details>` עם רשימת תשלומים (סכום/אמצעי/כרטיס) לצד מסמכי כל הוצאה |
| — | שער יציג חי לארנק רב-מטבעי (נוסף מעבר לרשימה המקורית, לבקשת המשתמש) | `26e8ab6` | `CurrencyRateProvider` (בנק ישראל+Frankfurter fallback) + שווי בש"ח לכל ארנק + סיכום תשלומי אשראי |
| 8 | Preferences מלאות | `4bbf805` | `AppPreferences` (מטבע בית/ניווט/מפה/יחידת טמפרטורה) ב-Context+localStorage, UI ב-`/settings`, יחידת טמפרטורה משולבת בפועל ב-5 תצוגות |
| 9 | Day Summary — הרחבה | `988202b` | כרטיס "מזומן/אשראי היום" (לפי paymentAt+paymentMethod) + כרטיס "עיסויים וטיפים היום" (ספירה+סכום) נוספו ל-days/[date] |
| 10 | End Trip Summary — שדות חסרים | `2ab73c9` | `TripGeographyRepository` חדש (TripCountry/TripCity, היו ב-0% שימוש) + דוח הטיול הורחב: מדינות/ערים, מלונות, טיסות, עיסויים, ציר-זמן (משתמש חוזר ב-buildCalendarEvents). תמונות דחויות בכוונה ל-Trip Memories (P2) |
| 11 | Document Center — הרחבה | `fcc39e7` | EntityDocumentSection נוסף למקומות בטיול, לתכניות עתידיות (List View), ולכל Payment בתוך "הצג הוכחת תשלום" — משלים את כל 10 סוגי הישות |

כל 11 הפריטים הושלמו. ראה `PROJECT_STATE.md` לפירוט המלא + מגבלות ידועות שנותרו בכוונה (מטבע ניווט/מפה ב-Preferences, תמונות ב-End Trip Summary).

**הערה על Preferences (#8):** מטבע ניווט (Google Maps/Waze/Apple Maps) וסגנון מפה נשמרים ומוצגים בטופס, אך עדיין לא משפיעים על התנהגות בפועל — ניווט חכם/מפה תלת-ממדית דורשים Mapbox שלא זמין כרגע. מתועד כמגבלה ידועה, לא Placeholder שקט.

## P2 — שיפור (בעבודה, 4 סבבים הושלמו 2026-08-17)

**סבב 1 — הושלם (`b71347c`):**
- ✅ Debit Card כערך נפרד ב-`PaymentMethod` — מקושר לכרטיס כמו אשראי.
- ✅ Nearby range picker (`/now`) — בורר 1/5/10/30/100 ק"מ במקום 30 קבוע.
- ✅ Rain-During-Activity Alert — `detectRainDuringActivities` + חיווט ב-`/today`.
- ✅ Weather Cache — `OpenMeteoWeatherProvider` (cache-per-instance, TTL 10 דק', דדופ בקשות מקבילות).

**סבב 2 — הושלם (`c0ab55c`):**
- ✅ Favorites — `PlaceRepository.toggleFavorite` + כפתור ★/☆ + סינון "★ מועדפים" ב-`/places` (הופך אותו למסך מועדפים חוצה-טיולים, ל-Place כבר גלובלי).
- ✅ תיקון: שדות itemName/quantity לא הוצגו בטופס הוצאה עבור category="fruit" (רק "shopping") — עכשיו מוצגים לשניהם.

**סבב 3 — הושלם (`2e93f7e`):**
- ✅ Units — `AppPreferences` הורחב עם `defaultDistanceUnit` (ק"מ/מייל) ו-`defaultTimeFormat` (24/12 שעות); הומר בפועל ב-RouteStop (days/[date]) ו-NearbyPlaces (°C/°F כבר נבנה ב-P1).
- ✅ Accessibility — `ThemePrefs` הורחב עם `contrast` (High Contrast) ו-`textSize` (Large Text), באותה תשתית data-attribute כמו brightness/density הקיימים.

**סבב 4 — הושלם (`0bd60b7`):**
- ✅ Trash + Restore — `restore()`/`restoreX()` חדש בכל 7 הישויות שהיו חסרות (Place/PlannedActivity/HotelStay/Flight/TransportBooking/Insurance/Expense), `/trash` מרכז את כולן לפי סוג + כפתור שחזור. סוגר את #96+#97.

**סבב 5 — הושלם (`a032f97`):**
- ✅ Multiple Quotes לתחבורה — `TransportQuote` היה קיים בסכימה בלבד (0%). נבנה כשלב השוואה לפני הזמנה בפועל (לא מקושר אוטומטית ל-TransportBooking) — רשימה ממוינת זול-קודם, בחירה ידנית, טופס הוספה, תחת סקשן "תחבורה" בעמוד הטיול.

**סבב 6 — הושלם (`b0f4060`):**
- ✅ Global Places Library — `computePlaceStats` (lib/place-stats.ts) מציג "ביקרתי X פעמים · הוצאתי Y" לכל מקום ב-`/places`, סורק את כל טיולי המשתמש (Place גלובלי). סוגר את #8.

**סבב 7 — הושלם (`22e5e06`):**
- ✅ Tourist Tax (#36, ל-PARTIAL בכוונה — לא מודל ייעודי, ר' פירוט ב-FEATURE_AUDIT.md) — קטגוריית הוצאה חדשה, זורמת אוטומטית לכל דוח.
- ✅ Massage/Fruit Tracker — כרטיס "ממוצע לעיסוי" + כרטיס "פירות" חדש (ספירה+סכום+כמות) בדוח הטיול.

**סבב 8 — הושלם (`72699b6`):**
- ✅ Mobile Add Menu (#112) — 3 קיצורים חדשים (המרת מטבע/טיפ/מסאז') בתפריט ההוספה הצף, מקשרים ישירות לסקשן הרלוונטי בעמוד הטיול (id על BookingGroup + פתיחת `<details>` אוטומטית מ-hash). 8/9 עכשיו — נשאר רק Scan-Receipt, חסום ע"י OCR.

**סבב 9 — הושלם (`819f7c5`):**
- ✅ Undo mechanism (#98, NOT IMPLEMENTED→PARTIAL) — `ToastProvider`/`useToast` כללי (Root Layout) + `DeleteWithUndoButton` כללי, מחליף `confirm()`+`<form>` הישן: מוחק מיד, מרענן, ומציג טוסט "בטל" ל-6 שניות. מחובר ל-7 נקודות מחיקה עם `restore()` קיים (Place/PlannedActivity/Expense/HotelStay/Flight/TransportBooking/Insurance). **לא** מחובר ל-CarRental (אין לו restore — הצגת "בטל" הייתה מבטיחה יכולת לא-קיימת) ולא ל-Trip (redirect מיידי אחרי המחיקה לא משאיר הזדמנות לטוסט על אותו עמוד — שחזור עדיין דרך `/trash`). Document/Contact נשארו ללא Undo (אין להם restore בכלל).

**סבב 10 — הושלם (`1dc4459`):**
- ✅ Personal Ratings מורחב (#73, PARTIAL→IMPLEMENTED) — `personalRating` (1-5) נוסף ל-Place/PlannedActivity/HotelStay/TransportBooking (4 מודלים ב-schema.prisma). בשונה מ-Expense (דירוג רק בזמן היצירה), נבנתה לכל ישות פעולת עדכון צרה נפרדת (setPersonalRating/updatePersonalRating) כי הן נוצרות לרוב *לפני* החוויה — דירוג-רק-ביצירה היה חסר תועלת. רכיב UI גנרי חדש (`components/personal-rating-select.tsx`) מחובר ב-4 מסכי תצוגה, 8 בדיקות round-trip חדשות. Expense עצמו (המגבלה הקיימת של 5 קטגוריות) לא נגע — מחוץ ל-scope.

**סבב 11 — הושלם (`af5261d`):**
- ✅ Repeat Visits (#75, NOT IMPLEMENTED→IMPLEMENTED) — `lib/repeat-visits.ts` חדש (7 בדיקות): משווה ערי המקומות המקושרים לטיול הנוכחי מול מקומות visited/favorite מטיולים קודמים לאותה עיר, מכבד את שני איתותי "לא לחזור" הקיימים (Place.dontReturn + TripPlaceStatus="dont_return"). כרטיס "חזרת ל-X?" בעמוד הטיול (`repeat-visits-section.tsx`) עם כפתור הוספה חד-קליק (`quickLinkPlaceToTripAction` חדש). **מבוסס Place בלבד** — לא סורק שמות HotelStay ישירות (אין קישור Place↔HotelStay בסכימה).

**סבב 12 — הושלם (`5089b98`):**
- ✅ Trip Memories (#72, NOT IMPLEMENTED→IMPLEMENTED) — "trip" נוסף ל-DocumentEntityType (schema.prisma+enums.ts יחד) במקום מודל Photo נפרד: ה-Document הקיים כבר שומר קובץ אמיתי כ-data: URI (base64), אז שימוש חוזר במנגנון קיים. `trip-memories-gallery.tsx` חדש — גריד thumbnails ריבועי (במקום רשימת קישורים כמו EntityDocumentSection הרגיל), סקשן "זכרונות מהטיול" בעמוד הטיול. הערות (Trip.notes) וציר-זמן (buildCalendarEvents בדוח) כבר היו מכוסים — הפער היחיד היה תמונות.

**החלטת המשתמש (2026-08-17):** Component Library (14 רכיבי UI) נדחה בכוונה — נוגע ישירות בעיצוב, וישנה כוונה מפורשת להעביר "חבילת UI סופית" בהמשך; לבנות אותו עכשיו מסתכן בסתירה/כפילות. ממשיכים בשאר הפריטים הלא-עיצוביים.

**החלטת המשתמש (2026-08-17, סבב 12):** Localization מלא (עברית+אנגלית) נדחה בכוונה — נשאל במפורש (AskUserQuestion) לאחר שהתברר שזה הפריט האחרון הלא-חסום ב-P2, ובחר "דלג בינתיים (מומלץ)". הנימוק שהוצג: היקף עצום (מאות מחרוזות עבריות קשיחות בעשרות קבצים), דורש בחירת ספריית i18n + אסטרטגיית מעבר שפה + מסך העדפה חדש, ומסתכן בהתנגשות עם "חבילת ה-UI הסופית" שתגיע בהמשך (שינוי מבנה קבצים נרחב).

**נשאר ב-P2 (שני פריטים, שניהם נדחו בכוונה במפורש):**
Component Library (14 רכיבים — ר' למעלה), Localization מלא (i18n — ר' למעלה). Explore-This-Area/Marker-Clustering נשאר ב-P3 (תלוי Mapbox — **BLOCKED**, לא "נדחה" אלא חסום שירות חיצוני).

## P3 — עתידי, תלוי שירות/החלטה חיצונית

**נבדק (2026-08-17): לא כל הרשימה חסומה בפועל.** כמה פריטים סווגו כאן היסטורית כ"אשכול Export/Print/Share/Backup עתידי" (ר' PROJECT_REQUIREMENTS.md #Export-cluster), אבל בבדיקה פרטנית מול FEATURE_AUDIT.md מתברר שחלקם לא תלויים בשום שירות חיצוני:

**חסום בפועל (שירות חיצוני נדרש):**
- Recommendations (#לא ממוספר) — ספק חיצוני מורשה (Google Places/TripAdvisor וכו').
- External Accounts/Booking Integration — API רשמי לכל ספק (חברות תעופה/מלונות).
- Share Security (#88) — Token/Revoke/Expiry תלוי שיש קודם מה לאבטח (#85 Share) — האודיט עצמו מציין "מוקדם מדי", לא חסימה טכנית.
- Explore-This-Area/Marker-Clustering — תלוי Mapbox Token.
- Offline דו-כיווני אמיתי (Dexie+תור) — לא שירות חיצוני, אלא שינוי ארכיטקטוני שכבר נדחה בכוונה בהחלטה קודמת (ר' DECISIONS.md).

**לא באמת חסום, לא-עדיפות (נותר מכוון):**
- Excel אמיתי (.xlsx) — ספריית JS מקומית (xlsx/exceljs) תעבוד בלי שירות חיצוני, אבל האודיט מציין ש-CSV UTF-8+BOM כבר "פותר את הצורך המעשי" — עדיפות נמוכה, לא חסימה.

Redaction לא נמצא כפריט ממוספר ב-FEATURE_AUDIT.md בבדיקה הזו — ייתכן שהכוונה חופפת ל-Share Security; לא אומת בנפרד.

**החלטת המשתמש (2026-08-17):** נשאל במפורש (AskUserQuestion) אם להמשיך לבנות את 4 הפריטים הלא-חסומים (Share/WhatsApp/Report Builder/Backup) — ענה "המשך לבנות" (מומלץ). ממשיכים כסבבי P3 באותה מתודולוגיה (implement→verify→commit→doc-sync).

**סבב 13 — הושלם (`07d378e`):**
- ✅ Share + WhatsApp Sharing (#85, #86, NOT IMPLEMENTED→IMPLEMENTED) — `lib/trip-share-text.ts` חדש (7 בדיקות): מרכיב תקציר טקסט קריא מהנתונים הקיימים בדוח הטיול. `components/share-button.tsx` — `navigator.share()` עם fallback אמיתי להעתקה ללוח. `components/whatsapp-share-link.tsx` — קישור `wa.me` תמיד זמין. מחוברים בראש דוח הטיול. **לא URL לצפייה** — משתפים טקסט, לא קישור, כי אין עדיין מסך צפייה ציבורי (#88 Share Security).

**סבב 14 — הושלם (`f83f0d7`):**
- ✅ Report Builder (#89, NOT IMPLEMENTED→IMPLEMENTED) — דוח הטיול הקבוע (`report/page.tsx`) הפך למוגדר-אישית דרך query params, לא מסך נפרד. 14 checkboxes ל-Sections (בתוך `<details>` מתקפל, ברירת מחדל: הכול מוצג — בלי regression מהתנהגות הקודמת). `trip-picker.tsx` חדש — `<select>` לניווט בין טיולים בלי מסך cross-trip נפרד. פילטר `currency` חדש לסקשנים הכספיים בלבד (לא למלונות/טיסות/ציר-זמן, שלא קשורים למטבע באותו אופן).

**סבב 15 — הושלם (`be7936d`):**
- ✅ Backup Architecture (#90, NOT IMPLEMENTED→PARTIAL) — Export/Restore JSON מלא, 25 סוגי ישות. `lib/backup/export-backup.ts` + `restore-backup.ts` חדשים, סקשן "גיבוי ושחזור" ב-`/settings`. שחזור עם מיפוי id ישן→חדש נכון בסדר תלות (Trip→Place→...→ChecklistItem) ותיאום יתרות ארנק מדויק בסוף (`reconcileWallet`). PARTIAL בכוונה — 4 מגבלות מתועדות (WalletTransaction/TransportQuote.transportBookingId/Place.dontReturn/Document entityType="other" לא ניתנים לשחזור מלא, כולם מדווחים ב-summary). לא נבדק ע"י unit test אוטומטי (תלוי ב-Singletons) ולא אומת חי בדפדפן — רק typecheck/build.

**זה היה הפריט האחרון מתוך 4 שהמשתמש אישר להמשיך אליהם ב-P3.** Excel אמיתי (.xlsx) נשאר לא-בנוי בכוונה — CSV UTF-8+BOM כבר "פותר את הצורך המעשי" לפי האודיט, עדיפות נמוכה.

---

## שלב A — הושלם (2026-08-17, 15 סבבים, אחרי קובץ אפיון.docx מהמשתמש)

המשתמש סיפק "איפיון אפליקציה.docx" עם תהליך עבודה מחייב וסדר שלבים A–F (ר' `NEXT_STEPS.md`). שלב A ("השלמת כל מה שלא תלוי בשירות חיצוני") בוצע במלואו — 12 פריטים עברו ל-IMPLEMENTED, 1 מ-NOT ל-PARTIAL (אחרי תיקון ניסוח לא-מדויק), 8 פריטי PARTIAL נוספים שופרו מהותית. ר' `FEATURE_AUDIT.md` ("Audit סופי — שלב A") לטבלה המלאה.

| # | סבב | Commit | מה נבנה |
|---|---|---|---|
| 1 | פרטי קשר חסרים + טיימרים + Airport Timing | `bf7e254` | Place/Contact/Insurance — שדות קשר שהיו בסכימה בלי UI; jet_ski; Flight.legType נחשף (היה כתוב, לעולם לא נקרא); LiveTimer גנרי חדש; Airport Timing calculator חדש |
| 2 | Rain Window | `32d5af6` | `computeRainWindows` (5 בדיקות), מחובר ל-/today ו-/now |
| 3 | יתרת פתיחה + סינון קטגוריה + מזג-אוויר-GPS | `bfb0b99` | שלב ייעודי ביצירת טיול; בורר קטגוריה ב-Nearby; כרטיס GPS Weather חדש ב-/today |
| 4 | חיפוש טווח-תאריכים + מסך חירום | `95f387e` | expenseFrom/To ו-docFrom/To בעמוד הטיול; Trip.medicalNotes + DocumentType.passport_copy (שדות חדשים) |
| 5 | תגית "הבא" + קרוב-אליי בדשבורד | `693a19e` | LiveTimer בכרטיס "התוכנית של היום"; NearbyWidgetCard חדש |
| 6 | restore()/Undo להשכרות רכב | `2a1a495` | CarRental.restoreCarRental (Mock+Prisma), listCarRentals עם includeDeleted, /trash+Undo |
| 7 | toggle Place.dontReturn | `adf5159` | התגלה כפער אמיתי (0% שימוש באפליקציה החיה, לא רק מגבלת גיבוי) — Repository+UI+restore-backup |
| 8 | רכיבי Error State גנריים | `84ab4ad` | BlockedIntegrationState/PermissionDeniedState חדשים, מוחלים על Mapbox panel + 4 מצבי Geolocation-denied |
| 9 | Skip Link | `ac11b66` | "דלג לתוכן הראשי", CSS-only |
| 10 | ייצוא הזמנה בודדת + דוח מלא | `14ce304` | CSV ל-5 סוגי הזמנה + "ייצוא דוח מלא" |

**מגבלה מתועדת:** בניגוד ל-P0-P3, שלב A לא כלל בדיקה חיה בדפדפן (אין כלי דפדפן זמין בסביבת ה-Session) — רק typecheck+lint+test(322)+build. מומלץ אימות ידני בדפדפן אמיתי.

**חריגה חד-פעמית מסדר השלבים:** לבקשת המשתמש, חיבור Supabase (חלק משלב E) בוצע חלקית *לפני* שלב A/B הושלמו — פרויקט Supabase חי חובר ואומת, DB אמיתי נוצר (38 טבלאות). RLS נשאר מכוון לא-מופעל (migration מוכן וממתין) עד שהמשתמש יבקש להמשיך בשלב E. ר' PROJECT_STATE.md "מצב Supabase".

---

## BLOCKED BY EXTERNAL SERVICE — עודכן

| מה חסום | נדרש | קוד מוכן? | הערה |
|---|---|---|---|
| 3D Map (Mapbox) | `NEXT_PUBLIC_MAPBOX_TOKEN` | כן, 100% | ללא שינוי |
| OCR | Claude API Key | לא — לא הותחל כלל | ללא שינוי |
| Supabase (DB/Auth/RLS) | Auth+RLS מלאים | כן | **DB חי מחובר ונוצר בפועל (ר' למעלה). RLS+Auth+מעבר בפועל מ-Mock — עדיין לא** |
| Storage (מסמכים/תמונות) | Supabase Storage (אותו חיבור) | חלקי — Mock עובד כ-`data:` URI זמני | תלוי בשורה שמעליה |
