import Link from "next/link";
import type { ReactNode } from "react";

export function LegalPageLayout({
  title,
  updatedAt,
  children,
}: {
  title: string;
  updatedAt: string;
  children: ReactNode;
}) {
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
        <Link href="/login" style={{ color: "var(--color-primary)", fontSize: "0.875rem" }}>
          ← חזרה להתחברות
        </Link>

        <h1 style={{ marginTop: "1rem", marginBottom: "0.25rem" }}>{title}</h1>
        <p style={{ color: "var(--color-text-muted)", fontSize: "0.8125rem", marginTop: 0 }}>
          עודכן לאחרונה: {updatedAt}
        </p>

        <div
          style={{
            marginTop: "0.5rem",
            padding: "0.75rem 1rem",
            borderRadius: "var(--radius-md)",
            border: "1px solid var(--color-border)",
            background: "var(--color-surface)",
            fontSize: "0.8125rem",
            color: "var(--color-text-muted)",
          }}
        >
          מסמך זה הוא טיוטה סבירה למוצר אישי בשלב פיתוח — הוא <strong>לא</strong> נוסח או נבדק על ידי עורך דין,
          ואינו ייעוץ משפטי. אם המערכת תשמש בעתיד משתמשים נוספים באופן מסחרי, יש להחליף אותו בנוסח שנבדק משפטית.
        </div>

        <div style={{ marginTop: "1.5rem", display: "flex", flexDirection: "column", gap: "1rem", lineHeight: 1.7, fontSize: "0.9375rem" }}>
          {children}
        </div>
      </div>
    </main>
  );
}

export function LegalSection({ title, children }: { title: string; children: ReactNode }) {
  return (
    <section>
      <h2 style={{ fontSize: "1.0625rem", marginBottom: "0.375rem" }}>{title}</h2>
      <div style={{ color: "var(--color-text-muted)", display: "flex", flexDirection: "column", gap: "0.5rem" }}>{children}</div>
    </section>
  );
}
