import type { ReactNode } from "react";

// שכפול-במכוון, לא שימוש-חוזר ב-LegalPageLayout (app/legal/) — שני העמודים
// חיים מחוץ ל-(app)/ באותה סיבה (בלי auth) אבל אין קשר תוכני ביניהם, ולינק
// "חזרה להתחברות" לא רלוונטי כאן (הצופה הציבורי לא בהכרח בעל חשבון).
export function SharedPageLayout({ title, subtitle, children }: { title: string; subtitle?: string; children: ReactNode }) {
  return (
    <main
      style={{
        minHeight: "100dvh",
        display: "flex",
        justifyContent: "center",
        padding: "2rem 1.5rem",
        background: "var(--color-bg)",
        color: "var(--color-text)",
      }}
    >
      <div style={{ width: "100%", maxWidth: "680px" }}>
        <p style={{ color: "var(--color-text-muted)", fontSize: "0.75rem", margin: 0 }}>מסלול טיול משותף — תצוגה בלבד</p>
        <h1 style={{ marginTop: "0.25rem", marginBottom: subtitle ? "0.25rem" : "1.5rem" }}>{title}</h1>
        {subtitle ? <p style={{ color: "var(--color-text-muted)", fontSize: "0.875rem", marginTop: 0, marginBottom: "1.5rem" }}>{subtitle}</p> : null}

        <div style={{ display: "flex", flexDirection: "column", gap: "1.5rem" }}>{children}</div>
      </div>
    </main>
  );
}
