"use client";

import { useEffect, useRef, useState, useTransition } from "react";
import { PaperPlaneTilt, X, Paperclip, Microphone, Sparkle, Camera } from "@phosphor-icons/react";
import { sendChatMessageAction, sendChatImageAction } from "@/app/(app)/assistant/actions";
import { useGeolocation } from "@/lib/use-geolocation";
import { ActionReceiptCard } from "./ActionReceiptCard";
import { useVoiceInput } from "./useVoiceInput";
import type { ChatMessage } from "./types";

const HISTORY_LIMIT = 20;

/** קורא File כ-base64 גולמי (בלי התחילית "data:...;base64,") — בדיוק הפורמט
 * ש-getOcrProvider().extractFields מצפה לו (lib/ocr/types.ts). */
function readFileAsBase64(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => {
      const result = reader.result as string;
      const base64 = result.slice(result.indexOf(",") + 1);
      resolve(base64);
    };
    reader.onerror = () => reject(reader.error);
    reader.readAsDataURL(file);
  });
}

export function ChatAssistantPanel({ activeTripId, onClose }: { activeTripId: string | null; onClose: () => void }) {
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [input, setInput] = useState("");
  const [isPending, startTransition] = useTransition();
  const [workingTripId, setWorkingTripId] = useState(activeTripId);
  // לא חוסם ואין UI ייעודי למצב-הרשאה כאן: אם ההרשאה כבר אושרה בעבר זה
  // ממלא location בשקט (useGeolocation מפעיל אוטומטית רק אז); אם עדיין לא
  // הוחלט/נדחתה, נשארים ב-"idle"/"denied" בלי לבקש הרשאה בכלל — לא "שורפים"
  // את בקשת-ההרשאה החד-פעמית על פתיחת צ'אט. ה-system-prompt (Trip Master)
  // פשוט אומר לעוזר שאין מיקום זמין.
  const [geo] = useGeolocation();
  const location = geo.kind === "ready" ? { lat: geo.lat, lng: geo.lng } : null;
  const nextId = useRef(0);
  const listRef = useRef<HTMLDivElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const cameraInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    listRef.current?.scrollTo({ top: listRef.current.scrollHeight, behavior: "smooth" });
  }, [messages]);

  const { supported: voiceSupported, listening, toggleListening } = useVoiceInput((transcript) => {
    setInput((current) => (current ? `${current} ${transcript}` : transcript));
  });

  function appendAssistantResult(result: Awaited<ReturnType<typeof sendChatMessageAction>>): void {
    if (result.newTripId) setWorkingTripId(result.newTripId);
    setMessages((current) => [
      ...current,
      {
        id: nextId.current++,
        role: "assistant",
        text: result.ok ? result.reply || "בוצע." : (result.error ?? "משהו השתבש."),
        executedActions: result.executedActions,
        error: result.ok ? undefined : result.error,
      },
    ]);
  }

  function handleSend(): void {
    const text = input.trim();
    if (!text || isPending) return;

    const userMessage: ChatMessage = { id: nextId.current++, role: "user", text };
    const historyForApi = messages.slice(-HISTORY_LIMIT).map((m) => ({ role: m.role, text: m.text }));
    setMessages((current) => [...current, userMessage]);
    setInput("");

    startTransition(async () => {
      const result = await sendChatMessageAction(workingTripId, historyForApi, text, location);
      appendAssistantResult(result);
    });
  }

  function handleAttachClick(): void {
    fileInputRef.current?.click();
  }

  // כפתור-מצלמה נפרד מ-"צרף קבלה" (לא capture על אותו input) — כדי לא לאבד
  // את האפשרות לבחור תמונה קיימת מהגלריה; capture="environment" מכריח קפיצה
  // ישירה למצלמה האחורית רק על ה-input הייעודי הזה. אותו handleFileChange
  // בדיוק, קורא מ-e.target.files בלי תלות באיזה input הפעיל אותו.
  function handleCameraClick(): void {
    cameraInputRef.current?.click();
  }

  async function handleFileChange(e: React.ChangeEvent<HTMLInputElement>): Promise<void> {
    const file = e.target.files?.[0];
    e.target.value = "";
    if (!file || isPending) return;

    const base64 = await readFileAsBase64(file);
    const userMessage: ChatMessage = { id: nextId.current++, role: "user", text: `📎 ${file.name}` };
    const historyForApi = messages.slice(-HISTORY_LIMIT).map((m) => ({ role: m.role, text: m.text }));
    setMessages((current) => [...current, userMessage]);

    startTransition(async () => {
      const result = await sendChatImageAction(workingTripId, historyForApi, base64, file.type, location);
      appendAssistantResult(result);
    });
  }

  return (
    <div
      style={{
        position: "fixed",
        insetInlineStart: 0,
        top: 0,
        bottom: 0,
        width: "min(24rem, 100vw)",
        zIndex: 60,
        display: "flex",
        flexDirection: "column",
        background: "var(--color-bg-elevated)",
        borderInlineEnd: "1px solid var(--color-border)",
        boxShadow: "0 0 40px rgba(0,0,0,0.5)",
        animation: "lift-in var(--duration-base) var(--ease-out)",
      }}
    >
      <div
        style={{
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          padding: "var(--space-4)",
          borderBottom: "1px solid var(--color-border)",
        }}
      >
        <div style={{ display: "flex", alignItems: "center", gap: "0.5rem" }}>
          <div
            aria-hidden
            style={{
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              width: "1.75rem",
              height: "1.75rem",
              borderRadius: "50%",
              flexShrink: 0,
              background: "var(--gradient-brand)",
              color: "#fff",
            }}
          >
            <Sparkle size={14} weight="fill" aria-hidden />
          </div>
          <div>
            <div style={{ font: "var(--text-card-title)" }}>AI Travel</div>
            <div style={{ font: "var(--text-caption)", color: "var(--color-text-muted)" }}>
              {workingTripId ? "תכתוב מה קרה בטיול — אני ארשום את זה" : "אפשר לבקש ממני לפתוח טיול חדש, או לפתוח טיול קיים כדי שאוכל לרשום פעולות"}
            </div>
          </div>
        </div>
        <button
          type="button"
          onClick={onClose}
          aria-label="סגור את AI Travel"
          style={{ display: "flex", padding: "0.375rem", borderRadius: "50%", border: "none", background: "transparent", color: "var(--color-text-muted)", cursor: "pointer" }}
        >
          <X size={18} aria-hidden />
        </button>
      </div>

      <div ref={listRef} style={{ flex: 1, overflowY: "auto", display: "flex", flexDirection: "column", gap: "0.75rem", padding: "var(--space-4)" }}>
        {messages.length === 0 ? (
          <>
            <p style={{ color: "var(--color-text-muted)", font: "var(--text-caption)" }}>
              למשל: &quot;שילמתי 120 שקל על ארוחת צהריים&quot;, &quot;מה יש לראות קרוב אליי&quot;, &quot;תפתח לי טיול חדש לאיטליה מ-10.10 עד 20.10&quot;, או תצרף תמונה של קבלה.
            </p>
            <button
              type="button"
              onClick={() => setInput("תציע לי כמה יעדים לטיול הבא שלי")}
              style={{
                alignSelf: "flex-start",
                padding: "0.375rem 0.75rem",
                borderRadius: "var(--radius-full)",
                border: "1px solid color-mix(in srgb, var(--color-primary) 30%, transparent)",
                background: "color-mix(in srgb, var(--color-primary) 14%, transparent)",
                color: "var(--color-primary)",
                fontSize: "0.8125rem",
                fontWeight: 600,
                cursor: "pointer",
              }}
            >
              ✨ הצע לי יעד לטיול הבא
            </button>
          </>
        ) : null}
        {messages.map((m) => (
          <div key={m.id} style={{ display: "flex", flexDirection: "column", gap: "0.375rem", alignItems: m.role === "user" ? "flex-end" : "flex-start" }}>
            <div
              style={{
                maxWidth: "88%",
                padding: "0.5rem 0.75rem",
                borderRadius: "var(--radius-md)",
                fontSize: "0.875rem",
                whiteSpace: "pre-wrap",
                background: m.role === "user" ? "var(--gradient-brand)" : "var(--color-surface)",
                color: m.role === "user" ? "#fff" : "var(--color-text-primary)",
              }}
            >
              {m.text}
            </div>
            {m.executedActions?.map((action, i) => (
              <div key={i} style={{ width: "100%" }}>
                <ActionReceiptCard action={action} />
              </div>
            ))}
          </div>
        ))}
        {isPending ? <div style={{ font: "var(--text-caption)", color: "var(--color-text-muted)" }}>חושב…</div> : null}
      </div>

      <div style={{ display: "flex", gap: "0.5rem", padding: "var(--space-4)", borderTop: "1px solid var(--color-border)" }}>
        <input ref={fileInputRef} type="file" accept="image/*" style={{ display: "none" }} onChange={handleFileChange} />
        <input ref={cameraInputRef} type="file" accept="image/*" capture="environment" style={{ display: "none" }} onChange={handleFileChange} />
        <button
          type="button"
          onClick={handleAttachClick}
          disabled={isPending}
          aria-label="צרף קבלה מהגלריה"
          title="צרף קבלה מהגלריה"
          style={{
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            width: "2.75rem",
            height: "2.75rem",
            flexShrink: 0,
            borderRadius: "50%",
            border: "1px solid var(--color-border)",
            background: "var(--color-surface)",
            color: "var(--color-text-secondary)",
            cursor: isPending ? "default" : "pointer",
          }}
        >
          <Paperclip size={18} aria-hidden />
        </button>
        <button
          type="button"
          onClick={handleCameraClick}
          disabled={isPending}
          aria-label="צלם קבלה"
          title="צלם קבלה"
          style={{
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            width: "2.75rem",
            height: "2.75rem",
            flexShrink: 0,
            borderRadius: "50%",
            border: "1px solid var(--color-border)",
            background: "var(--color-surface)",
            color: "var(--color-text-secondary)",
            cursor: isPending ? "default" : "pointer",
          }}
        >
          <Camera size={18} aria-hidden />
        </button>
        {voiceSupported ? (
          <button
            type="button"
            onClick={toggleListening}
            disabled={isPending}
            aria-label={listening ? "עצור הקלטה" : "הקלט הודעה קולית"}
            title={listening ? "עצור הקלטה" : "הקלט הודעה קולית"}
            style={{
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              width: "2.75rem",
              height: "2.75rem",
              flexShrink: 0,
              borderRadius: "50%",
              border: "1px solid var(--color-border)",
              background: listening ? "var(--color-danger)" : "var(--color-surface)",
              color: listening ? "#fff" : "var(--color-text-secondary)",
              cursor: isPending ? "default" : "pointer",
            }}
          >
            <Microphone size={18} weight={listening ? "fill" : "regular"} aria-hidden />
          </button>
        ) : null}
        <input
          type="text"
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === "Enter" && !e.shiftKey) {
              e.preventDefault();
              handleSend();
            }
          }}
          placeholder="כתוב או הקלט הודעה…"
          disabled={isPending}
          style={{
            flex: 1,
            minWidth: 0,
            padding: "0.625rem 0.875rem",
            borderRadius: "var(--radius-full)",
            border: "1px solid var(--color-border)",
            background: "var(--color-surface-elevated)",
            color: "var(--color-text-primary)",
            fontSize: "0.875rem",
          }}
        />
        <button
          type="button"
          onClick={handleSend}
          disabled={isPending || !input.trim()}
          aria-label="שלח"
          style={{
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            width: "2.75rem",
            height: "2.75rem",
            flexShrink: 0,
            borderRadius: "50%",
            border: "none",
            background: "var(--gradient-brand)",
            color: "#fff",
            cursor: isPending || !input.trim() ? "default" : "pointer",
            opacity: isPending || !input.trim() ? 0.6 : 1,
          }}
        >
          <PaperPlaneTilt size={18} weight="fill" aria-hidden />
        </button>
      </div>
    </div>
  );
}
