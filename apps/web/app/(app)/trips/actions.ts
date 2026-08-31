"use server";

import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { createTripInputSchema, createWalletInputSchema, updateTripInputSchema } from "@travel-app/shared-types";
import { getAuditLogRepository, getFinanceRepository, getTripRepository } from "@travel-app/data-layer";
import { getCurrentUser } from "@/lib/auth/get-current-user";
import { logger } from "@/lib/logger";
import { MAX_OPENING_CURRENCY_SLOTS } from "@/lib/opening-balance-constants";

export interface TripFormState {
  fieldErrors?: Record<string, string[]>;
  formError?: string;
}

function readOptionalString(formData: FormData, key: string): string | undefined {
  const value = formData.get(key);
  if (typeof value !== "string" || value.trim() === "") return undefined;
  return value;
}

export async function createTripAction(_prevState: TripFormState, formData: FormData): Promise<TripFormState> {
  const user = await getCurrentUser();
  if (!user) redirect("/login");

  const parsed = createTripInputSchema.safeParse({
    name: formData.get("name"),
    startDate: formData.get("startDate"),
    endDate: formData.get("endDate"),
    baseCurrencyCode: readOptionalString(formData, "baseCurrencyCode"),
    primaryTimezone: readOptionalString(formData, "primaryTimezone"),
    tripType: readOptionalString(formData, "tripType"),
    notes: readOptionalString(formData, "notes"),
  });

  if (!parsed.success) {
    return { fieldErrors: parsed.error.flatten().fieldErrors };
  }

  const tripRepository = await getTripRepository();
  const trip = await tripRepository.create({ userId: user.id, input: parsed.data });
  logger.info("trip created", { tripId: trip.id });

  const financeRepository = await getFinanceRepository();
  for (let i = 1; i <= MAX_OPENING_CURRENCY_SLOTS; i++) {
    const currencyCode = readOptionalString(formData, `openingCurrency${i}`)?.toUpperCase();
    const amountRaw = readOptionalString(formData, `openingAmount${i}`);
    if (!currencyCode || !amountRaw) continue;
    const initialAmount = Number(amountRaw);
    if (!Number.isFinite(initialAmount) || initialAmount <= 0) continue;

    const openingWallet = createWalletInputSchema.safeParse({ tripId: trip.id, currencyCode, initialAmount });
    if (!openingWallet.success) continue;
    await financeRepository.topUpWallet({ input: openingWallet.data });
    logger.info("opening wallet balance set", { tripId: trip.id, currencyCode, initialAmount });
  }

  revalidatePath("/trips");
  revalidatePath("/dashboard");
  redirect(`/trips/${trip.id}`);
}

export async function updateTripAction(
  tripId: string,
  _prevState: TripFormState,
  formData: FormData,
): Promise<TripFormState> {
  const user = await getCurrentUser();
  if (!user) redirect("/login");

  const parsed = updateTripInputSchema.safeParse({
    name: formData.get("name"),
    status: formData.get("status") || undefined,
    startDate: formData.get("startDate"),
    endDate: formData.get("endDate"),
    baseCurrencyCode: readOptionalString(formData, "baseCurrencyCode") ?? null,
    primaryTimezone: readOptionalString(formData, "primaryTimezone") ?? null,
    tripType: readOptionalString(formData, "tripType") ?? null,
    notes: readOptionalString(formData, "notes") ?? null,
    medicalNotes: readOptionalString(formData, "medicalNotes") ?? null,
    passportExpiryDate: readOptionalString(formData, "passportExpiryDate") ?? null,
    internationalDrivingPermitExpiryDate: readOptionalString(formData, "internationalDrivingPermitExpiryDate") ?? null,
    israeliDrivingLicenseExpiryDate: readOptionalString(formData, "israeliDrivingLicenseExpiryDate") ?? null,
    visaRequirementsChecked: formData.get("visaRequirementsChecked") === "on",
  });

  if (!parsed.success) {
    return { fieldErrors: parsed.error.flatten().fieldErrors };
  }

  const tripRepository = await getTripRepository();
  const before = await tripRepository.getById({ userId: user.id, tripId });
  try {
    await tripRepository.update({ userId: user.id, tripId, input: parsed.data });
  } catch (error) {
    logger.error("trip update failed", { tripId, message: error instanceof Error ? error.message : String(error) });
    return { formError: "עדכון הטיול נכשל — ייתכן שהוא נמחק או שאין לך הרשאה." };
  }

  if (before) {
    const auditLogRepository = await getAuditLogRepository();
    const fields = ["name", "status", "startDate", "endDate", "baseCurrencyCode", "primaryTimezone", "notes"] as const;
    for (const field of fields) {
      const newValue = parsed.data[field];
      if (newValue === undefined) continue;
      const oldValue = before[field];
      if (String(oldValue ?? "") === String(newValue ?? "")) continue;
      await auditLogRepository.record({
        input: {
          userId: user.id,
          entityType: "trip",
          entityId: tripId,
          fieldName: field,
          oldValue: oldValue === null || oldValue === undefined ? undefined : String(oldValue),
          newValue: newValue === null ? undefined : String(newValue),
          action: field === "status" ? "status_change" : "update",
        },
      });
    }
  }

  logger.info("trip updated", { tripId });
  revalidatePath("/trips");
  revalidatePath(`/trips/${tripId}`);
  revalidatePath("/dashboard");
  return {};
}

export async function updateTripBudgetAction(
  tripId: string,
  _prevState: TripFormState,
  formData: FormData,
): Promise<TripFormState> {
  const user = await getCurrentUser();
  if (!user) redirect("/login");

  const parsed = updateTripInputSchema.safeParse({
    totalBudgetAmount: readOptionalString(formData, "totalBudgetAmount") ? Number(formData.get("totalBudgetAmount")) : null,
    dailyBudgetAmount: readOptionalString(formData, "dailyBudgetAmount") ? Number(formData.get("dailyBudgetAmount")) : null,
  });

  if (!parsed.success) {
    return { fieldErrors: parsed.error.flatten().fieldErrors };
  }

  const tripRepository = await getTripRepository();
  try {
    await tripRepository.update({ userId: user.id, tripId, input: parsed.data });
  } catch (error) {
    logger.error("trip budget update failed", { tripId, message: error instanceof Error ? error.message : String(error) });
    return { formError: "עדכון התקציב נכשל — ייתכן שהטיול נמחק או שאין לך הרשאה." };
  }

  logger.info("trip budget updated", { tripId });
  revalidatePath(`/trips/${tripId}`);
  return {};
}

export async function softDeleteTripAction(tripId: string): Promise<void> {
  const user = await getCurrentUser();
  if (!user) redirect("/login");

  const tripRepository = await getTripRepository();
  await tripRepository.softDelete({ userId: user.id, tripId });
  logger.info("trip soft-deleted", { tripId });

  revalidatePath("/trips");
  revalidatePath("/dashboard");
  redirect("/trips");
}

export async function restoreTripAction(tripId: string): Promise<void> {
  const user = await getCurrentUser();
  if (!user) redirect("/login");

  const tripRepository = await getTripRepository();
  await tripRepository.restore({ userId: user.id, tripId });
  logger.info("trip restored", { tripId });

  revalidatePath("/trips");
  revalidatePath("/dashboard");
}
