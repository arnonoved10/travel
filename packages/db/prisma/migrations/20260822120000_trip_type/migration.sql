-- Trip.tripType (nullable, בלי ברירת מחדל — טיולים קיימים נשארים null) —
-- מזין הצעות-אריזה לפי-סוג-טיול (ר' packing-trip-type-suggestions.ts).

-- CreateEnum
CREATE TYPE "TripType" AS ENUM ('beach', 'ski', 'city', 'nature', 'business', 'road_trip', 'other');

-- AlterTable
ALTER TABLE "trips" ADD COLUMN "tripType" "TripType";
