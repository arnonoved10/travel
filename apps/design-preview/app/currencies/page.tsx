"use client";

import { useRouter } from "next/navigation";
import { ScreenShell } from "../design-system";
import { CurrenciesSection } from "../more/page";
import { useWalletStore } from "../wallet-store";
import { ToastBar } from "../toast-bar";

/**
 * מסך "ניהול מדינות ומטבעות" (34) — עטיפה דקה סביב CurrenciesSection
 * הקיים (חילוץ, לא שכתוב): כל הלוגיקה (זיהוי-GPS, מדינה-מקומית, סדר-
 * מטבעות, הוספה/מחיקה) זהה למקור ב-more/page.tsx. קורא ל-useWalletStore
 * פעם אחת כאן ומעביר את ה-store כולו פנימה — כדי שהטוסט (כולל "בטל" על
 * מחיקת מטבע) יוצג דרך אותו state ממש שהמוטציות עצמן כותבות אליו, ולא
 * שני מופעים נפרדים של ה-hook עם שני state של טוסט לא-מסונכרנים.
 */
export default function CurrenciesScreen() {
  const router = useRouter();
  const store = useWalletStore();
  return (
    <ScreenShell>
      <CurrenciesSection onBack={() => router.back()} store={store} />
      <ToastBar toast={store.toast} />
    </ScreenShell>
  );
}
