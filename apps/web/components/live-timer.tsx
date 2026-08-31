"use client";

import { useEffect, useState } from "react";
import { formatCountdown } from "@/lib/format-countdown";
import { formatTimeWithIsraelReference } from "@/lib/dates";

/**
 * טיימר חי גנרי לשימוש חוזר — טיסה/מעבורת/צ'ק-אין/צ'ק-אאוט/החזרת רכב שכור/
 * פעילות מתוכננת. `now` מתחיל כ-null ומתמלא רק ב-useEffect (אחרי mount)
 * כדי למנוע Hydration Mismatch מול זמן השרת (אותו דפוס כמו רכיבי client
 * תלויי-זמן אחרים באפליקציה, למשל notification-reminders.tsx).
 */
export function LiveTimer({ label, eventAt, timezone }: { label: string; eventAt: string; timezone: string }) {
  const [now, setNow] = useState<number | null>(null);

  useEffect(() => {
    const tick = () => setNow(Date.now());
    const timeout = setTimeout(tick, 0);
    const interval = setInterval(tick, 30_000);
    return () => {
      clearTimeout(timeout);
      clearInterval(interval);
    };
  }, []);

  const timeLabel = formatTimeWithIsraelReference(eventAt, timezone);

  if (now === null) {
    return (
      <div style={style}>
        ⏱ {label} · {timeLabel}
      </div>
    );
  }

  const diffMs = new Date(eventAt).getTime() - now;
  return (
    <div style={{ ...style, color: diffMs <= 0 ? "var(--color-text-muted)" : "var(--color-primary)" }}>
      ⏱ {label}: {formatCountdown(diffMs)} · {timeLabel}
    </div>
  );
}

const style: React.CSSProperties = { fontSize: "0.8125rem", marginTop: "0.25rem" };
