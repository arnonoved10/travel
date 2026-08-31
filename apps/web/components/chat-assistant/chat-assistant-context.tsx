"use client";

import { createContext, useContext, useState, type ReactNode } from "react";

interface ChatAssistantContextValue {
  open: boolean;
  openChat: () => void;
  closeChat: () => void;
  toggleChat: () => void;
}

const ChatAssistantContext = createContext<ChatAssistantContextValue | null>(null);

/** מצב-פתוח/סגור משותף לחלונית-הצ'אט — כדי שגם הכפתור הצף (ChatAssistantToggle)
 * וגם כרטיס בתוך הדשבורד (dashboard/ai-assistant-card.tsx) יוכלו לפתוח את
 * אותה חלונית-אמיתית-אחת, לא שני מנגנונים נפרדים. */
export function ChatAssistantProvider({ children }: { children: ReactNode }) {
  const [open, setOpen] = useState(false);
  return (
    <ChatAssistantContext.Provider value={{ open, openChat: () => setOpen(true), closeChat: () => setOpen(false), toggleChat: () => setOpen((o) => !o) }}>
      {children}
    </ChatAssistantContext.Provider>
  );
}

export function useChatAssistant(): ChatAssistantContextValue {
  const ctx = useContext(ChatAssistantContext);
  if (!ctx) throw new Error("useChatAssistant must be used within a ChatAssistantProvider");
  return ctx;
}
