"use client";

import { useCallback, useEffect, useState } from "react";

export type GeolocationState =
  | { kind: "idle" }
  | { kind: "loading" }
  | { kind: "unsupported" }
  | { kind: "denied" }
  | { kind: "error" }
  | { kind: "ready"; lat: number; lng: number };

const GEO_OPTIONS: PositionOptions = { enableHighAccuracy: false, timeout: 10000, maximumAge: 5 * 60 * 1000 };

/**
 * מיקום בלחיצת-כפתור כברירת מחדל — לא אוטומטי ב-mount, כדי לא "לשרוף" את
 * בקשת-ההרשאה החד-פעמית של הדפדפן על משתמש שעוד לא הבין למה נשאל. denial
 * הוא per-origin, לא per-component: ברגע שנדחתה פעם אחת באיזשהו רכיב, כל
 * שאר הרכיבים באתר נשארים תקועים ב-"denied" לצמיתות בלי שהפופאפ יחזור.
 * יוצא מן הכלל: אם ההרשאה כבר אושרה בעבר (navigator.permissions.query),
 * אין תועלת בהמתנה ללחיצה — הבקשה תצליח בשקט בלי שום פופאפ, אז מפעילים
 * אוטומטית. request() משמש גם ל"נסה שוב" אחרי denied — קריאה טרייה יכולה
 * להצליח אם המשתמש התיר ידנית דרך הגדרות האתר, גם בלי שהפופאפ יחזור.
 */
export function useGeolocation(): [GeolocationState, () => void] {
  const [state, setState] = useState<GeolocationState>(() =>
    typeof navigator !== "undefined" && !("geolocation" in navigator) ? { kind: "unsupported" } : { kind: "idle" },
  );

  const request = useCallback(() => {
    if (typeof navigator === "undefined" || !("geolocation" in navigator)) {
      setState({ kind: "unsupported" });
      return;
    }
    setState({ kind: "loading" });
    navigator.geolocation.getCurrentPosition(
      (position) => setState({ kind: "ready", lat: position.coords.latitude, lng: position.coords.longitude }),
      (error) => setState({ kind: error.code === error.PERMISSION_DENIED ? "denied" : "error" }),
      GEO_OPTIONS,
    );
  }, []);

  useEffect(() => {
    if (state.kind !== "idle") return;
    if (typeof navigator === "undefined" || !("permissions" in navigator)) return;
    let cancelled = false;
    navigator.permissions
      .query({ name: "geolocation" })
      .then((status) => {
        if (!cancelled && status.state === "granted") request();
      })
      .catch(() => {
        // Permissions API לא נתמך/נכשל (למשל Safari ישנים) — נשארים ב-"idle",
        // הכפתור המפורש בממשק הוא ה-fallback.
      });
    return () => {
      cancelled = true;
    };
  }, [state.kind, request]);

  return [state, request];
}
