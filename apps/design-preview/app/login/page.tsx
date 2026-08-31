"use client";

import { useState } from "react";
import type { FormEvent } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { createSupabaseBrowserClient } from "@/lib/supabase/client";
import { COLOR, FONT, SPACE, RADIUS, Card, Field, inputStyle, PrimaryButton, ScreenShell } from "../design-system";

function LoginForm() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setErrorMessage(null);
    setIsSubmitting(true);

    try {
      const supabase = createSupabaseBrowserClient();
      const { error } = await supabase.auth.signInWithPassword({ email, password });

      if (error) {
        // Supabase מחזיר אנגלית; שתי השגיאות השכיחות מתורגמות כדי שהמסך
        // יישאר עברי לגמרי. השאר עובר כמו שהוא ולא נבלע.
        if (error.message === "Invalid login credentials") {
          setErrorMessage("אימייל או סיסמה שגויים.");
        } else if (error.message === "Email not confirmed") {
          setErrorMessage("החשבון עדיין לא אומת. בדקו את תיבת הדואר ולחצו על קישור האימות.");
        } else {
          setErrorMessage(error.message);
        }
        return;
      }

      // next נשמר ע"י ה-proxy כשהוא חסם ניסיון כניסה למסך מוגן. נקרא
      // מ-window ולא ב-useSearchParams במכוון: ה-hook הזה מכריח את כל
      // הטופס לרינדור בצד-לקוח, והמסך היה מגיע ריק מהשרת עד שה-JS נטען.
      const next = new URLSearchParams(window.location.search).get("next");
      router.push(next && next.startsWith("/") ? next : "/");
      router.refresh();
    } catch (error) {
      setErrorMessage(error instanceof Error ? error.message : "שגיאה לא צפויה בהתחברות");
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <form onSubmit={handleSubmit} style={{ display: "flex", flexDirection: "column", gap: SPACE.lg }}>
      <div style={{ textAlign: "center", display: "flex", flexDirection: "column", gap: SPACE.xs }}>
        <h1 style={{ ...FONT.h1, margin: 0 }}>ברוכים השבים</h1>
        <p style={{ ...FONT.body, color: COLOR.textSecondary, margin: 0 }}>התחברו כדי להמשיך לניהול הטיולים</p>
      </div>

      <Card style={{ display: "flex", flexDirection: "column", gap: SPACE.md }}>
        <Field label="אימייל">
          <input
            type="email"
            required
            autoComplete="email"
            dir="ltr"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            style={{ ...inputStyle, textAlign: "left" }}
          />
        </Field>

        <Field label="סיסמה">
          <input
            type="password"
            required
            autoComplete="current-password"
            dir="ltr"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            style={{ ...inputStyle, textAlign: "left" }}
          />
        </Field>

        {errorMessage ? (
          <p role="alert" style={{ ...FONT.small, color: COLOR.danger, margin: 0 }}>
            {errorMessage}
          </p>
        ) : null}

        <PrimaryButton type="submit" disabled={isSubmitting}>
          {isSubmitting ? "מתחבר..." : "התחברות"}
        </PrimaryButton>
      </Card>

      <p style={{ ...FONT.body, color: COLOR.textSecondary, textAlign: "center", margin: 0 }}>
        אין לכם חשבון?{" "}
        <Link href="/register" style={{ color: COLOR.primaryLight, fontWeight: 700 }}>
          הרשמה
        </Link>
      </p>
    </form>
  );
}

export default function LoginScreen() {
  return (
    <ScreenShell noBottomPad>
      <div style={{ minHeight: "80vh", display: "flex", flexDirection: "column", justifyContent: "center", borderRadius: RADIUS.card }}>
        <LoginForm />
      </div>
    </ScreenShell>
  );
}
