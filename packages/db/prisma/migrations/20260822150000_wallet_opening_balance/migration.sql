-- Wallet.openingBalance: הסכום שהיה בארנק ברגע שנוצר, קפוא לתמיד אחרי זה —
-- בשונה מ-initialAmount, שממשיך לגדול בכל top-up נוסף (סה"כ-שהופקד-אי-פעם,
-- לא "מה היה בהתחלה"). לבקשת המשתמש: "תמיד יופיע לנו כמה היה לנו בהתחלה
-- מכל מטבע" לא היה ניתן לענות עליו באמינות מתוך initialAmount לבד, כי הוא
-- מתעדכן בכל טעינה נוספת.
ALTER TABLE "wallets" ADD COLUMN "openingBalance" DECIMAL(12,2) NOT NULL DEFAULT 0;

-- Backfill לשורות שכבר קיימות: initialAmount הוא הקירוב הכי טוב שיש (לפני
-- שהעמודה הזו נוספה, לא היה שום דבר אחר שיכול היה לשמר את הערך המקורי).
UPDATE "wallets" SET "openingBalance" = "initialAmount" WHERE "openingBalance" = 0;
