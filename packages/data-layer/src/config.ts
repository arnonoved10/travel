// בורר מקור הנתונים היחיד לכל האפליקציה. ברירת המחדל היא mock כי אין עדיין
// חיבור Supabase חי (ראה docs/PHASE_0_REPORT.md + ההודעה שבה אושר לדלג על
// החיבור בינתיים) — לא ניחוש, החלטה מפורשת שתשתנה כשיהיה DATABASE_URL אמיתי.
export type DataSource = "mock" | "prisma";

export function getDataSource(): DataSource {
  const value = process.env.DATA_SOURCE;
  if (value === "prisma") return "prisma";
  return "mock";
}

export function isDemoMode(): boolean {
  return getDataSource() === "mock";
}
