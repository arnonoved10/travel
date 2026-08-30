import { redirect } from "next/navigation";
import { getCurrentUser } from "@/lib/auth/get-current-user";
import { MobileHomeMock } from "./mobile-home-mock";

export const dynamic = "force-dynamic";

/**
 * דף-תצוגה מבודד לבדיקת עיצוב בלבד — לא הדשבורד האמיתי (app/(app)/dashboard),
 * לא נוגע בו ולא בחיבורים שלו. שלב נוכחי: אבטיפוס-חזותי אחד (מסך-בית לטלפון,
 * 390px) בנתוני-דוגמה קבועים, בלי שום ייבוא מרכיבי-הדשבורד הקיימים ובלי חיבור
 * ל-DB/Supabase — רק כדי לאשר התאמה חזותית למוקאפ (mobile-screens.png) לפני
 * שמחברים נתונים אמיתיים. גרסת-מחשב ומסכים נוספים יתווספו בשלב הבא, אחרי
 * אישור המראה הזה.
 */
export default async function DesignPreviewPage() {
  const user = await getCurrentUser();
  if (!user) redirect("/login");

  return <MobileHomeMock />;
}
