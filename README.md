# מערכת ניהול טיולים אישית — Travel App

מונו-רפו לפרויקט ניהול הטיולים האישי. מסמכי התכנון המלאים נמצאים ב-`docs/`.

## מצב נוכחי: שלב 0 (תשתית) — חלקי, ראה `docs/PHASE_0_REPORT.md`

- ✅ מבנה מונו-רפו
- ✅ סכימת Prisma מלאה (36 טבלאות) — `packages/db/prisma/schema.prisma`
- ✅ המודל היחסי אומת מול Postgres 16 אמיתי (ראה `packages/db/prisma/manual_validation.sql` ותוצאות הבדיקה בדוח)
- ⛔ **חסום**: התקנת התלויות בפועל (`npm install`) והרצת `next build`/`prisma generate` — הסביבה העננית הזו חוסמת גישה לרשם ה-npm. פרטים מלאים ב-`docs/PHASE_0_REPORT.md`.

## מבנה

```
apps/web/            Next.js PWA — עדיין לא נכתב קוד יישום (ממתין לפתרון חסימת הרשת)
packages/db/          Prisma schema + סקריפט אימות SQL ידני
packages/shared-types/ טיפוסי TS משותפים — ייכתב בשלב הבא
packages/business-logic/ מנועי סטטוס/חוסרים/דוחות — ייכתב בשלב הבא
packages/sync-engine/  Dexie + תור סנכרון — ייכתב בשלב הבא
packages/integrations/ שכבת חיבורים חיצוניים — ייכתב בשלב הבא
docs/                  מסמכי תכנון וארכיטקטורה
```
