"use server";

import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { createLoyaltyProgramInputSchema } from "@travel-app/shared-types";
import { getLoyaltyProgramRepository } from "@travel-app/data-layer";
import { getCurrentUser } from "@/lib/auth/get-current-user";
import { logger } from "@/lib/logger";

export interface LoyaltyProgramFormState {
  fieldErrors?: Record<string, string[]>;
}

function readOptionalString(formData: FormData, key: string): string | undefined {
  const value = formData.get(key);
  if (typeof value !== "string" || value.trim() === "") return undefined;
  return value;
}

export async function createLoyaltyProgramAction(
  _prevState: LoyaltyProgramFormState,
  formData: FormData,
): Promise<LoyaltyProgramFormState> {
  const user = await getCurrentUser();
  if (!user) redirect("/login");

  const currentBalanceRaw = readOptionalString(formData, "currentBalance");
  const parsed = createLoyaltyProgramInputSchema.safeParse({
    programName: formData.get("programName"),
    programType: readOptionalString(formData, "programType"),
    memberNumber: readOptionalString(formData, "memberNumber"),
    currentBalance: currentBalanceRaw ? Number(currentBalanceRaw) : undefined,
    tierStatus: readOptionalString(formData, "tierStatus"),
    notes: readOptionalString(formData, "notes"),
  });

  if (!parsed.success) {
    return { fieldErrors: parsed.error.flatten().fieldErrors };
  }

  const loyaltyProgramRepository = await getLoyaltyProgramRepository();
  const program = await loyaltyProgramRepository.create({ userId: user.id, input: parsed.data });
  logger.info("loyalty program created", { loyaltyProgramId: program.id });

  revalidatePath("/contacts");
  redirect("/contacts?tab=loyalty-programs");
}

export async function softDeleteLoyaltyProgramAction(loyaltyProgramId: string): Promise<void> {
  const user = await getCurrentUser();
  if (!user) redirect("/login");

  const loyaltyProgramRepository = await getLoyaltyProgramRepository();
  await loyaltyProgramRepository.softDelete({ userId: user.id, loyaltyProgramId });
  logger.info("loyalty program soft-deleted", { loyaltyProgramId });

  revalidatePath("/contacts");
}

export async function restoreLoyaltyProgramAction(loyaltyProgramId: string): Promise<void> {
  const user = await getCurrentUser();
  if (!user) redirect("/login");

  const loyaltyProgramRepository = await getLoyaltyProgramRepository();
  await loyaltyProgramRepository.restore({ userId: user.id, loyaltyProgramId });
  logger.info("loyalty program restored", { loyaltyProgramId });

  revalidatePath("/contacts");
}
