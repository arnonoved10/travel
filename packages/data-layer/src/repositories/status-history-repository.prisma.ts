// PENDING_INTEGRATION — ראה ההערה המקבילה ב-trip-repository.prisma.ts.
import { PrismaClient } from "@travel-app/db";
import type { RecordStatusHistoryInput, StatusHistoryEntry } from "@travel-app/shared-types";
import { recordStatusHistoryInputSchema } from "@travel-app/shared-types";
import type { StatusHistoryRepository } from "./status-history-repository";

function toStatusHistoryEntry(row: {
  id: string;
  userId: string;
  entityType: string;
  entityId: string;
  oldStatus: string | null;
  newStatus: string;
  changedAt: Date;
  changedBy: string | null;
  reason: string | null;
  note: string | null;
}): StatusHistoryEntry {
  return {
    ...row,
    entityType: row.entityType as StatusHistoryEntry["entityType"],
    changedAt: row.changedAt.toISOString(),
  };
}

export class PrismaStatusHistoryRepository implements StatusHistoryRepository {
  constructor(private readonly prisma: PrismaClient) {}

  async listForEntities({ refs }: { refs: Array<{ entityType: string; entityId: string }> }): Promise<StatusHistoryEntry[]> {
    if (refs.length === 0) return [];
    const rows = await this.prisma.statusHistory.findMany({
      where: { OR: refs.map((r) => ({ entityType: r.entityType as never, entityId: r.entityId })) },
      orderBy: { changedAt: "asc" },
    });
    return rows.map(toStatusHistoryEntry);
  }

  async record({ input }: { input: RecordStatusHistoryInput }): Promise<StatusHistoryEntry> {
    const parsed = recordStatusHistoryInputSchema.parse(input);
    const row = await this.prisma.statusHistory.create({
      data: {
        userId: parsed.userId,
        entityType: parsed.entityType,
        entityId: parsed.entityId,
        oldStatus: parsed.oldStatus,
        newStatus: parsed.newStatus,
        changedBy: parsed.changedBy,
        reason: parsed.reason,
        note: parsed.note,
      },
    });
    return toStatusHistoryEntry(row);
  }
}
