"use server";

import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { createPaymentCardInputSchema } from "@travel-app/shared-types";
import { getPaymentCardRepository } from "@travel-app/data-layer";
import { getCurrentUser } from "@/lib/auth/get-current-user";
import { logger } from "@/lib/logger";

export interface PaymentCardFormState {
  fieldErrors?: Record<string, string[]>;
}

function readOptionalString(formData: FormData, key: string): string | undefined {
  const value = formData.get(key);
  if (typeof value !== "string" || value.trim() === "") return undefined;
  return value;
}

export async function createPaymentCardAction(_prevState: PaymentCardFormState, formData: FormData): Promise<PaymentCardFormState> {
  const user = await getCurrentUser();
  if (!user) redirect("/login");

  const parsed = createPaymentCardInputSchema.safeParse({
    cardName: formData.get("cardName"),
    defaultCurrencyCode: readOptionalString(formData, "defaultCurrencyCode"),
  });

  if (!parsed.success) {
    return { fieldErrors: parsed.error.flatten().fieldErrors };
  }

  const paymentCardRepository = await getPaymentCardRepository();
  const card = await paymentCardRepository.create({ userId: user.id, input: parsed.data });
  logger.info("payment card created", { cardId: card.id });

  revalidatePath("/contacts");
  redirect("/contacts?tab=payment-cards");
}
