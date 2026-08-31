"use client";

import { Sparkle, ChatCircleDots } from "@phosphor-icons/react";
import { useChatAssistant } from "@/components/chat-assistant/chat-assistant-context";
import { GlassCard } from "@/components/ui/GlassCard";

/** כרטיס-כניסה אמיתי לעוזר-החכם בתוך תוכן-הדשבורד — לא רק הכפתור הצף.
 * פותח בדיוק את אותה חלונית-צ'אט אמיתית (chat-assistant-context.tsx), לא
 * הצעה-מדומה: אין כאן "העוזר ממליץ ש..." מומצא, כי אין עדיין יכולת-הצעה-
 * יזומה אמיתית בעוזר (הוא מגיב לפנייה, לא יוזם) — לא בונים UI שמעמיד-פנים
 * שהעוזר "חושב" משהו שהוא לא. */
export function AiAssistantCard() {
  const { openChat } = useChatAssistant();

  return (
    <GlassCard
      variant="primary"
      style={{
        display: "flex",
        flexDirection: "column",
        gap: "0.75rem",
        background: "linear-gradient(160deg, color-mix(in srgb, var(--color-accent-purple) 22%, var(--color-glass)), var(--color-glass))",
        border: "1px solid color-mix(in srgb, var(--color-accent-purple) 35%, var(--color-border))",
      }}
    >
      <div style={{ display: "flex", alignItems: "center", gap: "0.625rem" }}>
        <div
          style={{
            width: "2.5rem",
            height: "2.5rem",
            borderRadius: "50%",
            background: "var(--gradient-brand)",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            color: "#fff",
            flexShrink: 0,
            boxShadow: "var(--glow-brand)",
          }}
        >
          <Sparkle size={20} weight="fill" aria-hidden />
        </div>
        <h2 style={{ font: "var(--text-card-title)", margin: 0 }}>עוזר AI</h2>
      </div>
      <p style={{ margin: 0, font: "var(--text-caption)", color: "var(--color-text-secondary)" }}>
        יש לך שאלה על הטיול, רוצה להוסיף הוצאה בקול, או לסרוק קבלה? העוזר מכיר את כל מה שכבר תיכננת.
      </p>
      <button
        type="button"
        onClick={openChat}
        style={{
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          gap: "0.5rem",
          padding: "0.625rem 1rem",
          borderRadius: "var(--radius-full)",
          border: "none",
          background: "var(--gradient-brand)",
          color: "#fff",
          fontWeight: 700,
          cursor: "pointer",
          boxShadow: "var(--glow-brand)",
          fontSize: "0.875rem",
        }}
      >
        <ChatCircleDots size={18} weight="fill" aria-hidden />
        פתח שיחה
      </button>
    </GlassCard>
  );
}
