"use server";

import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { createTripCityInputSchema, createTripCountryInputSchema } from "@travel-app/shared-types";
import { getTripGeographyRepository, getTripRepository } from "@travel-app/data-layer";
import { getCurrentUser } from "@/lib/auth/get-current-user";
import { logger } from "@/lib/logger";

export interface GeographyFormState {
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

export async function addTripCountryAction(
  tripId: string,
  _prevState: GeographyFormState,
  formData: FormData,
): Promise<GeographyFormState> {
  const user = await getCurrentUser();
  if (!user) redirect("/login");

  try {
    await assertTripOwnership(user.id, tripId);
  } catch {
    return { formError: "הטיול לא נמצא או שאין לך הרשאה אליו." };
  }

  const parsed = createTripCountryInputSchema.safeParse({ tripId, countryName: formData.get("countryName") });
  if (!parsed.success) {
    return { fieldErrors: parsed.error.flatten().fieldErrors };
  }

  const tripGeographyRepository = await getTripGeographyRepository();
  const country = await tripGeographyRepository.addCountry({ input: parsed.data });
  logger.info("trip country added", { countryId: country.id, tripId });

  revalidatePath(`/trips/${tripId}`);
  revalidatePath(`/trips/${tripId}/report`);
  return {};
}

export async function addTripCityAction(
  tripId: string,
  _prevState: GeographyFormState,
  formData: FormData,
): Promise<GeographyFormState> {
  const user = await getCurrentUser();
  if (!user) redirect("/login");

  try {
    await assertTripOwnership(user.id, tripId);
  } catch {
    return { formError: "הטיול לא נמצא או שאין לך הרשאה אליו." };
  }

  const parsed = createTripCityInputSchema.safeParse({
    tripId,
    cityName: formData.get("cityName"),
    countryId: readOptionalString(formData, "countryId"),
  });
  if (!parsed.success) {
    return { fieldErrors: parsed.error.flatten().fieldErrors };
  }

  const tripGeographyRepository = await getTripGeographyRepository();
  const city = await tripGeographyRepository.addCity({ input: parsed.data });
  logger.info("trip city added", { cityId: city.id, tripId });

  revalidatePath(`/trips/${tripId}`);
  revalidatePath(`/trips/${tripId}/report`);
  return {};
}

export async function deleteTripCountryAction(tripId: string, countryId: string): Promise<void> {
  const user = await getCurrentUser();
  if (!user) redirect("/login");
  await assertTripOwnership(user.id, tripId);

  const tripGeographyRepository = await getTripGeographyRepository();
  await tripGeographyRepository.deleteCountry({ countryId });
  logger.info("trip country deleted", { countryId, tripId });

  revalidatePath(`/trips/${tripId}`);
  revalidatePath(`/trips/${tripId}/report`);
}

export async function deleteTripCityAction(tripId: string, cityId: string): Promise<void> {
  const user = await getCurrentUser();
  if (!user) redirect("/login");
  await assertTripOwnership(user.id, tripId);

  const tripGeographyRepository = await getTripGeographyRepository();
  await tripGeographyRepository.deleteCity({ cityId });
  logger.info("trip city deleted", { cityId, tripId });

  revalidatePath(`/trips/${tripId}`);
  revalidatePath(`/trips/${tripId}/report`);
}
