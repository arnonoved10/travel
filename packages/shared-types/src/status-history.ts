import { z } from "zod";

export const statusHistoryEntityTypeSchema = z.enum(["planned_activity", "booking"]);
export type StatusHistoryEntityType = z.infer<typeof statusHistoryEntityTypeSchema>;

export const statusHistoryEntrySchema = z.object({
  id: z.uuid(),
  userId: z.uuid(),
  entityType: statusHistoryEntityTypeSchema,
  entityId: z.uuid(),
  oldStatus: z.string().nullable(),
  newStatus: z.string(),
  changedAt: z.iso.datetime(),
  changedBy: z.string().nullable(),
  reason: z.string().nullable(),
  note: z.string().nullable(),
});
export type StatusHistoryEntry = z.infer<typeof statusHistoryEntrySchema>;

export const recordStatusHistoryInputSchema = z.object({
  userId: z.uuid(),
  entityType: statusHistoryEntityTypeSchema,
  entityId: z.uuid(),
  oldStatus: z.string().optional(),
  newStatus: z.string(),
  changedBy: z.string().optional(),
  reason: z.string().optional(),
  note: z.string().optional(),
});
export type RecordStatusHistoryInput = z.infer<typeof recordStatusHistoryInputSchema>;
