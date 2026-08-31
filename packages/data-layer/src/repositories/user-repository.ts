/**
 * ריפוזיטורי מינימלי, ממוקד-מטרה — לא ניהול-פרופיל מלא. displayName נוסף
 * בפועל (settings/page.tsx — שם-תצוגה אמיתי לברכה, ר' תלונת-משתמש "רווח בין
 * שם פרטי לשם משפחה"); defaultCurrencyCode עדיין לא נגוע-בו, נשאר בהיקף-מצומצם.
 */
export interface UserRepository {
  getOnboardingStatus(params: { userId: string }): Promise<{ onboardingCompletedAt: string | null }>;
  markOnboardingCompleted(params: { userId: string }): Promise<void>;
  getDisplayName(params: { userId: string }): Promise<string | null>;
  updateDisplayName(params: { userId: string; displayName: string | null }): Promise<void>;
}
