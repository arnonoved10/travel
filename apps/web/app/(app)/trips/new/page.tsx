import { redirect } from "next/navigation";
import { getCurrentUser } from "@/lib/auth/get-current-user";
import { TripCreateForm } from "../trip-create-form";

export default async function NewTripPage() {
  const user = await getCurrentUser();
  if (!user) redirect("/login");

  return (
    <div>
      <h1 style={{ marginTop: 0 }}>טיול חדש</h1>
      <TripCreateForm />
    </div>
  );
}
