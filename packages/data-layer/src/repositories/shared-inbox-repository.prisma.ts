import { PrismaClient } from "@travel-app/db";
import type { CreateSharedInboxItemInput, SharedInboxItem } from "@travel-app/shared-types";
import { createSharedInboxItemInputSchema } from "@travel-app/shared-types";
import { SharedInboxItemNotFoundError, type SharedInboxRepository } from "./shared-inbox-repository";

function toSharedInboxItem(row: {
  id: string;
  userId: string;
  fileUrl: string | null;
  fileName: string | null;
  mimeType: string | null;
  sharedTitle: string | null;
  sharedText: string | null;
  sharedUrl: string | null;
  createdAt: Date;
}): SharedInboxItem {
  return { ...row, createdAt: row.createdAt.toISOString() };
}

export class PrismaSharedInboxRepository implements SharedInboxRepository {
  constructor(private readonly prisma: PrismaClient) {}

  async listPending({ userId }: { userId: string }): Promise<SharedInboxItem[]> {
    const rows = await this.prisma.sharedInboxItem.findMany({ where: { userId }, orderBy: { createdAt: "desc" } });
    return rows.map(toSharedInboxItem);
  }

  async getById({ userId, itemId }: { userId: string; itemId: string }): Promise<SharedInboxItem | null> {
    const row = await this.prisma.sharedInboxItem.findFirst({ where: { id: itemId, userId } });
    return row ? toSharedInboxItem(row) : null;
  }

  async create({ userId, input }: { userId: string; input: CreateSharedInboxItemInput }): Promise<SharedInboxItem> {
    const parsed = createSharedInboxItemInputSchema.parse(input);
    const row = await this.prisma.sharedInboxItem.create({ data: { userId, ...parsed } });
    return toSharedInboxItem(row);
  }

  async delete({ userId, itemId }: { userId: string; itemId: string }): Promise<void> {
    const existing = await this.prisma.sharedInboxItem.findFirst({ where: { id: itemId, userId } });
    if (!existing) throw new SharedInboxItemNotFoundError(itemId);
    await this.prisma.sharedInboxItem.delete({ where: { id: itemId } });
  }
}
