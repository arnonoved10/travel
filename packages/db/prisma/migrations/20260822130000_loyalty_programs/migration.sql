-- LoyaltyProgram: מעקב נקודות/מיילים (טיסות תכופות, מועדוני מלונות) —
-- גלובלי פר-משתמש, לא פר-טיול, אותו עיקרון כמו Contact/PaymentCard.

-- CreateEnum
CREATE TYPE "LoyaltyProgramType" AS ENUM ('airline', 'hotel', 'car_rental', 'other');

-- CreateTable
CREATE TABLE "loyalty_programs" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "programName" TEXT NOT NULL,
    "programType" "LoyaltyProgramType",
    "memberNumber" TEXT,
    "currentBalance" INTEGER,
    "tierStatus" TEXT,
    "notes" TEXT,
    "deletedAt" TIMESTAMP(3),

    CONSTRAINT "loyalty_programs_pkey" PRIMARY KEY ("id")
);

-- AddForeignKey
ALTER TABLE "loyalty_programs" ADD CONSTRAINT "loyalty_programs_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- RLS (ר' rls_policies.sql, סעיף 6 — userId ישיר, אותו דפוס כמו contacts/payment_cards)
ALTER TABLE "loyalty_programs" ENABLE ROW LEVEL SECURITY;
CREATE POLICY "loyalty_programs_all_own" ON "loyalty_programs" FOR ALL
  USING ("userId" = auth.uid()::text)
  WITH CHECK ("userId" = auth.uid()::text);
