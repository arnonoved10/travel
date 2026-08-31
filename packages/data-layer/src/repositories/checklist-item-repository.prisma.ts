// PENDING_INTEGRATION — ראה ההערה המקבילה ב-trip-repository.prisma.ts.
import { PrismaClient } from "@travel-app/db";
import type { ChecklistItem, ChecklistListType, CreateChecklistItemInput } from "@travel-app/shared-types";
import { createChecklistItemInputSchema } from "@travel-app/shared-types";
import { ChecklistItemNotFoundError, type ChecklistItemRepository } from "./checklist-item-repository";

function toChecklistItem(row: {
  id: string;
  tripId: string;
  listType: string;
  name: string;
  category: string | null;
  quantity: number | null;
  isDone: boolean;
  orderIndex: number;
  deletedAt: Date | null;
  createdAt: Date;
}): ChecklistItem {
  return {
    id: row.id,
    tripId: row.tripId,
    listType: row.listType as ChecklistItem["listType"],
    name: row.name,
    category: row.category,
    quantity: row.quantity,
    isDone: row.isDone,
    orderIndex: row.orderIndex,
    deletedAt: row.deletedAt ? row.deletedAt.toISOString() : null,
    createdAt: row.createdAt.toISOString(),
  };
}

export class PrismaChecklistItemRepository implements ChecklistItemRepository {
  constructor(private readonly prisma: PrismaClient) {}

  async listForTrip({ tripId, listType }: { tripId: string; listType: ChecklistListType }): Promise<ChecklistItem[]> {
    const rows = await this.prisma.checklistItem.findMany({
      where: { tripId, listType, deletedAt: null },
      orderBy: [{ orderIndex: "asc" }, { createdAt: "asc" }],
    });
    return rows.map(toChecklistItem);
  }

  async create({ input }: { input: CreateChecklistItemInput }): Promise<ChecklistItem> {
    const parsed = createChecklistItemInputSchema.parse(input);
    const siblingCount = await this.prisma.checklistItem.count({
      where: { tripId: parsed.tripId, listType: parsed.listType, deletedAt: null },
    });
    const row = await this.prisma.checklistItem.create({
      data: {
        tripId: parsed.tripId,
        listType: parsed.listType,
        name: parsed.name,
        category: parsed.category,
        quantity: parsed.quantity,
        orderIndex: siblingCount,
      },
    });
    return toChecklistItem(row);
  }

  async toggleDone({ itemId }: { itemId: string }): Promise<ChecklistItem> {
    const existing = await this.prisma.checklistItem.findUnique({ where: { id: itemId } });
    if (!existing) throw new ChecklistItemNotFoundError(itemId);
    const row = await this.prisma.checklistItem.update({ where: { id: itemId }, data: { isDone: !existing.isDone } });
    return toChecklistItem(row);
  }

  async softDelete({ itemId }: { itemId: string }): Promise<ChecklistItem> {
    const existing = await this.prisma.checklistItem.findUnique({ where: { id: itemId } });
    if (!existing) throw new ChecklistItemNotFoundError(itemId);
    const row = await this.prisma.checklistItem.update({ where: { id: itemId }, data: { deletedAt: new Date() } });
    return toChecklistItem(row);
  }
}
