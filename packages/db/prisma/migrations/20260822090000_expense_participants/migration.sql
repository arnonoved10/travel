-- ExpenseParticipant: מי (TripCompanion) משתתף בכל הוצאה משותפת — הבסיס
-- ל"סגירת חשבונות" (חלק G). רק הוצאות עם משתתפים נבחרים-במפורש נכללות
-- בחישוב היתרות; בעל החשבון עצמו לא מיוצג בשורה (מובלע תמיד).

-- CreateTable
CREATE TABLE "expense_participants" (
    "id" TEXT NOT NULL,
    "expenseId" TEXT NOT NULL,
    "companionId" TEXT NOT NULL,

    CONSTRAINT "expense_participants_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "expense_participants_expenseId_companionId_key" ON "expense_participants"("expenseId", "companionId");

-- AddForeignKey
ALTER TABLE "expense_participants" ADD CONSTRAINT "expense_participants_expenseId_fkey" FOREIGN KEY ("expenseId") REFERENCES "expenses"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "expense_participants" ADD CONSTRAINT "expense_participants_companionId_fkey" FOREIGN KEY ("companionId") REFERENCES "trip_companions"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- RLS (ר' rls_policies.sql, סעיף 8b — is_expense_owner() כבר קיים)
ALTER TABLE "expense_participants" ENABLE ROW LEVEL SECURITY;
CREATE POLICY "expense_participants_all_own" ON "expense_participants" FOR ALL
  USING (public.is_expense_owner("expenseId"))
  WITH CHECK (public.is_expense_owner("expenseId"));
