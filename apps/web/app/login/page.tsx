"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { createSupabaseBrowserClient } from "@/lib/supabase/client";
import { logger } from "@/lib/logger";

export default function LoginPage() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setErrorMessage(null);
    setIsSubmitting(true);

    try {
      const supabase = createSupabaseBrowserClient();
      const { error } = await supabase.auth.signInWithPassword({ email, password });

      if (error) {
        setErrorMessage(error.message);
        logger.warn("login failed", { email, reason: error.message });
        return;
      }

      logger.info("login succeeded", { email });
      // עקבי עם "/" הריק (app/page.tsx) — אותו יעד לביקור-מחובר, לא היה ככה
      // קודם ("/trips", בלי ברכה/שעון-עולם) — ר' תלונת-משתמש "בכניסה למערכת".
      router.push("/dashboard");
      router.refresh();
    } catch (error) {
      const message = error instanceof Error ? error.message : "שגיאה לא צפויה בהתחברות";
      setErrorMessage(message);
      logger.error("login threw", { message });
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
          maxWidth: "360px",
          background: "var(--color-surface)",
          border: "1px solid var(--color-border)",
          borderRadius: "12px",
          padding: "1.5rem",
          display: "flex",
          flexDirection: "column",
          gap: "0.75rem",
        }}
      >
        <h1 style={{ fontSize: "1.25rem", margin: 0 }}>התחברות</h1>
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
            autoComplete="current-password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            style={inputStyle}
          />
        </label>

        {errorMessage ? (
          <p style={{ color: "var(--color-danger)", margin: 0, fontSize: "0.875rem" }}>
            {errorMessage}
          </p>
        ) : null}

        <button
          type="submit"
          disabled={isSubmitting}
          style={{
            marginTop: "0.5rem",
            padding: "0.75rem 1.25rem",
            borderRadius: "var(--radius-full)",
            border: "none",
            background: isSubmitting ? "var(--color-secondary)" : "var(--gradient-brand)",
            color: isSubmitting ? "var(--color-text-muted)" : "#fff",
            fontWeight: 700,
            cursor: isSubmitting ? "default" : "pointer",
            boxShadow: isSubmitting ? "none" : "var(--glow-brand)",
            transition: "all var(--duration-base) var(--ease-out)",
          }}
        >
          {isSubmitting ? "מתחבר..." : "התחבר"}
        </button>

        <p style={{ margin: 0, fontSize: "0.8125rem", textAlign: "center" }}>
          אין לך חשבון?{" "}
          <Link href="/register" style={{ color: "var(--color-primary)" }}>
            הירשם
          </Link>
        </p>
      </form>
    </main>
  );
}

const inputStyle: React.CSSProperties = {
  padding: "0.625rem 0.875rem",
  borderRadius: "var(--radius-md)",
  border: "1px solid var(--color-border)",
  background: "var(--color-surface-elevated)",
  color: "var(--color-text-primary)",
};
