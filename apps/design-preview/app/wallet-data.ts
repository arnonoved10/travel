import { CURRENCY_META, COUNTRY_BY_CODE, type CountryEntry } from "./country-currency-data";
import { getImage, putImage } from "./image-store";

/**
 * לוגיקה/טיפוסים/אחסון משותפים לארנק (wallet/page.tsx) ולמסך "עוד"
 * (more/page.tsx) — קובץ נפרד כדי ששני המסכים יוכלו לקרוא/לכתוב לאותם
 * מפתחות-localStorage ולהשתמש באותה לוגיקת גיבוי/שחזור בלי כפילות קוד,
 * לפי הבקשה המפורשת להעביר את כפתורי הגיבוי/שחזור/דוח מהארנק אל "עוד".
 */

// ============================== טיפוסים ==============================

// לא union סגור עוד: קטגוריה מותאמת-אישית שנוצרת פעם אחת (למשל "מסאז'")
// נשמרת ונשארת זמינה לבחירה בפעם הבאה — לפי בקשה מפורשת.
export type Category = string;

/** רשימת-קטגוריות-פתיחה עשירה, מאורגנת בחבילות (קבוצה → תת-סעיפים) — לפי
 * בקשה מפורשת: "תעזור לי אם שכחתי... תכניס אותם בחבילה כמו לדוגמא תחבורה
 * מסעדות קניות... ואז שם בחירה תת סעיף". הקבוצה היא ארגון-תצוגה בלבד
 * (למיון הבחירה בטופס-הוצאה) — הערך שנשמר בפועל על ההוצאה הוא תמיד תת-
 * הסעיף הספציפי (למשל "מונית"), בדיוק כמו קטגוריה רגילה. משתמש קיים
 * שכבר יש לו הוצאות עם הקטגוריות השטוחות הישנות (תחבורה/קניות) לא נשבר —
 * הן ממשיכות להיות מוצגות/מחושבות נכון בכל מקום, רק לא יופיעו כברירת-
 * מחדל-לבחירה-חוזרת כי הן הפכו לשם-קבוצה ולא לתת-סעיף.
 */
export interface CategoryGroup {
  label: string;
  items: Category[];
}
export const CATEGORY_GROUPS: CategoryGroup[] = [
  { label: "מלון", items: ["מלון"] },
  { label: "תחבורה", items: ["מונית", "הסעה", "טיסה", "השכרת רכב"] },
  { label: "אוכל", items: ["מסעדות", "בר", "פירות"] },
  { label: "סופר וקניות", items: ["סופר / 7-11", "בגדים", "נעליים", "מתנות", "דיוטי פרי", "סים"] },
  { label: "בילויים", items: ["מסאז'", "סנוקר"] },
  { label: "פעילויות", items: ["פעילויות"] },
  { label: "אחר", items: ["אחר"] },
];
export const BUILTIN_CATEGORIES: Category[] = CATEGORY_GROUPS.flatMap((g) => g.items);
export type PaymentMethod = "cash" | "credit" | "debit" | "transfer" | "digital_wallet" | "other";
export const PAYMENT_METHOD_LABEL: Record<PaymentMethod, string> = {
  cash: "מזומן",
  credit: "כרטיס אשראי",
  debit: "כרטיס חיוב",
  transfer: "העברה",
  digital_wallet: "ארנק דיגיטלי",
  other: "אחר",
};

export type MoneySource = "cash_from_home" | "atm_withdrawal" | "refund" | "extra_income" | "transfer" | "other";
export const MONEY_SOURCE_LABEL: Record<MoneySource, string> = {
  cash_from_home: "מזומן שהבאתי מהבית",
  atm_withdrawal: "משיכה מכספומט",
  refund: "החזר כספי",
  extra_income: "הכנסה נוספת",
  transfer: "העברה",
  other: "אחר",
};

export interface CurrencyBalance {
  code: string;
  balance: number;
  spent: number;
  lastUpdated: string;
}
export interface CreditCardInfo {
  id: string;
  nickname: string;
  issuer: string;
  last4: string;
  currency: string;
  feePercent?: number;
  color: string;
  isPrimary?: boolean;
  /** מסגרת-אשראי — אופציונלי לגמרי, כדי שאפשר יהיה להציג "היה/נותר" לכרטיס
   * בדיוק כמו למטבע. בלי זה מציגים רק "סה״כ הוצאתי בכרטיס" (אין ביחס-למה
   * למדוד אחוזים). */
  creditLimit?: number;
}
export interface Expense {
  id: string;
  title: string;
  merchant?: string;
  category: Category;
  currency: string;
  amount: number;
  /** טיפ ששולם מתוך amount (לא נוסף עליו) — לצורך פילוח נפרד בדוחות, בלי
   * לכפול את הסכום שכבר יורד מהארנק/מדווח בקטגוריה. */
  tipAmount?: number;
  date: string;
  time?: string;
  paymentMethod: PaymentMethod;
  cardId?: string;
  receiptId?: string;
  notes?: string;
  /** אם ההוצאה נוצרה אוטומטית ממחיר-מלון בהזמנה (ר' bookings-data.ts) —
   * מקשר בחזרה לאותה הזמנה, כדי שעדכון/מחיקת המחיר בהזמנה יעדכן/ימחק את
   * אותה הוצאה עצמה, לא ייצור כפולה. לפי בקשה מפורשת: "לא משנה אם ארשום
   * את זה ישירות בהוצאה או בתאריך של מלון, זה יכנס כהוצאה" — אחד או השני,
   * לא כפול. */
  bookingId?: string;
}
/** פיקדון (מלון/רכב שכור/וכו') — סכום שמוחזק זמנית ואמור לחזור, לא הוצאה
 * אמיתית: יורד מהארנק/נספר על הכרטיס כשניתן, וחוזר/מזוכה כשמסמנים
 * "הוחזר". status="pending" עד שמסמנים אחרת. */
export interface Deposit {
  id: string;
  title: string;
  amount: number;
  currency: string;
  paymentMethod: PaymentMethod;
  cardId?: string;
  bookingId?: string;
  dateGiven: string;
  expectedReturnDate?: string;
  expectedReturnTime?: string;
  status: "pending" | "returned";
  returnedDate?: string;
  notes?: string;
}
export interface MoneyAddition {
  id: string;
  currency: string;
  amount: number;
  source: MoneySource;
  date: string;
  note?: string;
}
export interface ConversionRecord {
  id: string;
  fromCurrency: string;
  fromAmount: number;
  toCurrency: string;
  toAmount: number;
  fee?: number;
  location?: string;
  dateTime: string;
  effectiveRate: number;
  marketRateAtTime?: number;
}

// dataUrl הוסר בכוונה: תמונת-המסמך עברה ל-IndexedDB (ר' image-store.ts),
// לפי מזהה — id כבר משמש כמפתח-החיפוש שם, אין טעם בשדה שני.
export interface DocumentEntry {
  id: string;
  kind: "insurance" | "passport" | "flight" | "hotel" | "other";
  title: string;
  createdAt: string;
}

export interface ProfileInfo {
  name: string;
  phone: string;
  email: string;
  countryCode: string;
  language: string;
  baseCurrency: string;
  emergencyContactName: string;
  emergencyContactPhone: string;
}

// ============================== קטלוג-מטבעות ==============================

// 8 מטבעות ברירת-מחדל להצגה מהירה (תואם למה שכבר נבנה) — אך "הוספת מטבע"
// וה-pickers מסתמכים על CURRENCY_META המלא (כל המטבעות לפי ISO 4217).
export interface CurrencyMeta {
  code: string;
  name: string;
  symbol: string;
}
export const CURRENCY_CATALOG: CurrencyMeta[] = [
  { code: "ILS", name: "שקל חדש", symbol: "₪" },
  { code: "USD", name: "דולר אמריקאי", symbol: "$" },
  { code: "EUR", name: "אירו", symbol: "€" },
  { code: "THB", name: "באט תאילנדי", symbol: "฿" },
  { code: "GBP", name: "לירה שטרלינג", symbol: "£" },
  { code: "JPY", name: "ין יפני", symbol: "¥" },
  { code: "AUD", name: "דולר אוסטרלי", symbol: "A$" },
  { code: "CHF", name: "פרנק שוויצרי", symbol: "Fr" },
];
export function currencyMeta(code: string): CurrencyMeta {
  const fromCatalog = CURRENCY_CATALOG.find((c) => c.code === code);
  if (fromCatalog) return fromCatalog;
  const meta = CURRENCY_META[code];
  if (meta) return { code: meta.code, name: meta.nameHe, symbol: meta.symbol };
  return { code, name: code, symbol: code };
}
export function formatMoney(amount: number, code: string) {
  const meta = currencyMeta(code);
  return `${meta.symbol} ${amount.toLocaleString(undefined, { maximumFractionDigits: 2 })}`;
}

/** קוד-המדינה (ISO alpha-2) שהמטבע הזה הוא ברירת-המחדל שלה — לצורך הצגת
 * דגל לצד מטבע כשאין הקשר-מדינה מפורש (כרטיסי-מטבע, שערי-חליפין וכו'). */
export function primaryCountryForCurrency(currencyCode: string): CountryEntry | null {
  for (const country of Object.values(COUNTRY_BY_CODE)) {
    if (country.currencyCodes[0] === currencyCode) return country;
  }
  for (const country of Object.values(COUNTRY_BY_CODE)) {
    if (country.currencyCodes.includes(currencyCode)) return country;
  }
  return null;
}

// ============================== אחסון מקומי (משותף) ==============================

export const SK = {
  balances: "design-preview-wallet-balances-v2",
  expenses: "design-preview-wallet-expenses-v2",
  cards: "design-preview-wallet-cards-v2",
  additions: "design-preview-wallet-additions-v2",
  conversions: "design-preview-wallet-conversions-v2",
  receipts: "design-preview-wallet-receipts-v2",
  baseCcy: "design-preview-wallet-basecurrency-v2",
  budget: "design-preview-wallet-budget-v1",
  manualCountry: "design-preview-wallet-manual-country-v1",
  geoCountry: "design-preview-wallet-geo-country-v1",
  lastBackupAt: "design-preview-wallet-last-backup-v1",
  documents: "design-preview-documents-v1",
  profile: "design-preview-profile-v1",
  settings: "design-preview-settings-v1",
  customCategories: "design-preview-wallet-custom-categories-v1",
  deposits: "design-preview-wallet-deposits-v1",
};

// כל מפתחות ה-localStorage שבשימוש בכל design-preview (ארנק + עוד + מסמכים
// + פרופיל + הגדרות) — לשימוש "איפוס נתוני הדגמה" במסך ההגדרות.
export const ALL_DESIGN_PREVIEW_KEYS: string[] = Object.values(SK);

/** משייכת מפתח-אחסון בסיסי לטיול ספציפי — כך שכל טיול מקבל "דלי" נפרד
 * לגמרי (ארנק/מסלול/הזמנות/אריזה/מעקב), לפי בקשה מפורשת: כל טיול חדש
 * מתחיל ריק, בלי לרשת נתונים מטיול אחר. "::" לא מופיע באף מפתח קיים
 * ("design-preview-*-v1/v2") ולא באף מזהה-טיול (nextId("trip") מבוסס
 * crypto.randomUUID), כך שאין סיכון-התנגשות. */
export function tripScopedKey(baseKey: string, tripId: string): string {
  return `${baseKey}::trip-${tripId}`;
}

export function loadJSON<T>(key: string, fallback: T): T {
  try {
    const raw = localStorage.getItem(key);
    if (!raw) return fallback;
    const parsed = JSON.parse(raw);
    return parsed ?? fallback;
  } catch {
    return fallback;
  }
}
// מוצג פעם אחת בלבד לכל טעינת-עמוד (לא בכל כשלון-שמירה בנפרד) — אחרת כמה
// שמירות שנכשלות באותו רגע (למשל כמה useEffect שרצים יחד) היו פותחות כמה
// חלונות-alert חוסמים ברצף, שזה גרוע יותר מהבעיה שמנסים לפתור.
let storageErrorShown = false;
/** באג אמיתי שתוקן: קודם, כשל-שמירה ב-localStorage/IndexedDB נבלע בשקט
 * לגמרי — המסך הראה "נשמר בהצלחה" והמשתמש עבר הלאה, בעוד שהנתונים בפועל
 * מעולם לא נשמרו. זה בדיוק מסביר דיווח כמו "הזנתי הרבה פרטים... כל פעם זה
 * לא נשמר". פונקציה משותפת (לא רק בתוך saveJSON) כי מאז שתמונות עברו
 * ל-IndexedDB (ר' image-store.ts) יש עוד נקודת-כשל אפשרית מעבר ל-
 * localStorage, וכשל אמיתי חייב תמיד להיות מוצג מיידית וברור, לא נבלע. */
export function notifyStorageFailure(message?: string) {
  if (storageErrorShown || typeof window === "undefined") return;
  storageErrorShown = true;
  window.alert(message ?? "שמירת הנתונים נכשלה — נראה שיש בעיה באחסון של הדפדפן (למשל אין מקום פנוי). השינוי האחרון כנראה לא נשמר. נסו לרענן ולנסות שוב.");
}

/** נורה בכל כתיבה מוצלחת ל-localStorage דרך saveJSON — כדי שדפים ישנים-
 * שכבר-נטענו (למשל דף הבית, אחרי חזרה-אחורה מ"הוספת הזמנה" ש-Next.js
 * שומר כ-instance חי בלי mount מחדש ובלי אירועי-דפדפן אמיתיים) יוכלו
 * להאזין ולרענן את עצמם לפי שינוי-נתון אמיתי, לא לפי ניחוש-מתי-ה-router
 * מחליט למחזר עמוד. באג אמיתי שאומת בפרודקשן: הזמנת-טיסה חדשה (מספר-
 * טיסה/שעת-המראה) לא הופיעה בכרטיס "הטיסה שלי" בדף הבית עד רענון-דף מלא. */
export const LOCAL_DATA_CHANGED_EVENT = "design-preview-local-data-changed";

export function saveJSON(key: string, value: unknown) {
  try {
    localStorage.setItem(key, JSON.stringify(value));
    if (typeof window !== "undefined") window.dispatchEvent(new CustomEvent(LOCAL_DATA_CHANGED_EVENT, { detail: { key } }));
  } catch (err) {
    console.error(`saveJSON failed for key "${key}":`, err);
    notifyStorageFailure();
  }
}

export const today = () => new Date().toISOString().slice(0, 10);
export const nowTime = () => new Date().toTimeString().slice(0, 5);

/** סדר-ברירת-מחדל לרשימות-בחירת-מטבע בהקשרי תשלום/הוצאה/המרה: המטבע
 * המקומי של יעד הטיול קודם (זה שבו כנראה משלמים בפועל), אחריו דולר/אירו/
 * שקל תמיד, ואז שאר המטבעות לפי סדר א'-ב' — לפי בקשה מפורשת. */
export function defaultCurrencyPriority(localCurrencyCode?: string | null): string[] {
  const order = [localCurrencyCode, "USD", "EUR", "ILS"].filter((c): c is string => !!c);
  return Array.from(new Set(order));
}

/** קטגוריות מותאמות-אישית שנוספו פעם — לדוגמה "מסאז'" — נשמרות כאן כדי
 * שיהיו זמינות לבחירה בפעם הבאה, לא רק בהוצאה שבה הן נוצרו. */
export function loadCustomCategories(): Category[] {
  return loadJSON<Category[]>(SK.customCategories, []);
}
export function addCustomCategory(name: Category): Category[] {
  const trimmed = name.trim();
  if (!trimmed) return loadCustomCategories();
  const existing = loadCustomCategories();
  if (BUILTIN_CATEGORIES.includes(trimmed) || existing.includes(trimmed)) return existing;
  const next = [...existing, trimmed];
  saveJSON(SK.customCategories, next);
  return next;
}
export function allCategories(): Category[] {
  return [...BUILTIN_CATEGORIES, ...loadCustomCategories()];
}

const CATEGORY_COLOR_PALETTE = ["#4f8fe0", "#43d6aa", "#f5a544", "#8a5adf", "#e0699a", "#e0524a", "#34D399", "#f472b6", "#60a5fa", "#fbbf24"];
/** צבע לקטגוריה — קבוע לפי השם עבור 6 הקטגוריות המובנות (כדי לא לשנות
 * את הצבעים הקיימים שכבר מוכרים למשתמש), ונגזר-דטרמיניסטית (לא רנדומלי
 * מחדש בכל רינדור) עבור כל קטגוריה מותאמת-אישית. */
export function categoryColor(category: Category, builtin: Record<string, string>): string {
  if (builtin[category]) return builtin[category]!;
  let hash = 0;
  for (let i = 0; i < category.length; i++) hash = (hash * 31 + category.charCodeAt(i)) >>> 0;
  return CATEGORY_COLOR_PALETTE[hash % CATEGORY_COLOR_PALETTE.length]!;
}

// לפי בקשה מפורשת: אין יותר יתרות/כרטיסים/הוצאות-דמו שמופיעים מעצמם.
// ארנק חדש (או אחרי איפוס) מתחיל ריק לגמרי — המשתמש מוסיף בעצמו את מה
// שבאמת יש לו. הקבועים נשארים ריקים בכוונה (לא נמחקים) כי loadJSON(key,
// INITIAL_X) עדיין משתמש בהם כברירת-המחדל כש-המפתח חסר.
export const INITIAL_BALANCES: CurrencyBalance[] = [];
export const INITIAL_CARDS: CreditCardInfo[] = [];
export const INITIAL_EXPENSES: Expense[] = [];

// עודכן מ-counter פשוט במשתנה-מודול ל-crypto.randomUUID(): ה-counter
// התאפס בכל טעינת-דף (משתנה בזיכרון בלבד, לא נשמר), ולכן הפקה חוזרת של
// אותו מזהה (למשל "tx-1001") אחרי כל reload — התנגשות אמיתית שגרמה
// לעריכת רשומה אחת לדרוס בטעות כמה רשומות-ישנות ששיתפו איתה אותו מזהה
// (ר' דיווח: "עריכת הוצאה אחת שינתה כמה הוצאות אחרות"). UUID לא מתנגש לעולם.
export function nextId(prefix: string) {
  return `${prefix}-${crypto.randomUUID()}`;
}

// דחיסת-תמונה בצד-לקוח (Canvas, בלי ספרייה חדשה).
export function compressImageFile(file: File, maxDim = 1000, quality = 0.72): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => {
      const img = new Image();
      img.onload = () => {
        let { width, height } = img;
        if (width > maxDim || height > maxDim) {
          const scale = maxDim / Math.max(width, height);
          width = Math.round(width * scale);
          height = Math.round(height * scale);
        }
        const canvas = document.createElement("canvas");
        canvas.width = width;
        canvas.height = height;
        const ctx = canvas.getContext("2d");
        if (!ctx) {
          reject(new Error("no canvas context"));
          return;
        }
        ctx.drawImage(img, 0, 0, width, height);
        resolve(canvas.toDataURL("image/jpeg", quality));
      };
      img.onerror = () => reject(new Error("image load failed"));
      img.src = String(reader.result);
    };
    reader.onerror = () => reject(new Error("file read failed"));
    reader.readAsDataURL(file);
  });
}

// ============================== גיבוי / שחזור / דוח (משותף) ==============================

export interface TripBudget {
  amount: number;
  currency: string;
}

export interface WalletState {
  balances: CurrencyBalance[];
  expenses: Expense[];
  cards: CreditCardInfo[];
  additions: MoneyAddition[];
  conversions: ConversionRecord[];
  receipts: Record<string, string>;
  baseCurrency: string;
  budget: TripBudget | null;
}

export function buildBackupBlob(state: WalletState): Blob {
  const payload = { version: 2, ...state, exportedAt: new Date().toISOString() };
  return new Blob([JSON.stringify(payload, null, 2)], { type: "application/json" });
}

export function downloadBlob(blob: Blob, filename: string) {
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}

export function parseBackupJSON(raw: string): WalletState | null {
  try {
    const parsed = JSON.parse(raw);
    if (!parsed || !Array.isArray(parsed.balances) || !Array.isArray(parsed.expenses)) return null;
    return {
      balances: parsed.balances,
      expenses: parsed.expenses,
      cards: Array.isArray(parsed.cards) ? parsed.cards : [],
      additions: Array.isArray(parsed.additions) ? parsed.additions : [],
      conversions: Array.isArray(parsed.conversions) ? parsed.conversions : [],
      receipts: parsed.receipts && typeof parsed.receipts === "object" ? parsed.receipts : {},
      baseCurrency: typeof parsed.baseCurrency === "string" ? parsed.baseCurrency : "ILS",
      budget: parsed.budget && typeof parsed.budget.amount === "number" && typeof parsed.budget.currency === "string" ? parsed.budget : null,
    };
  } catch {
    return null;
  }
}

export function buildExpenseReportCSV(expenses: Expense[], cards: CreditCardInfo[]): string {
  const rows = [["תאריך", "שעה", "כותרת", "קטגוריה", "מטבע", "סכום", "טיפ", "אמצעי תשלום", "כרטיס", "בית עסק"]];
  for (const e of expenses) {
    const card = cards.find((c) => c.id === e.cardId);
    rows.push([e.date, e.time ?? "", e.title, e.category, e.currency, String(e.amount), e.tipAmount ? String(e.tipAmount) : "", PAYMENT_METHOD_LABEL[e.paymentMethod], card ? `${card.nickname} (${card.last4})` : "", e.merchant ?? ""]);
  }
  return rows.map((r) => r.map((cell) => `"${String(cell).replace(/"/g, '""')}"`).join(",")).join("\n");
}

/** קורא ישירות מ-localStorage בלי React state — בשימוש ממסך "עוד" (שאינו
 * מחזיק state חי של הארנק) להצגת "תאריך גיבוי אחרון" ולבניית גיבוי/דוח.
 * מקבל tripId מפורש (לא קורא currentScopeTripId בעצמו) כדי לא ליצור מעגל-
 * ייבוא בין wallet-data.ts ל-trips-data.ts — הקורא (BackupSection) מחשב
 * את הטיול-הנוכחי ומעביר אותו. אסינכרונית (לא הייתה קודם): תמונות-הקבלות
 * עברו ל-IndexedDB (ר' image-store.ts) — כדי שקובץ-הגיבוי הכולל ימשיך
 * להכיל אותן inline בדיוק כמו קודם (בלי לשנות את פורמט-הקובץ שהמשתמש
 * מכיר), צריך לאסוף אותן בנפרד מ-IndexedDB לפי receiptId מתוך ההוצאות. */
export async function readWalletStateFromStorage(tripId: string): Promise<WalletState> {
  const expenses = loadJSON(tripScopedKey(SK.expenses, tripId), INITIAL_EXPENSES);
  const receipts: Record<string, string> = {};
  for (const e of expenses) {
    if (!e.receiptId) continue;
    const url = await getImage(e.receiptId);
    if (url) receipts[e.receiptId] = url;
  }
  return {
    balances: loadJSON(tripScopedKey(SK.balances, tripId), INITIAL_BALANCES),
    expenses,
    cards: loadJSON(tripScopedKey(SK.cards, tripId), INITIAL_CARDS),
    additions: loadJSON(tripScopedKey(SK.additions, tripId), []),
    conversions: loadJSON(tripScopedKey(SK.conversions, tripId), []),
    receipts,
    baseCurrency: loadJSON(tripScopedKey(SK.baseCcy, tripId), "ILS"),
    budget: loadJSON<TripBudget | null>(tripScopedKey(SK.budget, tripId), null),
  };
}
export async function writeWalletStateToStorage(state: WalletState, tripId: string): Promise<void> {
  saveJSON(tripScopedKey(SK.balances, tripId), state.balances);
  saveJSON(tripScopedKey(SK.expenses, tripId), state.expenses);
  saveJSON(tripScopedKey(SK.cards, tripId), state.cards);
  saveJSON(tripScopedKey(SK.additions, tripId), state.additions);
  saveJSON(tripScopedKey(SK.conversions, tripId), state.conversions);
  for (const [id, dataUrl] of Object.entries(state.receipts)) {
    try {
      await putImage(id, dataUrl);
    } catch (err) {
      console.error(`writeWalletStateToStorage: putImage failed for receipt "${id}":`, err);
      notifyStorageFailure();
    }
  }
  saveJSON(tripScopedKey(SK.baseCcy, tripId), state.baseCurrency);
  saveJSON(tripScopedKey(SK.budget, tripId), state.budget);
}

// ============================== מטבע מקומי — זיהוי אוטומטי ==============================

// יעדי-הטיול לפי סדר (תואם בדיוק ל-STOPS ב-route/page.tsx) + קוד-המדינה
// שלהם — משמש היום רק לגזירת תאריכי-ההתחלה/סיום של טיול-הדמו הקבוע
// JAPAN_TRIP ב-trips-data.ts (טוקיו→קיוטו→אוסקה→הירושימה→טוקיו,
// 15/06/2025-28/06/2025, לפי רשימת-היעדים במסך "שינוי סדר היעדים").
// **לא** משמש יותר לזיהוי "מטבע מקומי" — זה עבר ל-activeTrip() האמיתי
// ב-trips-data.ts (ר' התיעוד ב-resolveLocalCurrency למטה), כי הנתון הזה
// קבוע-לתאריך ולא מתעדכן לטיולים אמיתיים שהמשתמש יוצר.
interface TripStopCountry {
  city: string;
  countryCode: string;
  firstDay: string;
}
export const TRIP_STOP_COUNTRIES: TripStopCountry[] = [
  { city: "טוקיו", countryCode: "JP", firstDay: "2025-06-15" },
  { city: "קיוטו", countryCode: "JP", firstDay: "2025-06-18" },
  { city: "אוסקה", countryCode: "JP", firstDay: "2025-06-21" },
  { city: "הירושימה", countryCode: "JP", firstDay: "2025-06-23" },
  { city: "טוקיו", countryCode: "JP", firstDay: "2025-06-26" },
];
export const TRIP_LAST_DAY = "2025-06-28";

export interface LocalCurrencyResolution {
  currencyCode: string;
  countryCode: string | null;
  source: "manual" | "trip" | "geo" | "default";
  sourceLabel: string;
}

/**
 * קובע את "המטבע המקומי" הנוכחי לפי סדר-העדיפות המבוקש: (1) מדינה שנבחרה
 * ידנית תמיד גוברת — זו "האפשרות לשנות ידנית" המפורשת; (2) אחרת, יעד-הטיול
 * הפעיל **האמיתי** (מועבר ע"י הקורא — ר' `tripCountryCode`, שמחושב דרך
 * `activeTrip()` ב-`trips-data.ts`, לא דרך `activeDestinationCountry`
 * המבוסס על נתון-דמו קבוע-לתאריך שאינו קשור לטיול האמיתי של המשתמש);
 * (3) אחרת, מיקום-מכשיר שזוהה (geolocation); (4) אחרת, מטבע-הבסיס של
 * המשתמש. מעולם לא נוגע ביתרות/היסטוריה — קובע רק תצוגה.
 */
export function resolveLocalCurrency(opts: { manualCountryCode: string | null; geoCountryCode: string | null; baseCurrency: string; tripCountryCode?: string | null }): LocalCurrencyResolution {
  if (opts.manualCountryCode) {
    const country = COUNTRY_BY_CODE[opts.manualCountryCode];
    if (country) return { currencyCode: country.currencyCodes[0]!, countryCode: country.code, source: "manual", sourceLabel: "נבחר ידנית" };
  }
  if (opts.tripCountryCode) {
    const country = COUNTRY_BY_CODE[opts.tripCountryCode];
    if (country) return { currencyCode: country.currencyCodes[0]!, countryCode: country.code, source: "trip", sourceLabel: "לפי יעד הטיול הפעיל" };
  }
  if (opts.geoCountryCode) {
    const country = COUNTRY_BY_CODE[opts.geoCountryCode];
    if (country) return { currencyCode: country.currencyCodes[0]!, countryCode: country.code, source: "geo", sourceLabel: "לפי מיקום המכשיר" };
  }
  return { currencyCode: opts.baseCurrency, countryCode: primaryCountryForCurrency(opts.baseCurrency)?.code ?? null, source: "default", sourceLabel: "ברירת המחדל שלך" };
}
