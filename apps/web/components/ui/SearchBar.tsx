"use client";

import { useEffect, useRef } from "react";
import { MagnifyingGlass } from "@phosphor-icons/react";
import { ICON_SIZE } from "./tokens";

/** Plain GET form (same pattern already used for the trips date filter — real search, see
 * dashboard/page.tsx `q` handling) plus one small real behavior: Cmd/Ctrl+K focuses the
 * input. Client-only just for that listener; the form itself still works with JS off. */
export function SearchBar({
  action,
  name = "q",
  placeholder,
  defaultValue,
}: {
  action: string;
  name?: string;
  placeholder: string;
  defaultValue?: string;
}) {
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    function onKeyDown(e: KeyboardEvent) {
      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === "k") {
        e.preventDefault();
        inputRef.current?.focus();
      }
    }
    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, []);

  return (
    <form action={action} method="get" style={{ display: "flex" }}>
      <div style={{ position: "relative" }}>
        <MagnifyingGlass
          size={ICON_SIZE.sm}
          weight="fill"
          aria-hidden
          style={{
            position: "absolute",
            insetInlineStart: "0.75rem",
            top: "50%",
            transform: "translateY(-50%)",
            color: "var(--color-text-muted)",
          }}
        />
        <input
          ref={inputRef}
          type="search"
          name={name}
          defaultValue={defaultValue}
          placeholder={placeholder}
          style={{
            padding: "0.625rem 3rem 0.625rem 1rem",
            paddingInlineStart: "2.25rem",
            borderRadius: "var(--radius-full)",
            border: "1px solid var(--color-border)",
            background: "var(--color-surface)",
            color: "var(--color-text-primary)",
            fontSize: "0.8125rem",
            height: "2.5rem",
            width: "min(240px, 30vw)",
            minWidth: "140px",
          }}
        />
        <span
          aria-hidden
          style={{
            position: "absolute",
            insetInlineEnd: "0.625rem",
            top: "50%",
            transform: "translateY(-50%)",
            font: "var(--text-label)",
            fontSize: "0.6875rem",
            color: "var(--color-text-muted)",
            border: "1px solid var(--color-border)",
            borderRadius: "0.25rem",
            padding: "0.0625rem 0.375rem",
            pointerEvents: "none",
          }}
        >
          ⌘K
        </span>
      </div>
    </form>
  );
}
