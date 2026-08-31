import type { CreateSharedInboxItemInput, SharedInboxItem } from "@travel-app/shared-types";

/** תא-קליטה זמני של "שתף" מהטלפון — ראה ההערה ב-schema.prisma. אין soft-delete: פריט
 * שמשויך הופך ל-Document אמיתי ונמחק לצמיתות מכאן, לא מסומן deletedAt. */
export interface SharedInboxRepository {
  listPending(params: { userId: string }): Promise<SharedInboxItem[]>;
  getById(params: { userId: string; itemId: string }): Promise<SharedInboxItem | null>;
  create(params: { userId: string; input: CreateSharedInboxItemInput }): Promise<SharedInboxItem>;
  delete(params: { userId: string; itemId: string }): Promise<void>;
}

export class SharedInboxItemNotFoundError extends Error {
  constructor(itemId: string) {
    super(`SharedInboxItem ${itemId} not found`);
    this.name = "SharedInboxItemNotFoundError";
  }
}
