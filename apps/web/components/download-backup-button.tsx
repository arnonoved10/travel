"use client";

export function DownloadBackupButton({ json, fileName }: { json: string; fileName: string }) {
  function handleDownload() {
    const blob = new Blob([json], { type: "application/json;charset=utf-8" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = fileName;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  }

  return (
    <button
      type="button"
      onClick={handleDownload}
      style={{
        padding: "0.5rem 0.875rem",
        borderRadius: "var(--radius-full)",
        border: "1px solid var(--color-border)",
        background: "var(--color-surface)",
        color: "var(--color-text-primary)",
        cursor: "pointer",
        fontSize: "0.8125rem",
        fontWeight: 600,
      }}
    >
      ⬇️ הורד גיבוי (JSON)
    </button>
  );
}
