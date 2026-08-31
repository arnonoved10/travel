// לא ידע-אמיתי על דרישות ויזה בפועל — דרישות תלויות באזרחות (לא נאספת
// באפליקציה), משתנות תדיר, וטעות כאן יכולה לגרום נזק אמיתי (איחור בשדה-
// תעופה). ר' DECISIONS.md. לכן: תזכורת "בדוק בעצמך" בלבד + קישור-חיפוש
// כללי (אותו עיקרון כמו hotel-search-links.ts — בונים URL חיפוש, לא
// מציגים "התשובה" בעצמנו), לא קישור לעמוד-רשמי-ספציפי-למדינה (שהיה מחייב
// טבלת-התאמות שאין דרך לשמור מעודכנת באמינות).
export interface DocumentCheckSuggestion {
  name: string;
  reason: string;
  checkUrl: string;
}

export function suggestDocumentChecksForCountries(countryNames: string[]): DocumentCheckSuggestion[] {
  const uniqueNames = Array.from(new Set(countryNames.map((c) => c.trim()).filter((c) => c.length > 0)));

  return uniqueNames.map((countryName) => ({
    name: `🛂 בדוק דרישות ויזה/מסמכים ל${countryName}`,
    reason: "בדיקה עצמית בלבד — לא מידע רשמי, דרישות תלויות באזרחות ומשתנות",
    checkUrl: `https://www.google.com/search?q=${encodeURIComponent(`visa requirements for ${countryName}`)}`,
  }));
}
