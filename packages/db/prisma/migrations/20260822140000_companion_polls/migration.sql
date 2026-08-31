-- הצבעות בין המלווים (proxy voting — ר' schema.prisma). unique([pollId,
-- companionId]) על companion_poll_votes אוכף "הצבעה אחת פר-מלווה-פר-סקר".

-- CreateTable
CREATE TABLE "companion_polls" (
    "id" TEXT NOT NULL,
    "tripId" TEXT NOT NULL,
    "question" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "companion_polls_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "companion_poll_options" (
    "id" TEXT NOT NULL,
    "pollId" TEXT NOT NULL,
    "text" TEXT NOT NULL,
    "orderIndex" INTEGER NOT NULL DEFAULT 0,

    CONSTRAINT "companion_poll_options_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "companion_poll_votes" (
    "id" TEXT NOT NULL,
    "pollId" TEXT NOT NULL,
    "optionId" TEXT NOT NULL,
    "companionId" TEXT NOT NULL,

    CONSTRAINT "companion_poll_votes_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "companion_poll_votes_pollId_companionId_key" ON "companion_poll_votes"("pollId", "companionId");

-- AddForeignKey
ALTER TABLE "companion_polls" ADD CONSTRAINT "companion_polls_tripId_fkey" FOREIGN KEY ("tripId") REFERENCES "trips"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "companion_poll_options" ADD CONSTRAINT "companion_poll_options_pollId_fkey" FOREIGN KEY ("pollId") REFERENCES "companion_polls"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "companion_poll_votes" ADD CONSTRAINT "companion_poll_votes_pollId_fkey" FOREIGN KEY ("pollId") REFERENCES "companion_polls"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "companion_poll_votes" ADD CONSTRAINT "companion_poll_votes_optionId_fkey" FOREIGN KEY ("optionId") REFERENCES "companion_poll_options"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "companion_poll_votes" ADD CONSTRAINT "companion_poll_votes_companionId_fkey" FOREIGN KEY ("companionId") REFERENCES "trip_companions"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- RLS (ר' rls_policies.sql, סעיף 5 ל-companion_polls, סעיף 8c ל-options/votes)
ALTER TABLE "companion_polls" ENABLE ROW LEVEL SECURITY;
CREATE POLICY "companion_polls_all_own" ON "companion_polls" FOR ALL
  USING (public.is_trip_owner("tripId"))
  WITH CHECK (public.is_trip_owner("tripId"));

CREATE OR REPLACE FUNCTION public.is_companion_poll_owner(p_poll_id text)
RETURNS boolean LANGUAGE sql SECURITY DEFINER STABLE AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.companion_polls p WHERE p.id = p_poll_id AND public.is_trip_owner(p."tripId")
  );
$$;

ALTER TABLE "companion_poll_options" ENABLE ROW LEVEL SECURITY;
CREATE POLICY "companion_poll_options_all_own" ON "companion_poll_options" FOR ALL
  USING (public.is_companion_poll_owner("pollId"))
  WITH CHECK (public.is_companion_poll_owner("pollId"));

ALTER TABLE "companion_poll_votes" ENABLE ROW LEVEL SECURITY;
CREATE POLICY "companion_poll_votes_all_own" ON "companion_poll_votes" FOR ALL
  USING (public.is_companion_poll_owner("pollId"))
  WITH CHECK (public.is_companion_poll_owner("pollId"));
