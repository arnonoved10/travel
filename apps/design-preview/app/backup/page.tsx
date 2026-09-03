"use client";

import { useRouter } from "next/navigation";
import { useRef, useState } from "react";
import { ScreenShell } from "../design-system";
import { BackupSection } from "../more/page";
import { currentScopeTripId } from "../trips-data";
import { ToastBar } from "../toast-bar";

/** מסך "גיבוי ושחזור" (35) — עטיפה סביב BackupSection הקיים. מחשב את
 * הטיול-הנוכחי פעם אחת ומעביר אותו פנימה — ר' הסבר ב-BackupSection. */
export default function BackupScreen() {
  const router = useRouter();
  const [toast, setToast] = useState<{ message: string } | null>(null);
  const timer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const [tripId] = useState(() => currentScopeTripId());
  function showToast(message: string) {
    if (timer.current) clearTimeout(timer.current);
    setToast({ message });
    timer.current = setTimeout(() => setToast(null), 4200);
  }
  return (
    <ScreenShell>
      <BackupSection onBack={() => router.back()} showToast={showToast} tripId={tripId} />
      <ToastBar toast={toast} />
    </ScreenShell>
  );
}
