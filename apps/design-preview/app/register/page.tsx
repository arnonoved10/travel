"use client";

import { useState } from "react";
import type { FormEvent } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { createSupabaseBrowserClient } from "@/lib/supabase/client";
import { AppLogo, COLOR, FONT, SPACE, RADIUS, Card, Field, PrimaryButton, ScreenShell } from "../design-system";
import { PasswordField, authInputStyle } from "../auth-fields";

export default function RegisterScreen() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setErrorMessage(null);
    setSuccessMessage(null);

    if (password !== confirmPassword) {
      setErrorMessage("הסיסמאות אינן זהות.");
      return;
    }

    setIsSubmitting(true);
    try {
      const supabase = createSupabaseBrowserClient();
      const { data, error } = await supabase.auth.signUp({
        email,
        password,
        options: {
          // בלי זה קישור האימות במייל מפנה ל-Site URL הגלובלי שמוגדר בדשבורד
          // Supabase, שעלול להצביע על סביבה אחרת. הכתובת חייבת להופיע גם
          // ברשימת ה-Redirect URLs המורשית שם, אחרת האימות עצמו נדחה.
          emailRedirectTo: `${window.location.origin}/login`,
        },
      });

      if (error) {
        if (error.message === "User already registered") {
          setErrorMessage("כתובת המייל הזו כבר רשומה. אפשר להתחבר איתה.");
        } else if (error.message.includes("Password should be at least")) {
          setErrorMessage("הסיסמה קצרה מדי — נדרשים לפחות 6 תווים.");
        } else {
          setErrorMessage(error.message);
        }
        return;
      }

      // כשאישור-האימייל מכובה ב-Supabase, ההרשמה מחזירה session מיד
      // ואפשר להכניס את המשתמש ישר לאפליקציה בלי שום מסך ביניים.
      if (data.session) {
        router.push("/");
        router.refresh();
        return;
      }

      // אין session — סימן שדרישת אישור-האימייל עדיין דלוקה בפרויקט.
      // לא מעמידים פנים שנכנסנו; אומרים מה באמת צריך לקרות.
      setSuccessMessage("נרשמתם בהצלחה! שלחנו לכם מייל אימות — יש ללחוץ על הקישור שבו לפני ההתחברות.");
      setPassword("");
      setConfirmPassword("");
    } catch (error) {
      setErrorMessage(error instanceof Error ? error.message : "שגיאה לא צפויה בהרשמה");
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <ScreenShell noBottomPad>
      <div style={{ minHeight: "80vh", display: "flex", flexDirection: "column", justifyContent: "center", borderRadius: RADIUS.card }}>
        <form onSubmit={handleSubmit} style={{ display: "flex", flexDirection: "column", gap: SPACE.lg }}>
          <div style={{ display: "flex", justifyContent: "center" }}>
            <AppLogo size={40} />
          </div>

          <div style={{ textAlign: "center", display: "flex", flexDirection: "column", gap: SPACE.xs }}>
            <h1 style={{ ...FONT.h1, margin: 0 }}>יצירת חשבון</h1>
            <p style={{ ...FONT.body, color: COLOR.textSecondary, margin: 0 }}>כמה פרטים ואפשר להתחיל לתכנן</p>
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
                style={authInputStyle}
              />
            </Field>

            <PasswordField label="סיסמה (6 תווים לפחות)" value={password} onChange={setPassword} autoComplete="new-password" minLength={6} />

            <PasswordField label="אימות סיסמה" value={confirmPassword} onChange={setConfirmPassword} autoComplete="new-password" minLength={6} />

            {errorMessage ? (
              <p role="alert" style={{ ...FONT.small, color: COLOR.danger, margin: 0 }}>
                {errorMessage}
              </p>
            ) : null}
            {successMessage ? (
              <p role="status" style={{ ...FONT.small, color: COLOR.success, margin: 0 }}>
                {successMessage}
              </p>
            ) : null}

            <PrimaryButton type="submit" disabled={isSubmitting}>
              {isSubmitting ? "נרשם..." : "הרשמה"}
            </PrimaryButton>
          </Card>

          <p style={{ ...FONT.body, color: COLOR.textSecondary, textAlign: "center", margin: 0 }}>
            כבר יש לכם חשבון?{" "}
            <Link href="/login" style={{ color: COLOR.primaryLight, fontWeight: 700 }}>
              התחברות
            </Link>
          </p>
        </form>
      </div>
    </ScreenShell>
  );
}
