-- אטרקציות/כרטיסים כסוג-הזמנה עצמאי (activity_reservation ב-BookingType,
-- כבר קיים ב-enum). אותה תבנית בדיוק כמו insurances — טבלת-פירוט
-- שמצביעה על Booking (1:1 דרך bookingId), בעלות דרך public.is_booking_owner
-- הקיים (ר' 20260817102045_enable_rls).

-- CreateTable
CREATE TABLE "activity_reservations" (
    "id" TEXT NOT NULL,
    "bookingId" TEXT NOT NULL,
    "venueName" TEXT NOT NULL,
    "activityDate" DATE NOT NULL,
    "activityTime" TEXT,
    "ticketType" TEXT,
    "confirmationDetails" TEXT,

    CONSTRAINT "activity_reservations_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "activity_reservations_bookingId_key" ON "activity_reservations"("bookingId");

-- CreateIndex
CREATE INDEX "activity_reservations_activityDate_idx" ON "activity_reservations"("activityDate");

-- AddForeignKey
ALTER TABLE "activity_reservations" ADD CONSTRAINT "activity_reservations_bookingId_fkey" FOREIGN KEY ("bookingId") REFERENCES "bookings"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- RLS
ALTER TABLE "activity_reservations" ENABLE ROW LEVEL SECURITY;
CREATE POLICY "activity_reservations_all_own" ON "activity_reservations" FOR ALL
  USING (public.is_booking_owner("bookingId"))
  WITH CHECK (public.is_booking_owner("bookingId"));
