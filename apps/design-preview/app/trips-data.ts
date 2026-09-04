import { TRIP_STOP_COUNTRIES, TRIP_LAST_DAY, today, loadJSON, saveJSON, nextId, SK, tripScopedKey, notifyStorageFailure } from "./wallet-data";
import { putImage, deleteImages, PROFILE_PHOTO_ID } from "./image-store";

/**
 * מאגר-הטיולים המשותף למסכי "דף הבית" / "הטיולים שלי" / "סקירת הטיול" /
 * "מסלול" / "מפה" וכו'. הטיול הפעיל (יפן) בנוי ישירות מעל TRIP_STOP_COUNTRIES
 * הקיים ב-wallet-data.ts (לא כפילות-מידע: אותו מקור-אמת בדיוק קובע גם את
 * "מטבע מקומי" בארנק וגם את תאריכי-הטיול כאן). שאר-הטיולים (איטליה/ניו
 * יורק/תאילנד) הם דמו-בלבד למסך "הטיולים שלי", לפי חבילת-העיצוב המחייבת.
 *
 * עודכן: נוספה יכולת עריכה אמיתית — לפני כן לא הייתה שום דרך לערוך את
 * הטיול הפעיל (הכל היה קבוע בקוד). עכשיו כל טיול (כולל "יפן" הבנוי-מראש)
 * יכול לקבל override (שם/תאריכים/וכו'), נשמר ב-localStorage ומוחל בזמן-
 * אמת דרך findAnyTrip/allTrips/activeTrip. תחנות-המסלול (יעדים בתוך
 * הטיול) מנוהלות בנפרד ב-trip-content.ts (loadStops/saveStops) — לא כאן,
 * כדי לא לשכפל מקור-אמת שכבר קיים ומחובר גם למסך "שינוי סדר היעדים".
 */

export type TripStatus = "upcoming" | "active" | "completed";

export interface DemoTrip {
  id: string;
  name: string;
  countryCode: string;
  status: TripStatus;
  startDate: string;
  endDate: string;
  nights: number;
  travelers: number;
  adults: number;
  children: number;
}

function daysBetween(a: string, b: string): number {
  return Math.round((new Date(b).getTime() - new Date(a).getTime()) / 86400000);
}

const JAPAN_START = TRIP_STOP_COUNTRIES[0]!.firstDay;
const JAPAN_END = TRIP_LAST_DAY;

export const JAPAN_TRIP: DemoTrip = {
  id: "japan-2025",
  name: "יפן",
  countryCode: "JP",
  status: "active",
  startDate: JAPAN_START,
  endDate: JAPAN_END,
  nights: daysBetween(JAPAN_START, JAPAN_END),
  travelers: 2,
  adults: 2,
  children: 0,
};

export const DEMO_TRIPS: DemoTrip[] = [
  JAPAN_TRIP,
  { id: "italy-2025", name: "איטליה", countryCode: "IT", status: "upcoming", startDate: "2025-09-05", endDate: "2025-09-15", nights: 10, travelers: 2, adults: 2, children: 0 },
  { id: "newyork-2026", name: "ניו יורק", countryCode: "US", status: "upcoming", startDate: "2026-01-26", endDate: "2026-02-01", nights: 6, travelers: 1, adults: 1, children: 0 },
  { id: "thailand-2026", name: "תאילנד", countryCode: "TH", status: "upcoming", startDate: "2026-10-24", endDate: "2026-11-03", nights: 10, travelers: 2, adults: 2, children: 0 },
];

export function daysUntil(dateISO: string, referenceDate = today()): number {
  return daysBetween(referenceDate, dateISO);
}

export function tripProgress(trip: DemoTrip, referenceDate = today()): { dayIndex: number; totalDays: number; daysRemaining: number; percent: number } {
  const totalDays = daysBetween(trip.startDate, trip.endDate) + 1;
  const dayIndex = Math.min(totalDays, Math.max(1, daysBetween(trip.startDate, referenceDate) + 1));
  const daysRemaining = Math.max(0, daysBetween(referenceDate, trip.endDate));
  const percent = totalDays > 0 ? Math.min(100, Math.round((dayIndex / totalDays) * 100)) : 0;
  return { totalDays, dayIndex, daysRemaining, percent };
}

// ============================== טיולים שנוצרו ע"י המשתמש ==============================

export const SK_CUSTOM_TRIPS = "design-preview-custom-trips-v1";
// עריכות על טיולים קיימים (כולל "יפן" הבנוי-מראש) — לא דורסות את הקבועים
// המקוריים, רק שכבת-override שמוחלת בזמן-קריאה.
export const SK_TRIP_OVERRIDES = "design-preview-trip-overrides-v1";

export function loadCustomTrips(): DemoTrip[] {
  return loadJSON<DemoTrip[]>(SK_CUSTOM_TRIPS, []);
}
/** יוצרת טיול חדש — סטטוס ראשוני לפי תאריכים אמיתיים (today()): טיול
 * שכבר הסתיים נוצר כ"היסטוריה", טיול שהתאריכים שלו כוללים את היום נוצר
 * מיד כ"פעיל" (לפי בקשה מפורשת: "ברירת המחדל תהיה הטיול בהווה" — אין
 * צורך בלחיצה נוספת כדי שהטיול-שקורה-עכשיו יהיה זה שמוצג בדף הבית), ורק
 * טיול עתידי נוצר כ"עתידי". הפיכה לפעיל דרכה מורידה גם כל טיול-פעיל אחר
 * (לעולם לא שניים בו-זמנית) — אותה הבטחה כמו setActiveTrip.
 */
export function saveCustomTrip(trip: Omit<DemoTrip, "id" | "status" | "travelers">): DemoTrip {
  const trips = loadCustomTrips();
  const ref = today();
  const status: TripStatus = trip.endDate < ref ? "completed" : trip.startDate <= ref ? "active" : "upcoming";
  const full: DemoTrip = { ...trip, id: nextId("trip"), status, travelers: trip.adults + trip.children };
  saveJSON(SK_CUSTOM_TRIPS, [...trips, full]);
  if (status === "active") setActiveTrip(full.id, ref);
  return full;
}
export const SK_HIDDEN_TRIPS = "design-preview-hidden-trips-v1";

// ============================== היקף-אחסון לכל טיול בנפרד ==============================

// מפתחות-הבסיס של כל דומיין תלוי-טיול (ארנק + מסלול + הזמנות + אריזה +
// מעקב-אישי) — לפי בקשה מפורשת: כל טיול חדש מתחיל ריק בכל התכולות האלה,
// לא רק בארנק. משמש גם למיגרציה החד-פעמית (למטה), גם לניקוי-יתום כשמוחקים
// טיול, וגם ל"איפוס נתוני הדגמה" ב-more/page.tsx. מפתחות חשבון-גלובליים
// (documents/profile/settings/customCategories) לא נכללים בכוונה — הם
// נשארים גלובליים לצמיתות, לא תלויי-טיול. מפתחות trip-content.ts/
// bookings-data.ts/packing/tracker מוגדרים כאן כמחרוזות מפורשות (לא
// import) כדי לא ליצור מעגל-ייבוא — אותו עיקרון בדיוק כמו OTHER_MODULE_KEYS
// הקיים ב-more/page.tsx.
export const TRIP_SCOPED_BASE_KEYS: string[] = [
  SK.balances,
  SK.expenses,
  SK.cards,
  SK.additions,
  SK.conversions,
  SK.receipts,
  SK.baseCcy,
  SK.budget,
  SK.manualCountry,
  SK.geoCountry,
  SK.deposits,
  SK.lastBackupAt,
  "design-preview-trip-stops-v1",
  "design-preview-trip-activities-v1",
  "design-preview-bookings-v1",
  "design-preview-packing-v1",
  "design-preview-personal-tracker-v1",
];

/** מוחקת את כל הנתונים-התלויי-טיול (ארנק/מסלול/הזמנות/אריזה/מעקב) ששייכים
 * לטיול הנתון — קרוא גם ממחיקת-טיול (כאן, למטה) וגם מ"איפוס נתוני הדגמה". */
export function clearTripScopedData(tripId: string) {
  if (typeof localStorage === "undefined") return;
  // חייב לקרוא את ההוצאות *לפני* לולאת-המחיקה למטה (שמוחקת בין השאר את
  // מפתח ההוצאות עצמו) — אחרת אין עוד דרך לדעת אילו תמונות-קבלה שייכות
  // לטיול הזה ב-IndexedDB (ר' image-store.ts), והן היו נשארות יתומות שם.
  const expenses = loadJSON<{ receiptId?: string }[]>(tripScopedKey(SK.expenses, tripId), []);
  const receiptIds = expenses.map((e) => e.receiptId).filter((id): id is string => !!id);
  if (receiptIds.length) deleteImages(receiptIds).catch((err) => console.error("clearTripScopedData: deleteImages failed:", err));
  for (const baseKey of TRIP_SCOPED_BASE_KEYS) localStorage.removeItem(tripScopedKey(baseKey, tripId));
}

export const NO_ACTIVE_TRIP_ID = "none";
export const SK_TRIP_SCOPE_MIGRATED = "design-preview-trip-scope-migrated-v1";
let migrationChecked = false; // ממוזכר לכל טעינת-עמוד — נמנע מקריאות-localStorage חוזרות בכל קריאה ל-currentScopeTripId

/** מיגרציה חד-פעמית: משתמשים שכבר השתמשו באפליקציה לפני המעבר ל"דלי
 * נפרד לכל טיול" — הנתונים שלהם (למשל כסף אמיתי בארנק) יושבים תחת
 * המפתחות הישנים הלא-משויכים. מעתיקה אותם (לא מעבירה — ר' למטה) אל הטיול
 * שפעיל כרגע, ברגע-הריצה הראשון-אי-פעם אחרי השדרוג. אם אין טיול פעיל באותו
 * רגע, לא מעתיקה כלום (וגם לא מנסה שוב — הסמן נקבע בכל מקרה) כי אין לאן
 * לשייך את הנתונים בבטחה. המפתחות הישנים *לא* נמחקים כאן בכוונה — אם למשהו
 * במיגרציה יש באג, הנתונים המקוריים עדיין קיימים בשלמותם ואפשר לשחזר/
 * להריץ שוב (על ידי מחיקת SK_TRIP_SCOPE_MIGRATED) בלי לאבד כלום. */
function ensureTripScopeMigrated() {
  if (migrationChecked) return;
  migrationChecked = true;
  if (typeof localStorage === "undefined") return;
  if (loadJSON(SK_TRIP_SCOPE_MIGRATED, false)) return;
  const target = activeTrip()?.id;
  if (target) {
    for (const baseKey of TRIP_SCOPED_BASE_KEYS) {
      const legacyRaw = localStorage.getItem(baseKey);
      if (legacyRaw == null) continue;
      const scopedKey = tripScopedKey(baseKey, target);
      if (localStorage.getItem(scopedKey) == null) localStorage.setItem(scopedKey, legacyRaw);
    }
  }
  saveJSON(SK_TRIP_SCOPE_MIGRATED, true);
}

export const SK_IMAGE_MIGRATED = "design-preview-image-migration-v1";
let imageMigrationStarted = false; // אותו תפקיד כמו migrationChecked למעלה — לא קשור אליו (ר' הסבר למטה)

/** מיגרציה חד-פעמית נפרדת: מעבירה תמונות (קבלות/מסמכים/תמונת-פרופיל)
 * שיושבות היום כ-base64 בתוך localStorage אל IndexedDB (ר' image-store.ts)
 * — לפי בקשה מפורשת "תדאג שלא יחסר מקום": ל-localStorage מכסה קטנה מאוד,
 * וזו הייתה הסיבה האמיתית לכשלי-שמירה בפועל. אותו עיקרון-בטיחות כמו
 * ensureTripScopeMigrated למעלה (העתקה-בלבד, לעולם לא מוחקים מקור לפני
 * שהיעד אושר בהצלחה, סמן-סיום נשמר רק אם הכול הצליח כדי שכל כשל יגרום
 * לניסיון-חוזר מלא בטעינה הבאה — putImage הוא דריסה דטרמיניסטית, אז ניסיון
 * חוזר על משהו שכבר הצליח לא מזיק).
 *
 * שונה במכוון מ-ensureTripScopeMigrated בשתי נקודות:
 * 1. אסינכרונית מטבעה (IndexedDB) — לא יכולה לרוץ מתוך currentScopeTripId
 *    הסינכרונית (שנקראת מכל מסך תלוי-טיול). רצה במקום זה פעם אחת מרכיב-
 *    לקוח שתמיד מותקן (ImageMigrationRunner, מותקן ב-layout.tsx), בלי
 *    תלות בשום החלטת-scope.
 * 2. בודקת גם מפתחות-קבלות לא-משויכים (SK.receipts הגולמי, לא רק הגרסה
 *    המתויגת-לטיול) — כי היא עלולה לרוץ בעמוד שמעולם לא קרא
 *    currentScopeTripId, ולכן לפני שמיגרציית-ההיקף-לכל-טיול בכלל רצה. */
export async function runImageMigration(): Promise<void> {
  if (imageMigrationStarted) return;
  imageMigrationStarted = true;
  if (typeof localStorage === "undefined") return;
  if (loadJSON(SK_IMAGE_MIGRATED, false)) return;

  let anyFailure = false;
  try {
    const allTripIds = [...DEMO_TRIPS.map((t) => t.id), ...loadCustomTrips().map((t) => t.id), NO_ACTIVE_TRIP_ID];
    const receiptKeys = [...allTripIds.map((tripId) => tripScopedKey(SK.receipts, tripId)), SK.receipts];
    for (const key of receiptKeys) {
      const raw = localStorage.getItem(key);
      if (!raw) continue;
      let receipts: Record<string, string>;
      try {
        receipts = JSON.parse(raw) ?? {};
      } catch {
        continue; // רשומה פגומה — מדלגים, לא קריטי-לעצירה
      }
      let keyOk = true;
      for (const [id, dataUrl] of Object.entries(receipts)) {
        try {
          await putImage(id, dataUrl);
        } catch (err) {
          keyOk = false;
          anyFailure = true;
          console.error(`runImageMigration: receipt "${id}" failed:`, err);
        }
      }
      if (keyOk) localStorage.setItem(key, JSON.stringify({}));
    }

    const documents = loadJSON<(Record<string, unknown> & { id: string; dataUrl?: string })[]>(SK.documents, []);
    let documentsOk = true;
    const stripped = documents.map((doc) => {
      const { dataUrl, ...rest } = doc;
      return { rest, dataUrl };
    });
    for (const { rest, dataUrl } of stripped) {
      if (!dataUrl) continue;
      try {
        await putImage(rest.id as string, dataUrl);
      } catch (err) {
        documentsOk = false;
        anyFailure = true;
        console.error(`runImageMigration: document "${rest.id}" failed:`, err);
      }
    }
    if (documentsOk) saveJSON(SK.documents, stripped.map((s) => s.rest));

    const profile = loadJSON<Record<string, unknown> & { photoDataUrl?: string | null }>(SK.profile, {});
    if (profile.photoDataUrl) {
      try {
        await putImage(PROFILE_PHOTO_ID, profile.photoDataUrl);
        const { photoDataUrl: _removed, ...rest } = profile;
        saveJSON(SK.profile, rest);
      } catch (err) {
        anyFailure = true;
        console.error("runImageMigration: profile photo failed:", err);
      }
    }

    if (!anyFailure) saveJSON(SK_IMAGE_MIGRATED, true);
    else notifyStorageFailure("חלק מהתמונות הישנות לא הועברו בהצלחה לאחסון החדש — ייתכן שהן עדיין לא נטענות. ננסה שוב באופן אוטומטי בפעם הבאה שהאפליקציה נטענת.");
  } catch (err) {
    console.error("runImageMigration: aborted:", err);
  }
}

/** נקודת-הכניסה היחידה שדרכה כל דומיין תלוי-טיול שאינו כבר יודע את
 * ה-tripId שלו מ-URL (ארנק/הזמנות/אריזה/מעקב, וגם מסלול/מפה שנפתחים בלי
 * מזהה-טיול מפורש) קובע "לאיזה טיול לשייך" קריאה/כתיבה. תמיד מחזיר ערך
 * קונקרטי (לעולם לא null) — אם אין טיול פעיל, מחזירה "דלי" קבוע-אחד
 * (NO_ACTIVE_TRIP_ID) במקום ענף-מיוחד של "כתיבה לא-משויכת" — כך שאין שום
 * מקרה-קצה שכל דומיין צריך לזכור בנפרד. מריצה גם את המיגרציה החד-פעמית
 * (למעלה) לפני ההחזרה הראשונה-אי-פעם. */
export function currentScopeTripId(): string {
  ensureTripScopeMigrated();
  return activeTrip()?.id ?? NO_ACTIVE_TRIP_ID;
}

/** מוחקת את כל נתוני-כל-הטיולים התלויי-טיול (ארנק/מסלול/הזמנות/אריזה/
 * מעקב, לכל טיול שקיים אי-פעם — כולל דמו-מובנים מוסתרים) וגם את מרשם-
 * הטיולים עצמו (רשימת-הטיולים/עקיפות/הסתרות/סמן-המיגרציה) — לשימוש "מחיקת
 * כל הנתונים שלי" בהגדרות. לא נוגעת במפתחות חשבון-גלובליים (מסמכים/
 * פרופיל/הגדרות/קטגוריות) — אלה באחריות הקורא. */
export function resetAllTripScopedData() {
  const allTripIds = [...DEMO_TRIPS.map((t) => t.id), ...loadCustomTrips().map((t) => t.id), NO_ACTIVE_TRIP_ID];
  for (const tripId of allTripIds) clearTripScopedData(tripId);
  // עותקים ישנים-לא-מיגרטים של אותם מפתחות (מלפני המעבר להיקף-לכל-טיול).
  for (const baseKey of TRIP_SCOPED_BASE_KEYS) if (typeof localStorage !== "undefined") localStorage.removeItem(baseKey);
  if (typeof localStorage === "undefined") return;
  for (const key of [SK_CUSTOM_TRIPS, SK_TRIP_OVERRIDES, SK_HIDDEN_TRIPS, SK_TRIP_SCOPE_MIGRATED]) localStorage.removeItem(key);
}

/** מוחקת טיול — עובד גם על טיולים-מותאמים-אישית (מוסרים לגמרי) וגם על
 * טיולי-הדמו הקבועים (japan-2025 וכו', שמוסתרים במקום נמחקים פיזית,
 * כי הם קבועים בקוד). באג קודם: מחיקת טיול-דמו (כולל "יפן") לא עשתה
 * כלום בפועל — allTrips() המשיך להחזיר אותו. מוחקת גם: מחיקת-טיול אמורה
 * להיות מחיקה אמיתית, לא רק הסרה-מהרשימה עם כל הארנק/מסלול/הזמנות/אריזה/
 * מעקב שלו נשארים יתומים ב-localStorage לצמיתות. */
export function deleteCustomTrip(id: string) {
  clearTripScopedData(id);
  saveJSON(SK_CUSTOM_TRIPS, loadCustomTrips().filter((t) => t.id !== id));
  saveJSON(SK_TRIP_OVERRIDES, { ...loadTripOverrides(), [id]: undefined });
  const isBuiltIn = DEMO_TRIPS.some((t) => t.id === id);
  if (isBuiltIn) {
    const hidden = loadJSON<string[]>(SK_HIDDEN_TRIPS, []);
    if (!hidden.includes(id)) saveJSON(SK_HIDDEN_TRIPS, [...hidden, id]);
  }
}

function loadTripOverrides(): Record<string, Partial<DemoTrip> | undefined> {
  return loadJSON(SK_TRIP_OVERRIDES, {});
}

/** מעדכן טיול קיים (כולל "יפן" ושאר טיולי-הדמו הקבועים) — שם/תאריכים/וכו'.
 * לא זמין לטיולים-מותאמים-אישית (saveCustomTrip) שבהם עורכים ישירות. */
export function updateTrip(id: string, patch: Partial<Omit<DemoTrip, "id">>): DemoTrip | null {
  const custom = loadCustomTrips();
  const customIdx = custom.findIndex((t) => t.id === id);
  if (customIdx !== -1) {
    const updated = { ...custom[customIdx]!, ...patch };
    if (patch.adults != null || patch.children != null) updated.travelers = updated.adults + updated.children;
    const arr = [...custom];
    arr[customIdx] = updated;
    saveJSON(SK_CUSTOM_TRIPS, arr);
    return updated;
  }
  const overrides = loadTripOverrides();
  const base = findAnyTrip(id);
  if (!base) return null;
  const updated = { ...base, ...patch };
  if (patch.adults != null || patch.children != null) updated.travelers = updated.adults + updated.children;
  saveJSON(SK_TRIP_OVERRIDES, { ...overrides, [id]: { name: updated.name, countryCode: updated.countryCode, startDate: updated.startDate, endDate: updated.endDate, nights: daysBetween(updated.startDate, updated.endDate), travelers: updated.travelers, adults: updated.adults, children: updated.children, status: updated.status } });
  return updated;
}

/** סטטוס-בפועל של טיול: תאריך-סיום שעבר גובר על כל דבר אחר (כולל "active"
 * ששמור בעבר) — כדי שטיול שהסתיים יעבור אוטומטית ל"היסטוריה" בלי תלות
 * בפעולה ידנית. משתמש בתאריך-אמיתי (today()), לא בתאריך-דמו קבוע, כי
 * המשתמש בפועל עוקב אחרי טיולים אמיתיים בזמן אמת. */
function effectiveStatus(trip: DemoTrip, referenceDate: string): TripStatus {
  if (trip.endDate < referenceDate) return "completed";
  return trip.status;
}

// לפי בקשה מפורשת: טיולי-הדמו המובנים (יפן/איטליה/ניו יורק/תאילנד) לא
// מוצגים מעצמם יותר — ברירת-המחדל כש-SK_HIDDEN_TRIPS עוד לא נקבע היא
// שכולם מוסתרים, כדי שרשימת "הטיולים שלי" תתחיל ריקה לגמרי והמשתמש יבנה
// אותה בעצמו. הקבועים עצמם נשארים בקוד (לא נמחקים) בתור עוגן-בטיחות בלבד.
const ALL_BUILT_IN_TRIP_IDS = DEMO_TRIPS.map((t) => t.id);

export function allTrips(referenceDate = today()): DemoTrip[] {
  const overrides = loadTripOverrides();
  const hidden = new Set(loadJSON<string[]>(SK_HIDDEN_TRIPS, ALL_BUILT_IN_TRIP_IDS));
  return [...DEMO_TRIPS, ...loadCustomTrips()]
    .filter((t) => !hidden.has(t.id))
    .map((t) => (overrides[t.id] ? { ...t, ...overrides[t.id] } : t))
    .map((t) => ({ ...t, status: effectiveStatus(t, referenceDate) }));
}
export function findTrip(id: string): DemoTrip | null {
  return DEMO_TRIPS.find((t) => t.id === id) ?? null;
}
export function findAnyTrip(id: string): DemoTrip | null {
  return allTrips().find((t) => t.id === id) ?? null;
}

/** הטיול "הפעיל" כרגע לצורך דף-הבית/מסלול/מפה — הראשון עם status==="active",
 * או null אם אין טיולים בכלל/אף אחד לא נבחר כפעיל (לא נופל יותר לטיול-דמו
 * מומצא — המשתמשים שרואים את הבית צריכים לראות רק את הטיול האמיתי שלהם,
 * או קריאה מפורשת ליצור אחד אם עדיין אין). */
export function activeTrip(): DemoTrip | null {
  return allTrips().find((t) => t.status === "active") ?? null;
}

/** מעביר את "הטיול הפעיל" לטיול אחר — פעולה מפורשת ויחידה שמשנה status
 * ל-"active", ומורידה כל טיול אחר שהיה "active" (לפי תאריכים, ל-upcoming/
 * completed) כדי שלעולם לא יהיו כמה טיולים "פעילים" בו-זמנית. */
export function setActiveTrip(id: string, referenceDate = today()): DemoTrip | null {
  if (!findAnyTrip(id)) return null;
  for (const t of allTrips()) {
    if (t.id === id || t.status !== "active") continue;
    updateTrip(t.id, { status: new Date(t.endDate) < new Date(referenceDate) ? "completed" : "upcoming" });
  }
  return updateTrip(id, { status: "active" });
}
