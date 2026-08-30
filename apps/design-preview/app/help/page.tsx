"use client";

import { useRouter } from "next/navigation";
import { useRef, useState } from "react";
import { ScreenShell, SPACE } from "../design-system";
import { HelpSection, AboutSection } from "../more/page";
import { ToastBar } from "../toast-bar";

/** מסך "עזרה ואודות" (38) — HelpSection + AboutSection הקיימים, מוצגים
 * ברצף באותו עמוד (השני בלי כותרת-משנה כפולה, ר' עריכה למטה). */
export default function HelpScreen() {
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
      <HelpSection onBack={() => router.back()} showToast={showToast} />
      <div style={{ marginTop: SPACE.lg }}>
        <AboutSection onBack={() => router.back()} />
      </div>
      <ToastBar toast={toast} />
    </ScreenShell>
  );
}
