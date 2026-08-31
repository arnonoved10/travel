import { redirect } from "next/navigation";

// מוזג לתוך /today ב-2026-08-28 (בקשת משתמש: "מה צריך להוריד... שיהיה מובן
// ומסודר") — שני מסכים נפרדים ענו על אותה שאלה ("מה קורה עכשיו בטיול") עם
// חפיפה ממשית. נשאר כ-redirect כדי לא לשבור סימניות/קישורים ישנים.
export default function NowPage() {
  redirect("/today");
}
