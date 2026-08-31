"use server";

import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { createCompanionPollInputSchema, createTripCompanionInputSchema } from "@travel-app/shared-types";
import { getCompanionPollRepository, getTripCompanionRepository, getTripRepository } from "@travel-app/data-layer";
import { getCurrentUser } from "@/lib/auth/get-current-user";
import { logger } from "@/lib/logger";

export interface TripCompanionFormState {
  fieldErrors?: Record<string, string[]>;
  formError?: string;
}

export interface CompanionPollFormState {
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

export async function createTripCompanionAction(
  tripId: string,
  _prevState: TripCompanionFormState,
  formData: FormData,
): Promise<TripCompanionFormState> {
  const user = await getCurrentUser();
  if (!user) redirect("/login");

  try {
    await assertTripOwnership(user.id, tripId);
  } catch {
    return { formError: "הטיול לא נמצא או שאין לך הרשאה אליו." };
  }

  const parsed = createTripCompanionInputSchema.safeParse({
    tripId,
    displayName: formData.get("displayName"),
    relation: readOptionalString(formData, "relation"),
  });

  if (!parsed.success) {
    return { fieldErrors: parsed.error.flatten().fieldErrors };
  }

  const tripCompanionRepository = await getTripCompanionRepository();
  const companion = await tripCompanionRepository.create({ input: parsed.data });
  logger.info("trip companion created", { companionId: companion.id, tripId });

  revalidatePath(`/trips/${tripId}`);
  return {};
}

export async function deleteTripCompanionAction(tripId: string, companionId: string): Promise<void> {
  const user = await getCurrentUser();
  if (!user) redirect("/login");
  await assertTripOwnership(user.id, tripId);

  const tripCompanionRepository = await getTripCompanionRepository();
  await tripCompanionRepository.softDelete({ companionId });
  logger.info("trip companion deleted", { companionId, tripId });

  revalidatePath(`/trips/${tripId}`);
}

export async function createCompanionPollAction(
  tripId: string,
  _prevState: CompanionPollFormState,
  formData: FormData,
): Promise<CompanionPollFormState> {
  const user = await getCurrentUser();
  if (!user) redirect("/login");

  try {
    await assertTripOwnership(user.id, tripId);
  } catch {
    return { formError: "הטיול לא נמצא או שאין לך הרשאה אליו." };
  }

  const optionTexts = formData
    .getAll("optionText")
    .filter((v): v is string => typeof v === "string" && v.trim() !== "");

  const parsed = createCompanionPollInputSchema.safeParse({
    tripId,
    question: formData.get("question"),
    optionTexts,
  });

  if (!parsed.success) {
    return { fieldErrors: parsed.error.flatten().fieldErrors };
  }

  const companionPollRepository = await getCompanionPollRepository();
  const poll = await companionPollRepository.create({ input: parsed.data });
  logger.info("companion poll created", { pollId: poll.id, tripId });

  revalidatePath(`/trips/${tripId}`);
  return {};
}

export async function recordCompanionVoteAction(tripId: string, pollId: string, companionId: string, formData: FormData): Promise<void> {
  const user = await getCurrentUser();
  if (!user) redirect("/login");
  await assertTripOwnership(user.id, tripId);

  const optionId = formData.get("optionId");
  const companionPollRepository = await getCompanionPollRepository();

  if (typeof optionId !== "string" || optionId === "") {
    await companionPollRepository.removeVote({ pollId, companionId });
  } else {
    await companionPollRepository.recordVote({ pollId, companionId, optionId });
  }
  logger.info("companion poll vote recorded", { pollId, companionId, optionId, tripId });

  revalidatePath(`/trips/${tripId}`);
}

export async function deleteCompanionPollAction(tripId: string, pollId: string): Promise<void> {
  const user = await getCurrentUser();
  if (!user) redirect("/login");
  await assertTripOwnership(user.id, tripId);

  const companionPollRepository = await getCompanionPollRepository();
  await companionPollRepository.deletePoll({ pollId });
  logger.info("companion poll deleted", { pollId, tripId });

  revalidatePath(`/trips/${tripId}`);
}
