import { randomUUID } from "node:crypto";
import type { CreatePushSubscriptionInput, PushSubscription } from "@travel-app/shared-types";
import { createPushSubscriptionInputSchema } from "@travel-app/shared-types";
import type { PushSubscriptionRepository } from "./push-subscription-repository";

export class MockPushSubscriptionRepository implements PushSubscriptionRepository {
  private subscriptions = new Map<string, PushSubscription>();

  async listForUser({ userId }: { userId: string }): Promise<PushSubscription[]> {
    return Array.from(this.subscriptions.values()).filter((s) => s.userId === userId);
  }

  async upsert({ userId, input }: { userId: string; input: CreatePushSubscriptionInput }): Promise<PushSubscription> {
    const parsed = createPushSubscriptionInputSchema.parse(input);
    const existing = Array.from(this.subscriptions.values()).find((s) => s.endpoint === parsed.endpoint);
    const subscription: PushSubscription = {
      id: existing?.id ?? randomUUID(),
      userId,
      endpoint: parsed.endpoint,
      p256dh: parsed.p256dh,
      auth: parsed.auth,
      userAgent: parsed.userAgent ?? null,
      createdAt: existing?.createdAt ?? new Date().toISOString(),
    };
    this.subscriptions.set(subscription.id, subscription);
    return subscription;
  }

  async deleteByEndpoint({ endpoint }: { endpoint: string }): Promise<void> {
    const existing = Array.from(this.subscriptions.values()).find((s) => s.endpoint === endpoint);
    if (existing) this.subscriptions.delete(existing.id);
  }
}

export const mockPushSubscriptionRepository = new MockPushSubscriptionRepository();
