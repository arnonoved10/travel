import { redirect } from "next/navigation";
import { getCurrentUser } from "@/lib/auth/get-current-user";
import { LoyaltyProgramCreateForm } from "../loyalty-program-create-form";

export default async function NewLoyaltyProgramPage() {
  const user = await getCurrentUser();
  if (!user) redirect("/login");

  return (
    <div>
      <h1 style={{ marginTop: 0 }}>תוכנית נקודות/מיילים חדשה</h1>
      <LoyaltyProgramCreateForm />
    </div>
  );
}
