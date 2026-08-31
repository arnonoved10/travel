import path from "node:path";
import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  reactStrictMode: true,
  // בלי זה, ה-tracing רואה רק קבצים בתוך apps/web — כל קובץ מחוץ לתיקייה הזו
  // (כמו packages/db/generated) מדולג בשקט על-ידי ה-build adapter של Vercel,
  // גם אם הוא כן מופיע ב-.nft.json של Next עצמו (נבדק ואומת: הקובץ *כן* היה
  // ברשימת ה-trace, אבל לא הגיע בפועל ל-Lambda שרצה ב-runtime).
  outputFileTracingRoot: path.join(__dirname, "../.."),
  // tesseract.js דורש require() אמיתי של Node (worker-thread script), לא
  // ברשימת ה-packages המוחרגים-אוטומטית של Next.js — בלי זה ה-bundler שובר
  // את הנתיב הפנימי של ה-worker (MODULE_NOT_FOUND) ו-OCR מקומי קורס ב-runtime.
  serverExternalPackages: ["tesseract.js"],
  // תכונת "immutable static assets" החדשה של Next 16.3 עדיין לא נתמכת במלואה
  // בצינור-הפריסה הנוכחי של Vercel — גורמת לכשל "Cannot patch preview comments
  // when immutable static file upload is enabled" בשלב ה-deploy (לא בשלב ה-build).
  supportsImmutableAssets: false,
  // ה-tracing האוטומטי של Next לא כולל את קובצי ה-Query Engine הבינאריים של
  // Prisma (נוצרים ל-packages/db/generated/client, לא node_modules הרגיל) —
  // ב-runtime (Vercel Serverless) הם פשוט לא קיימים למרות שנוצרו ב-build,
  // וגורמים ל-PrismaClientInitializationError. חובה לכלול אותם במפורש.
  outputFileTracingIncludes: {
    "/*": ["../../packages/db/generated/client/**/*"],
  },
};

export default nextConfig;
