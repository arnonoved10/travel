"use client";

import { useEffect, useRef, useState } from "react";

interface SpeechRecognitionResultLike {
  isFinal: boolean;
  0: { transcript: string };
}
interface SpeechRecognitionEventLike {
  resultIndex: number;
  results: ArrayLike<SpeechRecognitionResultLike>;
}
interface SpeechRecognitionLike extends EventTarget {
  lang: string;
  continuous: boolean;
  interimResults: boolean;
  start(): void;
  stop(): void;
  onresult: ((event: SpeechRecognitionEventLike) => void) | null;
  onerror: (() => void) | null;
  onend: (() => void) | null;
}
type SpeechRecognitionConstructor = new () => SpeechRecognitionLike;

/** Web Speech API בצד-לקוח בלבד — אין תקדים/תלות-npm לזה בפרויקט (נבדק
 * לעומק לפני התכנון), ואין שרת-תמלול חיצוני. Chrome/Edge תומכים, Firefox/Safari
 * חלקית-או-לא — לכן `supported` נבדק ב-effect (לא ב-render, כדי לא לפוצץ ב-SSR)
 * וה-UI מסתיר את כפתור המיקרופון כשלא נתמך, במקום להציג כפתור שלא עובד. */
export function useVoiceInput(onTranscript: (text: string) => void) {
  const [supported, setSupported] = useState(false);
  const [listening, setListening] = useState(false);
  const recognitionRef = useRef<SpeechRecognitionLike | null>(null);

  useEffect(() => {
    const Ctor = (window as unknown as { SpeechRecognition?: SpeechRecognitionConstructor; webkitSpeechRecognition?: SpeechRecognitionConstructor })
      .SpeechRecognition ?? (window as unknown as { webkitSpeechRecognition?: SpeechRecognitionConstructor }).webkitSpeechRecognition;
    // queueMicrotask: השדה תלוי ב-window (לא קיים ב-SSR) אז לא ניתן לגזור אותו
    // ב-render כמו ערך רגיל — אבל setState סינכרוני-ישיר בגוף ה-effect מייצר
    // אזהרת-lint (cascading renders); דחייה למיקרו-טאסק מספיקה כדי לצאת מהעדכון
    // הסינכרוני של ה-effect עצמו, בלי לעכב את המשתמש בפועל (זה מריץ כמעט מיד).
    queueMicrotask(() => setSupported(Boolean(Ctor)));
  }, []);

  function toggleListening(): void {
    if (listening) {
      recognitionRef.current?.stop();
      setListening(false);
      return;
    }

    const Ctor = (window as unknown as { SpeechRecognition?: SpeechRecognitionConstructor; webkitSpeechRecognition?: SpeechRecognitionConstructor })
      .SpeechRecognition ?? (window as unknown as { webkitSpeechRecognition?: SpeechRecognitionConstructor }).webkitSpeechRecognition;
    if (!Ctor) return;

    const recognition = new Ctor();
    recognition.lang = "he-IL";
    recognition.continuous = false;
    recognition.interimResults = false;
    recognition.onresult = (event) => {
      const transcript = Array.from({ length: event.results.length }, (_, i) => event.results[i]?.[0]?.transcript ?? "").join(" ");
      if (transcript.trim()) onTranscript(transcript.trim());
    };
    recognition.onerror = () => setListening(false);
    recognition.onend = () => setListening(false);
    recognitionRef.current = recognition;
    recognition.start();
    setListening(true);
  }

  return { supported, listening, toggleListening };
}
