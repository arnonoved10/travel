export interface SendEmailParams {
  to: string;
  subject: string;
  html: string;
  text: string;
}

export interface SendEmailResult {
  ok: boolean;
  error?: string;
}

/** ספק שליחת-אימייל — כמו RecommendationsProvider/OcrProvider, לא ממציא הצלחה:
 * כשל אמיתי (מפתח חסר/ה-API דחה) מוחזר כ-ok:false, לא נבלע בשקט. */
export interface EmailProvider {
  readonly name: string;
  sendEmail(params: SendEmailParams): Promise<SendEmailResult>;
}
