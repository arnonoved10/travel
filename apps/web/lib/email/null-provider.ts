import type { EmailProvider, SendEmailParams, SendEmailResult } from "./types";

/** מוחזר כש-RESEND_API_KEY לא מוגדר — לעולם לא מדמה הצלחה, מחזיר שגיאה ברורה
 * שה-UI יכול להציג (בדיוק כמו UnconfiguredMapProvider/NullOcrProvider). */
export class NullEmailProvider implements EmailProvider {
  readonly name = "unconfigured";

  async sendEmail(_params: SendEmailParams): Promise<SendEmailResult> {
    return { ok: false, error: "שליחת אימייל לא מוגדרת — חסר RESEND_API_KEY." };
  }
}

export const nullEmailProvider = new NullEmailProvider();
