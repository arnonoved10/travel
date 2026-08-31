import { randomUUID } from "node:crypto";
import { existsSync, mkdirSync, readFileSync, writeFileSync } from "node:fs";
import path from "node:path";
import type { CreateSharedInboxItemInput, SharedInboxItem } from "@travel-app/shared-types";
import { createSharedInboxItemInputSchema } from "@travel-app/shared-types";
import { SharedInboxItemNotFoundError, type SharedInboxRepository } from "./shared-inbox-repository";

// קובץ JSON על הדיסק, לא Map בזיכרון כמו שאר ה-Mock Repositories: תחת Turbopack
// dev (וכנראה גם ב-build לפרודקשן), ה-Route Handler של share_target
// (app/api/share-target/route.ts) וה-Server Components של הדפים נטענים כשני
// module graph נפרדים באותו תהליך — כל אחד מקבל instance נפרד של המחלקה הזו,
// כך ש-Map בזיכרון שנכתב מה-route לא נראה מה-page שקורא אותו (אומת בפועל: אותו
// PID, שני instance-ים שונים). קובץ משותף על הדיסק פותר את זה כי שניהם קוראים
// מאותה נקודת-אמת. שאר ה-Mock Repositories לא נתקלים בזה כי אף אחד מהם לא
// נכתב מ-Route Handler — רק מ-Server Actions, שכן חולקים module graph עם הדפים.
// ב-DATA_SOURCE=prisma הבעיה לא קיימת כלל (Postgres הוא מקור-אמת יחיד אמיתי).
const STORE_DIR = path.join(process.cwd(), ".shared-inbox-cache");
const STORE_FILE = path.join(STORE_DIR, "items.json");

function readStore(): SharedInboxItem[] {
  try {
    return JSON.parse(readFileSync(STORE_FILE, "utf-8")) as SharedInboxItem[];
  } catch {
    return [];
  }
}

function writeStore(items: SharedInboxItem[]): void {
  if (!existsSync(STORE_DIR)) mkdirSync(STORE_DIR, { recursive: true });
  writeFileSync(STORE_FILE, JSON.stringify(items), "utf-8");
}

export class MockSharedInboxRepository implements SharedInboxRepository {
  async listPending({ userId }: { userId: string }): Promise<SharedInboxItem[]> {
    return readStore()
      .filter((item) => item.userId === userId)
      .sort((a, b) => b.createdAt.localeCompare(a.createdAt));
  }

  async getById({ userId, itemId }: { userId: string; itemId: string }): Promise<SharedInboxItem | null> {
    const item = readStore().find((i) => i.id === itemId);
    if (!item || item.userId !== userId) return null;
    return item;
  }

  async create({ userId, input }: { userId: string; input: CreateSharedInboxItemInput }): Promise<SharedInboxItem> {
    const parsed = createSharedInboxItemInputSchema.parse(input);
    const item: SharedInboxItem = {
      id: randomUUID(),
      userId,
      fileUrl: parsed.fileUrl ?? null,
      fileName: parsed.fileName ?? null,
      mimeType: parsed.mimeType ?? null,
      sharedTitle: parsed.sharedTitle ?? null,
      sharedText: parsed.sharedText ?? null,
      sharedUrl: parsed.sharedUrl ?? null,
      createdAt: new Date().toISOString(),
    };
    const items = readStore();
    items.push(item);
    writeStore(items);
    return item;
  }

  async delete({ userId, itemId }: { userId: string; itemId: string }): Promise<void> {
    const items = readStore();
    const existing = items.find((i) => i.id === itemId && i.userId === userId);
    if (!existing) throw new SharedInboxItemNotFoundError(itemId);
    writeStore(items.filter((i) => i.id !== itemId));
  }
}

export const mockSharedInboxRepository = new MockSharedInboxRepository();
