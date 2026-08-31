import type { EmailProvider, SendEmailParams, SendEmailResult } from "./types";
import { getEmailFromAddress, getResendApiKey } from "./config";

const RESEND_URL = "https://api.resend.com/emails";

export class ResendEmailProvider implements EmailProvider {
  readonly name = "resend";

  async sendEmail({ to, subject, html, text }: SendEmailParams): Promise<SendEmailResult> {
    const apiKey = getResendApiKey();
    if (!apiKey) return { ok: false, error: "RESEND_API_KEY אינו מוגדר" };

    const response = await fetch(RESEND_URL, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${apiKey}`,
      },
      body: JSON.stringify({ from: getEmailFromAddress(), to: [to], subject, html, text }),
    });

    if (!response.ok) {
      const body = await response.text().catch(() => "");
      return { ok: false, error: `Resend API החזיר שגיאה (${response.status}): ${body.slice(0, 300)}` };
    }

    return { ok: true };
  }
}

export const resendEmailProvider = new ResendEmailProvider();
