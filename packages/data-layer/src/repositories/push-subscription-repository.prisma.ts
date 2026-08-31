import { PrismaClient } from "@travel-app/db";
import type { CreatePushSubscriptionInput, PushSubscription } from "@travel-app/shared-types";
import { createPushSubscriptionInputSchema } from "@travel-app/shared-types";
import type { PushSubscriptionRepository } from "./push-subscription-repository";

function toPushSubscription(row: {
  id: string;
  userId: string;
  endpoint: string;
  p256dh: string;
  auth: string;
  userAgent: string | null;
  createdAt: Date;
}): PushSubscription {
  return { ...row, createdAt: row.createdAt.toISOString() };
}

export class PrismaPushSubscriptionRepository implements PushSubscriptionRepository {
  constructor(private readonly prisma: PrismaClient) {}

  async listForUser({ userId }: { userId: string }): Promise<PushSubscription[]> {
    const rows = await this.prisma.pushSubscription.findMany({ where: { userId } });
    return rows.map(toPushSubscription);
  }

  async upsert({ userId, input }: { userId: string; input: CreatePushSubscriptionInput }): Promise<PushSubscription> {
    const parsed = createPushSubscriptionInputSchema.parse(input);
    const row = await this.prisma.pushSubscription.upsert({
      where: { endpoint: parsed.endpoint },
      create: { userId, endpoint: parsed.endpoint, p256dh: parsed.p256dh, auth: parsed.auth, userAgent: parsed.userAgent },
      update: { userId, p256dh: parsed.p256dh, auth: parsed.auth, userAgent: parsed.userAgent },
    });
    return toPushSubscription(row);
  }

  async deleteByEndpoint({ endpoint }: { endpoint: string }): Promise<void> {
    await this.prisma.pushSubscription.deleteMany({ where: { endpoint } });
  }
}
