"use client";

import { useState } from "react";
import type { XlsxSheetData } from "@/lib/xlsx-export";

export function ExportXlsxButton({ sheets, fileName, label }: { sheets: XlsxSheetData[]; fileName: string; label: string }) {
  const [isPending, setIsPending] = useState(false);

  async function handleExport() {
    setIsPending(true);
    try {
      // import() דינמי — ר' ההערה המקבילה ב-export-pdf-button.tsx (exceljs כבד).
      const { buildXlsxWorkbook } = await import("@/lib/xlsx-export");
      const bytes = await buildXlsxWorkbook(sheets);
      // exceljs מחזיר Uint8Array<ArrayBufferLike> — ה-DOM lib של TS דורש Uint8Array<ArrayBuffer>
      // ספציפית ל-BlobPart (לא SharedArrayBuffer, שלעולם לא רלוונטי כאן בפועל).
      const blob = new Blob([bytes as BlobPart], { type: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet" });
      const url = URL.createObjectURL(blob);
      const link = document.createElement("a");
      link.href = url;
      link.download = fileName;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(url);
    } finally {
      setIsPending(false);
    }
  }

  return (
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
  );
}
