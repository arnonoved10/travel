import { CURRENCY_META, COUNTRY_BY_CODE, type CountryEntry } from "./country-currency-data";

/**
 * לוגיקה/טיפוסים/אחסון משותפים לארנק (wallet/page.tsx) ולמסך "עוד"
 * (more/page.tsx) — קובץ נפרד כדי ששני המסכים יוכלו לקרוא/לכתוב לאותם
 * מפתחות-localStorage ולהשתמש באותה לוגיקת גיבוי/שחזור בלי כפילות קוד,
 * לפי הבקשה המפורשת להעביר את כפתורי הגיבוי/שחזור/דוח מהארנק אל "עוד".
 */

// ============================== טיפוסים ==============================

export type Category = "מלון" | "מסעדות" | "תחבורה" | "פעילויות" | "קניות" | "אחר";
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
}
export interface Expense {
  id: string;
  title: string;
  merchant?: string;
  category: Category;
  currency: string;
  amount: number;
  date: string;
  paymentMethod: PaymentMethod;
  cardId?: string;
  receiptId?: string;
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

export interface DocumentEntry {
  id: string;
  kind: "insurance" | "passport" | "flight" | "hotel" | "other";
  title: string;
  dataUrl: string;
  createdAt: string;
}

export interface ProfileInfo {
  name: string;
  photoDataUrl: string | null;
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
  manualCountry: "design-preview-wallet-manual-country-v1",
  geoCountry: "design-preview-wallet-geo-country-v1",
  lastBackupAt: "design-preview-wallet-last-backup-v1",
  documents: "design-preview-documents-v1",
  profile: "design-preview-profile-v1",
  settings: "design-preview-settings-v1",
};

// כל מפתחות ה-localStorage שבשימוש בכל design-preview (ארנק + עוד + מסמכים
// + פרופיל + הגדרות) — לשימוש "איפוס נתוני הדגמה" במסך ההגדרות.
export const ALL_DESIGN_PREVIEW_KEYS: string[] = Object.values(SK);

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
export function saveJSON(key: string, value: unknown) {
  try {
    localStorage.setItem(key, JSON.stringify(value));
  } catch {
    // localStorage לא זמין — לא קריטי להדגמה
  }
}

export const today = () => new Date().toISOString().slice(0, 10);

export const INITIAL_BALANCES: CurrencyBalance[] = [
  { code: "ILS", balance: 0, spent: 0, lastUpdated: today() },
  { code: "USD", balance: 0, spent: 0, lastUpdated: today() },
  { code: "EUR", balance: 0, spent: 0, lastUpdated: today() },
  { code: "THB", balance: 0, spent: 0, lastUpdated: today() },
];
export const INITIAL_EXPENSES: Expense[] = [];

let idCounter = 1000;
export function nextId(prefix: string) {
  idCounter += 1;
  return `${prefix}-${idCounter}`;
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

export interface WalletState {
  balances: CurrencyBalance[];
  expenses: Expense[];
  cards: CreditCardInfo[];
  additions: MoneyAddition[];
  conversions: ConversionRecord[];
  receipts: Record<string, string>;
  baseCurrency: string;
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
    };
  } catch {
    return null;
  }
}

export function buildExpenseReportCSV(expenses: Expense[], cards: CreditCardInfo[]): string {
  const rows = [["תאריך", "כותרת", "קטגוריה", "מטבע", "סכום", "אמצעי תשלום", "כרטיס", "בית עסק"]];
  for (const e of expenses) {
    const card = cards.find((c) => c.id === e.cardId);
    rows.push([e.date, e.title, e.category, e.currency, String(e.amount), PAYMENT_METHOD_LABEL[e.paymentMethod], card ? `${card.nickname} (${card.last4})` : "", e.merchant ?? ""]);
  }
  return rows.map((r) => r.map((cell) => `"${String(cell).replace(/"/g, '""')}"`).join(",")).join("\n");
}

/** קורא ישירות מ-localStorage בלי React state — בשימוש ממסך "עוד" (שאינו
 * מחזיק state חי של הארנק) להצגת "תאריך גיבוי אחרון" ולבניית גיבוי/דוח. */
export function readWalletStateFromStorage(): WalletState {
  return {
    balances: loadJSON(SK.balances, INITIAL_BALANCES),
    expenses: loadJSON(SK.expenses, INITIAL_EXPENSES),
    cards: loadJSON(SK.cards, []),
    additions: loadJSON(SK.additions, []),
    conversions: loadJSON(SK.conversions, []),
    receipts: loadJSON(SK.receipts, {}),
    baseCurrency: loadJSON(SK.baseCcy, "ILS"),
  };
}
export function writeWalletStateToStorage(state: WalletState) {
  saveJSON(SK.balances, state.balances);
  saveJSON(SK.expenses, state.expenses);
  saveJSON(SK.cards, state.cards);
  saveJSON(SK.additions, state.additions);
  saveJSON(SK.conversions, state.conversions);
  saveJSON(SK.receipts, state.receipts);
  saveJSON(SK.baseCcy, state.baseCurrency);
}

// ============================== מטבע מקומי — זיהוי אוטומטי ==============================

// יעדי-הטיול לפי סדר (תואם בדיוק ל-STOPS ב-route/page.tsx) + קוד-המדינה
// שלהם — לצורך "יעד טיול פעיל לפי תאריך". טווח כל תחנה הוא [firstDay של
// התחנה, firstDay של התחנה הבאה) והתחנה האחרונה נמשכת עד TRIP_LAST_DAY.
interface TripStopCountry {
  city: string;
  countryCode: string;
  firstDay: string;
}
export const TRIP_STOP_COUNTRIES: TripStopCountry[] = [
  { city: "תל אביב", countryCode: "IL", firstDay: "2026-04-30" },
  { city: "בנגקוק", countryCode: "TH", firstDay: "2026-05-04" },
  { city: "פטאיה", countryCode: "TH", firstDay: "2026-05-10" },
  { city: "קוה צ'אנג", countryCode: "TH", firstDay: "2026-05-15" },
  { city: "בנגקוק", countryCode: "TH", firstDay: "2026-06-20" },
];
export const TRIP_LAST_DAY = "2026-06-22";

// התאריך האמיתי-הנוכחי (2026-08) חל אחרי סוף הטיול המודגם (יוני 2026), כך
// שלפי תאריך-מערכת אמיתי לעולם לא תימצא "תחנה פעילה" — בדיוק כמו שעון-הדמו
// במסך-הבית, שגם הוא עוגן לציר-הזמן-של-הטיול ולא לשעון-האמיתי, כדי שהתכונה
// תישאר ניתנת-להדגמה. תאריך-הייחוס להלן קבוע בכוונה בתוך טווח שהיית בנגקוק.
export const DEMO_REFERENCE_DATE = "2026-05-06";

export function activeDestinationCountry(referenceDate: string): { countryCode: string; city: string } | null {
  if (referenceDate < TRIP_STOP_COUNTRIES[0]!.firstDay || referenceDate >= TRIP_LAST_DAY) return null;
  for (let i = 0; i < TRIP_STOP_COUNTRIES.length; i++) {
    const stop = TRIP_STOP_COUNTRIES[i]!;
    const start = stop.firstDay;
    const end = i + 1 < TRIP_STOP_COUNTRIES.length ? TRIP_STOP_COUNTRIES[i + 1]!.firstDay : TRIP_LAST_DAY;
    if (referenceDate >= start && referenceDate < end) return { countryCode: stop.countryCode, city: stop.city };
  }
  return null;
}

export interface LocalCurrencyResolution {
  currencyCode: string;
  countryCode: string | null;
  source: "manual" | "trip" | "geo" | "default";
  sourceLabel: string;
}

/**
 * קובע את "המטבע המקומי" הנוכחי לפי סדר-העדיפות המבוקש: (1) מדינה שנבחרה
 * ידנית תמיד גוברת — זו "האפשרות לשנות ידנית" המפורשת; (2) אחרת, יעד-טיול
 * פעיל לפי תאריך; (3) אחרת, מיקום-מכשיר שזוהה (geolocation); (4) אחרת,
 * מטבע-הבסיס של המשתמש. מעולם לא נוגע ביתרות/היסטוריה — קובע רק תצוגה.
 */
export function resolveLocalCurrency(opts: { manualCountryCode: string | null; geoCountryCode: string | null; baseCurrency: string; referenceDate?: string }): LocalCurrencyResolution {
  if (opts.manualCountryCode) {
    const country = COUNTRY_BY_CODE[opts.manualCountryCode];
    if (country) return { currencyCode: country.currencyCodes[0]!, countryCode: country.code, source: "manual", sourceLabel: "נבחר ידנית" };
  }
  const trip = activeDestinationCountry(opts.referenceDate ?? DEMO_REFERENCE_DATE);
  if (trip) {
    const country = COUNTRY_BY_CODE[trip.countryCode];
    if (country) return { currencyCode: country.currencyCodes[0]!, countryCode: country.code, source: "trip", sourceLabel: `לפי יעד הטיול הפעיל (${trip.city})` };
  }
  if (opts.geoCountryCode) {
    const country = COUNTRY_BY_CODE[opts.geoCountryCode];
    if (country) return { currencyCode: country.currencyCodes[0]!, countryCode: country.code, source: "geo", sourceLabel: "לפי מיקום המכשיר" };
  }
  return { currencyCode: opts.baseCurrency, countryCode: primaryCountryForCurrency(opts.baseCurrency)?.code ?? null, source: "default", sourceLabel: "ברירת המחדל שלך" };
}
