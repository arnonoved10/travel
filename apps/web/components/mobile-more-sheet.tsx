"use client";

import { useState } from "react";
import Link from "next/link";
import { MoreHorizontal, X } from "lucide-react";
import { ROUTE_ICONS } from "@/components/nav-icons";

export function MobileMoreSheet({ items }: { items: { href: string; label: string }[] }) {
  const [open, setOpen] = useState(false);

  return (
    <>
      <button
        type="button"
        onClick={() => setOpen(true)}
        aria-label="עוד"
        style={{
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          gap: "0.125rem",
          padding: "0.25rem 0.125rem",
          flex: "1 1 0",
          minWidth: 0,
          background: "transparent",
          border: "none",
          color: "var(--color-text-muted)",
          cursor: "pointer",
        }}
      >
        <MoreHorizontal size={22} strokeWidth={1.75} aria-hidden />
        <span style={{ fontSize: "0.6875rem" }}>עוד</span>
      </button>

      {open ? (
        <div
          role="dialog"
          aria-modal="true"
          onClick={() => setOpen(false)}
          style={{
            position: "fixed",
            inset: 0,
            background: "rgba(0,0,0,0.5)",
            zIndex: 50,
            display: "flex",
            alignItems: "flex-end",
          }}
        >
          <div
            onClick={(e) => e.stopPropagation()}
            style={{
              width: "100%",
              background: "var(--color-surface-solid)",
              borderTop: "1px solid var(--color-border)",
              borderTopLeftRadius: "var(--radius-lg)",
              borderTopRightRadius: "var(--radius-lg)",
              padding: "1rem",
              paddingBottom: "max(1rem, env(safe-area-inset-bottom))",
              display: "flex",
              flexDirection: "column",
              gap: "0.25rem",
            }}
          >
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "0.5rem" }}>
              <span style={{ fontWeight: 600 }}>עוד</span>
              <button
                type="button"
                onClick={() => setOpen(false)}
                aria-label="סגור"
                style={{ background: "none", border: "none", color: "var(--color-text-muted)", cursor: "pointer" }}
              >
                <X size={20} aria-hidden />
              </button>
            </div>
            {items.map((item) => {
              const Icon = ROUTE_ICONS[item.href];
              return (
                <Link
                  key={item.href}
                  href={item.href}
                  onClick={() => setOpen(false)}
                  style={{
                    display: "flex",
                    alignItems: "center",
                    gap: "0.75rem",
                    padding: "0.75rem",
                    borderRadius: "var(--radius-md)",
                    color: "var(--color-text)",
                    textDecoration: "none",
                  }}
                >
                  {Icon ? <Icon size={20} strokeWidth={1.75} aria-hidden /> : null}
                  {item.label}
                </Link>
              );
            })}
          </div>
        </div>
      ) : null}
    </>
  );
}
