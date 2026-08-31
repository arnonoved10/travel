import { z } from "zod";

// קישור-שיתוף ציבורי קריאה-בלבד למסלול הטיול (חלק H) — ר' ההערה המקבילה
// ב-schema.prisma. "חי" = לו"ז מתעדכן, לא מיקום-GPS.
export const tripShareLinkSchema = z.object({
  id: z.uuid(),
  tripId: z.uuid(),
  token: z.string().min(1),
  createdAt: z.iso.datetime(),
  revokedAt: z.iso.datetime().nullable(),
});
export type TripShareLink = z.infer<typeof tripShareLinkSchema>;
