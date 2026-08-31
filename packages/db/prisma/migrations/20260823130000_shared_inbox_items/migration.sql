-- SharedInboxItem: קליטת "שתף" מהטלפון (PWA share_target) לפני שיוך לטיול/הזמנה —
-- גלובלי פר-משתמש, נמחק ברגע שהפריט משויך והופך ל-Document אמיתי, אין deletedAt/restore.

-- CreateTable
CREATE TABLE "shared_inbox_items" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "fileUrl" TEXT,
    "fileName" TEXT,
    "mimeType" TEXT,
    "sharedTitle" TEXT,
    "sharedText" TEXT,
    "sharedUrl" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "shared_inbox_items_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "shared_inbox_items_userId_idx" ON "shared_inbox_items"("userId");

-- AddForeignKey
ALTER TABLE "shared_inbox_items" ADD CONSTRAINT "shared_inbox_items_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- RLS (ר' rls_policies.sql, סעיף 6 — userId ישיר, אותו דפוס כמו contacts/payment_cards/loyalty_programs)
ALTER TABLE "shared_inbox_items" ENABLE ROW LEVEL SECURITY;
CREATE POLICY "shared_inbox_items_all_own" ON "shared_inbox_items" FOR ALL
  USING ("userId" = auth.uid()::text)
  WITH CHECK ("userId" = auth.uid()::text);
