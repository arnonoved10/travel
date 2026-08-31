"use client";

import { useEffect, useState } from "react";
import { dueReminders, type ReminderCandidate } from "@/lib/notification-reminders";
import { PermissionDeniedState } from "@/components/blocked-state";

type PermissionState = "unsupported" | "default" | "granted" | "denied";

const CHECK_INTERVAL_MS = 30_000;

function firedKey(candidateId: string): string {
  return `notification-reminders:fired:${candidateId}`;
}

function alreadyFired(candidateId: string): boolean {
  try {
    return localStorage.getItem(firedKey(candidateId)) === "1";
  } catch {
    return false;
  }
}

function markFired(candidateId: string): void {
  try {
    localStorage.setItem(firedKey(candidateId), "1");
  } catch {
    // localStorage לא זמין (למשל מצב פרטי) — לא קריטי, ההתראה עשויה לחזור בטעינה הבאה
  }
}

export function NotificationReminders({ candidates }: { candidates: ReminderCandidate[] }) {
  const [permission, setPermission] = useState<PermissionState>(() =>
    typeof window === "undefined" || !("Notification" in window) ? "unsupported" : (Notification.permission as PermissionState),
  );

  useEffect(() => {
    if (permission !== "granted" || candidates.length === 0) return;

    function check(): void {
      const fired = new Set(candidates.filter((c) => alreadyFired(c.id)).map((c) => c.id));
      const due = dueReminders(candidates, new Date(), fired);
      for (const reminder of due) {
        new Notification(reminder.title, { body: reminder.body });
        markFired(reminder.id);
      }
    }

    check();
    const interval = setInterval(check, CHECK_INTERVAL_MS);
    return () => clearInterval(interval);
  }, [permission, candidates]);

  async function requestPermission(): Promise<void> {
    if (!("Notification" in window)) return;
    const result = await Notification.requestPermission();
    setPermission(result as PermissionState);
  }

  if (permission === "unsupported") {
    return <PermissionDeniedState message="הדפדפן הזה לא תומך בהתראות." />;
  }

  if (permission === "denied") {
    return <PermissionDeniedState message="הרשאת התראות נדחתה. אפשר לשנות בהגדרות הדפדפן." />;
  }

  if (permission === "granted") {
    return <p style={mutedStyle}>התראות מופעלות — יישלחו כשהדף הזה פתוח, לפי ההגדרות במסך הטיול.</p>;
  }

  return (
    <div>
      <p style={mutedStyle}>קבל תזכורת דפדפן לפני טיסה/הסעה, כשהדף הזה פתוח (לא Push אמיתי — ראה DECISIONS.md).</p>
      <button type="button" onClick={requestPermission} style={buttonStyle}>
        🔔 הפעל התראות
      </button>
    </div>
  );
}

const mutedStyle: React.CSSProperties = { color: "var(--color-text-muted)", fontSize: "0.8125rem", margin: 0 };
const buttonStyle: React.CSSProperties = {
  padding: "0.5rem 1rem",
  borderRadius: "var(--radius-full)",
  border: "1px solid var(--color-border)",
  background: "var(--color-surface)",
  color: "var(--color-text-primary)",
  cursor: "pointer",
  fontSize: "0.875rem",
  fontWeight: 600,
};
