export function isEmailConfigured(): boolean {
  return Boolean(process.env.RESEND_API_KEY);
}

export function getResendApiKey(): string | null {
  return process.env.RESEND_API_KEY ?? null;
}

/** ברירת המחדל היא כתובת ה-Sandbox החינמית של Resend — עובדת מיד בלי אימות
 * דומיין, אבל שולחת רק לכתובת שנרשמה בחשבון ה-Resend עצמו. לשליחה חופשית
 * לכל נמען צריך דומיין מאומת ולהגדיר EMAIL_FROM_ADDRESS. */
export function getEmailFromAddress(): string {
  return process.env.EMAIL_FROM_ADDRESS ?? "Trip Master <onboarding@resend.dev>";
}
