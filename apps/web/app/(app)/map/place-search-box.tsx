"use client";

import { useEffect, useRef, useState } from "react";
import { MagnifyingGlass } from "@phosphor-icons/react";
import type { PlaceSearchResult } from "@/lib/geocoding/google-place-search";
import { usePlaceSearch } from "@/lib/geocoding/use-place-search";

/** תיבת-חיפוש-מקום עצמאית ל-/map (בקשת משתמש: "זה צריך גם לעבוד במפה, לא
 * רק בהזמנה") — אותו חיפוש-חי (Google Places) בדיוק כמו location-picker-map.tsx,
 * אבל בלי מפה-פנימית משלה (יש כבר מפה גדולה מעליה בעמוד) — רק input+dropdown,
 * בחירת-תוצאה מדווחת החוצה דרך onSelect. */
export function PlaceSearchBox({ onSelect, placeholder = "חפש מקום, מלון או כתובת…" }: { onSelect: (result: PlaceSearchResult) => void; placeholder?: string }) {
  const [query, setQuery] = useState("");
  const [showResults, setShowResults] = useState(false);
  const { results, loading, error } = usePlaceSearch(query);
  const rootRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!showResults) return;
    function onDocClick(e: MouseEvent) {
      if (rootRef.current && !rootRef.current.contains(e.target as Node)) setShowResults(false);
    }
    document.addEventListener("mousedown", onDocClick);
    return () => document.removeEventListener("mousedown", onDocClick);
  }, [showResults]);

  function handlePick(r: PlaceSearchResult): void {
    onSelect(r);
    setQuery(r.placeName);
    setShowResults(false);
  }

  return (
    <div ref={rootRef} style={{ position: "relative", zIndex: 1000, width: "100%" }}>
      <div style={{ position: "relative" }}>
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
          placeholder={placeholder}
          style={{
            width: "100%",
            padding: "0.625rem 0.875rem 0.625rem 0.875rem",
            paddingInlineStart: "2.25rem",
            borderRadius: "var(--radius-full)",
            border: "1px solid var(--color-border)",
            background: "var(--color-surface-solid)",
            color: "var(--color-text-primary)",
            fontSize: "1rem",
            boxShadow: "0 2px 6px rgba(0,0,0,0.25)",
          }}
        />
      </div>
      {showResults && query.trim().length >= 1 ? (
        <ul
          style={{
            position: "absolute",
            insetInlineStart: 0,
            insetInlineEnd: 0,
            top: "calc(100% + 0.375rem)",
            zIndex: 50,
            margin: 0,
            padding: "0.375rem",
            listStyle: "none",
            maxHeight: "14rem",
            overflowY: "auto",
            borderRadius: "var(--radius-md)",
            border: "1px solid var(--color-border)",
            background: "var(--color-bg-elevated)",
            boxShadow: "var(--shadow-lg)",
            animation: "lift-in var(--duration-base) var(--ease-out)",
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
        </ul>
      ) : null}
    </div>
  );
}
