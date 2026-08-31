"use server";

import { redirect } from "next/navigation";
import { getUserRepository } from "@travel-app/data-layer";
import { getCurrentUser } from "@/lib/auth/get-current-user";

export async function completeOnboardingAction(): Promise<void> {
  const user = await getCurrentUser();
  if (!user) redirect("/login");

  const userRepository = await getUserRepository();
  await userRepository.markOnboardingCompleted({ userId: user.id });
  redirect("/dashboard");
}
