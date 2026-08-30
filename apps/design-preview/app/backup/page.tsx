"use client";

import { useRouter } from "next/navigation";
import { useRef, useState } from "react";
import { ScreenShell } from "../design-system";
import { BackupSection } from "../more/page";
import { ToastBar } from "../toast-bar";

/** מסך "גיבוי ושחזור" (35) — עטיפה סביב BackupSection הקיים. */
export default function BackupScreen() {
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
      <BackupSection onBack={() => router.back()} showToast={showToast} />
      <ToastBar toast={toast} />
    </ScreenShell>
  );
}
