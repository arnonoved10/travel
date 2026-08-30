"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { ScreenShell, ScreenHeader, COLOR } from "../../../design-system";

/**
 * "צילום קבלה" (21) — הצילום עצמו מבוצע ע"י מצלמת-המכשיר האמיתית (input
 * capture="environment", לא viewfinder מצויר בתוך הדף — דפדפן אינו מאפשר
 * גישה-ישירה ל-stream של מצלמה בלי getUserMedia+video, ולא נבנה כאן כדי
 * לא "להעמיד פנים" שיש תצוגה חיה שלא קיימת). המסך הזה פשוט פותח את מצלמת
 * המכשיר ומעביר ישירות למסך "הוספת הוצאה" (20), שבו מוצגת תמונת-הקבלה +
 * תוצאות ה-OCR לעריכה לפני שמירה — בדיוק לפי הדרישה.
 */
export default function ReceiptScanScreen() {
  const router = useRouter();
  useEffect(() => {
    router.replace("/wallet/expense/new?autoCamera=1");
  }, [router]);
  return (
    <ScreenShell>
      <ScreenHeader title="צילום קבלה" />
      <div style={{ textAlign: "center", color: COLOR.textSecondary, fontSize: "13px", padding: "40px 0" }}>פותח מצלמה...</div>
    </ScreenShell>
  );
}
