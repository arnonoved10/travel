import { z } from "zod";
import { notificationEventTypeSchema } from "./enums";

export const notificationPreferenceSchema = z.object({
  id: z.uuid(),
  tripId: z.uuid(),
  eventType: notificationEventTypeSchema,
  leadTimeMinutes: z.number().int().nonnegative().nullable(),
  isEnabled: z.boolean(),
});
export type NotificationPreference = z.infer<typeof notificationPreferenceSchema>;

export const upsertNotificationPreferenceInputSchema = z.object({
  tripId: z.uuid(),
  eventType: notificationEventTypeSchema,
  leadTimeMinutes: z.number().int().nonnegative().nullable().optional(),
  isEnabled: z.boolean(),
});
export type UpsertNotificationPreferenceInput = z.infer<typeof upsertNotificationPreferenceInputSchema>;
