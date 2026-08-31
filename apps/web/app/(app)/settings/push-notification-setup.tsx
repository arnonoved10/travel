"use client";

import { useEffect, useState } from "react";
import { sendTestPushAction, subscribeToPushAction, unsubscribeFromPushAction } from "./actions";

// PushManager.subscribe דורש את מפתח-ה-VAPID כ-Uint8Array (base64url), לא
// כמחרוזת רגילה — המרה תקנית לפי מפרט Web Push, אין דרך אחרת.
function urlBase64ToUint8Array(base64String: string): Uint8Array {
  const padding = "=".repeat((4 - (base64String.length % 4)) % 4);
  const base64 = (base64String + padding).replace(/-/g, "+").replace(/_/g, "/");
  const rawData = atob(base64);
  return Uint8Array.from([...rawData].map((char) => char.charCodeAt(0)));
}

type Status = "checking" | "unsupported" | "denied" | "off" | "on";

/**
 * התראות-דחיפה אמיתיות (Web Push) — מגיעות גם כשהאפליקציה סגורה, בשונה
 * מה-Notification API המקומי הקיים (ר' notification-preferences-section.tsx)
 * שרק פועל כשהדף "עכשיו" פתוח. כרגע מחובר בפועל לעדכון-סטטוס-טיסה בלבד
 * (checkFlightStatusAction) — התראות מבוססות-שעה (זמן-לצאת-לשדה/צ'ק-אין)
 * עדיין מוצגות רק כשהדף פתוח, כי אין ל-Trip Master תשתית תזמון-רקע (cron)
 * שתפעיל push בשעה מדויקת בלי שהמשתמש פותח את האפליקציה.
 */
export function PushNotificationSetup({ vapidPublicKey }: { vapidPublicKey: string }) {
  const [status, setStatus] = useState<Status>("checking");
  const [endpoint, setEndpoint] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [isPending, setIsPending] = useState(false);
  const [testSent, setTestSent] = useState(false);

  useEffect(() => {
    // עטוף כולו ב-async כדי ש-setState אף פעם לא יקרה סינכרונית בתוך גוף
    // ה-effect עצמו (react-hooks/set-state-in-effect) — גם הענפים שנראים
    // "מיידיים" (unsupported/denied) עוברים דרך ה-await הראשון.
    (async () => {
      if (typeof window === "undefined" || !("serviceWorker" in navigator) || !("PushManager" in window)) {
        setStatus("unsupported");
        return;
      }
      if (Notification.permission === "denied") {
        setStatus("denied");
        return;
      }
      try {
        const registration = await navigator.serviceWorker.ready;
        const subscription = await registration.pushManager.getSubscription();
        if (subscription) {
          setEndpoint(subscription.endpoint);
          setStatus("on");
        } else {
          setStatus("off");
        }
      } catch {
        setStatus("off");
      }
    })();
  }, []);

  async function handleEnable() {
    setError(null);
    setIsPending(true);
    try {
      const permission = await Notification.requestPermission();
      if (permission !== "granted") {
        setStatus("denied");
        return;
      }
      const registration = await navigator.serviceWorker.ready;
      const subscription = await registration.pushManager.subscribe({
        userVisibleOnly: true,
        applicationServerKey: urlBase64ToUint8Array(vapidPublicKey) as BufferSource,
      });
      const json = subscription.toJSON();
      const result = await subscribeToPushAction({
        endpoint: subscription.endpoint,
        p256dh: json.keys?.p256dh ?? "",
        auth: json.keys?.auth ?? "",
        userAgent: navigator.userAgent,
      });
      if (!result.ok) {
        setError(result.error ?? "ההרשמה נכשלה.");
        return;
      }
      setEndpoint(subscription.endpoint);
      setStatus("on");
    } catch {
      setError("הפעלת ההתראות נכשלה.");
    } finally {
      setIsPending(false);
    }
  }

  async function handleDisable() {
    setError(null);
    setIsPending(true);
    try {
      const registration = await navigator.serviceWorker.ready;
      const subscription = await registration.pushManager.getSubscription();
      if (subscription) {
        await subscription.unsubscribe();
        await unsubscribeFromPushAction(subscription.endpoint);
      }
      setEndpoint(null);
      setStatus("off");
    } catch {
      setError("הביטול נכשל.");
    } finally {
      setIsPending(false);
    }
  }

  async function handleTest() {
    setTestSent(false);
    await sendTestPushAction();
    setTestSent(true);
  }

  if (status === "checking") return null;

  if (status === "unsupported") {
    return <p style={{ color: "var(--color-text-muted)", fontSize: "0.875rem" }}>הדפדפן הזה לא תומך בהתראות-דחיפה.</p>;
  }

  if (status === "denied") {
    return (
      <p style={{ color: "var(--color-text-muted)", fontSize: "0.875rem" }}>
        חסמת הרשאת-התראות לאתר הזה בדפדפן — צריך לאפשר אותה מהגדרות הדפדפן כדי להפעיל.
      </p>
    );
  }

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: "0.5rem" }}>
      {status === "on" ? (
        <>
          <p style={{ margin: 0, color: "var(--color-success)", fontWeight: 600, fontSize: "0.875rem" }}>✅ התראות-דחיפה פעילות במכשיר הזה</p>
          {endpoint ? <p style={{ margin: 0, fontSize: "0.75rem", color: "var(--color-text-muted)", wordBreak: "break-all" }}>{endpoint.slice(0, 60)}…</p> : null}
          <div style={{ display: "flex", gap: "0.5rem", flexWrap: "wrap" }}>
            <button type="button" onClick={handleTest} disabled={isPending} style={buttonStyle(false)}>
              שלח התראת בדיקה
            </button>
            <button type="button" onClick={handleDisable} disabled={isPending} style={buttonStyle(true)}>
              בטל התראות במכשיר הזה
            </button>
          </div>
          {testSent ? <p style={{ margin: 0, fontSize: "0.75rem", color: "var(--color-text-muted)" }}>נשלח — אמור להופיע כהתראה תוך כמה שניות.</p> : null}
        </>
      ) : (
        <button type="button" onClick={handleEnable} disabled={isPending} style={buttonStyle(false)}>
          {isPending ? "מפעיל…" : "🔔 הפעל התראות-דחיפה במכשיר הזה"}
        </button>
      )}
      {error ? <span style={{ color: "var(--color-danger)", fontSize: "0.8125rem" }}>{error}</span> : null}
    </div>
  );
}

function buttonStyle(danger: boolean): React.CSSProperties {
  return {
    padding: "0.5rem 1rem",
    borderRadius: "var(--radius-full)",
    border: `1px solid ${danger ? "color-mix(in srgb, var(--color-danger) 30%, transparent)" : "var(--color-border)"}`,
    background: danger ? "color-mix(in srgb, var(--color-danger) 12%, transparent)" : "var(--color-surface)",
    color: danger ? "var(--color-danger)" : "var(--color-text-primary)",
    fontWeight: 600,
    fontSize: "0.8125rem",
    cursor: "pointer",
    alignSelf: "flex-start",
  };
}
