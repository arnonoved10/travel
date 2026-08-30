"use client";

import { useEffect } from "react";

export function ServiceWorkerRegistration(): null {
  useEffect(() => {
    if (typeof window === "undefined" || !("serviceWorker" in navigator)) return;
    navigator.serviceWorker.register("/sw.js").catch(() => {
      // רישום נכשל (למשל בסביבת פיתוח ללא HTTPS/localhost תקין) — לא קריטי.
    });
  }, []);

  return null;
}
