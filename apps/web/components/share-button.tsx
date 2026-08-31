"use client";

import { useToast } from "@/components/toast-provider";

// navigator.share הוא Web API של הדפדפן בלבד — אין תלות בשרת/שירות חיצוני.
// ברוב דפדפני שולחן אין תמיכה (בעיקר במובייל) — אז fallback אמיתי להעתקה
// ללוח, לא הסתרת הכפתור, כדי שהפיצ'ר יעבוד תמיד במקום להיעלם בשקט.
export function ShareButton({ title, text, label = "שתף" }: { title: string; text: string; label?: string }) {
  const { pushToast } = useToast();

  const handleClick = async () => {
    const canUseNativeShare = typeof navigator !== "undefined" && typeof navigator.share === "function";

    if (canUseNativeShare) {
      try {
        await navigator.share({ title, text });
      } catch {
        // המשתמש ביטל את גיליון השיתוף, או שהשיתוף נכשל — לא עוברים ל-fallback
        // כפול (זה לא מקרה של "אין תמיכה"), פשוט לא קורה כלום.
      }
      return;
    }

    try {
      await navigator.clipboard.writeText(text);
      pushToast("הטקסט הועתק ללוח.");
    } catch {
      pushToast("שיתוף אינו נתמך בדפדפן הזה.");
    }
  };

  return (
    <button
      type="button"
      onClick={handleClick}
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
      📤 {label}
    </button>
  );
}
