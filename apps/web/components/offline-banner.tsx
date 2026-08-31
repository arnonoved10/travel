"use client";

import { useSyncExternalStore } from "react";

function subscribe(callback: () => void): () => void {
  window.addEventListener("online", callback);
  window.addEventListener("offline", callback);
  return () => {
    window.removeEventListener("online", callback);
    window.removeEventListener("offline", callback);
  };
}

function getSnapshot(): boolean {
  return navigator.onLine;
}

function getServerSnapshot(): boolean {
  return true;
}

export function OfflineBanner() {
  const isOnline = useSyncExternalStore(subscribe, getSnapshot, getServerSnapshot);

  if (isOnline) return null;

  return (
    <div
      role="status"
      style={{
        background: "#3b1f00",
        color: "#ffb066",
        padding: "0.5rem 1rem",
        fontSize: "0.8125rem",
        textAlign: "center",
        borderBottom: "1px solid var(--color-border)",
      }}
    >
      📡 אין חיבור לאינטרנט כרגע — מה שמוצג עשוי להיות לא מעודכן, ופעולות (שמירה/עדכון) לא יעבדו עד לחזרת החיבור.
    </div>
  );
}
