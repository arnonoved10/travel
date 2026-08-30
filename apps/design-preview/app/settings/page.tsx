"use client";

import { useRouter } from "next/navigation";
import { useRef, useState } from "react";
import { ScreenShell } from "../design-system";
import { SettingsSection } from "../more/page";
import { ToastBar } from "../toast-bar";

/** מסך הגדרות (חלק ממסכים 27/28) — עטיפה סביב SettingsSection הקיים
 * (מטבע-בסיס, יחידות-טמפרטורה, התראות אמיתיות, איפוס-נתוני-הדגמה). */
export default function SettingsScreen() {
  const router = useRouter();
  const [toast, setToast] = useState<{ message: string } | null>(null);
  const timer = useRef<ReturnType<typeof setTimeout> | null>(null);
  function showToast(message: string) {
    if (timer.current) clearTimeout(timer.current);
    setToast({ message });
    timer.current = setTimeout(() => setToast(null), 4200);
  }
  return (
    <ScreenShell>
      <SettingsSection onBack={() => router.back()} showToast={showToast} />
      <ToastBar toast={toast} />
    </ScreenShell>
  );
}
