"use client";

import { useState, type CSSProperties } from "react";
import { useToast } from "@/components/toast-provider";
import { createShareLinkAction, regenerateShareLinkAction, revokeShareLinkAction, sendShareLinkEmailAction } from "./actions";

const inputStyle: CSSProperties = {
  padding: "0.375rem 0.625rem",
  borderRadius: "var(--radius-md)",
  border: "1px solid var(--color-border)",
  background: "var(--color-surface-elevated)",
  color: "var(--color-text-primary)",
  fontSize: "0.8125rem",
};

const buttonStyle: CSSProperties = {
  padding: "0.375rem 0.75rem",
  borderRadius: "var(--radius-full)",
  border: "1px solid var(--color-border)",
  background: "var(--color-surface)",
  color: "var(--color-text-primary)",
  cursor: "pointer",
  fontSize: "0.8125rem",
};

export function ShareLinkPanel({ tripId, token }: { tripId: string; token: string | null }) {
  const { pushToast } = useToast();
  const [isPending, setIsPending] = useState(false);
  const [recipientEmail, setRecipientEmail] = useState("");
  const [emailMessage, setEmailMessage] = useState("");
  const [isSendingEmail, setIsSendingEmail] = useState(false);
  const [emailError, setEmailError] = useState<string | null>(null);

  const shareUrl = token && typeof window !== "undefined" ? `${window.location.origin}/shared/${token}` : null;

  async function handleSendEmail() {
    if (!shareUrl || !recipientEmail.trim()) return;
    setIsSendingEmail(true);
    setEmailError(null);
    try {
      const result = await sendShareLinkEmailAction(tripId, recipientEmail.trim(), shareUrl, emailMessage);
      if (!result.ok) {
        setEmailError(result.error ?? "שליחת האימייל נכשלה.");
        return;
      }
      pushToast(`הקישור נשלח ל-${recipientEmail.trim()}.`);
      setRecipientEmail("");
      setEmailMessage("");
    } finally {
      setIsSendingEmail(false);
    }
  }

  async function runAction(action: (tripId: string) => Promise<void>) {
    setIsPending(true);
    try {
      await action(tripId);
    } finally {
      setIsPending(false);
    }
  }

  async function handleCopy() {
    if (!shareUrl) return;
    try {
      await navigator.clipboard.writeText(shareUrl);
      pushToast("הקישור הועתק ללוח.");
    } catch {
      pushToast("לא ניתן להעתיק בדפדפן הזה — אפשר להעתיק ידנית.");
    }
  }

  if (!token) {
    return (
      <div style={{ display: "flex", flexDirection: "column", gap: "0.5rem" }}>
        <p style={{ fontSize: "0.8125rem", color: "var(--color-text-muted)", margin: 0 }}>
          יוצר קישור לצפייה בלבד במסלול הטיול (בלי מחירים/הוצאות/מסמכים) — אפשר לשלוח למי שתבחר, ולבטל בכל רגע.
        </p>
        <button type="button" disabled={isPending} onClick={() => runAction(createShareLinkAction)} style={buttonStyle}>
          {isPending ? "יוצר..." : "צור קישור שיתוף"}
        </button>
      </div>
    );
  }

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: "0.5rem" }}>
      <p style={{ fontSize: "0.8125rem", color: "var(--color-text-muted)", margin: 0 }}>
        כל מי שמחזיק בקישור הזה יכול לצפות במסלול הטיול (בלי מחירים/הוצאות/מסמכים). שולט מי מקבל אותו.
      </p>
      <div style={{ display: "flex", gap: "0.5rem", flexWrap: "wrap", alignItems: "center" }}>
        <code style={{ fontSize: "0.8125rem", padding: "0.25rem 0.5rem", background: "var(--color-surface-elevated)", borderRadius: "var(--radius-sm)" }}>
          {shareUrl ?? `/shared/${token}`}
        </code>
        <button type="button" onClick={handleCopy} style={buttonStyle}>
          העתק
        </button>
      </div>

      <div style={{ display: "flex", flexDirection: "column", gap: "0.375rem", maxWidth: "360px" }}>
        <label style={{ display: "flex", flexDirection: "column", gap: "0.25rem", fontSize: "0.8125rem" }}>
          <span>שלח את הקישור באימייל</span>
          <input
            type="email"
            value={recipientEmail}
            onChange={(e) => setRecipientEmail(e.target.value)}
            placeholder="name@example.com"
            style={inputStyle}
          />
        </label>
        <textarea
          value={emailMessage}
          onChange={(e) => setEmailMessage(e.target.value)}
          placeholder="הודעה אישית (אופציונלי)"
          rows={2}
          style={{ ...inputStyle, resize: "vertical" }}
        />
        <button
          type="button"
          disabled={isSendingEmail || !recipientEmail.trim()}
          onClick={handleSendEmail}
          style={{ ...buttonStyle, alignSelf: "flex-start", opacity: isSendingEmail || !recipientEmail.trim() ? 0.6 : 1 }}
        >
          {isSendingEmail ? "שולח..." : "שלח באימייל"}
        </button>
        {emailError ? <span style={{ color: "var(--color-danger)", fontSize: "0.75rem" }}>{emailError}</span> : null}
      </div>

      <div style={{ display: "flex", gap: "0.5rem" }}>
        <button type="button" disabled={isPending} onClick={() => runAction(regenerateShareLinkAction)} style={buttonStyle}>
          {isPending ? "מרענן..." : "צור קישור חדש (מבטל את הישן)"}
        </button>
        <button
          type="button"
          disabled={isPending}
          onClick={() => runAction(revokeShareLinkAction)}
          style={{ ...buttonStyle, color: "var(--color-danger)" }}
        >
          {isPending ? "מבטל..." : "בטל קישור"}
        </button>
      </div>
    </div>
  );
}
