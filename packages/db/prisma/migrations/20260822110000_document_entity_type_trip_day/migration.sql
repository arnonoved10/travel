-- הוספת "trip_day" ל-enum DocumentEntityType הקיים — מאפשר תמונות מקושרות
-- ליום ספציפי בטיול (TripDay.id כ-entityId), ליד יומן-הטקסט הקיים
-- (TripDay.notes) בעמוד היום.
ALTER TYPE "DocumentEntityType" ADD VALUE 'trip_day';
