"use client";

import { useState } from "react";
import type { XlsxSheetData } from "@/lib/xlsx-export";

export function ExportPdfButton({ sheets, title, fileName, label }: { sheets: XlsxSheetData[]; title: string; fileName: string; label: string }) {
  const [isPending, setIsPending] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleExport() {
    setIsPending(true);
    setError(null);
    try {
      // import() דינמי, לא import סטטי: jspdf+jspdf-autotable הם ספריות כבדות
      // שנדרשות רק בלחיצה בפועל — import סטטי היה מנפח את ה-JS הראשוני של כל
      // טעינת דף הטיול (הכפתור הזה מוצג שם תמיד), אותו דפוס שכבר קיים למפות.
      const { buildPdfDocument } = await import("@/lib/pdf-export");
      const bytes = await buildPdfDocument(sheets, title);
      const blob = new Blob([bytes as BlobPart], { type: "application/pdf" });
      const url = URL.createObjectURL(blob);
      const link = document.createElement("a");
      link.href = url;
      link.download = fileName;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(url);
    } catch {
      setError("יצירת ה-PDF נכשלה.");
    } finally {
      setIsPending(false);
    }
  }

  return (
    <span style={{ display: "inline-flex", alignItems: "center", gap: "0.375rem" }}>
      <button
        type="button"
        onClick={handleExport}
        disabled={isPending}
        className="no-print"
        style={{
          padding: "0.5rem 0.875rem",
          borderRadius: "var(--radius-full)",
          border: "1px solid var(--color-border)",
          background: "var(--color-surface)",
          color: "var(--color-text-primary)",
          cursor: isPending ? "default" : "pointer",
          fontSize: "0.8125rem",
          fontWeight: 600,
          opacity: isPending ? 0.7 : 1,
        }}
      >
        {isPending ? "בונה קובץ…" : label}
      </button>
      {error ? <span style={{ color: "var(--color-danger)", fontSize: "0.75rem" }}>{error}</span> : null}
    </span>
  );
}
