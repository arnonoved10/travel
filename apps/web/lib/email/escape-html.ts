const HTML_ESCAPES: Record<string, string> = { "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" };

/** מונע HTML injection כשמזריקים קלט-משתמש (שם-טיול, הודעה אישית) לתוך תבנית-HTML של אימייל. */
export function escapeHtml(value: string): string {
  return value.replace(/[&<>"']/g, (c) => HTML_ESCAPES[c]!);
}
