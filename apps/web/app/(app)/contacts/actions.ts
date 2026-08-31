"use server";

import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { createContactInputSchema } from "@travel-app/shared-types";
import { getContactRepository } from "@travel-app/data-layer";
import { getCurrentUser } from "@/lib/auth/get-current-user";
import { logger } from "@/lib/logger";

export interface ContactFormState {
  fieldErrors?: Record<string, string[]>;
}

function readOptionalString(formData: FormData, key: string): string | undefined {
  const value = formData.get(key);
  if (typeof value !== "string" || value.trim() === "") return undefined;
  return value;
}

export async function createContactAction(_prevState: ContactFormState, formData: FormData): Promise<ContactFormState> {
  const user = await getCurrentUser();
  if (!user) redirect("/login");

  const parsed = createContactInputSchema.safeParse({
    tripId: readOptionalString(formData, "tripId"),
    name: formData.get("name"),
    company: readOptionalString(formData, "company"),
    role: readOptionalString(formData, "role"),
    phone: readOptionalString(formData, "phone"),
    whatsapp: readOptionalString(formData, "whatsapp"),
    email: readOptionalString(formData, "email"),
    website: readOptionalString(formData, "website"),
    category: readOptionalString(formData, "category"),
    notes: readOptionalString(formData, "notes"),
  });

  if (!parsed.success) {
    return { fieldErrors: parsed.error.flatten().fieldErrors };
  }

  const contactRepository = await getContactRepository();
  const contact = await contactRepository.create({ userId: user.id, input: parsed.data });
  logger.info("contact created", { contactId: contact.id });

  revalidatePath("/contacts");
  redirect("/contacts");
}

export async function softDeleteContactAction(contactId: string): Promise<void> {
  const user = await getCurrentUser();
  if (!user) redirect("/login");

  const contactRepository = await getContactRepository();
  await contactRepository.softDelete({ userId: user.id, contactId });
  logger.info("contact soft-deleted", { contactId });

  revalidatePath("/contacts");
}
