import { z } from "zod";
import { auditActionSchema } from "./enums";

export const auditLogEntrySchema = z.object({
  id: z.uuid(),
  userId: z.uuid().nullable(),
  entityType: z.string().min(1),
  entityId: z.uuid(),
  fieldName: z.string().min(1),
  oldValue: z.string().nullable(),
  newValue: z.string().nullable(),
  action: auditActionSchema,
  changedAt: z.iso.datetime(),
});
export type AuditLogEntry = z.infer<typeof auditLogEntrySchema>;

export const createAuditLogEntryInputSchema = z.object({
  userId: z.uuid().optional(),
  entityType: z.string().min(1),
  entityId: z.uuid(),
  fieldName: z.string().min(1),
  oldValue: z.string().optional(),
  newValue: z.string().optional(),
  action: auditActionSchema,
});
export type CreateAuditLogEntryInput = z.infer<typeof createAuditLogEntryInputSchema>;
