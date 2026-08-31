"use client";

import { useEffect, useRef, useState } from "react";
import { createPortal } from "react-dom";
import dynamic from "next/dynamic";
import { MagnifyingGlass } from "@phosphor-icons/react";
import type { PlaceSearchResult } from "@/lib/geocoding/google-place-search";
import { usePlaceSearch } from "@/lib/geocoding/use-place-search";
import { useAnchoredPosition } from "@/lib/use-anchored-position";

// Leaflet נוגע ב-window/document ישירות — לא ניתן ל-render בצד שרת. אותו
// דפוס בדיוק כמו apps/web/app/(app)/map/map-view.tsx.
const LocationPickerLeaflet = dynamic(() => import("./location-picker-map-leaflet").then((m) => m.LocationPickerLeaflet), {
  ssr: false,
  loading: () => (
    <div style={{ height: "100%", display: "flex", alignItems: "center", justifyContent: "center", color: "var(--color-text-muted)" }}>
      טוען מפה...
    </div>
  ),
});

/** "Hilton Bangkok, 123 Sukhumvit Rd, Bangkok, Thailand" → שם + כתובת נפרדים. */
function splitNameAndAddress(placeName: string): { name: string; address: string } {
  const [first, ...rest] = placeName.split(",");
  const name = (first ?? placeName).trim();
  const address = rest.join(",").trim();
  return { name, address: address || placeName };
}

/** מפה קטנה לבחירת נקודה — בקליק על המפה, או חיפוש-מקום אמיתי (Google Places)
 * שמזיז את המפה ומסמן את הנקודה.
 *
 * שני מצבי-חיפוש: ברירת-מחדל — תיבת-חיפוש נפרדת מעל המפה (query פנימי).
 * כש-nameValue/onNameChange מסופקים (למשל טופס-מלון) — שדה ה"שם" עצמו הוא
 * תיבת-החיפוש (מה שהמשתמש מקליד = השם שיישמר), ובחירת תוצאה גם ממלאת כתובת
 * דרך onAddressChange — כדי לא להוסיף שדה "מיקום" נפרד ומבלבל. */
export function LocationPickerMap({
  value,
  onPick,
  center = [20, 15],
  zoom = 2,
  nameValue,
  onNameChange,
  onAddressChange,
  onDetailsChange,
  searchPlaceholder = "חפש מקום, מלון או כתובת…",
}: {
  value: { lat: number; lng: number } | null;
  onPick: (lat: number, lng: number) => void;
  center?: [number, number];
  zoom?: number;
  nameValue?: string;
  onNameChange?: (name: string) => void;
  onAddressChange?: (address: string) => void;
  /** תוצאת-החיפוש המלאה (מדינה/עיר/טלפון/אתר/שעות/קטגוריה — כל מה שגוגל
   * החזיר) — כדי שקוראים כמו PlaceCreateForm ימלאו-מראש טופס שלם, לא רק
   * שם+כתובת. בקשת משתמש: "המערכת צריכה לתת את כל הפרטים אוטומטית". */
  onDetailsChange?: (result: PlaceSearchResult) => void;
  searchPlaceholder?: string;
}) {
  const nameDriven = nameValue !== undefined && onNameChange !== undefined;
  const [internalQuery, setInternalQuery] = useState("");
  const query = nameDriven ? nameValue : internalQuery;
  const setQuery = nameDriven ? onNameChange : setInternalQuery;
  const [showResults, setShowResults] = useState(false);
  const { results, loading, error } = usePlaceSearch(query);
  const rootRef = useRef<HTMLDivElement>(null);
  const searchBoxRef = useRef<HTMLDivElement>(null);
  const resultsRef = useRef<HTMLUListElement>(null);
  const anchorPosition = useAnchoredPosition(showResults, searchBoxRef);

  useEffect(() => {
    if (!showResults) return;
    function onDocClick(e: MouseEvent) {
      const target = e.target as Node;
      if (rootRef.current?.contains(target)) return;
      // הרשימה מרונדרת דרך portal (ר' למטה) — מחוץ ל-subtree של rootRef,
      // אז בלי הבדיקה הנוספת הזו כל קליק בתוכה היה נחשב "קליק בחוץ" וסוגר
      // אותה מיד, לפני שה-onClick על התוצאה מספיק לרוץ (mousedown לפני click).
      // אותו באג בדיוק שתוקן ב-DatePicker.
      if (resultsRef.current?.contains(target)) return;
      setShowResults(false);
    }
    document.addEventListener("mousedown", onDocClick);
    return () => document.removeEventListener("mousedown", onDocClick);
  }, [showResults]);

  function handlePick(r: PlaceSearchResult): void {
    onPick(r.lat, r.lng);
    if (nameDriven) {
      const { name, address } = splitNameAndAddress(r.placeName);
      setQuery(name);
      onAddressChange?.(address);
    } else {
      setQuery(r.placeName);
    }
    onDetailsChange?.(r);
    setShowResults(false);
  }

  const showList = showResults && query.trim().length >= 2;

  return (
    <div ref={rootRef} style={{ display: "flex", flexDirection: "column", gap: "0.5rem" }}>
      <div ref={searchBoxRef} style={{ position: "relative" }}>
        <MagnifyingGlass
          size={16}
          weight="bold"
          aria-hidden
          style={{ position: "absolute", insetInlineStart: "0.75rem", top: "50%", transform: "translateY(-50%)", color: "var(--color-text-muted)" }}
        />
        <input
          type="text"
          value={query}
          onChange={(e) => {
            setQuery(e.target.value);
            setShowResults(true);
          }}
          onFocus={() => setShowResults(true)}
          placeholder={searchPlaceholder}
          style={{
            width: "100%",
            padding: "0.625rem 0.875rem 0.625rem 0.875rem",
            paddingInlineStart: "2.25rem",
            borderRadius: "var(--radius-md)",
            border: "1px solid var(--color-border)",
            background: "var(--color-surface-elevated)",
            color: "var(--color-text-primary)",
            fontSize: "1rem",
          }}
        />
      </div>
      {/* מרונדר דרך portal ישירות ל-document.body, לא position:absolute רגיל —
          הרשימה הזו יכולה להיפתח בתוך כרטיס עם overflow:hidden (למשל כרטיס
          "פעולות מהירות" בדשבורד, ר' GlassCard.tsx), ובלי portal היא נחתכת
          ונעלמת לגמרי — אותו באג בדיוק שתוקן ב-DatePicker.tsx. גם פותר את
          התנגשות ה-z-index מול השכבות הפנימיות (200–700) של Leaflet במפה למטה. */}
      {showList && anchorPosition && typeof document !== "undefined"
        ? createPortal(
            <ul
              ref={resultsRef}
              style={{
                position: "fixed",
                zIndex: 1000,
                margin: 0,
                padding: "0.375rem",
                listStyle: "none",
                maxHeight: "14rem",
                overflowY: "auto",
                borderRadius: "var(--radius-md)",
                border: "1px solid var(--color-border)",
                // רקע אטום ממש (לא הטוקן השקוף-למחצה של "זכוכית כפורה" שרוב
                // הדרופדאונים משתמשים בו) — הרשימה יכולה לשבת מעל תמונת-רקע/
                // מפה, וצבעים משתנים לגמרי מוחקים טקסט כמעט-לבן על שקיפות.
                background: "var(--color-bg-elevated)",
                boxShadow: "var(--shadow-lg)",
                animation: "lift-in var(--duration-base) var(--ease-out)",
                ...anchorPosition,
              }}
            >
              {loading ? (
                <li style={{ padding: "0.5rem 0.75rem", fontSize: "0.8125rem", color: "var(--color-text-muted)" }}>מחפש…</li>
              ) : error ? (
                <li style={{ padding: "0.5rem 0.75rem", fontSize: "0.8125rem", color: "var(--color-danger)" }}>{error}</li>
              ) : results.length === 0 ? (
                <li style={{ padding: "0.5rem 0.75rem", fontSize: "0.8125rem", color: "var(--color-text-muted)" }}>לא נמצאו תוצאות.</li>
              ) : (
                results.map((r) => (
                  <li key={r.id}>
                    <button
                      type="button"
                      onClick={() => handlePick(r)}
                      style={{
                        width: "100%",
                        padding: "0.5rem 0.75rem",
                        border: "none",
                        background: "transparent",
                        color: "var(--color-text-primary)",
                        fontSize: "0.8125rem",
                        textAlign: "start",
                        cursor: "pointer",
                        borderRadius: "var(--radius-sm)",
                      }}
                      onMouseEnter={(e) => (e.currentTarget.style.background = "var(--color-surface)")}
                      onMouseLeave={(e) => (e.currentTarget.style.background = "transparent")}
                    >
                      {r.placeName}
                    </button>
                  </li>
                ))
              )}
            </ul>,
            document.body,
          )
        : null}

      <div style={{ height: "260px", borderRadius: "10px", overflow: "hidden", border: "1px solid var(--color-border)" }}>
        <LocationPickerLeaflet value={value} onPick={onPick} center={center} zoom={zoom} />
      </div>
      <p style={{ margin: 0, fontSize: "0.75rem", color: "var(--color-text-muted)" }}>חפש מקום למעלה, או לחץ ישירות על המפה כדי לסמן נקודה.</p>
    </div>
  );
}
