import { redirect } from "next/navigation";
import { getCurrentUser } from "@/lib/auth/get-current-user";
import { PaymentCardCreateForm } from "../payment-card-create-form";

export default async function NewPaymentCardPage() {
  const user = await getCurrentUser();
  if (!user) redirect("/login");

  return (
    <div>
      <h1 style={{ marginTop: 0 }}>כרטיס חדש</h1>
      <PaymentCardCreateForm />
    </div>
  );
}
