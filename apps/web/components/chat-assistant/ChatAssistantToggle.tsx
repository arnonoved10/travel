"use client";

import { Sparkle, X } from "@phosphor-icons/react";
import { ChatAssistantPanel } from "./ChatAssistantPanel";
import { useChatAssistant } from "./chat-assistant-context";

/** סרגל צף מתקפל בקצה ה-inline-start (שמאל ב-RTL) — לא עמודה קבועה שלישית
 * לצד ה-Sidebar, כדי לא לגזול רוחב מכל דף קיים ולא לשבור מובייל (המשתמש אישר
 * את הבחירה הזו במפורש). מגירת-overlay, לא דוחפת את תוכן העמוד.
 *
 * עודכן 2026-08-28 (בקשת משתמש: "אייקון יפה ומודרני"): Sparkle במקום בועת-
 * צ'אט גנרית — השפה החזותית הנפוצה כיום לעוזרי-AI — עם טבעת-זוהר עדינה
 * ופועמת מאחורי הכפתור (ר' .ai-toggle-glow ב-globals.css) שמרמזת "חי"/פעיל
 * בלי אנימציה בולטת מדי. */
export function ChatAssistantToggle({ activeTripId }: { activeTripId: string | null }) {
  const { open, closeChat, toggleChat } = useChatAssistant();

  return (
    <>
      {open ? (
        <div onClick={closeChat} aria-hidden style={{ position: "fixed", inset: 0, zIndex: 59, background: "rgba(0,0,0,0.4)" }} />
      ) : null}
      {open ? <ChatAssistantPanel activeTripId={activeTripId} onClose={closeChat} /> : null}
      <div style={{ position: "fixed", insetInlineStart: "1rem", bottom: "calc(var(--bottom-nav-safe-height) + 0.75rem)", zIndex: 61, width: "3.25rem", height: "3.25rem" }}>
        {!open ? (
          <div
            aria-hidden
            className="ai-toggle-glow"
            style={{
              position: "absolute",
              inset: "-5px",
              borderRadius: "50%",
              background: "var(--gradient-brand)",
              opacity: 0.55,
              filter: "blur(7px)",
              pointerEvents: "none",
            }}
          />
        ) : null}
        <button
          type="button"
          onClick={toggleChat}
          aria-label={open ? "סגור את AI Travel" : "פתח את AI Travel"}
          style={{
            position: "relative",
            width: "100%",
            height: "100%",
            borderRadius: "50%",
            border: "none",
            cursor: "pointer",
            background: "var(--gradient-brand)",
            color: "#fff",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            boxShadow: "var(--glow-brand)",
          }}
        >
          {open ? <X size={22} aria-hidden /> : <Sparkle size={24} weight="fill" aria-hidden />}
        </button>
      </div>
    </>
  );
}
