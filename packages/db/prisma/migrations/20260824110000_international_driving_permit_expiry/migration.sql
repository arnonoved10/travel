-- Trip.internationalDrivingPermitExpiryDate — אופציונלי, מזין את בדיקת
-- "רישיון-נהיגה-בינלאומי קרוב לפוג" ב-gap-detection.ts (רק כשיש השכרת-רכב בטיול).
ALTER TABLE "trips" ADD COLUMN "internationalDrivingPermitExpiryDate" DATE;
