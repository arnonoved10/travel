"use client";

import { useEffect, useRef, useState } from "react";
import { askAssistantAction, type AssistantAttachment } from "./ai-actions";
import { COLOR, SPACE, RADIUS, NAV_HEIGHT, AI_BUTTON_SIZE, SparkleIcon, MicIcon, CameraIcon, AttachIcon, SendIcon, CloseIcon } from "./design-system";

/**
 * עוזר ה-AI הגלובלי — רכיב אחד, מותקן פעם אחת ב-layout.tsx, מופיע מעל כל
 * המסכים. ראו ai-actions.ts להסבר המלא על מצב-החיבור (לא מחובר בפועל
 * למודל-שפה; השגיאה המוצגת כאן היא אמיתית, לא מדומה).
 */

const QUICK_ACTIONS = [
  { key: "activity", label: "הוספת פעילות", template: "אני רוצה להוסיף פעילות חדשה: " },
  { key: "expense", label: "הוספת הוצאה", template: "אני רוצה לרשום הוצאה חדשה: " },
  { key: "booking", label: "הוספת הזמנה", template: "אני רוצה להוסיף הזמנה חדשה: " },
  { key: "convert", label: "המרת מטבע", template: "אני רוצה להמיר מטבע: " },
  { key: "route", label: "שינוי מסלול", template: "אני רוצה לשנות את המסלול: " },
  { key: "document", label: "העלאת מסמך", template: "אני רוצה להעלות מסמך: " },
] as const;

type ChatItem = { id: string; role: "user" | "assistant" | "error"; text: string; attachments?: AssistantAttachment[] };

/**
 * תצוגה-מקדימה לפעולה שה-AI מציע (אישור/עריכה/ביטול) — הרכיב קיים ומוכן
 * לפי הדרישה ("לפני כל שינוי בנתונים יש להציג תצוגה מקדימה"), אך אינו
 * מופעל כרגע כי אין תשובת-AI אמיתית שמייצרת PendingAction — ראו ai-actions.ts.
 */
export interface PendingAction {
  summary: string;
  fields: { label: string; value: string }[];
  onConfirm: () => void;
  onEdit: () => void;
  onCancel: () => void;
}

export function PendingActionPreview({ action }: { action: PendingAction }) {
  return (
    <div style={{ background: COLOR.cardElevated, border: `1px solid ${COLOR.primary}55`, borderRadius: `${RADIUS.card}px`, padding: SPACE.lg, display: "flex", flexDirection: "column", gap: SPACE.sm }}>
      <div style={{ fontSize: "13px", fontWeight: 700, color: COLOR.textPrimary }}>{action.summary}</div>
      {action.fields.map((f) => (
        <div key={f.label} style={{ display: "flex", justifyContent: "space-between", fontSize: "12.5px", color: COLOR.textSecondary }}>
          <span>{f.label}</span>
          <span style={{ color: COLOR.textPrimary, fontWeight: 600 }}>{f.value}</span>
        </div>
      ))}
      <div style={{ display: "flex", gap: SPACE.sm, marginTop: SPACE.xs }}>
        <button type="button" onClick={action.onCancel} style={{ flex: 1, minHeight: "40px", borderRadius: "10px", background: "transparent", border: `1px solid ${COLOR.border}`, color: COLOR.textSecondary, fontSize: "12.5px", fontWeight: 700, cursor: "pointer" }}>ביטול</button>
        <button type="button" onClick={action.onEdit} style={{ flex: 1, minHeight: "40px", borderRadius: "10px", background: "transparent", border: `1px solid ${COLOR.border}`, color: COLOR.textPrimary, fontSize: "12.5px", fontWeight: 700, cursor: "pointer" }}>עריכה</button>
        <button type="button" onClick={action.onConfirm} style={{ flex: 1, minHeight: "40px", borderRadius: "10px", background: COLOR.primary, border: "none", color: "#fff", fontSize: "12.5px", fontWeight: 700, cursor: "pointer" }}>אישור</button>
      </div>
    </div>
  );
}

export function AIAssistant() {
  const [open, setOpen] = useState(false);
  const [text, setText] = useState("");
  const [items, setItems] = useState<ChatItem[]>([]);
  const [sending, setSending] = useState(false);
  const [recording, setRecording] = useState(false);
  const [micError, setMicError] = useState<string | null>(null);
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const cameraInputRef = useRef<HTMLInputElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [pendingAttachments, setPendingAttachments] = useState<AssistantAttachment[]>([]);

  useEffect(() => {
    return () => {
      streamRef.current?.getTracks().forEach((t) => t.stop());
    };
  }, []);

  async function handleSend(messageOverride?: string) {
    const message = (messageOverride ?? text).trim();
    if (!message && pendingAttachments.length === 0) return;
    const userItem: ChatItem = { id: crypto.randomUUID(), role: "user", text: message, attachments: pendingAttachments.length ? pendingAttachments : undefined };
    setItems((prev) => [...prev, userItem]);
    setText("");
    const attachmentsToSend = pendingAttachments;
    setPendingAttachments([]);
    setSending(true);
    try {
      const res = await askAssistantAction(message, attachmentsToSend);
      setItems((prev) => [...prev, { id: crypto.randomUUID(), role: res.ok ? "assistant" : "error", text: res.ok ? (res.reply ?? "") : (res.error ?? "שגיאה לא ידועה") }]);
    } catch {
      setItems((prev) => [...prev, { id: crypto.randomUUID(), role: "error", text: "אירעה שגיאה בשליחה לעוזר ה-AI. בדוק חיבור לאינטרנט ונסה שוב." }]);
    } finally {
      setSending(false);
    }
  }

  async function handleMicClick() {
    if (recording) {
      mediaRecorderRef.current?.stop();
      return;
    }
    setMicError(null);
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      streamRef.current = stream;
      const recorder = new MediaRecorder(stream);
      const chunks: BlobPart[] = [];
      recorder.ondataavailable = (e) => chunks.push(e.data);
      recorder.onstop = () => {
        stream.getTracks().forEach((t) => t.stop());
        setRecording(false);
        if (chunks.length > 0) {
          setPendingAttachments((prev) => [...prev, { kind: "audio", name: `הקלטה-קולית-${new Date().toLocaleTimeString("he-IL")}.webm` }]);
        }
      };
      mediaRecorderRef.current = recorder;
      recorder.start();
      setRecording(true);
    } catch {
      setMicError("לא ניתן לגשת למיקרופון — ודא שנתת הרשאה בדפדפן.");
    }
  }

  function handleFileChosen(file: File, kind: "image" | "file") {
    setPendingAttachments((prev) => [...prev, { kind, name: file.name }]);
  }

  return (
    <>
      <button
        type="button"
        onClick={() => setOpen(true)}
        aria-label="עוזר AI"
        style={{
          position: "fixed",
          bottom: `${NAV_HEIGHT + 16}px`,
          insetInlineStart: "max(16px, calc((100vw - 480px) / 2 + 16px))",
          width: `${AI_BUTTON_SIZE}px`,
          height: `${AI_BUTTON_SIZE}px`,
          borderRadius: "50%",
          background: `linear-gradient(135deg, ${COLOR.primary}, ${COLOR.primaryLight})`,
          border: "none",
          display: open ? "none" : "flex",
          alignItems: "center",
          justifyContent: "center",
          cursor: "pointer",
          boxShadow: `0 6px 20px ${COLOR.primary}66`,
          zIndex: 30,
        }}
      >
        <SparkleIcon />
      </button>

      {open ? (
        <div style={{ position: "fixed", inset: 0, zIndex: 50, display: "flex", alignItems: "flex-end", justifyContent: "center" }}>
          <div onClick={() => setOpen(false)} style={{ position: "absolute", inset: 0, background: "rgba(2,13,31,0.7)" }} />
          <div
            style={{
              position: "relative",
              width: "100%",
              maxWidth: "480px",
              maxHeight: "82vh",
              background: COLOR.card,
              borderTopLeftRadius: `${RADIUS.sheet}px`,
              borderTopRightRadius: `${RADIUS.sheet}px`,
              border: `1px solid ${COLOR.border}`,
              borderBottom: "none",
              display: "flex",
              flexDirection: "column",
              direction: "rtl",
            }}
          >
            <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", padding: `${SPACE.lg}px ${SPACE.lg}px ${SPACE.sm}px` }}>
              <div style={{ display: "flex", alignItems: "center", gap: SPACE.sm }}>
                <div style={{ width: "30px", height: "30px", borderRadius: "50%", background: `linear-gradient(135deg, ${COLOR.primary}, ${COLOR.primaryLight})`, display: "flex", alignItems: "center", justifyContent: "center" }}>
                  <SparkleIcon size={16} />
                </div>
                <span style={{ fontSize: "15px", fontWeight: 700, color: COLOR.textPrimary }}>TRIP MASTER AI</span>
              </div>
              <button type="button" onClick={() => setOpen(false)} aria-label="סגירה" style={{ width: "32px", height: "32px", borderRadius: "50%", background: COLOR.cardElevated, border: "none", display: "flex", alignItems: "center", justifyContent: "center", cursor: "pointer" }}>
                <CloseIcon size={14} />
              </button>
            </div>

            <div style={{ display: "flex", gap: SPACE.sm, padding: `0 ${SPACE.lg}px ${SPACE.md}px`, overflowX: "auto" }}>
              {QUICK_ACTIONS.map((qa) => (
                <button
                  key={qa.key}
                  type="button"
                  onClick={() => setText(qa.template)}
                  style={{ flexShrink: 0, padding: "8px 12px", borderRadius: `${RADIUS.pill}px`, background: COLOR.cardElevated, border: `1px solid ${COLOR.border}`, color: COLOR.textSecondary, fontSize: "11.5px", fontWeight: 700, whiteSpace: "nowrap", cursor: "pointer" }}
                >
                  {qa.label}
                </button>
              ))}
            </div>

            <div style={{ flex: 1, overflowY: "auto", padding: `0 ${SPACE.lg}px`, display: "flex", flexDirection: "column", gap: SPACE.sm, minHeight: "120px" }}>
              {items.length === 0 ? (
                <div style={{ fontSize: "12.5px", color: COLOR.textSecondary, textAlign: "center", padding: `${SPACE.xl}px 0` }}>מה אני יכול לעזור לך בטיול?</div>
              ) : (
                items.map((item) => (
                  <div
                    key={item.id}
                    style={{
                      alignSelf: item.role === "user" ? "flex-start" : "flex-end",
                      maxWidth: "85%",
                      background: item.role === "user" ? COLOR.cardElevated : item.role === "error" ? `${COLOR.danger}1A` : `${COLOR.primary}1A`,
                      border: `1px solid ${item.role === "error" ? COLOR.danger + "55" : COLOR.border}`,
                      borderRadius: "14px",
                      padding: "10px 12px",
                      fontSize: "13px",
                      color: item.role === "error" ? COLOR.danger : COLOR.textPrimary,
                    }}
                  >
                    {item.text}
                    {item.attachments?.map((a) => (
                      <div key={a.name} style={{ display: "flex", alignItems: "center", gap: "4px", fontSize: "11px", color: COLOR.textSecondary, marginTop: "4px" }}>
                        <AttachIcon size={12} color={COLOR.textSecondary} />
                        {a.name}
                      </div>
                    ))}
                  </div>
                ))
              )}
              {sending ? <div style={{ alignSelf: "flex-end", fontSize: "12px", color: COLOR.textSecondary }}>העוזר חושב…</div> : null}
              {pendingAttachments.length > 0 ? (
                <div style={{ display: "flex", gap: SPACE.xs, flexWrap: "wrap" }}>
                  {pendingAttachments.map((a, i) => (
                    <span key={i} style={{ fontSize: "11px", color: COLOR.textSecondary, background: COLOR.cardElevated, border: `1px solid ${COLOR.border}`, borderRadius: "8px", padding: "3px 8px" }}>
                      {a.name}
                    </span>
                  ))}
                </div>
              ) : null}
              {micError ? <div style={{ fontSize: "11.5px", color: COLOR.danger }}>{micError}</div> : null}
            </div>

            <div style={{ padding: SPACE.lg, display: "flex", flexDirection: "column", gap: SPACE.sm }}>
              <div style={{ display: "flex", alignItems: "center", gap: SPACE.sm, background: COLOR.cardElevated, border: `1px solid ${COLOR.border}`, borderRadius: `${RADIUS.card}px`, padding: "6px 10px" }}>
                <button type="button" onClick={() => handleSend()} aria-label="שליחה" style={{ width: "36px", height: "36px", borderRadius: "50%", background: COLOR.primary, border: "none", display: "flex", alignItems: "center", justifyContent: "center", cursor: "pointer", flexShrink: 0 }}>
                  <SendIcon />
                </button>
                <input
                  value={text}
                  onChange={(e) => setText(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === "Enter") handleSend();
                  }}
                  placeholder="מה אני יכול לעזור לך?"
                  style={{ flex: 1, background: "transparent", border: "none", outline: "none", color: COLOR.textPrimary, fontSize: "13.5px", minHeight: "36px" }}
                />
                <button type="button" onClick={() => fileInputRef.current?.click()} aria-label="צירוף קובץ" style={{ background: "none", border: "none", cursor: "pointer", display: "flex" }}>
                  <AttachIcon size={19} />
                </button>
                <button type="button" onClick={() => cameraInputRef.current?.click()} aria-label="צילום" style={{ background: "none", border: "none", cursor: "pointer", display: "flex" }}>
                  <CameraIcon size={19} />
                </button>
                <button
                  type="button"
                  onClick={handleMicClick}
                  aria-label="הקלטה קולית"
                  style={{ background: "none", border: "none", cursor: "pointer", display: "flex", position: "relative" }}
                >
                  <MicIcon size={19} color={recording ? COLOR.danger : COLOR.textPrimary} />
                  {recording ? <span style={{ position: "absolute", top: -2, insetInlineEnd: -2, width: "8px", height: "8px", borderRadius: "50%", background: COLOR.danger }} /> : null}
                </button>
              </div>
              {recording ? (
                <div style={{ display: "flex", alignItems: "center", justifyContent: "center", gap: SPACE.sm, fontSize: "12px", color: COLOR.danger, fontWeight: 700 }}>
                  מקליט… הקש שוב על המיקרופון כדי לעצור
                </div>
              ) : null}
              <input ref={cameraInputRef} type="file" accept="image/*" capture="environment" style={{ display: "none" }} onChange={(e) => { const f = e.target.files?.[0]; if (f) handleFileChosen(f, "image"); e.target.value = ""; }} />
              <input ref={fileInputRef} type="file" style={{ display: "none" }} onChange={(e) => { const f = e.target.files?.[0]; if (f) handleFileChosen(f, "file"); e.target.value = ""; }} />
            </div>
          </div>
        </div>
      ) : null}
    </>
  );
}
