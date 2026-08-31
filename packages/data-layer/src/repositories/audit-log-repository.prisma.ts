// PENDING_INTEGRATION — ראה ההערה המקבילה ב-trip-repository.prisma.ts.
import { PrismaClient } from "@travel-app/db";
import type { AuditLogEntry, CreateAuditLogEntryInput } from "@travel-app/shared-types";
import { createAuditLogEntryInputSchema } from "@travel-app/shared-types";
import type { AuditLogRepository } from "./audit-log-repository";

function toAuditLogEntry(row: {
  id: string;
  userId: string | null;
  entityType: string;
  entityId: string;
  fieldName: string;
  oldValue: string | null;
  newValue: string | null;
  action: string;
  changedAt: Date;
}): AuditLogEntry {
  return {
    id: row.id,
    userId: row.userId,
    entityType: row.entityType,
    entityId: row.entityId,
    fieldName: row.fieldName,
    oldValue: row.oldValue,
    newValue: row.newValue,
    action: row.action as AuditLogEntry["action"],
    changedAt: row.changedAt.toISOString(),
  };
}

export class PrismaAuditLogRepository implements AuditLogRepository {
  constructor(private readonly prisma: PrismaClient) {}

  async listForEntities({ refs }: { refs: Array<{ entityType: string; entityId: string }> }): Promise<AuditLogEntry[]> {
    if (refs.length === 0) return [];
    const rows = await this.prisma.auditLog.findMany({
      where: { OR: refs.map((r) => ({ entityType: r.entityType, entityId: r.entityId })) },
      orderBy: { changedAt: "desc" },
    });
    return rows.map(toAuditLogEntry);
  }

  async record({ input }: { input: CreateAuditLogEntryInput }): Promise<AuditLogEntry> {
    const parsed = createAuditLogEntryInputSchema.parse(input);
    const row = await this.prisma.auditLog.create({
      data: {
        userId: parsed.userId,
        entityType: parsed.entityType,
        entityId: parsed.entityId,
        fieldName: parsed.fieldName,
        oldValue: parsed.oldValue,
        newValue: parsed.newValue,
        action: parsed.action,
      },
    });
    return toAuditLogEntry(row);
  }
}
