"use client";

import { COLOR, SPACE, RADIUS, NAV_HEIGHT } from "./design-system";

export interface ToastState {
  message: string;
  actionLabel?: string;
  onAction?: () => void;
}

export function ToastBar({ toast }: { toast: ToastState | null }) {
  if (!toast) return null;
  return (
    <div
      style={{
        position: "fixed",
        insetInlineStart: SPACE.lg,
        insetInlineEnd: SPACE.lg,
        bottom: `${NAV_HEIGHT + 16}px`,
        maxWidth: "480px",
        marginInline: "auto",
        background: COLOR.cardElevated,
        border: `1px solid ${COLOR.border}`,
        borderRadius: `${RADIUS.card}px`,
        padding: "12px 16px",
        display: "flex",
        alignItems: "center",
        justifyContent: "space-between",
        gap: SPACE.md,
        zIndex: 40,
        boxShadow: "0 8px 24px rgba(0,0,0,0.35)",
      }}
    >
      <span style={{ fontSize: "12.5px", color: COLOR.textPrimary, fontWeight: 600 }}>{toast.message}</span>
      {toast.actionLabel && toast.onAction ? (
        <button type="button" onClick={toast.onAction} style={{ background: "none", border: "none", color: COLOR.primaryLight, fontSize: "12.5px", fontWeight: 700, cursor: "pointer", flexShrink: 0 }}>
          {toast.actionLabel}
        </button>
      ) : null}
    </div>
  );
}
