-- באג קריטי: documents.entityId פולימורפי (יכול להצביע על Booking, Expense,
-- Place, PlannedActivity ועוד, לפי entityType) — אבל שני FK constraints נאכפו
-- עליו בו-זמנית (doc_booking_ref → bookings, doc_expense_ref → expenses).
-- entityId לא יכול לספק את שניהם בו-זמנית (אף UUID לא קיים גם ב-bookings וגם
-- ב-expenses) — כלומר היה בלתי-אפשרי להכניס שורת documents אחת, לאף
-- entityType, אף פעם. אומת ישירות: 0 שורות בטבלת documents בפרודקשן.
-- entityId פולימורפי לא יכול לקבל FK אמיתי לטבלה בודדת — התאמת הישות נאכפת
-- באפליקציה (ר' ההערה המעודכנת ב-schema.prisma ליד model Document).
ALTER TABLE "documents" DROP CONSTRAINT "doc_booking_ref";
ALTER TABLE "documents" DROP CONSTRAINT "doc_expense_ref";

-- drift קיים מראש (לא קשור לבאג למעלה): documents_tripId_fkey היה עדיין
-- RESTRICT מהמיגרציה המקורית, בזמן שה-schema (tripId אופציונלי) מתכוון ל-
-- SET NULL. RESTRICT היה חוסם מחיקת טיול כל עוד יש לו מסמכים מקושרים.
ALTER TABLE "documents" DROP CONSTRAINT "documents_tripId_fkey";
ALTER TABLE "documents" ADD CONSTRAINT "documents_tripId_fkey" FOREIGN KEY ("tripId") REFERENCES "trips"("id") ON DELETE SET NULL ON UPDATE CASCADE;
