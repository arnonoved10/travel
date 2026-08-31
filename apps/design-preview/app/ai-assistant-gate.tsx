"use client";

import { useEffect, useState } from "react";
import { createSupabaseBrowserClient } from "@/lib/supabase/client";
import { AIAssistant } from "./ai-assistant";

/**
 * מציג את עוזר ה-AI רק למשתמש מחובר.
 *
 * הבדיקה נעשית בצד לקוח במכוון: layout.tsx הוא Server Component של השורש,
 * וקריאת עוגיות בתוכו הייתה מוציאה את כל 40 המסכים מרינדור סטטי לרינדור
 * דינמי בכל בקשה. המחיר כאן הוא רק שהכפתור מופיע רגע אחרי טעינת הדף.
 */
export function AIAssistantGate() {
  const [isSignedIn, setIsSignedIn] = useState(false);

  useEffect(() => {
    let isActive = true;
    let unsubscribe: (() => void) | undefined;

    try {
      const supabase = createSupabaseBrowserClient();

      supabase.auth.getUser().then(({ data }) => {
        if (isActive) setIsSignedIn(Boolean(data.user));
      });

      // מתעדכן מיד בהתחברות ובהתנתקות, בלי לרענן את הדף.
      const { data } = supabase.auth.onAuthStateChange((_event, session) => {
        if (isActive) setIsSignedIn(Boolean(session?.user));
      });
      unsubscribe = () => data.subscription.unsubscribe();
    } catch {
      // משתני Supabase חסרים — אין דרך לדעת מי מחובר, ולכן לא מציגים.
      if (isActive) setIsSignedIn(false);
    }

    return () => {
      isActive = false;
      unsubscribe?.();
    };
  }, []);

  if (!isSignedIn) return null;
  return <AIAssistant />;
}
