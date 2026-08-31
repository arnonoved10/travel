import { randomUUID } from "node:crypto";
import type { ChecklistItem, ChecklistListType, CreateChecklistItemInput } from "@travel-app/shared-types";
import { createChecklistItemInputSchema } from "@travel-app/shared-types";
import { ChecklistItemNotFoundError, type ChecklistItemRepository } from "./checklist-item-repository";

const DEMO_TRIP_ID = "00000000-0000-4000-8000-000000000101"; // [דמו] טיול לתאילנד

export class MockChecklistItemRepository implements ChecklistItemRepository {
  private items = new Map<string, ChecklistItem>();

  constructor() {
    this.seed();
  }

  private seed(): void {
    const now = new Date().toISOString();
    const seedItems: Array<Omit<ChecklistItem, "id" | "createdAt" | "deletedAt">> = [
      { tripId: DEMO_TRIP_ID, listType: "packing", name: "מטען טלפון", category: "אלקטרוניקה", quantity: 1, isDone: true, orderIndex: 0 },
      { tripId: DEMO_TRIP_ID, listType: "packing", name: "מתאם חשמל לתאילנד", category: "אלקטרוניקה", quantity: 1, isDone: false, orderIndex: 1 },
      { tripId: DEMO_TRIP_ID, listType: "packing", name: "בגדים קלים", category: "בגדים", quantity: 7, isDone: false, orderIndex: 2 },
      { tripId: DEMO_TRIP_ID, listType: "packing", name: "קרם הגנה", category: "טואלטיקה", quantity: 1, isDone: false, orderIndex: 3 },
      { tripId: DEMO_TRIP_ID, listType: "before_trip", name: "לוודא תוקף דרכון (6 חודשים לפחות)", category: null, quantity: null, isDone: true, orderIndex: 0 },
      { tripId: DEMO_TRIP_ID, listType: "before_trip", name: "לעדכן ביטוח נסיעות", category: null, quantity: null, isDone: false, orderIndex: 1 },
      { tripId: DEMO_TRIP_ID, listType: "before_trip", name: "להודיע לבנק על נסיעה לחו\"ל", category: null, quantity: null, isDone: false, orderIndex: 2 },
    ];

    for (const item of seedItems) {
      const id = randomUUID();
      this.items.set(id, { ...item, id, deletedAt: null, createdAt: now });
    }
  }

  async listForTrip({ tripId, listType }: { tripId: string; listType: ChecklistListType }): Promise<ChecklistItem[]> {
    return Array.from(this.items.values())
      .filter((i) => i.tripId === tripId && i.listType === listType && i.deletedAt === null)
      .sort((a, b) => a.orderIndex - b.orderIndex || a.createdAt.localeCompare(b.createdAt));
  }

  async create({ input }: { input: CreateChecklistItemInput }): Promise<ChecklistItem> {
    const parsed = createChecklistItemInputSchema.parse(input);
    const siblingCount = Array.from(this.items.values()).filter(
      (i) => i.tripId === parsed.tripId && i.listType === parsed.listType && i.deletedAt === null,
    ).length;

    const item: ChecklistItem = {
      id: randomUUID(),
      tripId: parsed.tripId,
      listType: parsed.listType,
      name: parsed.name,
      category: parsed.category ?? null,
      quantity: parsed.quantity ?? null,
      isDone: false,
      orderIndex: siblingCount,
      deletedAt: null,
      createdAt: new Date().toISOString(),
    };
    this.items.set(item.id, item);
    return item;
  }

  async toggleDone({ itemId }: { itemId: string }): Promise<ChecklistItem> {
    const existing = this.items.get(itemId);
    if (!existing) throw new ChecklistItemNotFoundError(itemId);
    const updated: ChecklistItem = { ...existing, isDone: !existing.isDone };
    this.items.set(itemId, updated);
    return updated;
  }

  async softDelete({ itemId }: { itemId: string }): Promise<ChecklistItem> {
    const existing = this.items.get(itemId);
    if (!existing) throw new ChecklistItemNotFoundError(itemId);
    const updated: ChecklistItem = { ...existing, deletedAt: new Date().toISOString() };
    this.items.set(itemId, updated);
    return updated;
  }
}

export const mockChecklistItemRepository = new MockChecklistItemRepository();
