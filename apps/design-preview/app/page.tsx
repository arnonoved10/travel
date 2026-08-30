import { MobileHomeMock } from "./mobile-home-mock";

// דף-הבית של הפריסה המבודדת הזו — שורש האתר (/) הוא ישירות מסך-הבית של
// design-preview, בלי בדיקת-התחברות ובלי הפניה למסך אחר: זו כל האפליקציה
// שקיימת בפרויקט-Vercel הזה, אין "מסך ישן" לחזור אליו.
//
// force-dynamic (כמו בדף-המקור ב-apps/web): מסך-הבית מציג שעון/טיימר חי
// (useState(() => new Date())). בלי זה Next מייצר את הדף כ-Static פעם אחת
// ב-build, אז שעת-הבנייה "קופאת" ב-HTML לצמיתות עד לפריסה הבאה, וההבדל
// מול הזמן-האמיתי בזמן ה-hydration בדפדפן גורם ל-React error #418
// (חוסר-התאמת hydration) — נתפס בבדיקה חיה, לא ניחוש.
export const dynamic = "force-dynamic";

export default function DesignPreviewHomePage() {
  return <MobileHomeMock />;
}
