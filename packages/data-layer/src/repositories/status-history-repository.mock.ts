import { randomUUID } from "node:crypto";
import type { RecordStatusHistoryInput, StatusHistoryEntry } from "@travel-app/shared-types";
import { recordStatusHistoryInputSchema } from "@travel-app/shared-types";
import type { StatusHistoryRepository } from "./status-history-repository";

export class MockStatusHistoryRepository implements StatusHistoryRepository {
  private entries = new Map<string, StatusHistoryEntry>();

  async listForEntities({ refs }: { refs: Array<{ entityType: string; entityId: string }> }): Promise<StatusHistoryEntry[]> {
    const refKeys = new Set(refs.map((r) => `${r.entityType}:${r.entityId}`));
    return Array.from(this.entries.values())
      .filter((e) => refKeys.has(`${e.entityType}:${e.entityId}`))
      .sort((a, b) => a.changedAt.localeCompare(b.changedAt));
  }

  async record({ input }: { input: RecordStatusHistoryInput }): Promise<StatusHistoryEntry> {
    const parsed = recordStatusHistoryInputSchema.parse(input);
    const entry: StatusHistoryEntry = {
      id: randomUUID(),
      userId: parsed.userId,
      entityType: parsed.entityType,
      entityId: parsed.entityId,
      oldStatus: parsed.oldStatus ?? null,
      newStatus: parsed.newStatus,
      changedAt: new Date().toISOString(),
      changedBy: parsed.changedBy ?? null,
      reason: parsed.reason ?? null,
      note: parsed.note ?? null,
    };
    this.entries.set(entry.id, entry);
    return entry;
  }
}

export const mockStatusHistoryRepository = new MockStatusHistoryRepository();
