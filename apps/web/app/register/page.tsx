"use client";

import { useState } from "react";
import Link from "next/link";
import type { CSSProperties, FormEvent } from "react";
import { createSupabaseBrowserClient } from "@/lib/supabase/client";
import { logger } from "@/lib/logger";

export default function RegisterPage() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [agreed, setAgreed] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setErrorMessage(null);
    setSuccessMessage(null);

    if (!agreed) {
      setErrorMessage("צריך לאשר את התקנון, הסכם השימוש ומדיניות הפרטיות כדי להירשם.");
      return;
    }
    if (password !== confirmPassword) {
      setErrorMessage("הסיסמאות לא זהות.");
      return;
    }

    setIsSubmitting(true);
    try {
      const supabase = createSupabaseBrowserClient();
      const { data, error } = await supabase.auth.signUp({
        email,
        password,
        options: {
          // נקרא ע"י טריגר handle_new_auth_user (packages/db/prisma/rls_policies.sql)
          // ונשמר בעמודת User.legalConsentAcceptedAt — רגע ההרשמה עצמו, לא אישור בדיעבד.
          data: { legal_consent_accepted_at: new Date().toISOString() },
          // בלי זה, קישור-האימות באימייל מנווט לפי "Site URL" הגלובלי שמוגדר
          // בדשבורד Supabase (שעלול להצביע על סביבה אחרת, כמו localhost בפיתוח)
          // במקום לסביבה שממנה בפועל נרשם המשתמש. חייב גם להיות ברשימת ה-
          // Redirect URLs המורשית ב-Supabase, אחרת האימות עצמו נדחה.
          emailRedirectTo: `${window.location.origin}/login`,
        },
      });

      if (error) {
        setErrorMessage(error.message);
        logger.warn("registration failed", { email, reason: error.message });
        return;
      }

      logger.info("registration succeeded", { email });
      // Supabase עשוי לדרוש אישור אימייל לפני שיש session פעיל — לא מניחים login
      // מיידי, אלא מודיעים בכנות מה קרה בפועל.
      if (!data.session) {
        setSuccessMessage("נרשמת בהצלחה! בדוק את תיבת הדואר שלך כדי לאשר את החשבון לפני ההתחברות.");
      } else {
        setSuccessMessage("נרשמת והתחברת בהצלחה.");
      }
    } catch (error) {
      const message = error instanceof Error ? error.message : "שגיאה לא צפויה בהרשמה";
      setErrorMessage(message);
      logger.error("registration threw", { message });
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <main
      style={{
        minHeight: "100dvh",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        padding: "1.5rem",
      }}
    >
      <form
        onSubmit={handleSubmit}
        style={{
          width: "100%",
          maxWidth: "380px",
          background: "var(--color-surface)",
          border: "1px solid var(--color-border)",
          borderRadius: "var(--radius-lg)",
          backdropFilter: "blur(20px)",
          WebkitBackdropFilter: "blur(20px)",
          padding: "1.5rem",
          display: "flex",
          flexDirection: "column",
          gap: "0.75rem",
        }}
      >
        <h1 style={{ fontSize: "1.25rem", margin: 0 }}>הרשמה</h1>
        <p style={{ color: "var(--color-text-muted)", margin: 0, fontSize: "0.875rem" }}>
          מערכת ניהול טיולים אישית
        </p>

        <label style={{ display: "flex", flexDirection: "column", gap: "0.25rem" }}>
          <span>אימייל</span>
          <input
            type="email"
            required
            autoComplete="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            style={inputStyle}
          />
        </label>

        <label style={{ display: "flex", flexDirection: "column", gap: "0.25rem" }}>
          <span>סיסמה</span>
          <input
            type="password"
            required
            minLength={6}
            autoComplete="new-password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            style={inputStyle}
          />
        </label>

        <label style={{ display: "flex", flexDirection: "column", gap: "0.25rem" }}>
          <span>אימות סיסמה</span>
          <input
            type="password"
            required
            minLength={6}
            autoComplete="new-password"
            value={confirmPassword}
            onChange={(e) => setConfirmPassword(e.target.value)}
            style={inputStyle}
          />
        </label>

        <label style={{ display: "flex", alignItems: "flex-start", gap: "0.5rem", fontSize: "0.8125rem" }}>
          <input
            type="checkbox"
            required
            checked={agreed}
            onChange={(e) => setAgreed(e.target.checked)}
            style={{ marginTop: "0.1875rem" }}
          />
          <span>
            קראתי ואני מסכים/ה ל
            <Link href="/legal/terms" target="_blank" style={linkStyle}>
              תקנון
            </Link>
            , ל
            <Link href="/legal/agreement" target="_blank" style={linkStyle}>
              הסכם השימוש
            </Link>
            {" "}ול
            <Link href="/legal/privacy" target="_blank" style={linkStyle}>
              מדיניות הפרטיות
            </Link>
            .
          </span>
        </label>

        {errorMessage ? (
          <p style={{ color: "var(--color-danger)", margin: 0, fontSize: "0.875rem" }}>{errorMessage}</p>
        ) : null}
        {successMessage ? (
          <p style={{ color: "var(--color-success)", margin: 0, fontSize: "0.875rem" }}>{successMessage}</p>
        ) : null}

        <button
          type="submit"
          disabled={isSubmitting || !agreed}
          style={{
            marginTop: "0.5rem",
            padding: "0.75rem 1.25rem",
            borderRadius: "var(--radius-full)",
            border: "none",
            background: isSubmitting || !agreed ? "var(--color-secondary)" : "var(--gradient-brand)",
            color: isSubmitting || !agreed ? "var(--color-text-muted)" : "#fff",
            fontWeight: 700,
            cursor: isSubmitting || !agreed ? "default" : "pointer",
            boxShadow: isSubmitting || !agreed ? "none" : "var(--glow-brand)",
            transition: "all var(--duration-base) var(--ease-out)",
          }}
        >
          {isSubmitting ? "נרשם..." : "הרשמה"}
        </button>

        <p style={{ margin: 0, fontSize: "0.8125rem", textAlign: "center" }}>
          כבר יש לך חשבון? <Link href="/login" style={linkStyle}>התחבר</Link>
        </p>
      </form>
    </main>
  );
}

const inputStyle: CSSProperties = {
  padding: "0.625rem 0.875rem",
  borderRadius: "var(--radius-md)",
  border: "1px solid var(--color-border)",
  background: "var(--color-surface-elevated)",
  color: "var(--color-text-primary)",
};

const linkStyle: CSSProperties = { color: "var(--color-primary)" };
