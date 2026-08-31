"use client";

import { useState } from "react";
import Link from "next/link";
import { Plus, X } from "@phosphor-icons/react";
import { QuickAddPanelContent } from "@/components/quick-add-panel-content";

/** כפתור-הוספה-מהירה צף (בכל מסך) — עוטף את QuickAddPanelContent. יש גם גרסה
 * בולטת-ישירות בתוך הדשבורד (dashboard/quick-actions-row.tsx), לבקשת משתמש
 * שהכפתור הצף לבד לא היה מספיק ברור/נגיש לו. */
export function QuickAddFab({ activeTripId, activeTripName }: { activeTripId: string | null; activeTripName?: string | null }) {
  const [open, setOpen] = useState(false);

  const secondaryActions = [
    { key: "activity", label: "תכנון", href: activeTripId ? `/trips/${activeTripId}#planning` : "/trips" },
    { key: "document", label: "מסמך", href: activeTripId ? `/trips/${activeTripId}#document-center` : "/trips" },
  ];

  return (
    <div className="app-quick-add-fab" style={{ position: "fixed", insetInlineEnd: "1rem", bottom: "calc(var(--bottom-nav-safe-height) + 0.75rem)", zIndex: 40 }}>
      {open ? <div onClick={() => setOpen(false)} style={{ position: "fixed", inset: 0, zIndex: -1 }} aria-hidden /> : null}

      {open ? (
        <div
          style={{
            position: "absolute",
            bottom: "3.75rem",
            insetInlineEnd: 0,
            width: "min(22rem, 90vw)",
            maxHeight: "75vh",
            overflowY: "auto",
            display: "flex",
            flexDirection: "column",
            gap: "0.75rem",
            padding: "1rem",
            borderRadius: "var(--radius-lg)",
            background: "var(--color-bg-elevated)",
            border: "1px solid var(--color-border)",
            boxShadow: "0 8px 28px rgba(0,0,0,0.35)",
          }}
        >
          <div style={{ fontWeight: 700, fontSize: "0.9375rem" }}>מה קרה, ומתי?</div>
          <QuickAddPanelContent activeTripId={activeTripId} activeTripName={activeTripName} />
          <div style={{ height: 1, background: "var(--color-border)", margin: "0.25rem 0" }} />
          <div style={{ display: "flex", flexWrap: "wrap", gap: "0.5rem" }}>
            {secondaryActions.map((action) => (
              <Link
                key={action.key}
                href={action.href}
                onClick={() => setOpen(false)}
                style={{
                  padding: "0.375rem 0.75rem",
                  borderRadius: "999px",
                  background: "var(--color-surface)",
                  border: "1px solid var(--color-border)",
                  color: "var(--color-text-muted)",
                  textDecoration: "none",
                  fontSize: "0.75rem",
                  whiteSpace: "nowrap",
                }}
              >
                {action.label}
              </Link>
            ))}
          </div>
        </div>
      ) : null}

      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        aria-label={open ? "סגור הוספה מהירה" : "הוספה מהירה"}
        style={{
          width: "3.25rem",
          height: "3.25rem",
          borderRadius: "50%",
          border: "none",
          cursor: "pointer",
          background: "var(--color-primary)",
          color: "#fff",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          boxShadow: "0 6px 20px rgba(0,0,0,0.35)",
          transform: open ? "rotate(45deg)" : "none",
          transition: "transform 150ms ease",
        }}
      >
        {open ? <X size={24} aria-hidden /> : <Plus size={24} aria-hidden />}
      </button>
    </div>
  );
}
