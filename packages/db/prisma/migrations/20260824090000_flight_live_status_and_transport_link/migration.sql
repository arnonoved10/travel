-- Flight.liveStatus/liveDelayMinutes/liveStatusCheckedAt — סטטוס טיסה חי
-- (Aviationstack), נשמר רק כתוצאה מבדיקה מפורשת של המשתמש, לא ברירת-מחדל.
ALTER TABLE "flights" ADD COLUMN "liveStatus" TEXT;
ALTER TABLE "flights" ADD COLUMN "liveDelayMinutes" INTEGER;
ALTER TABLE "flights" ADD COLUMN "liveStatusCheckedAt" TIMESTAMP(3);

-- TransportBooking.linkedFlightId — קישור מפורש (בחירת משתמש) בין הסעה
-- לטיסה ספציפית, כדי שהודעת "שלח לנהג" תוכל לכלול מספר-טיסה/סטטוס אמיתיים.
ALTER TABLE "transport_bookings" ADD COLUMN "linkedFlightId" TEXT;

-- CreateIndex
CREATE INDEX "transport_bookings_linkedFlightId_idx" ON "transport_bookings"("linkedFlightId");

-- AddForeignKey
ALTER TABLE "transport_bookings" ADD CONSTRAINT "transport_bookings_linkedFlightId_fkey" FOREIGN KEY ("linkedFlightId") REFERENCES "flights"("id") ON DELETE SET NULL ON UPDATE CASCADE;
