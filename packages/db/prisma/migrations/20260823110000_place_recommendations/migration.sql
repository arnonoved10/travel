-- Cache של תוצאות Google Places (ר' schema.prisma) — נמחק ונוצר מחדש בכל
-- "רענון המלצות", לא upsert. בעלות דרך public.is_trip_owner הקיים (ישירות
-- לפי tripId, כמו companion_polls).

-- CreateTable
CREATE TABLE "place_recommendations" (
    "id" TEXT NOT NULL,
    "tripId" TEXT NOT NULL,
    "scopeLabel" TEXT NOT NULL,
    "category" TEXT,
    "name" TEXT NOT NULL,
    "address" TEXT,
    "rating" DECIMAL(2,1),
    "userRatingsTotal" INTEGER,
    "mapsUrl" TEXT NOT NULL,
    "photoUrl" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "place_recommendations_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "place_recommendations_tripId_idx" ON "place_recommendations"("tripId");

-- AddForeignKey
ALTER TABLE "place_recommendations" ADD CONSTRAINT "place_recommendations_tripId_fkey" FOREIGN KEY ("tripId") REFERENCES "trips"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- RLS
ALTER TABLE "place_recommendations" ENABLE ROW LEVEL SECURITY;
CREATE POLICY "place_recommendations_all_own" ON "place_recommendations" FOR ALL
  USING (public.is_trip_owner("tripId"))
  WITH CHECK (public.is_trip_owner("tripId"));
