import type { ChecklistItem, ChecklistListType, CreateChecklistItemInput } from "@travel-app/shared-types";

export interface ChecklistItemRepository {
  listForTrip(params: { tripId: string; listType: ChecklistListType }): Promise<ChecklistItem[]>;
  create(params: { input: CreateChecklistItemInput }): Promise<ChecklistItem>;
  toggleDone(params: { itemId: string }): Promise<ChecklistItem>;
  softDelete(params: { itemId: string }): Promise<ChecklistItem>;
}

export class ChecklistItemNotFoundError extends Error {
  constructor(itemId: string) {
    super(`ChecklistItem ${itemId} not found`);
    this.name = "ChecklistItemNotFoundError";
  }
}
