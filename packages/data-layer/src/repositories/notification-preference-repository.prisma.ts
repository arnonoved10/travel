// PENDING_INTEGRATION — ראה ההערה המקבילה ב-trip-repository.prisma.ts.
import { PrismaClient } from "@travel-app/db";
import type { NotificationPreference, UpsertNotificationPreferenceInput } from "@travel-app/shared-types";
import { upsertNotificationPreferenceInputSchema } from "@travel-app/shared-types";
import type { NotificationPreferenceRepository } from "./notification-preference-repository";

function toNotificationPreference(row: {
  id: string;
  tripId: string;
  eventType: string;
  leadTimeMinutes: number | null;
  isEnabled: boolean;
}): NotificationPreference {
  return { ...row, eventType: row.eventType as NotificationPreference["eventType"] };
}

export class PrismaNotificationPreferenceRepository implements NotificationPreferenceRepository {
  constructor(private readonly prisma: PrismaClient) {}

  async listForTrip({ tripId }: { tripId: string }): Promise<NotificationPreference[]> {
    const rows = await this.prisma.notificationPreference.findMany({ where: { tripId } });
    return rows.map(toNotificationPreference);
  }

  async upsert({ input }: { input: UpsertNotificationPreferenceInput }): Promise<NotificationPreference> {
    const parsed = upsertNotificationPreferenceInputSchema.parse(input);
    const row = await this.prisma.notificationPreference.upsert({
      where: { tripId_eventType: { tripId: parsed.tripId, eventType: parsed.eventType } },
      update: { leadTimeMinutes: parsed.leadTimeMinutes ?? null, isEnabled: parsed.isEnabled },
      create: {
        tripId: parsed.tripId,
        eventType: parsed.eventType,
        leadTimeMinutes: parsed.leadTimeMinutes ?? null,
        isEnabled: parsed.isEnabled,
      },
    });
    return toNotificationPreference(row);
  }
}
