-- Refund.isReceived: מבחין בין החזר שהתקבל בפועל (ברירת מחדל, תואם לכל
-- השורות הקיימות) לבין החזר צפוי/ממתין שטרם התקבל — מאפשר את בדיקת
-- ה-Alert "Refund-Pending" (#61) שהייתה חסומה עד כה בהיעדר המושג הזה במודל.
ALTER TABLE "refunds" ADD COLUMN "isReceived" BOOLEAN NOT NULL DEFAULT true;

DROP INDEX IF EXISTS "refunds_tripId_idx";
CREATE INDEX "refunds_tripId_isReceived_idx" ON "refunds"("tripId", "isReceived");
