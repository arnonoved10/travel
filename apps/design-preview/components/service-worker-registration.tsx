"use client";

import { useEffect } from "react";

/**
 * לוקוח בדוק שאפליקציות מותקנות-למסך-הבית (PWA) נתקעות על גרסה ישנה כי
 * הדפדפן בודק עדכון ל-sw.js רק מדי-פעם ולא בכל טעינה. שני תיקונים: (1)
 * דוחפים בדיקת-עדכון בכל טעינה/חזרה-לחזית במקום לחכות ליוזמת הדפדפן, (2)
 * ברגע שה-service-worker החדש תופס שליטה (controllerchange — קורה מיד
 * הודות ל-skipWaiting+clients.claim ב-sw.js) מרעננים את הדף באופן מיידי,
 * כדי שלא ימשיכו לרוץ קוד/HTML ישנים בזיכרון גם אחרי שהגרסה החדשה פעילה.
 */
export function ServiceWorkerRegistration(): null {
  useEffect(() => {
    if (typeof window === "undefined" || !("serviceWorker" in navigator)) return;

    let reloaded = false;
    navigator.serviceWorker.addEventListener("controllerchange", () => {
      if (reloaded) return;
      reloaded = true;
      window.location.reload();
    });

    navigator.serviceWorker
      .register("/sw.js")
      .then((registration) => {
        registration.update().catch(() => {});
        document.addEventListener("visibilitychange", () => {
          if (document.visibilityState === "visible") registration.update().catch(() => {});
        });
      })
      .catch(() => {
        // רישום נכשל (למשל בסביבת פיתוח ללא HTTPS/localhost תקין) — לא קריטי.
      });
  }, []);

  return null;
}
