"use client";

import { useEffect, useState } from "react";
import type { PlaceSearchOutcome, PlaceSearchResult } from "./google-place-search";
import { searchLocationAction } from "@/components/location-search-actions";

/** מטמון תוצאות-חיפוש חוצה-instance (לא state — נשרד בין הרכבות/פירוקים של
 * הרכיב, למשל כשמשתמש מוחק-ומקליד-מחדש את אותה מילה). מונע קריאת-API כפולה
 * לאותה שאילתה בדיוק — צמצום-נפח שנועד למנוע 429 (Too Many Requests) מגוגל,
 * לצד ה-debounce וה-min-length למטה. Map פשוט, לא LRU — מספר המילים-השונות
 * שמשתמש בודד מחפש בסשן אחד קטן מספיק שלא שווה מנגנון-פינוי. */
const searchCache = new Map<string, PlaceSearchOutcome>();

/** חיפוש-מקום חי (Google Places, ר' google-place-search.ts) — debounce של
 * 450ms, ומתחיל רק מ-2 תווים (לא מהתו הראשון — כל תו בודד היה שולח שאילתת-API
 * כמעט-חסרת-תועלת, וגרם ל-429/Too-Many-Requests מגוגל בשימוש רגיל). משותף
 * בין location-picker-map.tsx (טפסי-הזמנה/מקום-חדש) ובין place-search-box.tsx
 * (/map הראשי) — אותה לוגיקה בדיוק, לא לשכפל אותה. cancelled-flag במקום
 * AbortController — Server Actions לא נתמכות ל-abort. מחזיר מצב-שגיאה מפורש
 * (לא רק מערך ריק) כדי שהלקוח יוכל להבחין "0 תוצאות אמיתיות" מ-"החיפוש נכשל".
 */
export function usePlaceSearch(query: string) {
  const [results, setResults] = useState<PlaceSearchResult[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const trimmed = query.trim();
  const cacheKey = trimmed.toLowerCase();
  const searchable = trimmed.length >= 2;

  useEffect(() => {
    // אין צורך לאפס results/error/loading כאן: כל שלושתם כבר "מוסווים" ל-
    // ריק/false בערך-המוחזר למטה כש-searchable הוא false, אז setState מיותר
    // בדיוק כשהוא היה גורם ל-render מדורג (react-hooks/set-state-in-effect).
    if (!searchable) return;
    const cached = searchCache.get(cacheKey);
    if (cached) {
      queueMicrotask(() => {
        setResults(cached.ok ? cached.results : []);
        setError(cached.ok ? null : cached.error);
      });
      return;
    }
    let cancelled = false;
    queueMicrotask(() => {
      if (!cancelled) setLoading(true);
    });
    const timer = setTimeout(async () => {
      const outcome = await searchLocationAction(trimmed);
      searchCache.set(cacheKey, outcome);
      if (cancelled) return;
      if (outcome.ok) {
        setResults(outcome.results);
        setError(null);
      } else {
        setResults([]);
        setError(outcome.error);
      }
      setLoading(false);
    }, 450);
    return () => {
      cancelled = true;
      clearTimeout(timer);
    };
  }, [searchable, trimmed, cacheKey]);

  return { results: searchable ? results : [], loading: searchable && loading, error: searchable ? error : null };
}
