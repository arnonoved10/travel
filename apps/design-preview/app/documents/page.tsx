"use client";

import { useRouter } from "next/navigation";
import { useRef, useState } from "react";
import { ScreenShell } from "../design-system";
import { DocumentsSection } from "../more/page";
import { ToastBar } from "../toast-bar";

/** מסך "מסמכים וביטוח" (26) — עטיפה סביב DocumentsSection הקיים (צילום/
 * העלאת-קובץ/שינוי-שם/מחיקה, זהה למקור). */
export default function DocumentsScreen() {
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
      <DocumentsSection onBack={() => router.back()} showToast={showToast} />
      <ToastBar toast={toast} />
    </ScreenShell>
  );
}
