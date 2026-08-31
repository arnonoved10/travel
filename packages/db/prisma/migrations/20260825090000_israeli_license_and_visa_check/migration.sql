-- Trip.israeliDrivingLicenseExpiryDate — אופציונלי, אותה רלוונטיות בדיוק כמו
-- internationalDrivingPermitExpiryDate (רק כשיש השכרת-רכב בטיול).
ALTER TABLE "trips" ADD COLUMN "israeliDrivingLicenseExpiryDate" DATE;

-- Trip.visaRequirementsChecked — checkbox שהמשתמש מסמן בעצמו, לא קביעה
-- אוטומטית של המערכת (אין מקור-מידע רשמי אמין לדרישות-ויזה לפי מדינה).
ALTER TABLE "trips" ADD COLUMN "visaRequirementsChecked" BOOLEAN NOT NULL DEFAULT false;
