-- ביצועים: אינדקסים חסרים על עמודות מפתח-זר. Postgres לא יוצר אינדקס
-- אוטומטית על FK (רק על ה-constraint עצמו) — Prisma יוצר אינדקס רק כש-@@index
-- מוגדר מפורשות. עד עכשיו הרבה שאילתות-tripId/FK עשו סריקת-טבלה מלאה.
-- (הערה: transport_bookings_linkedFlightId_idx לא כלול כאן בכוונה — הוא כבר
-- קיים בפועל ב-DB ממיגרציה 20260824090000, רק חסר מהסכימה; תוקן שם בלבד.)

CREATE INDEX "booking_benefits_bookingId_idx" ON "booking_benefits"("bookingId");
CREATE INDEX "bookings_placeId_idx" ON "bookings"("placeId");
CREATE INDEX "checklist_items_tripId_listType_idx" ON "checklist_items"("tripId", "listType");
CREATE INDEX "companion_poll_options_pollId_idx" ON "companion_poll_options"("pollId");
CREATE INDEX "companion_poll_votes_optionId_idx" ON "companion_poll_votes"("optionId");
CREATE INDEX "companion_polls_tripId_idx" ON "companion_polls"("tripId");
CREATE INDEX "deposits_bookingId_idx" ON "deposits"("bookingId");
CREATE INDEX "documents_tripId_idx" ON "documents"("tripId");
CREATE INDEX "expenses_bookingId_idx" ON "expenses"("bookingId");
CREATE INDEX "expenses_placeId_idx" ON "expenses"("placeId");
CREATE INDEX "expenses_plannedActivityId_idx" ON "expenses"("plannedActivityId");
CREATE INDEX "loyalty_programs_userId_idx" ON "loyalty_programs"("userId");
CREATE INDEX "payment_cards_userId_idx" ON "payment_cards"("userId");
CREATE INDEX "payments_cardId_idx" ON "payments"("cardId");
CREATE INDEX "payments_paidByCompanionId_idx" ON "payments"("paidByCompanionId");
CREATE INDEX "refunds_sourceExpenseId_idx" ON "refunds"("sourceExpenseId");
CREATE INDEX "refunds_sourcePaymentId_idx" ON "refunds"("sourcePaymentId");
CREATE INDEX "route_stops_placeId_idx" ON "route_stops"("placeId");
CREATE INDEX "route_stops_bookingId_idx" ON "route_stops"("bookingId");
CREATE INDEX "route_stops_plannedActivityId_idx" ON "route_stops"("plannedActivityId");
CREATE INDEX "transport_quotes_tripId_idx" ON "transport_quotes"("tripId");
CREATE INDEX "transport_quotes_transportBookingId_idx" ON "transport_quotes"("transportBookingId");
CREATE INDEX "trip_cities_tripId_idx" ON "trip_cities"("tripId");
CREATE INDEX "trip_companions_tripId_idx" ON "trip_companions"("tripId");
CREATE INDEX "trip_countries_tripId_idx" ON "trip_countries"("tripId");
CREATE INDEX "trip_date_change_logs_tripId_idx" ON "trip_date_change_logs"("tripId");
CREATE INDEX "trip_share_links_tripId_idx" ON "trip_share_links"("tripId");
CREATE INDEX "wallet_transactions_relatedPaymentId_idx" ON "wallet_transactions"("relatedPaymentId");
CREATE INDEX "wallet_transactions_relatedExchangeId_idx" ON "wallet_transactions"("relatedExchangeId");
CREATE INDEX "wallet_transactions_relatedDepositId_idx" ON "wallet_transactions"("relatedDepositId");
