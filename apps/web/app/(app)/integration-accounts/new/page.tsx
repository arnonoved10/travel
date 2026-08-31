import { redirect } from "next/navigation";
import { getCurrentUser } from "@/lib/auth/get-current-user";
import { IntegrationAccountCreateForm } from "../integration-account-create-form";

export default async function NewIntegrationAccountPage() {
  const user = await getCurrentUser();
  if (!user) redirect("/login");

  return (
    <div>
      <h1 style={{ marginTop: 0 }}>חשבון חיצוני חדש</h1>
      <IntegrationAccountCreateForm />
    </div>
  );
}
