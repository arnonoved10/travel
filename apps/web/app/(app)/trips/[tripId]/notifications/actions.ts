"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { upsertNotificationPreferenceInputSchema } from "@travel-app/shared-types";
import { getNotificationPreferenceRepository, getTripRepository } from "@travel-app/data-layer";
import { getCurrentUser } from "@/lib/auth/get-current-user";
import { logger } from "@/lib/logger";

export async function upsertNotificationPreferenceAction(tripId: string, formData: FormData): Promise<void> {
  const user = await getCurrentUser();
  if (!user) redirect("/login");

  const tripRepository = await getTripRepository();
  const trip = await tripRepository.getById({ userId: user.id, tripId });
  if (!trip) throw new Error("trip not found or not owned by user");

  const leadTimeRaw = formData.get("leadTimeMinutes");
  const parsed = upsertNotificationPreferenceInputSchema.safeParse({
    tripId,
    eventType: formData.get("eventType"),
    leadTimeMinutes: typeof leadTimeRaw === "string" && leadTimeRaw !== "" ? Number(leadTimeRaw) : null,
    isEnabled: formData.get("isEnabled") === "on",
  });
  if (!parsed.success) return;

  const notificationPreferenceRepository = await getNotificationPreferenceRepository();
  await notificationPreferenceRepository.upsert({ input: parsed.data });
  logger.info("notification preference updated", { tripId, eventType: parsed.data.eventType, isEnabled: parsed.data.isEnabled });

  revalidatePath(`/trips/${tripId}`);
}
