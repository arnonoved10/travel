// קישור wa.me פשוט — לא API בתשלום, לא דורש מפתח/הרשמה. עובד גם בדפדפני
// שולחן שבהם navigator.share (ר' share-button.tsx) לא נתמך בכלל.
export function WhatsAppShareLink({ text, label = "שתף בוואטסאפ" }: { text: string; label?: string }) {
  const href = `https://wa.me/?text=${encodeURIComponent(text)}`;
  return (
    <a
      href={href}
      target="_blank"
      rel="noopener noreferrer"
      style={{
        display: "inline-block",
        padding: "0.5rem 0.875rem",
        borderRadius: "var(--radius-full)",
        border: "1px solid var(--color-border)",
        background: "var(--color-surface)",
        color: "var(--color-text-primary)",
        textDecoration: "none",
        fontSize: "0.8125rem",
        fontWeight: 600,
      }}
    >
      💬 {label}
    </a>
  );
}
