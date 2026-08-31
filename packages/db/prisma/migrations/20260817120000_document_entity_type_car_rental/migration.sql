-- CarRental היה סוג-הזמנה יחיד (מתוך 5) בלי תמיכה במסמכים — התגלה שאין
-- ערך "car_rental" ב-DocumentEntityType בכלל, בניגוד לארבעת הסוגים האחיים
-- (hotel_stay/flight/transport_booking/insurance) שכולם נתמכים.
ALTER TYPE "DocumentEntityType" ADD VALUE 'car_rental';
