import type { CSSProperties } from "react";

export const inputStyle: CSSProperties = {
  padding: "0.625rem 0.875rem",
  borderRadius: "var(--radius-md)",
  border: "1px solid var(--color-border)",
  background: "var(--color-surface-elevated)",
  color: "var(--color-text-primary)",
  // 16px, לא פחות: מתחת לזה iOS Safari מזום אוטומטית על focus (המשתמש חווה
  // את זה כ"המסך נמתח כשלוחצים על שדה") — קבוע משותף אחד, מתקן את כל
  // הקבצים שמייבאים אותו בבת אחת.
  fontSize: "1rem",
  flex: 1,
  minWidth: 0,
};

export function submitButtonStyle(isPending: boolean): CSSProperties {
  return {
    // minHeight מבטיח יעד-נגיעה נוח (~44px) גם עם טקסט קצר — חוץ מה-padding,
    // כדי לא לתלות "נוחות למגע" בחישוב עקיף של גופן+ריפוד. ה-hover/active/
    // focus-visible האמיתיים מגיעים מ-.ui-btn-primary ב-globals.css (className
    // למטה) — אי אפשר לבטא pseudo-classes ב-style inline של React.
    minHeight: "2.75rem",
    padding: "0.75rem 1.5rem",
    borderRadius: "var(--radius-full)",
    border: "none",
    background: isPending ? "var(--color-secondary)" : "var(--gradient-brand)",
    color: isPending ? "var(--color-text-muted)" : "#fff",
    fontWeight: 700,
    fontSize: "0.8125rem",
    cursor: isPending ? "default" : "pointer",
    alignSelf: "flex-start",
    boxShadow: isPending ? "none" : "var(--glow-brand)",
    transition: "all var(--duration-base) var(--ease-out)",
  };
}
