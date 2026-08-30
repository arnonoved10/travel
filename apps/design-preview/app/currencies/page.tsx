"use client";

import { useRouter } from "next/navigation";
import { useRef, useState } from "react";
import { ScreenShell } from "../design-system";
import { CurrenciesSection } from "../more/page";
import { ToastBar } from "../toast-bar";

/**
 * מסך "ניהול מדינות ומטבעות" (34) — עטיפה דקה סביב CurrenciesSection
 * הקיים (חילוץ, לא שכתוב): כל הלוגיקה (זיהוי-GPS, מדינה-מקומית, סדר-
 * מטבעות, הוספה/מחיקה) זהה למקור ב-more/page.tsx.
 */
export default function CurrenciesScreen() {
  const router = useRouter();
  const [toast, setToast] = useState<{ message: string; actionLabel?: string; onAction?: () => void } | null>(null);
  const timer = useRef<ReturnType<typeof setTimeout> | null>(null);
  function showToast(message: string, actionLabel?: string, onAction?: () => void) {
    if (timer.current) clearTimeout(timer.current);
    setToast({ message, actionLabel, onAction });
    timer.current = setTimeout(() => setToast(null), 4200);
  }
  return (
    <ScreenShell>
      <CurrenciesSection onBack={() => router.back()} showToast={showToast} />
      <ToastBar toast={toast} />
    </ScreenShell>
  );
}
