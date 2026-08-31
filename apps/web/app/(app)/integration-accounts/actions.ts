"use server";

import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { createIntegrationAccountInputSchema } from "@travel-app/shared-types";
import { getIntegrationAccountRepository } from "@travel-app/data-layer";
import { getCurrentUser } from "@/lib/auth/get-current-user";
import { logger } from "@/lib/logger";

export interface IntegrationAccountFormState {
  fieldErrors?: Record<string, string[]>;
}

function readOptionalString(formData: FormData, key: string): string | undefined {
  const value = formData.get(key);
  if (typeof value !== "string" || value.trim() === "") return undefined;
  return value;
}

export async function createIntegrationAccountAction(
  _prevState: IntegrationAccountFormState,
  formData: FormData,
): Promise<IntegrationAccountFormState> {
  const user = await getCurrentUser();
  if (!user) redirect("/login");

  const parsed = createIntegrationAccountInputSchema.safeParse({
    serviceName: formData.get("serviceName"),
    appLink: readOptionalString(formData, "appLink"),
    websiteLink: readOptionalString(formData, "websiteLink"),
    accountLink: readOptionalString(formData, "accountLink"),
    bookingsLink: readOptionalString(formData, "bookingsLink"),
    emailOrUsername: readOptionalString(formData, "emailOrUsername"),
    notes: readOptionalString(formData, "notes"),
  });

  if (!parsed.success) {
    return { fieldErrors: parsed.error.flatten().fieldErrors };
  }

  const integrationAccountRepository = await getIntegrationAccountRepository();
  const account = await integrationAccountRepository.create({ userId: user.id, input: parsed.data });
  logger.info("integration account created", { integrationAccountId: account.id, serviceName: account.serviceName });

  revalidatePath("/contacts");
  redirect("/contacts?tab=integration-accounts");
}

export async function softDeleteIntegrationAccountAction(integrationAccountId: string): Promise<void> {
  const user = await getCurrentUser();
  if (!user) redirect("/login");

  const integrationAccountRepository = await getIntegrationAccountRepository();
  await integrationAccountRepository.softDelete({ userId: user.id, integrationAccountId });
  logger.info("integration account soft-deleted", { integrationAccountId });

  revalidatePath("/contacts");
}

export async function restoreIntegrationAccountAction(integrationAccountId: string): Promise<void> {
  const user = await getCurrentUser();
  if (!user) redirect("/login");

  const integrationAccountRepository = await getIntegrationAccountRepository();
  await integrationAccountRepository.restore({ userId: user.id, integrationAccountId });
  logger.info("integration account restored", { integrationAccountId });

  revalidatePath("/contacts");
}
