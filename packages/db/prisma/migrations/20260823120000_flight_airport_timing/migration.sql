-- Flight.airportArrivalLeadMinutes/travelTimeToAirportMinutes — נשמרים רק
-- כשהמשתמש מזין אותם בפועל ב-AirportTimingCalculator (עמוד הטיול), כדי
-- שההתראה "זמן לצאת לשדה" (need_to_leave_for_airport) תוכל להתבסס על ערך
-- שנשמר בפועל, לא state זמני בצד-לקוח שנעלם ברענון-דף.
ALTER TABLE "flights" ADD COLUMN "airportArrivalLeadMinutes" INTEGER;
ALTER TABLE "flights" ADD COLUMN "travelTimeToAirportMinutes" INTEGER;
