"use client";

import { useRouter } from "next/navigation";
import { useRef, useState } from "react";
import { ScreenShell, BottomNav, Card, DangerButton, ChevronIcon, COLOR, SPACE } from "../design-system";
import { ProfileSection } from "../more/page";
import { ToastBar } from "../toast-bar";

const SETTINGS_LINKS = [
  { label: "הגדרות מטבע ותצוגה", href: "/more" },
  { label: "גיבוי ושחזור", href: "/backup" },
  { label: "עזרה ואודות", href: "/help" },
];

/**
 * מסך "פרופיל והגדרות" (28) — זהות (ProfileSection הקיים, ללא שכתוב) +
 * קיצורי-דרך להגדרות המפורטות (עדיין תחת "עוד", ר' דוח-הסיום לפירוט
 * הפישוט המודע הזה).
 */
export default function ProfileScreen() {
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
      <ProfileSection onBack={() => router.push("/")} showToast={showToast} />

      <div style={{ display: "flex", flexDirection: "column", gap: SPACE.sm }}>
        {SETTINGS_LINKS.map((link) => (
          <Card key={link.href} onClick={() => router.push(link.href)} style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
            <span style={{ fontSize: "13px", fontWeight: 600, color: COLOR.textPrimary }}>{link.label}</span>
            <ChevronIcon />
          </Card>
        ))}
      </div>

      <DangerButton onClick={() => showToast("אין חשבון מחובר במצב-דמו זה")}>התנתק מהחשבון</DangerButton>

      <ToastBar toast={toast} />
      <BottomNav active="profile" />
    </ScreenShell>
  );
}
