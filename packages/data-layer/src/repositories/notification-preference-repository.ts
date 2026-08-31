import type { NotificationPreference, UpsertNotificationPreferenceInput } from "@travel-app/shared-types";

/** העדפות התראה לטיול, ייחודי לפי (tripId, eventType) — ראה DECISIONS.md "מצב Notifications". */
export interface NotificationPreferenceRepository {
  listForTrip(params: { tripId: string }): Promise<NotificationPreference[]>;
  upsert(params: { input: UpsertNotificationPreferenceInput }): Promise<NotificationPreference>;
}
