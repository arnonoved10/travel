import { PrismaClient } from "@travel-app/db";
import type { UserRepository } from "./user-repository";

export class PrismaUserRepository implements UserRepository {
  constructor(private readonly prisma: PrismaClient) {}

  async getOnboardingStatus({ userId }: { userId: string }): Promise<{ onboardingCompletedAt: string | null }> {
    const row = await this.prisma.user.findUnique({ where: { id: userId }, select: { onboardingCompletedAt: true } });
    // שורת-המשתמש נוצרת ע"י trigger ב-Supabase Auth (handle_new_auth_user) —
    // אם היא עדיין לא הגיעה מסיבה כלשהי, מתייחסים לזה כ"טרם השלים" (לא שגיאה),
    // אותו עיקרון כמו legalConsentAcceptedAt.
    return { onboardingCompletedAt: row?.onboardingCompletedAt ? row.onboardingCompletedAt.toISOString() : null };
  }

  async markOnboardingCompleted({ userId }: { userId: string }): Promise<void> {
    await this.prisma.user.update({ where: { id: userId }, data: { onboardingCompletedAt: new Date() } });
  }

  async getDisplayName({ userId }: { userId: string }): Promise<string | null> {
    const row = await this.prisma.user.findUnique({ where: { id: userId }, select: { displayName: true } });
    return row?.displayName ?? null;
  }

  async updateDisplayName({ userId, displayName }: { userId: string; displayName: string | null }): Promise<void> {
    await this.prisma.user.update({ where: { id: userId }, data: { displayName } });
  }
}
