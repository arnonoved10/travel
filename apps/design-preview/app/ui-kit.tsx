"use client";

import { COLOR } from "./shared";

/** רכיבי-UI כלליים (חלונית תחתונה, שדה-טופס, כפתור-פעולה ברשימה, בוררת-
 * פילים) — משותפים לארנק ולמסך "עוד", כדי ששני המסכים ייראו אחידים בלי
 * כפילות קוד. */

export function fieldLabelStyle(): React.CSSProperties {
  return { fontSize: "12px", fontWeight: 700, color: COLOR.textSecondary, marginBottom: "5px", display: "block" };
}
export function inputStyle(): React.CSSProperties {
  return { width: "100%", padding: "10px 12px", borderRadius: "10px", background: "#0e1930", border: `1px solid ${COLOR.cardBorder}`, color: "#fff", fontSize: "14px", fontFamily: "inherit" };
}
export function Field({ label, children, hint }: { label: string; children: React.ReactNode; hint?: string }) {
  return (
    <div>
      <span style={fieldLabelStyle()}>{label}</span>
      {children}
      {hint ? <div style={{ fontSize: "10.5px", color: COLOR.textMuted, marginTop: "4px" }}>{hint}</div> : null}
    </div>
  );
}
export function Sheet({ children, onClose, title }: { children: React.ReactNode; onClose: () => void; title: string }) {
  return (
    <div style={{ position: "fixed", inset: 0, zIndex: 60, display: "flex", alignItems: "flex-end" }}>
      <div onClick={onClose} style={{ position: "absolute", inset: 0, background: "rgba(3,6,16,0.6)" }} />
      <div style={{ position: "relative", width: "100%", maxWidth: "480px", marginInline: "auto", background: "#101d3a", borderTopLeftRadius: "22px", borderTopRightRadius: "22px", border: `1px solid ${COLOR.cardBorder}`, borderBottom: "none", padding: "10px 18px calc(18px + env(safe-area-inset-bottom))", maxHeight: "85vh", overflowY: "auto" }}>
        <div style={{ width: "40px", height: "4px", borderRadius: "999px", background: "rgba(255,255,255,0.25)", margin: "4px auto 12px" }} />
        <div style={{ fontSize: "16px", fontWeight: 800, color: "#fff", marginBottom: "12px" }}>{title}</div>
        {children}
      </div>
    </div>
  );
}
export function ActionRow({ label, onClick, danger }: { label: string; onClick: () => void; danger?: boolean }) {
  return (
    <button type="button" onClick={onClick} style={{ display: "flex", alignItems: "center", gap: "10px", width: "100%", padding: "13px 4px", background: "none", border: "none", borderBottom: `1px solid ${COLOR.cardBorder}`, color: danger ? COLOR.danger : "#fff", fontSize: "14px", fontWeight: 700, cursor: "pointer", textAlign: "right" }}>
      {label}
    </button>
  );
}
export function PillSelect<T extends string>({ options, value, onChange, labels }: { options: readonly T[]; value: T; onChange: (v: T) => void; labels: Record<T, string> }) {
  return (
    <div style={{ display: "flex", gap: "6px", flexWrap: "wrap" }}>
      {options.map((opt) => (
        <button
          key={opt}
          type="button"
          onClick={() => onChange(opt)}
          style={{ padding: "7px 12px", borderRadius: "999px", fontSize: "12px", fontWeight: 700, cursor: "pointer", background: value === opt ? COLOR.purple : "rgba(255,255,255,0.06)", border: `1px solid ${value === opt ? COLOR.purple : COLOR.cardBorder}`, color: "#fff" }}
        >
          {labels[opt]}
        </button>
      ))}
    </div>
  );
}
export function DotsIcon({ size = 16 }: { size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="currentColor" aria-hidden>
      <circle cx="12" cy="5" r="2" />
      <circle cx="12" cy="12" r="2" />
      <circle cx="12" cy="19" r="2" />
    </svg>
  );
}
export function CameraIcon({ size = 15 }: { size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="#fff" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" aria-hidden>
      <path d="M4 8a2 2 0 0 1 2-2h1.5l1-1.5h7l1 1.5H18a2 2 0 0 1 2 2v9a2 2 0 0 1-2 2H6a2 2 0 0 1-2-2z" />
      <circle cx="12" cy="13" r="3.2" />
    </svg>
  );
}
export function ImageIcon({ size = 15 }: { size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="#fff" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" aria-hidden>
      <rect x="3" y="4" width="18" height="16" rx="2" />
      <circle cx="8.5" cy="9.5" r="1.5" />
      <path d="M21 16l-5.5-5.5L4 21" />
    </svg>
  );
}
export function ChevronIcon() {
  return (
    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke={COLOR.textSecondary} strokeWidth={2.2} strokeLinecap="round" strokeLinejoin="round" aria-hidden>
      <path d="M15 5 8 12l7 7" />
    </svg>
  );
}
export function ToastView({ toast }: { toast: { message: string; actionLabel?: string; onAction?: () => void } | null }) {
  if (!toast) return null;
  return (
    <div style={{ position: "fixed", insetInlineStart: "16px", insetInlineEnd: "16px", bottom: "calc(64px + 14px)", zIndex: 1600, display: "flex", justifyContent: "center" }}>
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: "12px", width: "100%", maxWidth: "460px", background: "rgba(15,22,42,0.97)", border: `1px solid ${COLOR.cardBorder}`, borderRadius: "14px", padding: "12px 16px", boxShadow: "0 10px 30px rgba(0,0,0,0.4)" }}>
        <span style={{ fontSize: "13px", color: "#fff" }}>{toast.message}</span>
        {toast.actionLabel ? (
          <button type="button" onClick={toast.onAction} style={{ background: "none", border: "none", color: COLOR.purple, fontWeight: 800, fontSize: "13px", cursor: "pointer" }}>
            {toast.actionLabel}
          </button>
        ) : null}
      </div>
    </div>
  );
}
