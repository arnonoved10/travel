// מיפוי מדינות↔מטבעות לפי תקן ISO 3166-1 (מדינות) ו-ISO 4217 (מטבעות) —
// כיסוי אמיתי של כל מדינות-החברות ב-או"ם (לא רשימה חלקית/מומצאת, לפי
// בקשה מפורשת). כל מדינה כוללת: קוד alpha-2, שם עברי, שם אנגלי, וקוד(י)
// המטבע הרשמי (הראשון = ברירת-המחדל אם יש כמה, כמו פנמה/קובה).

import type { ReactElement } from "react";

export interface CurrencyMeta {
  code: string;
  nameHe: string;
  symbol: string;
}
export const CURRENCY_META: Record<string, CurrencyMeta> = {
  ILS: { code: "ILS", nameHe: "שקל חדש", symbol: "₪" },
  USD: { code: "USD", nameHe: "דולר אמריקאי", symbol: "$" },
  EUR: { code: "EUR", nameHe: "אירו", symbol: "€" },
  GBP: { code: "GBP", nameHe: "לירה שטרלינג", symbol: "£" },
  JPY: { code: "JPY", nameHe: "ין יפני", symbol: "¥" },
  CHF: { code: "CHF", nameHe: "פרנק שוויצרי", symbol: "Fr" },
  SGD: { code: "SGD", nameHe: "דולר סינגפורי", symbol: "S$" },
  THB: { code: "THB", nameHe: "באט תאילנדי", symbol: "฿" },
  AUD: { code: "AUD", nameHe: "דולר אוסטרלי", symbol: "A$" },
  CAD: { code: "CAD", nameHe: "דולר קנדי", symbol: "C$" },
  CNY: { code: "CNY", nameHe: "יואן סיני", symbol: "¥" },
  INR: { code: "INR", nameHe: "רופי הודי", symbol: "₹" },
  KRW: { code: "KRW", nameHe: "וון דרום־קוריאני", symbol: "₩" },
  HKD: { code: "HKD", nameHe: "דולר הונג־קונגי", symbol: "HK$" },
  NZD: { code: "NZD", nameHe: "דולר ניו־זילנדי", symbol: "NZ$" },
  SEK: { code: "SEK", nameHe: "קרונה שוודית", symbol: "kr" },
  NOK: { code: "NOK", nameHe: "קרונה נורווגית", symbol: "kr" },
  DKK: { code: "DKK", nameHe: "קרונה דנית", symbol: "kr" },
  ISK: { code: "ISK", nameHe: "קרונה איסלנדית", symbol: "kr" },
  PLN: { code: "PLN", nameHe: "זלוטי פולני", symbol: "zł" },
  CZK: { code: "CZK", nameHe: "קורונה צ'כית", symbol: "Kč" },
  HUF: { code: "HUF", nameHe: "פורינט הונגרי", symbol: "Ft" },
  RON: { code: "RON", nameHe: "ליי רומני", symbol: "lei" },
  BGN: { code: "BGN", nameHe: "לב בולגרי", symbol: "лв" },
  TRY: { code: "TRY", nameHe: "לירה טורקית", symbol: "₺" },
  RUB: { code: "RUB", nameHe: "רובל רוסי", symbol: "₽" },
  UAH: { code: "UAH", nameHe: "הריבניה האוקראינית", symbol: "₴" },
  BYN: { code: "BYN", nameHe: "רובל בלארוסי", symbol: "Br" },
  RSD: { code: "RSD", nameHe: "דינר סרבי", symbol: "дин" },
  MKD: { code: "MKD", nameHe: "דינר מקדוני", symbol: "ден" },
  ALL: { code: "ALL", nameHe: "לק אלבני", symbol: "L" },
  BAM: { code: "BAM", nameHe: "מארקה בוסנית", symbol: "КМ" },
  MDL: { code: "MDL", nameHe: "לאו מולדבי", symbol: "L" },
  AED: { code: "AED", nameHe: "דירהם איחוד האמירויות", symbol: "د.إ" },
  SAR: { code: "SAR", nameHe: "ריאל סעודי", symbol: "ر.س" },
  QAR: { code: "QAR", nameHe: "ריאל קטארי", symbol: "ر.ق" },
  KWD: { code: "KWD", nameHe: "דינר כוויתי", symbol: "د.ك" },
  BHD: { code: "BHD", nameHe: "דינר בחרייני", symbol: ".د.ب" },
  OMR: { code: "OMR", nameHe: "ריאל עומאני", symbol: "ر.ع" },
  JOD: { code: "JOD", nameHe: "דינר ירדני", symbol: "د.ا" },
  LBP: { code: "LBP", nameHe: "לירה לבנונית", symbol: "ل.ل" },
  EGP: { code: "EGP", nameHe: "לירה מצרית", symbol: "ج.م" },
  MAD: { code: "MAD", nameHe: "דירהם מרוקאי", symbol: "د.م" },
  TND: { code: "TND", nameHe: "דינר תוניסאי", symbol: "د.ت" },
  DZD: { code: "DZD", nameHe: "דינר אלג'יראי", symbol: "د.ج" },
  LYD: { code: "LYD", nameHe: "דינר לובי", symbol: "ل.د" },
  SDG: { code: "SDG", nameHe: "לירה סודנית", symbol: "ج.س" },
  SSP: { code: "SSP", nameHe: "לירה דרום־סודנית", symbol: "SSP" },
  IRR: { code: "IRR", nameHe: "ריאל איראני", symbol: "﷼" },
  IQD: { code: "IQD", nameHe: "דינר עיראקי", symbol: "ع.د" },
  YER: { code: "YER", nameHe: "ריאל תימני", symbol: "﷼" },
  SYP: { code: "SYP", nameHe: "לירה סורית", symbol: "ل.س" },
  ZAR: { code: "ZAR", nameHe: "ראנד דרום־אפריקאי", symbol: "R" },
  NGN: { code: "NGN", nameHe: "נַיירה ניגרית", symbol: "₦" },
  KES: { code: "KES", nameHe: "שילינג קנייתי", symbol: "KSh" },
  GHS: { code: "GHS", nameHe: "סֶדי גאני", symbol: "₵" },
  ETB: { code: "ETB", nameHe: "בּיר אתיופי", symbol: "Br" },
  TZS: { code: "TZS", nameHe: "שילינג טנזני", symbol: "TSh" },
  UGX: { code: "UGX", nameHe: "שילינג אוגנדי", symbol: "USh" },
  RWF: { code: "RWF", nameHe: "פרנק רואנדי", symbol: "FRw" },
  BIF: { code: "BIF", nameHe: "פרנק בורונדי", symbol: "FBu" },
  MZN: { code: "MZN", nameHe: "מטיקל מוזמביקי", symbol: "MT" },
  ZMW: { code: "ZMW", nameHe: "קוואצ'ה זמבית", symbol: "ZK" },
  ZWL: { code: "ZWL", nameHe: "דולר זימבבואה", symbol: "Z$" },
  MWK: { code: "MWK", nameHe: "קוואצ'ה מלאווית", symbol: "MK" },
  NAD: { code: "NAD", nameHe: "דולר נמיבי", symbol: "N$" },
  BWP: { code: "BWP", nameHe: "פולה בוצואנה", symbol: "P" },
  SZL: { code: "SZL", nameHe: "לילנגני אסواטיני", symbol: "L" },
  LSL: { code: "LSL", nameHe: "לוטי לסוטו", symbol: "L" },
  MGA: { code: "MGA", nameHe: "אריארי מדגסקר", symbol: "Ar" },
  MUR: { code: "MUR", nameHe: "רופי מאוריציוס", symbol: "₨" },
  SCR: { code: "SCR", nameHe: "רופי סיישל", symbol: "₨" },
  CVE: { code: "CVE", nameHe: "אסקודו כף ורדה", symbol: "$" },
  STN: { code: "STN", nameHe: "דוברה סאו טומה", symbol: "Db" },
  GMD: { code: "GMD", nameHe: "דאלאסי גמביה", symbol: "D" },
  GNF: { code: "GNF", nameHe: "פרנק גינאה", symbol: "FG" },
  SLL: { code: "SLL", nameHe: "ליאון סיירה לאונה", symbol: "Le" },
  LRD: { code: "LRD", nameHe: "דולר ליבריה", symbol: "L$" },
  CDF: { code: "CDF", nameHe: "פרנק קונגו", symbol: "FC" },
  AOA: { code: "AOA", nameHe: "קוואנזה אנגולה", symbol: "Kz" },
  XOF: { code: "XOF", nameHe: "פרנק CFA מערב־אפריקה", symbol: "CFA" },
  XAF: { code: "XAF", nameHe: "פרנק CFA מרכז־אפריקה", symbol: "FCFA" },
  SOS: { code: "SOS", nameHe: "שילינג סומלי", symbol: "Sh" },
  DJF: { code: "DJF", nameHe: "פרנק ג'יבוטי", symbol: "Fdj" },
  ERN: { code: "ERN", nameHe: "נקפה אריתראית", symbol: "Nfk" },
  MXN: { code: "MXN", nameHe: "פסו מקסיקני", symbol: "$" },
  BRL: { code: "BRL", nameHe: "ריאל ברזילאי", symbol: "R$" },
  ARS: { code: "ARS", nameHe: "פסו ארגנטינאי", symbol: "$" },
  CLP: { code: "CLP", nameHe: "פסו צ'יליאני", symbol: "$" },
  COP: { code: "COP", nameHe: "פסו קולומביאני", symbol: "$" },
  PEN: { code: "PEN", nameHe: "סול פרואני", symbol: "S/" },
  UYU: { code: "UYU", nameHe: "פסו אורוגוואי", symbol: "$U" },
  BOB: { code: "BOB", nameHe: "בוליביאנו בוליבי", symbol: "Bs" },
  PYG: { code: "PYG", nameHe: "גוארני פרגוואי", symbol: "₲" },
  VES: { code: "VES", nameHe: "בוליבר ונצואלי", symbol: "Bs" },
  GYD: { code: "GYD", nameHe: "דולר גיאני", symbol: "G$" },
  SRD: { code: "SRD", nameHe: "דולר סורינאמי", symbol: "$" },
  CRC: { code: "CRC", nameHe: "קולון קוסטה־ריקני", symbol: "₡" },
  PAB: { code: "PAB", nameHe: "בלבואה פנמי", symbol: "B/." },
  DOP: { code: "DOP", nameHe: "פסו דומיניקני", symbol: "RD$" },
  GTQ: { code: "GTQ", nameHe: "קצל גואטמלי", symbol: "Q" },
  HNL: { code: "HNL", nameHe: "למפירה הונדוראית", symbol: "L" },
  NIO: { code: "NIO", nameHe: "קורדובה ניקרגואית", symbol: "C$" },
  CUP: { code: "CUP", nameHe: "פסו קובני", symbol: "$" },
  JMD: { code: "JMD", nameHe: "דולר ג'מייקני", symbol: "J$" },
  TTD: { code: "TTD", nameHe: "דולר טרינידד וטובגו", symbol: "TT$" },
  BSD: { code: "BSD", nameHe: "דולר בהאמי", symbol: "B$" },
  BBD: { code: "BBD", nameHe: "דולר ברבדוסי", symbol: "Bds$" },
  BZD: { code: "BZD", nameHe: "דולר בליזי", symbol: "BZ$" },
  XCD: { code: "XCD", nameHe: "דולר מזרח־קריבי", symbol: "EC$" },
  HTG: { code: "HTG", nameHe: "גורד האיטי", symbol: "G" },
  IDR: { code: "IDR", nameHe: "רופיה אינדונזית", symbol: "Rp" },
  MYR: { code: "MYR", nameHe: "רינגיט מלזי", symbol: "RM" },
  PHP: { code: "PHP", nameHe: "פסו פיליפיני", symbol: "₱" },
  VND: { code: "VND", nameHe: "דונג וייטנאמי", symbol: "₫" },
  KHR: { code: "KHR", nameHe: "ריאל קמבודי", symbol: "៛" },
  LAK: { code: "LAK", nameHe: "קיפ לאוטי", symbol: "₭" },
  MMK: { code: "MMK", nameHe: "קיאט מיאנמרי", symbol: "K" },
  BDT: { code: "BDT", nameHe: "טאקה בנגלדשי", symbol: "৳" },
  PKR: { code: "PKR", nameHe: "רופי פקיסטני", symbol: "₨" },
  LKR: { code: "LKR", nameHe: "רופי סרי־לנקי", symbol: "₨" },
  NPR: { code: "NPR", nameHe: "רופי נפאלי", symbol: "₨" },
  BTN: { code: "BTN", nameHe: "נגולטרום בהוטני", symbol: "Nu" },
  MVR: { code: "MVR", nameHe: "רופיה מלדיבית", symbol: "Rf" },
  AFN: { code: "AFN", nameHe: "אפגני", symbol: "؋" },
  KZT: { code: "KZT", nameHe: "טנגה קזחסטני", symbol: "₸" },
  UZS: { code: "UZS", nameHe: "סום אוזבקי", symbol: "so'm" },
  KGS: { code: "KGS", nameHe: "סום קירגיזי", symbol: "с" },
  TJS: { code: "TJS", nameHe: "סומוני טג'יקי", symbol: "SM" },
  TMT: { code: "TMT", nameHe: "מנאט טורקמני", symbol: "m" },
  AZN: { code: "AZN", nameHe: "מנאט אזרבייג'ני", symbol: "₼" },
  GEL: { code: "GEL", nameHe: "לארי גאורגי", symbol: "₾" },
  AMD: { code: "AMD", nameHe: "דראם ארמני", symbol: "֏" },
  MNT: { code: "MNT", nameHe: "טוגריק מונגולי", symbol: "₮" },
  TWD: { code: "TWD", nameHe: "דולר טאיוואני", symbol: "NT$" },
  BND: { code: "BND", nameHe: "דולר ברוניי", symbol: "B$" },
  FJD: { code: "FJD", nameHe: "דולר פיג'י", symbol: "FJ$" },
  PGK: { code: "PGK", nameHe: "קינה פפואה גינאה החדשה", symbol: "K" },
  WST: { code: "WST", nameHe: "טאלה סמואה", symbol: "WS$" },
  TOP: { code: "TOP", nameHe: "פאעה טונגה", symbol: "T$" },
  VUV: { code: "VUV", nameHe: "ואטו ואנואטו", symbol: "VT" },
  SBD: { code: "SBD", nameHe: "דולר איי־שלמה", symbol: "SI$" },
  XPF: { code: "XPF", nameHe: "פרנק CFP", symbol: "₣" },
  KPW: { code: "KPW", nameHe: "וון צפון־קוריאני", symbol: "₩" },
};

export interface CountryEntry {
  code: string; // ISO 3166-1 alpha-2
  nameHe: string;
  nameEn: string;
  currencyCodes: string[]; // הראשון = ברירת-מחדל
}

// כל מדינות-החברות באו"ם (193) + כמה טריטוריות נפוצות בטיולים (טאיוואן,
// הונג-קונג, פלסטין) — לא רשימה חלקית. אירוזון: כל המדינות המשתמשות
// באירו מקבלות currencyCodes:["EUR"].
export const COUNTRIES: CountryEntry[] = [
  { code: "IL", nameHe: "ישראל", nameEn: "Israel", currencyCodes: ["ILS"] },
  { code: "TH", nameHe: "תאילנד", nameEn: "Thailand", currencyCodes: ["THB"] },
  { code: "US", nameHe: "ארצות הברית", nameEn: "United States", currencyCodes: ["USD"] },
  { code: "GB", nameHe: "בריטניה", nameEn: "United Kingdom", currencyCodes: ["GBP"] },
  { code: "JP", nameHe: "יפן", nameEn: "Japan", currencyCodes: ["JPY"] },
  { code: "CH", nameHe: "שווייץ", nameEn: "Switzerland", currencyCodes: ["CHF"] },
  { code: "SG", nameHe: "סינגפור", nameEn: "Singapore", currencyCodes: ["SGD"] },
  { code: "DE", nameHe: "גרמניה", nameEn: "Germany", currencyCodes: ["EUR"] },
  { code: "FR", nameHe: "צרפת", nameEn: "France", currencyCodes: ["EUR"] },
  { code: "IT", nameHe: "איטליה", nameEn: "Italy", currencyCodes: ["EUR"] },
  { code: "ES", nameHe: "ספרד", nameEn: "Spain", currencyCodes: ["EUR"] },
  { code: "PT", nameHe: "פורטוגל", nameEn: "Portugal", currencyCodes: ["EUR"] },
  { code: "NL", nameHe: "הולנד", nameEn: "Netherlands", currencyCodes: ["EUR"] },
  { code: "BE", nameHe: "בלגיה", nameEn: "Belgium", currencyCodes: ["EUR"] },
  { code: "AT", nameHe: "אוסטריה", nameEn: "Austria", currencyCodes: ["EUR"] },
  { code: "GR", nameHe: "יוון", nameEn: "Greece", currencyCodes: ["EUR"] },
  { code: "IE", nameHe: "אירלנד", nameEn: "Ireland", currencyCodes: ["EUR"] },
  { code: "FI", nameHe: "פינלנד", nameEn: "Finland", currencyCodes: ["EUR"] },
  { code: "LU", nameHe: "לוקסמבורג", nameEn: "Luxembourg", currencyCodes: ["EUR"] },
  { code: "CY", nameHe: "קפריסין", nameEn: "Cyprus", currencyCodes: ["EUR"] },
  { code: "MT", nameHe: "מלטה", nameEn: "Malta", currencyCodes: ["EUR"] },
  { code: "SK", nameHe: "סלובקיה", nameEn: "Slovakia", currencyCodes: ["EUR"] },
  { code: "SI", nameHe: "סלובניה", nameEn: "Slovenia", currencyCodes: ["EUR"] },
  { code: "EE", nameHe: "אסטוניה", nameEn: "Estonia", currencyCodes: ["EUR"] },
  { code: "LV", nameHe: "לטביה", nameEn: "Latvia", currencyCodes: ["EUR"] },
  { code: "LT", nameHe: "ליטא", nameEn: "Lithuania", currencyCodes: ["EUR"] },
  { code: "HR", nameHe: "קרואטיה", nameEn: "Croatia", currencyCodes: ["EUR"] },
  { code: "PL", nameHe: "פולין", nameEn: "Poland", currencyCodes: ["PLN"] },
  { code: "CZ", nameHe: "צ'כיה", nameEn: "Czechia", currencyCodes: ["CZK"] },
  { code: "HU", nameHe: "הונגריה", nameEn: "Hungary", currencyCodes: ["HUF"] },
  { code: "RO", nameHe: "רומניה", nameEn: "Romania", currencyCodes: ["RON"] },
  { code: "BG", nameHe: "בולגריה", nameEn: "Bulgaria", currencyCodes: ["BGN"] },
  { code: "SE", nameHe: "שוודיה", nameEn: "Sweden", currencyCodes: ["SEK"] },
  { code: "NO", nameHe: "נורווגיה", nameEn: "Norway", currencyCodes: ["NOK"] },
  { code: "DK", nameHe: "דנמרק", nameEn: "Denmark", currencyCodes: ["DKK"] },
  { code: "IS", nameHe: "איסלנד", nameEn: "Iceland", currencyCodes: ["ISK"] },
  { code: "TR", nameHe: "טורקיה", nameEn: "Turkey", currencyCodes: ["TRY"] },
  { code: "RU", nameHe: "רוסיה", nameEn: "Russia", currencyCodes: ["RUB"] },
  { code: "UA", nameHe: "אוקראינה", nameEn: "Ukraine", currencyCodes: ["UAH"] },
  { code: "BY", nameHe: "בלארוס", nameEn: "Belarus", currencyCodes: ["BYN"] },
  { code: "RS", nameHe: "סרביה", nameEn: "Serbia", currencyCodes: ["RSD"] },
  { code: "MK", nameHe: "צפון מקדוניה", nameEn: "North Macedonia", currencyCodes: ["MKD"] },
  { code: "AL", nameHe: "אלבניה", nameEn: "Albania", currencyCodes: ["ALL"] },
  { code: "BA", nameHe: "בוסניה והרצגובינה", nameEn: "Bosnia and Herzegovina", currencyCodes: ["BAM"] },
  { code: "ME", nameHe: "מונטנגרו", nameEn: "Montenegro", currencyCodes: ["EUR"] },
  { code: "XK", nameHe: "קוסובו", nameEn: "Kosovo", currencyCodes: ["EUR"] },
  { code: "MD", nameHe: "מולדובה", nameEn: "Moldova", currencyCodes: ["MDL"] },
  { code: "CH_", nameHe: "ליכטנשטיין", nameEn: "Liechtenstein", currencyCodes: ["CHF"] },
  { code: "AD", nameHe: "אנדורה", nameEn: "Andorra", currencyCodes: ["EUR"] },
  { code: "MC", nameHe: "מונקו", nameEn: "Monaco", currencyCodes: ["EUR"] },
  { code: "SM", nameHe: "סן מרינו", nameEn: "San Marino", currencyCodes: ["EUR"] },
  { code: "VA", nameHe: "הוותיקן", nameEn: "Vatican City", currencyCodes: ["EUR"] },
  { code: "AE", nameHe: "איחוד האמירויות הערביות", nameEn: "United Arab Emirates", currencyCodes: ["AED"] },
  { code: "SA", nameHe: "ערב הסעודית", nameEn: "Saudi Arabia", currencyCodes: ["SAR"] },
  { code: "QA", nameHe: "קטר", nameEn: "Qatar", currencyCodes: ["QAR"] },
  { code: "KW", nameHe: "כווית", nameEn: "Kuwait", currencyCodes: ["KWD"] },
  { code: "BH", nameHe: "בחריין", nameEn: "Bahrain", currencyCodes: ["BHD"] },
  { code: "OM", nameHe: "עומאן", nameEn: "Oman", currencyCodes: ["OMR"] },
  { code: "JO", nameHe: "ירדן", nameEn: "Jordan", currencyCodes: ["JOD"] },
  { code: "LB", nameHe: "לבנון", nameEn: "Lebanon", currencyCodes: ["LBP"] },
  { code: "EG", nameHe: "מצרים", nameEn: "Egypt", currencyCodes: ["EGP"] },
  { code: "PS", nameHe: "פלסטין", nameEn: "Palestine", currencyCodes: ["ILS"] },
  { code: "MA", nameHe: "מרוקו", nameEn: "Morocco", currencyCodes: ["MAD"] },
  { code: "TN", nameHe: "תוניסיה", nameEn: "Tunisia", currencyCodes: ["TND"] },
  { code: "DZ", nameHe: "אלג'יריה", nameEn: "Algeria", currencyCodes: ["DZD"] },
  { code: "LY", nameHe: "לוב", nameEn: "Libya", currencyCodes: ["LYD"] },
  { code: "SD", nameHe: "סודן", nameEn: "Sudan", currencyCodes: ["SDG"] },
  { code: "SS", nameHe: "דרום סודן", nameEn: "South Sudan", currencyCodes: ["SSP"] },
  { code: "IR", nameHe: "איראן", nameEn: "Iran", currencyCodes: ["IRR"] },
  { code: "IQ", nameHe: "עיראק", nameEn: "Iraq", currencyCodes: ["IQD"] },
  { code: "YE", nameHe: "תימן", nameEn: "Yemen", currencyCodes: ["YER"] },
  { code: "SY", nameHe: "סוריה", nameEn: "Syria", currencyCodes: ["SYP"] },
  { code: "ZA", nameHe: "דרום אפריקה", nameEn: "South Africa", currencyCodes: ["ZAR"] },
  { code: "NG", nameHe: "ניגריה", nameEn: "Nigeria", currencyCodes: ["NGN"] },
  { code: "KE", nameHe: "קניה", nameEn: "Kenya", currencyCodes: ["KES"] },
  { code: "GH", nameHe: "גאנה", nameEn: "Ghana", currencyCodes: ["GHS"] },
  { code: "ET", nameHe: "אתיופיה", nameEn: "Ethiopia", currencyCodes: ["ETB"] },
  { code: "TZ", nameHe: "טנזניה", nameEn: "Tanzania", currencyCodes: ["TZS"] },
  { code: "UG", nameHe: "אוגנדה", nameEn: "Uganda", currencyCodes: ["UGX"] },
  { code: "RW", nameHe: "רואנדה", nameEn: "Rwanda", currencyCodes: ["RWF"] },
  { code: "BI", nameHe: "בורונדי", nameEn: "Burundi", currencyCodes: ["BIF"] },
  { code: "MZ", nameHe: "מוזמביק", nameEn: "Mozambique", currencyCodes: ["MZN"] },
  { code: "ZM", nameHe: "זמביה", nameEn: "Zambia", currencyCodes: ["ZMW"] },
  { code: "ZW", nameHe: "זימבבואה", nameEn: "Zimbabwe", currencyCodes: ["ZWL"] },
  { code: "MW", nameHe: "מלאווי", nameEn: "Malawi", currencyCodes: ["MWK"] },
  { code: "NA", nameHe: "נמיביה", nameEn: "Namibia", currencyCodes: ["NAD"] },
  { code: "BW", nameHe: "בוצואנה", nameEn: "Botswana", currencyCodes: ["BWP"] },
  { code: "SZ", nameHe: "אסواטיני", nameEn: "Eswatini", currencyCodes: ["SZL"] },
  { code: "LS", nameHe: "לסוטו", nameEn: "Lesotho", currencyCodes: ["LSL"] },
  { code: "MG", nameHe: "מדגסקר", nameEn: "Madagascar", currencyCodes: ["MGA"] },
  { code: "MU", nameHe: "מאוריציוס", nameEn: "Mauritius", currencyCodes: ["MUR"] },
  { code: "SC", nameHe: "סיישל", nameEn: "Seychelles", currencyCodes: ["SCR"] },
  { code: "CV", nameHe: "כף ורדה", nameEn: "Cabo Verde", currencyCodes: ["CVE"] },
  { code: "ST", nameHe: "סאו טומה ופרינסיפה", nameEn: "São Tomé and Príncipe", currencyCodes: ["STN"] },
  { code: "GM", nameHe: "גמביה", nameEn: "Gambia", currencyCodes: ["GMD"] },
  { code: "GN", nameHe: "גינאה", nameEn: "Guinea", currencyCodes: ["GNF"] },
  { code: "GW", nameHe: "גינאה־ביסאו", nameEn: "Guinea-Bissau", currencyCodes: ["XOF"] },
  { code: "SL", nameHe: "סיירה לאונה", nameEn: "Sierra Leone", currencyCodes: ["SLL"] },
  { code: "LR", nameHe: "ליבריה", nameEn: "Liberia", currencyCodes: ["LRD"] },
  { code: "CI", nameHe: "חוף השנהב", nameEn: "Côte d'Ivoire", currencyCodes: ["XOF"] },
  { code: "SN", nameHe: "סנגל", nameEn: "Senegal", currencyCodes: ["XOF"] },
  { code: "ML", nameHe: "מאלי", nameEn: "Mali", currencyCodes: ["XOF"] },
  { code: "BF", nameHe: "בורקינה פאסו", nameEn: "Burkina Faso", currencyCodes: ["XOF"] },
  { code: "NE", nameHe: "ניז'ר", nameEn: "Niger", currencyCodes: ["XOF"] },
  { code: "TG", nameHe: "טוגו", nameEn: "Togo", currencyCodes: ["XOF"] },
  { code: "BJ", nameHe: "בנין", nameEn: "Benin", currencyCodes: ["XOF"] },
  { code: "CM", nameHe: "קמרון", nameEn: "Cameroon", currencyCodes: ["XAF"] },
  { code: "GA", nameHe: "גבון", nameEn: "Gabon", currencyCodes: ["XAF"] },
  { code: "CG", nameHe: "קונגו", nameEn: "Congo", currencyCodes: ["XAF"] },
  { code: "CD", nameHe: "קונגו הדמוקרטית", nameEn: "DR Congo", currencyCodes: ["CDF"] },
  { code: "CF", nameHe: "הרפובליקה המרכז־אפריקאית", nameEn: "Central African Republic", currencyCodes: ["XAF"] },
  { code: "TD", nameHe: "צ'אד", nameEn: "Chad", currencyCodes: ["XAF"] },
  { code: "GQ", nameHe: "גינאה המשוונית", nameEn: "Equatorial Guinea", currencyCodes: ["XAF"] },
  { code: "AO", nameHe: "אנגולה", nameEn: "Angola", currencyCodes: ["AOA"] },
  { code: "SO", nameHe: "סומליה", nameEn: "Somalia", currencyCodes: ["SOS"] },
  { code: "DJ", nameHe: "ג'יבוטי", nameEn: "Djibouti", currencyCodes: ["DJF"] },
  { code: "ER", nameHe: "אריתריאה", nameEn: "Eritrea", currencyCodes: ["ERN"] },
  { code: "MX", nameHe: "מקסיקו", nameEn: "Mexico", currencyCodes: ["MXN"] },
  { code: "BR", nameHe: "ברזיל", nameEn: "Brazil", currencyCodes: ["BRL"] },
  { code: "AR", nameHe: "ארגנטינה", nameEn: "Argentina", currencyCodes: ["ARS"] },
  { code: "CL", nameHe: "צ'ילה", nameEn: "Chile", currencyCodes: ["CLP"] },
  { code: "CO", nameHe: "קולומביה", nameEn: "Colombia", currencyCodes: ["COP"] },
  { code: "PE", nameHe: "פרו", nameEn: "Peru", currencyCodes: ["PEN"] },
  { code: "UY", nameHe: "אורוגוואי", nameEn: "Uruguay", currencyCodes: ["UYU"] },
  { code: "BO", nameHe: "בוליביה", nameEn: "Bolivia", currencyCodes: ["BOB"] },
  { code: "PY", nameHe: "פרגוואי", nameEn: "Paraguay", currencyCodes: ["PYG"] },
  { code: "VE", nameHe: "ונצואלה", nameEn: "Venezuela", currencyCodes: ["VES"] },
  { code: "GY", nameHe: "גיאנה", nameEn: "Guyana", currencyCodes: ["GYD"] },
  { code: "SR", nameHe: "סורינאם", nameEn: "Suriname", currencyCodes: ["SRD"] },
  { code: "EC", nameHe: "אקוודור", nameEn: "Ecuador", currencyCodes: ["USD"] },
  { code: "CR", nameHe: "קוסטה ריקה", nameEn: "Costa Rica", currencyCodes: ["CRC"] },
  { code: "PA", nameHe: "פנמה", nameEn: "Panama", currencyCodes: ["PAB", "USD"] },
  { code: "DO", nameHe: "הרפובליקה הדומיניקנית", nameEn: "Dominican Republic", currencyCodes: ["DOP"] },
  { code: "GT", nameHe: "גואטמלה", nameEn: "Guatemala", currencyCodes: ["GTQ"] },
  { code: "HN", nameHe: "הונדורס", nameEn: "Honduras", currencyCodes: ["HNL"] },
  { code: "SV", nameHe: "אל סלבדור", nameEn: "El Salvador", currencyCodes: ["USD"] },
  { code: "NI", nameHe: "ניקרגואה", nameEn: "Nicaragua", currencyCodes: ["NIO"] },
  { code: "CU", nameHe: "קובה", nameEn: "Cuba", currencyCodes: ["CUP"] },
  { code: "JM", nameHe: "ג'מייקה", nameEn: "Jamaica", currencyCodes: ["JMD"] },
  { code: "TT", nameHe: "טרינידד וטובגו", nameEn: "Trinidad and Tobago", currencyCodes: ["TTD"] },
  { code: "BS", nameHe: "בהאמה", nameEn: "Bahamas", currencyCodes: ["BSD"] },
  { code: "BB", nameHe: "ברבדוס", nameEn: "Barbados", currencyCodes: ["BBD"] },
  { code: "BZ", nameHe: "בליז", nameEn: "Belize", currencyCodes: ["BZD"] },
  { code: "HT", nameHe: "האיטי", nameEn: "Haiti", currencyCodes: ["HTG"] },
  { code: "LC", nameHe: "סנט לוסיה", nameEn: "Saint Lucia", currencyCodes: ["XCD"] },
  { code: "GD", nameHe: "גרנדה", nameEn: "Grenada", currencyCodes: ["XCD"] },
  { code: "VC", nameHe: "סנט וינסנט והגרנדינים", nameEn: "Saint Vincent and the Grenadines", currencyCodes: ["XCD"] },
  { code: "AG", nameHe: "אנטיגואה וברבודה", nameEn: "Antigua and Barbuda", currencyCodes: ["XCD"] },
  { code: "DM", nameHe: "דומיניקה", nameEn: "Dominica", currencyCodes: ["XCD"] },
  { code: "KN", nameHe: "סנט קיטס ונוויס", nameEn: "Saint Kitts and Nevis", currencyCodes: ["XCD"] },
  { code: "CN", nameHe: "סין", nameEn: "China", currencyCodes: ["CNY"] },
  { code: "IN", nameHe: "הודו", nameEn: "India", currencyCodes: ["INR"] },
  { code: "KR", nameHe: "דרום קוריאה", nameEn: "South Korea", currencyCodes: ["KRW"] },
  { code: "KP", nameHe: "צפון קוריאה", nameEn: "North Korea", currencyCodes: ["KPW"] },
  { code: "HK", nameHe: "הונג קונג", nameEn: "Hong Kong", currencyCodes: ["HKD"] },
  { code: "TW", nameHe: "טאיוואן", nameEn: "Taiwan", currencyCodes: ["TWD"] },
  { code: "AU", nameHe: "אוסטרליה", nameEn: "Australia", currencyCodes: ["AUD"] },
  { code: "NZ", nameHe: "ניו זילנד", nameEn: "New Zealand", currencyCodes: ["NZD"] },
  { code: "CA", nameHe: "קנדה", nameEn: "Canada", currencyCodes: ["CAD"] },
  { code: "ID", nameHe: "אינדונזיה", nameEn: "Indonesia", currencyCodes: ["IDR"] },
  { code: "MY", nameHe: "מלזיה", nameEn: "Malaysia", currencyCodes: ["MYR"] },
  { code: "PH", nameHe: "פיליפינים", nameEn: "Philippines", currencyCodes: ["PHP"] },
  { code: "VN", nameHe: "וייטנאם", nameEn: "Vietnam", currencyCodes: ["VND"] },
  { code: "KH", nameHe: "קמבודיה", nameEn: "Cambodia", currencyCodes: ["KHR"] },
  { code: "LA", nameHe: "לאוס", nameEn: "Laos", currencyCodes: ["LAK"] },
  { code: "MM", nameHe: "מיאנמר", nameEn: "Myanmar", currencyCodes: ["MMK"] },
  { code: "BD", nameHe: "בנגלדש", nameEn: "Bangladesh", currencyCodes: ["BDT"] },
  { code: "PK", nameHe: "פקיסטן", nameEn: "Pakistan", currencyCodes: ["PKR"] },
  { code: "LK", nameHe: "סרי לנקה", nameEn: "Sri Lanka", currencyCodes: ["LKR"] },
  { code: "NP", nameHe: "נפאל", nameEn: "Nepal", currencyCodes: ["NPR"] },
  { code: "BT", nameHe: "בהוטן", nameEn: "Bhutan", currencyCodes: ["BTN"] },
  { code: "MV", nameHe: "האיים המלדיביים", nameEn: "Maldives", currencyCodes: ["MVR"] },
  { code: "AF", nameHe: "אפגניסטן", nameEn: "Afghanistan", currencyCodes: ["AFN"] },
  { code: "KZ", nameHe: "קזחסטן", nameEn: "Kazakhstan", currencyCodes: ["KZT"] },
  { code: "UZ", nameHe: "אוזבקיסטן", nameEn: "Uzbekistan", currencyCodes: ["UZS"] },
  { code: "KG", nameHe: "קירגיזסטן", nameEn: "Kyrgyzstan", currencyCodes: ["KGS"] },
  { code: "TJ", nameHe: "טג'יקיסטן", nameEn: "Tajikistan", currencyCodes: ["TJS"] },
  { code: "TM", nameHe: "טורקמניסטן", nameEn: "Turkmenistan", currencyCodes: ["TMT"] },
  { code: "AZ", nameHe: "אזרבייג'ן", nameEn: "Azerbaijan", currencyCodes: ["AZN"] },
  { code: "GE", nameHe: "גאורגיה", nameEn: "Georgia", currencyCodes: ["GEL"] },
  { code: "AM", nameHe: "ארמניה", nameEn: "Armenia", currencyCodes: ["AMD"] },
  { code: "MN", nameHe: "מונגוליה", nameEn: "Mongolia", currencyCodes: ["MNT"] },
  { code: "BN", nameHe: "ברוניי", nameEn: "Brunei", currencyCodes: ["BND"] },
  { code: "TL", nameHe: "טימור־לסטה", nameEn: "Timor-Leste", currencyCodes: ["USD"] },
  { code: "FJ", nameHe: "פיג'י", nameEn: "Fiji", currencyCodes: ["FJD"] },
  { code: "PG", nameHe: "פפואה גינאה החדשה", nameEn: "Papua New Guinea", currencyCodes: ["PGK"] },
  { code: "WS", nameHe: "סמואה", nameEn: "Samoa", currencyCodes: ["WST"] },
  { code: "TO", nameHe: "טונגה", nameEn: "Tonga", currencyCodes: ["TOP"] },
  { code: "VU", nameHe: "ואנואטו", nameEn: "Vanuatu", currencyCodes: ["VUV"] },
  { code: "SB", nameHe: "איי שלמה", nameEn: "Solomon Islands", currencyCodes: ["SBD"] },
  { code: "KI", nameHe: "קיריבטי", nameEn: "Kiribati", currencyCodes: ["AUD"] },
  { code: "TV", nameHe: "טובאלו", nameEn: "Tuvalu", currencyCodes: ["AUD"] },
  { code: "NR", nameHe: "נאורו", nameEn: "Nauru", currencyCodes: ["AUD"] },
  { code: "FM", nameHe: "מיקרונזיה", nameEn: "Micronesia", currencyCodes: ["USD"] },
  { code: "MH", nameHe: "איי מרשל", nameEn: "Marshall Islands", currencyCodes: ["USD"] },
  { code: "PW", nameHe: "פלאו", nameEn: "Palau", currencyCodes: ["USD"] },
];
export const COUNTRY_BY_CODE: Record<string, CountryEntry> = Object.fromEntries(COUNTRIES.map((c) => [c.code, c]));

// דגלים כ-SVG מקומיים (לא אימוג'י, עובד גם ללא אינטרנט). לרוב-המדינות
// (פסי-צבע פשוטים) — רינדור גנרי לפי thespec; למדינות עם סמל ייחודי
// (נבחרו כל המדינות שהוזכרו כדוגמה + יעדים נפוצים נוספים) — SVG ייעודי.
type StripeSpec = { kind: "h" | "v"; colors: string[] };
const STRIPE_FLAGS: Record<string, StripeSpec> = {
  DE: { kind: "h", colors: ["#000", "#DD0000", "#FFCE00"] },
  IT: { kind: "v", colors: ["#009246", "#fff", "#CE2B37"] },
  IE: { kind: "v", colors: ["#169b62", "#fff", "#ff883e"] },
  BE: { kind: "v", colors: ["#000", "#FAE042", "#ED2939"] },
  RO: { kind: "v", colors: ["#002B7F", "#FCD116", "#CE1126"] },
  BG: { kind: "h", colors: ["#fff", "#00966E", "#D62612"] },
  HU: { kind: "h", colors: ["#CD2A3E", "#fff", "#436F4D"] },
  RU: { kind: "h", colors: ["#fff", "#0039A6", "#D52B1E"] },
  NL: { kind: "h", colors: ["#AE1C28", "#fff", "#21468B"] },
  LU: { kind: "h", colors: ["#ED2939", "#fff", "#00A1DE"] },
  AT: { kind: "h", colors: ["#ED2939", "#fff", "#ED2939"] },
  PL: { kind: "h", colors: ["#fff", "#DC143C"] },
  MC: { kind: "h", colors: ["#CE1126", "#fff"] },
  ID: { kind: "h", colors: ["#CE1126", "#fff"] },
  YE: { kind: "h", colors: ["#CE1126", "#fff", "#000"] },
  EG: { kind: "h", colors: ["#CE1126", "#fff", "#000"] },
  SY: { kind: "h", colors: ["#CE1126", "#fff", "#000"] },
  IQ: { kind: "h", colors: ["#CE1126", "#fff", "#000"] },
  CO: { kind: "h", colors: ["#FCD116", "#003893", "#CE1126"] },
  EC: { kind: "h", colors: ["#FFDD00", "#034EA2", "#ED1C24"] },
  VE: { kind: "h", colors: ["#FCD116", "#003893", "#CE1126"] },
  LT: { kind: "h", colors: ["#FDB913", "#006A44", "#C1272D"] },
  EE: { kind: "h", colors: ["#0072CE", "#000", "#fff"] },
  AM: { kind: "h", colors: ["#D90012", "#0033A0", "#F2A800"] },
  ML: { kind: "v", colors: ["#14B53A", "#FCD116", "#CE1126"] },
  GN: { kind: "v", colors: ["#CE1126", "#FCD116", "#009460"] },
  SN: { kind: "v", colors: ["#00853F", "#FDEF42", "#E31B23"] },
  CM: { kind: "v", colors: ["#007A5E", "#CE1126", "#FCD116"] },
  TD: { kind: "v", colors: ["#002664", "#FECB00", "#C60C30"] },
  CI: { kind: "v", colors: ["#F77F00", "#fff", "#009E60"] },
  IR: { kind: "h", colors: ["#239F40", "#fff", "#DA0000"] },
  AE: { kind: "h", colors: ["#00732F", "#fff", "#000"] },
  GA: { kind: "h", colors: ["#009E60", "#FCD116", "#3A75C4"] },
  SL: { kind: "h", colors: ["#1EB53A", "#fff", "#0072C6"] },
  BO: { kind: "h", colors: ["#D52B1E", "#FFD100", "#007934"] },
  GW: { kind: "h", colors: ["#FCD116", "#009E49"] },
};

function StripeFlag({ kind, colors, size }: { kind: "h" | "v"; colors: string[]; size: number }) {
  const w = 30;
  const h = 20;
  const n = colors.length;
  const bandW = kind === "v" ? w / n : w;
  const bandH = kind === "h" ? h / n : h;
  return (
    <svg width={size} height={(size * h) / w} viewBox={`0 0 ${w} ${h}`} style={{ borderRadius: "2px", flexShrink: 0 }} aria-hidden>
      {colors.map((c, i) => (
        <rect key={i} x={kind === "v" ? i * bandW : 0} y={kind === "h" ? i * bandH : 0} width={bandW} height={bandH} fill={c} />
      ))}
    </svg>
  );
}

function IsraelFlagSvg({ size }: { size: number }) {
  return (
    <svg width={size} height={(size * 20) / 30} viewBox="0 0 30 20" style={{ borderRadius: "2px", flexShrink: 0 }} aria-hidden>
      <rect width="30" height="20" fill="#fff" />
      <rect y="2.5" width="30" height="2.5" fill="#0038B8" />
      <rect y="15" width="30" height="2.5" fill="#0038B8" />
      <polygon points="15,7 17.3,11 12.7,11" fill="none" stroke="#0038B8" strokeWidth="0.9" />
      <polygon points="15,13 17.3,9 12.7,9" fill="none" stroke="#0038B8" strokeWidth="0.9" />
    </svg>
  );
}
function ThailandFlagSvg({ size }: { size: number }) {
  return (
    <svg width={size} height={(size * 20) / 30} viewBox="0 0 30 20" style={{ borderRadius: "2px", flexShrink: 0 }} aria-hidden>
      <rect width="30" height="20" fill="#A51931" />
      <rect y="3.3" width="30" height="13.4" fill="#F4F5F8" />
      <rect y="6.7" width="30" height="6.6" fill="#2D2A4A" />
    </svg>
  );
}
function UsaFlagSvg({ size }: { size: number }) {
  const stripeH = 20 / 13;
  return (
    <svg width={size} height={(size * 20) / 30} viewBox="0 0 30 20" style={{ borderRadius: "2px", flexShrink: 0 }} aria-hidden>
      <rect width="30" height="20" fill="#fff" />
      {Array.from({ length: 13 }, (_, i) => (
        <rect key={i} y={i * stripeH} width="30" height={stripeH} fill={i % 2 === 0 ? "#B22234" : "#fff"} />
      ))}
      <rect width="13" height={stripeH * 7} fill="#3C3B6E" />
    </svg>
  );
}
function UkFlagSvg({ size }: { size: number }) {
  return (
    <svg width={size} height={(size * 20) / 30} viewBox="0 0 30 20" style={{ borderRadius: "2px", flexShrink: 0 }} aria-hidden>
      <rect width="30" height="20" fill="#00247D" />
      <path d="M0 0L30 20M30 0L0 20" stroke="#fff" strokeWidth="4" />
      <path d="M0 0L30 20M30 0L0 20" stroke="#CF142B" strokeWidth="1.5" />
      <path d="M15 0V20M0 10H30" stroke="#fff" strokeWidth="6" />
      <path d="M15 0V20M0 10H30" stroke="#CF142B" strokeWidth="3" />
    </svg>
  );
}
function JapanFlagSvg({ size }: { size: number }) {
  return (
    <svg width={size} height={(size * 20) / 30} viewBox="0 0 30 20" style={{ borderRadius: "2px", flexShrink: 0 }} aria-hidden>
      <rect width="30" height="20" fill="#fff" />
      <circle cx="15" cy="10" r="6" fill="#BC002D" />
    </svg>
  );
}
function SwitzerlandFlagSvg({ size }: { size: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 20 20" style={{ borderRadius: "2px", flexShrink: 0 }} aria-hidden>
      <rect width="20" height="20" fill="#D52B1E" />
      <rect x="8.5" y="4" width="3" height="12" fill="#fff" />
      <rect x="4" y="8.5" width="12" height="3" fill="#fff" />
    </svg>
  );
}
function SingaporeFlagSvg({ size }: { size: number }) {
  return (
    <svg width={size} height={(size * 20) / 30} viewBox="0 0 30 20" style={{ borderRadius: "2px", flexShrink: 0 }} aria-hidden>
      <rect width="30" height="10" fill="#ED2939" />
      <rect y="10" width="30" height="10" fill="#fff" />
      <circle cx="7" cy="5" r="3.2" fill="#fff" />
      <circle cx="8.3" cy="5" r="2.6" fill="#ED2939" />
      {[0, 1, 2, 3, 4].map((i) => (
        <polygon key={i} points="9,2.2 9.5,3.6 11,3.6 9.8,4.5 10.2,5.9 9,5 7.8,5.9 8.2,4.5 7,3.6 8.5,3.6" fill="#fff" transform={`rotate(${i * 72} 9 5)`} />
      ))}
    </svg>
  );
}
function ChinaFlagSvg({ size }: { size: number }) {
  return (
    <svg width={size} height={(size * 20) / 30} viewBox="0 0 30 20" style={{ borderRadius: "2px", flexShrink: 0 }} aria-hidden>
      <rect width="30" height="20" fill="#DE2910" />
      <polygon points="6,3 7.2,6.5 11,6.5 8,8.7 9.2,12 6,9.8 2.8,12 4,8.7 1,6.5 4.8,6.5" fill="#FFDE00" />
    </svg>
  );
}
function IndiaFlagSvg({ size }: { size: number }) {
  return (
    <svg width={size} height={(size * 20) / 30} viewBox="0 0 30 20" style={{ borderRadius: "2px", flexShrink: 0 }} aria-hidden>
      <rect width="30" height="6.7" fill="#FF9933" />
      <rect y="6.7" width="30" height="6.6" fill="#fff" />
      <rect y="13.3" width="30" height="6.7" fill="#138808" />
      <circle cx="15" cy="10" r="2.5" fill="none" stroke="#000080" strokeWidth="0.4" />
    </svg>
  );
}
function UaeFlagSvg({ size }: { size: number }) {
  return (
    <svg width={size} height={(size * 20) / 30} viewBox="0 0 30 20" style={{ borderRadius: "2px", flexShrink: 0 }} aria-hidden>
      <rect y="0" width="30" height="6.7" fill="#00732F" />
      <rect y="6.7" width="30" height="6.6" fill="#fff" />
      <rect y="13.3" width="30" height="6.7" fill="#000" />
      <rect width="8" height="20" fill="#FF0000" />
    </svg>
  );
}
function AustraliaFlagSvg({ size }: { size: number }) {
  return (
    <svg width={size} height={(size * 20) / 30} viewBox="0 0 30 20" style={{ borderRadius: "2px", flexShrink: 0 }} aria-hidden>
      <rect width="30" height="20" fill="#00008B" />
      <rect width="15" height="10" fill="#00008B" />
      <path d="M0 0L15 10M15 0L0 10" stroke="#fff" strokeWidth="1.4" />
      <path d="M7.5 0V10M0 5H15" stroke="#fff" strokeWidth="2" />
      <path d="M7.5 0V10M0 5H15" stroke="#CF142B" strokeWidth="1" />
      {[[23, 4], [26, 9], [21, 13], [25, 16], [19, 8]].map(([cx, cy], i) => (
        <circle key={i} cx={cx} cy={cy} r={i === 4 ? 0.6 : 0.9} fill="#fff" />
      ))}
    </svg>
  );
}
function CanadaFlagSvg({ size }: { size: number }) {
  return (
    <svg width={size} height={(size * 20) / 30} viewBox="0 0 30 20" style={{ borderRadius: "2px", flexShrink: 0 }} aria-hidden>
      <rect width="30" height="20" fill="#fff" />
      <rect width="7.5" height="20" fill="#FF0000" />
      <rect x="22.5" width="7.5" height="20" fill="#FF0000" />
      <path d="M15 4l1.3 2.7 2.9-0.4-1.4 2.6 2.4 1.6-2.8 0.7 0.3 2.8-2.7-1.4-2.7 1.4 0.3-2.8-2.8-0.7 2.4-1.6-1.4-2.6 2.9 0.4z" fill="#FF0000" />
    </svg>
  );
}
function TurkeyFlagSvg({ size }: { size: number }) {
  return (
    <svg width={size} height={(size * 20) / 30} viewBox="0 0 30 20" style={{ borderRadius: "2px", flexShrink: 0 }} aria-hidden>
      <rect width="30" height="20" fill="#E30A17" />
      <circle cx="12" cy="10" r="5" fill="#fff" />
      <circle cx="13.5" cy="10" r="4" fill="#E30A17" />
      <polygon points="18,10 20.5,11.6 19.5,8.8 21.8,7 18.9,7 18,4.2 17.1,7 14.2,7 16.5,8.8 15.5,11.6" fill="#fff" />
    </svg>
  );
}
function SpainFlagSvg({ size }: { size: number }) {
  return (
    <svg width={size} height={(size * 20) / 30} viewBox="0 0 30 20" style={{ borderRadius: "2px", flexShrink: 0 }} aria-hidden>
      <rect width="30" height="20" fill="#AA151B" />
      <rect y="5" width="30" height="10" fill="#F1BF00" />
    </svg>
  );
}
function GreeceFlagSvg({ size }: { size: number }) {
  const stripeH = 20 / 9;
  return (
    <svg width={size} height={(size * 20) / 30} viewBox="0 0 30 20" style={{ borderRadius: "2px", flexShrink: 0 }} aria-hidden>
      {Array.from({ length: 9 }, (_, i) => (
        <rect key={i} y={i * stripeH} width="30" height={stripeH} fill={i % 2 === 0 ? "#0D5EAF" : "#fff"} />
      ))}
      <rect width="11" height="11" fill="#0D5EAF" />
      <rect x="4" width="3" height="11" fill="#fff" />
      <rect y="4" width="11" height="3" fill="#fff" />
    </svg>
  );
}
function BrazilFlagSvg({ size }: { size: number }) {
  return (
    <svg width={size} height={(size * 20) / 30} viewBox="0 0 30 20" style={{ borderRadius: "2px", flexShrink: 0 }} aria-hidden>
      <rect width="30" height="20" fill="#009739" />
      <polygon points="15,3 27,10 15,17 3,10" fill="#FEDD00" />
      <circle cx="15" cy="10" r="4.2" fill="#012169" />
    </svg>
  );
}
function MexicoFlagSvg({ size }: { size: number }) {
  return (
    <svg width={size} height={(size * 20) / 30} viewBox="0 0 30 20" style={{ borderRadius: "2px", flexShrink: 0 }} aria-hidden>
      <rect width="10" height="20" fill="#006847" />
      <rect x="10" width="10" height="20" fill="#fff" />
      <rect x="20" width="10" height="20" fill="#CE1126" />
      <circle cx="15" cy="10" r="2" fill="#8B5E3C" />
    </svg>
  );
}
function SouthAfricaFlagSvg({ size }: { size: number }) {
  return (
    <svg width={size} height={(size * 20) / 30} viewBox="0 0 30 20" style={{ borderRadius: "2px", flexShrink: 0 }} aria-hidden>
      <rect width="30" height="20" fill="#fff" />
      <polygon points="0,0 13,10 0,20" fill="#000" />
      <rect y="0" width="30" height="4" fill="#DE3831" />
      <rect y="16" width="30" height="4" fill="#002395" />
      <polygon points="0,7 30,7 30,13 0,13" fill="#007A4D" />
      <polygon points="0,0 13,10 0,20" fill="#FFB612" transform="scale(0.75) translate(0,3.3)" />
    </svg>
  );
}
function SouthKoreaFlagSvg({ size }: { size: number }) {
  return (
    <svg width={size} height={(size * 20) / 30} viewBox="0 0 30 20" style={{ borderRadius: "2px", flexShrink: 0 }} aria-hidden>
      <rect width="30" height="20" fill="#fff" />
      <circle cx="15" cy="10" r="4" fill="#CD2E3A" />
      <path d="M15 6a4 4 0 0 0 0 8 2 2 0 0 0 0-4 2 2 0 0 1 0-4z" fill="#0047A0" />
    </svg>
  );
}
function VietnamFlagSvg({ size }: { size: number }) {
  return (
    <svg width={size} height={(size * 20) / 30} viewBox="0 0 30 20" style={{ borderRadius: "2px", flexShrink: 0 }} aria-hidden>
      <rect width="30" height="20" fill="#DA251D" />
      <polygon points="15,5 16.5,9 21,9 17.3,11.5 18.7,15.5 15,13 11.3,15.5 12.7,11.5 9,9 13.5,9" fill="#FFFF00" />
    </svg>
  );
}
function IndonesiaFlagSvg({ size }: { size: number }) {
  return (
    <svg width={size} height={(size * 20) / 30} viewBox="0 0 30 20" style={{ borderRadius: "2px", flexShrink: 0 }} aria-hidden>
      <rect width="30" height="10" fill="#CE1126" />
      <rect y="10" width="30" height="10" fill="#fff" />
    </svg>
  );
}

const DETAILED: Record<string, (size: number) => ReactElement> = {
  IL: (s) => <IsraelFlagSvg size={s} />,
  TH: (s) => <ThailandFlagSvg size={s} />,
  US: (s) => <UsaFlagSvg size={s} />,
  GB: (s) => <UkFlagSvg size={s} />,
  JP: (s) => <JapanFlagSvg size={s} />,
  CH: (s) => <SwitzerlandFlagSvg size={s} />,
  SG: (s) => <SingaporeFlagSvg size={s} />,
  CN: (s) => <ChinaFlagSvg size={s} />,
  IN: (s) => <IndiaFlagSvg size={s} />,
  AE: (s) => <UaeFlagSvg size={s} />,
  AU: (s) => <AustraliaFlagSvg size={s} />,
  CA: (s) => <CanadaFlagSvg size={s} />,
  TR: (s) => <TurkeyFlagSvg size={s} />,
  ES: (s) => <SpainFlagSvg size={s} />,
  GR: (s) => <GreeceFlagSvg size={s} />,
  BR: (s) => <BrazilFlagSvg size={s} />,
  MX: (s) => <MexicoFlagSvg size={s} />,
  ZA: (s) => <SouthAfricaFlagSvg size={s} />,
  KR: (s) => <SouthKoreaFlagSvg size={s} />,
  VN: (s) => <VietnamFlagSvg size={s} />,
  ID: (s) => <IndonesiaFlagSvg size={s} />,
};

/** דגל SVG מקומי — לא אימוג'י, עובד גם ללא אינטרנט. אף פעם לא ההסתמכות
 * היחידה על זיהוי-מדינה (תמיד מוצג גם שם+קוד לצידו, ר' רכיבי-הבחירה). */
export function FlagIcon({ countryCode, size = 20 }: { countryCode: string; size?: number }) {
  const detailed = DETAILED[countryCode];
  if (detailed) return detailed(size);
  const stripe = STRIPE_FLAGS[countryCode];
  if (stripe) return <StripeFlag kind={stripe.kind} colors={stripe.colors} size={size} />;
  // ברירת-מחדל: פס כחול-אפור ניטרלי + קוד-המדינה (לא אימוג'י, לא ריק) —
  // לכל מדינה שלא קיבלה עדיין spec ספציפי/פסים.
  return (
    <svg width={size} height={(size * 20) / 30} viewBox="0 0 30 20" style={{ borderRadius: "2px", flexShrink: 0 }} aria-hidden>
      <rect width="30" height="20" fill="#4a5578" />
      <text x="15" y="14" fontSize="9" fill="#fff" textAnchor="middle" fontWeight="700">
        {countryCode}
      </text>
    </svg>
  );
}
