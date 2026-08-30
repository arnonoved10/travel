"use server";

/**
 * שכבת-החיבור לעוזר ה-AI — קיימת ואמיתית בפרמטרים/טיפוסים שלה, אבל אינה
 * מחוברת לשום מודל-שפה בפועל (אין ANTHROPIC_API_KEY או שירות-AI מוגדר
 * בפרויקט המבודד הזה). לפי דרישה מפורשת: "אם אין חיבור פעיל למודל AI, אל
 * תציג את העוזר כאילו הוא עובד" — הפונקציה הזו תמיד מחזירה שגיאה כנה
 * וברורה, לא תשובה מומצאת. ה-UI (ai-assistant.tsx) מציג את השגיאה הזו
 * במפורש למשתמש בכל שליחה.
 *
 * מה חסר כדי להפעיל בפועל: endpoint אמיתי מול מודל-שפה (למשל Claude
 * Messages API) עם tool-calling schema שממפה כל אחת מ-6 היכולות המבוקשות
 * (פעילות/הוצאה/הזמנה/המרת-מטבע/שינוי-מסלול/העלאת-מסמך) לפעולה מובנית
 * שמוצגת כתצוגה-מקדימה למשתמש (ראו PendingAction ב-ai-assistant.tsx) לפני
 * שמירה — אותה שכבת preview/confirm/edit/cancel כבר קיימת ומוכנה בצד ה-UI.
 */

export interface AssistantAttachment {
  kind: "image" | "audio" | "file";
  name: string;
}

export interface AssistantResponse {
  ok: boolean;
  reply?: string;
  error?: string;
}

export async function askAssistantAction(_message: string, _attachments: AssistantAttachment[]): Promise<AssistantResponse> {
  return {
    ok: false,
    error: "עוזר ה-AI אינו מחובר כרגע למודל שפה אמיתי. הממשק, ההרשאות (מצלמה/מיקרופון), צירוף-קבצים וזרימת האישור מוכנים — נדרש לחבר שירות AI אמיתי כדי לקבל תשובות בפועל.",
  };
}
