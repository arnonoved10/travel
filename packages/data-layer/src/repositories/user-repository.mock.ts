import type { UserRepository } from "./user-repository";

// חייב להתאים בדיוק ל-DEMO_USER.id ב-apps/web/lib/auth/get-current-user.ts.
const DEMO_USER_ID = "00000000-0000-4000-8000-000000000001";

export class MockUserRepository implements UserRepository {
  // משתמש-הדמו כבר "סיים" את ההדרכה — בלי זה מצב-דמו היה תקוע במסך-הדרכה
  // בכל טעינה (אין באמת הרשמה-ראשונה במצב הזה).
  private onboardingCompletedAt = new Map<string, string | null>([[DEMO_USER_ID, new Date(0).toISOString()]]);
  private displayNames = new Map<string, string | null>();

  async getOnboardingStatus({ userId }: { userId: string }): Promise<{ onboardingCompletedAt: string | null }> {
    return { onboardingCompletedAt: this.onboardingCompletedAt.get(userId) ?? null };
  }

  async markOnboardingCompleted({ userId }: { userId: string }): Promise<void> {
    this.onboardingCompletedAt.set(userId, new Date().toISOString());
  }

  async getDisplayName({ userId }: { userId: string }): Promise<string | null> {
    return this.displayNames.get(userId) ?? null;
  }

  async updateDisplayName({ userId, displayName }: { userId: string; displayName: string | null }): Promise<void> {
    this.displayNames.set(userId, displayName);
  }
}

export const mockUserRepository = new MockUserRepository();
