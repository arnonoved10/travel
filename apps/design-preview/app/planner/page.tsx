"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { LegacyScreenShell as ScreenShell, LegacyScreenHeader as ScreenHeader, LegacyBottomNav as BottomNav, LEGACY_COLOR as COLOR } from "../route/legacy-shared";
import { activeTrip } from "../trips-data";
import { today } from "../wallet-data";

/**
 * טאב "יומן" בתפריט התחתון — לפני התיקון הזה הכיל תוכנית-יום מומצאת
 * לגמרי (מלון/מסעדות/פעילויות מזויפים בבנגקוק) שהוצגה לכל משתמש בלי
 * קשר לטיול האמיתי שלו. עכשיו רק מפנה לתוכנית-היום האמיתית (זהה
 * למקור-האמת שכבר משמש את /route) של הטיול הפעיל, ליום הנוכחי.
 */
export default function PlannerRedirectScreen() {
  const router = useRouter();
  const [checked, setChecked] = useState(false);

  useEffect(() => {
    const trip = activeTrip();
    if (trip) router.replace(`/trips/${trip.id}/plan?day=${today()}`);
    else setChecked(true);
  }, [router]);

  if (!checked) return null;

  return (
    <ScreenShell>
      <ScreenHeader title="יומן ותוכנית יומית" />
      <div style={{ flex: 1, display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", gap: "12px", padding: "24px", textAlign: "center" }}>
        <div style={{ fontSize: "15px", fontWeight: 800, color: "#fff" }}>אין טיול פעיל</div>
        <div style={{ fontSize: "13px", color: COLOR.textSecondary, maxWidth: "280px" }}>בחרו או צרו טיול כדי לראות ולתכנן את התוכנית היומית שלו</div>
        <button
          type="button"
          onClick={() => router.push("/trips")}
          style={{ padding: "10px 20px", borderRadius: "999px", background: COLOR.purple, border: "none", color: "#fff", fontWeight: 700, fontSize: "13px", cursor: "pointer" }}
        >
          מעבר לטיולים שלי
        </button>
      </div>
      <BottomNav active="planner" />
    </ScreenShell>
  );
}
