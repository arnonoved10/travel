"use server";

import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { createChecklistItemInputSchema } from "@travel-app/shared-types";
import { getChecklistItemRepository, getTripRepository } from "@travel-app/data-layer";
import { getCurrentUser } from "@/lib/auth/get-current-user";
import { logger } from "@/lib/logger";

export interface ChecklistFormState {
  fieldErrors?: Record<string, string[]>;
  formError?: string;
}

async function assertTripOwnership(userId: string, tripId: string): Promise<void> {
  const tripRepository = await getTripRepository();
  const trip = await tripRepository.getById({ userId, tripId });
  if (!trip) throw new Error("trip not found or not owned by user");
}

function readOptionalString(formData: FormData, key: string): string | undefined {
  const value = formData.get(key);
  if (typeof value !== "string" || value.trim() === "") return undefined;
  return value;
}

export async function createChecklistItemAction(
  tripId: string,
  listType: "packing" | "before_trip",
  _prevState: ChecklistFormState,
  formData: FormData,
): Promise<ChecklistFormState> {
  const user = await getCurrentUser();
  if (!user) redirect("/login");

  try {
    await assertTripOwnership(user.id, tripId);
  } catch {
    return { formError: "הטיול לא נמצא או שאין לך הרשאה אליו." };
  }

  const quantityRaw = readOptionalString(formData, "quantity");
  const parsed = createChecklistItemInputSchema.safeParse({
    tripId,
    listType,
    name: formData.get("name"),
    category: readOptionalString(formData, "category"),
    quantity: quantityRaw ? Number(quantityRaw) : undefined,
  });

  if (!parsed.success) {
    return { fieldErrors: parsed.error.flatten().fieldErrors };
  }

  const checklistItemRepository = await getChecklistItemRepository();
  const item = await checklistItemRepository.create({ input: parsed.data });
  logger.info("checklist item created", { itemId: item.id, tripId, listType });

  revalidatePath(`/trips/${tripId}/packing`);
  return {};
}

export async function addSuggestedChecklistItemAction(tripId: string, listType: "packing" | "before_trip", name: string): Promise<void> {
  const user = await getCurrentUser();
  if (!user) redirect("/login");
  await assertTripOwnership(user.id, tripId);

  const parsed = createChecklistItemInputSchema.safeParse({ tripId, listType, name });
  if (!parsed.success) return;

  const checklistItemRepository = await getChecklistItemRepository();
  const item = await checklistItemRepository.create({ input: parsed.data });
  logger.info("suggested checklist item added", { itemId: item.id, tripId, listType, name });

  revalidatePath(`/trips/${tripId}/packing`);
}

export async function toggleChecklistItemAction(tripId: string, itemId: string): Promise<void> {
  const user = await getCurrentUser();
  if (!user) redirect("/login");
  await assertTripOwnership(user.id, tripId);

  const checklistItemRepository = await getChecklistItemRepository();
  await checklistItemRepository.toggleDone({ itemId });
  logger.info("checklist item toggled", { itemId, tripId });

  revalidatePath(`/trips/${tripId}/packing`);
}

export async function deleteChecklistItemAction(tripId: string, itemId: string): Promise<void> {
  const user = await getCurrentUser();
  if (!user) redirect("/login");
  await assertTripOwnership(user.id, tripId);

  const checklistItemRepository = await getChecklistItemRepository();
  await checklistItemRepository.softDelete({ itemId });
  logger.info("checklist item deleted", { itemId, tripId });

  revalidatePath(`/trips/${tripId}/packing`);
}
