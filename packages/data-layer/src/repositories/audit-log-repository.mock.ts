import { randomUUID } from "node:crypto";
import type { AuditLogEntry, CreateAuditLogEntryInput } from "@travel-app/shared-types";
import { createAuditLogEntryInputSchema } from "@travel-app/shared-types";
import type { AuditLogRepository } from "./audit-log-repository";

export class MockAuditLogRepository implements AuditLogRepository {
  private entries = new Map<string, AuditLogEntry>();

  async listForEntities({ refs }: { refs: Array<{ entityType: string; entityId: string }> }): Promise<AuditLogEntry[]> {
    const refKeys = new Set(refs.map((r) => `${r.entityType}:${r.entityId}`));
    return Array.from(this.entries.values())
      .filter((e) => refKeys.has(`${e.entityType}:${e.entityId}`))
      .sort((a, b) => b.changedAt.localeCompare(a.changedAt));
  }

  async record({ input }: { input: CreateAuditLogEntryInput }): Promise<AuditLogEntry> {
    const parsed = createAuditLogEntryInputSchema.parse(input);
    const entry: AuditLogEntry = {
      id: randomUUID(),
      userId: parsed.userId ?? null,
      entityType: parsed.entityType,
      entityId: parsed.entityId,
      fieldName: parsed.fieldName,
      oldValue: parsed.oldValue ?? null,
      newValue: parsed.newValue ?? null,
      action: parsed.action,
      changedAt: new Date().toISOString(),
    };
    this.entries.set(entry.id, entry);
    return entry;
  }
}

export const mockAuditLogRepository = new MockAuditLogRepository();
