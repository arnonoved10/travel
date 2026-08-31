-- NotificationEventType: ערך חדש לתזכורת "צ'ק-אין נפתח" (ר' Flight.checkInWindowHours למטה).
-- ALTER TYPE ... ADD VALUE לא יכול לרוץ בתוך אותה טרנזקציה כמו שאר הפקודות
-- כאן במטרה נמנעת מבעיה — Postgres דורש שהוא יהיה הפעולה הראשונה/עצמאית.
ALTER TYPE "NotificationEventType" ADD VALUE 'flight_checkin_open';

-- Trip.passportExpiryDate — אופציונלי, מזין את בדיקת "תוקף-דרכון קרוב לפוג" ב-gap-detection.ts.
ALTER TABLE "trips" ADD COLUMN "passportExpiryDate" DATE;

-- Flight.checkInWindowHours — חלון-פתיחת-צ'ק-אין (שעות לפני המראה), נשמר רק
-- כשהמשתמש בוחר בפועל דרך CheckInWindowPicker (משתנה בין חברות-תעופה).
ALTER TABLE "flights" ADD COLUMN "checkInWindowHours" INTEGER;

-- PushSubscription: מנוי Web Push אמיתי, אחד לכל דפדפן/מכשיר שהמשתמש הפעיל בו.
CREATE TABLE "push_subscriptions" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "endpoint" TEXT NOT NULL,
    "p256dh" TEXT NOT NULL,
    "auth" TEXT NOT NULL,
    "userAgent" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "push_subscriptions_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "push_subscriptions_endpoint_key" ON "push_subscriptions"("endpoint");

-- CreateIndex
CREATE INDEX "push_subscriptions_userId_idx" ON "push_subscriptions"("userId");

-- AddForeignKey
ALTER TABLE "push_subscriptions" ADD CONSTRAINT "push_subscriptions_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- RLS (ר' rls_policies.sql, סעיף 6 — userId ישיר, אותו דפוס כמו contacts/payment_cards/loyalty_programs)
ALTER TABLE "push_subscriptions" ENABLE ROW LEVEL SECURITY;
CREATE POLICY "push_subscriptions_all_own" ON "push_subscriptions" FOR ALL
  USING ("userId" = auth.uid()::text)
  WITH CHECK ("userId" = auth.uid()::text);
