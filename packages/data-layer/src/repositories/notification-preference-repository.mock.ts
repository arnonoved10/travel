import { randomUUID } from "node:crypto";
import type { NotificationPreference, UpsertNotificationPreferenceInput } from "@travel-app/shared-types";
import { upsertNotificationPreferenceInputSchema } from "@travel-app/shared-types";
import type { NotificationPreferenceRepository } from "./notification-preference-repository";

function key(tripId: string, eventType: string): string {
  return `${tripId}:${eventType}`;
}

export class MockNotificationPreferenceRepository implements NotificationPreferenceRepository {
  private preferences = new Map<string, NotificationPreference>();

  async listForTrip({ tripId }: { tripId: string }): Promise<NotificationPreference[]> {
    return Array.from(this.preferences.values()).filter((p) => p.tripId === tripId);
  }

  async upsert({ input }: { input: UpsertNotificationPreferenceInput }): Promise<NotificationPreference> {
    const parsed = upsertNotificationPreferenceInputSchema.parse(input);
    const existing = this.preferences.get(key(parsed.tripId, parsed.eventType));
    const preference: NotificationPreference = {
      id: existing?.id ?? randomUUID(),
      tripId: parsed.tripId,
      eventType: parsed.eventType,
      leadTimeMinutes: parsed.leadTimeMinutes ?? null,
      isEnabled: parsed.isEnabled,
    };
    this.preferences.set(key(parsed.tripId, parsed.eventType), preference);
    return preference;
  }
}

export const mockNotificationPreferenceRepository = new MockNotificationPreferenceRepository();
