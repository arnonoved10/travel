-- כלי-רכב-על-הסיפון למעבורות (סעיף 10 באפיון) — היה חסר מ-TransportBooking
ALTER TABLE "transport_bookings" ADD COLUMN "vehicleOnBoard" TEXT;
