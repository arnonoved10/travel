-- TripShareLink: קישור-שיתוף ציבורי קריאה-בלבד למסלול הטיול (חלק H).
-- token אקראי-בלתי-ניתן-לניחוש (לא tripId עצמו) — נקודת-הכניסה הציבורית
-- היחידה ב-app/shared/[token]/, מחוץ ל-(app)/, בלי getCurrentUser(). RLS
-- כאן מגן רק על גישת-Supabase-client-ישירה של בעל הטיול (כמו trip_companions
-- וכו') — לא רלוונטי לקריאת ה-Prisma של דף השיתוף עצמו (משתמש בחיבור
-- service-role שפטור מ-RLS ממילא, ר' DECISIONS.md).

-- CreateTable
CREATE TABLE "trip_share_links" (
    "id" TEXT NOT NULL,
    "tripId" TEXT NOT NULL,
    "token" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "revokedAt" TIMESTAMP(3),

    CONSTRAINT "trip_share_links_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "trip_share_links_token_key" ON "trip_share_links"("token");

-- AddForeignKey
ALTER TABLE "trip_share_links" ADD CONSTRAINT "trip_share_links_tripId_fkey" FOREIGN KEY ("tripId") REFERENCES "trips"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- RLS (ר' rls_policies.sql, סעיף 5 — נוסף ל-tables[] הגנרי, is_trip_owner())
ALTER TABLE "trip_share_links" ENABLE ROW LEVEL SECURITY;
CREATE POLICY "trip_share_links_all_own" ON "trip_share_links" FOR ALL
  USING (public.is_trip_owner("tripId"))
  WITH CHECK (public.is_trip_owner("tripId"));
