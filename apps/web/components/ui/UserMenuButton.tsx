"use client";

import { useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { SignOut, Gear } from "@phosphor-icons/react";
import { createSupabaseBrowserClient } from "@/lib/supabase/client";
import { Avatar } from "./Avatar";

/**
 * עוטף את ה-Avatar הקיים (עדיין ראשי-תיבות בכוונה — אין שדה תמונת-פרופיל
 * אמיתי, ר' Avatar.tsx) בתפריט-משתמש אמיתי: שם, קישור-הגדרות, והתנתקות
 * אמיתית (Supabase auth.signOut בפועל, לא כפתור-דמה). לא משנה את Avatar
 * עצמו — הוא עדיין בשימוש-ישיר בסיידבר בלי תפריט, זה רק תוסף ל-TopBar.
 */
export function UserMenuButton({ userLabel, displayName }: { userLabel: string; displayName?: string | null }) {
  const [open, setOpen] = useState(false);
  const [signingOut, setSigningOut] = useState(false);
  const rootRef = useRef<HTMLDivElement>(null);
  const router = useRouter();
  const shownName = displayName ?? userLabel;

  useEffect(() => {
    if (!open) return;
    function onDocClick(e: MouseEvent) {
      if (rootRef.current && !rootRef.current.contains(e.target as Node)) setOpen(false);
    }
    function onKey(e: KeyboardEvent) {
      if (e.key === "Escape") setOpen(false);
    }
    document.addEventListener("mousedown", onDocClick);
    document.addEventListener("keydown", onKey);
    return () => {
      document.removeEventListener("mousedown", onDocClick);
      document.removeEventListener("keydown", onKey);
    };
  }, [open]);

  async function handleLogout() {
    setSigningOut(true);
    const supabase = createSupabaseBrowserClient();
    await supabase.auth.signOut();
    router.push("/login");
    router.refresh();
  }

  return (
    <div ref={rootRef} style={{ position: "relative" }}>
      <button
        type="button"
        onClick={() => setOpen((o) => !o)}
        aria-haspopup="menu"
        aria-expanded={open}
        style={{ display: "flex", alignItems: "center", background: "transparent", border: "none", padding: 0, cursor: "pointer" }}
      >
        <Avatar label={userLabel} size={36} />
      </button>

      {open ? (
        <div
          role="menu"
          style={{
            position: "absolute",
            insetInlineEnd: 0,
            top: "calc(100% + 0.5rem)",
            zIndex: 50,
            width: "13rem",
            padding: "0.5rem",
            borderRadius: "var(--radius-md)",
            border: "1px solid var(--color-border)",
            background: "var(--color-bg-elevated)",
            boxShadow: "var(--shadow-lg)",
            animation: "lift-in var(--duration-base) var(--ease-out)",
            display: "flex",
            flexDirection: "column",
            gap: "0.25rem",
          }}
        >
          <div style={{ padding: "0.5rem 0.625rem", overflow: "hidden" }}>
            <div style={{ font: "var(--text-caption)", fontWeight: 700, whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>{shownName}</div>
            {displayName ? (
              <div style={{ font: "var(--text-caption)", color: "var(--color-text-muted)", whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>{userLabel}</div>
            ) : null}
          </div>
          <div style={{ height: 1, background: "var(--color-border)" }} />
          <Link
            href="/settings"
            onClick={() => setOpen(false)}
            style={{ display: "flex", alignItems: "center", gap: "0.5rem", padding: "0.5rem 0.625rem", borderRadius: "var(--radius-sm)", color: "var(--color-text-primary)", textDecoration: "none", font: "var(--text-caption)" }}
          >
            <Gear size={16} aria-hidden />
            הגדרות
          </Link>
          <button
            type="button"
            onClick={handleLogout}
            disabled={signingOut}
            style={{
              display: "flex",
              alignItems: "center",
              gap: "0.5rem",
              padding: "0.5rem 0.625rem",
              borderRadius: "var(--radius-sm)",
              border: "none",
              background: "transparent",
              color: "var(--color-danger)",
              cursor: signingOut ? "default" : "pointer",
              font: "var(--text-caption)",
              fontWeight: 600,
              textAlign: "start",
            }}
          >
            <SignOut size={16} weight="bold" aria-hidden />
            {signingOut ? "מתנתק..." : "התנתקות"}
          </button>
        </div>
      ) : null}
    </div>
  );
}
